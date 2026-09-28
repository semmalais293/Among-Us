"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CriterionData {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  currentValue: number | null;
}

interface ScoringDetailsResponse {
  assignmentId: string;
  isCompleted: boolean;
  submission: {
    id: string;
    title: string;
    description: string;
    repoUrl?: string;
    demoUrl?: string;
    track: string;
    teamName: string;
  };
  criteria: CriterionData[];
}

export default function AssignmentScoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  const [data, setData] = useState<ScoringDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadScoringDetails() {
      try {
        const res = await fetch(`/api/judge/score?assignmentId=${assignmentId}`);
        const json = await res.json();
        if (json.success && json.details) {
          setData(json.details);
          const initialMap: Record<string, number> = {};
          for (const c of json.details.criteria) {
            initialMap[c.id] = c.currentValue ?? 0;
          }
          setScores(initialMap);
        } else {
          setStatusMessage({
            type: "error",
            text: json.error || "Failed to load scoring details.",
          });
        }
      } catch (err: any) {
        setStatusMessage({ type: "error", text: err.message || "Network error" });
      } finally {
        setLoading(false);
      }
    }
    loadScoringDetails();
  }, [assignmentId]);

  const handleScoreChange = (criterionId: string, val: number, maxScore: number) => {
    const clamped = Math.max(0, Math.min(val, maxScore));
    setScores((prev) => ({
      ...prev,
      [criterionId]: clamped,
    }));
  };

  // Live Score Calculation
  let totalWeight = 0;
  let weightedProgressSum = 0;
  let rawSum = 0;
  let maxPossibleSum = 0;

  if (data) {
    for (const c of data.criteria) {
      const val = scores[c.id] ?? 0;
      totalWeight += c.weight;
      weightedProgressSum += (val / c.maxScore) * c.weight;
      rawSum += val;
      maxPossibleSum += c.maxScore;
    }
  }

  const livePercentage =
    totalWeight > 0 ? ((weightedProgressSum / totalWeight) * 100).toFixed(1) : "0.0";

  const handleSubmit = async (isDraft: boolean) => {
    setSubmitting(true);
    setStatusMessage(null);

    const formattedScores = Object.entries(scores).map(([criterionId, value]) => ({
      criterionId,
      value,
    }));

    try {
      const res = await fetch("/api/judge/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          scores: formattedScores,
          feedback,
          isDraft,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage({
          type: "success",
          text: isDraft
            ? "Draft evaluation saved successfully."
            : "Final score submitted successfully!",
        });
        if (!isDraft) {
          setTimeout(() => {
            router.push("/judge");
          }, 1200);
        }
      } else {
        setStatusMessage({
          type: "error",
          text: json.error || "Submission failed.",
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center p-6">
        <p className="text-sm">Loading project scoring studio...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
        <h2 className="text-lg font-semibold text-rose-400">Assignment Not Available</h2>
        <p className="text-sm text-slate-400 mt-1">
          {statusMessage?.text || "The requested assignment could not be loaded."}
        </p>
        <Link
          href="/judge"
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/judge"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center"
          >
            ← Back to Assigned Submissions
          </Link>
        </div>

        {/* Project Overview Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
              {data.submission.track}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                data.isCompleted
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {data.isCompleted ? "Scored" : "Pending Evaluation"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-3">
            {data.submission.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Team: <span className="text-slate-200">{data.submission.teamName}</span>
          </p>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed whitespace-pre-line">
            {data.submission.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-800/80">
            {data.submission.demoUrl && (
              <a
                href={data.submission.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-indigo-300 rounded-lg border border-slate-700 transition"
              >
                Launch Live Demo ↗
              </a>
            )}
            {data.submission.repoUrl && (
              <a
                href={data.submission.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition"
              >
                View Repository ↗
              </a>
            )}
          </div>
        </div>

        {/* Live Calculation Bar */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
              Calculated Evaluation Score
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Weighted according to event rubric specifications
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold text-white">{livePercentage}%</span>
            <span className="text-xs text-slate-400">
              ({rawSum.toFixed(1)} / {maxPossibleSum} raw pts)
            </span>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Rubric Evaluation Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Rubric Criteria Evaluation
          </h2>

          <div className="space-y-6">
            {data.criteria.map((criterion) => {
              const currentVal = scores[criterion.id] ?? 0;
              return (
                <div
                  key={criterion.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {criterion.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Weight: <span className="text-indigo-400 font-medium">{criterion.weight}x</span> | Max:{" "}
                        <span className="text-slate-300 font-medium">{criterion.maxScore}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-400">
                        {currentVal}
                      </span>
                      <span className="text-xs text-slate-500"> / {criterion.maxScore}</span>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={criterion.maxScore}
                      step={0.5}
                      value={currentVal}
                      onChange={(e) =>
                        handleScoreChange(
                          criterion.id,
                          parseFloat(e.target.value) || 0,
                          criterion.maxScore
                        )
                      }
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0 (Poor)</span>
                      <span>{criterion.maxScore / 2} (Average)</span>
                      <span>{criterion.maxScore} (Exceptional)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Notes */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-300">
              Judges Feedback & Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the team or notes for fellow organizers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              {submitting ? "Submitting..." : "Submit Final Score"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
