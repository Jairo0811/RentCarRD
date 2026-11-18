import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Inspeccion } from '../interfaces/modelos';

@Injectable({ providedIn: 'root' })
export class InspeccionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Inspecciones`;

  constructor(private readonly http: HttpClient) {}

  getInspecciones(): Observable<Inspeccion[]> {
    return this.http.get<Inspeccion[]>(this.apiUrl);
  }

  crearInspeccion(inspeccion: Inspeccion): Observable<Inspeccion> {
    return this.http.post<Inspeccion>(this.apiUrl, InspeccionService.cuerpo(inspeccion));
  }

  actualizarInspeccion(inspeccion: Inspeccion): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${inspeccion.idTransaccion}`, InspeccionService.cuerpo(inspeccion));
  }

  eliminarInspeccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** El inspector no se envía: la API lo toma del JWT y lo conserva al editar. */
  static cuerpo(i: Inspeccion) {
    const { idTransaccion: _id, idEmpleadoInspeccion: _inspector, ...datos } = i;
    return datos;
  }
}
