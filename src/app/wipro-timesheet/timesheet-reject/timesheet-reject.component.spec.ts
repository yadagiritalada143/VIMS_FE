import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetRejectComponent } from './timesheet-reject.component';

describe('TimesheetRejectComponent', () => {
  let component: TimesheetRejectComponent;
  let fixture: ComponentFixture<TimesheetRejectComponent>;
  CommonTestingModule.setUpTestBed(TimesheetRejectComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetRejectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetRejectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
