import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalogo } from '../interfaces/modelos';
import { CatalogoApi } from './catalogo.service';

@Injectable({ providedIn: 'root' })
export class TipoCombustibleService extends CatalogoApi {
  constructor(http: HttpClient) {
    super(http, 'TiposCombustibles');
  }

  getCombustibles(): Observable<Catalogo[]> {
    return this.listar();
  }
}
