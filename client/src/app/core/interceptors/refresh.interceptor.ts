import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshInFlight: Promise<string | null> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthCall = req.url.endsWith('/auth/login')
        || req.url.endsWith('/auth/register')
        || req.url.endsWith('/auth/refresh');

      if (err.status !== 401 || isAuthCall || !auth.getRefreshToken()) {
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refreshToken().finally(() => {
          refreshInFlight = null;
        });
      }

      return from(refreshInFlight).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            auth.logout();
            return throwError(() => err);
          }
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retried);
        }),
      );
    }),
  );
};
