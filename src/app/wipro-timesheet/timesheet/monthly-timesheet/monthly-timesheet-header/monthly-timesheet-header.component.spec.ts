import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MonthlyTimesheetHeaderComponent } from './monthly-timesheet-header.component';
import { RemovePrefixSuffixPipe } from 'src/app/shared/pipe/remove-prefix-suffix.pipe';
describe('MonthlyTimesheetHeaderComponent', () => {
  let component: MonthlyTimesheetHeaderComponent;
  let fixture: ComponentFixture<MonthlyTimesheetHeaderComponent>;
  CommonTestingModule.setUpTestBed(MonthlyTimesheetHeaderComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyTimesheetHeaderComponent , RemovePrefixSuffixPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyTimesheetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
