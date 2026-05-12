export function fallbackCopyToClipboard(text: string) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.setAttribute("readonly", "")
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  document.body.appendChild(textArea)
  textArea.select()
  try { document.execCommand("copy") } finally { document.body.removeChild(textArea) }
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => fallbackCopyToClipboard(text))
  else fallbackCopyToClipboard(text)
}
