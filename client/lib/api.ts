import { PredictResponse } from "@/types/prediction"
import axios from "axios"

const SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_API!

// ─── Compress image for mobile (HEIC → JPEG, resize to 1024px max) ───────────
export const compressImage = (file: File, maxDim = 1024, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(new File([blob!], "capture.jpg", { type: "image/jpeg" })),
        "image/jpeg",
        quality
      )
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
// ─────────────────────────────────────────────────────────────────────────────

export const checkServerHealth = async () => {
  try {
    const response = await axios.get(SERVER_URL!)
    console.log(response.data)
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}

export const predictImage = async (file: File, isMobile = false): Promise<PredictResponse> => {
  const formData = new FormData()

  if (isMobile) {
    const compressed = await compressImage(file)
    formData.append("file", compressed)
  } else {
    formData.append("file", file)
  }

  const res = await axios.post(`${SERVER_URL}/predict`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return res.data
}

export const sendFeedback = async (
  file: File,
  predicted_label: string,
  corrected_label: string,
  isMobile = false
) => {
  try {
    const formData = new FormData()

    if (isMobile) {
      const compressed = await compressImage(file)
      formData.append("file", compressed)
    } else {
      formData.append("file", file)
    }

    formData.append("predicted_label", predicted_label)
    formData.append("corrected_label", corrected_label)

    const res = await axios.post(`${SERVER_URL}/feedback`, formData)
    return res.data
  } catch (error) {
    console.error("Sending feedback failed:", error)
    throw error
  }
}

export const getFeedbacks = async (adminUser: string, adminKey: string, page: number = 1, limit: number = 10) => {
  try {
    const res = await axios.get(`${SERVER_URL}/feedbacks`, {
      params: { page, limit },
      headers: {
        "admin-user": adminUser,
        "admin-key": adminKey,
      }
    })

    return res.data as {
      page: number
      limit: number
      count: number
      data: any[]
      total_pages: number
    }
  } catch (err: any) {
    console.error("Access denied:", err)
    throw err
  }
}