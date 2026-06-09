import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgendaService, AgendaCirurgica, ItemAgendaCirurgica, EntradaFilaElegivel } from '../agenda';

@Component({
  selector: 'app-agenda-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agenda-detail.html'
})
export class AgendaDetail implements OnInit {
  agendaService = inject(AgendaService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  agendaId = '';
  agenda?: AgendaCirurgica;
  todasElegiveis: EntradaFilaElegivel[] = [];
  elegiveis: EntradaFilaElegivel[] = [];
  
  loading = false;
  erro = '';
  sucesso = '';
  
  // Filtros elegiveis
  busca = '';

  ngOnInit() {
    this.agendaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.agendaId) {
      this.carregarDados();
    }
  }

  carregarDados() {
    this.loading = true;
    this.erro = '';
    
    this.agendaService.obterAgenda(this.agendaId).subscribe({
      next: (data) => {
        this.agenda = data;
        this.carregarElegiveis();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = 'Erro ao carregar detalhes da agenda.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  carregarElegiveis() {
    this.agendaService.listarElegiveis().subscribe({
      next: (data) => {
        this.todasElegiveis = data;
        this.aplicarBuscaElegiveis();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = 'Erro ao carregar pacientes elegíveis.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarBuscaElegiveis() {
    if (!this.busca.trim()) {
      this.elegiveis = [...this.todasElegiveis];
    } else {
      const termo = this.busca.toLowerCase().trim();
      this.elegiveis = this.todasElegiveis.filter(p => 
        p.paciente_nome.toLowerCase().includes(termo) || 
        (p.procedimento && p.procedimento.toLowerCase().includes(termo))
      );
    }
    this.cdr.detectChanges();
  }

  adicionarItem(paciente: EntradaFilaElegivel) {
    if (this.agenda?.status !== 'RASCUNHO') {
      alert('Só é possível adicionar em agenda de Rascunho.');
      return;
    }
    
    this.loading = true;
    this.agendaService.adicionarItem(this.agendaId, {
      entrada_fila_id: paciente.id,
      sala_id: this.agenda?.sala_id // default same as agenda
    }).subscribe({
      next: () => {
        this.sucesso = 'Paciente adicionado à agenda!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao adicionar paciente';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removerItem(itemId: string) {
    if (!confirm('Tem certeza que deseja remover este paciente da agenda?')) return;
    
    this.loading = true;
    this.agendaService.removerItem(this.agendaId, itemId).subscribe({
      next: () => {
        this.sucesso = 'Paciente removido da agenda.';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = 'Erro ao remover item.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  consolidarAgenda() {
    if (!confirm('Deseja consolidar a agenda? Ela não poderá mais receber adições de pacientes.')) return;
    
    this.loading = true;
    this.agendaService.consolidarAgenda(this.agendaId).subscribe({
      next: () => {
        this.sucesso = 'Agenda consolidada com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao consolidar';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelarAgenda() {
    if (!confirm('ATENÇÃO: Cancelar a agenda removerá todos os itens e eles voltarão para a fila de elegíveis. Continuar?')) return;
    
    this.loading = true;
    this.agendaService.cancelarAgenda(this.agendaId, {}).subscribe({
      next: () => {
        this.sucesso = 'Agenda cancelada.';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = 'Erro ao cancelar.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  voltar() {
    this.router.navigate(['/admin/agenda']);
  }

  getBadgeClass(status: string): string {
    if (!status) return '';
    switch(status) {
      case 'RASCUNHO': return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'CONSOLIDADA': return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'CANCELADA': return 'bg-red-100 text-red-800 ring-red-600/20';
      case 'RASCUNHO_AGENDA': return 'bg-slate-100 text-slate-800 ring-slate-600/20';
      case 'PRE_AGENDADO': return 'bg-blue-100 text-blue-800 ring-blue-600/20';
      default: return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  }
}
