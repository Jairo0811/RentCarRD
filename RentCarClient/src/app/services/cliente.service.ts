import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly apiUrl = 'http://localhost:5266/api/Clientes';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getCliente(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  crearCliente(cliente: any): Observable<any> {
    return this.http.post(this.apiUrl, cliente);
  }

  actualizarCliente(cliente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cliente.id}`, cliente);
  }

  eliminarCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  validarDocumento(
    documento: string,
    tipoPersona: string,
    idCliente?: number
  ): Observable<any> {
    let params = new HttpParams().set('tipoPersona', tipoPersona);

    if (idCliente) {
      params = params.set('idCliente', idCliente);
    }

    return this.http.get(
      `${this.apiUrl}/validar-documento/${documento}`,
      { params }
    );
  }

  validarCedula(cedula: string, idCliente?: number): Observable<any> {
    return this.validarDocumento(cedula, 'Fisica', idCliente);
  }
}
