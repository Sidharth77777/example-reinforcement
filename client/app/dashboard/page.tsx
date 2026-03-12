"use client";

import { useEffect, useRef, useState } from "react";
import { detectMobile, startCamera, captureImage } from "@/lib/camera";
import { checkServerHealth, predictImage, sendFeedback } from "@/lib/api";

export default function Dashboard() {

  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);

  const [cameraOpen, setCameraOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)

  const [prediction, setPrediction] = useState<any>(null)

  const [showFeedback, setShowFeedback] = useState(false)
  const [correctLabel, setCorrectLabel] = useState("")

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  const openLaptopCamera = async () => {
    await startCamera(videoRef);
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraOpen) return;

    const img = captureImage(videoRef, canvasRef);
    setImage(img);

    const blob = await fetch(img).then(res => res.blob())
    const fileObj = new File([blob], "capture.png", { type: "image/png" })

    setFile(fileObj)
  };

  const handleMobileCapture = (event:any) => {

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

    alert("Prediction failed. Check console.")

  }

  setLoading(false)
}

  const handleYes = () => {
    setShowFeedback(false)
  }

  const handleNo = () => {
    setShowFeedback(true)
  }

  const submitFeedback = async () => {

  if (!file || !prediction) return

  try {

    const res = await sendFeedback(
      file,
      prediction.top_prediction.label,
      correctLabel
    )

    console.log("Feedback response:", res)

    alert("Feedback saved!")

  } catch (error) {

    console.error("Feedback failed:", error)

    alert("Feedback failed")

  }

  setShowFeedback(false)
}

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Hospital AI Scanner
      </h1>

      <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-md flex flex-col items-center">

        {/* MOBILE CAMERA */}
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

        {/* LAPTOP CAMERA */}
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

        {/* IMAGE PREVIEW */}
        {image && (
          <div className="mt-6 flex flex-col items-center">

            <p className="text-gray-600 mb-2">Captured Image</p>

            <img
              src={image}
              className="rounded-lg border w-72"
            />

            {/* PREDICT BUTTON */}
            {!prediction && (
              <button
                onClick={handlePredict}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
              >
                {loading ? "Predicting..." : "Predict"}
              </button>
            )}

            {/* RESULT */}
            {prediction && (
              <div className="mt-4 text-center">

                <p className="text-lg font-semibold">
                  Prediction: {prediction.top_prediction.label}
                </p>

                <p className="text-sm text-gray-500">
                  Confidence: {(prediction.top_prediction.confidence * 100).toFixed(2)}%
                </p>

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

              </div>
            )}

            {/* FEEDBACK */}
            {showFeedback && (
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
                  onClick={submitFeedback}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
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