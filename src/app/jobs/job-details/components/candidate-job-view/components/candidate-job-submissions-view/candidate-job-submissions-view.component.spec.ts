import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobSubmissionsViewComponent } from './candidate-job-submissions-view.component';

describe('CandidateJobSubmissionsViewComponent', () => {
  let component: CandidateJobSubmissionsViewComponent;
  let fixture: ComponentFixture<CandidateJobSubmissionsViewComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobSubmissionsViewComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobSubmissionsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobSubmissionsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
