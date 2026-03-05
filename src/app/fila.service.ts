import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilaService {
  private apiUrl = 'http://localhost:8000/fila';

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

  gerarLoteBuscaAtiva(): Observable<any[]> {
    console.log('[FilaService] Iniciando chamada HTTP POST para http://localhost:8000/admin/gerar-lote-links...');
    return this.http.post<any[]>(`http://localhost:8000/admin/gerar-lote-links`, {});
  }
}

