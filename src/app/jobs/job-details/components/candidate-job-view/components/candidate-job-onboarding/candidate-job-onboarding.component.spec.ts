import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobOnboardingComponent } from './candidate-job-onboarding.component';

describe('CandidateJobOnboardingComponent', () => {
  let component: CandidateJobOnboardingComponent;
  let fixture: ComponentFixture<CandidateJobOnboardingComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobOnboardingComponent)
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobOnboardingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
