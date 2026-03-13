export type PredictionLabel = "biomedical" | "food" | "paper" | "plastic"

export type PredictionResult = {
  label: PredictionLabel
  confidence: number
}

export type ConfidentPrediction = {
  top_prediction: PredictionResult
  "others_above_0.7": Record<string, number>
}

export type UncertainPrediction = {
  message: string
  top_prediction: PredictionResult
  second_prediction: PredictionResult
}

export type PredictResponse = ConfidentPrediction | UncertainPrediction