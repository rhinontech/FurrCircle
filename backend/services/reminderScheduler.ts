import { Op } from "sequelize";
import db from "../models/index.ts";
import { createRichNotification } from "./notificationService.ts";

/**
 * Fires once per minute.
 * Finds all reminders whose date+time window falls in [now-1min, now+1min]
 * and have not been marked done, then sends a push + in-app notification.
 */
const TICK_MS = 60_000; // 1 minute

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

export const startReminderScheduler = () => {
  console.log("[ReminderScheduler] Started — polling every 60s");

  setInterval(async () => {
    try {
      const { reminders: Reminder, pets: Pet } = db as any;

      const now = new Date();
      const windowStart = new Date(now.getTime() - TICK_MS);
      const windowEnd   = new Date(now.getTime() + TICK_MS);

      // Pull all non-done reminders that have a date within today ±1 day (rough pre-filter)
      const todayStr = now.toISOString().slice(0, 10);
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow  = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);

      const candidates = await Reminder.findAll({
        where: {
          isDone: false,
          [Op.or]: [
            { date: null },
            {
              date: {
                [Op.between]: [
                  yesterday.toISOString().slice(0, 10),
                  tomorrow.toISOString().slice(0, 10),
                ],
              },
            },
          ],
        },
        include: [{ model: Pet, as: "pet", attributes: ["id", "name"] }],
      });

      const dueReminders = candidates.filter((r: any) => {
        const dt = parseDateTimeUTC(r.date, r.time);
        if (!dt) return false;
        return dt >= windowStart && dt <= windowEnd;
      });

      if (dueReminders.length === 0) return;

      console.log(`[ReminderScheduler] ${dueReminders.length} due reminder(s) at ${now.toISOString()}`);

      for (const reminder of dueReminders) {
        const icon = getReminderIcon(reminder.type);
        const petName = reminder.pet?.name ? ` for ${reminder.pet.name}` : "";
        const title = `${icon} ${reminder.title}`;
        const message = reminder.notes
          ? String(reminder.notes).slice(0, 100)
          : `Reminder${petName} at ${reminder.time}`;

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

        // Mark one-time reminders as done after firing
        if (reminder.recurrence === "none") {
          reminder.isDone = true;
          await reminder.save();
        }
      }
    } catch (err) {
      console.error("[ReminderScheduler] Tick error:", err);
    }
  }, TICK_MS);
};
