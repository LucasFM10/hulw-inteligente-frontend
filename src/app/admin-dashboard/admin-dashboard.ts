import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilaService } from '../fila.service';
import { AdminAuthService } from '../admin-auth.service';
import { CONFIG } from '../constants';

// ── Tipagens ─────────────────────────────────────────────────────────────────

export type StatusBuscaAtiva =
  | 'PENDENTE_BUSCA_ATIVA'
  | 'CONFIRMADO_PACIENTE'
  | 'CANCELADO_PACIENTE';

export interface PacienteFila {
  id: string;
  nome_completo: string;
  cpf_mascarado: string;
  procedimento_indicado: string;
  data_insercao_fila: string;
  status_busca_ativa: StatusBuscaAtiva;
}

// ── Dados Mock removidos, fetching dinâmico implementado ──────────────

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly filaService = inject(FilaService);
  private readonly authService = inject(AdminAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado da tabela ──────────────────────────────────────────────────────
  pacientes: PacienteFila[] = [];
  isLoadingPacientes = true;
  sidebarOpen = false;

  ngOnInit(): void {
    this.carregarPacientes();
  }

  carregarPacientes(): void {
    this.isLoadingPacientes = true;
    this.filaService.getTodosPacientes().subscribe({
      next: (dados) => {
        this.pacientes = dados;
        this.isLoadingPacientes = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar pacientes:', erro);
        this.isLoadingPacientes = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  get totalNaFila(): number {
    return this.pacientes.length;
  }
  get totalPendentes(): number {
    return this.pacientes.filter(
      (p) => p.status_busca_ativa === 'PENDENTE_BUSCA_ATIVA'
    ).length;
  }
  get totalConfirmados(): number {
    return this.pacientes.filter(
      (p) => p.status_busca_ativa === 'CONFIRMADO_PACIENTE'
    ).length;
  }
  get totalCancelados(): number {
    return this.pacientes.filter(
      (p) => p.status_busca_ativa === 'CANCELADO_PACIENTE'
    ).length;
  }

  // ── Lote de busca ativa ───────────────────────────────────────────────────
  loteGerado: any[] = [];
  isLoading = false;

  gerarLote(): void {
    this.isLoading = true;
    this.filaService.gerarLoteBuscaAtiva(CONFIG.PORTAL_URL).subscribe({
      next: (resposta) => {
        this.loteGerado = resposta;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro na comunicação com a API do HULW:', erro);
        alert('Falha ao conectar com o servidor. Verifique se o FastAPI está rodando.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
  }

  // ── Badge helper ─────────────────────────────────────────────────────────
  badgeClasses(status: StatusBuscaAtiva): string {
    const map: Record<StatusBuscaAtiva, string> = {
      CONFIRMADO_PACIENTE:
        'bg-green-100 text-green-800 ring-green-600/20',
      PENDENTE_BUSCA_ATIVA:
        'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
      CANCELADO_PACIENTE:
        'bg-red-100 text-red-800 ring-red-600/20',
    };
    return map[status];
  }

  badgeLabel(status: StatusBuscaAtiva): string {
    const map: Record<StatusBuscaAtiva, string> = {
      CONFIRMADO_PACIENTE: 'Confirmado',
      PENDENTE_BUSCA_ATIVA: 'Pendente',
      CANCELADO_PACIENTE: 'Cancelado',
    };
    return map[status];
  }
}
