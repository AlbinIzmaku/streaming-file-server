export function getMimeType(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    pdf: "application/pdf",
  };
  return map[ext] || "application/octet-stream";
}

export function isAllowedExtension(fileName) {
  const allowed = ["mp4", "mp3", "pdf"];
  const ext = fileName.split(".").pop().toLowerCase();
  return allowed.includes(ext);
}
