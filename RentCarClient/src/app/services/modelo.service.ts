import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Modelo } from '../interfaces/modelos';

@Injectable({ providedIn: 'root' })
export class ModeloService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Modelos`;

  constructor(private readonly http: HttpClient) {}

  getModelos(): Observable<Modelo[]> {
    return this.http.get<Modelo[]>(this.apiUrl);
  }

  crearModelo(modelo: Modelo): Observable<Modelo> {
    return this.http.post<Modelo>(this.apiUrl, this.cuerpo(modelo));
  }

  actualizarModelo(modelo: Modelo): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${modelo.id}`, this.cuerpo(modelo));
  }

  eliminarModelo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private cuerpo(modelo: Modelo) {
    return { idMarca: Number(modelo.idMarca), descripcion: modelo.descripcion, estado: modelo.estado };
  }
}
