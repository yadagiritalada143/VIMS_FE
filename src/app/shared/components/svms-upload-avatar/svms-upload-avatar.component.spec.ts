import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsUploadAvatarComponent } from './svms-upload-avatar.component';

describe('SvmsUploadAvatarComponent', () => {
  let component: SvmsUploadAvatarComponent;
  let fixture: ComponentFixture<SvmsUploadAvatarComponent>;
  CommonTestingModule.setUpTestBed(SvmsUploadAvatarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsUploadAvatarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsUploadAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
