import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobSubmissionRehireApprovalComponent } from './candidate-job-submission-rehire-approval.component';

describe('CandidateJobSubmissionApprovalComponent', () => {
  let component: CandidateJobSubmissionRehireApprovalComponent;
  let fixture: ComponentFixture<CandidateJobSubmissionRehireApprovalComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobSubmissionRehireApprovalComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobSubmissionRehireApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobSubmissionRehireApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
