import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CONFIG } from './constants';

// ── Tipagens ─────────────────────────────────────────────────────────────────

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const API_BASE = CONFIG.API_URL;
const TOKEN_KEY = 'admin_access_token';
const USER_EMAIL_KEY = 'admin_user_email';

// ── Serviço ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Estado reativo do e-mail do usuário logado (null = não autenticado). */
  private readonly _currentUserEmail$ = new BehaviorSubject<string | null>(
    localStorage.getItem(USER_EMAIL_KEY)
  );
  readonly currentUserEmail$ = this._currentUserEmail$.asObservable();

  // ── Métodos públicos ────────────────────────────────────────────────────────

  /**
   * Autentica o administrador contra o backend.
   * Em caso de sucesso, armazena o token e emite o estado do usuário.
   */
  login(credentials: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${API_BASE}/api/admin/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.access_token);
          localStorage.setItem(USER_EMAIL_KEY, response.email);
          this._currentUserEmail$.next(response.email);
        })
      );
  }

  /**
   * Encerra a sessão: limpa o armazenamento e redireciona para /login.
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    this._currentUserEmail$.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Retorna o token JWT armazenado, ou null se não houver sessão.
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Indica se existe um token armazenado (sessão ativa).
   * Nota: não valida a expiração do token no cliente.
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
