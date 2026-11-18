import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearRentaRequest, EstadoRenta, EstadoVehiculo, Renta } from '../interfaces/modelos';

export interface DevolucionResponse {
  mensaje: string;
  noRenta: number;
  estado: EstadoRenta;
  fechaDevolucion: string;
  fechaDevolucionPrevista: string;
  subtotal: number;
  itbis: number;
  total: number;
  idVehiculo: number;
  estadoVehiculo: EstadoVehiculo;
}

@Injectable({ providedIn: 'root' })
export class RentaService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Rentas`;

  constructor(private readonly http: HttpClient) {}

  getRentas(): Observable<Renta[]> {
    return this.http.get<Renta[]>(this.apiUrl);
  }

  /** El empleado responsable no se envía: la API lo toma del JWT (claim empleado_id). */
  crearRenta(renta: CrearRentaRequest): Observable<Renta> {
    return this.http.post<Renta>(this.apiUrl, {
      idVehiculo: renta.idVehiculo,
      idCliente: renta.idCliente,
      fechaRenta: renta.fechaRenta,
      montoXDia: renta.montoXDia,
      cantidadDias: renta.cantidadDias,
      comentario: renta.comentario,
    });
  }

  devolverRenta(id: number): Observable<DevolucionResponse> {
    return this.http.put<DevolucionResponse>(`${this.apiUrl}/${id}/devolucion`, {});
  }
}
