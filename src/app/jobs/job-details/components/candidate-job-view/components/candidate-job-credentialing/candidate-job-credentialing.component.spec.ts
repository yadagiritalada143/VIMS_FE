import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobCredentialingComponent } from './candidate-job-credentialing.component';

describe('CandidateJobCredentialingComponent', () => {
  let component: CandidateJobCredentialingComponent;
  let fixture: ComponentFixture<CandidateJobCredentialingComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobCredentialingComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobCredentialingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobCredentialingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
