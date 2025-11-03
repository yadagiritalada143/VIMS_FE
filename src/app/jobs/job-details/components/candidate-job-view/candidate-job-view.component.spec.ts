import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewComponent } from './candidate-job-view.component';

describe('CandidateJobViewComponent', () => {
  let component: CandidateJobViewComponent;
  let fixture: ComponentFixture<CandidateJobViewComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewComponent)
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
