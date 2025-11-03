import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateHistoryViewComponent } from './candidate-history-view.component';

describe('CandidateHistoryViewComponent', () => {
  let component: CandidateHistoryViewComponent;
  let fixture: ComponentFixture<CandidateHistoryViewComponent>;
  CommonTestingModule.setUpTestBed(CandidateHistoryViewComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateHistoryViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateHistoryViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
