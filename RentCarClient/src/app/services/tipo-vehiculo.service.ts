import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoVehiculo } from '../components/tipos-vehiculos/tipos-vehiculos';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TipoVehiculoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/TiposVehiculos`;

  constructor(private http: HttpClient) { }

  getTipos(): Observable<TipoVehiculo[]> {
    return this.http.get<TipoVehiculo[]>(this.apiUrl);
  }
  crearTipo(tipo: TipoVehiculo): Observable<TipoVehiculo> {
    return this.http.post<TipoVehiculo>(this.apiUrl, tipo);
  }
  deleteTipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
