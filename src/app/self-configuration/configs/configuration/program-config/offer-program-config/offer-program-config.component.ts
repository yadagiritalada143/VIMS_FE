import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-offer-program-config',
  templateUrl: './offer-program-config.component.html',
  styleUrls: ['./offer-program-config.component.scss']
})
export class OfferProgramConfigComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  constructor(public fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.createForm();
  }

  setProgramConfig = () => {
    if (!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  createForm() {
    this.formGroup = this.fb.group({
      'is_onboading_disabled': new UntypedFormControl(false, [Validators.required]),
      'is_approval_for_offers': new UntypedFormControl(false, [Validators.required]),
      'is_offer_acceptance_disabled': new UntypedFormControl(false, [Validators.required])
    });
  }

  get ControlType() {
    return ControlType;
  }

  patchValue(data: any) {
    if (data) {

      let is_onboading_disabled: boolean = data?.is_onboading_disabled ?? false;
      let is_approval_for_offers: boolean = data?.is_approval_for_offers ?? false;
      let is_offer_acceptance_disabled: boolean = data?.is_offer_acceptance_disabled ?? false;

      this.formGroup.patchValue({
        is_onboading_disabled,
        is_approval_for_offers,
        is_offer_acceptance_disabled
      });
    }
  }
}
