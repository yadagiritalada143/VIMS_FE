import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobProfileComponent } from './candidate-job-profile.component';

describe('CandidateJobProfileComponent', () => {
  let component: CandidateJobProfileComponent;
  let fixture: ComponentFixture<CandidateJobProfileComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobProfileComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
