import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobBudgetEstimateViewComponent } from './job-budget-estimate-view.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('JobBudgetEstimateViewComponent', () => {
  let component: JobBudgetEstimateViewComponent;
  let fixture: ComponentFixture<JobBudgetEstimateViewComponent>;
  CommonTestingModule.setUpTestBed(JobBudgetEstimateViewComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobBudgetEstimateViewComponent, AccuracyPipe ],
      providers: [
        { provide: AccuracyPipe, useValue: DecimalPipe },
        DecimalPipe,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobBudgetEstimateViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
