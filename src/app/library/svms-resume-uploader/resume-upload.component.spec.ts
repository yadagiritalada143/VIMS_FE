import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ResumeUploadComponent } from 'src/app/shared/components/svms-tab-components/resume-upload/resume-upload.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ResumeUploadComponent', () => {
  let component: ResumeUploadComponent;
  let fixture: ComponentFixture<ResumeUploadComponent>;
  CommonTestingModule.setUpTestBed(ResumeUploadComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ResumeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
