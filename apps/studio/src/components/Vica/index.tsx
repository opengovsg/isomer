/* oxlint-disable next/no-img-element -- studio lint cleanup */
const VICA_LAUNCHER_STYLE = {
  bottom: "40px",
  cursor: "pointer",
  display: "block",
  height: "55px",
  position: "fixed",
  right: "40px",
  transform: "translateZ(0)",
  visibility: "visible",
  width: "55px",
  zIndex: 9999,
} as const

const VICA_BUTTON_STYLE = {
  borderRadius: "50%",
  height: "55px",
  touchAction: "none",
  width: "55px",
} as const

const VICA_IMAGE_STYLE = {
  height: "55px",
  width: "55px",
} as const

export const VicaWidget = () => (
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
