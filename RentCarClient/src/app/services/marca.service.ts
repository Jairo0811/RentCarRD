import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalogo } from '../interfaces/modelos';
import { CatalogoApi } from './catalogo.service';

@Injectable({ providedIn: 'root' })
export class MarcaService extends CatalogoApi {
  constructor(http: HttpClient) {
    super(http, 'Marcas');
  }

  getMarcas(): Observable<Catalogo[]> {
    return this.listar();
  }
}
