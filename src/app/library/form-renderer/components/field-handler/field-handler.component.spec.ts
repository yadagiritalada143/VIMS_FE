import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FieldHandlerComponent } from './field-handler.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

describe('FieldHandlerComponent', () => {
  let component: FieldHandlerComponent;
  let fixture: ComponentFixture<FieldHandlerComponent>;
  CommonTestingModule.setUpTestBed(FieldHandlerComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldHandlerComponent);
    component = fixture.componentInstance;
    component.renderForm=new UntypedFormGroup({
      effective_date:new UntypedFormControl(),
      request_reason:new UntypedFormControl(),
      reason_code_action:new UntypedFormControl(),
      request_notes:new UntypedFormControl(),
      documents:new UntypedFormControl(),
      is_account_required:new UntypedFormControl()
    })
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
