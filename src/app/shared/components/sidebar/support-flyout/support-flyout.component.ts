import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'svms-support',
  templateUrl: './support-flyout.component.html',
  styleUrls: ['./support-flyout.component.scss']
})
export class SupportFlyoutComponent implements OnInit {

  public userName: string = '';
  public userEmail: string = '';
  public userRole: string = '';
  public customerFeedbackForm: UntypedFormGroup = null;
  @Input() supportEmail: any;
  @Input() visibility: string = 'hidden';
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();

  constructor (
    private localStorage: StorageService,
    private programService: ProgramService,
    private loader: LoaderService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {
    const accountDetails: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    this.userEmail = accountDetails?.["email"] ?? '';
    this.userName = accountDetails?.["full_name"] ?? '';
    this.customerFeedbackForm = new UntypedFormGroup({
      subject: new UntypedFormControl('', [Validators.required]),
      url: new UntypedFormControl('', [this.urlValidator]),
      message: new UntypedFormControl('', [Validators.required,this.messageValidator])
    });
  }

  emitCloseEvent() {
    this.customerFeedbackForm.get('subject').setValue('');
    this.customerFeedbackForm.get('url').setValue('');
    this.customerFeedbackForm.get('message').setValue('');
    this.onClose.emit();
  }

  sendSupportEmail() {

    if (this.customerFeedbackForm.invalid) {
      this.alert.error('Please fill all the required fields');
      this.customerFeedbackForm.markAsTouched();
      return;
    }

    const programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    const url = `/customer-service/api/customer-service/api/send-customer-support-email`;
    const form = this.customerFeedbackForm;
    const currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    const accountDetails = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    this.userRole = accountDetails?.["role"]?.["name"] ?? '';
    let payload = {
      program_id: programId,
      category: "Generic",
      event: "Custom Email Trigger",
      data: {
        from: {
          name: this.userName,
          email: this.userEmail,
          role: this.userRole
        },
        to: {
          email: this.supportEmail
        },
        template_subject: `${form.get('subject').value || ''} - ${currentProgram?.name || ''}`,
        url : form.get('url').value,
        template_body: form.get('message').value
      }
    }

    this.loader.show();
    this.programService.post(url, payload)
      .subscribe({next:(res:any) => {
        if (res) {
          this.loader.hide();
          this.alert.success('Support email sent successfully');
          this.emitCloseEvent();
        }
      },error: err => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }});

  }

  getSupportEmail() {
    const programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/config?entity_code=support`;
    this.programService.get(`${url}`)
      .subscribe({next:(res:any) => {
        let response = JSON.parse(JSON.stringify(res));
        this.supportEmail = response?.config?.email || 'info@talentiqvms.com';
      },error: err => {
        this.supportEmail = 'info@talentiqvms.com';
        console.error(errorHandler(err));
      }});

  }

  urlValidator(control: AbstractControl){
    if(control?.value){
      const urlArray:string[]= control?.value?.replace(/\n/g,' ').split(' ');
      let isValid= true;
      for(const url of urlArray){
        if(url!=='' && !(url.includes('https://') && (url.includes('talentiqvms.com') || url.includes('talentiqsandbox.net') || url.includes('.talentiqvmsapp.com')))){
          isValid=false;
          break;
        }
      }
      return isValid ? null : {'urlError': true};
    }
    return null;
  }
  messageValidator(control:AbstractControl){
    const isValidUrl=(s: string)=>{
      try {
        new URL(s);
        return true;
      } catch (err) {
        return false;
      }
    }
    if(control?.value){
      const messageArray:string[]= control?.value?.replace(/\n/g,' ').split(' ');
      let isValid= true;
      for(let s of messageArray){
        if(s!=='' && isValidUrl(s) && !(s.includes('https://') && (s.includes('talentiqvms.com') || s.includes('talentiqsandbox.net') || s.includes('.talentiqvmsapp.com')))){
          isValid=false;
          break;
        }
      }
      return isValid ? null : {'messageError': true};
    }
    return null;
  }
}
