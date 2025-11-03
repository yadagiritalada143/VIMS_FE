import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyHourBasedCopyTimesheetComponent } from './monthly-hour-based-copy-timesheet.component';
import { ChunkPipe } from 'src/app/shared/pipe/chunk.pipe';
describe('MonthlyHourBasedCopyTimesheetComponent', () => {
  let component: MonthlyHourBasedCopyTimesheetComponent;
  let fixture: ComponentFixture<MonthlyHourBasedCopyTimesheetComponent>;
  CommonTestingModule.setUpTestBed(MonthlyHourBasedCopyTimesheetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyHourBasedCopyTimesheetComponent ,ChunkPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyHourBasedCopyTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
