import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobOfferApprovalComponent } from './candidate-job-offer-approval.component';

describe('CandidateJobOfferApprovalComponent', () => {
  let component: CandidateJobOfferApprovalComponent;
  let fixture: ComponentFixture<CandidateJobOfferApprovalComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobOfferApprovalComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobOfferApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobOfferApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
