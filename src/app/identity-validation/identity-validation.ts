import { Component, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FilaService } from '../fila.service';

@Component({
  selector: 'app-identity-validation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './identity-validation.html',
  styleUrls: ['./identity-validation.css']
})
export class IdentityValidationComponent {
  @Input() patientToken: string | null = null;
  @Output() onAuthorized = new EventEmitter<void>();
  
  validationForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private filaService: FilaService,
    private cdr: ChangeDetectorRef
  ) {
    this.validationForm = this.fb.group({
      cpfDigits: ['', [Validators.required, Validators.maxLength(3), Validators.minLength(3)]],
      birthDate: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.validationForm.valid && this.patientToken) {
      this.isLoading = true;
      this.errorMessage = null;

      const payload = {
        cpf_digits: this.validationForm.value.cpfDigits,
        birth_date: this.validationForm.value.birthDate
      };

      this.filaService.validarIdentidade(this.patientToken, payload).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.cdr.detectChanges();
          // Identidade bateu com o banco
          this.onAuthorized.emit();
        },
        error: (err) => {
          this.isLoading = false;
          
          if (err.status === 403) {
            this.errorMessage = "Dados incorretos. Verifique o CPF e a Data de Nascimento.";
          } else if (err.status === 401) {
            this.errorMessage = "Sessão expirada ou link inválido.";
          } else {
            this.errorMessage = "Erro interno no servidor. Tente novamente mais tarde.";
          }
          
          this.cdr.detectChanges();
        }
      });
    } else if (!this.patientToken) {
      this.errorMessage = "Nenhum token encontrado na URL. Acesse pelo link enviado no WhatsApp.";
    }
  }
}
