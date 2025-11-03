import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewContentComponent } from './candidate-job-view-content.component';

describe('CandidateJobViewContentComponent', () => {
  let component: CandidateJobViewContentComponent;
  let fixture: ComponentFixture<CandidateJobViewContentComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewContentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
