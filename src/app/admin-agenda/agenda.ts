import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CONFIG } from '../constants';

export interface SalaCirurgica {
  id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  ativa: boolean;
}

export interface Profissional {
  id: string;
  matricula?: string;
  nome: string;
  especialidade_id?: string;
}

export interface AgendaCirurgica {
  id: string;
  ano: number;
  mes: number;
  especialidade_id?: string;
  especialidade_nome?: string;
  status: string;
  observacoes?: string;
  sessoes?: SessaoCirurgica[];
}

export interface SessaoCirurgica {
  id: string;
  agenda_id: string;
  data: string;
  turno: string;
  sala_id?: string;
  responsavel_id?: string;
  status: string;
  observacoes?: string;
  sala_nome?: string;
  itens?: ItemAgendaCirurgica[];
}

export interface ItemAgendaCirurgica {
  id: string;
  sessao_id: string;
  entrada_fila_id: string;
  horario_inicio?: string;
  horario_fim?: string;
  ordem?: number;
  sala_id?: string;
  medico_id?: string;
  status: string;
  motivo_cancelamento?: string;
  observacoes?: string;
  paciente_nome?: string;
  procedimento?: string;
  medico_nome?: string;
  sala_nome?: string;
  prioridade?: string;
  medida_judicial?: boolean;
}

export interface EntradaFilaElegivel {
  id: string;
  paciente_nome: string;
  prontuario?: string;
  telefone: string;
  especialidade?: string;
  procedimento?: string;
  medico?: string;
  prioridade: string;
  medida_judicial: boolean;
  data_entrada: string;
  tempo_espera_dias: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private http = inject(HttpClient);
  private apiUrl = `${CONFIG.API_URL}/admin/agendas`;

  // --- Endpoints Básicos ---
  listarAgendas(filtros?: any): Observable<AgendaCirurgica[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) params = params.set(key, filtros[key]);
      });
    }
    return this.http.get<AgendaCirurgica[]>(this.apiUrl, { params });
  }

  obterAgenda(id: string): Observable<AgendaCirurgica> {
    return this.http.get<AgendaCirurgica>(`${this.apiUrl}/${id}`);
  }

  criarAgenda(payload: Partial<AgendaCirurgica>): Observable<AgendaCirurgica> {
    return this.http.post<AgendaCirurgica>(this.apiUrl, payload);
  }

  atualizarAgenda(id: string, payload: Partial<AgendaCirurgica>): Observable<AgendaCirurgica> {
    return this.http.patch<AgendaCirurgica>(`${this.apiUrl}/${id}`, payload);
  }

  // --- Regras de Negócio Agenda ---
  consolidarAgenda(id: string): Observable<AgendaCirurgica> {
    return this.http.patch<AgendaCirurgica>(`${this.apiUrl}/${id}/consolidar`, {});
  }

  cancelarAgenda(id: string, payload: { observacoes?: string }): Observable<AgendaCirurgica> {
    return this.http.patch<AgendaCirurgica>(`${this.apiUrl}/${id}/cancelar`, payload);
  }

  // --- Endpoints Básicos Sessões ---
  criarSessao(agendaId: string, payload: Partial<SessaoCirurgica>): Observable<SessaoCirurgica> {
    return this.http.post<SessaoCirurgica>(`${this.apiUrl}/${agendaId}/sessoes`, payload);
  }

  atualizarSessao(sessaoId: string, payload: Partial<SessaoCirurgica>): Observable<SessaoCirurgica> {
    return this.http.patch<SessaoCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}`, payload);
  }

  removerSessao(sessaoId: string): Observable<any> {
    return this.http.delete(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}`);
  }

  consolidarSessao(sessaoId: string): Observable<SessaoCirurgica> {
    return this.http.patch<SessaoCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/consolidar`, {});
  }

  cancelarSessao(sessaoId: string, payload: { observacoes?: string }): Observable<SessaoCirurgica> {
    return this.http.patch<SessaoCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/cancelar`, payload);
  }

  // --- Itens da Sessão ---
  adicionarItem(sessaoId: string, payload: Partial<ItemAgendaCirurgica>): Observable<ItemAgendaCirurgica> {
    return this.http.post<ItemAgendaCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens`, payload);
  }

  atualizarItem(sessaoId: string, itemId: string, payload: Partial<ItemAgendaCirurgica>): Observable<ItemAgendaCirurgica> {
    return this.http.patch<ItemAgendaCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens/${itemId}`, payload);
  }

  removerItem(sessaoId: string, itemId: string): Observable<any> {
    return this.http.delete(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens/${itemId}`);
  }

  // --- Elegibilidade ---
  listarElegiveis(filtros?: any): Observable<EntradaFilaElegivel[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.especialidade_id) params = params.set('especialidade_id', filtros.especialidade_id);
    }
    return this.http.get<EntradaFilaElegivel[]>(`${CONFIG.API_URL}/admin/agenda/elegiveis`, { params });
  }

  // --- Fase 4: Substitutos ---
  listarSubstitutos(sessaoId: string, itemId: string): Observable<EntradaFilaElegivel[]> {
    return this.http.get<EntradaFilaElegivel[]>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens/${itemId}/substitutos`);
  }

  substituirItem(sessaoId: string, itemId: string, novaEntradaFilaId: string): Observable<ItemAgendaCirurgica> {
    return this.http.post<ItemAgendaCirurgica>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens/${itemId}/substituir`, {
      nova_entrada_fila_id: novaEntradaFilaId
    });
  }

  // --- Fase 5: Confirmação ---
  enviarLinkConfirmacao(sessaoId: string, itemId: string): Observable<{mensagem: string, link: string}> {
    return this.http.post<{mensagem: string, link: string}>(`${CONFIG.API_URL}/admin/sessoes/${sessaoId}/itens/${itemId}/enviar-confirmacao`, {});
  }

  // --- Auxiliares ---
  listarSalas(): Observable<SalaCirurgica[]> {
    return this.http.get<SalaCirurgica[]>(`${CONFIG.API_URL}/admin/salas-cirurgicas`);
  }

  listarProfissionais(): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${CONFIG.API_URL}/admin/profissionais`);
  }

  listarEspecialidades(): Observable<any[]> {
    return this.http.get<any[]>(`${CONFIG.API_URL}/admin/especialidades`);
  }
}
