import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  Observable,
  catchError,
  filter,
  finalize,
  map,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from '../auth.service';

let refreshInFlight: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  if (!request.url.startsWith('/api/') || request.url.endsWith('/auth/refresh')) {
    return next(request);
  }

  const authorized = withToken(request, auth.accessToken());
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      auth.logInterceptorEvent(`[Interceptor] 401 from ${request.url}; waiting for token refresh.`);
      if (!refreshInFlight) {
        auth.logInterceptorEvent('[Interceptor] Starting one shared POST /auth/refresh.');
        refreshInFlight = next(
          new HttpRequest('POST', '/auth/refresh', { refreshToken: 'demo-refresh-token' }),
        ).pipe(
          filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
          map((response) => (response.body as { accessToken: string }).accessToken),
          tap((token) => auth.setRefreshedToken(token)),
          finalize(() => {
            refreshInFlight = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refreshInFlight.pipe(switchMap((token) => next(withToken(request, token))));
    }),
  );
};

function withToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
