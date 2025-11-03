import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetAwaitingApprovalComponent } from './timesheet-awaiting-approval.component';
import { DatePipe } from '@angular/common';
describe('TimesheetAwaitingApprovalComponent', () => {
  let component: TimesheetAwaitingApprovalComponent;
  let fixture: ComponentFixture<TimesheetAwaitingApprovalComponent>;
  CommonTestingModule.setUpTestBed(TimesheetAwaitingApprovalComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetAwaitingApprovalComponent ],
      providers:[DatePipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetAwaitingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
