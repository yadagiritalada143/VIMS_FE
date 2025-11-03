import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyHourBasedTimesheetDatePanelComponent } from './monthly-hour-based-timesheet-date-panel.component';

describe('MonthlyHourBasedTimesheetDatePanelComponent', () => {
  let component: MonthlyHourBasedTimesheetDatePanelComponent;
  let fixture: ComponentFixture<MonthlyHourBasedTimesheetDatePanelComponent>;
  CommonTestingModule.setUpTestBed(MonthlyHourBasedTimesheetDatePanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyHourBasedTimesheetDatePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyHourBasedTimesheetDatePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
