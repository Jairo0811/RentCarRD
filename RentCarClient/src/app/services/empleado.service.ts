import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from '../components/empleados/empleados';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private apiUrl = 'http://localhost:5266/api/Empleados';

  constructor(private http: HttpClient) { }

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  getEmpleado(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, empleado);
  }

  actualizarEmpleado(empleado: Empleado): Observable<any> {
    return this.http.put(`${this.apiUrl}/${empleado.id}`, empleado);
  }

  deleteEmpleado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  validarCedula(cedula: string, idEmpleado?: number): Observable<any> {

    let url = `${this.apiUrl}/validar-cedula/${cedula}`;

    if (idEmpleado) {
      url += `?idEmpleado=${idEmpleado}`;
    }

    return this.http.get(url);
  }

}