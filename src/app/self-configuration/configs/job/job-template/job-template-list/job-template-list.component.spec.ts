import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobTemplateListComponent } from './job-template-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('JobTemplateListComponent', () => {
  let component: JobTemplateListComponent;
  let fixture: ComponentFixture<JobTemplateListComponent>;
  CommonTestingModule.setUpTestBed(JobTemplateListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(JobTemplateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
