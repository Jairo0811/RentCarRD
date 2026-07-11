import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmpleadoService } from '../../services/empleado.service';

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
    private empleadoService: EmpleadoService
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

    // Administrador predeterminado
    if (
      usuarioNormalizado === 'admin' &&
      passwordNormalizado === '1234'
    ) {
      this.limpiarSesion();

      localStorage.setItem('rolUsuario', 'admin');
      localStorage.setItem('idEmpleado', '1');
      localStorage.setItem(
        'nombreUsuario',
        'Administrador General'
      );

      this.procesandoLogin = false;

      this.router.navigateByUrl('/dashboard');
      return;
    }

    // Inicio de sesión de empleados
    this.empleadoService.getEmpleados().subscribe({
      next: (empleados: any[]) => {
        const passwordSinFormato =
          passwordNormalizado.replace(/\D/g, '');

        const empleadoValido = empleados.find((empleado: any) => {
          const usuarioEmpleado = String(
            empleado.usuario ?? ''
          )
            .trim()
            .toLowerCase();

          const cedulaEmpleado = String(
            empleado.cedula ?? ''
          ).replace(/\D/g, '');

          return (
            empleado.estado === true &&
            usuarioEmpleado === usuarioNormalizado &&
            cedulaEmpleado === passwordSinFormato
          );
        });

        if (!empleadoValido) {
          this.procesandoLogin = false;

          alert(
            'Credenciales incorrectas.\n' +
            'Para empleados, la contraseña es la cédula sin guiones.'
          );

          return;
        }

        this.limpiarSesion();

        localStorage.setItem('rolUsuario', 'empleado');
        localStorage.setItem(
          'idEmpleado',
          String(empleadoValido.id)
        );
        localStorage.setItem(
          'nombreUsuario',
          empleadoValido.nombre
        );

        this.procesandoLogin = false;

        this.router.navigateByUrl('/rentas');
      },
      error: (err: any) => {
        console.error(
          'Error al verificar credenciales',
          err
        );

        this.procesandoLogin = false;

        alert(
          'No se pudo conectar con la base de datos.'
        );
      }
    });
  }

  private limpiarSesion(): void {
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('idEmpleado');
    localStorage.removeItem('nombreUsuario');
  }
}