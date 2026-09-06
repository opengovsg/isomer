const VICA_LAUNCHER_STYLE = {
  cursor: "pointer",
  display: "block",
  visibility: "visible",
  height: "55px",
  width: "55px",
  position: "fixed",
  bottom: "40px",
  right: "40px",
  zIndex: 9999,
  transform: "translateZ(0)",
} as const

const VICA_BUTTON_STYLE = {
  borderRadius: "50%",
  height: "55px",
  width: "55px",
  touchAction: "none",
} as const

const VICA_IMAGE_STYLE = {
  height: "55px",
  width: "55px",
} as const

export const VicaWidget = () => {
  return (
    <div id="webchat-container">
      <div style={VICA_LAUNCHER_STYLE}>
        <div style={VICA_BUTTON_STYLE}>
          <img
            style={VICA_IMAGE_STYLE}
            alt="Bot Launcher"
            src="https://bucket-common.vica.gov.sg/unified_webchat_image_launcher.webp"
          />
        </div>
      </div>
    </div>
  )
}
