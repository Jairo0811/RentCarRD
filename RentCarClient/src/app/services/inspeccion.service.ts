import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InspeccionService {
  private apiUrl = 'http://localhost:5266/api/Inspecciones';

  constructor(private http: HttpClient) { }

  getInspecciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearInspeccion(inspeccion: any): Observable<any> {
    return this.http.post(this.apiUrl, inspeccion);
  }
}