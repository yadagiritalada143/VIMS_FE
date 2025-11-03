import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewInterviewDetailsComponent } from './candidate-job-view-interview-details.component';

describe('CandidateJobViewInterviewsComponent', () => {
  let component: CandidateJobViewInterviewDetailsComponent;
  let fixture: ComponentFixture<CandidateJobViewInterviewDetailsComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewInterviewDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewInterviewDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewInterviewDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
