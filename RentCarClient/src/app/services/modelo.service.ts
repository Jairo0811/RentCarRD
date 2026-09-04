import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModeloService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Modelos`;

  constructor(private http: HttpClient) {}

  getModelos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearModelo(modelo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, modelo);
  }

  createModelo(modelo: any): Observable<any> {
    return this.crearModelo(modelo);
  }

  actualizarModelo(modelo: any): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${modelo.id}`,
      modelo
    );
  }

  eliminarModelo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  deleteModelo(id: number): Observable<any> {
    return this.eliminarModelo(id);
  }
}
