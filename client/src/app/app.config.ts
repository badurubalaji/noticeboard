import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),
    // Service worker disabled — for an internal-network app where admins
    // rebuild and redeploy often, the SW's aggressive asset caching causes
    // "I see old CSS / old code after a rebuild" confusion that outweighs
    // the offline-cache benefit on kiosks (which are always online anyway).
    // Re-enable by changing the flag below to `true` once asset turnover
    // settles down.
    provideServiceWorker('ngsw-worker.js', { enabled: false }),
  ],
};
