import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCombustible } from '../components/tipos-combustibles/tipos-combustibles';

@Injectable({ providedIn: 'root' })
export class TipoCombustibleService {
  private apiUrl = 'http://localhost:5266/api/TiposCombustibles';

  constructor(private http: HttpClient) { }

  getCombustibles(): Observable<TipoCombustible[]> {
    return this.http.get<TipoCombustible[]>(this.apiUrl);
  }
  crearCombustible(combustible: TipoCombustible): Observable<TipoCombustible> {
    return this.http.post<TipoCombustible>(this.apiUrl, combustible);
  }
  deleteCombustible(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}