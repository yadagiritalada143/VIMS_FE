import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewRightPanelComponent } from './candidate-job-view-right-panel.component';

describe('CandidateJobViewRightPanelComponent', () => {
  let component: CandidateJobViewRightPanelComponent;
  let fixture: ComponentFixture<CandidateJobViewRightPanelComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewRightPanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewRightPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewRightPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
