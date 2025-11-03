import { Component, OnInit } from '@angular/core';
import { Validators, UntypedFormBuilder, UntypedFormGroup, AbstractControl } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { DashboardService } from '../../dashboard.service';
import { Location } from '@angular/common';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-contact-support',
  templateUrl: './contact-support.component.html',
  styleUrls: ['./contact-support.component.scss']
})
export class ContactSupportComponent implements OnInit {
  public contactForm: UntypedFormGroup;
  submited: any;
  user: any;
  public userRole: string = '';
  programId: any;
  public modules: any;
  logs: Log= undefined;
  constructor(private fb: UntypedFormBuilder,
    private dashboardService: DashboardService,
    public alert: AlertService,
    public _storageService: StorageService,
    private _confirmService: ConfirmationDialogService,
    private location: Location,
    private _eventStreamService:EventStreamService
  ) {
    this.modules = {
      'toolbar': [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote'],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ]
    }
  }

  ngOnInit(): void {
    this.user = this._storageService.get('user');
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails['id'];
    }
    this.getSupportEmail();
    // this.emailValidator
    this.contactForm = this.fb.group({
      details: [null, [Validators.required]],
      email: [null, [Validators.required]],
      subject: ['', [Validators.required]],
      url: ['', [Validators.required,this.urlValidator]],
      message: ['', [Validators.required,this.messageValidator]],
    });
    this.setData(undefined);
    this._eventStreamService.on(Events.REPORT_ERROR).subscribe((data:any) => {
      if(data){
        this.setData(data);
      }
    });
  }

  setData(data?:any) {
    if(data){
      let message= data?.messages?.toString() || data?.heading;
      if( data?.additionalInfo?.trace_id ){
        message+= `Trace Id: ${data?.additionalInfo?.trace_id}`;
      }
      this.contactForm.patchValue({
          subject: data?.heading,
          message: message,
          details: this.user?.first_name + ' (' + this.user?.email + ')',
      });
    }else{
      this.contactForm.patchValue({
        details: this.user?.first_name + ' (' + this.user?.email + ')',
        // email: 'info@talentiqvms.com',
      })
    }
  }
  emailValidator(control) {
    if (control.value) {
      const matches = control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
      return matches ? null : { 'invalidEmail': true };
    } else {
      return null;
    }
  }

  getSupportEmail() {
    let _url = `/configurator/programs/${this.programId}/config?entity_code=support`;
    this.dashboardService.get(`${_url}`).subscribe({next:(res:any) => {
      let response = JSON.parse(JSON.stringify(res));
      this.contactForm.patchValue({
        email: response?.config?.email || "info@talentiqvms.com",
      })
    },error: err => {
      this.contactForm.patchValue({
        email: "info@talentiqvms.com",
      })
    }});
  }
  contact() {
    this.submited = true;
    if (this.contactForm.invalid) {
      // this.alert.error('Please fill the required details');
      this.showError('Please fill the required details');
      return;
    }
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    const accountDetails = this._storageService.get(StorageKeys.CURRENT_ACCOUNT);
    this.userRole = accountDetails?.["role"]?.["name"] ?? '';
    let Payload = {
      program_id:  this.programId,
      category: "Generic",
      event: "Custom Email Trigger",
      data: {
        from: {
          name: this.user?.full_name,
          email: this.user?.email,
          role: this.userRole
        },
        to: {
          email: this.contactForm?.value?.email
        },
        template_subject: `${this.contactForm?.value?.subject || ''} - ${currentProgram?.name || ''}`,
        url : this.contactForm.value.url,
        template_body: this.contactForm.value.message.replace(/<(?:.|\n)*?>/gm, ' ').trim()
      }
    }

    this.dashboardService.post(`/customer-service/api/customer-service/api/send-customer-support-email`, Payload).subscribe({next:
      (data:any) => {
        if (data) {
          // this.alert.success('Email sent successfully');
          this.goBack();
        }
      },error:
      (err) => {
        // this.alert.error(errorHandler(err));
      }});
  }

  goBack() {
    this._confirmService.confirm('', `Your query has been sent to our support team. We will get back to you as soon as possible. Thank you.`,
      'Go To Dashboard', 'Okay')
      .then((confirmed) => {
        if (confirmed) {
          this.location.back();
        } else {
          this.contactForm.controls['subject'].reset();
          this.contactForm.controls['message'].reset();
          this.contactForm.controls['url'].reset();
          this.submited = false;
        }
      })
      .catch(() => {

      });
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  urlValidator(control: AbstractControl){
    if(control?.value){
      const urlArray:string[]= control?.value?.replace(/\n/g,' ').split(' ');
      let isValid= true;
      for(const url of urlArray){
        if(url!=='' && !(url.includes('https://') && (url.includes('.talentiqvms.com') || url.includes('.talentiqsandbox.net') || url.includes('.talentiqvmsapp.com')))){
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
      const messageArray:string[]= control?.value?.replace(/<p>|<\/p>|<br>/g,' ').split(' ');
      let isValid= true;
      for(let s of messageArray){
        if(s!=='' && isValidUrl(s) && !(s.includes('https://') && (s.includes('.talentiqvms.com') || s.includes('.talentiqsandbox.net') || s.includes('.talentiqvmsapp.com')))){
          isValid=false;
          break;
        }
      }
      return isValid ? null : {'messageError': true};
    }
    return null;
  }
}
