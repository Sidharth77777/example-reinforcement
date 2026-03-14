export type PredictionLabel = "biomedical" | "food" | "paper" | "plastic" | "mixed waste"

export type PredictionResult = {
  label: PredictionLabel
  confidence: number
}

export type AllScores = Record<PredictionLabel, number>

export type ConfidentPrediction = {
  status: "ok"
  top_prediction: PredictionResult
  "others_above_0.7": Record<string, number>
  all_scores: AllScores
}

export type UncertainPrediction = {
  status: "uncertain"
  message: string
  top_prediction: PredictionResult
  second_prediction: PredictionResult
  all_scores: AllScores
}

export type PredictResponse = ConfidentPrediction | UncertainPrediction

// ─── Label metadata ───────────────────────────────────────────────────────────
export const LABEL_META: Record<
  string,
  { color: string; bg: string; border: string; icon: string; bin: string }
> = {
  biomedical: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🧬",
    bin: "Red Biohazard Bin",
  },
  food: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "🥗",
    bin: "Organic / Food Waste Bin",
  },
  paper: {
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "📄",
    bin: "Blue Recycling Bin",
  },
  plastic: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "♻️",
    bin: "Green Recycling Bin",
  },
  "mixed waste": {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "🗑️",
    bin: "General / Mixed Waste Bin",
  },
};

export const DEFAULT_META = {
  color: "text-gray-600",
  bg: "bg-gray-50",
  border: "border-gray-200",
  icon: "❓",
  bin: "Unknown",
};

export const FEEDBACK_LABELS: PredictionLabel[] = [
  "biomedical",
  "food",
  "paper",
  "plastic",
  "mixed waste",
];