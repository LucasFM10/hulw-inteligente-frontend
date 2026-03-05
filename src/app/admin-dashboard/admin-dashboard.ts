import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilaService } from '../fila.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  loteGerado: any[] = [];
  isLoading: boolean = false;

  constructor(private filaService: FilaService, private cdr: ChangeDetectorRef) {}

  gerarLote() {
    console.log('[Componente] Botão gerarLote() clicado!');
    this.isLoading = true; // Liga o botão de loading
    console.log('[Componente] isLoading setado para true, chamando filaService...');

    this.filaService.gerarLoteBuscaAtiva().subscribe({
      next: (resposta) => {
        console.log('[Componente] Recebido sucesso do filaService.gerarLoteBuscaAtiva():', resposta);
        // Deu certo! O FastAPI respondeu com os links.
        this.loteGerado = resposta;
        this.isLoading = false; // Desliga o loading
        this.cdr.detectChanges(); // Força a atualização do visual para evitar travamento "Gerando..."
        console.log('[Componente] isLoading setado para false (next)');
      },
      error: (erro) => {
        console.log('[Componente] Recebido erro do filaService.gerarLoteBuscaAtiva():', erro);
        // Deu ruim! Caiu a internet ou a API falhou.
        console.error('Erro na comunicação com a API do HULW:', erro);
        alert('Falha ao conectar com o servidor. Verifique se o FastAPI está rodando.');
        this.isLoading = false; // Desliga o loading obrigatoriamente aqui também!
        this.cdr.detectChanges(); // Força a atualização do visual
        console.log('[Componente] isLoading setado para false (error)');
      }
    });
  }
}
