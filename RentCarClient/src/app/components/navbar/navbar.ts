import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Arregla el aviso del *ngIf
import { RouterModule } from '@angular/router'; // <-- Necesario para los routerLink del menú
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  constructor(private readonly auth: AuthService) {}
  
  get rolActual(): string | null {
    return this.auth.isAdmin ? 'admin' : this.auth.isAuthenticated ? 'empleado' : null;
  }
  
}
