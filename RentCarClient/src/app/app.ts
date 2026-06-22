import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html'
})
export class App {  // <-- ¡Aquí está el cambio clave! De AppComponent a App
  
  constructor(public router: Router) {}

  // Este método lee quién inició sesión
get rolActual(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rolUsuario');
    }
    return null;
  }

  // Método para el botón de "Salir"
  cerrarSesion() {
    localStorage.removeItem('rolUsuario');
    this.router.navigate(['/login']);
  }
}