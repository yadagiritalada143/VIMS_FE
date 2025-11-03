import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { InputFieldsComponent } from './input-fields.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('InputFieldsComponent', () => {
  let component: InputFieldsComponent;
  let fixture: ComponentFixture<InputFieldsComponent>;
  CommonTestingModule.setUpTestBed(InputFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(InputFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
