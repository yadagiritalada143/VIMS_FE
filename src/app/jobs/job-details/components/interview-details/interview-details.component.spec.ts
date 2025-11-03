import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { InterviewDetailsComponent } from './interview-details.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';

describe('InterviewDetailsComponent', () => {
  let component: InterviewDetailsComponent;
  let fixture: ComponentFixture<InterviewDetailsComponent>;
  CommonTestingModule.setUpTestBed(InterviewDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InterviewDetailsComponent, LocalDateFormatPipe, SnakeToTitleCasePipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterviewDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
