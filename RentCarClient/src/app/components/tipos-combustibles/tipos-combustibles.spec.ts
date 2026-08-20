import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiposCombustiblesComponent } from './tipos-combustibles';

describe('TiposCombustiblesComponent', () => {
  let component: TiposCombustiblesComponent;
  let fixture: ComponentFixture<TiposCombustiblesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposCombustiblesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TiposCombustiblesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
