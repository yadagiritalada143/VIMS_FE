import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateScreeningComponent } from './candidate-screening.component';

describe('CandidateScreeningComponent', () => {
  let component: CandidateScreeningComponent;
  let fixture: ComponentFixture<CandidateScreeningComponent>;
  CommonTestingModule.setUpTestBed(CandidateScreeningComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateScreeningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
