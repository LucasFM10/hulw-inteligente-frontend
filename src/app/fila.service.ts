import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CONFIG } from './constants';

@Injectable({
  providedIn: 'root'
})
export class FilaService {
  private apiUrl = `${CONFIG.API_URL}/fila`;

  constructor(private http: HttpClient) {}

  atualizarStatusPaciente(token: string, payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });
    return this.http.patch(`${this.apiUrl}/paciente/status`, payload, { headers });
  }

  validarIdentidade(token: string, payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });
    return this.http.post(`${this.apiUrl}/paciente/validar-identidade`, payload, { headers });
  }

  gerarLoteBuscaAtiva(baseUrl?: string): Observable<any[]> {
    const body: any = {};
    if (baseUrl) {
      body.base_url = baseUrl;
    }
    return this.http.post<any[]>(`${CONFIG.API_URL}/admin/gerar-lote-links`, body);
  }
}

