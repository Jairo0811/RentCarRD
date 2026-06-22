import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RentaService {
  private apiUrl = 'http://localhost:5266/api/Rentas';

  constructor(private http: HttpClient) { }

  getRentas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  crearRenta(renta: any): Observable<any> {
    return this.http.post(this.apiUrl, renta);
  }

  devolverRenta(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/devolucion`, {});
  }
}