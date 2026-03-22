"use client";

import { useEffect, useRef, useState } from "react";
import { detectMobile, startCamera, captureImage } from "@/lib/camera";
import { predictImage, sendFeedback } from "@/lib/api";
import {
  Loader2,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ScanLine,
  Upload,
  ImageIcon,
  X,
} from "lucide-react";
import {
  DEFAULT_META,
  FEEDBACK_LABELS,
  LABEL_META,
  type PredictResponse,
  type PredictionLabel,
} from "@/types/prediction";

// ─── ConfidenceBar ─────────────────────────────────────────────────────────────
function ConfidenceBar({
  label,
  value,
  isTop,
}: {
  label: string;
  value: number;
  isTop: boolean;
}) {
  const meta = LABEL_META[label] ?? DEFAULT_META;
  const pct = Math.round(value * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs text-white/40 truncate capitalize shrink-0 [font-family:var(--font-imprima)] tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isTop ? "bg-white" : "bg-white/20"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold w-9 text-right shrink-0 [font-family:var(--font-orbitron)] ${
          isTop ? "text-white" : "text-white/30"
        }`}
      >
        {pct} %
      </span>
    </div>
  );
}

// ─── Scan Corner Decorations ───────────────────────────────────────────────────
function ScanCorners({ active }: { active: boolean }) {
  return (
    <div
      className={`absolute inset-4 pointer-events-none transition-opacity duration-500 ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      {/* top-left */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl" />
      {/* top-right */}
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr" />
      {/* bottom-left */}
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl" />
      {/* bottom-right */}
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br" />
    </div>
  );
}

// ─── Scan Line Animation ───────────────────────────────────────────────────────
function ScanLineAnim() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <style>{`
        .scan-line {
          animation: scanMove 3s linear infinite;
        }
        @keyframes scanMove {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctLabel, setCorrectLabel] = useState<PredictionLabel | "">("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [responseFinalized, setResponseFinalized] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // active input mode: "camera" | "upload"
  const [inputMode, setInputMode] = useState<"camera" | "upload">("camera");

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetStates = () => {
    setPrediction(null);
    setShowFeedback(false);
    setCorrectLabel("");
    setResponseFinalized(false);
  };

  const openLaptopCamera = async () => {
    resetStates();
    setImage(null);
    setFile(null);
    setInputMode("camera");
    await startCamera(videoRef);
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraOpen) return;
    resetStates();
    const img = captureImage(videoRef, canvasRef);
    setImage(img);
    const blob = await fetch(img).then((r) => r.blob());
    setFile(new File([blob], "capture.png", { type: "image/png" }));
  };

  const handleMobileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetStates();
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImage(URL.createObjectURL(f));
  };

  // Desktop/Mobile image upload from gallery
  const handleFileUpload = (f: File) => {
    resetStates();
    setCameraOpen(false);
    setInputMode("upload");
    setFile(f);
    setImage(URL.createObjectURL(f));
  };

  const handleUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFileUpload(f);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await predictImage(file, isMobile);
      setPrediction(res);
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail || error?.message || "Unknown error";
      showToast(`Error: ${msg}`, "error");
    }
    setLoading(false);
  };

  const finalize = () => {
    setResponseFinalized(true);
    setShowFeedback(false);
    showToast("Thanks for your feedback!");
  };

  const handleYes = () => {
    setResponseFinalized(true);
    showToast("Great! Prediction confirmed.");
  };

  const submitFeedback = async () => {
    if (!file || !prediction || !correctLabel) return;
    setFeedbackLoading(true);
    try {
      await sendFeedback(
        file,
        prediction.top_prediction.label,
        correctLabel,
        isMobile
      );
      finalize();
    } catch {
      showToast("Feedback failed. Try again.", "error");
    }
    setFeedbackLoading(false);
  };

  const chooseSuggestedLabel = async (label: string) => {
    if (!file || !prediction) return;
    setFeedbackLoading(true);
    try {
      await sendFeedback(
        file,
        prediction.top_prediction.label,
        label,
        isMobile
      );
      finalize();
    } catch {
      showToast("Feedback failed. Try again.", "error");
    }
    setFeedbackLoading(false);
  };

  const clearAll = () => {
    setImage(null);
    setFile(null);
    setCameraOpen(false);
    resetStates();
  };

  const isUncertain = prediction?.status === "uncertain";
  const isConfident = prediction?.status === "ok";
  const topLabel = prediction?.top_prediction.label ?? "";
  const topMeta = LABEL_META[topLabel] ?? DEFAULT_META;
  const allScores = prediction?.all_scores
    ? Object.entries(prediction.all_scores).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="min-h-screen bg-black font-sans">
      {/* ── Ambient BG ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.02] blur-3xl rounded-full" />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-all duration-300 max-w-[90vw] backdrop-blur-md [font-family:var(--font-imprima)] tracking-wider ${
            toast.type === "success"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-red-950/60 border-red-500/40 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white/70" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-white/10 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center shrink-0 bg-gradient-to-b from-[#202020] to-[#0a0a0a]">
              <ScanLine className="w-4 h-4 text-white/80" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none [font-family:var(--font-hooge)] tracking-widest">
                SAAF AI
              </p>
              <p className="text-[10px] text-white/30 leading-none mt-0.5 [font-family:var(--font-imprima)] tracking-wider">
                HOSPITAL WASTE CLASSIFIER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400 [font-family:var(--font-hooge)] border border-red-500/30 px-2.5 py-1 rounded-full">
              LIVE
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col gap-5 relative z-10">

        {/* ── Input Mode Toggle ── */}
        {!image && (
          <div className="flex items-center justify-center">
            <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <button
                onClick={() => setInputMode("camera")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-widest transition-all [font-family:var(--font-hooge)] ${
                  inputMode === "camera"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                CAMERA
              </button>
              <button
                onClick={() => { setInputMode("upload"); setCameraOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-widest transition-all [font-family:var(--font-hooge)] ${
                  inputMode === "upload"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                UPLOAD
              </button>
            </div>
          </div>
        )}

        {/* ── Camera / Preview Card ── */}
        <section className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">

          {/* Video / Image area */}
          <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">

            {image ? (
              <>
                <img
                  src={image}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
                <ScanCorners active={false} />
                {/* Clear button overlay */}
                <button
                  onClick={clearAll}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : inputMode === "camera" && !isMobile ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <ScanCorners active={cameraOpen} />
                {cameraOpen && <ScanLineAnim />}
                {!cameraOpen && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      <Camera className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-xs text-white/20 [font-family:var(--font-imprima)] tracking-wider uppercase">
                      Webcam inactive
                    </p>
                  </div>
                )}
              </>
            ) : inputMode === "camera" && isMobile ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                  <Camera className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-xs text-white/20 [font-family:var(--font-imprima)] tracking-wider uppercase">
                  Tap below to open camera
                </p>
              </div>
            ) : (
              /* Upload Drop Zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                  dragOver ? "bg-white/5" : "bg-transparent"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                    dragOver
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <ImageIcon className="w-7 h-7 text-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/50 [font-family:var(--font-hooge)] tracking-widest">
                    DROP IMAGE HERE
                  </p>
                  <p className="text-[10px] text-white/20 [font-family:var(--font-imprima)] mt-1">
                    or click to browse
                  </p>
                </div>
                <ScanCorners active={dragOver} />
              </div>
            )}
          </div>

          {/* ── Controls ── */}
          <div className="p-3 sm:p-4 border-t border-white/10 flex items-center justify-between gap-3">

            {/* CAMERA MODE */}
            {inputMode === "camera" && (
              <>
                {isMobile ? (
                  <label className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-[#202020] to-[#111] border border-white/20 hover:border-white/40 text-white text-xs font-semibold py-3 rounded-xl cursor-pointer transition-all [font-family:var(--font-hooge)] tracking-widest active:scale-95">
                    <Camera className="w-4 h-4" />
                    {image ? "RETAKE" : "OPEN CAMERA"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleMobileCapture}
                      hidden
                    />
                  </label>
                ) : (
                  <>
                    <button
                      onClick={openLaptopCamera}
                      className="flex items-center gap-2 border border-white/20 hover:border-white/40 bg-gradient-to-b from-[#202020] to-[#111] text-white/70 hover:text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all [font-family:var(--font-hooge)] tracking-widest active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      {cameraOpen ? "RESTART" : "OPEN WEBCAM"}
                    </button>

                    {/* Shutter button */}
                    <button
                      onClick={takePhoto}
                      disabled={!cameraOpen}
                      className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-all active:scale-90 mx-auto ${
                        cameraOpen
                          ? "border-white/30 hover:border-white/60 bg-transparent"
                          : "border-white/10 cursor-not-allowed opacity-30"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full transition-colors ${
                          cameraOpen ? "bg-red-500" : "bg-white/20"
                        }`}
                      />
                    </button>
                  </>
                )}

                {/* Also allow upload in camera mode */}
                <label
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 cursor-pointer transition-colors px-2 shrink-0 [font-family:var(--font-imprima)]"
                  title="Upload image instead"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadInput}
                    hidden
                    ref={mobileFileInputRef}
                  />
                </label>
              </>
            )}

            {/* UPLOAD MODE */}
            {inputMode === "upload" && !image && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 bg-gradient-to-b from-[#202020] to-[#111] text-white text-xs font-semibold py-3 px-3 rounded-xl transition-all [font-family:var(--font-hooge)] tracking-widest active:scale-95"
              >
                <Upload className="w-4 h-4" />
                BROWSE IMAGE
              </button>
            )}

            {/* Mobile gallery upload in upload mode */}
            {inputMode === "upload" && isMobile && !image && (
              <label className="flex-1 flex items-center text-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-transparent text-white/40 text-xs font-semibold py-3 px-3 rounded-xl cursor-pointer transition-all [font-family:var(--font-hooge)] tracking-widest active:scale-95">
                <Camera className="w-4 h-4" />
                FROM CAMERA
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleMobileCapture}
                  hidden
                />
              </label>
            )}

            {image && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-2 shrink-0 [font-family:var(--font-imprima)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Hidden desktop file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUploadInput}
          hidden
        />

        {/* ── Predict Button ── */}
        {image && !prediction && (
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 disabled:opacity-40 text-black font-semibold text-sm py-4 rounded-2xl shadow-sm transition-all active:scale-[0.98] [font-family:var(--font-hooge)] tracking-widest"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                ANALYSING WASTE...
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                CLASSIFY WASTE
              </>
            )}
          </button>
        )}

        {/* ── Results ── */}
        {prediction && (
          <div className="flex flex-col gap-4">
            {/* Section label */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-[10px] text-white/30 [font-family:var(--font-hooge)] tracking-widest uppercase">
                Analysis Result
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* ── UNCERTAIN ── */}
            {isUncertain && !responseFinalized && !showFeedback && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1400] to-[#0a0a0a] overflow-hidden">
                <div className="px-5 py-4 flex items-start gap-3 border-b border-white/10">
                  <AlertTriangle className="w-5 h-5 text-yellow-500/80 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white/80 [font-family:var(--font-hooge)] tracking-widest">
                      LOW CONFIDENCE
                    </p>
                    <p className="text-xs text-white/30 mt-0.5 [font-family:var(--font-imprima)]">
                      The model is unsure. Please confirm the correct category.
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-3 [font-family:var(--font-hooge)]">
                    Which is it?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      prediction.top_prediction,
                      prediction.second_prediction,
                    ].map((p) => {
                      const m = LABEL_META[p.label] ?? DEFAULT_META;
                      return (
                        <button
                          key={p.label}
                          disabled={feedbackLoading}
                          onClick={() => chooseSuggestedLabel(p.label)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {feedbackLoading ? (
                            <Loader2 className="animate-spin w-5 h-5 text-white/30" />
                          ) : (
                            <span className="text-2xl">{m.icon}</span>
                          )}
                          <span className="text-xs font-semibold capitalize text-white/70 [font-family:var(--font-hooge)] tracking-wider">
                            {p.label}
                          </span>
                          <span className="text-[10px] text-white/30 [font-family:var(--font-orbitron)]">
                            {Math.round(p.confidence * 100)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white/30 hover:text-white/60 text-xs font-medium py-2.5 rounded-xl transition-all [font-family:var(--font-imprima)]"
                  >
                    ✗ Neither — pick correct category
                  </button>
                </div>
              </div>
            )}

            {/* ── CONFIDENT ── */}
            {isConfident && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] overflow-hidden">
                {/* Top result */}
                <div className="px-5 py-5 border-b border-white/10">
                  <p className="text-[10px] text-white/20 uppercase tracking-widest [font-family:var(--font-hooge)] mb-4">
                    Detected waste type
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Icon + label — always a row */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/10 flex items-center justify-center text-2xl bg-white/5 shrink-0">
                        {topMeta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl sm:text-3xl font-bold capitalize text-white leading-tight [font-family:var(--font-imprima)] tracking-widest break-words">
                          {topLabel}
                        </p>
                        <p className="text-xs text-white/30 mt-1 flex items-center gap-1 [font-family:var(--font-imprima)]">
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">{topMeta.bin}</span>
                        </p>
                      </div>
                    </div>

                    {/* Confidence — left-aligned on mobile (indented to align with label), right on sm+ */}
                    <div className="pl-[60px] sm:pl-0 sm:text-right shrink-0">
                      <p className="text-3xl font-extrabold text-white [font-family:var(--font-orbitron)] leading-none">
                        {Math.round(prediction.top_prediction.confidence * 100)}
                        <span className="text-lg text-white/40">  %</span>
                      </p>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1 [font-family:var(--font-hooge)]">
                        confidence
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scores */}
                {allScores.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 mb-3 [font-family:var(--font-hooge)]">
                      All scores
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {allScores.map(([label, value]) => (
                        <ConfidenceBar
                          key={label}
                          label={label}
                          value={value}
                          isTop={label === topLabel}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Feedback prompt ── */}
            {!responseFinalized && isConfident && !showFeedback && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-4 sm:p-5">
                <p className="text-sm font-semibold text-white/70 [font-family:var(--font-hooge)] tracking-widest mb-1">
                  IS THIS CORRECT?
                </p>
                <p className="text-xs text-white/25 mb-4 [font-family:var(--font-imprima)]">
                  Your feedback helps improve the model.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleYes}
                    className="flex-1 bg-white hover:bg-white/90 active:scale-95 text-black text-xs font-semibold py-3 rounded-xl transition-all [font-family:var(--font-hooge)] tracking-widest"
                  >
                    ✓ YES, CORRECT
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="flex-1 border border-white/20 hover:border-white/40 bg-transparent active:scale-95 text-white/50 hover:text-white text-xs font-semibold py-3 rounded-xl transition-all [font-family:var(--font-hooge)] tracking-widest"
                  >
                    ✗ NO, FIX IT
                  </button>
                </div>
              </div>
            )}

            {/* ── Feedback form ── */}
            {showFeedback && !responseFinalized && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] p-4 sm:p-5">
                <p className="text-sm font-semibold text-white/70 [font-family:var(--font-hooge)] tracking-widest mb-1">
                  SELECT CORRECT CATEGORY
                </p>
                <p className="text-xs text-white/25 mb-4 [font-family:var(--font-imprima)]">
                  Tap the correct waste type to submit feedback.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {FEEDBACK_LABELS.map((label) => {
                    const m = LABEL_META[label] ?? DEFAULT_META;
                    const selected = correctLabel === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setCorrectLabel(label)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium capitalize transition-all active:scale-95 [font-family:var(--font-imprima)] ${
                          selected
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-white/10 text-white/30 hover:border-white/25 hover:text-white/60"
                        }`}
                      >
                        <span className="text-base shrink-0">{m.icon}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={submitFeedback}
                  disabled={!correctLabel || feedbackLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 disabled:opacity-30 text-black font-semibold text-xs py-3 rounded-xl transition-all active:scale-[0.98] [font-family:var(--font-hooge)] tracking-widest"
                >
                  {feedbackLoading && (
                    <Loader2 className="animate-spin w-4 h-4" />
                  )}
                  SUBMIT FEEDBACK
                </button>
              </div>
            )}

            {/* ── Finalized ── */}
            {responseFinalized && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 to-[#0a0a0a] p-6 text-center">
                <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400 [font-family:var(--font-hooge)] tracking-widest">
                  RESPONSE RECORDED
                </p>
                <p className="text-xs text-emerald-500/50 [font-family:var(--font-imprima)]">
                  Thank you for helping improve SAAF AI.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-medium transition-colors [font-family:var(--font-hooge)] tracking-widest"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  SCAN ANOTHER ITEM
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}