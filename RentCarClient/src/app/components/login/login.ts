import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ingresar(): void {
    const usuarioNormalizado = this.usuario.trim().toLowerCase();
    const passwordNormalizado = this.password.trim();

    if (!usuarioNormalizado || !passwordNormalizado) {
      alert('Ingresa el usuario y la contraseña.');
      return;
    }

    if (this.procesandoLogin) {
      return;
    }

    this.procesandoLogin = true;

    this.authService.login(usuarioNormalizado, passwordNormalizado).subscribe({
      next: (sesion) => {
        this.procesandoLogin = false;
        this.router.navigateByUrl(sesion.rol.toLowerCase() === 'admin' ? '/dashboard' : '/rentas');
      },
      error: (err: any) => {
        console.error(
          'Error al verificar credenciales',
          err
        );

        this.procesandoLogin = false;

        alert(err.status === 401 ? 'Credenciales incorrectas.' : 'No se pudo conectar con el servidor.');
      }
    });
  }

  private limpiarSesion(): void {
    this.authService.logout();
  }
}
