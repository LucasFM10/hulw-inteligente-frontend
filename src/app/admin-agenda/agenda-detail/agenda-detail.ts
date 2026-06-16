import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgendaService, AgendaCirurgica, ItemAgendaCirurgica, EntradaFilaElegivel, SalaCirurgica, Profissional } from '../agenda';

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
  
  salas: SalaCirurgica[] = [];
  profissionais: Profissional[] = [];

  loading = false;
  erro = '';
  sucesso = '';
  
  // Filtros elegiveis
  busca = '';

  // Nova Sessão
  novaSessaoData = '';
  novaSessaoTurno = 'MANHA';
  novaSessaoSala = '';
  sessaoSelecionadaId = '';

  // Modais de Adicionar/Editar Item
  modalAdicionarAberto = false;
  modalEditarAberto = false;
  
  pacienteAdicionando: EntradaFilaElegivel | null = null;
  itemEmEdicao: ItemAgendaCirurgica | null = null;
  itemSessaoId: string = '';
  
  formItem = {
    horario_inicio: '',
    horario_fim: '',
    medico_id: '',
    sala_id: '',
    ordem: null as number | null,
    observacoes: ''
  };
  
  erroModal = '';
  loadingModal = false;

  // Modais de Substituição
  modalSubstitutosAberto = false;
  substitutos: EntradaFilaElegivel[] = [];
  itemSubstituicao: ItemAgendaCirurgica | null = null;
  itemSubstituicaoSessaoId = '';

  // Adicionado trackBy para performance
  trackById(index: number, item: any): string {
    return item.id;
  }

  ngOnInit() {
    this.agendaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.agendaId) {
      this.carregarDados();
    }
    this.carregarListasAuxiliares();
  }

  carregarListasAuxiliares() {
    this.agendaService.listarSalas().subscribe(data => this.salas = data);
    this.agendaService.listarProfissionais().subscribe(data => this.profissionais = data);
  }

  ordenarItens(itens: ItemAgendaCirurgica[]) {
    itens.sort((a, b) => {
      if (a.horario_inicio && b.horario_inicio) {
        if (a.horario_inicio !== b.horario_inicio) {
          return a.horario_inicio.localeCompare(b.horario_inicio);
        }
      } else if (a.horario_inicio && !b.horario_inicio) {
        return -1;
      } else if (!a.horario_inicio && b.horario_inicio) {
        return 1;
      }

      if (a.ordem !== null && a.ordem !== undefined && b.ordem !== null && b.ordem !== undefined) {
        if (a.ordem !== b.ordem) return a.ordem - b.ordem;
      } else if (a.ordem !== null && a.ordem !== undefined) {
        return -1;
      } else if (b.ordem !== null && b.ordem !== undefined) {
        return 1;
      }

      const nomeA = a.paciente_nome || '';
      const nomeB = b.paciente_nome || '';
      return nomeA.localeCompare(nomeB);
    });
  }

  carregarDados() {
    this.loading = true;
    this.erro = '';
    
    this.agendaService.obterAgenda(this.agendaId).subscribe({
      next: (data) => {
        this.agenda = data;
        if (this.agenda?.sessoes?.length) {
          if (!this.sessaoSelecionadaId) {
            this.sessaoSelecionadaId = this.agenda.sessoes[0].id;
          }
          this.agenda.sessoes.forEach(s => {
            if (s.itens) this.ordenarItens(s.itens);
          });
        }
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

  criarSessao() {
    if (!this.novaSessaoData || !this.novaSessaoTurno) {
      alert('Data e turno são obrigatórios para a sessão');
      return;
    }
    if (this.agenda?.status !== 'RASCUNHO') {
      alert('Só é possível adicionar sessões em agenda de Rascunho.');
      return;
    }
    this.loading = true;
    this.agendaService.criarSessao(this.agendaId, {
      data: this.novaSessaoData,
      turno: this.novaSessaoTurno,
      sala_id: this.novaSessaoSala || undefined
    }).subscribe({
      next: () => {
        this.sucesso = 'Sessão criada!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao criar sessão';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== LÓGICA DO MODAL =====================
  
  validarHorarios(): boolean {
    this.erroModal = '';
    if (this.formItem.horario_inicio && this.formItem.horario_fim) {
      if (this.formItem.horario_fim < this.formItem.horario_inicio) {
        this.erroModal = 'O horário de fim deve ser posterior ou igual ao de início.';
        return false;
      }
    }
    return true;
  }

  abrirModalAdicionar(paciente: EntradaFilaElegivel) {
    if (!this.sessaoSelecionadaId) {
      alert('Selecione uma sessão para adicionar o paciente.');
      return;
    }
    this.pacienteAdicionando = paciente;
    this.erroModal = '';
    this.formItem = { horario_inicio: '', horario_fim: '', medico_id: '', sala_id: '', ordem: null, observacoes: '' };
    this.modalAdicionarAberto = true;
  }

  fecharModalAdicionar() {
    this.modalAdicionarAberto = false;
    this.pacienteAdicionando = null;
    this.erroModal = '';
  }

  confirmarAdicionarItem() {
    if (!this.pacienteAdicionando || !this.sessaoSelecionadaId) return;
    if (!this.validarHorarios()) return;
    
    this.loadingModal = true;
    
    // Preparar payload
    const payload: any = { entrada_fila_id: this.pacienteAdicionando.id };
    if (this.formItem.horario_inicio) payload.horario_inicio = this.formItem.horario_inicio;
    if (this.formItem.horario_fim) payload.horario_fim = this.formItem.horario_fim;
    if (this.formItem.medico_id) payload.medico_id = this.formItem.medico_id;
    if (this.formItem.sala_id) payload.sala_id = this.formItem.sala_id;
    if (this.formItem.ordem !== null && this.formItem.ordem !== undefined && this.formItem.ordem.toString() !== '') payload.ordem = this.formItem.ordem;
    if (this.formItem.observacoes) payload.observacoes = this.formItem.observacoes;

    this.agendaService.adicionarItem(this.sessaoSelecionadaId, payload).subscribe({
      next: (novoItem) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === this.sessaoSelecionadaId);
        if (sessao) {
          if (!sessao.itens) sessao.itens = [];
          sessao.itens.push(novoItem);
          this.ordenarItens(sessao.itens);
        }
        this.todasElegiveis = this.todasElegiveis.filter(e => e.id !== this.pacienteAdicionando!.id);
        this.aplicarBuscaElegiveis();
        
        this.fecharModalAdicionar();
        this.sucesso = 'Paciente adicionado à sessão!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = err.error?.detail || 'Erro ao adicionar paciente';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalEditar(sessaoId: string, item: ItemAgendaCirurgica) {
    const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
    if (sessao?.status === 'CANCELADA' || sessao?.status === 'CONSOLIDADA') {
      alert('Não é possível editar itens em sessões Canceladas ou Consolidadas.');
      return;
    }
    if (item.status === 'CANCELADA' || item.status === 'CONSOLIDADA') {
      alert('Não é possível editar um item Cancelado ou Consolidado.');
      return;
    }

    this.itemEmEdicao = item;
    this.itemSessaoId = sessaoId;
    this.erroModal = '';
    this.formItem = {
      horario_inicio: item.horario_inicio || '',
      horario_fim: item.horario_fim || '',
      medico_id: item.medico_id || '',
      sala_id: item.sala_id || '',
      ordem: item.ordem !== undefined ? item.ordem : null,
      observacoes: item.observacoes || ''
    };
    this.modalEditarAberto = true;
  }

  fecharModalEditar() {
    this.modalEditarAberto = false;
    this.itemEmEdicao = null;
    this.erroModal = '';
  }

  confirmarEditarItem() {
    if (!this.itemEmEdicao || !this.itemSessaoId) return;
    if (!this.validarHorarios()) return;
    
    this.loadingModal = true;
    
    const payload: any = {};
    payload.horario_inicio = this.formItem.horario_inicio || null;
    payload.horario_fim = this.formItem.horario_fim || null;
    payload.medico_id = this.formItem.medico_id || null;
    payload.sala_id = this.formItem.sala_id || null;
    payload.ordem = (this.formItem.ordem !== null && this.formItem.ordem !== undefined && this.formItem.ordem.toString() !== '') ? this.formItem.ordem : null;
    payload.observacoes = this.formItem.observacoes || null;

    this.agendaService.atualizarItem(this.itemSessaoId, this.itemEmEdicao.id, payload).subscribe({
      next: (itemAtualizado) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === this.itemSessaoId);
        if (sessao && sessao.itens) {
          const index = sessao.itens.findIndex(i => i.id === itemAtualizado.id);
          if (index !== -1) {
            sessao.itens[index] = itemAtualizado;
            this.ordenarItens(sessao.itens);
          }
        }
        
        this.fecharModalEditar();
        this.sucesso = 'Dados do paciente atualizados com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = err.error?.detail || 'Erro ao atualizar paciente';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== FIM LÓGICA DO MODAL =====================

  // ===================== MODAL DE SUBSTITUIÇÃO =====================
  
  abrirModalSubstituir(sessaoId: string, item: ItemAgendaCirurgica) {
    if (this.agenda?.status !== 'RASCUNHO') {
      alert('Só é possível substituir em agenda de Rascunho.');
      return;
    }
    const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
    if (sessao?.status !== 'RASCUNHO') {
      alert('Só é possível substituir pacientes em uma sessão de Rascunho.');
      return;
    }
    
    this.itemSubstituicao = item;
    this.itemSubstituicaoSessaoId = sessaoId;
    this.substitutos = [];
    this.erroModal = '';
    this.modalSubstitutosAberto = true;
    this.loadingModal = true;
    
    this.agendaService.listarSubstitutos(sessaoId, item.id).subscribe({
      next: (data) => {
        this.substitutos = data;
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = 'Erro ao carregar substitutos.';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModalSubstituir() {
    this.modalSubstitutosAberto = false;
    this.itemSubstituicao = null;
    this.substitutos = [];
    this.erroModal = '';
  }

  confirmarSubstituicao(novoPaciente: EntradaFilaElegivel) {
    if (!this.itemSubstituicao || !this.itemSubstituicaoSessaoId) return;
    if (!confirm(`Deseja substituir ${this.itemSubstituicao.paciente_nome} por ${novoPaciente.paciente_nome} neste horário?`)) return;
    
    this.loadingModal = true;
    this.agendaService.substituirItem(this.itemSubstituicaoSessaoId, this.itemSubstituicao.id, novoPaciente.id).subscribe({
      next: (itemAtualizado) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === this.itemSubstituicaoSessaoId);
        if (sessao && sessao.itens) {
          const index = sessao.itens.findIndex(i => i.id === itemAtualizado.id);
          if (index !== -1) {
            sessao.itens[index] = itemAtualizado;
          }
        }
        
        this.carregarElegiveis(); // Reload elegiveis
        this.fecharModalSubstituir();
        this.sucesso = 'Paciente substituído com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = err.error?.detail || 'Erro ao substituir paciente.';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== FIM MODAL DE SUBSTITUIÇÃO =====================

  enviarLinkConfirmacao(sessaoId: string, item: ItemAgendaCirurgica) {
    if (!confirm(`Deseja gerar o link de confirmação para ${item.paciente_nome}?`)) return;
    
    this.agendaService.enviarLinkConfirmacao(sessaoId, item.id).subscribe({
      next: (res) => {
        // Atualizar status localmente
        const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
        if (sessao && sessao.itens) {
          const index = sessao.itens.findIndex(i => i.id === item.id);
          if (index !== -1) {
            sessao.itens[index].status = 'AGUARDANDO_CONFIRMACAO' as any;
          }
        }
        
        // Simular o envio mostrando o link pro admin copiar (para MVP)
        prompt('Link gerado com sucesso! Simulação do WhatsApp: copie o link abaixo.', window.location.origin + res.link);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.detail || 'Erro ao gerar link de confirmação');
      }
    });
  }

  removerItem(sessaoId: string, item: ItemAgendaCirurgica) {
    if (!confirm('Tem certeza que deseja remover este paciente da sessão?')) return;
    
    this.loading = true;
    this.agendaService.removerItem(sessaoId, item.id).subscribe({
      next: () => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
        if (sessao && sessao.itens) {
          sessao.itens = sessao.itens.filter(i => i.id !== item.id);
        }
        this.carregarElegiveis();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = 'Erro ao remover item.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  consolidarSessao(sessaoId: string) {
    if (!confirm('Deseja consolidar esta sessão? Ela não poderá mais receber adições.')) return;
    this.loading = true;
    this.agendaService.consolidarSessao(sessaoId).subscribe({
      next: (sessaoAtualizada) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
        if (sessao) {
          sessao.status = sessaoAtualizada.status;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao consolidar sessão';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelarSessao(sessaoId: string) {
    if (!confirm('Deseja cancelar esta sessão? Todos os pacientes retornarão para a fila.')) return;
    this.loading = true;
    this.agendaService.cancelarSessao(sessaoId, {}).subscribe({
      next: (sessaoAtualizada) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
        if (sessao) {
          sessao.status = sessaoAtualizada.status;
        }
        this.carregarElegiveis();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao cancelar sessão';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  consolidarAgenda() {
    if (!confirm('Deseja consolidar a agenda? Ela não poderá mais receber adições.')) return;
    
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
