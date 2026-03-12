import axios from "axios"

const SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_API!

export const checkServerHealth = async () => {
  try {
    const response = await axios.get(SERVER_URL!)
    console.log(response.data)
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}

export const predictImage = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const res = await axios.post(`${SERVER_URL}/predict`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })

    return res.data
  } catch (error) {
    console.error("Image prediction failed:", error)
    throw error
  }
}

export const sendFeedback = async (
  file: File,
  predicted_label: string,
  corrected_label: string
) => {
  try {
    const formData = new FormData()
    formData.append("file", file)
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