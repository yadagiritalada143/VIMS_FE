import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DobCalendarComponent } from './dob-calendar.component';

describe('DobCalendarComponent', () => {
  let component: DobCalendarComponent;
  let fixture: ComponentFixture<DobCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DobCalendarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DobCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
