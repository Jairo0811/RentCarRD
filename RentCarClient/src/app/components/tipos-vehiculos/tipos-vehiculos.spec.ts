import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiposVehiculos } from './tipos-vehiculos';

describe('TiposVehiculos', () => {
  let component: TiposVehiculos;
  let fixture: ComponentFixture<TiposVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposVehiculos],
    }).compileComponents();

    fixture = TestBed.createComponent(TiposVehiculos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
