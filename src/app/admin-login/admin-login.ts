import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginComponent {
  private readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();

  email = '';
  password = '';

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? 'Erro ao conectar com o servidor.';
        this.errorMessage.set(detail);
        this.isLoading.set(false);
      },
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
