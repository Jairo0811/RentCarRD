import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalogo } from '../interfaces/modelos';
import { CatalogoApi } from './catalogo.service';

@Injectable({ providedIn: 'root' })
export class TipoVehiculoService extends CatalogoApi {
  constructor(http: HttpClient) {
    super(http, 'TiposVehiculos');
  }

  getTipos(): Observable<Catalogo[]> {
    return this.listar();
  }
}
