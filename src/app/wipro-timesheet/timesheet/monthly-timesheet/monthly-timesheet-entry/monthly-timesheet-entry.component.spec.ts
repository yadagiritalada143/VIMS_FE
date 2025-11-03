import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyTimesheetEntryComponent } from './monthly-timesheet-entry.component';
import { ChunkPipe } from 'src/app/shared/pipe/chunk.pipe';
describe('MonthlyTimesheetEntryComponent', () => {
  let component: MonthlyTimesheetEntryComponent;
  let fixture: ComponentFixture<MonthlyTimesheetEntryComponent>;
  CommonTestingModule.setUpTestBed(MonthlyTimesheetEntryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyTimesheetEntryComponent , ChunkPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyTimesheetEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
