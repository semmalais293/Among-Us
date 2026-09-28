"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface StandingsRow {
  submissionId: string;
  title: string;
  trackName: string;
  teamName: string;
  rawAverage: number;
  normalizedScore: number;
  completedJudgesCount: number;
  totalJudgesCount: number;
  rank: number;
  trackRank: number;
}

interface JudgeStatRow {
  judgeId: string;
  judgeName: string;
  count: number;
  mean: number;
  stdDev: number;
}

export default function LeaderboardPage() {
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [judgeStats, setJudgeStats] = useState<JudgeStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/judge/normalization?eventId=active-event");
        const json = await res.json();
        if (json.success && json.data) {
          setStandings(json.data.standings || []);
          setJudgeStats(json.data.judgeStats || []);
        }
      } catch (err) {
        console.error("Failed to load normalized standings", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tracks = Array.from(new Set(standings.map((s) => s.trackName))).filter(Boolean);

  const filteredStandings = standings.filter((s) => {
    if (selectedTrack === "all") return true;
    return s.trackName === selectedTrack;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/judge"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            ← Back to Judge Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-3 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Hackathon Standings & Normalization
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Cross-judge calibrated rankings using Z-score standardization to eliminate grading bias.
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/judge/export?eventId=active-event&type=leaderboard"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                📥 Standings CSV
              </a>
              <a
                href="/api/judge/export?eventId=active-event&type=details"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                📥 Criterion Breakdown CSV
              </a>
              <a
                href="/api/judge/export?eventId=active-event&type=progress"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                📥 Judge Progress CSV
              </a>
            </div>
          </div>
        </div>

        {/* Track Filter Tabs */}
        {tracks.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTrack("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedTrack === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Overall Leaderboard
            </button>
            {tracks.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTrack(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedTrack === t
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t} Track
              </button>
            ))}
          </div>
        )}

        {/* Standings Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              {selectedTrack === "all" ? "Global Standings" : `${selectedTrack} Track Standings`}
            </h2>
            <span className="text-xs text-slate-500">
              {filteredStandings.length} Submissions
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Loading calibrated leaderboard...
            </div>
          ) : filteredStandings.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No evaluated submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Submission</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Raw Avg</th>
                    <th className="py-3 px-4">Normalized Score</th>
                    <th className="py-3 px-4">Judges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredStandings.map((row) => (
                    <tr key={row.submissionId} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {selectedTrack === "all" ? `#${row.rank}` : `#${row.trackRank}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{row.title}</div>
                        <div className="text-[11px] text-slate-400">{row.teamName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px]">
                          {row.trackName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {row.rawAverage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 text-sm">
                        {row.normalizedScore.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {row.completedJudgesCount} / {row.totalJudgesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Judge Calibration & Bias Analytics */}
        {judgeStats.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Judge Scoring Distributions (Bias Calibration)
            </h3>
            <p className="text-xs text-slate-400">
              Each judge's scoring mean ($\mu$) and standard deviation ($\sigma$) are calibrated against the global baseline.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {judgeStats.map((j) => (
                <div
                  key={j.judgeId}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-1"
                >
                  <div className="font-semibold text-xs text-white truncate">
                    {j.judgeName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Evaluations:</span>
                    <span className="font-mono text-slate-200">{j.count}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Mean ($\mu$):</span>
                    <span className="font-mono text-indigo-400 font-semibold">{j.mean}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Std Dev ($\sigma$):</span>
                    <span className="font-mono text-slate-300 font-medium">±{j.stdDev}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
