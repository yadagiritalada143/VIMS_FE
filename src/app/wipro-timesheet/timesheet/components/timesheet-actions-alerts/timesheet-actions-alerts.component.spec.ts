import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetActionsAlertsComponent } from './timesheet-actions-alerts.component';

describe('TimesheetActionsAlertsComponent', () => {
  let component: TimesheetActionsAlertsComponent;
  let fixture: ComponentFixture<TimesheetActionsAlertsComponent>;
  CommonTestingModule.setUpTestBed(TimesheetActionsAlertsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetActionsAlertsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetActionsAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
