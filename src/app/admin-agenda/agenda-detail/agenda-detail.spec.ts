import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaDetail } from './agenda-detail';

describe('AgendaDetail', () => {
  let component: AgendaDetail;
  let fixture: ComponentFixture<AgendaDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
