import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiposCombustibles } from './tipos-combustibles';

describe('TiposCombustibles', () => {
  let component: TiposCombustibles;
  let fixture: ComponentFixture<TiposCombustibles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposCombustibles],
    }).compileComponents();

    fixture = TestBed.createComponent(TiposCombustibles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
