import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobWorkflowComponent } from './job-workflow.component';

describe('JobWorkflowComponent', () => {
  let component: JobWorkflowComponent;
  let fixture: ComponentFixture<JobWorkflowComponent>;
  CommonTestingModule.setUpTestBed(JobWorkflowComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobWorkflowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
