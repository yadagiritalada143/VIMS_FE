import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AttachmentUploadComponent } from './attachment-upload.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AttachmentUploadComponent', () => {
  let component: AttachmentUploadComponent;
  let fixture: ComponentFixture<AttachmentUploadComponent>;
  CommonTestingModule.setUpTestBed(AttachmentUploadComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachmentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
