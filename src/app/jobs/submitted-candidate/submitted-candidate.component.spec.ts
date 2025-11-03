import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SubmittedCandidateComponent } from './submitted-candidate.component';

describe('SubmittedCandidateComponent', () => {
  let component: SubmittedCandidateComponent;
  let fixture: ComponentFixture<SubmittedCandidateComponent>;
  CommonTestingModule.setUpTestBed(SubmittedCandidateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmittedCandidateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmittedCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
