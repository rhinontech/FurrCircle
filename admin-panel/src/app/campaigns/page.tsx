"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Eye,
  Loader2,
  Megaphone,
  Pencil,
  Send,
  SquarePen,
  X,
} from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
type PublishMode = "draft" | "now" | "schedule";
type CampaignRole = "all" | "owner" | "veterinarian" | "shelter";
type CampaignPlatform = "all" | "ios" | "android";
type CampaignOnboarding = "all" | "completed" | "not_completed";
type CampaignTargetType = "notifications" | "discover" | "community" | "events" | "event";
type DrawerMode = "create" | "edit" | "view" | null;

type CampaignEvent = {
  id: string;
  title: string;
};

type CampaignRecord = {
  id: string;
  title: string;
  body: string;
  categoryLabel?: string | null;
  status: CampaignStatus;
  publishMode: PublishMode;
  scheduledFor?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  ctaLabel?: string | null;
  target?: {
    type?: CampaignTargetType;
    eventId?: string | null;
  } | null;
  filters?: {
    role?: CampaignRole;
    city?: string;
    platform?: CampaignPlatform;
    onboardingStatus?: CampaignOnboarding;
  } | null;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CampaignForm = {
  title: string;
  body: string;
  categoryLabel: string;
  ctaLabel: string;
  targetType: CampaignTargetType;
  eventId: string;
  role: CampaignRole;
  city: string;
  platform: CampaignPlatform;
  onboardingStatus: CampaignOnboarding;
  scheduledFor: string;
};

const emptyForm: CampaignForm = {
  title: "",
  body: "",
  categoryLabel: "",
  ctaLabel: "",
  targetType: "notifications",
  eventId: "",
  role: "all",
  city: "",
  platform: "all",
  onboardingStatus: "all",
  scheduledFor: "",
};

const ROLE_OPTIONS: Array<{ value: CampaignRole; label: string }> = [
  { value: "all", label: "All audiences" },
  { value: "owner", label: "Pet owners" },
  { value: "veterinarian", label: "Veterinarians" },
  { value: "shelter", label: "Shelters" },
];

const PLATFORM_OPTIONS: Array<{ value: CampaignPlatform; label: string }> = [
  { value: "all", label: "All devices" },
  { value: "ios", label: "iPhone only" },
  { value: "android", label: "Android only" },
];

const ONBOARDING_OPTIONS: Array<{ value: CampaignOnboarding; label: string }> = [
  { value: "all", label: "Any onboarding state" },
  { value: "completed", label: "Onboarded users" },
  { value: "not_completed", label: "Not onboarded yet" },
];

const TARGET_OPTIONS: Array<{ value: CampaignTargetType; label: string }> = [
  { value: "notifications", label: "Notifications inbox" },
  { value: "discover", label: "Discover tab" },
  { value: "community", label: "Community tab" },
  { value: "events", label: "Events list" },
  { value: "event", label: "Specific event" },
];

const statusClasses: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  scheduled: "bg-amber-50 text-amber-700",
  sending: "bg-primary-50 text-primary-700",
  sent: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-600",
  failed: "bg-rose-50 text-rose-700",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const toLocalInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toApiPayload = (form: CampaignForm) => ({
  title: form.title.trim(),
  body: form.body.trim(),
  categoryLabel: form.categoryLabel.trim() || null,
  ctaLabel: form.ctaLabel.trim() || null,
  target: {
    type: form.targetType,
    eventId: form.targetType === "event" && form.eventId ? form.eventId : null,
  },
  filters: {
    role: form.role,
    city: form.city.trim(),
    platform: form.platform,
    onboardingStatus: form.onboardingStatus,
  },
  scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
});

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [publishingMode, setPublishingMode] = useState<PublishMode | null>(null);
  const [actionCampaignId, setActionCampaignId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchCampaigns = useCallback(async () => {
    const data = await adminApi.get<CampaignRecord[]>("/admin/campaigns");
    setCampaigns(data);
  }, []);

  const fetchEvents = useCallback(async () => {
    const data = await adminApi.get<CampaignEvent[]>("/admin/events");
    setEvents(data.map((event) => ({ id: event.id, title: event.title })));
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([fetchCampaigns(), fetchEvents()]);
    } finally {
      setLoading(false);
    }
  }, [fetchCampaigns, fetchEvents]);

  useEffect(() => {
    refreshAll().catch((err: Error) => {
      setError(err.message || "Failed to load campaigns.");
      setLoading(false);
    });
  }, [refreshAll]);

  useEffect(() => {
    const hasLiveCampaign = campaigns.some((campaign) => campaign.status === "scheduled" || campaign.status === "sending");
    if (!hasLiveCampaign) return;

    const timer = window.setInterval(() => {
      fetchCampaigns().catch(() => {});
    }, 8000);

    return () => {
      window.clearInterval(timer);
    };
  }, [campaigns, fetchCampaigns]);

  const upsertCampaign = (campaign: CampaignRecord) => {
    setCampaigns((current) => {
      const exists = current.some((item) => item.id === campaign.id);
      if (!exists) return [campaign, ...current];
      return current.map((item) => (item.id === campaign.id ? campaign : item));
    });
    setSelectedCampaign((current) => (current?.id === campaign.id ? campaign : current));
  };

  const openCreate = () => {
    setDrawerMode("create");
    setSelectedCampaign(null);
    setForm(emptyForm);
    setError("");
  };

  const openView = (campaign: CampaignRecord) => {
    setDrawerMode("view");
    setSelectedCampaign(campaign);
    setError("");
  };

  const openEdit = (campaign: CampaignRecord) => {
    setDrawerMode("edit");
    setSelectedCampaign(campaign);
    setForm({
      title: campaign.title || "",
      body: campaign.body || "",
      categoryLabel: campaign.categoryLabel || "",
      ctaLabel: campaign.ctaLabel || "",
      targetType: campaign.target?.type || "notifications",
      eventId: campaign.target?.eventId || "",
      role: campaign.filters?.role || "all",
      city: campaign.filters?.city || "",
      platform: campaign.filters?.platform || "all",
      onboardingStatus: campaign.filters?.onboardingStatus || "all",
      scheduledFor: toLocalInputValue(campaign.scheduledFor),
    });
    setError("");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedCampaign(null);
    setForm(emptyForm);
    setError("");
    setSaving(false);
    setPublishingMode(null);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and message are required.");
      return false;
    }

    if (form.targetType === "event" && !form.eventId) {
      setError("Choose an event for the event deep link.");
      return false;
    }

    return true;
  };

  const persistCampaign = async () => {
    const payload = toApiPayload(form);
    if (drawerMode === "edit" && selectedCampaign) {
      const updated = await adminApi.patch<CampaignRecord>(`/admin/campaigns/${selectedCampaign.id}`, payload);
      upsertCampaign(updated);
      return updated;
    }

    const created = await adminApi.post<CampaignRecord>("/admin/campaigns", payload);
    upsertCampaign(created);
    return created;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    try {
      await persistCampaign();
      closeDrawer();
    } catch (err: any) {
      setError(err.message || "Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (mode: "now" | "schedule") => {
    if (!validateForm()) return;
    if (mode === "schedule" && !form.scheduledFor) {
      setError("Choose a schedule time before scheduling.");
      return;
    }

    setSaving(true);
    setPublishingMode(mode);
    setError("");
    try {
      const campaign = await persistCampaign();
      const published = await adminApi.post<CampaignRecord>(`/admin/campaigns/${campaign.id}/publish`, {
        mode,
        scheduledFor: mode === "schedule" ? new Date(form.scheduledFor).toISOString() : null,
      });
      upsertCampaign(published);
      closeDrawer();
    } catch (err: any) {
      setError(err.message || "Failed to publish campaign.");
    } finally {
      setSaving(false);
      setPublishingMode(null);
    }
  };

  const handleCancelScheduled = async (campaign: CampaignRecord) => {
    if (!window.confirm(`Cancel "${campaign.title}"?`)) return;

    setActionCampaignId(campaign.id);
    try {
      const updated = await adminApi.post<CampaignRecord>(`/admin/campaigns/${campaign.id}/cancel`);
      upsertCampaign(updated);
    } catch (err: any) {
      setError(err.message || "Failed to cancel campaign.");
    } finally {
      setActionCampaignId(null);
    }
  };

  const handlePublishExisting = async (campaign: CampaignRecord, mode: "now" | "schedule") => {
    if (mode === "schedule" && !campaign.scheduledFor) {
      openEdit(campaign);
      setError("Set the schedule time first, then schedule the campaign.");
      return;
    }

    setActionCampaignId(campaign.id);
    try {
      const updated = await adminApi.post<CampaignRecord>(`/admin/campaigns/${campaign.id}/publish`, {
        mode,
        scheduledFor: mode === "schedule" ? campaign.scheduledFor : null,
      });
      upsertCampaign(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update campaign status.");
    } finally {
      setActionCampaignId(null);
    }
  };

  const totalAudience = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + (campaign.targetedCount || 0), 0),
    [campaigns]
  );

  const totalDelivered = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0),
    [campaigns]
  );

  const liveCampaigns = campaigns.filter((campaign) => campaign.status === "scheduled" || campaign.status === "sending").length;
  const drawerOpen = drawerMode !== null;
  const isFormMode = drawerMode === "create" || drawerMode === "edit";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Campaigns</h1>
          <p className="mt-1 text-slate-500">
            Create broadcasts for launches, events, promos, and lifecycle nudges across iOS and Android.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-input bg-primary-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-800"
        >
          <SquarePen size={18} />
          Create Campaign
        </button>
      </div>

      {error && !drawerOpen && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: "Total Campaigns", value: campaigns.length, color: "text-slate-950" },
          { label: "Live", value: liveCampaigns, color: "text-primary-900" },
          { label: "Audience Targeted", value: totalAudience, color: "text-amber-700" },
          { label: "Delivered", value: totalDelivered, color: "text-emerald-700" },
        ].map((card) => (
          <div key={card.label} className="rounded-card border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-950">Broadcast Queue</h2>
            <p className="mt-1 text-sm text-slate-500">Drafts, scheduled sends, and completed deliveries in one place.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-400">No campaigns yet. Create your first broadcast.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Delivery</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => {
                  const isEditable = campaign.status === "draft" || campaign.status === "scheduled";
                  const isProcessing = actionCampaignId === campaign.id;
                  return (
                    <tr key={campaign.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                            <Megaphone size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950 transition-colors group-hover:text-primary-900">
                              {campaign.title}
                            </p>
                            <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-500">{campaign.body}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                              <span>{campaign.categoryLabel || "General"}</span>
                              <span>•</span>
                              <span>{campaign.target?.type || "notifications"}</span>
                              {campaign.filters?.city ? (
                                <>
                                  <span>•</span>
                                  <span>{campaign.filters.city}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusClasses[campaign.status]}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p>{campaign.targetedCount || 0} targeted</p>
                        <p className="mt-1 text-slate-400">
                          {campaign.filters?.role === "all" ? "All roles" : campaign.filters?.role || "All roles"}
                          {" • "}
                          {campaign.filters?.platform === "all" ? "All devices" : campaign.filters?.platform || "All devices"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p>{campaign.sentCount || 0} sent</p>
                        <p className="mt-1 text-slate-400">{campaign.failedCount || 0} failed</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p>{formatDateTime(campaign.scheduledFor || campaign.startedAt || campaign.createdAt)}</p>
                        <p className="mt-1 text-slate-400">
                          {campaign.scheduledFor ? "Scheduled" : campaign.startedAt ? "Started" : "Created"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openView(campaign)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-900"
                            title="View campaign"
                          >
                            <Eye size={16} />
                          </button>
                          {isEditable && (
                            <button
                              onClick={() => openEdit(campaign)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                              title="Edit campaign"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {campaign.status === "draft" && (
                            <button
                              onClick={() => handlePublishExisting(campaign, "now")}
                              disabled={isProcessing}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                              title="Publish now"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          )}
                          {campaign.status === "scheduled" && (
                            <button
                              onClick={() => handleCancelScheduled(campaign)}
                              disabled={isProcessing}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                              title="Cancel schedule"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {drawerMode === "create" ? "Create Campaign" : drawerMode === "edit" ? "Edit Campaign" : "Campaign Details"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {drawerMode === "view"
                ? "Inspect the audience, delivery state, and target before sending again."
                : "Choose the audience, destination, and when the campaign should go out."}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {drawerMode === "view" && selectedCampaign ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Status</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusClasses[selectedCampaign.status]}`}>
                    {selectedCampaign.status}
                  </span>
                  <span className="text-sm text-slate-500">{selectedCampaign.categoryLabel || "General"}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{selectedCampaign.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCampaign.body}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: "Targeted", value: selectedCampaign.targetedCount || 0 },
                  { label: "Sent", value: selectedCampaign.sentCount || 0 },
                  { label: "Failed", value: selectedCampaign.failedCount || 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Destination</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCampaign.target?.type || "notifications"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCampaign.ctaLabel || "No CTA label"}{selectedCampaign.target?.eventId ? ` • Event ${selectedCampaign.target.eventId}` : ""}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Audience Filters</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {(selectedCampaign.filters?.role || "all").replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {(selectedCampaign.filters?.platform || "all").replace("_", " ")} • {(selectedCampaign.filters?.onboardingStatus || "all").replace("_", " ")}
                  </p>
                  {selectedCampaign.filters?.city ? (
                    <p className="mt-1 text-sm text-slate-500">{selectedCampaign.filters.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Timeline</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Created: {formatDateTime(selectedCampaign.createdAt)}</p>
                  <p>Scheduled: {formatDateTime(selectedCampaign.scheduledFor)}</p>
                  <p>Started: {formatDateTime(selectedCampaign.startedAt)}</p>
                  <p>Completed: {formatDateTime(selectedCampaign.completedAt)}</p>
                </div>
                {selectedCampaign.lastError ? (
                  <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{selectedCampaign.lastError}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950">Title</label>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="New feature launch"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950">Message</label>
                  <textarea
                    value={form.body}
                    onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                    rows={5}
                    placeholder="Tell users what changed, why it matters, and where to tap."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-950">Category Label</label>
                    <input
                      value={form.categoryLabel}
                      onChange={(event) => setForm((current) => ({ ...current, categoryLabel: event.target.value }))}
                      placeholder="Feature update"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-950">CTA Label</label>
                    <input
                      value={form.ctaLabel}
                      onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                      placeholder="Open now"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-950">Deep Link Target</label>
                    <select
                      value={form.targetType}
                      onChange={(event) => setForm((current) => ({ ...current, targetType: event.target.value as CampaignTargetType, eventId: event.target.value === "event" ? current.eventId : "" }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                    >
                      {TARGET_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-950">Specific Event</label>
                    <select
                      value={form.eventId}
                      onChange={(event) => setForm((current) => ({ ...current, eventId: event.target.value }))}
                      disabled={form.targetType !== "event"}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Select event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <Megaphone size={18} className="text-primary-700" />
                    <h3 className="font-semibold text-slate-950">Audience Filters</h3>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-950">Role</label>
                      <select
                        value={form.role}
                        onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CampaignRole }))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-950">City</label>
                      <input
                        value={form.city}
                        onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Any city"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-950">Platform</label>
                      <select
                        value={form.platform}
                        onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value as CampaignPlatform }))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                      >
                        {PLATFORM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-950">Onboarding State</label>
                      <select
                        value={form.onboardingStatus}
                        onChange={(event) => setForm((current) => ({ ...current, onboardingStatus: event.target.value as CampaignOnboarding }))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                      >
                        {ONBOARDING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={18} className="text-amber-600" />
                    <h3 className="font-semibold text-slate-950">Schedule</h3>
                  </div>
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-950">Publish At</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledFor}
                      onChange={(event) => setForm((current) => ({ ...current, scheduledFor: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-primary-500"
                    />
                    <p className="mt-2 text-xs text-slate-400">Saved in your browser time, sent in UTC by the backend worker.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-8 py-5">
          {drawerMode === "view" && selectedCampaign ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {(selectedCampaign.status === "draft" || selectedCampaign.status === "scheduled") && (
                <button
                  onClick={() => openEdit(selectedCampaign)}
                  className="rounded-input border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Edit Campaign
                </button>
              )}
              {selectedCampaign.status === "draft" && (
                <button
                  onClick={() => handlePublishExisting(selectedCampaign, "now")}
                  disabled={actionCampaignId === selectedCampaign.id}
                  className="inline-flex items-center gap-2 rounded-input bg-primary-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
                >
                  {actionCampaignId === selectedCampaign.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Publish Now
                </button>
              )}
              {selectedCampaign.status === "scheduled" && (
                <button
                  onClick={() => handleCancelScheduled(selectedCampaign)}
                  disabled={actionCampaignId === selectedCampaign.id}
                  className="rounded-input bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                >
                  Cancel Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={closeDrawer}
                className="rounded-input border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-input border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {saving && !publishingMode ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => handlePublish("schedule")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-input bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                {saving && publishingMode === "schedule" ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
                Schedule
              </button>
              <button
                onClick={() => handlePublish("now")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-input bg-primary-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
              >
                {saving && publishingMode === "now" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
