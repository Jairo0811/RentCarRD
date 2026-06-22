import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Arregla el aviso del *ngIf
import { RouterModule } from '@angular/router'; // <-- Necesario para los routerLink del menú

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  
  get rolActual(): string | null {
    // Escudo protector: Solo busca en localStorage si estamos en el navegador
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rolUsuario');
    }
    return null;
  }
  
}