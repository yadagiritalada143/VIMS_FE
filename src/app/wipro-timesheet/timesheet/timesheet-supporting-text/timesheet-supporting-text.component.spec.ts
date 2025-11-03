import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TimesheetSupportingTextComponent } from './timesheet-supporting-text.component';

describe('TimesheetSupportingTextComponent', () => {
  let component: TimesheetSupportingTextComponent;
  let fixture: ComponentFixture<TimesheetSupportingTextComponent>;
  CommonTestingModule.setUpTestBed(TimesheetSupportingTextComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimesheetSupportingTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetSupportingTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
