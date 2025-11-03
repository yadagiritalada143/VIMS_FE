import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-submission-program-config',
  templateUrl: './submission-program-config.component.html',
  styleUrls: ['./submission-program-config.component.scss']
})
export class SubmissionProgramConfigComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  public allow_client_bill_rate: boolean = false;

  constructor(private fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.createForm();
  }

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  createForm() {
    this.formGroup = this.fb.group({
      'is_higher_submission_rate_allowed': new UntypedFormControl(false, Validators.required),
      'can_client_view_non_shortlisted_candidates': new UntypedFormControl(false, Validators.required)
    });
  }

  patchValue(data: any) {
    if(data) {
      let is_higher_submission_rate_allowed: boolean = data?.is_higher_submission_rate_allowed ?? false;
      let can_client_view_non_shortlisted_candidates: boolean = data?.submission?.can_client_view_non_shortlisted_candidates ?? false;
      this.formGroup.patchValue({
        can_client_view_non_shortlisted_candidates,
        is_higher_submission_rate_allowed
      });

      if(('is_allow_vendor_to_enter_client_bill_rate' in data) || false) {
        this.formGroup.addControl(
          'is_allow_vendor_to_enter_client_bill_rate', new UntypedFormControl(true, Validators.required)
        );

        let is_allow_vendor_to_enter_client_bill_rate: boolean = data?.is_allow_vendor_to_enter_client_bill_rate || false;
        this.formGroup.patchValue({ is_allow_vendor_to_enter_client_bill_rate });
        this.allow_client_bill_rate = true;
      }
    }
  }

  get ControlType() {
    return ControlType;
  }
}
