"use client";

import { useEffect, useRef, useState } from "react";
import { detectMobile, startCamera, captureImage } from "@/lib/camera";
import { predictImage, sendFeedback } from "@/lib/api";
import { Loader2, Camera, RefreshCw, CheckCircle2, AlertTriangle, ChevronRight, ScanLine } from "lucide-react";
import { DEFAULT_META, FEEDBACK_LABELS, LABEL_META, type PredictResponse, type PredictionLabel } from "@/types/prediction";



// ─── ConfidenceBar ────────────────────────────────────────────────────────────
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
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-20 sm:w-24 text-xs text-gray-500 truncate capitalize shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isTop ? "bg-current " + meta.color : "bg-gray-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold w-9 text-right shrink-0 ${
          isTop ? meta.color : "text-gray-400"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctLabel, setCorrectLabel] = useState<PredictionLabel | "">("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [responseFinalized, setResponseFinalized] = useState(false);

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

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await predictImage(file);
      setPrediction(res);
    } catch {
      showToast("Prediction failed. Please try again.", "error");
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
      await sendFeedback(file, prediction.top_prediction.label, correctLabel);
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
      await sendFeedback(file, prediction.top_prediction.label, label);
      finalize();
    } catch {
      showToast("Feedback failed. Try again.", "error");
    }
    setFeedbackLoading(false);
  };

  const isUncertain = prediction?.status === "uncertain";
  const isConfident = prediction?.status === "ok";
  const topLabel = prediction?.top_prediction.label ?? "";
  const topMeta = LABEL_META[topLabel] ?? DEFAULT_META;
  const allScores = prediction?.all_scores
    ? Object.entries(prediction.all_scores).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 max-w-[90vw] ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <ScanLine className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-none">SAAF AI</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Hospital Waste Classifier</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
            Live
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex flex-col gap-4 sm:gap-6">

        {/* ── Camera Card ── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative bg-gray-900 aspect-video w-full overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image} alt="Captured" className="w-full h-full object-contain" />
            ) : !isMobile ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Camera className="w-10 h-10 opacity-30" />
                <p className="text-sm opacity-50">No image captured</p>
              </div>
            )}

            {cameraOpen && !image && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 border border-white/20 rounded-xl" />
                <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
                <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
                <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
                <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 flex items-center justify-between gap-3 border-t border-gray-100">
            {isMobile ? (
              <label className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer transition-all">
                <Camera className="w-4 h-4" />
                {image ? "Retake Photo" : "Open Camera"}
                <input type="file" accept="image/*" capture="environment" onChange={handleMobileCapture} hidden />
              </label>
            ) : (
              <>
                <button
                  onClick={openLaptopCamera}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  {cameraOpen ? "Restart" : "Open Webcam"}
                </button>
                <button
                  onClick={takePhoto}
                  disabled={!cameraOpen}
                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${
                    cameraOpen
                      ? "border-gray-300 bg-white hover:border-gray-400 shadow-md"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full transition-colors ${cameraOpen ? "bg-red-500" : "bg-gray-300"}`} />
                </button>
              </>
            )}

            {image && (
              <button
                onClick={() => { setImage(null); setFile(null); resetStates(); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ── Predict Button ── */}
        {image && !prediction && (
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-base py-4 rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="animate-spin w-5 h-5" />Analysing waste...</>
            ) : (
              <><ScanLine className="w-5 h-5" />Classify Waste</>
            )}
          </button>
        )}

        {/* ── Results ── */}
        {prediction && (
          <div className="flex flex-col gap-4">

            {/* ── UNCERTAIN ── */}
            {isUncertain && !responseFinalized && !showFeedback && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-amber-50 px-4 sm:px-5 py-4 flex items-start gap-3 border-b border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Low confidence result</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      The model is unsure. Please confirm the correct category below.
                    </p>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Which is it?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[prediction.top_prediction, prediction.second_prediction].map((p) => {
                      const m = LABEL_META[p.label] ?? DEFAULT_META;
                      return (
                        <button
                          key={p.label}
                          disabled={feedbackLoading}
                          onClick={() => chooseSuggestedLabel(p.label)}
                          className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 ${m.border} ${m.bg} hover:shadow-md active:scale-95 transition-all disabled:opacity-50`}
                        >
                          {feedbackLoading
                            ? <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                            : <span className="text-2xl">{m.icon}</span>
                          }
                          <span className={`text-sm font-semibold capitalize text-center ${m.color}`}>{p.label}</span>
                          <span className="text-xs text-gray-400">{Math.round(p.confidence * 100)}% likely</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Escape hatch — neither suggestion is correct */}
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 text-xs font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]"
                  >
                    ✗ Neither — pick correct category
                  </button>
                </div>
              </div>
            )}

            {/* ── CONFIDENT ── */}
            {isConfident && (
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${topMeta.border}`}>

                {/* Result banner — stacks on mobile */}
                <div className={`${topMeta.bg} px-4 sm:px-5 py-4 sm:py-5`}>
                  <div className="flex items-start gap-3 sm:gap-4">

                    {/* Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border ${topMeta.border} flex items-center justify-center text-2xl sm:text-3xl bg-white shadow-sm shrink-0`}>
                      {topMeta.icon}
                    </div>

                    {/* Label + bin — fills remaining space */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Detected waste type
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold capitalize leading-tight mt-0.5 ${topMeta.color}`} style={{ fontFamily: "var(--font-dm-mono)" }}>
                        {topLabel}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">{topMeta.bin}</span>
                      </p>
                    </div>

                  </div>

                  {/* Confidence — always its own row below on all screen sizes for clarity */}
                  <div className={`mt-3 pt-3 border-t ${topMeta.border} flex items-baseline gap-2`}>
                    <p className={`text-4xl font-extrabold leading-none ${topMeta.color}`} style={{ fontFamily: "var(--font-dm-mono)" }}>
                      {Math.round(prediction.top_prediction.confidence * 100)}%
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontFamily: "var(--font-dm-mono)" }}>confidence</p>
                  </div>
                </div>

                {/* Score breakdown */}
                {allScores.length > 0 && (
                  <div className="px-4 sm:px-5 py-4 border-t border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">All scores</p>
                    <div className="flex flex-col gap-2">
                      {allScores.map(([label, value]) => (
                        <ConfidenceBar key={label} label={label} value={value} isTop={label === topLabel} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Feedback prompt ── */}
            {!responseFinalized && isConfident && !showFeedback && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-700 mb-1">Is this correct?</p>
                <p className="text-xs text-gray-400 mb-4">Your feedback helps improve the model.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleYes}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                  >
                    ✓ Yes, correct
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-all"
                  >
                    ✗ No, fix it
                  </button>
                </div>
              </div>
            )}

            {/* ── Feedback form ── */}
            {showFeedback && !responseFinalized && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <p className="text-sm font-semibold text-gray-700 mb-1">Select correct category</p>
                <p className="text-xs text-gray-400 mb-4">Tap the correct waste type to submit feedback.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {FEEDBACK_LABELS.map((label) => {
                    const m = LABEL_META[label] ?? DEFAULT_META;
                    const selected = correctLabel === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setCorrectLabel(label)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium capitalize transition-all active:scale-95 ${
                          selected
                            ? `${m.border} ${m.bg} ${m.color}`
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
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
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  {feedbackLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  Submit Feedback
                </button>
              </div>
            )}

            {/* ── Finalized ── */}
            {responseFinalized && (
              <div className="flex flex-col items-center gap-3 bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-sm text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="text-sm font-semibold text-gray-700">Response recorded</p>
                <p className="text-xs text-gray-400">Thank you for helping improve MedScan AI.</p>
                <button
                  onClick={() => { setImage(null); setFile(null); resetStates(); }}
                  className="mt-1 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan another item
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