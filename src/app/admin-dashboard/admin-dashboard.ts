import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilaService } from '../fila.service';
import { AdminAuthService } from '../admin-auth.service';
import { CONFIG } from '../constants';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ── Tipagens ─────────────────────────────────────────────────────────────────

export type StatusBuscaAtiva =
  | 'PENDENTE'
  | 'MENSAGEM_ENVIADA'
  | 'CONFIRMADO_PACIENTE'
  | 'CANCELADO_PACIENTE';

export type StatusFila = 'ATIVO' | 'INATIVO' | 'REMOVIDO' | 'REINTEGRADO';
export type PrioridadeFila = 'SEM' | 'ONC' | 'BRE';

export interface FilaAdminResponse {
  id: string;
  paciente_nome: string;
  prontuario: string | null;
  telefone: string;
  especialidade: string | null;
  procedimento: string | null;
  medico: string | null;
  prioridade: PrioridadeFila;
  medida_judicial: boolean;
  status_busca_ativa: StatusBuscaAtiva;
  status_fila: StatusFila;
  ativo: boolean;
  data_entrada: string;
  tempo_espera_dias: number;
}

export interface FilaAdminResumo {
  total: number;
  ativos: number;
  pendentes: number;
  mensagem_enviada: number;
  confirmados: number;
  cancelados: number;
  oncologicos: number;
  medida_judicial: number;
}

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly filaService = inject(FilaService);
  private readonly authService = inject(AdminAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado da tabela ──────────────────────────────────────────────────────
  pacientes: FilaAdminResponse[] = [];
  resumo: FilaAdminResumo | null = null;
  isLoadingPacientes = true;
  sidebarOpen = false;

  // Filtros
  filtroStatusBusca: string = '';
  filtroStatusFila: string = 'ATIVO';

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarPacientes();
  }

  carregarResumo(): void {
    this.filaService.getFilaResumo().subscribe({
      next: (dados) => {
        this.resumo = dados;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar resumo:', erro);
      }
    });
  }

  carregarPacientes(): void {
    this.isLoadingPacientes = true;
    
    const filtros: any = {};
    if (this.filtroStatusBusca) filtros.status_busca = this.filtroStatusBusca;
    if (this.filtroStatusFila) filtros.status_fila = this.filtroStatusFila;

    this.filaService.getFilaAdmin(filtros).subscribe({
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

  aplicarFiltros(): void {
    this.carregarPacientes();
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
        // Atualiza a tabela e resumo logo após gerar lote
        this.carregarResumo();
        this.carregarPacientes();
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

  // ── Helpers de UI ─────────────────────────────────────────────────────────
  badgeClasses(status: StatusBuscaAtiva): string {
    const map: Record<StatusBuscaAtiva, string> = {
      CONFIRMADO_PACIENTE: 'bg-green-100 text-green-800 ring-green-600/20',
      PENDENTE: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
      CANCELADO_PACIENTE: 'bg-red-100 text-red-800 ring-red-600/20',
      MENSAGEM_ENVIADA: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    };
    return map[status] || 'bg-slate-100 text-slate-800 ring-slate-600/20';
  }

  badgeLabel(status: StatusBuscaAtiva): string {
    const map: Record<StatusBuscaAtiva, string> = {
      CONFIRMADO_PACIENTE: 'Confirmado',
      PENDENTE: 'Pendente',
      CANCELADO_PACIENTE: 'Cancelado',
      MENSAGEM_ENVIADA: 'Msg Enviada',
    };
    return map[status] || status;
  }
}
