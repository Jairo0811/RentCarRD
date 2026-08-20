import { Routes } from '@angular/router';
import { Vehiculos } from './components/vehiculos/vehiculos';
import { ClientesComponent } from './components/clientes/clientes';
import { Rentas } from './components/rentas/rentas';
import { MarcasComponent } from './components/marcas/marcas';
import { ModelosComponent } from './components/modelos/modelos';
import { TiposVehiculosComponent } from './components/tipos-vehiculos/tipos-vehiculos';
import { TiposCombustiblesComponent } from './components/tipos-combustibles/tipos-combustibles';
import { EmpleadosComponent } from './components/empleados/empleados';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { InspeccionComponent } from './components/inspeccion/inspeccion';
import { ReportesComponent } from './components/reportes/reportes';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'vehiculos', component: Vehiculos, canActivate: [authGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [authGuard] },
  { path: 'rentas', component: Rentas, canActivate: [authGuard] },
  { path: 'marcas', component: MarcasComponent, canActivate: [authGuard] },
  { path: 'modelos', component: ModelosComponent, canActivate: [authGuard] },
  { path: 'tipos-vehiculos', component: TiposVehiculosComponent, canActivate: [authGuard] },
  { path: 'tipos-combustibles', component: TiposCombustiblesComponent, canActivate: [authGuard] },
  { path: 'empleados', component: EmpleadosComponent, canActivate: [authGuard] },
  { path: 'inspeccion', component: InspeccionComponent, canActivate: [authGuard] },
  { path: 'reportes', component: ReportesComponent, canActivate: [authGuard] }
];
