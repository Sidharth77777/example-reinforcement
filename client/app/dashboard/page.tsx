"use client";

import { useEffect, useRef, useState } from "react";
import { detectMobile, startCamera, captureImage } from "@/lib/camera";
import { predictImage, sendFeedback } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { PredictResponse } from "@/types/prediction"

export default function Dashboard() {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [prediction, setPrediction] = useState<PredictResponse | null>(null)

  const [showFeedback, setShowFeedback] = useState(false)
  const [correctLabel, setCorrectLabel] = useState("")

  const [thankYouMessage, setThankYouMessage] = useState("")
  const [responseFinalized, setResponseFinalized] = useState(false)

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  const showThankYou = () => {
    setThankYouMessage("Thank you for your response!")
    setTimeout(() => {
      setThankYouMessage("")
    }, 3000)
  }

  const resetStates = () => {
    setPrediction(null)
    setShowFeedback(false)
    setCorrectLabel("")
    setResponseFinalized(false)
  }

  const openLaptopCamera = async () => {
    resetStates()
    await startCamera(videoRef);
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraOpen) return;

    resetStates()

    const img = captureImage(videoRef, canvasRef);
    setImage(img);

    const blob = await fetch(img).then(res => res.blob())
    const fileObj = new File([blob], "capture.png", { type: "image/png" })

    setFile(fileObj)
  };

  const handleMobileCapture = (event:any) => {

    resetStates()

    const file = event.target.files[0];

    if (file) {
      setFile(file)
      const url = URL.createObjectURL(file)
      setImage(url)
    }
  };

 const handlePredict = async () => {

  if (!file) return

  setLoading(true)

  try {

    const res = await predictImage(file)

    console.log("Prediction result:", res)

    setPrediction(res)

  } catch (error) {

    console.error("Prediction failed:", error)

    alert("Prediction failed.")

  }

  setLoading(false)
}

  const handleYes = () => {
    setShowFeedback(false)
    setResponseFinalized(true)
    showThankYou()
  }

  const handleNo = () => {
    setShowFeedback(true)
  }

  const submitFeedback = async () => {

  if (!file || !prediction) return
  setFeedbackLoading(true)

  try {

    await sendFeedback(
      file,
      prediction.top_prediction.label,
      correctLabel
    )

    setResponseFinalized(true)
    showThankYou()

  } catch (error) {

    console.error("Feedback failed:", error)
    alert("Feedback failed")

  }

  setFeedbackLoading(false)
  setShowFeedback(false)
}

const chooseSuggestedLabel = async (label:string) => {

  if (!file || !prediction) return
  setFeedbackLoading(true)

  try {

    await sendFeedback(
      file,
      prediction.top_prediction.label,
      label
    )

    setResponseFinalized(true)
    showThankYou()

  } catch (err) {

    console.error(err)
    alert("Feedback failed")

  }

  setFeedbackLoading(false)
}

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Hospital AI Scanner
      </h1>

      <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-md flex flex-col items-center">

        {isMobile && (
          <label className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer mb-4 hover:bg-blue-700 transition">
            Open Camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleMobileCapture}
              hidden
            />
          </label>
        )}

        {!isMobile && (
          <>
            <button
              onClick={openLaptopCamera}
              className="bg-green-600 text-white px-6 py-3 rounded-lg mb-4 hover:bg-green-700 transition"
            >
              Open Webcam
            </button>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded-lg border mb-4"
              width="320"
            />

            <button
              onClick={takePhoto}
              disabled={!cameraOpen}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-400 flex items-center justify-center shadow-lg hover:scale-105 transition"
            >
              <div className={cameraOpen ? `w-12 h-12 bg-red-500 rounded-full` : ``}></div>
            </button>
          </>
        )}

        {image && (
          <div className="mt-6 flex flex-col items-center">

            <p className="text-gray-600 mb-2">Captured Image</p>

            <img
              src={image}
              className="rounded-lg border w-72"
            />

            {!prediction && (
              <button
                onClick={handlePredict}
                disabled={loading}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin w-4 h-4" />}
                {loading ? "Predicting..." : "Predict"}
              </button>
            )}

            {prediction && (
              <div className="mt-4 text-center">

                {"message" in prediction && !responseFinalized && (
                  <>
                    <p className="text-yellow-600 font-semibold">
                      {prediction.message}
                    </p>

                    <div className="flex gap-4 mt-4">

                      <button
                        disabled={feedbackLoading}
                        onClick={() => chooseSuggestedLabel(prediction.top_prediction.label)}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                      >
                        {feedbackLoading && <Loader2 className="animate-spin w-4 h-4" />}
                        {prediction.top_prediction.label}
                      </button>

                      <button
                        disabled={feedbackLoading}
                        onClick={() => chooseSuggestedLabel(prediction.second_prediction.label)}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                      >
                        {feedbackLoading && <Loader2 className="animate-spin w-4 h-4" />}
                        {prediction.second_prediction.label}
                      </button>

                    </div>
                  </>
                )}

                {!("message" in prediction) && (
                  <>
                    <p className="text-lg font-semibold">
                      Prediction: {prediction.top_prediction.label}
                    </p>

                    <p className="text-sm text-gray-500">
                      Confidence: {(prediction.top_prediction.confidence * 100).toFixed(2)}%
                    </p>
                  </>
                )}

                {!responseFinalized && (
                  <div className="flex gap-4 mt-4">

                    <button
                      onClick={handleYes}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Yes
                    </button>

                    <button
                      onClick={handleNo}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      No
                    </button>

                  </div>
                )}

                {thankYouMessage && (
                  <div className="mt-3 text-green-600 font-medium">
                    {thankYouMessage}
                  </div>
                )}

              </div>
            )}

            {showFeedback && !responseFinalized && (
              <div className="mt-4 flex flex-col gap-2">

                <select
                  value={correctLabel}
                  onChange={(e) => setCorrectLabel(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">Select correct label</option>
                  <option value="biomedical">Biomedical</option>
                  <option value="food">Food</option>
                  <option value="paper">Paper</option>
                  <option value="plastic">Plastic</option>
                </select>

                <button
                  disabled={feedbackLoading}
                  onClick={submitFeedback}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 justify-center"
                >
                  {feedbackLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  Submit Feedback
                </button>

              </div>
            )}

          </div>
        )}

      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

    </div>
  );
}