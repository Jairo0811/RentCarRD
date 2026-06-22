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

  ingresar() {
    // 1. Acceso del Administrador
    if (this.usuario === 'admin' && this.password === '1234') {
      localStorage.setItem('rolUsuario', 'admin');
      localStorage.setItem('nombreUsuario', 'Administrador General');
      this.router.navigate(['/dashboard']);
      return; 
    }

    // 2. Validación dinámica de Empleados
    this.empleadoService.getEmpleados().subscribe({
      next: (empleados: any[]) => {
        
        const empleadoValido = empleados.find(emp => {
          // Quitamos todos los guiones de la cédula de la base de datos
          const cedulaLimpia = emp.cedula.replace(/-/g, '');
          
          return emp.usuario && 
                 emp.usuario.toLowerCase() === this.usuario.toLowerCase() && 
                 cedulaLimpia === this.password;
        });

        if (empleadoValido) {
          localStorage.setItem('rolUsuario', 'empleado');
          localStorage.setItem('nombreUsuario', empleadoValido.nombre);
          
          this.router.navigate(['/rentas']); 
        } else {
          alert('Credenciales incorrectas.\nContraseña debe ser tu cédula SIN guiones.');
        }
      },
      error: (err) => {
        console.error('Error al verificar credenciales', err);
        alert('No se pudo conectar con la base de datos.');
      }
    });
  }
}