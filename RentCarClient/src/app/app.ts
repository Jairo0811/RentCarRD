import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html'
})
export class App {
  constructor(
    public readonly router: Router,
    public readonly auth: AuthService
  ) {}

  get rolActual(): 'admin' | 'empleado' | null {
    const role = this.auth.session?.rol;
    return role === 'Administrador'
      ? 'admin'
      : role === 'Empleado'
        ? 'empleado'
        : null;
  }

  get idEmpleadoActual(): number | null {
    return this.auth.session?.idEmpleado ?? null;
  }

  get nombreUsuarioActual(): string {
    return this.auth.session?.nombre ?? '';
  }

  cerrarSesion(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
