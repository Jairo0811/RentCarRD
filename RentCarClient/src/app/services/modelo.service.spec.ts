import { TestBed } from '@angular/core/testing';

import { Modelo } from './modelo';

describe('Modelo', () => {
  let service: Modelo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Modelo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
