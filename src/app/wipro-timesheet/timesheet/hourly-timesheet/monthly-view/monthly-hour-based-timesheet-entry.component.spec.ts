import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyHourBasedTimesheetEntryComponent } from './monthly-hour-based-timesheet-entry.component';
import { ChunkPipe } from 'src/app/shared/pipe/chunk.pipe';
describe('MonthlyHourBasedTimesheetEntryComponent', () => {
  let component: MonthlyHourBasedTimesheetEntryComponent;
  let fixture: ComponentFixture<MonthlyHourBasedTimesheetEntryComponent>;
  CommonTestingModule.setUpTestBed(MonthlyHourBasedTimesheetEntryComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyHourBasedTimesheetEntryComponent ,ChunkPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyHourBasedTimesheetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
