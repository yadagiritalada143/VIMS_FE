import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobAssignmentsComponent } from './job-assignments.component';

describe('JobAssignmentsComponent', () => {
  let component: JobAssignmentsComponent;
  let fixture: ComponentFixture<JobAssignmentsComponent>;
  CommonTestingModule.setUpTestBed(JobAssignmentsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobAssignmentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
