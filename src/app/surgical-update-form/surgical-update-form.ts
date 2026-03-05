import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FilaService } from '../fila.service';

@Component({
  selector: 'app-surgical-update-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './surgical-update-form.html',
  styleUrls: ['./surgical-update-form.css']
})
export class SurgicalUpdateFormComponent {
  @Input() token!: string;
  updateForm: FormGroup;
  isSubmitted = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder, 
    private filaService: FilaService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateForm = this.fb.group({
      needsProcedure: ['', Validators.required],
      reason: [''],
      availability: ['', Validators.required]
    });

    // Watch for changes in needsProcedure to required/unrequire reason
    this.updateForm.get('needsProcedure')?.valueChanges.subscribe(value => {
      const reasonControl = this.updateForm.get('reason');
      if (value === 'Não') {
        reasonControl?.setValidators([Validators.required]);
      } else {
        reasonControl?.clearValidators();
      }
      reasonControl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.updateForm.invalid) return;

    this.isSubmitted = true;
    this.errorMessage = '';

    const formValues = this.updateForm.value;
    
    // Converte os dados do formulário para o formato (schema) que o backend espera
    // Se o paciente diz que SIM para still need procedure, consideramos CONFIRMADO
    // Se ele diz NÃO, consideramos CANCELADO
    const payload = {
      status_busca_ativa: formValues.needsProcedure === 'Sim' 
        ? 'CONFIRMADO_PACIENTE' 
        : 'CANCELADO_PACIENTE'
    };

    this.filaService.atualizarStatusPaciente(this.token, payload).subscribe({
      next: () => {
        this.isSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitted = false;
        this.errorMessage = 'Erro ao atualizar o status. Por favor, tente novamente mais tarde.';
        console.error('Submit error', err);
        this.cdr.detectChanges();
      }
    });
  }
}
