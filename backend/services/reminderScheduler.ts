import { Op } from "sequelize";
import db from "../models/index.ts";
import { createRichNotification } from "./notificationService.ts";

const parseDateTimeUTC = (date: string | null, time: string): Date | null => {
  try {
    // time is stored as "HH:MM" or "HH:MM:SS"
    const timeParts = time.split(":").map(Number);
    if (timeParts.length < 2) return null;
    const [hh, mm] = timeParts;

    const base = date ? new Date(date) : new Date();
    base.setUTCHours(hh, mm, 0, 0);
    return base;
  } catch {
    return null;
  }
};

const getReminderIcon = (type: string): string => {
  switch (type) {
    case "vaccine":     return "💉";
    case "medication":  return "💊";
    case "appointment": return "🏥";
    default:            return "🔔";
  }
};

// Set of scheduled notification keys to prevent duplicate timers
const scheduledKeys = new Set<string>();

const sendNotification = async (reminder: any, alertType: "due" | "2h" | "24h" | "7d") => {
  try {
    const icon = getReminderIcon(reminder.type);
    const petName = reminder.pet?.name ? ` for ${reminder.pet.name}` : "";
    
    let title = "";
    let message = "";

    if (alertType === "due") {
      title = `${icon} ${reminder.title}`;
      message = reminder.notes
        ? String(reminder.notes).slice(0, 100)
        : `Reminder${petName} at ${reminder.time}`;
    } else if (alertType === "2h") {
      title = `⏰ In 2 Hours: ${reminder.title}`;
      message = `Upcoming reminder${petName} in 2 hours at ${reminder.time}.`;
    } else if (alertType === "24h") {
      title = `📅 Tomorrow: ${reminder.title}`;
      message = `Upcoming reminder${petName} tomorrow at ${reminder.time}.`;
    } else if (alertType === "7d") {
      title = `💉 In 7 Days: ${reminder.title}`;
      message = `Vaccine reminder${petName} is due in 7 days.`;
    }

    await createRichNotification({
      actorId: reminder.userId,
      actorType: "user",
      type: "reminder",
      category: "activity",
      title,
      message,
      relatedId: reminder.id,
      relatedType: "reminder",
      actionType: "reminder",
      actionPayload: {
        reminderId: reminder.id,
        petId: reminder.petId || null,
      },
      sendPush: true,
      respectMarketingPreference: false,
    });

    // For the final due notification, mark one-time reminders as done after firing
    if (alertType === "due" && reminder.recurrence === "none") {
      reminder.isDone = true;
      await reminder.save();
    }
  } catch (err: any) {
    console.error(`[ReminderScheduler] Error sending ${alertType} notification for reminder ${reminder.id}:`, err.message);
  }
};

const scheduleNotification = (reminder: any, delayMs: number, alertType: "due" | "2h") => {
  const key = `${alertType}-${reminder.id}-${reminder.date}-${reminder.time}`;
  if (scheduledKeys.has(key)) return;

  scheduledKeys.add(key);
  setTimeout(async () => {
    scheduledKeys.delete(key);
    // Fetch fresh state to ensure it wasn't cancelled/deleted/updated in the meantime
    try {
      const { reminders: Reminder, pets: Pet } = db as any;
      const freshReminder = await Reminder.findByPk(reminder.id, {
        include: [{ model: Pet, as: "pet", attributes: ["id", "name"] }]
      });
      if (freshReminder && !freshReminder.isDone) {
        await sendNotification(freshReminder, alertType);
      }
    } catch (err: any) {
      console.error(`[ReminderScheduler] Timer task check failed for key ${key}:`, err.message);
    }
  }, delayMs);
};

// Hourly scan task
const runHourlyScan = async () => {
  try {
    const { reminders: Reminder, pets: Pet } = db as any;
    const now = new Date();
    const nowTime = now.getTime();

    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(nowTime + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Fetch active reminders for today & tomorrow using indexed range
    const candidates = await Reminder.findAll({
      where: {
        isDone: false,
        [Op.or]: [
          { date: null },
          { date: { [Op.in]: [todayStr, tomorrowStr] } }
        ]
      },
      include: [{ model: Pet, as: "pet", attributes: ["id", "name"] }]
    });

    const oneHourLater = nowTime + 60 * 60 * 1000;
    const twoHoursLater = nowTime + 2 * 60 * 60 * 1000;
    const threeHoursLater = nowTime + 3 * 60 * 60 * 1000;

    console.log(`[ReminderScheduler] Hourly scan running. Found ${candidates.length} active candidates.`);

    for (const reminder of candidates) {
      const dt = parseDateTimeUTC(reminder.date, reminder.time);
      if (!dt) continue;

      const dtTime = dt.getTime();

      // 1. Check if due in next hour (due-now alert)
      if (dtTime >= nowTime && dtTime <= oneHourLater) {
        const delay = dtTime - nowTime;
        scheduleNotification(reminder, delay, "due");
      }

      // 2. Check if due in 2 hours (2h advance alert)
      if (dtTime >= twoHoursLater && dtTime <= threeHoursLater) {
        const delay = (dtTime - 2 * 60 * 60 * 1000) - nowTime;
        if (delay >= 0) {
          scheduleNotification(reminder, delay, "2h");
        }
      }
    }
  } catch (err: any) {
    console.error("[ReminderScheduler] Hourly scan error:", err.message);
  }
};

// Daily scan task
const runDailyScan = async () => {
  try {
    const { reminders: Reminder, pets: Pet } = db as any;
    const now = new Date();
    const nowTime = now.getTime();

    const tomorrowStr = new Date(nowTime + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in7DaysStr = new Date(nowTime + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    console.log(`[ReminderScheduler] Daily scan running. tomorrow: ${tomorrowStr}, in 7 days: ${in7DaysStr}`);

    // 1. Fetch 24-hour advance reminders (due tomorrow)
    const tomorrowReminders = await Reminder.findAll({
      where: { isDone: false, date: tomorrowStr },
      include: [{ model: Pet, as: "pet", attributes: ["id", "name"] }]
    });

    for (const reminder of tomorrowReminders) {
      await sendNotification(reminder, "24h");
    }

    // 2. Fetch 7-day advance reminders (vaccines due in 7 days)
    const vaccineReminders = await Reminder.findAll({
      where: { isDone: false, date: in7DaysStr, type: "vaccine" },
      include: [{ model: Pet, as: "pet", attributes: ["id", "name"] }]
    });

    for (const reminder of vaccineReminders) {
      await sendNotification(reminder, "7d");
    }
  } catch (err: any) {
    console.error("[ReminderScheduler] Daily scan error:", err.message);
  }
};

export const startReminderScheduler = () => {
  console.log("[ReminderScheduler] Started — executing tasks");

  // Run immediately on startup
  runHourlyScan();
  runDailyScan();

  // Schedule tasks
  setInterval(runHourlyScan, 60 * 60 * 1000); // Run hourly
  setInterval(runDailyScan, 24 * 60 * 60 * 1000); // Run daily
};
