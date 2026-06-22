import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modelo } from '../interfaces/modelo'; // Importamos tu nueva interfaz

@Injectable({
  providedIn: 'root'
})
export class ModeloService { // Le agregamos 'Service' al nombre para no confundir

  // Confirma que este puerto (7112) es el que dice tu PowerShell
  private apiUrl = 'http://localhost:5266/api/Modelos'; 

  constructor(private http: HttpClient) { }

  getModelos(): Observable<Modelo[]> {
    return this.http.get<Modelo[]>(this.apiUrl);
  }

  getModelo(id: number): Observable<Modelo> {
    return this.http.get<Modelo>(`${this.apiUrl}/${id}`);
  }

  createModelo(modelo: Modelo): Observable<Modelo> {
    return this.http.post<Modelo>(this.apiUrl, modelo);
  }

  updateModelo(id: number, modelo: Modelo): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, modelo);
  }

  deleteModelo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}