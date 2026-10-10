"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMissions,
  createMission,
  updateMissionProgress,
  getProgress,
  Mission,
  UserProgress,
} from "@/lib/api";

interface MissionsListProps {
  token: string;
}

export function MissionsList({ token }: MissionsListProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick mission creation form state
  const [isCreatingOpen, setIsCreatingOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(5);
  const [creating, setCreating] = useState(false);

  // Updating tracker
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [missionsData, progressData] = await Promise.all([
        getMissions(token),
        getProgress(token),
      ]);
      setMissions(Array.isArray(missionsData) ? missionsData : []);
      setProgress(progressData);
    } catch (err: any) {
      console.error("[MissionsList] Error loading data:", err);
      setError("Failed to load money missions.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateMission(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createMission(token, {
        title: title.trim(),
        target: Number(target) || 5,
        xpReward: 50,
      });
      setTitle("");
      setTarget(5);
      setIsCreatingOpen(false);
      await loadData();
    } catch (err) {
      console.error("[MissionsList] Create error:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleIncrement(mission: Mission) {
    if (updatingId || mission.status === "completed") return;
    setUpdatingId(mission.id);
    try {
      const newProgress = mission.progress + 1;
      await updateMissionProgress(token, mission.id, newProgress);
      await loadData();
    } catch (err) {
      console.error("[MissionsList] Increment error:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const activeMissions = missions.filter((m) => m.status === "active");
  const completedMissions = missions.filter((m) => m.status === "completed");

  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const nextLevelXp = progress?.nextLevelXp ?? 100;
  const pct = Math.min(100, Math.max(0, progress?.progressPercent ?? Math.round((xp / nextLevelXp) * 100)));

  return (
    <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. HEADER & XP / LEVEL PROGRESSION STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5DAC4]/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ MONEY MISSIONS
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              tiny wins &middot; keep the streak
            </span>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#18122B]">
            Financial Habit Progression
          </h3>
        </div>

        {/* Level / XP Indicator */}
        <div className="rounded-xl border border-[#E5DAC4] bg-[#FAF8F5] p-2.5 min-w-[200px]">
          <div className="flex items-center justify-between text-xs font-bold text-[#18122B] mb-1">
            <span className="tracking-wider">LEVEL {level}</span>
            <span className="font-mono text-stone-600">{xp} / {nextLevelXp} XP</span>
          </div>
          {/* Subtle Hairline Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full bg-[#18122B] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-stone-400">
            <span>Progress: {pct}%</span>
            <span>{nextLevelXp - xp} XP to Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE MISSIONS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
            ACTIVE MISSIONS ({activeMissions.length})
          </span>
          <button
            type="button"
            onClick={() => setIsCreatingOpen(!isCreatingOpen)}
            className="text-[11px] font-bold text-[#3f6212] hover:underline cursor-pointer"
          >
            {isCreatingOpen ? "− Close Form" : "+ Create mission"}
          </button>
        </div>

        {/* Inline Create Form */}
        {isCreatingOpen && (
          <form
            onSubmit={handleCreateMission}
            className="rounded-xl border border-[#E5DAC4] bg-[#FAF8F5] p-3 space-y-2 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  placeholder="Mission title (e.g. Cook dinner 4 days this week)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DAC4] bg-white px-3 py-1.5 text-xs focus:outline-none focus:border-[#84cc16]"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E5DAC4] bg-white px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:border-[#84cc16]"
                  title="Target count"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="w-full rounded-lg bg-[#18122B] px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {creating ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-4 text-center text-xs text-stone-400">Loading missions…</div>
        ) : activeMissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-4 text-center text-xs text-stone-500">
            No active missions. Click &ldquo;+ Create mission&rdquo; to start your next habit streak.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeMissions.map((mission) => {
              const mPct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
              const isBusy = updatingId === mission.id;

              return (
                <div
                  key={mission.id}
                  className="rounded-xl border border-[#E5DAC4] bg-white p-3 shadow-2xs flex flex-col justify-between space-y-2 hover:border-[#84cc16]/50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#18122B] leading-tight">
                        {mission.title}
                      </h4>
                      {mission.description && (
                        <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                          {mission.description}
                        </p>
                      )}
                    </div>
                    {mission.xpReward && (
                      <span className="shrink-0 rounded-full bg-lime-100 text-[#3f6212] border border-lime-200 px-2 py-0.5 text-[9px] font-bold">
                        +{mission.xpReward} XP
                      </span>
                    )}
                  </div>

                  {/* Progress bar + Increment Action */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-600">
                      <span>Progress</span>
                      <span className="font-bold">
                        {mission.progress} / {mission.target}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden border border-stone-200/50">
                        <div
                          className="h-full bg-[#84cc16] transition-all duration-200"
                          style={{ width: `${mPct}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleIncrement(mission)}
                        className="rounded-md border border-stone-200 bg-stone-50 hover:bg-[#18122B] hover:text-white px-2 py-0.5 text-[10px] font-bold text-stone-700 transition cursor-pointer disabled:opacity-40"
                        title="Increment progress"
                      >
                        {isBusy ? "…" : "+1"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. COMPLETED MISSIONS (COMPACT LEDGER STRIP) */}
      {completedMissions.length > 0 && (
        <div className="pt-2 border-t border-[#E5DAC4]/60 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/60 block">
            COMPLETED LEDGER
          </span>
          <div className="divide-y divide-stone-100">
            {completedMissions.map((cm) => (
              <div
                key={cm.id}
                className="py-1.5 flex items-center justify-between text-xs text-stone-600"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold text-[11px]">✓</span>
                  <span className="line-through text-stone-500 font-medium">{cm.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {cm.xpReward && (
                    <span className="text-[9px] font-mono font-bold text-[#3f6212]">
                      +{cm.xpReward} XP earned
                    </span>
                  )}
                  <span className="rounded-full bg-stone-100 text-stone-500 text-[9px] px-2 py-0.5 font-bold uppercase">
                    COMPLETED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
