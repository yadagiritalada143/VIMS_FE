import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetConfigurationListComponent } from './timesheet-configuration-list.component';

describe('TimesheetConfigurationListComponent', () => {
  let component: TimesheetConfigurationListComponent;
  let fixture: ComponentFixture<TimesheetConfigurationListComponent>;
  CommonTestingModule.setUpTestBed(TimesheetConfigurationListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetConfigurationListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetConfigurationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
