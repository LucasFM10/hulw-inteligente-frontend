import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

const CONFIG = {
  API_URL: 'http://localhost:8000'
};

@Component({
  selector: 'app-confirmar-cirurgia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-cirurgia.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f8fafc;
    }
  `]
})
export class ConfirmarCirurgiaComponent implements OnInit {
  token: string | null = null;
  detalhes: any = null;
  loading = true;
  erro = '';
  
  // Estado da tela
  telaAtual: 'CARREGANDO' | 'ERRO' | 'DETALHES' | 'CONFIRMAR_RECUSA' | 'SUCESSO_CONFIRMADO' | 'SUCESSO_RECUSADO' = 'CARREGANDO';

  // Formulário de recusa
  motivoSelecionado = '';
  motivoOutro = '';

  motivosSugeridos = [
    'não posso comparecer nesta data',
    'não estou em condições clínicas',
    'já realizei a cirurgia em outro local',
    'não desejo mais realizar a cirurgia',
    'outro'
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.erro = 'Link inválido. O token de acesso não foi encontrado.';
        this.telaAtual = 'ERRO';
        this.loading = false;
        return;
      }
      this.carregarDetalhes();
    });
  }

  carregarDetalhes() {
    this.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    
    this.http.get<any>(`${CONFIG.API_URL}/api/paciente/confirmar-cirurgia/detalhes`, { headers }).subscribe({
      next: (data) => {
        this.detalhes = data;
        
        if (this.detalhes.status_item !== 'AGUARDANDO_CONFIRMACAO') {
          this.erro = 'Esta cirurgia já foi confirmada ou cancelada anteriormente.';
          this.telaAtual = 'ERRO';
        } else {
          this.telaAtual = 'DETALHES';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.telaAtual = 'ERRO';
        if (err.status === 401) {
          this.erro = err.error?.detail || 'Link expirado ou inválido. Por favor, entre em contato com o hospital.';
        } else if (err.status === 404) {
          this.erro = 'Agendamento não encontrado. Ele pode ter sido cancelado pelo hospital.';
        } else {
          this.erro = 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.';
        }
      }
    });
  }

  confirmar() {
    this.enviarResposta(true);
  }

  abrirRecusa() {
    this.telaAtual = 'CONFIRMAR_RECUSA';
  }

  voltarDetalhes() {
    this.telaAtual = 'DETALHES';
    this.motivoSelecionado = '';
    this.motivoOutro = '';
  }

  confirmarRecusa() {
    if (!this.motivoSelecionado) {
      alert('Por favor, selecione um motivo.');
      return;
    }
    const motivoFinal = this.motivoSelecionado === 'outro' ? this.motivoOutro : this.motivoSelecionado;
    if (this.motivoSelecionado === 'outro' && !this.motivoOutro.trim()) {
      alert('Por favor, descreva o motivo.');
      return;
    }

    this.enviarResposta(false, motivoFinal);
  }

  private enviarResposta(aceita: boolean, motivo_recusa?: string) {
    this.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    const body = {
      aceita,
      motivo_recusa: motivo_recusa || null
    };

    this.http.post<any>(`${CONFIG.API_URL}/api/paciente/confirmar-cirurgia/responder`, body, { headers }).subscribe({
      next: () => {
        this.loading = false;
        this.telaAtual = aceita ? 'SUCESSO_CONFIRMADO' : 'SUCESSO_RECUSADO';
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.detail || 'Erro ao registrar resposta. Tente novamente.');
      }
    });
  }
}
