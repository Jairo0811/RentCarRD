import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarcaService } from '../../services/marca.service';
import { CatalogoSimpleBase } from '../catalogo-simple/catalogo-simple.base';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: '../catalogo-simple/catalogo-simple.html',
})
export class MarcasComponent extends CatalogoSimpleBase {
  readonly titulo = 'Marcas';
  readonly etiqueta = 'Descripción de la marca';
  readonly ejemplo = 'Ej. Toyota';
  protected readonly api = inject(MarcaService);
}
