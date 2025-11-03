import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JobEstimateComponent } from './job-estimate.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('JobEstimateComponent', () => {
  let component: JobEstimateComponent;
  let fixture: ComponentFixture<JobEstimateComponent>;
  CommonTestingModule.setUpTestBed(JobEstimateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobEstimateComponent, AccuracyPipe ],
      providers: [DecimalPipe],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
