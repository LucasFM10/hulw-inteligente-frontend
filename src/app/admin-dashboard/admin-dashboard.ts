import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  data_insercao: string;
  status_busca_ativa: StatusBuscaAtiva;
}

// ── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_PACIENTES: PacienteFila[] = [
  {
    id: '1',
    nome_completo: 'Maria das Graças Oliveira',
    cpf_mascarado: '***.***.***-82',
    procedimento_indicado: 'Colecistectomia Laparoscópica',
    data_insercao: '2025-01-15',
    status_busca_ativa: 'CONFIRMADO_PACIENTE',
  },
  {
    id: '2',
    nome_completo: 'João Pedro Almeida',
    cpf_mascarado: '***.***.***-44',
    procedimento_indicado: 'Herniorrafia Inguinal',
    data_insercao: '2025-02-03',
    status_busca_ativa: 'PENDENTE_BUSCA_ATIVA',
  },
  {
    id: '3',
    nome_completo: 'Ana Sofia Rodrigues',
    cpf_mascarado: '***.***.***-11',
    procedimento_indicado: 'Apendicectomia',
    data_insercao: '2025-02-18',
    status_busca_ativa: 'PENDENTE_BUSCA_ATIVA',
  },
  {
    id: '4',
    nome_completo: 'Carlos Eduardo Mendes',
    cpf_mascarado: '***.***.***-77',
    procedimento_indicado: 'Artroscopia do Joelho',
    data_insercao: '2025-03-01',
    status_busca_ativa: 'CANCELADO_PACIENTE',
  },
  {
    id: '5',
    nome_completo: 'Fernanda Costa Lima',
    cpf_mascarado: '***.***.***-29',
    procedimento_indicado: 'Tireoidectomia Total',
    data_insercao: '2025-03-05',
    status_busca_ativa: 'PENDENTE_BUSCA_ATIVA',
  },
];

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  private readonly filaService = inject(FilaService);
  private readonly authService = inject(AdminAuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado da tabela ──────────────────────────────────────────────────────
  readonly pacientes: PacienteFila[] = MOCK_PACIENTES;
  sidebarOpen = false;

  // ── URL base para os links gerados ────────────────────────────────────────
  baseUrl = CONFIG.PORTAL_URL;

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
    this.filaService.gerarLoteBuscaAtiva(this.baseUrl).subscribe({
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
