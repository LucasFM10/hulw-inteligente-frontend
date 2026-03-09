import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AdminAuthService } from './admin-auth.service';

/**
 * Guard funcional que protege as rotas do painel administrativo.
 *
 * Uso nas rotas:
 *   { path: 'admin/dashboard', component: AdminDashboard, canActivate: [adminAuthGuard] }
 *
 * Comportamento:
 *   - Autenticado (token presente) → acesso liberado (true)
 *   - Não autenticado              → redireciona para /login e bloqueia (false)
 */
export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redireciona para a tela de login e bloqueia acesso à rota solicitada
  return router.createUrlTree(['/login']);
};
