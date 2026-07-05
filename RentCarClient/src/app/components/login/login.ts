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

  constructor(
    private router: Router,
    private empleadoService: EmpleadoService
  ) {}

  ingresar(): void {
    const usuarioNormalizado = this.usuario.trim().toLowerCase();
    const passwordNormalizado = this.password.trim();

    if (usuarioNormalizado === 'admin' && passwordNormalizado === '1234') {
      localStorage.setItem('rolUsuario', 'admin');
      localStorage.setItem('idEmpleado', '1');
      localStorage.setItem('nombreUsuario', 'Administrador General');

      this.router.navigate(['/dashboard']);
      return;
    }

    this.empleadoService.getEmpleados().subscribe({
      next: (empleados: any[]) => {
        const empleadoValido = empleados.find((emp: any) => {
          const usuarioEmpleado = String(emp.usuario ?? '').trim().toLowerCase();
          const cedulaLimpia = String(emp.cedula ?? '').replace(/\D/g, '');

          return (
            emp.estado === true &&
            usuarioEmpleado === usuarioNormalizado &&
            cedulaLimpia === passwordNormalizado.replace(/\D/g, '')
          );
        });

        if (empleadoValido) {
          localStorage.setItem('rolUsuario', 'empleado');
          localStorage.setItem('idEmpleado', String(empleadoValido.id));
          localStorage.setItem('nombreUsuario', empleadoValido.nombre);

          this.router.navigate(['/rentas']);
          return;
        }

        alert('Credenciales incorrectas.\nContraseña debe ser tu cédula SIN guiones.');
      },
      error: (err: any) => {
        console.error('Error al verificar credenciales', err);
        alert('No se pudo conectar con la base de datos.');
      }
    });
  }
}