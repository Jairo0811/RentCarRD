import { TestBed } from '@angular/core/testing';

import { TipoVehiculo } from './tipo-vehiculo';

describe('TipoVehiculo', () => {
  let service: TipoVehiculo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoVehiculo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
