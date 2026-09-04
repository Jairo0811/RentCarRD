import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { TipoVehiculoService } from './tipo-vehiculo.service';

describe('TipoVehiculoService', () => {
  let service: TipoVehiculoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(TipoVehiculoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
