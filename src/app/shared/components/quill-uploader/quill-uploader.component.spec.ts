import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { QuillUploaderComponent } from './quill-uploader.component';
import { QuillEditorComponent } from 'ngx-quill';
describe('QuillUploaderComponent', () => {
  let component: QuillUploaderComponent;
  let fixture: ComponentFixture<QuillUploaderComponent>;
  CommonTestingModule.setUpTestBed(QuillUploaderComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuillUploaderComponent, QuillEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuillUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
