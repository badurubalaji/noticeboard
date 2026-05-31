import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// One-time cleanup for kiosks that registered a service worker from a
// previous build. The app no longer ships a worker; this removes the
// stale registration and clears its caches so the next refresh fetches
// fresh assets every time. Safe to leave in place permanently — it's
// a no-op once the SW is gone.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {/* ignore — kiosks in private browsing, etc. */});
  if (typeof caches !== 'undefined' && caches?.keys) {
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .catch(() => {});
  }
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
