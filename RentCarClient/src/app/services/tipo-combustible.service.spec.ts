import { TestBed } from '@angular/core/testing';

import { TipoCombustible } from './tipo-combustible';

describe('TipoCombustible', () => {
  let service: TipoCombustible;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoCombustible);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
