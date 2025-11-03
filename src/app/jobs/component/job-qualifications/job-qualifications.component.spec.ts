import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobQualificationsComponent } from './job-qualifications.component';
import { QuillEditorComponent } from 'ngx-quill';
describe('JobQualificationsComponent', () => {
  let component: JobQualificationsComponent;
  let fixture: ComponentFixture<JobQualificationsComponent>;
  CommonTestingModule.setUpTestBed(JobQualificationsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobQualificationsComponent, QuillEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobQualificationsComponent);
    component = fixture.componentInstance;
    component.selectedTemplate = {
      description: 'Mock description for testing purposes',
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
