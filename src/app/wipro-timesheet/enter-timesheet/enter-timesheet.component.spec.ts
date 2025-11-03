import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { EnterTimesheetComponent } from './enter-timesheet.component';

describe('EnterTimesheetComponent', () => {
  let component: EnterTimesheetComponent;
  let fixture: ComponentFixture<EnterTimesheetComponent>;
  CommonTestingModule.setUpTestBed(EnterTimesheetComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EnterTimesheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnterTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
