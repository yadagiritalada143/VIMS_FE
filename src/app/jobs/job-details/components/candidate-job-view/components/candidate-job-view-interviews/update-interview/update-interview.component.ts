import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';

@Component({
  selector: 'app-update-interview',
  templateUrl: './update-interview.component.html',
  styleUrls: ['./update-interview.component.scss'],
})
export class UpdateInterviewComponent implements OnInit {
  @Input() set interviewObject(value: any) {
    this.form.patchValue({
      phone: value?.phone_number?.number,
      candidate_email: value?.candidate_email,
      phone_isdcode: value?.phone_number?.iso_code,
    });
    this.interview_type = value?.interview_type;
  }
  @Output() onUpdate = new EventEmitter();
  @Output() onClose = new EventEmitter();
  countryLoading: boolean;
  interview_type: any;
  mobNumberPattern = '^((\\+91-?)|0)?[0-9]{9,10}$';
  allCountryList: any = [];

  form: UntypedFormGroup;
  constructor(private fb: UntypedFormBuilder, private jobDetailService: JobDetailsService, private phoneUtilService: PhoneUtilityService) {
    this.form = this.fb.group({
      phone_isdcode: ['US', [Validators.required]],
      phone: [null, [Validators.required, Validators.pattern(this.mobNumberPattern)]],
      candidate_email: [null, [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.getAllCountry();
  }
  closeSidebar() {
    this.onClose.emit(true);
  }

  updateInterview() {
    let data = this.form?.value;
    let request = {
      phone: data.phone,
      phone_isdcode: '+' + this.allCountryList?.filter(t => t.iso_code_2 == data.phone_isdcode)[0]?.isd_code,
      iso_code: data?.phone_isdcode,
      candidate_email: data?.candidate_email,
    };

    this.onUpdate.emit(request);
  }

  getAllCountry() {
    this.countryLoading = true;
    this.jobDetailService.getAllCountries().subscribe({
      next: (resp: any) => {
        this.allCountryList = resp.countries;
        this.countryLoading = false;
        this.phoneLengthValidation();
      },
    });
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.form?.value?.phone_isdcode, this.allCountryList);
    this.form?.get('phone').clearValidators();
    this.form?.get('phone').setValidators([Validators.required, Validators.pattern(mobNumberPattern)]);
    this.form?.get('phone').updateValueAndValidity();
  }

  keyPressNumbers(event) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }
}
