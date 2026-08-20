import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RentaService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Rentas`;

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
