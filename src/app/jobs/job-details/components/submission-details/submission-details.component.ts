import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../../job-details.service';

@Component({
  selector: 'app-submission-details',
  templateUrl: './submission-details.component.html',
  styleUrls: ['./submission-details.component.scss']
})
export class SubmissionDetailsComponent implements OnInit {
  showInstruction = false;
  viewSubmissionwDetails = "hidden";
  candidateId: any;
  currentProgram: any;
  jobId: any;
  hideEyeIcon:boolean = true;
  submissionDetails: any;
  public isLoading = true;
  public showDOB = false;
  public showStateID = false;
  public formattedTime: any;
  public userRole: any;
  public jobDetails: any;
  jobCurrency:any;
  isAlertError: boolean = false;
  candidateStatus: string;
  candidateStatusReason: any;
  candidateStatusNote: any;
  backEndData;
  apiData;
  programRateModel;
  user_type;
  minRate;
  maxRate;
  markupByRateTypeEnabled;
  @Input() public set data(data: any) {
    this.isLoading = true;
    if (data) {
      this.apiData = data?.api_data;
      this.backEndData = this.apiData?.backend_data;
      this.jobId = data?.job?.id || data?.jobID;
      this.candidateId = data?.candidateId || data?.candidateId;
      if(this.backEndData?.new_data){
        this.submissionDetails = this.backEndData?.new_data;
        this.markupByRateTypeEnabled = this.submissionDetails?.markup_by_rate_type;
        this.submissionDetails.submitted_on = data?.modified_on;
        this.reArrangeType();
        this.isLoading = false;
      }
      this.getCandidateDetails();
      if(!this.backEndData?.new_data){
        if(this.jobId && this.candidateId ) {
          this.getSubmissionDetails()
        }
    }
      if(this.jobId) {
        this.jobDetailService.loadJob(this.jobId).subscribe(res => {
          this.jobDetails = res["job"];
          this.jobCurrency = this.jobDetails?.currency;
          this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? this.jobDetails?.rate_model : this.currentProgram?.config?.program_model;
          this.isLoading = this.programRateModel ? false : true;
          if(this.programRateModel === 'PAY_RATE'){
            this.minRate = this.jobDetails['min_pay_rate'];
            this.maxRate = this.jobDetails['max_pay_rate'];
          }
          else{
            if(this.user_type.toLowerCase() === 'vendor') {
              if(this.clientBillRateEnabled){
                this.minRate =  this.jobDetails['min_bill_rate'];
                this.maxRate = this.jobDetails['max_bill_rate'];
              }else{
                this.minRate =  this.jobDetails['vendor_min_bill_rate'];
                this.maxRate = this.jobDetails['vendor_max_bill_rate'];
              }
            }
            else {
              this.minRate =  this.jobDetails['min_bill_rate'];
              this.maxRate = this.jobDetails['max_bill_rate'];
            }
          }
        });
      }
    }
  }

  constructor(private route: ActivatedRoute,
    private jobDetailService: JobDetailsService,
    private storageService: StorageService,
    private candidateService: CandidateService) { }

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.params['candidateId'];
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const account = JSON.parse(localStorage.getItem('account'))
    this.userRole = account?.role?.organization_category?.toLowerCase();
    this.user_type = this.storageService.get('user_type');
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
  }

  candidateData;
  getCandidateDetails() {
    this.candidateService.getCandidateDetail(this.candidateId).subscribe(
      (data: any) => {
        if (data) {
          this.candidateData = data.candidate;
          // this.candidateData.dob = this.candidateData?.dob.substr(truncateDateAndMonth, truncateYear);
        }
      }, (error) => {
      });
  }

  getSubmissionDetails(){
    let currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobDetailService.getSubmissionDetails(currentProgram?.id, this.jobId, this.candidateId).subscribe({
      next: (data: any) => {
      this.submissionDetails = data?.candidate;
      this.markupByRateTypeEnabled = this.submissionDetails?.markup_by_rate_type;
      this.reArrangeType()
      this.alertHandler(this.submissionDetails)
      //find the time from the timespan for submitted date in 12 hr format
      let date = new Date(this.submissionDetails.submitted_on * 1000);
      this.submissionDetails.candidate_worked_as = this.getWorkedRehire(this.submissionDetails?.candidate_worked_as);
      let hours = date.getHours();
      let minutes = "0" + date.getMinutes();
      var h = hours % 12 || 12;
      var ampm = (hours < 12 || hours === 24) ? "AM" : "PM";
      this.formattedTime = h + ':' + minutes.substr(-2) + ':' + ampm;
      this.isLoading = false;
    },
    error: err => {
      this.isLoading = false;
      //TODO Handle error properly here.
      // this.alert.error(err);
    }});
  }

  get showRemoteWorker(){
    return this.jobDetailService.remoteWorker();
  }

  get clientBillRateEnabled(){
    return this.jobDetailService.clientBillRateEnabled();
  }

  get address() {
    return this.candidateData?.addresses ? this.candidateData?.addresses.find(add => add.type === 'PRIMARY') : null;
  }

  checkConfig(){
    return this.jobDetailService.checkConfig(this.programRateModel, this.clientBillRateEnabled, this.user_type);
   }

  reArrangeType() {
    let RateInfo = new Array();
    var regular = this.submissionDetails?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'regular' || e.rate_factor?.toLowerCase() == 'st') {
        e.index = index;
        e.name = e.name || 'Regular';
      }
      return e.rate_factor?.toLowerCase() === 'regular' || e.rate_factor?.toLowerCase() == 'st';
    });
    if (regular?.length > 0 && regular[0].index >= 0) {
      this.submissionDetails?.rates.splice(regular[0].index, 1);
      RateInfo = [...regular];

    }
    var ot = this.submissionDetails?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'ot') {
        e.index = index;
      }
      return e.rate_factor?.toLowerCase() === 'ot';
    });
    if (ot?.length > 0 && ot[0].index >= 0) {
      this.submissionDetails?.rates.splice(ot[0].index, 1);
      RateInfo = [...RateInfo, ...ot];
    }

    var dt = this.submissionDetails?.rates.filter(function (e, index) {
      if (e.rate_factor?.toLowerCase() == 'dt') {
        e.index = index;
      }
      return e.rate_factor?.toLowerCase() === 'dt';
    });
    if (dt?.length > 0 && dt[0].index >= 0) {
      this.submissionDetails?.rates.splice(dt[0].index, 1);
      RateInfo = [...RateInfo, ...dt];
    }
    if (this.submissionDetails?.rates) {
      this.submissionDetails.rates = [...RateInfo, ...this.submissionDetails?.rates];
    }
  }

  getStatus(str){
    return str?.toLowerCase().replace(/_/g, ' ')
    .replace(/(?: |\b)(\w)/g, function(key, p1) {
        return key.toUpperCase();
    })
  }

  sidebarClose() {
    this.viewSubmissionwDetails = 'hidden';
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }

    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }

    return snakeCaseString.join(' ');
  }
  getWorkedRehire(arr) {
    if (arr instanceof Array) {
      let str = arr?.join(', ');
      return str?.toLowerCase().replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        });
    }
    else {
      return arr?.toLowerCase().replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        })
    }
  }

  get hideRateAuthority() {
    return this.jobDetailService.rateAuthority();
  }

  showHideInstruction() {
    this.showInstruction = !this.showInstruction;
  }

  alertHandler(data) {
    const candidateStatus = data?.status;
    switch(candidateStatus) {
      case 'REHIRE_REJECTED':
        this.isAlertError = true;
        this.candidateStatus = "Rehire Rejected";
        break;
      case 'REJECTED':
        this.isAlertError = true;
        this.candidateStatus = "Candidate Rejected";
        break;
      case 'SHORTLIST_REVIEW_REJECTED':
        this.isAlertError = true;
        this.candidateStatus = "Shortlist Review Rejected";
        break;
    }
    if(this.isAlertError) {
      this.candidateStatusReason = data?.status_reason;
      this.candidateStatusNote = data?.status_note;
    }
    this.isAlertError = this.isAlertError && (!!this.candidateStatusReason || !!this.candidateStatusNote);
  }
}
