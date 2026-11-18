import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly mostrarNavegacion = computed(() => !!this.auth.sesion() && !this.urlActual().startsWith('/login'));
  readonly esAdmin = this.auth.esAdmin;
  readonly nombreUsuario = this.auth.nombre;
  readonly anio = new Date().getFullYear();

  menuAbierto = false;

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    // AuthService.logout() elimina el JWT, su expiración y el resto de claves de RentCarRD
    // (incluidas las heredadas de v1.2 en localStorage), sin tocar datos de otras aplicaciones.
    this.auth.logout();
    this.cerrarMenu();
    void this.router.navigateByUrl('/login');
  }
}
