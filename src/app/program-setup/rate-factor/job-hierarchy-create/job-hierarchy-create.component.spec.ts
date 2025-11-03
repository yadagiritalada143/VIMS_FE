import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobHierarchyCreateComponent } from './job-hierarchy-create.component';

describe('JobHierarchyCreateComponent', () => {
  let component: JobHierarchyCreateComponent;
  let fixture: ComponentFixture<JobHierarchyCreateComponent>;
  CommonTestingModule.setUpTestBed(JobHierarchyCreateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobHierarchyCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobHierarchyCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
