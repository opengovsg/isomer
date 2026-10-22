import supportedBrowsers from "~/utils/supportedBrowsers"

export const UNSUPPORTED_BROWSER_BANNER_ID = "unsupported-browser-banner"
export const DISMISSED_STORAGE_KEY = "unsupported-browser-banner-dismissed"

// Inlined into the static HTML so the banner works in browsers that cannot
// parse the main bundle (and so never hydrate). Must stay ES5.
// sessionStorage access is wrapped as it throws in some private modes.
export const UNSUPPORTED_BROWSER_BANNER_SCRIPT = `(function () {
  var banner = document.getElementById(${JSON.stringify(UNSUPPORTED_BROWSER_BANNER_ID)});
  if (!banner) {
    return;
  }

  var storageKey = ${JSON.stringify(DISMISSED_STORAGE_KEY)};
  try {
    if (sessionStorage.getItem(storageKey) === "true") {
      return;
    }
  } catch (e) {}

  var userAgent = navigator.userAgent;
  if (!userAgent || new RegExp(${JSON.stringify(supportedBrowsers.source)}).test(userAgent)) {
    return;
  }

  banner.hidden = false;

  var button = banner.getElementsByTagName("button")[0];
  if (!button) {
    return;
  }
  button.onclick = function () {
    banner.hidden = true;
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch (e) {}
  };
})();`
