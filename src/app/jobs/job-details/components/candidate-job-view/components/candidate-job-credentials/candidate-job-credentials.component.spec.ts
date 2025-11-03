import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateJobCredentialsComponent } from './candidate-job-credentials.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CandidateJobCredentialsComponent', () => {
  let component: CandidateJobCredentialsComponent;
  let fixture: ComponentFixture<CandidateJobCredentialsComponent>;

  CommonTestingModule.setUpTestBed(CandidateJobCredentialsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateJobCredentialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateJobCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
