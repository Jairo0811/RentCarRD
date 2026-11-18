import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';
import { CatalogoSimpleBase } from '../catalogo-simple/catalogo-simple.base';

@Component({
  selector: 'app-tipos-vehiculos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: '../catalogo-simple/catalogo-simple.html',
})
export class TiposVehiculosComponent extends CatalogoSimpleBase {
  readonly titulo = 'Tipos de vehículos';
  readonly etiqueta = 'Descripción del tipo';
  readonly ejemplo = 'Ej. Sedán, SUV';
  protected readonly api = inject(TipoVehiculoService);
}
