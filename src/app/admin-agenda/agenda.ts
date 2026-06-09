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

export interface AgendaCirurgica {
  id: string;
  data: string;
  turno: string;
  especialidade_id?: string;
  sala_id?: string;
  responsavel_id?: string;
  status: string;
  observacoes?: string;
  sala_nome?: string;
  itens?: ItemAgendaCirurgica[];
}

export interface ItemAgendaCirurgica {
  id: string;
  agenda_id: string;
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

  // --- Itens da Agenda ---
  adicionarItem(agendaId: string, payload: Partial<ItemAgendaCirurgica>): Observable<ItemAgendaCirurgica> {
    return this.http.post<ItemAgendaCirurgica>(`${this.apiUrl}/${agendaId}/itens`, payload);
  }

  atualizarItem(agendaId: string, itemId: string, payload: Partial<ItemAgendaCirurgica>): Observable<ItemAgendaCirurgica> {
    return this.http.patch<ItemAgendaCirurgica>(`${this.apiUrl}/${agendaId}/itens/${itemId}`, payload);
  }

  removerItem(agendaId: string, itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${agendaId}/itens/${itemId}`);
  }

  // --- Elegibilidade ---
  listarElegiveis(filtros?: any): Observable<EntradaFilaElegivel[]> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) params = params.set(key, filtros[key]);
      });
    }
    return this.http.get<EntradaFilaElegivel[]>(`${CONFIG.API_URL}/admin/agenda/elegiveis`, { params });
  }
}
