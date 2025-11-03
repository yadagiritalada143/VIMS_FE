import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateResumeViewComponent } from './candidate-resume-view.component';

describe('CandidateResumeViewComponent', () => {
  let component: CandidateResumeViewComponent;
  let fixture: ComponentFixture<CandidateResumeViewComponent>;
  CommonTestingModule.setUpTestBed(CandidateResumeViewComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateResumeViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateResumeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
