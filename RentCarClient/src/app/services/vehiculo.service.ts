import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://localhost:5266/api/Vehiculos';

  constructor(private http: HttpClient) { }

  getVehiculos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getVehiculo(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearVehiculo(vehiculo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, vehiculo);
  }

  actualizarVehiculo(vehiculo: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${vehiculo.id}`, vehiculo);
  }

  eliminarVehiculo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  subirImagen(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', archivo);

    return this.http.post<any>(`${this.apiUrl}/${id}/imagen`, formData);
  }
}