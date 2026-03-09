import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilaService {
  private apiUrl = 'https://hulw-inteligente-backend.vercel.app/fila';

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
    return this.http.post<any[]>(`https://hulw-inteligente-backend.vercel.app/admin/gerar-lote-links`, body);
  }
}

