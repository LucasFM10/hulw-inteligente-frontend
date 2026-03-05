import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IdentityValidationComponent } from '../identity-validation/identity-validation';
import { SurgicalUpdateFormComponent } from '../surgical-update-form/surgical-update-form';

@Component({
  selector: 'app-patient-portal',
  imports: [IdentityValidationComponent, SurgicalUpdateFormComponent],
  templateUrl: './patient-portal.html',
  styleUrl: './patient-portal.css'
})
export class PatientPortalComponent implements OnInit {
  isAuthorized: boolean = false;
  patientToken: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.patientToken = params['token'] || null;
      console.log('Token capturado:', this.patientToken);
    });
  }

  handleAuthorization() {
    this.isAuthorized = true;
  }
}
