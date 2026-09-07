import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  BookOpen,
  Coffee,
  RefreshCw,
  Bell,
  Phone,
  Shield,
  Star,
  Sparkles,
  Repeat,
  Quote,
  Loader2,
  Calendar,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sanaAvatar from "@/assets/sana-avatar.png";
import { PERSONALITIES, type AiPersonality } from "@/lib/sana";
import { updateReminder } from "@/lib/reminders.functions";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

export interface ScheduledCallItem {
  id: string;
  title: string;
  scheduled_at: string;
  type?: string;
  duration_minutes?: number;
  repeat_mode?: string;
  persona?: string;
  alert_before_minutes?: number;
  strict_mode?: boolean;
  dont_miss?: boolean;
  ai_call?: boolean;
  quote?: string | null;
}

export interface EditScheduledCallModalProps {
  isOpen: boolean;
  reminder: ScheduledCallItem | null;
  onClose: () => void;
  onSaved?: () => void;
}

type ReminderType = "study" | "break" | "revision" | "custom";
type RepeatMode = "once" | "daily" | "weekly" | "custom";

function toLocalInput(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function EditScheduledCallModal({
  isOpen,
  reminder,
  onClose,
  onSaved,
}: EditScheduledCallModalProps) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateReminder);

  const [minDateTime, setMinDateTime] = useState(() => toLocalInput(new Date()));

  useEffect(() => {
    const updateMin = () => setMinDateTime(toLocalInput(new Date()));
    updateMin();
    const interval = setInterval(updateMin, 30_000);
    return () => clearInterval(interval);
  }, []);

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState<number>(25);
  const [type, setType] = useState<ReminderType>("study");
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("once");
  const [persona, setPersona] = useState<AiPersonality>("friendly_coach");
  const [alertBefore, setAlertBefore] = useState<number>(10);
  const [strictMode, setStrictMode] = useState(true);
  const [dontMiss, setDontMiss] = useState(true);
  const [aiCall, setAiCall] = useState(true);
  const [quote, setQuote] = useState("");

  const selectedTimeMs = scheduledAt ? new Date(scheduledAt).getTime() : 0;
  const isPast = selectedTimeMs > 0 && selectedTimeMs < Date.now();

  // Sync state whenever reminder prop changes or modal opens
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || "Study session with Sana");
      const d = reminder.scheduled_at ? new Date(reminder.scheduled_at) : new Date(Date.now() + 15 * 60_000);
      setScheduledAt(toLocalInput(isNaN(d.getTime()) ? new Date() : d));
      setDuration(reminder.duration_minutes || 25);
      setType((reminder.type as ReminderType) || "study");
      setRepeatMode((reminder.repeat_mode as RepeatMode) || "once");
      setPersona((reminder.persona as AiPersonality) || "friendly_coach");
      setAlertBefore(typeof reminder.alert_before_minutes === "number" ? reminder.alert_before_minutes : 10);
      setStrictMode(reminder.strict_mode ?? true);
      setDontMiss(reminder.dont_miss ?? true);
      setAiCall(reminder.ai_call ?? true);
      setQuote(reminder.quote || "");
    }
  }, [reminder, isOpen]);

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!reminder?.id) throw new Error("No call selected to edit");
      if (!title.trim()) throw new Error("Call title cannot be empty");
      if (isPast) {
        throw new Error("Scheduled time must be in the future. Please choose a time after right now.");
      }

      const isoDate = new Date(scheduledAt).toISOString();
      return updateFn({
        data: {
          id: reminder.id,
          title: title.trim(),
          type,
          scheduled_at: isoDate,
          duration_minutes: duration,
          persona,
          repeat_mode: repeatMode,
          alert_before_minutes: alertBefore,
          strict_mode: strictMode,
          dont_miss: dontMiss,
          ai_call: aiCall,
          quote: quote.trim() || null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["voice-reminders"] });
      toast.success("AI Call features updated successfully! 🚀");
      onSaved?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update call");
    },
  });

  if (!isOpen || !reminder) return null;

  // Quick time shift buttons
  const addMinutes = (mins: number) => {
    const currentMs = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    const baseMs = Math.max(Date.now(), Number.isNaN(currentMs) ? Date.now() : currentMs);
    const shifted = new Date(baseMs + mins * 60_000);
    setScheduledAt(toLocalInput(shifted));
  };

  const setTomorrowSameTime = () => {
    const current = scheduledAt ? new Date(scheduledAt) : new Date();
    current.setDate(current.getDate() + 1);
    if (current.getTime() < Date.now()) {
      current.setTime(Date.now() + 24 * 60 * 60_000);
    }
    setScheduledAt(toLocalInput(current));
  };

  const types: { id: ReminderType; label: string; icon: typeof BookOpen }[] = [
    { id: "study", label: "Study Session", icon: BookOpen },
    { id: "revision", label: "Revision", icon: RefreshCw },
    { id: "break", label: "Break", icon: Coffee },
    { id: "custom", label: "Custom", icon: Bell },
  ];

  const durations = [15, 25, 50, 75, 90];
  const repeatModes: { id: RepeatMode; label: string }[] = [
    { id: "once", label: "Once" },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
  ];
  const alertOptions = [0, 5, 10, 15, 30];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-purple-400/40 shadow-sm">
              <img src={sanaAvatar} alt="Sana" className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                Edit Scheduled AI Call <Sparkles className="h-4 w-4 text-purple-400" />
              </h2>
              <p className="text-[11px] text-slate-400">
                Modify timing, duration, voice personality & preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* 1. Title Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Call / Session Title
            </label>
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 focus-within:border-purple-500 transition">
              <BookOpen className="h-4 w-4 text-purple-400 shrink-0" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python DBMS Revision"
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* 2. When / Scheduled Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                When Should Sana Call You?
              </label>
              <span className="text-[10px] text-purple-300 font-semibold">Future time only</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border bg-white/5 px-3.5 py-2.5 focus-within:border-purple-500 transition",
                isPast ? "border-rose-500/60 bg-rose-500/10" : "border-white/15",
              )}
            >
              <Calendar className={cn("h-4 w-4 shrink-0", isPast ? "text-rose-400" : "text-purple-400")} />
              <input
                type="datetime-local"
                min={minDateTime}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]"
              />
            </div>

            {isPast && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Cannot schedule calls in the past. Please pick a future time after right now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).
                </span>
              </div>
            )}

            {/* Quick Shift Pills */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => addMinutes(15)}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-purple-600/30 hover:border-purple-400 transition"
              >
                +15 mins
              </button>
              <button
                type="button"
                onClick={() => addMinutes(30)}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-purple-600/30 hover:border-purple-400 transition"
              >
                +30 mins
              </button>
              <button
                type="button"
                onClick={() => addMinutes(60)}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-purple-600/30 hover:border-purple-400 transition"
              >
                +1 hour
              </button>
              <button
                type="button"
                onClick={setTomorrowSameTime}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-purple-600/30 hover:border-purple-400 transition"
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* 3. Duration Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Call Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {durations.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 rounded-2xl border text-xs font-bold transition active:scale-95",
                    duration === mins
                      ? "border-purple-500 bg-purple-600/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 mb-0.5 text-purple-400" />
                  <span>{mins}m</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Type / Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Session Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-2xl border text-left transition active:scale-95",
                      isSelected
                        ? "border-purple-500 bg-purple-600/25 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Sana's Voice Personality */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sana's Calling Personality
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PERSONALITIES.map((p) => {
                const isSelected = persona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={cn(
                      "flex flex-col p-3 rounded-2xl border text-left transition relative active:scale-95",
                      isSelected
                        ? "border-purple-500 bg-purple-600/25 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{p.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[10.5px] leading-tight text-slate-400 line-clamp-2">
                      {p.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Repeat Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Repeat Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {repeatModes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRepeatMode(r.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-xs font-semibold transition active:scale-95",
                    repeatMode === r.id
                      ? "border-purple-500 bg-purple-600/30 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <Repeat className="h-3 w-3 text-purple-400" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 7. Alert Before */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nudge Alert Before Call
            </label>
            <div className="flex flex-wrap gap-2">
              {alertOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAlertBefore(mins)}
                  className={cn(
                    "flex-1 min-w-[60px] py-2 rounded-xl border text-xs font-semibold text-center transition",
                    alertBefore === mins
                      ? "border-purple-500 bg-purple-600/30 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  {mins === 0 ? "At Call Time" : `${mins}m before`}
                </button>
              ))}
            </div>
          </div>

          {/* 8. Feature Toggles (AI Call, Strict Mode, Don't Miss) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-white">AI Voice Phone Call</div>
                  <div className="text-[10px] text-slate-400">Receive interactive voice call from Sana</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiCall}
                onChange={(e) => setAiCall(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Strict Accountability Mode</div>
                  <div className="text-[10px] text-slate-400">Sana follows up persistently until you begin</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={strictMode}
                onChange={(e) => setStrictMode(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Don't Miss Alarm</div>
                  <div className="text-[10px] text-slate-400">High priority sound and visual notification</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={dontMiss}
                onChange={(e) => setDontMiss(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 9. Optional Motivation Note / Quote */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Custom Motivation Note (Optional)
            </label>
            <div className="flex items-start gap-2.5 rounded-2xl border border-white/15 bg-white/5 p-3 focus-within:border-purple-500 transition">
              <Quote className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="e.g. Remember why you started! Focus on completing 20 questions."
                rows={2}
                className="w-full bg-transparent text-xs text-white outline-none resize-none placeholder:text-slate-500"
              />
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={updateMut.isPending || !title.trim() || isPast}
            onClick={() => updateMut.mutate()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            {updateMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : isPast ? (
              <>
                <AlertCircle className="h-4 w-4" /> Pick Future Time
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
