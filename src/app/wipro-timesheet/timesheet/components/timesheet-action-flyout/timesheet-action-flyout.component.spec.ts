import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetActionFlyoutComponent } from './timesheet-action-flyout.component';

describe('TimesheetActionFlyoutComponent', () => {
  let component: TimesheetActionFlyoutComponent;
  let fixture: ComponentFixture<TimesheetActionFlyoutComponent>;
  CommonTestingModule.setUpTestBed(TimesheetActionFlyoutComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetActionFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetActionFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
