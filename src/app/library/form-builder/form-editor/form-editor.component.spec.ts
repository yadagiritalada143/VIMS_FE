import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormEditorComponent } from './form-editor.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FormEditorComponent', () => {
  let component: FormEditorComponent;
  let fixture: ComponentFixture<FormEditorComponent>;
  CommonTestingModule.setUpTestBed(FormEditorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FormEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
