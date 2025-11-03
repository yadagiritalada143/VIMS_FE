import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobManagmentComponent } from './job-managment.component';

describe('JobManagmentComponent', () => {
  let component: JobManagmentComponent;
  let fixture: ComponentFixture<JobManagmentComponent>;
  CommonTestingModule.setUpTestBed(JobManagmentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobManagmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobManagmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
