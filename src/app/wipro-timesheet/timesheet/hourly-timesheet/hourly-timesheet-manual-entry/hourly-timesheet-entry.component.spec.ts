import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HourlyTimesheetManualEntryComponent } from './hourly-timesheet-manual-entry.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('HourlyTimesheetManualEntryComponent', () => {
  let component: HourlyTimesheetManualEntryComponent;
  let fixture: ComponentFixture<HourlyTimesheetManualEntryComponent>;
  CommonTestingModule.setUpTestBed(HourlyTimesheetManualEntryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HourlyTimesheetManualEntryComponent , AccuracyPipe],
      providers : [DecimalPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HourlyTimesheetManualEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
