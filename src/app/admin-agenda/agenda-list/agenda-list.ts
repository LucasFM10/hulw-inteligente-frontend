import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgendaService, AgendaCirurgica } from '../agenda';

@Component({
  selector: 'app-agenda-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agenda-list.html'
})
export class AgendaList implements OnInit {
  agendaService = inject(AgendaService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  todasAgendas: AgendaCirurgica[] = [];
  agendas: AgendaCirurgica[] = [];
  loading = false;
  erro = '';

  // Filtros
  filtroAno: number | null = null;
  filtroMes: number | null = null;
  filtroStatus = '';

  // Novo payload
  novoAno: number = new Date().getFullYear();
  novoMes: number = new Date().getMonth() + 1;
  novaEspecialidadeId = '';

  // Adicionado trackBy para performance
  trackById(index: number, item: any): string {
    return item.id;
  }

  ngOnInit() {
    this.carregarAgendas();
  }

  carregarAgendas() {
    this.loading = true;
    this.erro = '';
    const filtros: any = {};
    if (this.filtroAno) filtros.ano = this.filtroAno;
    if (this.filtroMes) filtros.mes = this.filtroMes;
    if (this.filtroStatus) filtros.status = this.filtroStatus;

    this.agendaService.listarAgendas().subscribe({
      next: (data) => {
        this.todasAgendas = data;
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = 'Erro ao carregar agendas. Detalhes no console.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  aplicarFiltros() {
    let filtrado = [...this.todasAgendas];
    
    if (this.filtroAno) {
      filtrado = filtrado.filter(a => a.ano === this.filtroAno);
    }
    if (this.filtroMes) {
      filtrado = filtrado.filter(a => a.mes === this.filtroMes);
    }
    if (this.filtroStatus) {
      filtrado = filtrado.filter(a => a.status === this.filtroStatus);
    }
    
    this.agendas = filtrado;
    this.cdr.detectChanges();
  }

  criarAgenda() {
    if (!this.novaEspecialidadeId) {
      alert('Especialidade é obrigatória');
      return;
    }
    
    this.loading = true;
    this.agendaService.criarAgenda({
      ano: this.novoAno,
      mes: this.novoMes,
      especialidade_id: this.novaEspecialidadeId
    }).subscribe({
      next: (agenda) => {
        this.loading = false;
        this.router.navigate(['/admin/agenda', agenda.id]);
      },
      error: (err) => {
        this.erro = 'Erro ao criar agenda';
        this.loading = false;
        console.error(err);
      }
    });
  }

  abrirAgenda(id: string) {
    this.router.navigate(['/admin/agenda', id]);
  }

  getBadgeClass(status: string): string {
    switch(status) {
      case 'RASCUNHO': return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'CONSOLIDADA': return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'CANCELADA': return 'bg-red-100 text-red-800 ring-red-600/20';
      default: return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  }
}
