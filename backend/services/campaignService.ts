import { Op } from "sequelize";
import db from "../models/index.ts";
import { createRichNotification } from "./notificationService.ts";

type CampaignFilterPayload = {
  city?: string;
  onboardingStatus?: "all" | "completed" | "not_completed";
  platform?: "all" | "ios" | "android";
  role?: "all" | "owner" | "veterinarian" | "shelter" | "admin";
};

const normalizeCity = (value: unknown) => String(value || "").trim();

const buildCampaignAction = (target: any) => {
  const targetType = String(target?.type || "").trim();

  switch (targetType) {
    case "discover":
      return { actionType: "discover", actionPayload: null };
    case "community":
      return { actionType: "community", actionPayload: null };
    case "events":
      return { actionType: "events_list", actionPayload: null };
    case "event":
      return { actionType: "event_detail", actionPayload: target?.eventId ? { eventId: target.eventId } : null };
    case "notifications":
    default:
      return { actionType: "notifications", actionPayload: null };
  }
};

const getAudienceActors = async (filters: CampaignFilterPayload) => {
  const { users: User, vets: Vet, notification_devices: NotificationDevice, notification_preferences: NotificationPreference } = db as any;
  const role = filters.role || "all";
  const city = normalizeCity(filters.city);
  const onboardingStatus = filters.onboardingStatus || "all";
  const platform = filters.platform || "all";
  const userRoles = role === "owner" || role === "shelter" || role === "admin"
    ? [role]
    : ["owner", "shelter", "admin"];

  const userWhere: Record<string, any> = {
    role: userRoles.length === 1 ? userRoles[0] : { [Op.in]: userRoles },
  };
  if (city) userWhere.city = { [Op.iLike]: city };
  if (onboardingStatus === "completed") userWhere.hasCompletedOnboarding = true;
  if (onboardingStatus === "not_completed") userWhere.hasCompletedOnboarding = false;

  const vetWhere: Record<string, any> = {};
  if (city) vetWhere.city = { [Op.iLike]: city };
  if (onboardingStatus === "completed") vetWhere.hasCompletedOnboarding = true;
  if (onboardingStatus === "not_completed") vetWhere.hasCompletedOnboarding = false;

  const [users, vets] = await Promise.all([
    role === "veterinarian" ? [] : User.findAll({ where: userWhere, attributes: ["id", "role"] }),
    role === "owner" || role === "shelter" ? [] : Vet.findAll({ where: vetWhere, attributes: ["id"] }),
  ]);

  let actors = [
    ...(users as any[]).map((item) => ({ actorId: item.id, actorType: "user" as const })),
    ...(vets as any[]).map((item) => ({ actorId: item.id, actorType: "vet" as const })),
  ];

  if (platform !== "all") {
    const devices = await NotificationDevice.findAll({
      where: {
        platform,
        actorId: { [Op.in]: actors.map((actor) => actor.actorId) },
      },
      attributes: ["actorId", "actorType"],
    });
    const allowed = new Set(devices.map((device: any) => `${device.actorType}:${device.actorId}`));
    actors = actors.filter((actor) => allowed.has(`${actor.actorType}:${actor.actorId}`));
  }

  const prefs = await NotificationPreference.findAll({
    where: {
      actorId: { [Op.in]: actors.map((actor) => actor.actorId) },
      actorType: { [Op.in]: actors.map((actor) => actor.actorType) },
      marketingEnabled: false,
    },
    attributes: ["actorId", "actorType"],
  });
  const optedOut = new Set(prefs.map((pref: any) => `${pref.actorType}:${pref.actorId}`));

  return actors.filter((actor) => !optedOut.has(`${actor.actorType}:${actor.actorId}`));
};

const createDeliveriesIfMissing = async (campaign: any) => {
  const { campaign_deliveries: CampaignDelivery } = db as any;
  const existingCount = await CampaignDelivery.count({ where: { campaignId: campaign.id } });
  if (existingCount > 0) {
    return;
  }

  const audience = await getAudienceActors((campaign.filters || {}) as CampaignFilterPayload);
  campaign.targetedCount = audience.length;
  await campaign.save();

  if (audience.length === 0) {
    campaign.status = "sent";
    campaign.completedAt = new Date();
    await campaign.save();
    return;
  }

  await CampaignDelivery.bulkCreate(
    audience.map((actor) => ({
      campaignId: campaign.id,
      actorId: actor.actorId,
      actorType: actor.actorType,
      status: "pending",
    }))
  );
};

export const processCampaignBatch = async (campaignId: string, batchSize = 100) => {
  const { notification_campaigns: NotificationCampaign, campaign_deliveries: CampaignDelivery } = db as any;
  const campaign = await NotificationCampaign.findByPk(campaignId);
  if (!campaign || campaign.status === "cancelled") return;

  await createDeliveriesIfMissing(campaign);

  const deliveries = await CampaignDelivery.findAll({
    where: { campaignId, status: "pending" },
    order: [["createdAt", "ASC"]],
    limit: batchSize,
  });

  if (deliveries.length === 0) {
    const pendingCount = await CampaignDelivery.count({ where: { campaignId, status: "pending" } });
    if (pendingCount === 0 && !campaign.completedAt) {
      campaign.status = campaign.sentCount > 0 || campaign.targetedCount === 0 ? "sent" : "failed";
      campaign.completedAt = new Date();
      await campaign.save();
    }
    return;
  }

  const action = buildCampaignAction(campaign.target);

  for (const delivery of deliveries) {
    try {
      const result = await createRichNotification({
        actorId: delivery.actorId,
        actorType: delivery.actorType,
        type: "campaign",
        category: "campaign",
        title: campaign.title,
        message: campaign.body,
        campaignId: campaign.id,
        actionType: action.actionType,
        actionPayload: action.actionPayload,
        relatedId: campaign.target?.eventId || null,
        relatedType: campaign.target?.type === "event" ? "event" : undefined,
        respectMarketingPreference: true,
      });

      const pushResult = result.push;
      const pushFailed = !pushResult || pushResult.status === "failed";

      if (pushFailed) {
        delivery.status = "failed";
        delivery.error = pushResult?.error || "Push delivery failed";
        delivery.deliveredAt = null;
        campaign.failedCount += 1;
        campaign.lastError = delivery.error;
      } else {
        delivery.status = "sent";
        delivery.deliveredAt = new Date();
        delivery.error = pushResult.error;
        campaign.sentCount += 1;
      }
    } catch (error: unknown) {
      delivery.status = "failed";
      delivery.error = error instanceof Error && error.message ? error.message : "Delivery failed";
      delivery.deliveredAt = null;
      campaign.failedCount += 1;
      campaign.lastError = delivery.error;
    }

    await delivery.save();
  }

  await campaign.save();
};

export const publishCampaign = async (campaignId: string, mode: "now" | "schedule", scheduledFor?: string | null) => {
  const { notification_campaigns: NotificationCampaign } = db as any;
  const campaign = await NotificationCampaign.findByPk(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  campaign.publishMode = mode;
  campaign.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  campaign.startedAt = null;
  campaign.completedAt = null;
  campaign.sentCount = 0;
  campaign.failedCount = 0;
  campaign.targetedCount = 0;
  campaign.lastError = null;
  campaign.status = mode === "schedule" ? "scheduled" : "sending";
  if (mode === "now") {
    campaign.startedAt = new Date();
  }
  await campaign.save();

  if (mode === "now") {
    await processCampaignBatch(campaign.id);
  }

  return campaign;
};

export const cancelCampaign = async (campaignId: string) => {
  const { notification_campaigns: NotificationCampaign } = db as any;
  const campaign = await NotificationCampaign.findByPk(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  campaign.status = "cancelled";
  campaign.completedAt = new Date();
  await campaign.save();
  return campaign;
};

let workerTimer: ReturnType<typeof setInterval> | null = null;

export const startCampaignWorker = () => {
  if (workerTimer) return;

  workerTimer = setInterval(async () => {
    try {
      const { notification_campaigns: NotificationCampaign } = db as any;
      const now = new Date();
      const campaigns = await NotificationCampaign.findAll({
        where: {
          status: { [Op.in]: ["scheduled", "sending"] },
        },
        order: [["updatedAt", "ASC"]],
      });

      for (const campaign of campaigns) {
        if (campaign.status === "scheduled") {
          if (!campaign.scheduledFor || new Date(campaign.scheduledFor) <= now) {
            campaign.status = "sending";
            campaign.startedAt = new Date();
            await campaign.save();
          } else {
            continue;
          }
        }

        await processCampaignBatch(campaign.id);
      }
    } catch (error) {
      console.error("Campaign worker tick failed:", error);
    }
  }, 10000);
};
