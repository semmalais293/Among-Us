"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface AssignmentItem {
  id: string;
  isCompleted: boolean;
  createdAt: string;
  submission: {
    id: string;
    title: string;
    description: string;
    repoUrl?: string;
    demoUrl?: string;
    track?: { name: string };
    team?: { name: string };
  };
  scores: {
    value: number;
    criterion: { name: string; maxScore: number; weight: number };
  }[];
}

export default function JudgeDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/judge/assignments");
        const json = await res.json();
        if (json.success) {
          setAssignments(json.assignments || []);
        }
      } catch (err) {
        console.error("Failed to load assignments", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a) => a.isCompleted).length;
  const pendingCount = totalAssigned - completedCount;
  const completionPercentage =
    totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const filteredAssignments = assignments.filter((a) => {
    if (filter === "completed") return a.isCompleted;
    if (filter === "pending") return !a.isCompleted;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                Judge Portal
              </span>
              <span className="text-xs text-slate-400">Dogfood 72h Hackathon</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
              Assigned Submissions
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review and evaluate projects assigned to you using the standardized rubric.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/judge/leaderboard"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
            >
              Standings & Normalization
            </Link>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Assigned
            </div>
            <div className="text-3xl font-bold mt-2 text-white">{totalAssigned}</div>
            <div className="text-xs text-slate-500 mt-1">Allocated projects</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-3xl font-bold mt-2 text-emerald-400">{completedCount}</div>
            <div className="text-xs text-emerald-500/80 mt-1">Scored & submitted</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Evaluation
            </div>
            <div className="text-3xl font-bold mt-2 text-amber-400">{pendingCount}</div>
            <div className="text-xs text-amber-500/80 mt-1">Awaiting your review</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Progress
            </div>
            <div className="text-3xl font-bold mt-2 text-indigo-400">
              {completionPercentage}%
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({totalAssigned})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Loading your judging assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center">
            <h3 className="text-base font-semibold text-slate-300">No assignments found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "all"
                ? "You do not have any submissions assigned to judge yet."
                : `No ${filter} assignments at this time.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {item.submission.track?.name || "General Track"}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.isCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-3 line-clamp-1">
                    {item.submission.title}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium">
                    by {item.submission.team?.name || "Independent"}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                    {item.submission.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    {item.submission.demoUrl && (
                      <a
                        href={item.submission.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-indigo-300 underline"
                      >
                        Demo Link
                      </a>
                    )}
                    {item.submission.repoUrl && (
                      <a
                        href={item.submission.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-indigo-300 underline"
                      >
                        Source Code
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/judge/assignments/${item.id}`}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                      item.isCompleted
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    }`}
                  >
                    {item.isCompleted ? "Edit Evaluation" : "Score Project →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
