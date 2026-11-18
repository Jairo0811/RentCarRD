import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Rol } from './auth.service';

/**
 * Guard de autenticación y autorización de navegación.
 *
 * Uso: `canActivate: [authGuard]` y, opcionalmente, `data: { roles: ['admin'] }`.
 * Es un control de experiencia de usuario: la protección real la aplica la API
 * (cada endpoint valida JWT, rol y estado del empleado).
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    auth.logout();
    return router.createUrlTree(['/login']);
  }

  const roles = route.data?.['roles'] as Rol[] | undefined;
  const rol = auth.rol();
  if (roles?.length && (!rol || !roles.includes(rol))) {
    return router.createUrlTree([auth.inicio()]);
  }

  return true;
};

/** Evita mostrar el login a quien ya tiene una sesión válida. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree([auth.inicio()]) : true;
};

/** Redirección de la raíz según la sesión. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.isAuthenticated() ? auth.inicio() : '/login']);
};
