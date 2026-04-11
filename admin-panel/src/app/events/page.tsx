"use client";
import React, { useState, useEffect, useRef } from "react";
import { Plus, MapPin, Calendar as CalendarIcon, Clock, Trash2, X, Loader2, ImagePlus, Eye, Pencil, Users } from "lucide-react";
import { adminApi } from "@/lib/adminApiClient";

const CATEGORIES = ["Social", "Health", "Training", "Adoption", "Other"];
const STATUSES = ["Upcoming", "Draft", "Completed"];
const emptyForm = { title: "", description: "", date: "", time: "", location: "", category: "Social", image_url: "", status: "Upcoming" };

type DrawerMode = "create" | "edit" | "view" | null;

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    try {
      const data = await adminApi.get<any[]>('/admin/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setImagePreview("");
    setError("");
    setSelectedEvent(null);
    setDrawerMode("create");
  };

  const openView = (event: any) => {
    setSelectedEvent(event);
    setDrawerMode("view");
    setError("");
  };

  const openEdit = (event: any) => {
    setSelectedEvent(event);
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      category: event.category || "Social",
      image_url: event.image_url || "",
      status: event.status || "Upcoming",
    });
    setImagePreview(event.image_url || "");
    setError("");
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setSelectedEvent(null);
    setForm({ ...emptyForm });
    setImagePreview("");
    setError("");
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      const { url } = await adminApi.upload('events', file);
      setForm(f => ({ ...f, image_url: url }));
    } catch (err: any) {
      setError("Image upload failed: " + (err.message || "Try again"));
      setImagePreview("");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.location.trim()) {
      setError("Title, date and location are required.");
      return;
    }
    if (uploadingImage) {
      setError("Please wait for the image to finish uploading.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (drawerMode === "create") {
        const created = await adminApi.post<any>('/admin/events', form);
        setEvents(prev => [created, ...prev]);
      } else if (drawerMode === "edit" && selectedEvent) {
        const updated = await adminApi.patch<any>(`/admin/events/${selectedEvent.id}`, form);
        setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updated : e));
      }
      closeDrawer();
    } catch (err: any) {
      setError(err.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/admin/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEvent?.id === id) closeDrawer();
    } catch {
      alert("Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "upcoming") return "bg-primary-50 text-primary-700";
    if (s === "completed") return "bg-emerald-50 text-emerald-600";
    if (s === "draft") return "bg-slate-100 text-slate-500";
    return "bg-primary-50 text-primary-700";
  };

  const drawerOpen = drawerMode !== null;
  const isFormMode = drawerMode === "create" || drawerMode === "edit";
  const upcoming = events.filter(e => {
    const s = (e.status || "").toLowerCase();
    return s === "upcoming" || (!s && e.date && new Date(e.date) >= new Date());
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Event Management</h1>
          <p className="text-slate-500 mt-1">Create and monitor community events, workshops, and drives.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-primary-900 text-white rounded-input flex items-center gap-2 font-bold text-sm hover:bg-primary-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: events.length, color: "text-slate-950" },
          { label: "Upcoming", value: upcoming, color: "text-primary-900" },
          { label: "Completed", value: events.filter(e => e.status?.toLowerCase() === "completed").length, color: "text-emerald-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-card border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-950">All Events</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No events yet. Create one above.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                            <CalendarIcon size={18} className="text-primary-700" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-950 text-sm group-hover:text-primary-900 transition-colors">{event.title}</p>
                          <p className="text-xs text-slate-400">{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor(event.status)}`}>
                        {event.status || "Upcoming"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5"><CalendarIcon size={11} className="text-slate-400" />{event.date}</div>
                      {event.time && <div className="flex items-center gap-1.5 text-slate-400"><Clock size={11} />{event.time}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5"><MapPin size={11} className="text-slate-400" />{event.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openView(event)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-primary-900 transition-colors"
                      >
                        <Users size={13} className="text-slate-400" />
                        {event.attendeeCount ?? 0}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openView(event)}
                          className="p-2 text-slate-400 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(event)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          disabled={deletingId === event.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete event"
                        >
                          {deletingId === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && events.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
            {events.length} events
          </div>
        )}
      </div>

      {/* Backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDrawer} />
      )}

      {/* Right Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-1/2 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {drawerMode === "create" ? "Create New Event" : drawerMode === "edit" ? "Edit Event" : "Event Details"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {drawerMode === "create" ? "Fill in the details to publish a community event." :
               drawerMode === "edit" ? "Update the event information below." :
               selectedEvent?.category}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {drawerMode === "view" && (
              <button
                onClick={() => openEdit(selectedEvent)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
            <button onClick={closeDrawer} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* VIEW MODE */}
        {drawerMode === "view" && selectedEvent && (
          <div className="flex-1 overflow-y-auto">
            {selectedEvent.image_url && (
              <div className="w-full h-52 shrink-0">
                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="px-8 py-6 space-y-6">
              {/* Status badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusColor(selectedEvent.status)}`}>
                {selectedEvent.status || "Upcoming"}
              </span>

              <div>
                <h3 className="text-2xl font-bold text-slate-950">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-slate-500 mt-3 leading-relaxed text-sm">{selectedEvent.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon size={15} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{selectedEvent.date || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={15} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{selectedEvent.time || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={15} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{selectedEvent.location || "—"}</p>
                </div>
              </div>

              {/* Bookers list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-950">Bookings</p>
                  </div>
                  <span className="text-xs font-bold bg-primary-50 text-primary-900 px-2.5 py-1 rounded-full">
                    {selectedEvent.attendeeCount ?? 0} booked
                  </span>
                </div>

                {!selectedEvent.bookers?.length ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <p className="text-sm text-slate-400 font-medium">No bookings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvent.bookers.map((b: any, i: number) => (
                      <div key={b.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center text-xs font-bold shrink-0">
                          {b.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-950 truncate">{b.name}</p>
                          <p className="text-xs text-slate-400 truncate">{b.email}</p>
                          {b.phone && <p className="text-xs text-slate-400">{b.phone}</p>}
                          {b.note && <p className="text-xs text-slate-500 italic mt-0.5">"{b.note}"</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-400 font-medium">
                            {b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                          </p>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{b.userType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODE */}
        {isFormMode && (
          <>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Event Image</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-primary-900" />
                      </div>
                    )}
                    {!uploadingImage && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 bg-white rounded-lg shadow text-xs font-bold text-slate-600 hover:text-primary-900"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImagePreview(""); setForm(f => ({ ...f, image_url: "" })); }}
                          className="p-1.5 bg-white rounded-lg shadow text-slate-500 hover:text-rose-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 flex flex-col items-center justify-center gap-3 transition-colors group"
                  >
                    <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-primary-100 transition-colors">
                      <ImagePlus size={22} className="text-slate-400 group-hover:text-primary-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-600 group-hover:text-primary-900">Click to upload image</p>
                      <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Free Vaccination Drive"
                  className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-400 transition"
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Central Park, Mumbai"
                  className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition"
                />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {drawerMode === "edit" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the event for attendees..."
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 transition resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
              )}
            </form>

            {/* Drawer Footer */}
            <div className="px-8 py-5 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={closeDrawer}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || uploadingImage}
                className="flex-1 py-3 rounded-xl bg-primary-900 text-white text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {(saving || uploadingImage) && <Loader2 size={16} className="animate-spin" />}
                {uploadingImage ? "Uploading..." : saving ? "Saving..." : drawerMode === "create" ? "Create Event" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
