import axios from "axios"

const SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_API

export const checkServerHealth = async () => {
  try {
    const response = await axios.get(SERVER_URL!)
    console.log(response.data)
  } catch (error) {
    console.error("Health check failed:", error)
  }
}

export const predictImage = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const res = await axios.post(`${SERVER_URL}/predict`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  return res.data
}

export const sendFeedback = async (
  file: File,
  predicted_label: string,
  corrected_label: string
) => {

  const formData = new FormData()

  formData.append("file", file)
  formData.append("predicted_label", predicted_label)
  formData.append("corrected_label", corrected_label)

  const res = await axios.post(`${SERVER_URL}/feedback`, formData)

  return res.data
}