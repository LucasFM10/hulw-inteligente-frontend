import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { PatientPortalComponent } from './patient-portal/patient-portal';
import { AdminLoginComponent } from './admin-login/admin-login';
import { adminAuthGuard } from './admin-auth.guard';

export const routes: Routes = [
  // Tela de login (pública)
  { path: 'login', component: AdminLoginComponent },

  // Painel admin — protegido pelo guard de autenticação
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminAuthGuard],
  },

  // Portal do paciente (link mágico via token JWT)
  { path: 'atualizar', component: PatientPortalComponent },

  // Rota padrão → redireciona para o painel (o guard lida com não autenticados)
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
];
