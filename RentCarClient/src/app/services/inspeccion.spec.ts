import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { InspeccionService } from './inspeccion.service';

describe('InspeccionService', () => {
  let service: InspeccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(InspeccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
