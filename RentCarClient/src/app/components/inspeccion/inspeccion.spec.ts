import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspeccionComponent } from './inspeccion';

describe('InspeccionComponent', () => {
  let component: InspeccionComponent;
  let fixture: ComponentFixture<InspeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspeccionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InspeccionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
