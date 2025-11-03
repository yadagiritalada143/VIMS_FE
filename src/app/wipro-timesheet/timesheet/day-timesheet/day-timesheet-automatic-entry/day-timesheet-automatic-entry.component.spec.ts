import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DayTimesheetAutomaticEntryComponent } from './day-timesheet-automatic-entry.component';
import { HourlyTimesheetManualEntryComponent } from '../../hourly-timesheet/hourly-timesheet-manual-entry/hourly-timesheet-manual-entry.component';

describe('HourlyTimesheetManualEntryComponent', () => {
  let component: DayTimesheetAutomaticEntryComponent;
  let fixture: ComponentFixture<DayTimesheetAutomaticEntryComponent>;
  CommonTestingModule.setUpTestBed(HourlyTimesheetManualEntryComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DayTimesheetAutomaticEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DayTimesheetAutomaticEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
