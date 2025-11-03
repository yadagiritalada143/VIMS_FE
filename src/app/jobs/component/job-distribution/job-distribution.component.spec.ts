import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobDistributionComponent } from './job-distribution.component';

describe('JobDistributionComponent', () => {
  let component: JobDistributionComponent;
  let fixture: ComponentFixture<JobDistributionComponent>;
  CommonTestingModule.setUpTestBed(JobDistributionComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDistributionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
