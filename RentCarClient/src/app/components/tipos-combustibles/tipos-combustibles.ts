import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoCombustibleService } from '../../services/tipo-combustible.service';
import { CatalogoSimpleBase } from '../catalogo-simple/catalogo-simple.base';

@Component({
  selector: 'app-tipos-combustibles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: '../catalogo-simple/catalogo-simple.html',
})
export class TiposCombustiblesComponent extends CatalogoSimpleBase {
  readonly titulo = 'Tipos de combustible';
  readonly etiqueta = 'Descripción del combustible';
  readonly ejemplo = 'Ej. Gasolina, Diésel';
  protected readonly api = inject(TipoCombustibleService);
}
