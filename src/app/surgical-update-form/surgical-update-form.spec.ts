import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurgicalUpdateForm } from './surgical-update-form';

describe('SurgicalUpdateForm', () => {
  let component: SurgicalUpdateForm;
  let fixture: ComponentFixture<SurgicalUpdateForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurgicalUpdateForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SurgicalUpdateForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
