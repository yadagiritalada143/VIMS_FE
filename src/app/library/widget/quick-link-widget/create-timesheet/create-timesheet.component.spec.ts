import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreateTimesheetComponent } from './create-timesheet.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateTimesheetComponent', () => {
  let component: CreateTimesheetComponent;
  let fixture: ComponentFixture<CreateTimesheetComponent>;
  CommonTestingModule.setUpTestBed(CreateTimesheetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTimesheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
