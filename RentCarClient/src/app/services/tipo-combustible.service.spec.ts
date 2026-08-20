import { TestBed } from '@angular/core/testing';

import { TipoCombustibleService } from './tipo-combustible.service';

describe('TipoCombustibleService', () => {
  let service: TipoCombustibleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoCombustibleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
