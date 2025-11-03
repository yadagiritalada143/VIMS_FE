import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetConfigurationListsComponent } from './timesheet-configuration-lists.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TimesheetConfigurationListsComponent', () => {
  let component: TimesheetConfigurationListsComponent;
  let fixture: ComponentFixture<TimesheetConfigurationListsComponent>;
  CommonTestingModule.setUpTestBed(TimesheetConfigurationListsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetConfigurationListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
