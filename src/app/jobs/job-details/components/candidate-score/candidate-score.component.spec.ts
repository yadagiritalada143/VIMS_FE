import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateScoreComponent } from './candidate-score.component';

describe('CandidateScoreComponent', () => {
  let component: CandidateScoreComponent;
  let fixture: ComponentFixture<CandidateScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateScoreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
