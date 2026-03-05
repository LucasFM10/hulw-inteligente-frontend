import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentityValidation } from './identity-validation';

describe('IdentityValidation', () => {
  let component: IdentityValidation;
  let fixture: ComponentFixture<IdentityValidation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentityValidation],
    }).compileComponents();

    fixture = TestBed.createComponent(IdentityValidation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
