import type { Request, Response } from "express";
import db from "../models/index.ts";
import { cancelCampaign, publishCampaign, processCampaignBatch } from "../services/campaignService.ts";

const sanitizeFilters = (filters: any) => ({
  role: String(filters?.role || "all"),
  city: String(filters?.city || "").trim(),
  platform: String(filters?.platform || "all"),
  onboardingStatus: String(filters?.onboardingStatus || "all"),
});

const sanitizeTarget = (target: any) => {
  const type = String(target?.type || "notifications").trim();
  return {
    type,
    eventId: target?.eventId ? String(target.eventId) : null,
  };
};

// @desc    List campaigns
// @route   GET /api/admin/campaigns
export const getAdminCampaigns = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { notification_campaigns: NotificationCampaign } = db as any;
    const campaigns = await NotificationCampaign.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create campaign
// @route   POST /api/admin/campaigns
export const createAdminCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_campaigns: NotificationCampaign } = db as any;
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();

    if (!title || !body) {
      res.status(400).json({ message: "title and body are required" });
      return;
    }

    const campaign = await NotificationCampaign.create({
      title,
      body,
      categoryLabel: String(req.body?.categoryLabel || "").trim() || null,
      ctaLabel: String(req.body?.ctaLabel || "").trim() || null,
      target: sanitizeTarget(req.body?.target),
      filters: sanitizeFilters(req.body?.filters),
      publishMode: "draft",
      status: "draft",
      createdById: (req as any).user?.id || null,
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update campaign
// @route   PATCH /api/admin/campaigns/:id
export const updateAdminCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notification_campaigns: NotificationCampaign } = db as any;
    const campaign = await NotificationCampaign.findByPk(req.params.id);

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    if (!["draft", "scheduled"].includes(campaign.status)) {
      res.status(400).json({ message: "Only draft or scheduled campaigns can be edited" });
      return;
    }

    if (req.body?.title !== undefined) campaign.title = String(req.body.title || "").trim();
    if (req.body?.body !== undefined) campaign.body = String(req.body.body || "").trim();
    if (req.body?.categoryLabel !== undefined) campaign.categoryLabel = String(req.body.categoryLabel || "").trim() || null;
    if (req.body?.ctaLabel !== undefined) campaign.ctaLabel = String(req.body.ctaLabel || "").trim() || null;
    if (req.body?.target !== undefined) campaign.target = sanitizeTarget(req.body.target);
    if (req.body?.filters !== undefined) campaign.filters = sanitizeFilters(req.body.filters);
    if (req.body?.scheduledFor !== undefined) {
      campaign.scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    }

    await campaign.save();
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publish campaign now or schedule it
// @route   POST /api/admin/campaigns/:id/publish
export const publishAdminCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const mode = req.body?.mode === "schedule" ? "schedule" : "now";
    const campaignId = String(req.params.id || "");
    const campaign = await publishCampaign(campaignId, mode, req.body?.scheduledFor || null);
    if (mode === "now") {
      await processCampaignBatch(campaign.id);
    }
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a scheduled campaign
// @route   POST /api/admin/campaigns/:id/cancel
export const cancelAdminCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaignId = String(req.params.id || "");
    res.json(await cancelCampaign(campaignId));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
