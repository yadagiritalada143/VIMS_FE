import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { InterviewTimerComponent } from './interview-timer.component';
import { FormatTimePipe } from './interview-timer.component';
describe('InterviewTimerComponent', () => {
  let component: InterviewTimerComponent;
  let fixture: ComponentFixture<InterviewTimerComponent>;
  CommonTestingModule.setUpTestBed(InterviewTimerComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InterviewTimerComponent, FormatTimePipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterviewTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
