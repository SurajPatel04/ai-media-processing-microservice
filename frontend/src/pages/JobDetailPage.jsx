import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import toast from "react-hot-toast";
import { generatePdfReport } from "@/utils/pdfGenerator";
import {
  IconArrowLeft,
  IconRefresh,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconAlertTriangle,
  IconTag,
  IconUsers,
  IconHome,
  IconBuildingSkyscraper,
  IconPhoto,
  IconEye,
  IconShieldCheck,
  IconSparkles,
  IconDownload,
} from "@tabler/icons-react";

const STATUS_CONFIG = {
  pending: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: IconClock, label: "Pending" },
  processing: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: IconLoader2, label: "Processing", animate: true },
  completed: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: IconCheck, label: "Completed" },
  failed: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: IconX, label: "Failed" },
};

function SafeSearchBar({ label, level }) {
  const levels = ["VERY_UNLIKELY", "UNLIKELY", "POSSIBLE", "LIKELY", "VERY_LIKELY"];
  const idx = levels.indexOf(level);

  const textColor =
    idx <= 1 ? "text-emerald-400" : idx === 2 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold text-neutral-300 capitalize">{label}</span>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>
        {level?.replace(/_/g, " ") || "UNKNOWN"}
      </span>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-neutral-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-neutral-200">{value}</p>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.data);
    } catch {
      toast.error("JOB NOT FOUND");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  // Auto-refresh for pending/processing
  useEffect(() => {
    if (!job || (job.status !== "pending" && job.status !== "processing")) return;
    const interval = setInterval(fetchJob, 4000);
    return () => clearInterval(interval);
  }, [job?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await api.post(`/jobs/${id}/retry`);
      toast.success("JOB RETRY QUEUED");
      fetchJob();
    } catch (err) {
      toast.error(err.response?.data?.message?.toUpperCase() || "RETRY FAILED");
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const toastId = toast.loading("Generating PDF report...", { id: "pdf-toast" });
    try {
      await generatePdfReport(id);
      toast.success("PDF Downloaded!", { id: "pdf-toast" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!job) return null;

  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-6">
        <button onClick={() => navigate("/dashboard")} className="hover:text-white transition-colors cursor-pointer">Jobs</button>
        <span>›</span>
        <span className="text-neutral-300">{job.filename}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Job Details
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${job.flagged ? "text-red-500" : config.color}`}
          >
            <Icon size={14} className={config.animate ? "animate-spin" : ""} />
            {job.flagged ? "Flagged" : config.label}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          {isComplete && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <IconDownload size={14} />
              {downloading ? "Exporting..." : "Export PDF"}
            </button>
          )}

          {isFailed && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconRefresh size={14} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Retrying…" : "Retry Job"}
            </button>
          )}
        </div>
      </div>

      {/* Flagged Warning */}
      {job.flagged && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-4 shadow-sm">
          <IconAlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">Content Safety Flag Raised</p>
            <p className="text-sm text-red-400/80 leading-relaxed">
              This processing job triggered safety protocols due to a high probability score in: {job.flaggedCategories?.join(", ")}. The resulting data has been quarantined pending manual review.
            </p>
          </div>
        </div>
      )}

      {/*Error Banner*/}
      {isFailed && job.error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5 flex items-start gap-4">
          <IconAlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">Processing Failed</p>
            <p className="text-sm text-red-400/80 leading-relaxed">{job.error}</p>
            {job.failedStep && (
              <p className="text-xs font-semibold text-red-400/60 mt-2 uppercase tracking-wider">
                Failed at: {job.failedStep} · Attempts: {job.retryCount || 0}
              </p>
            )}
          </div>
        </div>
      )}

      {(job.status === "pending" || job.status === "processing") && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <div className="h-10 w-10 mx-auto mb-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
          <p className="text-base font-semibold text-blue-300">
            {job.status === "pending" ? "Waiting in queue…" : "AI is analyzing your image…"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 items-start">

        {/* LEFT COLUMN: Image */}
        <div className="flex flex-col gap-6">
          {job.imageUrl && (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Source Material</h2>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                  {job.metadata?.width ? `${job.metadata.width}x${job.metadata.height} · ` : ""}IMAGE
                </span>
              </div>
              <div className="w-full min-h-[400px] flex items-center justify-center p-6 sm:p-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWExYTFhIi8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMjIyMiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIyMjIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFhMWExYSIvPjwvc3ZnPg==')]">
                <img
                  src={job.imageUrl}
                  alt={job.filename}
                  className="max-w-full max-h-[600px] object-contain drop-shadow-2xl rounded"
                />
              </div>
            </div>
          )}

          {isComplete && job.metadata && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {job.scene && (
                <InfoCard icon={IconEye} label="Scene" value={job.scene} className="sm:col-span-2 shadow-sm" />
              )}
              <InfoCard
                icon={IconUsers}
                label="People"
                value={job.peopleCount ?? 0}
                className="shadow-sm"
              />
              <InfoCard
                icon={job.isIndoor ? IconHome : IconBuildingSkyscraper}
                label="Environment"
                value={job.isIndoor == null ? "Unknown" : job.isIndoor ? "Indoor" : "Outdoor"}
                className="shadow-sm"
              />
            </div>
          )}
        </div>

        {isComplete && (
          <div className="flex flex-col gap-6">

            {job.caption && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/[0.01]">
                  <IconSparkles size={14} className="text-neutral-400" />
                  <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Generated Caption
                  </h2>
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium leading-relaxed text-neutral-200">
                    "{job.caption}"
                  </p>
                </div>
              </div>
            )}

            {job.safeSearch && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/[0.01]">
                  <IconShieldCheck size={14} className="text-neutral-400" />
                  <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Content Safety Analysis
                  </h2>
                </div>
                <div className="p-4 px-5">
                  <div className="flex flex-col">
                    {["adult", "violence", "medical", "racy", "spoof"].map((cat) => (
                      <SafeSearchBar key={cat} label={cat} level={job.safeSearch[cat]} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {job.detectedObjects?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <IconPhoto size={14} className="text-neutral-400" />
                    <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Object Detection Results
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    {job.detectedObjects.length} Entities
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-white/[0.01]">
                        <th className="px-5 py-3">Label</th>
                        <th className="px-5 py-3 text-right">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.detectedObjects.map((obj, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                          <td className="px-5 py-3 text-xs font-semibold text-neutral-200">
                            {obj.name} {obj.count > 1 && <span className="text-neutral-500 ml-1">×{obj.count}</span>}
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-right text-emerald-400">
                            {(obj.confidence * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {job.labelDetails?.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/[0.01]">
                  <IconTag size={14} className="text-neutral-400" />
                  <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    General Labels
                  </h2>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {job.labelDetails.map((label, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-300">{label.description}</span>
                        {label.score && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            {(label.score * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {label.score && (
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.round(label.score * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
