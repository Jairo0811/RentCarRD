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

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'vehiculos', component: Vehiculos },
  { path: 'clientes', component: ClientesComponent },
  { path: 'rentas', component: Rentas },
  { path: 'marcas', component: MarcasComponent },
  { path: 'modelos', component: ModelosComponent },
  { path: 'tipos-vehiculos', component: TiposVehiculosComponent },
  { path: 'tipos-combustibles', component: TiposCombustiblesComponent },
  { path: 'empleados', component: EmpleadosComponent },
  { path: 'inspeccion', component: InspeccionComponent },
  { path: 'reportes', component: ReportesComponent }
];