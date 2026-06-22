import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <-- Importamos HttpClient
import { Observable } from 'rxjs'; // <-- Importamos Observable

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  // Esta URL debe coincidir con la de tu Swagger para Clientes
  private apiUrl = 'http://localhost:5266/api/Clientes'; 

  constructor(private http: HttpClient) {} // <-- Inyectamos el cliente HTTP

  // Función para obtener la lista de clientes (GET)
  getClientes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Función para registrar un cliente nuevo (POST)
  crearCliente(cliente: any): Observable<any> {
    return this.http.post(this.apiUrl, cliente);
  }
}