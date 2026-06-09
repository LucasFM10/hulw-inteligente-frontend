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
  filtroData = '';
  filtroStatus = '';
  filtroTurno = '';

  // Novo payload
  novaData = '';
  novoTurno = 'MANHA';

  ngOnInit() {
    this.carregarAgendas();
  }

  carregarAgendas() {
    this.loading = true;
    this.erro = '';
    const filtros: any = {};
    if (this.filtroData) filtros.data = this.filtroData;
    if (this.filtroStatus) filtros.status = this.filtroStatus;
    if (this.filtroTurno) filtros.turno = this.filtroTurno;

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
    
    if (this.filtroData) {
      filtrado = filtrado.filter(a => a.data === this.filtroData);
    }
    if (this.filtroStatus) {
      filtrado = filtrado.filter(a => a.status === this.filtroStatus);
    }
    if (this.filtroTurno) {
      filtrado = filtrado.filter(a => a.turno === this.filtroTurno);
    }
    
    this.agendas = filtrado;
    this.cdr.detectChanges();
  }

  criarAgenda() {
    if (!this.novaData || !this.novoTurno) {
      alert('Data e turno são obrigatórios');
      return;
    }
    
    this.loading = true;
    this.agendaService.criarAgenda({
      data: this.novaData,
      turno: this.novoTurno
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
