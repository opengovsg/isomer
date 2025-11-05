export const VicaWidget = () => {
  return (
    <div id="webchat-container">
      <div
        style={{
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
        }}
      >
        <div
          style={{
            borderRadius: "50%",
            height: "55px",
            width: "55px",
            touchAction: "none",
          }}
        >
          <img
            style={{
              height: "55px",
              width: "55px",
            }}
            alt="Bot Launcher"
            src="/assets/logos/VicaWidgetLogo.webp"
          />
        </div>
      </div>
    </div>
  )
}
