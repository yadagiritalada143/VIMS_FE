import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';
import { JobService } from '../../job.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-basic-job-info',
  templateUrl: './basic-job-info.component.html',
  styleUrls: ['./basic-job-info.component.scss']
})
export class BasicJobInfoComponent implements OnInit {

  @Input() selectedTemplate;
  @Input() hierarchyData;
  @Input() jobData;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  @Output() onRateChange = new EventEmitter();
  programId: any;
  show: boolean = true;
  basicFormData: any = {};
  date2: any;
  public currentProgram;
  public basicJobForm: UntypedFormGroup;
  constructor(
    public userService: UserService,
    private alertService: AlertService,
    public router: Router,
    private fb: UntypedFormBuilder,
    public jobService: JobService,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService) { }


  ngOnInit(): void {
    this.basicJobForm = this.fb.group({
      start_date: ['',],
      end_date: ['',],
      location: [null],
      location_id: [null],
      currency: [null],
      min_bill_rate: ['', [Validators.required]],
      max_bill_rate: ['', [Validators.required]],
      rate_dtls: [''],
      vendor_rate_exceed: [false, []],
    });
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentProgram?.id;
    // this.programId = '19106c90-e1f5-4016-b7bf-3cdf24a2b183';

    this.getRateCard(true);
    this.getCurrencies();
    this.patchData();
    this.getWorkLocations();
  }

  getRateCard(updateLocationsArray) {
    // https://dev-services.simplifysandbox.net/job-manager/talentneuron?ratecard_id=38
    let url = '/job-manager/' + this.programId + '/rate_cards'
    let qry = '?';
    if (this.selectedTemplate?.title?.id) {
      qry = qry + 'job_title__id=' + this.selectedTemplate?.title?.id
    }
    if (this.selectedTemplate?.category?.id) {
      qry = qry + '&job_category__id=' + this.selectedTemplate?.category?.id
    }
    url = url + qry;
    // let url = `/job-manager/${this.programId}/rate_cards${this.selectedTemplate?.title?.id ? ('?job_title__id='+this.selectedTemplate?.title?.id) : ''}${this.selectedTemplate?.category?.id ? ('&job_category__id=' + this.selectedTemplate?.category?.id) : ''}`;
    if (this.basicJobForm.get('location').value) {
      url = `${url}&work_location=${this.basicJobForm.get('location').value}`;
    }
    if (this.basicJobForm.get('currency').value) {
      url = `${url}&currency=${this.basicJobForm.get('currency').value}`;
    }
    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data) {
        const rateCardData = JSON.parse(JSON.stringify(data.results));
        if (rateCardData && rateCardData.length > 0) {
          this.onRateChange.emit(rateCardData[0]);
          this.basicJobForm.patchValue({
            rate_dtls: rateCardData[0]
          });
          if (rateCardData[0]?.min_rate) {
            this.basicJobForm.patchValue({
              min_bill_rate: rateCardData[0]?.min_rate
            });
          }
          if (rateCardData[0]?.max_rate) {
            this.basicJobForm.patchValue({
              max_bill_rate: rateCardData[0]?.max_rate,
            });
          }
          if (rateCardData[0]?.max_rate) {
            this.basicJobForm.patchValue({
              location_id: rateCardData[0]?.uid,
            });
          }
        }
        this.patchData();
      }
    }, 
    error: error => {
      this.alertService.error(errorHandler(error), {});
    }});
  }

  getCurrencies() {
    const url = '/configurator/resources/currencies';
    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data) {
        this.basicFormData.currencies = new Array();
        this.basicFormData.currencies = JSON.parse(JSON.stringify(data.currencies));
      }
    }, 
    error: error => {
      this.alertService.error(errorHandler(error), {});
    }});
  }

  getWorkLocations() {
    const url = `/configurator/programs/${this.programId}/work-locations`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data && data.work_locations && data.work_locations.length > 0) {
        if (data.work_locations && data.work_locations?.length > 0) {
          this.basicFormData.locations = data.work_locations;
        }
      }
    }, 
    error: error => {
      this.alertService.error(errorHandler(error), {});
    }});
  }

  changeTemplate() {
    this.onClose.emit({ type: 'changeTemplate', value: true });
  }

  changeHierarchy() {
    this.onClose.emit({ type: 'changeHierarchy', value: true });
  }

  showjobDtls() {
    this.show = !this.show;
  }
  changeDate() {
    const jobDetails = this.basicJobForm.value;
    if (jobDetails.start_date && jobDetails.end_date && Date.parse(jobDetails.end_date) < Date.parse(jobDetails.start_date)) {
      this.basicJobForm.patchValue({
        start_date: this.getFormattedDate(new Date())
      });
      // this.alertService.error(`Please select end date greater than start date`);  

    }
  }
  patchData() {

    if (this.jobData && this.jobData.hasOwnProperty('basicInfo')) {
      this.basicJobForm.patchValue(this.jobData.basicInfo);
    }
  }

  addBasicInfo() {
    if (this.basicJobForm.invalid) {
      this.alertService.error(`Please fill the required fields.`);
      return;
    }
    const jobDetails = this.basicJobForm.value;
    let currentDate: any = this.getFormattedDate(new Date());
    if (jobDetails.start_date && Date.parse(jobDetails.start_date) < Date.parse(currentDate)) {
      this.alertService.error(`Please select start date  greater than or  current date`);
      return;
    }
    if (jobDetails.start_date && jobDetails.end_date && Date.parse(jobDetails.start_date) < Date.parse(jobDetails.end_date)) {
    } else {
      this.alertService.error(`Please select end date greater than start date`);
      return;
    }
    if (jobDetails.min_bill_rate && jobDetails.max_bill_rate && (jobDetails.min_bill_rate) < (jobDetails.max_bill_rate)) {
    } else {
      this.alertService.error(`Please select max bill rate greater than min bill rate`);
      return;
    }
    this.onSubmit.emit({ type: 'basicInfo', data: jobDetails });
    this.onClose.emit({ type: 'saveBasic', value: 2 });
    // localStorage.setItem('basicJobInfo', JSON.stringify(jobDetails));
  }


  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

}
