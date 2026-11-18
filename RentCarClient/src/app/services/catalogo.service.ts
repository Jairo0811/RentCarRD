import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Catalogo } from '../interfaces/modelos';

/** Operaciones CRUD comunes de los catálogos simples (descripción + estado). */
export interface CatalogoCrud<T extends Catalogo = Catalogo> {
  listar(): Observable<T[]>;
  crear(item: T): Observable<T>;
  actualizar(item: T): Observable<void>;
  eliminar(id: number): Observable<void>;
}

export class CatalogoApi<T extends Catalogo = Catalogo> implements CatalogoCrud<T> {
  protected readonly apiUrl: string;

  constructor(
    protected readonly http: HttpClient,
    recurso: string,
  ) {
    this.apiUrl = `${environment.apiBaseUrl}/api/${recurso}`;
  }

  listar(): Observable<T[]> {
    return this.http.get<T[]>(this.apiUrl);
  }

  crear(item: T): Observable<T> {
    return this.http.post<T>(this.apiUrl, { descripcion: item.descripcion, estado: item.estado });
  }

  actualizar(item: T): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${item.id}`, { descripcion: item.descripcion, estado: item.estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
