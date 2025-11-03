import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map, Subject, Subscription, throttleTime } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { UntypedFormGroup } from '@angular/forms';
import {
  EmitEvent,
  Events,
  EventStreamService
} from 'src/app/core/services/event-stream.service';
import {
  StorageKeys,
  StorageService
} from 'src/app/core/services/storage.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { UsersType, JobStatus, AccuracyConfigEnum, AccessType} from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { multiWorkflow } from 'src/app/shared/interfaces';
import { statusEnum } from 'src/app/multi-approvals/enum/approvalsEnum';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-candidate-job-view-offers',
  templateUrl: './candidate-job-view-offers.component.html',
  styleUrls: ['./candidate-job-view-offers.component.scss'],
})
export class CandidateJobViewOffersComponent implements OnInit {
  checkedMarkUp: boolean = true;
  checkedotPayRate: boolean = true;
  checkedotBillRate: boolean = true;
  checkeddtBillRate: boolean = true;
  checkeddtPayRate: boolean = true;
  isCounteredOffer: boolean = false;
  moduleStatus:any;
  jobData: any;
  public offerData;
  public currentProgram;
  public currentJobid;
  public currentOfferId;
  public currentCandidate;
  public job: any;
  public offerNotes: any;
  public noOffer: boolean = true;
  public loading: boolean;
  public holidayCalender: string = '';
  public timesheetType: string = '';
  public clientOverTimeBillRateFactor;
  public clientDoubleTimeBillRateFactor;
  preferedDateFormat:any;
  public multiApprovals: multiWorkflow[] = []
  public clientOverTimePayRateFactor;
  public clientDoubleTimePayRateFactor;
  private isopencreateOffer: boolean = false;
  public tableNoDataObj: any;
  public offerCreate: boolean = false;
  public candidateDetails: any;
  public isopen: boolean = false;
  public isfromInterview: boolean = false;
  public userType: string = undefined;
  public iscreateOffer: boolean = true;
  public counterOffer: boolean = false;
  public showDropdownOffer: boolean = false;
  public customFields: any = [];
  private subscriptions: Subscription[] = [];
  public isLoader: boolean = false;
  public showActionButton: boolean=true;
  public jobsStatus: any = JobStatus;
  @ViewChild('optionButton', { read: ElementRef, static: false })
  optionButton: ElementRef;
  @ViewChild('rowDropDownBox', { read: ElementRef, static: false })
  rowDropDownBox: ElementRef;
  @ViewChild('optionButtonCounteroffer', { read: ElementRef, static: false })
  optionButtonCounteroffer: ElementRef;
  public prevTimeSheetType: string;
  public prevholidayCalender: string;
  public offerPageMode: string;
  public offerEdit: boolean = false;
  public formattedTime: any;
  public foundationCustomFieldsList: Array<any>;
  public isVendorUser: boolean = false;
  public jobCurrency = 'USD';
  public offerForm: UntypedFormGroup;
  public userRole: any;
  public jobStatus: any = JobStatus;
  public isBillDriven = false;
  public pendingApprovalRequest: boolean;
  public hasOwnApprovalPending: boolean = false;
  public approvalCount = 0;
  public showAccountCodeDetails = 'hidden';
  public offerApprovalStatus;
  public maxContentLength: number = 240;
  public toggleDescription = false;
  approvalStatus:any;
  jobCurrentStatus:any;
  offerJobManager:any;
  showCreateOffer:any;
  noData:boolean;
  programRateModel:any;
  logs: Log= undefined;
  isVendorNeutral: any;
  isReviewBtnDisable: boolean = false;
  hideMasterDataTypeName: boolean = false;
  noActionMessages = false;
  accuracyConfig = AccuracyConfigEnum;
  isCreateEstimate = false;
  isOfferDetailPage = true;
  clientBillRate;
  workingData:any;
  budgetInfo:any;
  adjustment_type;
  adjustment_value;
  additional_amount;
  minRate;
  maxRate;
  detailedValue = "basicinfo";
  showTimesheetManagers = false;
  showExpenseManagers = false;
  displayFirstTimesheetManager;
  displayFirstExpenseManagerName;
  remainingTimesheetManagers = [];
  remainingExpenseManagers = [];
  displayFirstTimesheetManagerName;
  displayFirstExpenseManager;
  adjustmentData: any;
  taxData:any;
  rateDetailsVisible: boolean = false;
  costComponentEnabled: boolean = false;
  markupByRateTypeEnabled: boolean = false;
  payloadRateFactors:any;
  currentTab: string = 'offer_details';
  offerDetailsNewUi:boolean = false;
  approvalFor;
  public approvalNote = 'hidden';
  superAdminEdit = false;
  adminApprovalMode = 'sequence';
  jobDetails = true;
  approvalChainId;
  approvalWorkflow: any;
  actionVisibility = false;
  isProgramAdmin = false;
  approverId = '';
  isDelegatedWorkflowMember: boolean = false;
  @ViewChild('actionButton', { read: ElementRef, static: false })
  actionButton: ElementRef;
  @ViewChild('actionDropdown', { read: ElementRef, static: false })
  actionDropdown: ElementRef;
  @ViewChild('jobBreadcumDropdownTrigger', {read: ElementRef, static: false})
  jobBreadcumDropdownTrigger : ElementRef;
  @ViewChild('jobBreadcumDropdownTriggerMobileOnly', {read: ElementRef, static: false})
  jobBreadcumDropdownTriggerMobileOnly : ElementRef;
  approvalInstance:any;
  approvalOption: boolean = false;
  approvalPanelTitle: string;
  is_reassigned_user:boolean = false;
  isAlertBoxShown: boolean = false;
  version: number;
  statusMessageData: { status: any; approve_reject_by: string; updated_by: { name: string; } | { name?: undefined; }; date: any; reason: any; notes: any; };
  rateModelObj = {
    BILL_RATE : 'billrate',
    MARKUP : 'markup',
    PAY_RATE : 'payrate'
  }
  jobHierarchy;
  showOverlapWarning: boolean = false;
  allowAssignmentOverlap: boolean;
  overlapAssignmentData = [];
  private fetchOfferByCandidateJobSubject$ = new Subject<any>(); 
  constructor(
    private route: ActivatedRoute,
    private storageService: StorageService,
    private jobService: JobDetailsService,
    private router: Router,
    private eventStreamService: EventStreamService,
    private alert: AlertService,
    private _storageService: StorageService,
    private datePipe: LocalDateFormatPipe,
    private userPermissionService: UserPermissionService,
    private authorizationService: AuthorizationService,
    private render: Renderer2,
    private s3UploadService: AwsS3FileUploadService,
    private loader:LoaderService,
    private sortHelper: SortHelperPipe,
    private candidateService: CandidateService,
    private location : Location
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.optionButton && this.optionButton?.nativeElement?.contains(e.target) && !this.showDropdownOffer)) {
        let count = 0;
        const ulItem = document.getElementById('rowDropdownWorkflow')?.querySelectorAll('li');
        ulItem?.forEach(x => {
          if (x?.hasAttribute('hidden') === true || (x?.childNodes?.length === 1 && x?.childNodes[0]?.nodeName === '#comment')) {
            count++;
          }
        });
        if (ulItem.length === count) {
          this.noActionMessages = true;
        }
        this.showDropdownOffer = true;
        const itemPosition = this.optionButton?.nativeElement?.getBoundingClientRect();
        const pageBody = document.getElementById('pagecontainer');
        const windowHeight = pageBody.offsetHeight;
        const targetItem = document.getElementById('rowDropdownWorkflow');
        const targetHeight = targetItem.offsetHeight;

        targetItem.classList.add('active');

        if (itemPosition?.top + window?.scrollY + 45 + targetHeight > windowHeight) {
          targetItem?.classList?.add('flip');
        } else {
          targetItem?.classList?.remove('flip');
        }
      } else if(this.showDropdownOffer === true){
        this.showDropdownOffer = false;
        const targetItem = document?.getElementById('rowDropdownWorkflow');
        targetItem?.classList?.remove('active');
        targetItem?.classList?.remove('flip');
      }
      else if(this.jobBreadcumDropdownTrigger && this.jobBreadcumDropdownTrigger.nativeElement.contains(e.target)) {
        if(this.hasApprovalOverridePermission) {
            this.approvalOption = true;
          } else {
            this.openApprovalPanel('approved');
          }
      }
      else {
        this.approvalOption = false;

      }
    });
   }

  ngOnInit(): void {
    const u = JSON.parse(localStorage.getItem('account'))
    this.userRole = u?.role?.organization_category?.toLowerCase();
    this.tableNoDataObj = {
      headTitle: 'No offers found',
      subTitle: 'There are no offers created for this job',
      imageUrl: './assets/images/freepik--Envelope--inject-10.svg',
      button: true,
    };
    this.noOffer = false;
    this.noData = false;
    this.loading = true;
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.offerDetailsNewUi = this.currentProgram?.config?.offer?.offer_details_new_ui;
    this.isVendorNeutral = this.currentProgram?.config?.is_vendor_neutral;
    this.approvalStatus = this.currentProgram?.config?.is_approval_for_offers;
    this.userType = this.storageService.get('user_type');
    this.iscreateOffer = this.userType !== 'VENDOR';
    this.isVendorUser = this.storageService.get('account')?.role?.organization_category?.toLowerCase() === UsersType.VENDOR?.toLowerCase();
    this.fetchOfferByCandidateJobSubject$.pipe(throttleTime(500)).subscribe({
      next:()=> this.fetchOfferByCandidateJob()
    }) 
    this.route.parent?.params.subscribe((params) => {
      this.currentJobid = params['id'];
      this.currentCandidate = params['candidateId'];
      this.route.queryParamMap.subscribe((queryParamMap: any) => {
        this.isopencreateOffer = queryParamMap['params']['createOffer'];
        this.currentOfferId = queryParamMap['params']['offerId'];
        this.isfromInterview = queryParamMap['params']['isfromInterview'];
        this.counterOffer = queryParamMap['params']['counterOffer'];
        this.offerEdit = queryParamMap['params']['offerEdit'];
        this.offerPageMode = queryParamMap['params']['offerPageMode'];
        this.currentTab = queryParamMap?.params?.tab || 'offer_details';   
        this.jobService.loadJob(this.currentJobid).subscribe((res: any) => {
          this.jobCurrency = res?.job?.currency;
          this.job = res?.job;
          this.jobHierarchy = this.job?.hierarchy[0]?.id;
          this.getWorkingHoursEstimate(this.job?.day_per_week,this.job?.estimated_hours)
          this.jobCurrentStatus = this.job?.status;
          this.preferedDateFormat = this.job?.hierarchy?.[0]?.preferred_date_format || this.currentProgram?.defaultDateFormat;
          this.jobService.emitOfferDetailsClickEvent();
          this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? this.job.rate_model : this.currentProgram?.config?.program_model;
          if(this.programRateModel === 'PAY_RATE'){
            this.minRate = this.job['min_pay_rate'];
            this.maxRate = this.job['max_pay_rate'];
          }
          else{
            if(this.userType.toLowerCase() === 'vendor') {
              if(this.clientBillRateEnabled){
                this.minRate =  this.job['min_bill_rate'];
                this.maxRate = this.job['max_bill_rate'];
              }else{
                this.minRate =  this.job['vendor_min_bill_rate'];
                this.maxRate = this.job['vendor_max_bill_rate'];
              }
            }
            else {
              this.minRate =  this.job['min_bill_rate'];
              this.maxRate = this.job['max_bill_rate'];
            }
          }
        });

        if (this.currentOfferId) {
          forkJoin([this.getofferDetails().pipe(map((res: any)=>{
            if(res?.show_offer_list_page){
              this.router.navigateByUrl('jobs/offers');
            }
            else return res;
          })), this.jobService.loadJob(this.currentJobid)]).subscribe((data: any) => {
            this.loading = false;
            this.job = data[1]?.job;
            let res = data[0];
            this.offerData = res?.offer;
            this.version= this.offerData?.version;
            this.markupByRateTypeEnabled =  this.offerData?.stages[0]?.markup_by_rate_type;
            this.costComponentEnabled = this.offerData?.is_cost_component;
            this.payloadRateFactors = this.offerData?.stages[0]?.rate_factors_info;
            this.getOfferManager(this.offerData);
            if(this.isEmptyObject(this.offerData?.stages[0]?.rate_markup_info)){
              this.adjustment_type = this.job?.adjustment_type ?? 'fixed';
              this.adjustment_value = this.job?.adjustment_value ?? 0;
              this.additional_amount = this.job?.additional_amount ?? 0;
            }
            else{
              this.adjustment_type = this.offerData?.stages[0]?.rate_markup_info?.adjustment_type ?? 'fixed';
              this.adjustment_value = this.offerData?.stages[0]?.rate_markup_info?.adjustment_value ?? 0;
              this.additional_amount = this.offerData?.stages[0]?.rate_markup_info?.additional_amount ?? 0;
            }
            if(this.offerData){
              this.offerData.stages[0].rates = this.sortingOfferRates(this.offerData.stages[0]?.rates);;
            }
            this.taxData = this.offerData?.taxes;
            this.adjustmentData = this.offerData?.adjustment_fee;
            this.getTimesheetManagers(this.offerData?.stages[0]?.timesheet_manager);
            this.getExpenseManagers(this.offerData?.stages[0]?.expense_managers);
            this.jobService.masterDataProgressiveLoader().then(res => {
              this.offerData?.foundational_data.forEach(fd => {
                const fd_type = res?.fd_types.find(x => x.id == fd.id);
                fd.configuration = fd_type?.configuration ?? {};
                fd.ref_order = fd_type?.ref_order ?? 1;
              });
              this.offerData.foundational_data = this.sortHelper.transform(this.offerData?.foundational_data, 'ref_order');
              this.setFoundationCustomFieldsDetails();
            });
            if (this.offerData) {
              this.offerData.stages[0].rates = this.sortingOfferRates(this.offerData.stages[0]?.rates);;
              this.noData = false;
            }

            this.isCounteredOffer = (res?.offer?.status?.toLowerCase() == 'countered' ||
            res?.offer?.status?.toLowerCase() == 'countered_pending_review'||
            res?.offer?.status?.toLowerCase()== 'countered_pending_approval') ? true : false;

            //find the time from the timespan for submitted date in 12 hr format
            let date = new Date(this.offerData?.stages[0]?.created_on * 1000);
            let hours = date.getHours();
            let minutes = "0" + date.getMinutes();
            var h = hours % 12 || 12;
            var ampm = (hours < 12 || hours === 24) ? "AM" : "PM";
            this.formattedTime = h + ':' + minutes.substr(-2) + ':' + ampm;

            if (this.isEmptyObject(this.offerData?.custom_fields)){
              this.offerData.custom_fields = [];
            }
            if (this.offerData && !this.isEmptyObject(this.offerData?.custom_fields)) {
              this.convertCustomFieldToArray();
              this.getCustomFields();
            }

            //this.getTimesheetTypAndeHoliday();
            this.getWorkingHoursEstimate();
            this.fetchCandidateDetails();
            this.checkUserApproval();
            this.setStatusMessage();
            this.moduleStatus = this.offerData?.status;
            this.multiApprovals = [
              { name: 'review', api_url: `/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-instances?workflow_action=REVIEW${this.version ? ('-V-'+this.version):''}`, status: this.jobStatus.PENDING_OFFER_REVIEW ,workflow_type:'review' , isReplaceMember: true },
              { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-instances?workflow_action=APPROVAL${this.version ? ('-V-'+this.version):''}`, status: this.jobStatus.PENDING_APPROVAL ,workflow_type:'approval', isReplaceMember:true },
            ];
            if(this.isCounteredOffer){
              this.multiApprovals[0].status = this.jobStatus.COUNTERED_PENDING_REVIEW;
              this.multiApprovals[1].status = this.jobStatus.COUNTERED_PENDING_APPROVAL;
            }
            const isReview = (this.isCounteredOffer && this.currentProgram?.config?.offer?.counter_offer_review) ||
                              (!this.isCounteredOffer && this.currentProgram?.config?.offer?.pending_offer_review);
            if(!isReview){
              this.multiApprovals.shift();
            }
          });
        } else {
          if (
            this.isopencreateOffer &&
            !this.offerData &&
            this.isfromInterview
          ) {
            this.createOfferOpen();
          }

          this.jobService
          .fetchCurrentSubmitCandidate(this.currentCandidate, this.currentJobid)
          .subscribe((res: any) => {
            if(res?.candidate?.status?.toUpperCase()=='PENDING_SHORTLIST' || res?.candidate?.status?.toUpperCase()=='REJECTED' || res?.candidate?.status?.toUpperCase()=='WITHDRAWN'){
              this.tableNoDataObj.button=false;
            }
          })
          this.fetchOfferByCandidateJobSubject$.next(null);
        }
      });
    });
    this.getAssignmentConfig();
    if(this.currentProgram && this.currentProgram?.config?.program_model?.toLowerCase() ==='bill_rate') {
      this.isBillDriven = true
     }
    this.fetchCandidateDetails();
    this.hideCreateOfferForm();
    this.subscriptions.push(this.eventStreamService.on(Events.RELOAD_OFFER_DETAILS).subscribe((data) => {
      if (data) {
        this.fetchOfferByCandidateJobSubject$.next(null);
        if(this.offerDetailsNewUi){
          this.refreshWorkflowData();
        }
      }
    }));
    this.hideMasterDataTypeName = this.currentProgram?.config?.show_only_master_codes ?? false;

    this.subscriptions.push(this.eventStreamService.on(Events.RELOAD_OFFERS).subscribe((data) => {
      if (data) {
        this.fetchOfferByCandidateJobSubject$.next(null);
        if(this.offerDetailsNewUi){
          this.refreshWorkflowData();
        }
      }
    }));
  }
  onCloseSideBar = (value) =>{
    this.showAccountCodeDetails = 'hidden';
  }

  onSubmitApproveReject(event) {
    this.loader.show();
    const { approval_for, approval_reason, approval_notes, approval_chain_id, is_program_admin, superAdminEdit} = event;
    const workflow_action = ((this.offerData?.status?.toLowerCase() == this.jobsStatus.PENDING_OFFER_REVIEW) ||
                            (this.offerData?.status?.toLowerCase() == this.jobsStatus.COUNTERED_PENDING_REVIEW) ? 'REVIEW' : 'APPROVAL')+
                            (this.version?'-V-'+ this.version : '');
    const payload = {
      'status': approval_for.toUpperCase(),
      'status_reason': approval_reason,
      'status_note': approval_notes,
      "approval_chain_id": superAdminEdit ? '' : approval_chain_id ?? '',
      "inactive_member_flag": is_program_admin,
      'is_forced_approval': (superAdminEdit && this.adminApprovalMode !== 'sequence'),
      'workflow_action': workflow_action,
    };
    if(this.isDelegatedWorkflowMember) {
      payload['is_delegated_approval'] = true;
      payload['approver_id'] = this.approverId;
    }

    if(this.is_reassigned_user) {
      payload['is_reassigned_user'] = true;
    }

    const findPendingApprovalLevel = (res) => {
      return res?.status == statusEnum.pending;
    }

    if(superAdminEdit) {
      const pending_level = this.approvalInstance?.find(findPendingApprovalLevel);
      payload['approval_chain_id'] = pending_level?.approval_chain_id;
      payload['approver_id'] = pending_level?.members?.find((res)=>res?.status == statusEnum.pending)?.id;
    }
    this.jobService.put(`/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-request`, payload)
      .subscribe({
        next: (res: any) => {
        this.loader.hide();
        const account = this._storageService.get(StorageKeys?.CURRENT_ACCOUNT);
        const isUserJobManager = (this.jobData?.job_manager_id == account?.id);
        const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
        if(!isUserJobManager && this.userType?.toUpperCase() == UsersType.CLIENT?.toUpperCase()  && accessType?.toUpperCase() == AccessType.TRUE_OWN?.toUpperCase()) {
          this.router.navigate(['/jobs/offers']);
        } else {
          this.afterSuccess();
        }
      },
      error: (err) => {
        this.loader.hide();
        this.approvalNote = "hidden";
        this.showError(err);
      }});
  }
  afterSuccess() {
    setTimeout(()=>{
      window.location.reload();
    },1000)
  }

  get hasApprovalOverridePermission() {
    let canOverRideApprovalProcess = false;
    if (this.userPermissionService.isUserSuperAdmin()) {
      canOverRideApprovalProcess = true;
    } else {
      const user_permission: [] = this._storageService.get('user_permission');
      if (user_permission && user_permission.length > 0) {
        canOverRideApprovalProcess = user_permission.some(permission => permission === 'admin_override_on_approval')
      }
    }
    return canOverRideApprovalProcess && !this.approvalChainId;
  }

  get hideRateAuthority() {
    return this.jobService.rateAuthority();
  }

  get clientBillRateEnabled(){
    return this.jobService.clientBillRateEnabled();
  }
  get showRemoteWorker(){
    return this.jobService.remoteWorker();
  }

  getOfferManager(offerData){
    let arr = [];
      offerData?.stages.forEach(element => {
        if(element?.job_manager !== null && Object?.keys(element?.job_manager).length != 0){
          arr.push(element?.job_manager);
        }
      });
    this.offerJobManager = arr[0];
  }

  getHideEvent(event){
    if(event){
      this.pendingApprovalRequest = false;
    }
  }
  showPopoverInt() {
    this.showTimesheetManagers = true;
  }

  hidePopOverInt() {
    this.showTimesheetManagers = false;
  }
  showExpenceManagers(){
    this.showExpenseManagers = true;
  }

  hideExpenceManagers(){
    this.showExpenseManagers = false;
  }
  goToApproval(){
    this.pendingApprovalRequest = true;
  }
  checkConfig(){
    return this.jobService.checkConfig(this.programRateModel,this.clientBillRateEnabled,this.userType);
   }

  getDate(date) {
    if (date) {
      const splittedDate = date.split('-');
      const yy = splittedDate[0];
      const month = splittedDate[1];
      const dd = splittedDate[2];
      return new Date(yy, month - 1, dd);
    }
  }

  // getFormattedDate = function (date) {
  //   if (date) {
  //     const dd = String(date.getDate()).padStart(2, '0');
  //     const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
  //     const yyyy = date.getFullYear();
  //     return yyyy + '-' + mm + '-' + dd;
  //   }
  // }

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

  openCreateEstimateOpen(){
    this.isCreateEstimate = true;
  }
  closePopup(event) {
    this.isCreateEstimate = false;
  }
  getPastData(rate_factor) {
    return (this.offerData?.stages && this.offerData?.stages?.length > 0) ? this.offerData?.stages[1]?.rates?.find(val => val.rate_factor?.toLowerCase() === rate_factor?.toLowerCase()) : null;
  }

  formatted_working_days: any;
  working_hours: any;
  queryStringWorkEstimate: any;

  async getWorkingHoursEstimate(week_working_days?,hours_per_day?) {
    week_working_days = week_working_days || this.job?.day_per_week;
    hours_per_day = hours_per_day || this.job?.estimated_hours;
    let start_date: any = this.offerData?.stages[0]?.start_date;
    let end_date: any = this.offerData?.stages[0]?.end_date;
    if (start_date && end_date) {
      start_date = this.datePipe.transform(start_date, "YYYY-MM-DD", '', '', true);
      end_date = this.datePipe.transform(end_date, "YYYY-MM-DD", '', '', true);
      if (start_date && end_date && week_working_days && hours_per_day) {
        this.jobService.get(`/core-money/programs/${this.currentProgram?.id}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`).subscribe((data: any) => {
          if (data && data.data) {
            this.workingData = data?.data;
            this.formatted_working_days = data?.data?.formatted_working_days;
            this.working_hours = data?.data?.working_hours;
            // this.createJobForm.patchValue(data.data);
            this.getResourceBudget(start_date, end_date, week_working_days, hours_per_day);
          }
        });
      }
    }

  }


  totalBudget: any;
  async getResourceBudget(startDate, endDate, week_working_days, hours_per_day) {
    const rates = this.offerData?.stages[0]?.rates;
    let rateType = this.offerData?.rate_type || [];
    const { bill_rate } = rates?.find(r => r?.rate_factor?.toLowerCase() === 'st') || {};
    let request: any = {};
    let effective_data_arr = [];
    // let { billRatevalue, rateType, working_hours } = formData;
    request.total_hours = this.working_hours;
    request.rate = bill_rate;
    this.clientBillRate = bill_rate;
    request.hours_per_day = hours_per_day;
    request.week_working_days = week_working_days;
    if (!bill_rate || !rateType || !startDate || !endDate) {
      return;
    }
    request.adjustment_fee = this.adjustmentData;

    let req: any = {};

    req.start_date = startDate;
    req.end_date = endDate;
    req.num_resources = 1;
    req.additional_budget = 0;
    req.adjustment_type = this.adjustment_type;
    req.adjustment_value = this.adjustment_value;
    let effective_data_obj: any = {
      effective_start_date : startDate,
      effective_end_date : endDate,
      hours_per_day:request.hours_per_day,
      week_working_days: request.week_working_days,
      rate: request.rate,
      total_hours:request.total_hours,
      rate_type: this.jobService?.getUnitOfMesaure(rateType),
      tax: [],
      adjustment_fee: request?.adjustment_fee
    };
    effective_data_arr.push(effective_data_obj);
    req.effective_data = effective_data_arr;

    this.jobService.post(`/core-money/programs/${this.currentProgram?.id}/resource-budget`, req).subscribe((data: any) => {
      if (data && data.data) {
        const { single_initial_budget } = data?.data;
        this.totalBudget =  data?.data?.net_budget;
        if(this.isEmptyObject(this.offerData?.stages[0]?.rate_markup_info)){
          this.budgetInfo = {
            additional_amount: this.additional_amount,
            single_initial_budget: single_initial_budget,
            single_net_budget: this.totalBudget,
            budget_estimate: this.totalBudget,
            adjustment_type: this.adjustment_type,
            adjustment_value: this.adjustment_value,
            estimated_adjustment: data?.data?.estimated_adjustment
          }
        }
        else{
          this.budgetInfo = this.offerData?.stages[0]?.rate_markup_info
        }
      }
    });
  }


  jsonToQueryString(json) {
    return '?' +
      Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(json[key]);
      }).join('&');
  }


  getStatusChange(status: any) {
    if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL?.toLowerCase()) {
      status = 'Pending approval';
    } else if (status?.toLowerCase() === this.jobStatus?.RELEASE_JOB?.toLowerCase()) {
      status = 'Release job';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_SOURCING?.toLowerCase()) {
      status = 'Pending approval sourcing';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HALTED.toLowerCase()) {
      status = 'Halted';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HOLD?.toLowerCase()) {
      status = 'Hold';
    } else if (status?.toLowerCase() === this.jobStatus?.FILLED_OR_CLOSED?.toLowerCase()) {
      status = 'Filled/Closed';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_OFFER_REVIEW?.toLowerCase()) {
      status = 'Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && !this.offerDetailsNewUi) {
      status = 'Countered Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && this.offerDetailsNewUi) {
      status = 'Counter Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_APPROVAL?.toLowerCase() && this.offerDetailsNewUi) {
      status = 'Counter Pending Approval';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_CANCELLED?.toLowerCase()) {
      status = 'Countered Review Cancelled';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_DISTRIBUTION?.toLowerCase()) {
      status = 'Pending Distribution';
    }
    return status?.toLowerCase();
  }
  getofferDetails() {
    if (this.currentJobid) {
      return this.jobService.getOfferDetails(
        this.currentJobid,
        this.currentCandidate,
        this.currentOfferId
      );
    }
  }

  getTimesheetTypAndeHoliday() {
    forkJoin([
      this.jobService.getHolidayCalenderList(),
    ]).subscribe({
      next: (list: any) => {
      this.holidayCalender =
        list[0]?.holiday_calendars.filter(
          (x) => x.id === this.offerData?.stages[0]?.holiday_calendar_id
        )[0]?.name || '-';

      if (this.offerData?.stages.length > 1) {
        this.prevholidayCalender = list[0]?.holiday_calendars?.filter(
          (x) => x?.id === this.offerData?.stages[1]?.holiday_calendar_id
        )[0]?.name || '-';
      }
        this.loading = false;
    }, error: (err) => {
        this.alert.error(err.error.error.message);
        this.loading = true;
      }
    })
  }

  get vendorMarkUp() {
    return this.jobService.getProgramConfig('vendor_markup');
  }

  get rateFactor() {
    return this.jobService.getProgramConfig('rate_factor');
  }

  get getActionButton(){
    return this.authorizationService.authorize('reject_candidate') || this.authorizationService.authorize('counter_offer')
    || this.authorizationService.authorize('update_offer');
  }


  get hasAssignments() {
    return !!this.offerData?.assignment_id || !!this.candidateDetails?.candidate?.assignment_id;
  }

  get getActionButtons(){

     if(

      ((this.userType !== 'SUPER_ORG' &&
     this.userType == this.offerData?.stages[0]?.created_by?.org_type) ||
     this.offerData?.status == 'REJECTED' ||
     this.offerData?.status == 'ACCEPTED' || this.userType === 'VENDOR')

     && ((this.userType !== 'SUPER_ORG' && this.userType == this.offerData?.stages[0]?.created_by?.org_type) ||
     this.offerData?.status?.toUpperCase() == 'REJECTED' ||
     this.offerData?.status?.toUpperCase() == 'ACCEPTED')


     && ((this.userType !== 'SUPER_ORG' &&
        this.userType == this.offerData?.stages[0]?.created_by?.org_type)  ||
        this.offerData?.status == 'REJECTED' ||
        this.offerData?.status == 'ACCEPTED')

     && (!this.authorizationService.authorize('reject_candidate') &&  this.userType == 'VENDOR')
     ){
       return false;

     }else{
       return true;
     }
  }

  fetchOfferByCandidateJob() {
    //Use fetchOfferByCandidateJobSubject to call this func.
    this.jobService
      .fetchOfferForCandidate(this.currentProgram?.id, this.currentCandidate, this.currentJobid)
      .subscribe({
        next: (res: any) => {
          this.currentOfferId = !!res?.offers.length ? res.offers[0].id : 0;
          if (!!this.currentOfferId) {
            this.noOffer = false;
            this.noData = false;
            this.getofferDetails().subscribe((data: any) => {
              // if(data?.offer?.status == "WITHDRAWN"){
              //   this.noOffer = true;
              //   this.loading = false;
              //   return;
              // }
              if(data?.show_offer_list_page){
                this.router.navigateByUrl('jobs/offers');
              }
              this.offerData = data.offer;
              this.version = this.offerData?.version;
              this.markupByRateTypeEnabled =  this.offerData?.stages[0]?.markup_by_rate_type;
              this.costComponentEnabled = this.offerData?.is_cost_component;
              this.payloadRateFactors = this.offerData?.stages[0]?.rate_factors_info;
              this.getOfferManager(this.offerData);
              if(this.isEmptyObject(this.offerData?.stages[0]?.rate_markup_info)){
                this.adjustment_type = this.job?.adjustment_type ?? 'fixed';
                this.adjustment_value = this.job?.adjustment_value ?? 0;
                this.additional_amount = this.job?.additional_amount ?? 0;
              }
              else{
                this.adjustment_type = this.offerData?.stages[0]?.rate_markup_info?.adjustment_type ?? 'fixed';
                this.adjustment_value = this.offerData?.stages[0]?.rate_markup_info?.adjustment_value ?? 0;
                this.additional_amount = this.offerData?.stages[0]?.rate_markup_info?.additional_amount ?? 0;
              }

              this.adjustmentData = this.offerData?.adjustment_fee;
              this.taxData = this.offerData?.taxes;

              if(this.offerData){
                this.offerData.stages[0].rates = this.sortingOfferRates(this.offerData.stages[0]?.rates);
              }

              this.getTimesheetManagers(this.offerData?.stages[0]?.timesheet_manager);
              this.getExpenseManagers(this.offerData?.stages[0]?.expense_managers);
              this.jobService.masterDataProgressiveLoader().then(res => {
                this.offerData?.foundational_data.forEach(fd => {
                  const fd_type = res?.fd_types?.find(x => x.id == fd.id);
                  fd.configuration = fd_type?.configuration ?? {};
                  fd.ref_order = fd_type?.ref_order ?? 1;
                });
                this.offerData.foundational_data = this.sortHelper.transform(this.offerData?.foundational_data, 'ref_order');
                this.setFoundationCustomFieldsDetails();
              });
              this.getWorkingHoursEstimate();
              this.checkUserApproval();
              this.fetchCandidateDetails();
              this.isCounteredOffer = (data?.offer?.status?.toLowerCase() == 'countered' ||
              data?.offer?.status?.toLowerCase() == 'countered_pending_review'||
            data?.offer?.status?.toLowerCase()== 'countered_pending_approval') ? true : false;
              //this.getTimesheetTypAndeHoliday();
              if (this.offerData && !this.isEmptyObject(this.offerData?.custom_fields)) {
                this.convertCustomFieldToArray();
                this.getCustomFields();
              }

              this.loading = false;
              this.setStatusMessage();
              this.moduleStatus= this.offerData?.status;
              this.multiApprovals = [
                { name: 'review', api_url: `/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-instances?workflow_action=REVIEW${this.version?('-V-'+this.version):''}`, status: this.jobStatus.PENDING_OFFER_REVIEW ,workflow_type:'review' , isReplaceMember: true },
                { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-instances?workflow_action=APPROVAL${this.version?('-V-'+this.version):''}`, status: this.jobStatus.PENDING_APPROVAL,workflow_type:'approval', isReplaceMember:true },
              ];
              if(this.isCounteredOffer){
                this.multiApprovals[0].status = this.jobStatus.COUNTERED_PENDING_REVIEW;
                this.multiApprovals[1].status = this.jobStatus.COUNTERED_PENDING_APPROVAL;
              }
              const isReview = (this.isCounteredOffer && this.currentProgram?.config?.offer?.counter_offer_review) ||
                                (!this.isCounteredOffer && this.currentProgram?.config?.offer?.pending_offer_review);
              if(!isReview){
                this.multiApprovals.shift();
              }
            });

          } else {
            this.jobService
            .fetchOfferForCandidateAllStatus(this.currentProgram?.id, this.currentCandidate, this.currentJobid)
            .subscribe({
              next:(res: any) =>{
                this.loading=false;
                this.currentOfferId = !!res?.offer_id ? res?.offer_id : 0;
                if(!!this.currentOfferId){
                  this.router.navigateByUrl('jobs/offers');
                }
                else{
                  this.noOffer = true;
                }
              },
              error:()=>{
                this.loading = false;
              }
            })
          }
        },
        error: (err) => { }
  });
  }

  reviewAuthority(data){
    let status = data?.status.toLowerCase();
    let offerReviewConfig = this.currentProgram?.config?.offer?.pending_offer_review;
    let counterOfferReviewConfig = this.currentProgram?.config?.offer?.counter_offer_review;
    if(status === 'pending_offer_review' && this.userType==='MSP' && offerReviewConfig && !this.offerDetailsNewUi){
      return true
    }
    else if(status === 'countered_pending_review' && this.userType==='MSP' && counterOfferReviewConfig && !this.offerDetailsNewUi){
      return true
    }
    else if(data?.is_offer_reviewer && status === 'pending_offer_review' && !this.offerDetailsNewUi){
      return true
    }
    else {
      return false;
    }
  }

  sortingOfferRates(rates = []){
    let reArrangeRates = this.jobService?.rearrangeRates(rates);
    let sortingByBillable = reArrangeRates.sort((a, b) => (a.billable === b.billable) ? 0 : (a.billable ? -1 : 1));
    return sortingByBillable;
  }

  getTimesheetManagers(timesheet_manager){
    let timesheetManagers = timesheet_manager;
    this.displayFirstTimesheetManager = timesheetManagers.splice(0,1);
    this.displayFirstTimesheetManagerName =
    this.displayFirstTimesheetManager && this.displayFirstTimesheetManager.length > 0
      ? this.displayFirstTimesheetManager.map((u) => u.full_name).join(',')
      : '';
    this.remainingTimesheetManagers = timesheetManagers;
  }

  getExpenseManagers(expense_manager){
    let expenseManagers = expense_manager;
    this.displayFirstExpenseManager = expenseManagers?.splice(0,1);
    this.displayFirstExpenseManagerName =
    this.displayFirstExpenseManager && this.displayFirstExpenseManager.length > 0
      ? this.displayFirstExpenseManager.map((u) => u.full_name).join(',')
      : '';
    this.remainingExpenseManagers = expenseManagers;
  }

  checkUserApproval() {
    const workflow_action = ((this.offerData?.status?.toLowerCase() == this.jobsStatus.PENDING_OFFER_REVIEW)||
      (this.offerData?.status?.toLowerCase() == this.jobsStatus.COUNTERED_PENDING_REVIEW) ? 'REVIEW' : 'APPROVAL')+
      (this.version?'-V-'+ this.version : '');
    let url= `/approval/programs/${this.currentProgram?.id}/offers/${this.currentOfferId}/approval-instances`;
    if(this.offerDetailsNewUi){
      url += `?workflow_action=${workflow_action}`
    }
    this.jobService.get(url)
      .subscribe((res: any) => {
        this.offerApprovalStatus = res.status;
        this.hasOwnApprovalPending = Boolean(res.pending_approvals);
        this.approvalCount = res.pending_approvals;
        if(this.offerDetailsNewUi){
          const approvers = res?.approvers;
          this.approvalInstance = res?.approvers;
          approvers.forEach((approver)=>{
            if(approver?.status?.toUpperCase() == 'PENDING') {
              approver?.members?.every((approverD)=>{
                if(approverD?.is_approval_allowed) {
                  this.approvalChainId = approver?.approval_chain_id;
                  if(this.offerData?.status?.toLocaleLowerCase() == JobStatus.PENDING_APPROVAL) {
                    this.isProgramAdmin = approver?.is_program_admin;
                  }
                  if(approverD?.is_reassigned_user) {
                    this.is_reassigned_user = true;
                  }
                } else {
                  approverD?.delegated_to?.every((res)=>{
                    if(res?.is_approval_allowed) {
                      this.approvalChainId = approver?.approval_chain_id;
                      this.isDelegatedWorkflowMember = true;
                      this.approverId = approverD?.id;
                      if(this.offerData?.status?.toLocaleLowerCase() == JobStatus.PENDING_APPROVAL) {
                        this.isProgramAdmin = approver?.is_program_admin;
                      }
                      return false;
                    }
                    return true;
                  })
                }
                if(this.approvalChainId) {
                  return false;
                } else {
                  return true;
                }
              })
            }
          });
        }
      })
  }
  createoffer(event) {
    if (this.isopencreateOffer) {
      this.createOfferOpen();
    } else {
      this.router.navigate([
        `jobs/details/job-details/${this.currentJobid}/submitted-candidate`,
      ]);
    }
  }
  createOfferOpen() {
    this.offerCreate = true;
    this.offerPageMode = "create";
    this.fetchCandidateDetails();
  }

  fetchCandidateDetails() {
    this.offerCreate = true;
    this.jobService
      .fetchCurrentSubmitCandidate(this.currentCandidate, this.currentJobid)
      .subscribe((res) => {
        this.candidateDetails = res;
        this.isopen = true;
        if( ((this.candidateDetails?.candidate?.status === 'REJECTED' || this.candidateDetails?.candidate?.status === 'WITHDRAWN' || this.candidateDetails?.candidate?.status === 'PENDING_SHORTLIST')  && !this.candidateDetails?.candidate.offer_id)){
          this.noData = true;
        }
      });
  }

  clickToAcceptOffer() {
    const payload = {
      id: this.offerData?.id,
      isopen: true,
      jobId: this.currentJobid,
      taxData: this.offerData?.taxes,

    };
    this.eventStreamService.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER, payload)
    );

  }

  clickToRejectOffer() {
    this.eventStreamService.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER, {
        id: this.offerData.id,
        isopen: true,
        jobId: this.currentJobid,
      })
    );
  }
  clickToRejectCandidate() {
    this.eventStreamService.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_CANDIDATE_REJECTION, {
        id: this.offerData.id,
        isopen: true,
        jobId: this.currentJobid,
        candidateId: this.currentCandidate
      })
    );
  }
  clickToCounterOffer() {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.currentJobid}/candidate/${this.currentCandidate}/offers?offerId=${this.offerData.id}&counterOffer=true`
    );
  }

  clickToEditOffer() {
    this.offerEdit = true;
    this.offerPageMode = "edit";
    this.fetchCandidateDetails();
  }

  resetOfferMode(e){
    if(e){
      this.offerEdit = false;
      this.offerPageMode = "";
      this.fetchOfferByCandidateJobSubject$.next(null);
      if(this.offerDetailsNewUi){
        this.refreshWorkflowData();
      }
    }
  }

  getCustomFields() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const hierarchyIds = this.job?.hierarchy.map(h => h.id).join(',');
    let url = `/configurator/programs/${currentProgram?.id}/custom-fields?entity_ref=OFFERS&active=1&order_by=asc&key=ref_order${
      hierarchyIds ? `&hierarchy_ids=${hierarchyIds}` : ``
    }`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data.custom_fields;
          this.updateCustomFieldName();
        }
      },
    });
  }

  convertCustomFieldToArray() {
    if (this.offerData.custom_fields) {
      const customFields = Object.entries(this.offerData.custom_fields)?.map((e) => ({ slug: e[0], value: e[1] }));
      this.offerData.custom_fields = customFields;
    }
  }
  updateCustomFieldName() {
    if (this.customFields && this.customFields.length > 0 && this.offerData?.custom_fields && this.offerData?.custom_fields?.length > 0)
      this.customFields?.forEach(c => {
        this.offerData?.custom_fields.forEach(jc => {
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
              (Array.isArray(jc?.value) ? jc?.value : [jc?.value]).forEach((res)=>{
                c?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                  if(res == custom_field_data?.value) {
                    val.push(custom_field_data?.label);
                  }
                })
              });
              jc.value = val;
            }
            if(c?.type == 'SOURCE' && jc.value) {
              this.loader.show();
              let url = c.api_url
              url = url.includes('?') ? url += `&user_ids=${jc.value}` : url += `&user_ids=${jc.value}`
              this.jobService.get(url).subscribe({
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

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  get isUserVendor() {
    return this.userPermissionService.currentUserRole();
  }

  getProgramDetails() {
    let url = `/configurator/programs/${this.currentProgram?.id}`
    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data && data?.program) {
        let programDetails = data.program;

        this.isBillDriven = programDetails?.config?.billing?.consolidated_billing;
      }
    },
    error: error => {
    }});
  }

  get hideCreateOffer(){
    return (
      this.authorizationService.authorize('create_offer') ? true : false
    )
  }

  hideCreateOfferForm(){
      if(this.hideCreateOffer){
        this.showCreateOffer = true;
        this.noData = false;
      }
      else{
        this.showCreateOffer = false;
        this.noData = true;
      }

  }

  setFoundationCustomFieldsDetails = (): void => {
    this.foundationCustomFieldsList = [];
    if (this.offerData.foundational_data && this.offerData.foundational_data.length > 0) {
      this.offerData.foundational_data.forEach(fdType => {
        if (fdType?.foundation_data?.length > 0) {
          const customFields = [];
          fdType?.foundation_data?.forEach(fd => {
            if (fd?.custom_fields?.length > 0) {
              customFields.push({
                label: fd?.name,
                customFields: fd.custom_fields,
              });
            }
          });
          if (customFields.length) {
            this.foundationCustomFieldsList.push({
              label: `${fdType?.name} dependent Custom Fields`,
              foundationalData: customFields,
            });
          }
        }
      });
    }
  };

  acceptOfferPermission(org_type, status){
    if(!org_type) return true;
    if((this.userType !== 'SUPER_ORG' && this.userType == org_type) || (status?.toUpperCase() == 'REJECTED' || status?.toUpperCase() == 'ACCEPTED'))
      return true;
    else if(status?.toUpperCase() == 'RELEASED'){
      if(this.userType === 'VENDOR')
        return false;
    }
    return true;
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  clickToApproveOfferReview() {
    const payload = {
      status: 'RELEASED',
    };
    this.isReviewBtnDisable=true;
    this.subscriptions.push(this.jobService.updateReleasedOffer(payload, this.currentJobid, this.currentCandidate,this.offerData?.id).subscribe({
      next: (data: any) => {
        this.isReviewBtnDisable = false;
        this.fetchOfferByCandidateJobSubject$.next(null);
        this.eventStreamService.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
        this.alert.success('Offer reviewed successfully');
      },
      error: (err) => {
        this.showError(err);
        this.isReviewBtnDisable= false;
      }
  }));
  }

  checkIfArray(arr){
    return Array.isArray(arr) ? true : false;
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  clickToCancelOffer(status){
    status = this.getStatusChange(status).toLowerCase();
    if(status == 'countered pending review'){
      this.eventStreamService.emit(
        new EmitEvent(Events.COUNTERED_REVIEW_OFFER, {
          id: this.offerData?.id,
          isopen: true,
          jobId: this.currentJobid,
        })
      );
    }
    else if(status == 'pending review') {
      this.eventStreamService.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_REVIEW_OFFER, {
          id: this.offerData?.id,
          isopen: true,
          jobId: this.currentJobid,
        })
      );
    }

  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  removeSymbol(value) {
    return value?.slice(1);
  }

  openApprovalPanel(status, isAdminOveride?, approvalSequence?) {
    if(isAdminOveride) {
      this.approvalFor = status;
      this.approvalNote = "visible";
      this.superAdminEdit = true;
      this.adminApprovalMode = approvalSequence;
    } else {
      this.approvalFor = status;
      this.approvalNote = "visible";
    }
    this.approvalPanelTitle= status==='approved' ? 'offer_approval': 'offer_approval_rejection';
    if(this.offerData?.status.toLowerCase() === this.jobStatus.COUNTERED_PENDING_APPROVAL){
    this.approvalPanelTitle= 'counter_'+ this.approvalPanelTitle;
    }
    if(this.offerData?.status.toLowerCase() ===this.jobStatus.PENDING_OFFER_REVIEW ||
    this.offerData?.status.toLowerCase() ===this.jobStatus.COUNTERED_PENDING_REVIEW){
      this.approvalPanelTitle = 'offer_review';
    }
  }
  onSidePanelClose() {
    this.approvalNote = "hidden";
    this.approvalFor = null;
  }

  detailCollapse(value){
    this.detailedValue = value;
  }
  tabClick(tabName: string) {
    this.currentTab = tabName;
    const url = this.router?.createUrlTree([], {
      relativeTo: this.route, 
      queryParams: {tab: tabName},
      queryParamsHandling: 'merge'
    })?.toString();
    this.location?.go(url);
  }
  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  hideRateDetails(data) {
    this.rateDetailsVisible = false;
  }

  get showPayRate(){
    if(this.programRateModel === 'BILL_RATE'){
      return false;
    }
    else{
      return true;
    }
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
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
    if (this.offerData?.stages[0]?.rates?.length) {
      const stRates = this.offerData?.stages[0]?.rates?.find(rate => rate?.abbreviation?.toLowerCase() === 'st');
      return {
        billrate: stRates?.bill_rate,
        payrate: stRates?.pay_rate,
        vendor_rate: stRates?.vendor_bill_rate,
        markup: stRates?.markup,
        cost_component: stRates?.cost_component
      }
    }
  }

  get rateDetailsRateArray(){
    if (this.offerData?.stages[0]?.rates?.length) {
      return this.offerData?.stages[0]?.rates?.filter(obj => obj?.abbreviation?.toLowerCase() != 'st')
      .map(({ bill_rate, vendor_bill_rate, pay_rate, ...rest }) => ({
        billrate: bill_rate,
        vendor_rate: vendor_bill_rate,
        payrate: pay_rate,
        ...rest
      }));
    }
  }

  reviewClicked(){
    this.offerPageMode='review';
    this.showCreateOffer=true;
    this.offerEdit=true
  }

  setStatusMessage() {
    if(this.offerData?.status?.toLowerCase() == this.jobsStatus.REJECTED && this.offerDetailsNewUi) {
      this.isAlertBoxShown = true;
      this.statusMessageData = {
        status: this.offerData?.status,
        approve_reject_by: ((this.offerData?.modified_by?.first_name || '') + " " + (this.offerData?.modified_by?.middle_name?.length > 0 ? this.offerData?.modified_by?.middle_name + ' ' : '') + (this.offerData?.modified_by?.last_name || '')).trim(),
        updated_by: this.offerData?.modified_by ? {name:((this.offerData?.modified_by?.first_name || '') + " " + (this.offerData?.modified_by?.middle_name?.length > 0 ? this.offerData?.modified_by?.middle_name + ' ': '') + (this.offerData?.modified_by?.last_name || '')).trim()} : {},
        date: this.offerData?.modified_on,
        reason: this.offerData?.status_reason,
        notes: this.offerData?.status_note
      }
    }
    else{
      this.isAlertBoxShown = false;
    }
  }

  refreshWorkflowData(){
    this.approvalInstance=null;
    this.approvalChainId=null;
    this.checkUserApproval();
  }

  getAssignmentConfig(){
    this.loader.show();
    this.candidateService.getAssignmentConfig(this.currentProgram?.id).subscribe({
      next:(data:any)=>{
        if(data){
          this.allowAssignmentOverlap = data?.config?.overlapping_assignments?.is_allow;
        }
        this.loader.hide();
      },
      error:(err)=>{
        this.showError(err);
        this.loader.hide();
      }
    })
  }

  checkOverlap(){
    if(this.allowAssignmentOverlap){
      this.clickToAcceptOffer();
    }
    else{
      //Check overlapping assignments if setting is disabled
      this.loader.show();
      this.candidateService.getOverlappingAssignment(
        this.currentProgram?.id,
        this.currentCandidate,
        this.offerData?.stages[0]?.start_date,
        this.offerData?.stages[0]?.end_date,
        'MM/DD/YYYY'
      ).then((data:any)=>{
        this.loader.hide();
        if(data?.is_assignment_allow){
          this.clickToAcceptOffer();
        }
        else{
          this.showOverlapWarning=true;
          this.overlapAssignmentData = data?.details || [];
        }
      })
    }

  }
}
