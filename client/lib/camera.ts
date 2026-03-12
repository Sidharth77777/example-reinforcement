export const detectMobile = () => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const startCamera = async (videoRef:any) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }
};

export const captureImage = (videoRef:any, canvasRef:any) => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL("image/png");
};