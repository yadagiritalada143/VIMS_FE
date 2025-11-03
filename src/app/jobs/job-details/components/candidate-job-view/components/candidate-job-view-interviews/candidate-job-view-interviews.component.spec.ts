import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewInterviewsComponent } from './candidate-job-view-interviews.component';

describe('CandidateJobViewInterviewsComponent', () => {
  let component: CandidateJobViewInterviewsComponent;
  let fixture: ComponentFixture<CandidateJobViewInterviewsComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewInterviewsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewInterviewsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewInterviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
