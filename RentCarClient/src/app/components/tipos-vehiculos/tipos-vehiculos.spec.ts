import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiposVehiculosComponent } from './tipos-vehiculos';

describe('TiposVehiculosComponent', () => {
  let component: TiposVehiculosComponent;
  let fixture: ComponentFixture<TiposVehiculosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposVehiculosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TiposVehiculosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
