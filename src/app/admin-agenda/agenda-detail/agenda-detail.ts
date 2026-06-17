import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AgendaService, AgendaCirurgica, ItemAgendaCirurgica, EntradaFilaElegivel, SalaCirurgica, Profissional } from '../agenda';

@Component({
  selector: 'app-agenda-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxMaterialTimepickerModule, DragDropModule],
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

  get salasAtivas() {
    return this.salas.filter(s => s.ativa);
  }

  loading = false;
  erro = '';
  sucesso = '';
  
  // Filtros elegiveis
  busca = '';

  // Nova Sessão
  novaSessaoData = '';
  novaSessaoHoraInicio = '';
  novaSessaoHoraFim = '';
  novaSessaoResponsavelId = '';
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
    observacoes: ''
  };
  
  erroModal = '';
  loadingModal = false;

  // --- Modal Preenchimento Automático (Fase 7) ---
  modalPreenchimentoAberto = false;
  preenchimentoSessaoId = '';
  formPreenchimento = {
    sala_id: '',
    duracao_padrao_minutos: 90,
    limite_pacientes: null as number | null,
    pular_se_nao_couber: true
  };
  resultadoPreenchimento: any = null;

  // Modais de Substituição
  modalSubstitutosAberto = false;
  substitutos: EntradaFilaElegivel[] = [];
  itemSubstituicao: ItemAgendaCirurgica | null = null;
  itemSubstituicaoSessaoId = '';

  // Modais de Desfecho (Fase 6)
  modalDesfechoAberto = false;
  itemDesfecho: ItemAgendaCirurgica | null = null;
  itemDesfechoSessaoId = '';
  desfechoForm = {
    realizada: true,
    motivo: '',
    observacoes: ''
  };
  motivosNaoRealizacao = [
    'PACIENTE_FALTOU',
    'PACIENTE_RECUSOU_NO_DIA',
    'FALTA_LEITO',
    'FALTA_MATERIAL',
    'FALTA_EQUIPE',
    'FALTA_SALA',
    'CONDICAO_CLINICA_INADEQUADA',
    'SUSPENSAO_MEDICA',
    'URGENCIA_OCUPOU_SALA',
    'PROBLEMA_ADMINISTRATIVO',
    'OUTRO'
  ];

  getMotivoLabel(motivo: string): string {
    const map: Record<string, string> = {
      PACIENTE_FALTOU: 'Paciente Faltou',
      PACIENTE_RECUSOU_NO_DIA: 'Paciente Recusou no Dia',
      FALTA_LEITO: 'Falta de Leito',
      FALTA_MATERIAL: 'Falta de Material',
      FALTA_EQUIPE: 'Falta de Equipe',
      FALTA_SALA: 'Falta de Sala',
      CONDICAO_CLINICA_INADEQUADA: 'Condição Clínica Inadequada',
      SUSPENSAO_MEDICA: 'Suspensão Médica',
      URGENCIA_OCUPOU_SALA: 'Urgência Ocupou a Sala',
      PROBLEMA_ADMINISTRATIVO: 'Problema Administrativo',
      OUTRO: 'Outro'
    };
    return map[motivo] || motivo;
  }

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
    const filtros: any = {};
    if (this.agenda?.especialidade_id) {
      filtros.especialidade_id = this.agenda.especialidade_id;
    }
    this.agendaService.listarElegiveis(filtros).subscribe({
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
    if (!this.novaSessaoData || !this.novaSessaoHoraInicio || !this.novaSessaoHoraFim || !this.novaSessaoResponsavelId) {
      alert('Data, hora de início, hora de fim e cirurgião são obrigatórios para a sessão');
      return;
    }
    if (this.agenda?.status !== 'RASCUNHO') {
      alert('Só é possível adicionar sessões em agenda de Rascunho.');
      return;
    }
    this.loading = true;
    this.agendaService.criarSessao(this.agendaId, {
      data: this.novaSessaoData,
      hora_inicio: this.novaSessaoHoraInicio + ':00',
      hora_fim: this.novaSessaoHoraFim + ':00',
      responsavel_id: this.novaSessaoResponsavelId
    }).subscribe({
      next: () => {
        this.sucesso = 'Sessão criada!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
        this.novaSessaoData = '';
        this.novaSessaoHoraInicio = '';
        this.novaSessaoHoraFim = '';
        this.novaSessaoResponsavelId = '';
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao criar sessão';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removerSessao(sessaoId: string) {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    this.loading = true;
    this.agendaService.removerSessao(sessaoId).subscribe({
      next: () => {
        this.sucesso = 'Sessão excluída com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        if (this.sessaoSelecionadaId === sessaoId) {
          this.sessaoSelecionadaId = '';
        }
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao excluir sessão.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  consolidarSessao(sessaoId: string) {
    if (!confirm('Deseja consolidar esta sessão? Não será possível adicionar ou editar itens após a consolidação.')) return;
    this.loading = true;
    this.agendaService.consolidarSessao(sessaoId).subscribe({
      next: () => {
        this.sucesso = 'Sessão consolidada com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao consolidar sessão.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelarSessao(sessaoId: string) {
    const motivo = prompt('Informe o motivo do cancelamento da sessão:');
    if (motivo === null) return;
    this.loading = true;
    this.agendaService.cancelarSessao(sessaoId, { observacoes: motivo }).subscribe({
      next: () => {
        this.sucesso = 'Sessão cancelada com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao cancelar sessão.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== LÓGICA DO MODAL =====================
  
  validarHorariosEdicao(): boolean {
    this.erroModal = '';
    if (this.formItem.horario_inicio && this.formItem.horario_fim) {
      if (this.formItem.horario_fim <= this.formItem.horario_inicio) {
        this.erroModal = 'O horário de fim deve ser posterior ao de início.';
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
    const sessao = this.getSessaoSelecionada();
    if (sessao && !sessao.responsavel_id) {
      alert('Esta sessão não possui cirurgião responsável. Edite a sessão antes de adicionar pacientes.');
      return;
    }
    this.pacienteAdicionando = paciente;
    this.erroModal = '';
    this.formItem = { horario_inicio: '', horario_fim: '', medico_id: '', sala_id: '', observacoes: '' };
    this.modalAdicionarAberto = true;
  }

  fecharModalAdicionar() {
    this.modalAdicionarAberto = false;
    this.pacienteAdicionando = null;
    this.erroModal = '';
  }

  getSessaoSelecionada() {
    return this.agenda?.sessoes?.find(s => s.id === this.sessaoSelecionadaId);
  }

  getNomeCirurgiaoSessao(): string {
    const sessao = this.getSessaoSelecionada();
    if (!sessao || !sessao.responsavel_id) return 'Não informado';
    const prof = this.profissionais.find(p => p.id === sessao.responsavel_id);
    return prof ? prof.nome : 'Não informado';
  }

  confirmarAdicionarItem() {
    if (!this.pacienteAdicionando || !this.sessaoSelecionadaId) return;
    
    // Na criação não exigimos horários locais (Backend calcula)
    if (!this.formItem.sala_id) {
        this.erroModal = 'A seleção da sala é obrigatória.';
        return;
    }
    
    this.loadingModal = true;
    
    // Preparar payload
    const payload: any = { entrada_fila_id: this.pacienteAdicionando.id };
    // Horário é omitido na criação automática
    // if (this.formItem.horario_inicio) payload.horario_inicio = this.formItem.horario_inicio;
    // if (this.formItem.horario_fim) payload.horario_fim = this.formItem.horario_fim;
    if (this.formItem.medico_id) payload.medico_id = this.formItem.medico_id;
    if (this.formItem.sala_id) payload.sala_id = this.formItem.sala_id;
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
    if (item.status === 'CIRURGIA_CANCELADA' || item.status === 'CIRURGIA_REALIZADA') {
      alert('Não é possível editar um item Cancelado ou Realizado.');
      return;
    }

    this.itemEmEdicao = item;
    this.itemSessaoId = sessaoId;
    this.erroModal = '';
    this.formItem = {
      horario_inicio: item.horario_inicio ? item.horario_inicio.substring(0, 5) : '',
      horario_fim: item.horario_fim ? item.horario_fim.substring(0, 5) : '',
      medico_id: item.medico_id || '',
      sala_id: item.sala_id || '',
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
    if (!this.validarHorariosEdicao()) return;
    
    this.loadingModal = true;
    
    const payload: any = {};
    if (this.formItem.horario_inicio) payload.horario_inicio = this.formItem.horario_inicio.slice(0, 5) + ':00';
    if (this.formItem.horario_fim) payload.horario_fim = this.formItem.horario_fim.slice(0, 5) + ':00';
    payload.medico_id = this.formItem.medico_id || null;
    payload.sala_id = this.formItem.sala_id || null;
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
    
    const motivo = prompt('Informe o motivo do cancelamento da agenda:');
    if (motivo === null) return;
    this.loading = true;
    this.agendaService.cancelarAgenda(this.agendaId, { observacoes: motivo }).subscribe({
      next: () => {
        this.sucesso = 'Agenda cancelada com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.carregarDados();
      },
      error: (err) => {
        this.erro = err.error?.detail || 'Erro ao cancelar agenda';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBuscaAtivaLabel(status: string): string {
    const labels: any = {
      'PENDENTE': 'Pendente',
      'MENSAGEM_ENVIADA': 'Mensagem Enviada',
      'CONFIRMADO_PACIENTE': 'Confirmado',
      'CANCELADO_PACIENTE': 'Cancelado pelo Paciente'
    };
    return labels[status] || status;
  }

  getBuscaAtivaBadge(status: string): string {
    const map: any = {
      'PENDENTE': 'bg-slate-100 text-slate-700 border border-slate-200',
      'MENSAGEM_ENVIADA': 'bg-blue-50 text-blue-700 border border-blue-200',
      'CONFIRMADO_PACIENTE': 'bg-green-50 text-green-700 border border-green-200',
      'CANCELADO_PACIENTE': 'bg-red-50 text-red-700 border border-red-200'
    };
    return map[status] || 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  voltar() {
    this.router.navigate(['/admin/agenda']);
  }

  abrirModalDesfecho(sessaoId: string, item: ItemAgendaCirurgica, realizada: boolean) {
    const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
    if (sessao?.status === 'CANCELADA') {
      alert('Não é possível registrar desfecho em sessões Canceladas.');
      return;
    }
    if (this.agenda?.status === 'CANCELADA') {
      alert('Não é possível registrar desfecho em agendas Canceladas.');
      return;
    }
    this.itemDesfecho = item;
    this.itemDesfechoSessaoId = sessaoId;
    this.desfechoForm = {
      realizada: realizada,
      motivo: '',
      observacoes: ''
    };
    this.erroModal = '';
    this.modalDesfechoAberto = true;
  }

  fecharModalDesfecho() {
    this.modalDesfechoAberto = false;
    this.itemDesfecho = null;
    this.erroModal = '';
  }

  abrirModalPreenchimento(sessaoId: string) {
    this.preenchimentoSessaoId = sessaoId;
    this.formPreenchimento = {
      sala_id: '',
      duracao_padrao_minutos: 90,
      limite_pacientes: null,
      pular_se_nao_couber: true
    };
    this.resultadoPreenchimento = null;
    this.erroModal = '';
    this.modalPreenchimentoAberto = true;
  }
  
  fecharModalPreenchimento() {
    this.modalPreenchimentoAberto = false;
    this.preenchimentoSessaoId = '';
    this.resultadoPreenchimento = null;
  }
  
  executarPreenchimento() {
    if (!this.formPreenchimento.sala_id) {
      this.erroModal = "Selecione uma sala cirúrgica padrão.";
      return;
    }
    
    this.loadingModal = true;
    this.erroModal = '';
    this.agendaService.preencherAutomatico(this.preenchimentoSessaoId, this.formPreenchimento).subscribe({
      next: (res) => {
        this.resultadoPreenchimento = res;
        this.sucesso = `Adicionados ${res.itens_adicionados} itens automaticamente.`;
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 4000);
        
        // Atualiza a sessão
        if (this.agenda && this.agenda.sessoes) {
          const index = this.agenda.sessoes.findIndex(s => s.id === res.sessao.id);
          if (index !== -1) {
            this.agenda.sessoes[index] = res.sessao;
          }
        }
        
        this.carregarElegiveis();
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = err.error?.detail || 'Erro ao preencher sessão.';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmarDesfecho() {
    if (!this.itemDesfecho || !this.itemDesfechoSessaoId) return;
    if (!this.desfechoForm.realizada && !this.desfechoForm.motivo) {
      alert('Por favor, selecione um motivo para a não realização.');
      return;
    }
    
    this.loadingModal = true;
    this.agendaService.registrarDesfecho(
      this.itemDesfechoSessaoId,
      this.itemDesfecho.id,
      {
        realizada: this.desfechoForm.realizada,
        motivo: this.desfechoForm.realizada ? undefined : this.desfechoForm.motivo,
        observacoes: this.desfechoForm.observacoes || undefined
      }
    ).subscribe({
      next: (itemAtualizado) => {
        const sessao = this.agenda?.sessoes?.find(s => s.id === this.itemDesfechoSessaoId);
        if (sessao && sessao.itens) {
          const index = sessao.itens.findIndex(i => i.id === itemAtualizado.id);
          if (index !== -1) {
            sessao.itens[index] = itemAtualizado;
          }
        }
        
        this.carregarElegiveis();
        this.fecharModalDesfecho();
        this.sucesso = 'Desfecho cirúrgico registrado com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.loadingModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erroModal = err.error?.detail || 'Erro ao registrar desfecho.';
        this.loadingModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBadgeClass(status: string): string {
    if (!status) return '';
    switch(status) {
      case 'RASCUNHO': return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'CONSOLIDADA': return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'CANCELADA': return 'bg-red-100 text-red-800 ring-red-600/20';
      case 'RASCUNHO_AGENDA': return 'bg-slate-100 text-slate-800 ring-slate-600/20';
      case 'PRE_AGENDADO': return 'bg-blue-100 text-blue-800 ring-blue-600/20';
      case 'AGUARDANDO_CONFIRMACAO': return 'bg-indigo-100 text-indigo-800 ring-indigo-600/20';
      case 'CIRURGIA_AGENDADA': return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
      case 'CIRURGIA_REALIZADA': return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'CIRURGIA_CANCELADA': return 'bg-red-100 text-red-800 ring-red-600/20';
      default: return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  }

  getStatusLabel(status: string): string {
    if (!status) return '';
    switch(status) {
      case 'RASCUNHO': return 'Rascunho';
      case 'CONSOLIDADA': return 'Consolidada';
      case 'CANCELADA': return 'Cancelada';
      case 'RASCUNHO_AGENDA': return 'Rascunho (Não Confirmado)';
      case 'PRE_AGENDADO': return 'Pré-agendado';
      case 'AGUARDANDO_CONFIRMACAO': return 'Aguardando Confirmação';
      case 'CIRURGIA_AGENDADA': return 'Cirurgia Agendada';
      case 'CIRURGIA_REALIZADA': return 'Cirurgia Realizada';
      case 'CIRURGIA_CANCELADA': return 'Cirurgia Cancelada';
      default: return status;
    }
  }

  drop(event: CdkDragDrop<ItemAgendaCirurgica[]>, sessaoId: string) {
    const sessao = this.agenda?.sessoes?.find(s => s.id === sessaoId);
    if (!sessao || !sessao.itens) return;
    
    // Bloqueia reordenacao de sessoes nao rascunho
    if (sessao.status !== 'RASCUNHO') return;

    // Filtra apenas itens reordenaveis no backend (nao realizados/cancelados)
    const validStatuses = ['RASCUNHO_AGENDA', 'PRE_AGENDADO', 'AGUARDANDO_CONFIRMACAO', 'CIRURGIA_AGENDADA'];
    
    // Validar se o item movido pode ser movido
    const item = sessao.itens[event.previousIndex];
    if (!validStatuses.includes(item.status)) {
      alert('Este item não pode ser reordenado pois já foi realizado ou cancelado.');
      return;
    }
    
    // Validar se destino tbm eh em um slot de item valido (a rigor moveItemInArray lida localmente, 
    // mas se misturar com cancelados fica estranho visualmente. Vamos assumir q o backend resolve. 
    // Mover localmente primeiro:
    moveItemInArray(sessao.itens!, event.previousIndex, event.currentIndex);

    // Pegar apenas os IDs dos itens validos, mantendo a nova ordem visual
    const itemIdsOrdenados = sessao.itens!
      .filter(i => validStatuses.includes(i.status))
      .map(i => i.id);

    // Enviar pro backend
    this.loading = true;
    this.agendaService.reordenarItens(sessao.id, itemIdsOrdenados).subscribe({
      next: (itensAtualizados) => {
        // O backend retorna apenas os itens válidos. Precisamos mesclar com os cancelados q ficaram na sessão.
        const itensCancelados = sessao.itens!.filter(i => !validStatuses.includes(i.status));
        sessao.itens = [...itensAtualizados, ...itensCancelados]; // Cancelados ficam no final pro padrao
        this.ordenarItens(sessao.itens); // ordenarItens original pode interferir se ordenar_por_ordem, entao vamos garantir:
        
        this.sucesso = 'Ordem atualizada com sucesso!';
        setTimeout(() => { this.sucesso = ''; this.cdr.detectChanges(); }, 3000);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Reverter mudanca local
        moveItemInArray(sessao.itens!, event.currentIndex, event.previousIndex);
        this.erro = err.error?.detail || 'Erro ao reordenar os itens.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
