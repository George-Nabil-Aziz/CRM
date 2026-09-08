import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Sends signed-out visitors to /login, remembering where they were headed.
 *
 * This is a routing convenience, not a security control — the API behind these pages is
 * anonymous, so the data is reachable without ever loading the app. See auth.service.ts.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSignedIn) return true;

  return router.createUrlTree(['/login'], {
    queryParams: state.url === '/' ? {} : { returnUrl: state.url },
  });
};

/** Keeps a signed-in user off /login and /signup. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isSignedIn ? router.createUrlTree(['/']) : true;
};
