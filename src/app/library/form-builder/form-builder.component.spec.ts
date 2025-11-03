import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilderComponent } from './form-builder.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FormBuilderComponent', () => {
  let component: FormBuilderComponent;
  let fixture: ComponentFixture<FormBuilderComponent>;
  CommonTestingModule.setUpTestBed(FormBuilderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
