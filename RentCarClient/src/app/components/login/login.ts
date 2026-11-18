import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Mensaje de error de login comprensible según la respuesta de la API. */
export function mensajeLogin(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos.';
    if (error.status === 429) return 'Demasiados intentos. Espere unos minutos antes de volver a intentarlo.';
    if (error.status === 400) return 'Revise el usuario (mínimo 3 caracteres) y la contraseña (mínimo 8).';
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifique que la API esté en ejecución.';
  }
  return 'No se pudo iniciar sesión. Intente nuevamente.';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  usuario = '';
  password = '';
  procesandoLogin = false;
  error = '';
  aviso = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('motivo') === 'sesion') {
      this.aviso = 'Su sesión expiró o fue cerrada. Inicie sesión nuevamente.';
    }
  }

  ingresar(): void {
    if (this.procesandoLogin) return;

    const usuario = this.usuario.trim().toLowerCase();
    // La contraseña no se recorta: los espacios forman parte de ella.
    if (!usuario || !this.password) {
      this.error = 'Ingresa el usuario y la contraseña.';
      return;
    }

    this.error = '';
    this.procesandoLogin = true;
    this.authService.login(usuario, this.password).subscribe({
      next: () => {
        this.procesandoLogin = false;
        this.password = '';
        void this.router.navigateByUrl(this.authService.inicio());
      },
      error: (err: unknown) => {
        this.procesandoLogin = false;
        this.error = mensajeLogin(err);
      },
    });
  }
}
