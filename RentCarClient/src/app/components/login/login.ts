import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  usuario = '';
  password = '';
  procesandoLogin = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  ingresar(): void {
    const usuario = this.usuario.trim().toLowerCase();
    if (usuario.length < 3 || this.password.length < 12 || this.procesandoLogin) {
      this.error = 'Ingresa un usuario válido y una contraseña de al menos 12 caracteres.';
      return;
    }

    this.error = '';
    this.procesandoLogin = true;
    this.auth
      .login(usuario, this.password)
      .pipe(finalize(() => (this.procesandoLogin = false)))
      .subscribe({
        next: (session) => {
          this.password = '';
          void this.router.navigateByUrl(
            session.rol === 'Administrador' ? '/dashboard' : '/rentas'
          );
        },
        error: (response) => {
          this.password = '';
          this.error = response.status === 429
            ? 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
            : 'Usuario o contraseña incorrectos.';
        }
      });
  }
}
