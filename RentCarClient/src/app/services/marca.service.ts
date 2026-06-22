import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// LÍNEA 4 BORRADA: Ya no intentamos importar 'Marca' de un lugar que no existe

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private apiUrl = 'http://localhost:5266/api/Marcas';

  constructor(private http: HttpClient) { }

  // Usamos 'any[]' para evitar que Angular busque una interfaz que no encuentra
  getMarcas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearMarca(marca: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, marca);
  }

  deleteMarca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}