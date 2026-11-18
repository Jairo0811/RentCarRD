import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Vehiculo } from '../interfaces/modelos';

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Vehiculos`;

  constructor(private readonly http: HttpClient) {}

  getVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.apiUrl);
  }

  getVehiculo(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }

  crearVehiculo(vehiculo: Vehiculo): Observable<Vehiculo> {
    return this.http.post<Vehiculo>(this.apiUrl, VehiculoService.cuerpo(vehiculo));
  }

  actualizarVehiculo(vehiculo: Vehiculo): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${vehiculo.id}`, VehiculoService.cuerpo(vehiculo));
  }

  eliminarVehiculo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  subirImagen(id: number, archivo: File): Observable<{ id: number; imagenUrl: string }> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return this.http.post<{ id: number; imagenUrl: string }>(`${this.apiUrl}/${id}/imagen`, formData);
  }

  /** La imagen no viaja en el cuerpo: solo se cambia mediante el endpoint de carga. */
  static cuerpo(v: Vehiculo) {
    return {
      descripcion: v.descripcion,
      noChasis: v.noChasis || null,
      noMotor: v.noMotor || null,
      noPlaca: v.noPlaca,
      idTipoVehiculo: v.idTipoVehiculo,
      idMarca: v.idMarca,
      idModelo: v.idModelo,
      idTipoCombustible: v.idTipoCombustible,
      estadoOperacion: v.estadoOperacion,
    };
  }
}
