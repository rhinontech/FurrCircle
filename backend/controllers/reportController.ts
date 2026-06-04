import type { Response } from "express";
import db from "../models/index.ts";

// @desc    Create a new report
// @route   POST /api/reports
export const createReport = async (req: any, res: Response): Promise<void> => {
  try {
    const { reports: Report, users: User } = db as any;
    const { reportedId, subject, description } = req.body;
    const reporterId = req.user.id;

    if (!reportedId) {
      res.status(400).json({ message: "Reported user ID is required." });
      return;
    }

    if (!subject) {
      res.status(400).json({ message: "Subject of report is required." });
      return;
    }

    // Check if reported user exists
    const reportedUser = await User.findByPk(reportedId);
    if (!reportedUser) {
      res.status(404).json({ message: "Reported user not found." });
      return;
    }

    // Check if report already exists for this reporter and reported user
    const existingReport = await Report.findOne({
      where: { reporterId, reportedId }
    });

    if (existingReport) {
      existingReport.subject = subject;
      existingReport.description = description || null;
      await existingReport.save();

      res.status(200).json({
        message: "Report updated successfully.",
        report: existingReport,
      });
      return;
    }

    const report = await Report.create({
      reporterId,
      reportedId,
      subject,
      description: description || null,
    });

    res.status(201).json({
      message: "Report submitted successfully.",
      report,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
export const getReports = async (req: any, res: Response): Promise<void> => {
  try {
    const { reports: Report, users: User } = db as any;

    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Forbidden: Admin access only." });
      return;
    }

    const allReports = await Report.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email", "username"] },
        { model: User, as: "reported", attributes: ["id", "name", "email", "username"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(allReports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
