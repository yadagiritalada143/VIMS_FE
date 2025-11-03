import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobsSummaryComponent } from './jobs-summary.component';

describe('JobsSummaryComponent', () => {
  let component: JobsSummaryComponent;
  let fixture: ComponentFixture<JobsSummaryComponent>;
  CommonTestingModule.setUpTestBed(JobsSummaryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsSummaryComponent);
    component = fixture.componentInstance;
    component.jobData = {
      jobInfo : {

      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
