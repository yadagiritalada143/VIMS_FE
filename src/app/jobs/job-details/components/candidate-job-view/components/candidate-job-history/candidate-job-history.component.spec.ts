import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobHistoryComponent } from './candidate-job-history.component';

describe('CandidateJobHistoryComponent', () => {
  let component: CandidateJobHistoryComponent;
  let fixture: ComponentFixture<CandidateJobHistoryComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobHistoryComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateJobHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
