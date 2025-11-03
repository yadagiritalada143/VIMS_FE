import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-notification-program-config',
  templateUrl: './notification-program-config.component.html',
  styleUrls: ['./notification-program-config.component.scss']
})
export class NotificationProgramConfigComponent extends BaseProgramConfigComponent implements OnInit {
  
  public mounted: boolean = false;
  public VisibleWhistlistArea : boolean = false; 
  constructor(public fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {

    // Initialize form
    this.formGroup = this.fb.group({
      'whitelist': new UntypedFormControl(false, [Validators.required]),
      'exclude_msp': new UntypedFormControl(false),
      'approval_link': new UntypedFormControl(false, [Validators.required])
    });

    // Conditional validation
    this.formGroup.get("whitelist").valueChanges.subscribe((visible: boolean) => {
      this.VisibleWhistlistArea = visible;
      if (this.VisibleWhistlistArea) {
        this.formGroup.get('exclude_msp').addValidators(Validators.required);
      } else {
        this.formGroup.get('exclude_msp').clearValidators();
      }

      this.formGroup.get('exclude_msp').updateValueAndValidity();
    });
  }

  get ControlType() {
    return ControlType;
  }

  patchValue(data: any) {
    if(data) {

      let whitelist: boolean = data?.whitelist ?? false;
      let approval_link: boolean = data?.approval_link ?? false;
      let exclude_msp: Array <string> = data?.exclude_msp ?? "";

      this.formGroup.patchValue({
        whitelist,
        exclude_msp: (Array.isArray(exclude_msp))?exclude_msp?.join(';'):"",
        approval_link
      });

      this.VisibleWhistlistArea = whitelist;
      this.formGroup.get('exclude_msp').updateValueAndValidity();
    }
  }
}
