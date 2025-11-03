import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetTabComponent } from './timesheet-tab.component';

describe('TimesheetTabComponent', () => {
  let component: TimesheetTabComponent;
  let fixture: ComponentFixture<TimesheetTabComponent>;
  CommonTestingModule.setUpTestBed(TimesheetTabComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimesheetTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
