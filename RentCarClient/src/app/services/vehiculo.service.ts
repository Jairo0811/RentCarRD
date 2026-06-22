import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  // Mantenemos la URL que ya confirmamos que funciona
  private apiUrl = 'http://localhost:5266/api/Vehiculos';

  constructor(private http: HttpClient) { }

  // Método para obtener la lista (GET)
  getVehiculos(): Observable<any> {
    return this.http.get(this.apiUrl);
  }


  crearVehiculo(vehiculo: any): Observable<any> {
    return this.http.post(this.apiUrl, vehiculo);
  }
}