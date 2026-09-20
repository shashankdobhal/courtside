"use client";

import { useEffect } from "react";

/**
 * Registers the service worker unconditionally on load, independent of the
 * push-notification opt-in. Chrome's install/"Add to Home Screen" prompt
 * requires an active service worker registration covering the manifest's
 * start_url — waiting until someone opts into push would leave the site
 * uninstallable for everyone who hasn't.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
