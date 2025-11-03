import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ImpactedTimesheetTableComponent } from './impacted-timesheet-table.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ImpactedTimesheetTableComponent', () => {
  let component: ImpactedTimesheetTableComponent;
  let fixture: ComponentFixture<ImpactedTimesheetTableComponent>;
  CommonTestingModule.setUpTestBed(ImpactedTimesheetTableComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpactedTimesheetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
