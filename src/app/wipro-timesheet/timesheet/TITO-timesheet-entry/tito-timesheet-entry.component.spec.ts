import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TitoTimesheetEntryComponent } from './tito-timesheet-entry.component';
import { HourlyTimesheetManualEntryComponent } from '../hourly-timesheet/hourly-timesheet-manual-entry/hourly-timesheet-manual-entry.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('HourlyTimesheetManualEntryComponent', () => {
  let component: TitoTimesheetEntryComponent;
  let fixture: ComponentFixture<TitoTimesheetEntryComponent>;
  CommonTestingModule.setUpTestBed(HourlyTimesheetManualEntryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TitoTimesheetEntryComponent , AccuracyPipe],
      providers:[DecimalPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitoTimesheetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
