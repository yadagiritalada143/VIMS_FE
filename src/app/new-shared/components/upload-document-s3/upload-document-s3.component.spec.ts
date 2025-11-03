import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { UploadDocumentS3Component } from './upload-document-s3.component';

describe('UploadDocumentS3Component', () => {
  let component: UploadDocumentS3Component;
  let fixture: ComponentFixture<UploadDocumentS3Component>;
  CommonTestingModule.setUpTestBed(UploadDocumentS3Component);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadDocumentS3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDocumentS3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
