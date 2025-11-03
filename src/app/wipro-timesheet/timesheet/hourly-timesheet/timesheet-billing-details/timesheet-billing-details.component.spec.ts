import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetBillingDetailsComponent } from './timesheet-billing-details.component';

describe('TimesheetBillingDetailsComponent', () => {
  let component: TimesheetBillingDetailsComponent;
  let fixture: ComponentFixture<TimesheetBillingDetailsComponent>;
  CommonTestingModule.setUpTestBed(TimesheetBillingDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetBillingDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetBillingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
