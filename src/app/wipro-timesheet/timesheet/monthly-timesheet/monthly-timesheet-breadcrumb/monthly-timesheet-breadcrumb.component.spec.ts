import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyTimesheetBreadcrumbComponent } from './monthly-timesheet-breadcrumb.component';

describe('MonthlyTimesheetBreadcrumbComponent', () => {
  let component: MonthlyTimesheetBreadcrumbComponent;
  let fixture: ComponentFixture<MonthlyTimesheetBreadcrumbComponent>;
  CommonTestingModule.setUpTestBed(MonthlyTimesheetBreadcrumbComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyTimesheetBreadcrumbComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyTimesheetBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
