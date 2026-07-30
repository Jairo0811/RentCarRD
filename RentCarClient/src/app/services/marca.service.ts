import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private apiUrl = 'http://localhost:5266/api/Marcas';

  constructor(private http: HttpClient) {}

  getMarcas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearMarca(marca: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, marca);
  }

  actualizarMarca(marca: any): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${marca.id}`,
      marca
    );
  }

  deleteMarca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
