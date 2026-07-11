import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
})
export class App {
  constructor(public router: Router) {}

  get rolActual(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('rolUsuario');
  }

  get idEmpleadoActual(): number | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    const valor = localStorage.getItem('idEmpleado');

    return valor ? Number(valor) : null;
  }

  get nombreUsuarioActual(): string {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return '';
    }

    return localStorage.getItem('nombreUsuario') ?? '';
  }

  cerrarSesion(): void {
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('idEmpleado');
    localStorage.removeItem('nombreUsuario');

    this.router.navigateByUrl('/login');
  }
}
