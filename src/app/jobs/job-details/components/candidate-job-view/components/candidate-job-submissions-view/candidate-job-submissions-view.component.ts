import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
import { JobStatus } from 'src/app/shared/enums';
@Component({
  selector: 'app-candidate-job-submissions-view',
  templateUrl: './candidate-job-submissions-view.component.html',
  styleUrls: ['./candidate-job-submissions-view.component.scss']
})
export class CandidateJobSubmissionsViewComponent implements OnInit {
  showInstruction = false;
  viewSubmissionwDetails = "hidden";
  candidateId: any;
  currentProgram: any;
  jobId: any;
  submissionDetails: any;
  public isLoading = true;
  public showDOB = false;
  public showStateID = false;
  public maxContentLength: number = 240;
  public toggleDescription = false;
  public jobCurrency = 'USD';
  public customFields: any = [];
  public userRole: any;
  public jobDetails: any;
  public user_type;
  isCreateEstimate = 'hidden';
  public showApproval:boolean=false;
  public userrole;
  public usercategory;
  public userid;
  public submissionid;
  programRateModel: any;
  currentUserId:any;
  checkCurrentUser:any;
  rehireStatus:any;
  rehireCheckStatus:any;
  approvalCount:any;
  pendingApprovalRequest:any;
  logs: Log= undefined;
  hideEyeIcon:boolean = true;
  jobManager:any;
  userId;
  loading : boolean = true;
  shortlistBtn: boolean = false;
  detailedValue: string = "submissionDetails" ;
  minRate;
  maxRate;
  adjustmentData:any;
  taxData:any;
  rateDetailsVisible: boolean = false;
  costComponentEnabled: boolean = false;
  markupByRateTypeEnabled: boolean = false;
  payloadRateFactors:any;
  rateModelObj = {
    BILL_RATE : 'billrate',
    MARKUP : 'markup',
    PAY_RATE : 'payrate'
  }
  jobHierarchy;
  jobStatus: JobStatus;
  offerNewWorkflow: any;
  constructor(private route: ActivatedRoute,
    private _eventStrem: EventStreamService,
    private jobDetailService: JobDetailsService,
    private alert: AlertService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    private candidateService: CandidateService,
    private localDateTimeFormatPipe: LocalDateTimeFormatPipe,
    private userPermissionService: UserPermissionService,
    private s3UploadService: AwsS3FileUploadService,
    private loader:LoaderService
    ) { }

  ngOnInit(): void {
    const u = JSON.parse(localStorage.getItem('account'))
    this.userRole = u?.role?.organization_category?.toLowerCase();
    this.currentUserId = u?.role?.id;
    this.user_type = this.storageService.get('user_type');
    const user = this.storageService.get('user');
    this.userId = user?.id;
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
    this.userid=this.storageService.get(StorageKeys.CURRENT_USER).id;
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.offerNewWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui ?? false;
    this.route.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.rehireStatus = this.currentProgram?.config?.is_rehire_approval_required;
      this.candidateId = params['candidateId'];
      this.getSubmitCandidate();
      this.getCandidateDetails();
      this.getJobDetail();
     this._eventStrem.on(Events.RELOAD_REHIRECANDIDATE_DETAIL).subscribe((data) => {
        if (data) {
          this.init();
        }
      });
    });

  }

getmember(submissionId) {
    let url=`/approval/programs/${this.currentProgram.id}/SUBMISSIONS/${submissionId}/approval-instances`;
    this.jobDetailService.get(url).subscribe((data: any)=>{
      if(data){
        this.rehireCheckStatus = data?.status;
        this.approvalCount = data?.pending_approvals;
        // if(data?.approvers[0]?.members?.length)
        // {
        //   data.approvers[0].members.forEach(element => {
        //     if(element.id === this.userid)
        //     {
        //       this.showApproval=true;
        //     }
        //   });
        // }
        // if( this.user_type=='SUPER_ORG'){
        //   this.showApproval=true;
        // }
      }
    })
}

  openCreateEstimateOpen() {
    this.isCreateEstimate = 'visible';
  }
  onCreateClose() {
    this.isCreateEstimate = 'hidden';
  }

  init() {
    this.getSubmitCandidate();
    this.getCandidateDetails();
    this.getJobDetail();
  }

  get showRemoteWorker(){
    return this.jobDetailService.remoteWorker();
  }

  status = { lable: '', date: null };
  getSubmitCandidate() {
    this.isLoading = true;
    this.jobDetailService.getSubmissionDetails(this.currentProgram?.id, this.jobId, this.candidateId).subscribe({
      next: (data: any) => {
      this.submissionid=data.candidate.submission_id;
      this.getmember(this.submissionid);
      this.submissionDetails = data.candidate;
      this.markupByRateTypeEnabled = this.submissionDetails?.markup_by_rate_type;
      this.costComponentEnabled = this.submissionDetails?.is_cost_component;
      this.payloadRateFactors = this.submissionDetails?.rate_factors_info
      this.adjustmentData = this.submissionDetails?.adjustment_fee;
      this.taxData = this.submissionDetails?.taxes;
      this.submissionDetails.rates = this.jobDetailService?.rearrangeRates(this.submissionDetails?.rates);
      this.submissionDetails.candidate_worked_as = this.getWorkedRehire(this.submissionDetails?.candidate_worked_as);
      // this.submissionDetails.available_start_date = this.getFormattedDate(this.submissionDetails?.available_start_date);
      // this.submissionDetails.available_end_date = this.getFormattedDate(this.submissionDetails?.available_end_date)
      if (this.submissionDetails && this.submissionDetails?.custom_fields) {
        if (Object?.keys(this.submissionDetails?.custom_fields)?.length > 0) {
          this.getCustomFields();
          this.convertCustomFieldToArray();
        }
      }
      this.status.lable = 'Submitted On';
      this.status.date = this.submissionDetails.submitted_on;
      if (this.submissionDetails.status === 'REJECTED' && this.submissionDetails.status_modified_on) {
        this.status.lable = 'Rejected On'
        this.status.date = this.submissionDetails.status_modified_on;
      }

      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      //TODO Handle error properly here.
      // this.alert.error(err);
  }});
  }
  getDateTime(d) {
    let t = new Date(d).toISOString();
    return this.localDateTimeFormatPipe.transform(`${t}`);
  }

  get rateModelPayload(): RateModelPayloadDefaults {
    return {
      hierarchy: this.jobHierarchy,
      rate_model: this.rateModelObj[this.programRateModel],
      msp_fee_types: null,
      msp_fee_value: null,
      msp_fee_funded_by: null,
    }
  }

  get standardRateDetails() {
    if (this.submissionDetails?.rates?.length) {
      const stRates = this.submissionDetails?.rates?.find(rate => rate?.abbreviation?.toLowerCase() === 'st');
      return {
        billrate: stRates?.bill_rate,
        payrate: stRates?.pay_rate,
        vendor_rate: stRates?.vendor_bill_rate,
        markup: stRates?.markup,
        cost_component: stRates?.cost_component
      }
    }
  }

  get showPayRate(){
    if(this.programRateModel === 'BILL_RATE'){
      return false;
    }
    else{
      return true;
    }
  }

  get rateDetailsRateArray(){
    if (this.submissionDetails?.rates?.length) {
      return this.submissionDetails?.rates?.filter(obj => obj?.abbreviation?.toLowerCase() != 'st')
      .map(({ bill_rate, vendor_bill_rate, pay_rate, ...rest }) => ({
        billrate: bill_rate,
        vendor_rate: vendor_bill_rate,
        payrate: pay_rate,
        ...rest
      }));
    }
  }
  get shortlistActor(){
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    let shortActor = false;
    let getValue;
     currentConfig?.filter(item =>{
      if(item?.short_actor === this.user_type){
        shortActor = true
        getValue = item?.short_role_id?.find(x => x === this.currentUserId) ? true : false;
      }
    });
    return (
      shortActor && getValue
    )
  }

  getHideEvent(event){
    if(event) {
      this.pendingApprovalRequest = false;
    }
  }

  loadCandidateData(event){
    if(event) {
      this.getSubmitCandidate();
    }
  }

  goToApproval(){
    this.pendingApprovalRequest = true;
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  typeOf(value) {
    return typeof value;
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

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  getJobDetail() {
    this.jobDetailService.getJobs(this.jobId)
      .subscribe((res: any) => {
        this.jobDetails = res?.job;
        this.jobCurrency = res?.job?.currency?.toUpperCase();
        this.jobHierarchy = this.jobDetails?.hierarchy[0]?.id;
        this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? this.jobDetails.rate_model : this.currentProgram?.config?.program_model;
        this.loading = this.programRateModel ? false : true;
        this.jobManager = res?.job?.job_manager?.id;
        this.jobDetailService
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
      })
  }

  get clientBillRateEnabled(){
    return this.jobDetailService.clientBillRateEnabled();
  }

  get isSubmitted() {
    return this.submissionDetails.status === 'SUBMITTED';
  }

  get hideRateAuthority() {
    return this.jobDetailService.rateAuthority();
  }

  shortlist(event) {
    this.logs = undefined;
    this.shortlistBtn = true;
    if (event.status == 'PENDING_SHORTLIST' || event.status == 'PENDING_SHORTLIST_REVIEW') {
      let payload = {
        "candidates": [
          {
            "candidate_id": this.candidateId
          },
        ]
      }
      if (event.status == 'PENDING_SHORTLIST') {
        this.candidateService.shortlistCandidate(payload, this.currentProgram?.id, this.jobId, true).subscribe({
          next: (data: any) => {
            if (data) {
              this.alert.success('Candidate Shortlisted successfully.');
              this.getSubmitCandidate();
              this._eventStrem.emit(new EmitEvent(Events.RELOAD_SUBMISSION_DETAIL, true));
            }
          },
          error: (error) => {
            this.showError(error);
            this.shortlistBtn = false;
          }
        });
      } else {
        this.candidateService.shortlistReviewCandidate(payload, this.currentProgram?.id, this.jobId, true).subscribe({
          next: (data: any) => {
            if (data) {
              this.alert.success('Candidate reviewed successfully.');
              this.getSubmitCandidate();
              this._eventStrem.emit(new EmitEvent(Events.RELOAD_SUBMISSION_DETAIL, true));
            }
          },
          error: (error) => {
            this.showError(error);
            this.shortlistBtn = false;
          }
        });
      }
    }
  }

  checkConfig(){
    return this.jobDetailService.checkConfig(this.programRateModel,this.clientBillRateEnabled,this.user_type);
   }

  Rehire_reject() {
    this._eventStrem.emit(
      new EmitEvent(Events.REHIRE_REJECT, {
        value: true,
        candidateId: this.candidateId,
        jobId: this.jobId,
        progId:this.currentProgram?.id,
        subId:this.submissionid
      })
    );

  }

  Rehire_approve() {
    this._eventStrem.emit(
      new EmitEvent(Events.REHIRE_APPROVE, {
        value: true,
        candidateId: this.candidateId,
        jobId: this.jobId,
        progId:this.currentProgram?.id,
        subId:this.submissionid
      })
    );
  }

  rejectCandidate(event) {
    //  if (event.status?.toLowerCase() == 'submitted') {
    this._eventStrem.emit(
      new EmitEvent(Events.REJECT_CANDIDATE, {
        value: true,
        candidateId: event?.id,
        jobId: this.jobId,
        status: event?.status
      })
    );
    //}
  }

  shortlistReviewReject(event){
    this._eventStrem.emit(
      new EmitEvent(Events.SHORTLIST_REVIEW_REJECT, {
        value: true,
        candidateId: event?.id,
        jobId: this.jobId,
        status: event?.status
      })
    );
  }

  candidateData: any;
  getCandidateDetails() {
    this.candidateService.getCandidateDetail(this.candidateId,true).subscribe({
      next: (data: any) => {
        if (data) {
          this.candidateData = data.candidate;
        }
      },
      error: (error) => {
        // this.alert.error(error);
        this.showError(error);
  }});
  }

  get address() {
    return this.candidateData?.addresses ? this.candidateData?.addresses.find(add => add.type === 'PRIMARY') : null;
  }

  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  hideRateDetails(data) {
    this.rateDetailsVisible = false;
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
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

  contentViewToggle() {
    this.toggleDescription = !this.toggleDescription;
  }

  showHideInstruction() {
    this.showInstruction = !this.showInstruction;
  }

  clickToScheduleInterview() {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.candidateId}/interviews/create`)
  }

  isUserRole(role: string): boolean {
    return this.userPermissionService.isUserRole(role as UserType);
  }


  get visibleCreateButton() {
    return !this.isUserRole(UserType.Vendor) && !this.isUserRole(UserType.Worker) && this.isSubmitted;
  }

  checkIfArray(arr){
    return Array.isArray(arr) ? true : false;
  }

  convertCustomFieldToArray() {
    const customFields = Object.entries(this.submissionDetails.custom_fields)?.map((e) => ({ slug: e[0], value: e[1] }));
    this.submissionDetails.custom_fields = customFields;
    //this.updateCustomFieldName();
  }

  getCustomFields() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const hierarchyIds = this.jobDetails?.hierarchy?.map(h => h?.id)?.join(',');
    let url = `/configurator/programs/${currentProgram?.id}/custom-fields?entity_ref=SUBMISSIONS&active=1&order_by=asc&key=ref_order${
      hierarchyIds ? `&hierarchy_ids=${hierarchyIds}` : ``
    }`;
    this.candidateService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data.custom_fields;
          this.updateCustomFieldName(this.customFields);
        }
      },
      error: error => {},
    });
  }

  updateCustomFieldName(customFields) {
    if (customFields && customFields.length > 0 && this.submissionDetails?.custom_fields && this.submissionDetails?.custom_fields?.length > 0) {
       this.customFields?.forEach(c => {
        this.submissionDetails?.custom_fields.forEach(jc => {
          if (typeof jc.value === 'object' && Object.keys(jc.value).length === 0) return;
          if (c?.slug === jc?.slug) {
            if(c?.meta_data?.currency) {
              jc.currency = c?.meta_data?.currency;
            }
            if(c?.type == "TOGGLE" || c?.type == 'NUMBERS') {
              jc.value = jc?.value?.toString();
            }
            jc.name = c?.name;
            jc.type = c?.type;
            jc.label = c?.label;
            if(jc?.type == 'DROPDOWN') {
              const val = [];
              (Array.isArray(jc?.value) ? jc?.value : [jc?.value])?.forEach((res,i)=>{
                c?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                  if(res == custom_field_data?.value) {
                    val.push(custom_field_data?.label);
                  }
                });
              });
              jc.value = val;
            }
            if(c?.type == 'SOURCE' && jc.value) {
              this.loader.show();
              let url = c.api_url
              url = url.includes('?') ? url += `&user_ids=${jc.value}` : url += `&user_ids=${jc.value}`
              this.jobDetailService.get(url).subscribe({
                next: (data: any) => {
                  jc.value = data?.members[0]?.full_name
                  this.loader.hide();
                }, error: (error) => {
                  this.loader.hide();
                },
              });
            }
            if(c?.type == 'NUMBERS') {
              if (c?.meta_data?.show_in_thousands) {
                jc.value = jc?.value?.toLocaleString('en-US', {minimumFractionDigits: c?.meta_data?.decimal});
              } else if (!c?.meta_data?.show_in_thousands && c?.meta_data?.decimal) {
                jc.value = (+jc?.value)?.toFixed(c?.meta_data?.decimal);
              }
            }
          }
        });
      });
    }
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  isObjectArray(obj : any) {
    return Array.isArray(obj)
  }

  detailCollapse(value){
    this.detailedValue = value;
  }

  checkStatus(status){
    if (status?.toLowerCase() === "countered_offer_pending_review" && !this.offerNewWorkflow) {
      status = 'COUNTERED_PENDING_REVIEW';
    } else if (status?.toLowerCase() === "countered_offer_pending_review" && this.offerNewWorkflow) {
      status = 'COUNTER_OFFER_PENDING_REVIEW';
    } else if (status?.toLowerCase() === "offer_countered_pending_approval" && this.offerNewWorkflow) {
      status = 'COUNTER_OFFER_PENDING_APPROVAL';
    }
     return this.snakeCaseToTitle(status)
  }
}
