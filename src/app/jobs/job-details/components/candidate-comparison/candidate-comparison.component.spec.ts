import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateComparisonComponent } from './candidate-comparison.component';

describe('CandidateComparisonComponent', () => {
  let component: CandidateComparisonComponent;
  let fixture: ComponentFixture<CandidateComparisonComponent>;
  CommonTestingModule.setUpTestBed(CandidateComparisonComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateComparisonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
