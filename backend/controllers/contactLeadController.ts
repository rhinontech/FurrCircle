import type { Request, Response } from "express";
import db from "../models/index.ts";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(["new", "contacted", "closed"]);

const trimString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export const submitContactLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact_leads: ContactLead } = db as any;
    const name = trimString(req.body?.name);
    const email = trimString(req.body?.email).toLowerCase();
    const phone = trimString(req.body?.phone);
    const message = trimString(req.body?.message);
    const source = trimString(req.body?.source) || "website";
    const pagePath = trimString(req.body?.pagePath) || null;

    if (!name || !email || !message) {
      res.status(400).json({ message: "Name, email, and message are required." });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ message: "Please enter a valid email address." });
      return;
    }

    if (name.length > 120 || email.length > 180 || phone.length > 40 || message.length > 5000) {
      res.status(400).json({ message: "One or more fields are too long." });
      return;
    }

    const lead = await ContactLead.create({
      name,
      email,
      phone: phone || null,
      message,
      source,
      pagePath,
      status: "new",
    });

    res.status(201).json({
      id: lead.id,
      message: "Thanks for reaching out. We'll get back to you soon.",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to submit contact request." });
  }
};

export const getAllContactLeads = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { contact_leads: ContactLead } = db as any;
    const leads = await ContactLead.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch contact leads." });
  }
};

export const updateContactLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contact_leads: ContactLead } = db as any;
    const lead = await ContactLead.findByPk(req.params.leadId);

    if (!lead) {
      res.status(404).json({ message: "Contact lead not found." });
      return;
    }

    const nextStatus = trimString(req.body?.status);
    const nextNotes = trimString(req.body?.notes);

    if (nextStatus && !VALID_STATUSES.has(nextStatus)) {
      res.status(400).json({ message: "Invalid lead status." });
      return;
    }

    if (nextStatus) {
      lead.status = nextStatus;
    }

    if (req.body?.notes !== undefined) {
      lead.notes = nextNotes || null;
    }

    await lead.save();
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update contact lead." });
  }
};
