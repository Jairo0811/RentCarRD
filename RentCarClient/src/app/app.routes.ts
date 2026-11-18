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
import { authGuard, inicioGuard, loginGuard } from './services/auth.guard';

/**
 * Permisos de navegación (coinciden con la API):
 * - Admin: todos los módulos.
 * - Empleado: rentas y devoluciones, clientes y consulta de catálogos.
 */
const soloAdmin = { roles: ['admin'] };
const adminYEmpleado = { roles: ['admin', 'empleado'] };

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard], title: 'Iniciar sesión · RentCarRD' },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], data: soloAdmin, title: 'Dashboard · RentCarRD' },
  { path: 'empleados', component: EmpleadosComponent, canActivate: [authGuard], data: soloAdmin, title: 'Empleados · RentCarRD' },
  { path: 'vehiculos', component: Vehiculos, canActivate: [authGuard], data: soloAdmin, title: 'Vehículos · RentCarRD' },
  { path: 'inspeccion', component: InspeccionComponent, canActivate: [authGuard], data: soloAdmin, title: 'Inspección · RentCarRD' },
  { path: 'reportes', component: ReportesComponent, canActivate: [authGuard], data: soloAdmin, title: 'Reportes · RentCarRD' },

  { path: 'rentas', component: Rentas, canActivate: [authGuard], data: adminYEmpleado, title: 'Rentas · RentCarRD' },
  { path: 'clientes', component: ClientesComponent, canActivate: [authGuard], data: adminYEmpleado, title: 'Clientes · RentCarRD' },
  { path: 'marcas', component: MarcasComponent, canActivate: [authGuard], data: adminYEmpleado, title: 'Marcas · RentCarRD' },
  { path: 'modelos', component: ModelosComponent, canActivate: [authGuard], data: adminYEmpleado, title: 'Modelos · RentCarRD' },
  { path: 'tipos-vehiculos', component: TiposVehiculosComponent, canActivate: [authGuard], data: adminYEmpleado, title: 'Tipos de vehículos · RentCarRD' },
  { path: 'tipos-combustibles', component: TiposCombustiblesComponent, canActivate: [authGuard], data: adminYEmpleado, title: 'Tipos de combustible · RentCarRD' },

  { path: '**', redirectTo: '' },
];
