import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from './admin-auth.service';

/**
 * Interceptor funcional que anexa o token JWT de administrador
 * no cabeçalho "Authorization: Bearer <token>" para todas as
 * requisições cujas URLs contenham "/api/admin".
 *
 * Rotas de pacientes (ex: /fila, /atualizar) não são afetadas.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Aplica apenas para rotas do painel administrativo
  if (!req.url.includes('/api/admin')) {
    return next(req);
  }

  const authService = inject(AdminAuthService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authReq);
};
