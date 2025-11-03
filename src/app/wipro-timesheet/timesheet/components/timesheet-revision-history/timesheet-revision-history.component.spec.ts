import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetRevisionHistoryComponent } from './timesheet-revision-history.component';

describe('TimesheetRevisionHistoryComponent', () => {
  let component: TimesheetRevisionHistoryComponent;
  let fixture: ComponentFixture<TimesheetRevisionHistoryComponent>;
  CommonTestingModule.setUpTestBed(TimesheetRevisionHistoryComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetRevisionHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetRevisionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
