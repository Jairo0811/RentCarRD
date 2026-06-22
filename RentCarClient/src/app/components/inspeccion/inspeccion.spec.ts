import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inspeccion } from './inspeccion';

describe('Inspeccion', () => {
  let component: Inspeccion;
  let fixture: ComponentFixture<Inspeccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inspeccion],
    }).compileComponents();

    fixture = TestBed.createComponent(Inspeccion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
