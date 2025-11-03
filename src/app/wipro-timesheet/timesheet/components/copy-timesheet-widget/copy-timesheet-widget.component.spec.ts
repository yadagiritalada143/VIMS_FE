import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CopyTimesheetWidgetComponent } from './copy-timesheet-widget.component';

describe('CopyTimesheetWidgetComponent', () => {
  let component: CopyTimesheetWidgetComponent;
  let fixture: ComponentFixture<CopyTimesheetWidgetComponent>;
  CommonTestingModule.setUpTestBed(CopyTimesheetWidgetComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyTimesheetWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyTimesheetWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
