import { TestBed } from '@angular/core/testing';

import { Inspeccion } from './inspeccion';

describe('Inspeccion', () => {
  let service: Inspeccion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Inspeccion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
