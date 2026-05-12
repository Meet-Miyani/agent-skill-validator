import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react"

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

interface PanelResizeConfig {
  leftMin?: number
  leftMax?: number
  rightMin?: number
  rightMax?: number
}

/**
 * Manages resizable left/right panel widths via pointer drag.
 * Returns widths, collapsed states, toggle helpers, and a resize handler.
 */
export function usePanelResize({
  leftMin = 220, leftMax = 420,
  rightMin = 240, rightMax = 460,
}: PanelResizeConfig = {}) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(288)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)

  const beginResize = useCallback(
    (panel: "left" | "right", event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const startX = event.clientX
      const startWidth = panel === "left" ? leftPanelWidth : rightPanelWidth
      document.body.classList.add("is-resizing-panel")

      const handleMove = (e: PointerEvent) => {
        const delta = e.clientX - startX
        if (panel === "left") setLeftPanelWidth(clamp(startWidth + delta, leftMin, leftMax))
        else setRightPanelWidth(clamp(startWidth - delta, rightMin, rightMax))
      }

      const stopResize = () => {
        document.body.classList.remove("is-resizing-panel")
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", stopResize)
      }

      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", stopResize)
    },
    [leftPanelWidth, rightPanelWidth, leftMin, leftMax, rightMin, rightMax],
  )

  return {
    leftPanelCollapsed, setLeftPanelCollapsed,
    rightPanelCollapsed, setRightPanelCollapsed,
    leftPanelWidth, rightPanelWidth,
    beginResize,
  }
}
