import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsUploadProfileAvatarComponent } from './svms-upload-profile-avatar.component';

describe('SvmsUploadProfileAvatarComponent', () => {
  let component: SvmsUploadProfileAvatarComponent;
  let fixture: ComponentFixture<SvmsUploadProfileAvatarComponent>;
  CommonTestingModule.setUpTestBed(SvmsUploadProfileAvatarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsUploadProfileAvatarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsUploadProfileAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
