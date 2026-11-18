import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente, TipoPersona } from '../interfaces/modelos';

export interface ValidacionDocumento {
  documento: string;
  documentoFormateado: string;
  tipoPersona: TipoPersona;
  tipoDocumento: string;
  esValida: boolean;
  existe: boolean;
  nombreCliente: string | null;
  fuente: string;
  mensaje: string;
}

/** Campos que la API acepta para un cliente (método de pago simulado: marca + 4 dígitos). */
export type ClienteRequest = Omit<Cliente, 'id'>;

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Clientes`;

  constructor(private readonly http: HttpClient) {}

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  crearCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, ClienteService.cuerpo(cliente));
  }

  actualizarCliente(cliente: Cliente): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${cliente.id}`, ClienteService.cuerpo(cliente));
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  validarDocumento(documento: string, tipoPersona: TipoPersona, idCliente?: number): Observable<ValidacionDocumento> {
    let params = new HttpParams().set('tipoPersona', tipoPersona);
    if (idCliente) {
      params = params.set('idCliente', idCliente);
    }
    return this.http.get<ValidacionDocumento>(`${this.apiUrl}/validar-documento/${encodeURIComponent(documento)}`, { params });
  }

  /**
   * Lista blanca de campos enviados: aunque el objeto del formulario tuviera propiedades
   * adicionales (p. ej. restos de versiones anteriores), nunca viajan a la API.
   */
  static cuerpo(cliente: Cliente): ClienteRequest {
    return {
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      tipoPersona: cliente.tipoPersona,
      limiteCredito: Number(cliente.limiteCredito) || 0,
      estado: cliente.estado,
      tipoTarjeta: cliente.tipoTarjeta || null,
      ultimosDigitosTarjeta: cliente.ultimosDigitosTarjeta || null,
    };
  }
}
