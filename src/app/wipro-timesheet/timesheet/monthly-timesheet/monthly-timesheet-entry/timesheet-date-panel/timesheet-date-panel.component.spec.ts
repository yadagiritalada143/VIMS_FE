import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyTimesheetDatePanelComponent } from './timesheet-date-panel.component';

describe('MonthlyTimesheetDatePanelComponent', () => {
  let component: MonthlyTimesheetDatePanelComponent;
  let fixture: ComponentFixture<MonthlyTimesheetDatePanelComponent>;
  CommonTestingModule.setUpTestBed(MonthlyTimesheetDatePanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyTimesheetDatePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyTimesheetDatePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
