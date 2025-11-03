import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HourlyTimesheetAutomaticEntryComponent } from './hourly-timesheet-automatic-entry.component';

describe('HourlyTimesheetManualEntryComponent', () => {
  let component: HourlyTimesheetAutomaticEntryComponent;
  let fixture: ComponentFixture<HourlyTimesheetAutomaticEntryComponent>;
  CommonTestingModule.setUpTestBed(HourlyTimesheetAutomaticEntryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HourlyTimesheetAutomaticEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HourlyTimesheetAutomaticEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
