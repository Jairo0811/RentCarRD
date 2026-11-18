import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Empleado } from '../interfaces/modelos';

export interface ValidacionCedulaEmpleado {
  cedula: string;
  cedulaFormateada: string;
  esValida: boolean;
  existe: boolean;
  nombreEmpleado: string | null;
  fuente: string;
  mensaje: string;
}

/** Administración de empleados (solo rol Admin; la API responde 403 a cualquier otro). */
@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Empleados`;

  constructor(private readonly http: HttpClient) {}

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  getEmpleado(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, EmpleadoService.cuerpo(empleado));
  }

  actualizarEmpleado(empleado: Empleado): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${empleado.id}`, EmpleadoService.cuerpo(empleado));
  }

  deleteEmpleado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  validarCedula(cedula: string, idEmpleado?: number): Observable<ValidacionCedulaEmpleado> {
    const params: Record<string, number> = idEmpleado ? { idEmpleado } : {};
    return this.http.get<ValidacionCedulaEmpleado>(`${this.apiUrl}/validar-cedula/${encodeURIComponent(cedula)}`, { params });
  }

  /** Lista blanca: la contraseña solo se envía si se escribió una nueva. */
  static cuerpo(e: Empleado) {
    return {
      nombre: e.nombre,
      cedula: e.cedula,
      tandaLabor: e.tandaLabor,
      porcientoComision: Number(e.porcientoComision) || 0,
      fechaIngreso: e.fechaIngreso || null,
      estado: e.estado,
      usuario: e.usuario,
      ...(e.password ? { password: e.password } : {}),
    };
  }
}
