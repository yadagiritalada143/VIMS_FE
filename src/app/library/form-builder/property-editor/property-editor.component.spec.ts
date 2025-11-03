import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PropertyEditorComponent } from './property-editor.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PropertyEditorComponent', () => {
  let component: PropertyEditorComponent;
  let fixture: ComponentFixture<PropertyEditorComponent>;
  CommonTestingModule.setUpTestBed(PropertyEditorComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
