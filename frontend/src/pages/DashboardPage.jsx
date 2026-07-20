import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "@/services/api";
import toast from "react-hot-toast";
import { generatePdfReport } from "@/utils/pdfGenerator";
import {
  IconUpload,
  IconPhoto,
  IconClock,
  IconCheck,
  IconX,
  IconLoader2,
  IconRefresh,
  IconAlertTriangle,
  IconEye,
  IconSparkles,
  IconDownload,
  IconChartBar,
} from "@tabler/icons-react";

const STATUS_CONFIG = {
  pending: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    icon: IconClock,
    label: "Pending",
  },
  processing: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    icon: IconLoader2,
    label: "Processing",
    animate: true,
  },
  completed: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    icon: IconCheck,
    label: "Completed",
  },
  failed: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    icon: IconX,
    label: "Failed",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${config.color}`}
    >
      <Icon size={14} className={config.animate ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-neutral-400" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function JobRow({ job, onClick, onRetrySuccess }) {
  const [retrying, setRetrying] = useState(false);
  const isFlagged = job.flagged;

  const handleRetry = async (e) => {
    e.stopPropagation();
    setRetrying(true);
    try {
      await api.post(`/jobs/${job._id}/retry`);
      toast.success("JOB RETRY QUEUED");
      if (onRetrySuccess) onRetrySuccess();
    } catch (err) {
      toast.error(err.response?.data?.message?.toUpperCase() || "RETRY FAILED");
    } finally {
      setRetrying(false);
    }
  };

  const date = new Date(job.createdAt);
  const isToday = date.toDateString() === new Date().toDateString();
  const dateStr = isToday
    ? `Today, ${date.toLocaleTimeString('en-US', { hour12: false })}`
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

  const formatFilename = (name) => {
    if (!name || name.length <= 20) return name;
    const extIndex = name.lastIndexOf('.');
    if (extIndex === -1) return name.substring(0, 17) + '...';
    const ext = name.substring(extIndex);
    const base = name.substring(0, extIndex);
    return `${base.substring(0, 14)}...${ext}`;
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
    >
      <td className="px-5 py-3 w-16">
        <div className="h-10 w-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm" onClick={onClick}>
          {job.imageUrl ? (
            <img src={job.imageUrl} alt={job.filename} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <IconPhoto size={16} className="text-neutral-600" />
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-neutral-300 cursor-pointer hover:text-white transition-colors max-w-[200px]" onClick={onClick} title={job.filename}>
            {formatFilename(job.filename)}
          </span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          {isFlagged ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-500">
              <IconAlertTriangle size={14} />
              Flagged
            </span>
          ) : (
            <StatusBadge status={job.status} />
          )}
        </div>
      </td>
      <td className="px-5 py-3 text-xs font-medium text-neutral-400">
        {dateStr}
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          {job.status === "failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 rounded border border-white/20 bg-transparent px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <IconRefresh size={12} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Retrying" : "Retry"}
            </button>
          )}
          <button
            onClick={onClick}
            className="rounded bg-white px-3 py-1.5 text-[10px] font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
          >
            {isFlagged ? "Review" : "View"}
          </button>
          {job.status === "completed" ? (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const toastId = toast.loading("Generating PDF...", { id: "pdf-toast" });
                try {
                  await generatePdfReport(job._id);
                  toast.success("PDF Downloaded!", { id: "pdf-toast" });
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to generate PDF", { id: "pdf-toast" });
                }
              }}
              className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center h-7 w-7 rounded hover:bg-white/5"
              title="Download PDF"
            >
              <IconDownload size={14} />
            </button>
          ) : (
            <button
              disabled
              className="text-neutral-500 opacity-20 cursor-not-allowed flex items-center justify-center h-7 w-7 rounded"
              title="PDF unavailable until complete"
            >
              <IconDownload size={14} />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function DashboardPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, flagged: 0, processing: 0 });

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const previousJobsRef = useRef([]);

  const fetchJobs = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get(`/jobs?page=${pageNum}&limit=10`);
      const items = res.data.data.items;
      const total = res.data.data.total;
      const fetchedStats = res.data.data.stats;

      if (fetchedStats) setStats(fetchedStats);

      const prevJobsMap = new Map(previousJobsRef.current.map(j => [j._id, j]));
      items.forEach(newJob => {
        const oldJob = prevJobsMap.get(newJob._id);
        if (oldJob && !oldJob.flagged && newJob.flagged) {
          toast.error(`⚠️ Content Alert: "${newJob.filename}" was flagged!`, {
            duration: 5000,
          });
        }
      });
      previousJobsRef.current = items;

      setJobs(items);
      setHasMore(pageNum * 10 < total);
    } catch {
      toast.error("FAILED TO LOAD JOBS");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("ONLY JPG, PNG, WEBP ALLOWED");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("FILE EXCEEDS 5MB LIMIT");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      await api.post("/jobs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("IMAGE UPLOADED PROCESSING STARTED");
      setPage(1);
      fetchJobs(1);
    } catch (err) {
      if (err.response?.status === 429) {
        const resetHeader = err.response.headers["ratelimit-reset"];
        if (resetHeader) {
          const resetTime = parseInt(resetHeader, 10);
          const now = Math.floor(Date.now() / 1000);
          const secondsRemaining = Math.max(0, resetTime - now);
          toast.error(`UPLOAD LIMIT REACHED. PLEASE TRY AGAIN IN ${secondsRemaining} SECONDS.`);
          return;
        }
      }
      const msg = err.response?.data?.message || "Upload failed";
      toast.error(msg.toUpperCase());
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  // Auto-refresh if any jobs are pending/processing
  useEffect(() => {
    const hasPending = jobs.some(
      (j) => j.status === "pending" || j.status === "processing"
    );
    if (!hasPending) return;

    const interval = setInterval(() => fetchJobs(1), 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  useEffect(() => {
    const handleUploadEvent = () => {
      setPage(1);
      fetchJobs(1);
    };
    window.addEventListener("jobUploaded", handleUploadEvent);
    return () => window.removeEventListener("jobUploaded", handleUploadEvent);
  }, [fetchJobs]);



  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and monitor AI media processing queues.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <button
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-white hover:bg-neutral-200 text-black rounded-lg px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <IconLoader2 size={18} className="animate-spin text-black" />
            ) : (
              <span className="text-lg leading-none mb-0.5">+</span>
            )}
            {uploading ? "Uploading..." : "Process New Image"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Jobs</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <IconPhoto size={24} className="text-neutral-600" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Processing</p>
            <p className="text-3xl font-bold text-white">{stats.processing}</p>
          </div>
          <IconClock size={24} className="text-neutral-600" />
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
          <div>
            <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-wider mb-1">Flagged Content</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-red-500">{stats.flagged}</p>
              <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mb-1">Requires Review</span>
            </div>
          </div>
          <IconAlertTriangle size={24} className="text-red-500/50" />
        </div>
      </div>



      {/*Jobs Table*/}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.01]">
          <h2 className="text-base font-semibold text-white">Recent Executions</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center h-8 w-8 rounded border border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <IconChartBar size={14} />
            </button>
            <button
              onClick={() => {
                setPage(1);
                setLoading(true);
                fetchJobs(1);
              }}
              className="flex items-center justify-center h-8 w-8 rounded border border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <IconRefresh size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-white/[0.02]">
                <th className="px-5 py-3 font-bold">Preview</th>
                <th className="px-5 py-3 font-bold">File Name</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Created Date</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <motion.tr
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <IconLoader2 size={24} className="animate-spin text-neutral-500" />
                        <span className="text-sm text-neutral-500">Loading jobs...</span>
                      </div>
                    </td>
                  </motion.tr>
                ) : jobs.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td colSpan="5" className="p-12 text-center">
                      <IconEye size={32} className="mx-auto text-neutral-600 mb-3" />
                      <p className="text-sm font-medium text-neutral-400">No jobs yet</p>
                      <p className="text-xs text-neutral-600 mt-1">Upload your first image to get started.</p>
                    </td>
                  </motion.tr>
                ) : (
                  jobs.map((job) => (
                    <JobRow
                      key={job._id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      onRetrySuccess={() => fetchJobs(page)}
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/[0.01]">
          <span className="text-xs text-neutral-500 font-medium">Page {page}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => {
                const prev = Math.max(1, page - 1);
                setPage(prev);
                fetchJobs(prev);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!hasMore}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchJobs(next);
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
