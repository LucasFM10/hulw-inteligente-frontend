import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { PatientPortalComponent } from './patient-portal/patient-portal';
import { AdminLoginComponent } from './admin-login/admin-login';
import { adminAuthGuard } from './admin-auth.guard';
import { AgendaList } from './admin-agenda/agenda-list/agenda-list';
import { AgendaDetail } from './admin-agenda/agenda-detail/agenda-detail';

export const routes: Routes = [
  // Tela de login (pública)
  { path: 'login', component: AdminLoginComponent },

  // Painel admin — protegido pelo guard de autenticação
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/agenda',
    component: AgendaList,
    canActivate: [adminAuthGuard],
  },
  {
    path: 'admin/agenda/:id',
    component: AgendaDetail,
    canActivate: [adminAuthGuard],
  },

  // Portal do paciente (link mágico via token JWT)
  { path: 'atualizar', component: PatientPortalComponent },
  
  // Fase 5: Confirmação de Cirurgia do Paciente
  { 
    path: 'confirmar-cirurgia', 
    loadComponent: () => import('./confirmar-cirurgia/confirmar-cirurgia.component').then(m => m.ConfirmarCirurgiaComponent) 
  },

  // Rota padrão → redireciona para o painel (o guard lida com não autenticados)
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
];
