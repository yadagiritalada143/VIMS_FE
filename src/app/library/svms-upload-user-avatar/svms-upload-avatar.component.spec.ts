import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsUploadAvatarComponent } from 'src/app/shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsUploadAvatarComponent', () => {
  let component: SvmsUploadAvatarComponent;
  let fixture: ComponentFixture<SvmsUploadAvatarComponent>;
  CommonTestingModule.setUpTestBed(SvmsUploadAvatarComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsUploadAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
