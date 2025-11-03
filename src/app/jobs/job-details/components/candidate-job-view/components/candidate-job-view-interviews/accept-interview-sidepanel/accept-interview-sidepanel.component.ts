import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';

@Component({
  selector: 'app-accept-interview-sidepanel',
  templateUrl: './accept-interview-sidepanel.component.html',
  styleUrls: ['./accept-interview-sidepanel.component.scss']
})
export class AcceptInterviewSidepanelComponent implements OnChanges {
  acceptinterview = "visible";

  @Input() interviewObject;
  @Input() candidateDetails;
  @Output() isacceptInterview = new EventEmitter();
  @Output() onInterviewAccpeted = new EventEmitter();
  @Output() cancel = new EventEmitter();
  form;
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{9,10}$";
  Form: UntypedFormGroup;
  allCountryList: any = [] ;
  submissionManager: any;
  constructor(private fb: UntypedFormBuilder,
    private jobDetailService: JobDetailsService,
    private phoneUtilService: PhoneUtilityService
    ) { }

  ngOnChanges() {
    this.submissionManager = '/submission-manager';
    if (this.interviewObject && this.candidateDetails && !this.form) {
      // tslint:disable-next-line:max-line-length
      this.form = this.fb.group({
        notes: [null, []],
        phone_isdcode: ['US',  [Validators.required]],
        phone: [null, [Validators.required, Validators.pattern(this.mobNumberPattern)]],
        candidate_email:[null, []],
        vendor_notes:[null]
      })
      if(this.interviewObject?.interview_type === 'VIRTUAL'){
        this.form?.get('candidate_email')?.setValidators([Validators.required, Validators.email]);
        this.form?.get('candidate_email')?.updateValueAndValidity();
      }
      this.form.patchValue({
        // 'phone_isdcode': this.interviewObject?.phone_number?.number,
        'phone': this.interviewObject?.phone_number?.number,
        'candidate_email': this.interviewObject?.candidate_email,
        'phone_isdcode': this.interviewObject?.phone_number?.iso_code,
        'notes': this.interviewObject?.instructions,
        'vendor_notes': this.interviewObject?.vendor_notes
      })
      this.getAllCountry();
      this.phoneLengthValidation();
    }
  }
 

  getAllCountry(){
      this.jobDetailService.getAllCountries()
      .subscribe({
        next: (resp: any) => {
          this.allCountryList = resp.countries;
          this.phoneLengthValidation();
        },
      });
  }

  onScheduleSelected(i) {
    this.interviewObject.schedules.forEach((s, idx) => {
      if (i !== idx) s.is_prefered = false;
    });
  }

  get ScheduleOpted() {
    return this.interviewObject && this.interviewObject.schedules && this.interviewObject.schedules.find(s => s.is_prefered)
  }

  acceptInterview() {
    let data = this.form?.value;
    this.openFlyout();
    const schedule = this.interviewObject.schedules.find(s => s.is_prefered);
    let request:any = {schedule};
    if(this.interviewObject?.status==='PENDING_ACCEPTANCE'){
      request={
        ...request,
      'phone': data.phone, 'notes': data.notes,
      'phone_isdcode': ('+' + this.allCountryList?.filter(t => t.iso_code_2 == data.phone_isdcode)[0]?.isd_code),
      'iso_code': data?.phone_isdcode,
      'candidate_email': data?.candidate_email,
      'vendor_notes': data?.vendor_notes
      }
    }
    this.onInterviewAccpeted.emit(request);
  }

  openFlyout(){
    this.isacceptInterview.emit(true);
  }
  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.form?.value?.phone_isdcode,this.allCountryList);
    this.form?.get('phone').clearValidators();
    this.form?.get('phone').setValidators([Validators.required, Validators.pattern(mobNumberPattern)])
    this.form?.get('phone').updateValueAndValidity();
  }

  keyPressNumbers(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

}
