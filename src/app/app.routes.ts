import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { PatientPortalComponent } from './patient-portal/patient-portal';

export const routes: Routes = [
  { path: 'admin', component: AdminDashboard },
  { path: 'atualizar', component: PatientPortalComponent },
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
];
