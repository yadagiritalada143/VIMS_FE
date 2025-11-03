import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateJobViewOffersComponent } from './candidate-job-view-offers.component';

describe('CandidateJobViewOffersComponent', () => {
  let component: CandidateJobViewOffersComponent;
  let fixture: ComponentFixture<CandidateJobViewOffersComponent>;
  CommonTestingModule.setUpTestBed(CandidateJobViewOffersComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateJobViewOffersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobViewOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
