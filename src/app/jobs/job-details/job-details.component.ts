import { Component, OnInit, Output, EventEmitter, HostListener, ViewChild, Renderer2, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../job-details/job-details.service';
import { JobService } from '../job.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { AssignmentService } from 'src/app/assignment/assignment.service';
import { AccessType, JobStatus, StatusMessageTypes, UsersType } from 'src/app/shared/enums';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { Observable } from 'rxjs/internal/Observable';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { statusEnum } from 'src/app/multi-approvals/components/multi-workflow/multi-workflow.component';

@Component({
  selector: 'app-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
})
export class JobDetailsComponent implements OnInit, OnDestroy {
  state$: Observable<object>;
  public jobsStatus: any = JobStatus;
  toggleContent = false;
  actionVisibility = false;
  jobDetails = true;
  availableCandidate = false;
  submittedCandidate = false;
  interviews = false;
  offers = false;
  assignment = false;
  approval = false;
  history = false;
  fixedHeader = false;
  lastScrollTop = 0;
  public param = '';
  jobData: any;
  currentJobId = '';
  isOptOutText: string = 'opt_in';
  isOptOut = true;
  dataLoader = true;
  vendorId;
  currentProgram: any = {};
  userType: any;
  tableLoaded = false;
  dataLoading = true;
  searchTerm: any;
  filter: any = {};
  jobStatus;
  userApproval: any;
  isShowStatus = false;
  closeSidebar: boolean = false;
  approvalWorkflow: any;
  loggedUserType: any = UsersType;
  public months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  @ViewChild('actionButton', { read: ElementRef, static: false })
  actionButton: ElementRef;
  @ViewChild('actionDropdown', { read: ElementRef, static: false })
  actionDropdown: ElementRef;
  @ViewChild('jobBreadcumDropdownTrigger', {read: ElementRef, static: false})
  jobBreadcumDropdownTrigger : ElementRef;
  @ViewChild('jobBreadcumDropdownTriggerMobileOnly', {read: ElementRef, static: false})
  jobBreadcumDropdownTriggerMobileOnly : ElementRef;
  activeTab = '';
  tabs = ['available', 'submitted-candidate', 'interviews', 'offers', 'assignment', 'distribution', 'approval', 'history','workflow'];
  templateId: any;
  availableCanCount: any;
  programId: any;
  submittedCanCount: any;
  interviewCount: any;
  offerCount: any;
  assignmentCount: any;
  action: string;
  // isLoggedInUserApprover: boolean = false;
  userId: any;
  disableAction: boolean = true;
  logs: Log= undefined;
  baseURL:any;
  metaTooltip: boolean = false;
  isOptInOptOutPending: boolean = false;
  userBelongToJobModule: boolean = false;
  statusMessageData: any;
  public readonly StatusMessageTypes = StatusMessageTypes;
  isAlertBoxShown: boolean = false;
  public support_text: any = { };
  @Output() jobApprovalVersion = new EventEmitter();
  newWorkFlow:boolean = false;
  public approvalNote = 'hidden';
  approvalFor;
  approvalChainId;
  showWorkflowBtns = true;
  isProgramAdmin = false;
  approvalOption: boolean = false;
  superAdminEdit = false;
  adminApprovalMode = 'sequence';
  isJobReview;
  isDelegatedWorkflowMember: boolean = false;
  approverId = '';
  is_reassigned_user:boolean = false;
  componentInstance;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public JobDetailsService: JobDetailsService,
    private alert: AlertService,
    private render: Renderer2,
    private _storageService: StorageService,
    private eventStream: EventStreamService,
    public jobService: JobService,
    private loader: LoaderService,
    private datePipe: LocalDateFormatPipe,
    private userPermissionService: UserPermissionService,
    public assignmentService: AssignmentService,
    private localDateTimeFormatPipe: LocalDateTimeFormatPipe,
    private _confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService
  ) {
    const urlSeg = this.router.url.split('?')[0].split('/').pop();
    this.activeTab = this.tabs.includes(urlSeg) ? urlSeg : 'detail';
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.actionButton && this.actionButton.nativeElement.contains(e.target) && !this.actionVisibility) ||
        (this.actionDropdown && this.actionDropdown.nativeElement.contains(e.target))
      ) {
        this.actionVisibility = true;
      } else if(this.jobBreadcumDropdownTrigger && this.jobBreadcumDropdownTrigger.nativeElement.contains(e.target)) {
        if(this.hasApprovalOverridePermission) {
            this.approvalOption = true;
          } else {
            this.openApprovalPanel('approved');
          }
      } else if(this.jobBreadcumDropdownTriggerMobileOnly && this.jobBreadcumDropdownTriggerMobileOnly.nativeElement.contains(e.target)){
        if (this.hasApprovalOverridePermission) {
            this.approvalOption = true;
          } else {
            this.openApprovalPanel('approved');
          }
      } else {
        this.actionVisibility = false;
        this.approvalOption = false;
      }
    });
  }

  subscriptions = [];
  ngOnInit(): void {
    const jobid = this.route.snapshot.params['id'];
    this.programId = this._storageService.get('PROGRAM_ID');
    this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.newWorkFlow = this.currentProgram?.config?.modules_using_flow_system?.includes('JOBS');
    this.baseURL = '/submission-manager';
    this.userType = this._storageService.get('user_type');
    this.userId = this._storageService.get('user')?.id;
    this.param = jobid;
    this.currentJobId = jobid;
    this.init();
    this.subscriptions.push(this.JobDetailsService.updateJobDetails$.subscribe((reload:boolean) => {
      if(reload){
        this.getJobDetails(true);
      }
    }));
    this.JobDetailsService.countsUpdated$.subscribe(counts => {
      if (counts && this.jobData) {
        this.jobData.counts = counts;
      }
    });

    this.subscriptions?.push(this.eventStream.on(Events.UPDATE_COUNT).subscribe(data => {
      if (data) {
        this.getCounts();
      }
    }));

    this.isJobReview = this._storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.pending_job_review;
    this.eventStream.on(Events.JOB_TAB_CHANGE).subscribe({
      next:(tabName:string)=>{
        if(this.tabs.includes(tabName)){
          this.changeActiveTab(tabName);
        }
      }
    })
  }

  init() {
    this.getJobDetails();
    this.getSupportingText();
    // this.checkUserApproval();
    // this.getJobApproval();
    // this.getAvailableCanCount();
    // this.getSubmittedCanCount();
    // this.getInterviewsCount();
    // this.getOfferCount();
    // this.getAssignmentCount();
    this.getCounts()
  }

  getCounts() {
    const url = `/job-manager/programs/${this.programId}/jobs/${this.currentJobId}/count`
    this.jobService.get(url).subscribe((data)=>{
      this.availableCanCount = data?.[0]?.count;
      this.submittedCanCount = data?.[1]?.count;
      this.interviewCount = data?.[2]?.count;
      this.offerCount = data?.[3]?.count;
      this.assignmentCount = data?.[4]?.count;
    })
  }

  @HostListener('window:scroll', ['$event']) onScrollEvent($event) {
    const st = window.pageYOffset;
    if (st > this.lastScrollTop) {
      if (st > 40) {
        this.fixedHeader = true;
      }
    } else if (40 < st && st < this.lastScrollTop) {
      this.fixedHeader = true;
    } else if (st <= 40) {
      this.fixedHeader = false;
    }
    this.lastScrollTop = st;
  }

  toggleSection() {
    this.toggleContent = !this.toggleContent;
  }

  optOut(event, optBtnType?: string) {
    if(this.isOptInOptOutPending && optBtnType) {
      if(optBtnType == "opt_out") {
        this.eventStream.emit(new EmitEvent(Events.OPT_OUT_REASON, { value: true, jobId: this.currentJobId }));
      } else {
        this.onClickoptOutJob({
          opt_option: 'opt_in',
        },true);
      }
      return;
    }
    if (event && this.isOptOutText != 'opt_out') {
      this.eventStream.emit(new EmitEvent(Events.OPT_OUT_REASON, { value: true, jobId: this.currentJobId }));
    } else {
      this.onClickoptOutJob({
        opt_option: 'opt_in',
      });
    }
  }
  onClickrejectAndCloseJob(e) {
    if (e) {
      setTimeout(() => {
        this.getUpdatedJobData();
      }, 500);
    }
  }

  onClickoptOutJob(event,isOptIn?) {
    let payload = event;
    let user = this._storageService.get('user');
    let vendor_id = user?.id;
    this.logs = undefined;
    this.closeSidebar = false;
    // this.isOptOutText = event.opt_option;
    this.JobDetailsService.optInOutJob(payload, this.currentJobId, vendor_id).subscribe({
      next: (data: any) => {
        if (data) {
          let optInOutJobText;
          if(this.isOptInOptOutPending) {
            this.isOptOutText = !isOptIn ? "opt_in" : "opt_out";
          }
          if (this.isOptOutText == 'opt_out') {
            this.isOptOutText = 'opt_in';
            optInOutJobText = 'Opted-In';
            this.isOptOut = true;
          } else {
            this.isOptOutText = 'opt_out';
            optInOutJobText = 'Opted-Out';
            this.isOptOut = true;
          }
          this.alert.success(`${optInOutJobText} successfully.`);
          this.isOptInOptOutPending = false;
          this.closeSidebar = true;
          this.getJobDetails(true);
        }
      },
      error: (err) => {
        // this.alert.error(errorHandler(err));
      let log = this.showError(err , true);
      this.emitLogs(log)
      },
  });
  }
  jobOptionListClicked(event) {
    const key = event;
    this.logs=undefined;
    switch (key) {
      case 'hold':
        this.updateJobStatus(key);
        break;
      case 'halt-submission':
        this.updateJobStatus('halted');
        break;
      case 'release':
        this.updateJobStatus(key);
        break;
      case 'distribute':
        if (this.jobData && this.jobData?.id) {
          this.router.navigate(['/jobs/details/job-details', this.jobData.id, 'distribution']);
        }
        break;
      case 'approve':
        if (this.jobData && this.jobData?.id) {
          this.router.navigate(['/jobs/details/job-details', this.jobData.id, 'approval']);
        }
        break;
      case 'reject':
        if (this.jobData && this.jobData?.id) {
          this.router.navigate(['/jobs/details/job-details', this.jobData.id, 'approval']);
        }
        break;
      case 'reDistribute':
        if (this.jobData && this.jobData?.id) {
          this.router.navigate(['/jobs/details/job-details', this.jobData.id, 'distribution']);
        }
        break;
      case 'close':
        if (this.jobData && this.jobData?.id) {
          this.action = 'close';
        }
        break;
      case 'editAndReview':
        this.onReviewClick();
        break;
      default:
        break;
    }
  }

  onReviewClick(): void {
    this.loader.show();
    const foundational_data = [];
    this.jobData?.foundational_data?.forEach(e => {
      e.foundation_data.forEach(a => {
        foundational_data.push({
          foundation_data_type_id: e.id,
          foundation_data_id: a.id,
        });
      });
    });
    const Payload = {
      'approval_chain_id': this.newWorkFlow ? this.approvalChainId : "",
      'inactive_member_flag': false,
      'is_forced_approval': false,
      'status': "APPROVED",
    };
    if(this.newWorkFlow) {
      Payload['workflow_action'] = 'REVIEW' + (this.jobData?.version > 0 ? '-V-'+ this.jobData?.version : '');
    }
    if(this.isDelegatedWorkflowMember) {
      Payload['is_delegated_approval'] = true;
      Payload['approver_id'] = this.approverId;
    }
    if(this.is_reassigned_user) {
      Payload['is_reassigned_user'] = true;
    }
    this.jobService.put(`/approval/programs/${this.programId}/jobs/${this.currentJobId}/approval-request`, Payload).subscribe({
      next: (data: any) => {
        if (data?.approval_instance) {
          this.alert.success('Job is Reviewed!');
          const account = this._storageService.get(StorageKeys?.CURRENT_ACCOUNT);
          const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
          const isUserJobManager = (this.jobData?.job_manager_id == account?.id);
          if(!isUserJobManager && this.userType?.toUpperCase() == UsersType.CLIENT?.toUpperCase()  && accessType?.toUpperCase() != AccessType.ALL?.toUpperCase()) {
            this.router.navigate(['/jobs/list/all']);
            this.loader.hide();
          } else {
            this.router.navigateByUrl(`/jobs/details/job-details/${this.param}`);
            setTimeout(() => {
              this.loader.hide();
              window.location.reload();
            }, 300);
          }
        }
      },
      error: (error) => {
        this.showError(error);
        this.loader.hide();
      },
  });
  }

  closeAction(event) {
    this.action = event;
  }

  EditClicked(event, jobData, isApprovedJob?) {
    if (isApprovedJob) {
      this.router.navigate(['/jobs/create/' + jobData.id + '/' + jobData.template + '/' + 'editApprovedJob']);
    } else {
      this.router.navigate(['/jobs/create/' + jobData.id + '/' + jobData.template + '/' + (this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_REVIEW ? 'edit_review' :'isedit')]);
    }
  }

  CloneJobClicked(event, jobData) {
    this.loader.show();
    this.jobService.get(`/job-manager/programs/${this.currentProgram.id}/job-templates?id=${jobData.template}`).subscribe({
      next: (data: any) => {
        if (data.job_templates && data.job_templates.length > 0 && data.job_templates[0].is_enabled) {
          this.router.navigate(['/jobs/create/' + jobData.id + '/' + jobData.template + '/' + 'clonejob']);
        } else {
          this.jobData.disableClone = true;
          this.showError(
            data?.job_templates[0]?.template_name
              ? `${data?.job_templates[0]?.template_name} is In-active`
              : `The current template doesn't exist!\nPlease try cloning other jobs or contact the administrator for the same.`,
          );
        }
        this.loader.hide();
      },
     error: (err) => {
        this.showError(err);
        this.loader.hide();
      },
  });
  }
  optionClicked(jobData) {
    if (jobData) {
      if (
        (this.userType === 'VENDOR' || this.userType === 'SUPER_ORG') &&
        (jobData?.status === 'hold' || jobData?.status === 'halted' || jobData?.status === 'rejected')
      ) {
        this.alert.error('Submissions are not allowed for the job');
        return;
      } else {
        this.router.navigate(['/candidates/create'], {
          queryParams: { job: this.currentJobId, submit: true, returnUrl: encodeURIComponent(this.router.url) },
        });
      }
    }
  }
  getJobDisplayStatus(job_status: string) {
    let jobStatus = job_status;
    switch (job_status) {
      case 'PENDING_APPROVAL':
        jobStatus = 'Pending Approval';
        break;
      case 'RELEASE_JOB':
        jobStatus = 'Release job';
        break;
      case 'PENDING_APPROVAL_SOURCING':
        jobStatus = 'Pending approval sourcing';
        break;
      case 'SOURCING':
        jobStatus = 'Sourcing';
        break;
      case 'PENDING_APPROVAL_HALTED':
        jobStatus = 'Halted';
        break;
      case 'HALTED':
        jobStatus = 'Halted';
        break;
      case 'PENDING_APPROVAL_HOLD':
        jobStatus = 'Hold';
        break;
      case 'PENDING_DISTRIBUTION':
        jobStatus = 'Pending Distribution';
        break;
      case 'PENDING_REVIEW':
        jobStatus = 'Pending Review';
        break;
      case 'CLOSED':
        jobStatus = 'Closed';
        break;
      case 'HOLD':
        jobStatus = 'Hold';
        break;
      case 'DRAFT':
        jobStatus = 'Draft';
        break;
      case 'FILLED':
        jobStatus = 'Filled';
        break;
      case 'OPEN':
        jobStatus = 'Open';
        break;
      case 'REJECTED':
        jobStatus = 'Rejected';
        break;
    }
    return jobStatus;
  }

  getPendingApprovalStatus() {
    return true;
  }

  submitCandidate() {
    this.router.navigate(['/jobs/details/job-details', this.currentJobId, 'available'], {
      queryParams: { templateId: this.jobData?.template, jobStatus: this.jobData.status.toLowerCase() },
    });

    // this.actionVisibility = false;
    // this.router.navigate(['/candidates/submit'], {
    //   queryParams: {
    //     candidateSubmission: true,
    //     jobId: this.currentJobId,
    //     type: 'submit',
    //     candidateId: '22eeb6be-58c2-478b-845f-3dd0fd5bc1cc',
    //   },
    // });
  }
  addSubmitCandidate() {
    this.router.navigate(['/candidates/create'], {
      queryParams: { job: this.currentJobId, submit: true, returnUrl: encodeURIComponent(this.router.url) },
    });
  }

  addSubmission() {
    this.router.navigate(['/candidates/create'], {
      queryParams: { job: this.currentJobId, submit: 'true', returnUrl: encodeURIComponent(this.router.url) },
    });
  }

  getVendorStatus(status) {
    const jobStatus = [
      { name: 'Pending Approval', value: 'pending_approval' },
      {
        name: 'Pending Approval - Sourcing',
        value: 'Pending Approval - Sourcing',
      },
      { name: 'Open', value: 'Open (Approved)' },
      { name: 'Sourcing', value: 'Sourcing' },
      { name: 'Filled', value: 'Filled' },
      { name: 'Closed', value: 'Closed' },
      { name: 'Hold', value: 'Hold' },
    ];
    const isPresent = jobStatus.some(s => s?.value.toLocaleLowerCase() === status?.toLowerCase());
    if (isPresent) {
      let job_status = jobStatus.find(s => s?.value === status);
      if (job_status) {
        return job_status?.name;
      } else {
        return '-';
      }
    } else {
      return '-';
    }
  }

  checkCandidateModulePermissions() {
    return true;
  }

  get checkAvailableCandidateRole() {
    let accountDetails = this._storageService.get('account');
    if (
      accountDetails?.role?.organization_category?.toLowerCase() == 'vendor' ||
      accountDetails?.role?.organization_category?.toLowerCase() == 'super_org'
    ) {
      return true;
    } else {
      return false;
    }
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  getFormattedTime(date) {
    if (date) {
      date = date.split(' ');
      let formattedTime = '';
      if (date?.length > 1) {
        var onlyTime = date[1];
        var time = onlyTime?.split(':');
        if (time?.length > 1) {
          var allTime = time[0]?.concat(':', ...time[1]);
          formattedTime = allTime;
        }
      }
      return formattedTime;
    }
  }
  getDateTime(d) {
    let t = new Date(d * 1000).toISOString();
    return this.localDateTimeFormatPipe.transform(`${t}`);
  }

  getJobDetails(reload?:boolean, burstCache?:boolean) {
    this.jobData = {};
    //data to be taken from resolver(via route) on load and to take from api when
    if(!reload) {
    this.route?.data.subscribe({
      next: (data: any) => {
        if(data?.jobResolvedData){
          if(data.jobResolvedData.is_error) {
            this.alert.error(errorHandler(data?.jobResolvedData?.error));
          } else {
            this.patchJobData(data?.jobResolvedData);
            this.getJobStatus();
          }
        }
      },
      error: (err) => {
        this.alert.error(errorHandler(err));
      },
  });
  } else {
    this.JobDetailsService.getJobs(`${this.currentJobId}`, burstCache).subscribe({
      next: (data) => {
        this.patchJobData(data);
      },
      error: (err: any) => {
        this.alert.error(errorHandler(err));
      }
    })
  }
  }

  getJobStatus() {
    setTimeout(() => {
      const url = `/job-manager/programs/${this.programId}/jobs/${this.currentJobId}/status`;
      this.jobService.get(url).subscribe(
        {
          next: (res: any) => {
            this.jobData.status = res?.status;
            this.jobData.version= res?.version;
            this.checkUserApproval();
            this.eventStream.emit(new EmitEvent(Events.UPDATE_JOB_STATUS, this.jobData.status));
            this.eventStream.emit(new EmitEvent(Events.UPDATE_JOB_VERSION, { version: this.jobData?.version, status: this.jobData?.status }));
          },
          error: (err) => {
            this.alert.error(errorHandler(err));
          }
        }
      );
    }, 3000);
  }

  patchJobData(data) {
    if (data) {
      this.jobData = data?.job;
      if (this.jobData?.version >= 0) {
        this.eventStream.emit(new EmitEvent(Events.UPDATE_JOB_VERSION, {version: this.jobData?.version, status: this.jobData?.status}));
      }
      this.checkUserApproval();
      this.userBelongToJobModule = this.jobData?.is_belongs_to_job_module || !this.accessControlService.accessControl();
      if (this.userType?.toUpperCase() == UsersType.VENDOR) {
        this.userBelongToJobModule = true;
      }
      this.jobData.status = this.jobData?.status?.toLowerCase() === 'halt' ? 'HALTED' : this.jobData.status;
      this.checkRoutePermission();
      this.eventStream.emit(new EmitEvent(Events.JOB_OPT_OPTIONS, (this.jobData?.opt_option === 'opt_out' || this.jobData?.opt_option === 'pending_opt_action') ? false : true));
      this.templateId = this.jobData?.template;
      if (this.jobData?.opt_option) {
        if (this.jobData?.opt_option === 'no_response' || this.jobData?.opt_option === 'opt_in') {
          this.isOptOutText = 'opt_in';
        } else {
          this.isOptOutText = this.jobData?.opt_option;
        }
        this.isOptInOptOutPending = this.isOptOutText?.toLowerCase() == "pending_opt_action";
      }
      this.jobStatus = this.jobData?.status?.toLowerCase();
      this.setStatusMessage();
      this._storageService.set('viewd_job', this.jobData, true);
      this.dataLoader = false;
      this.disableAction = false;
    }
  }

  getSupportingText() {
    const performedBy =
      this.userType?.toUpperCase() !== UsersType.SUPER_ORG ? this.userType?.toUpperCase() : `${UsersType.CLIENT},${UsersType.MSP}`;
    this.jobService
      .get(
        `/configurator/programs/${
          this.currentProgram?.id
        }/support/support_text?event_slug=view_job&performed_by=${performedBy}`,
      )
      .subscribe({
        next: (data: any) => {
          data.support_text_data
            .find(support => support.event.slug === 'view_job')
            ?.supp_text_actions?.forEach(support => {
              if (support?.description && support?.is_enabled) {
                const slug = support.default_support_text.default_actions.slug;
                this.support_text[slug] = {
                  id: slug,
                  support_text: support?.description,
                  button_text: support?.label,
                  link: support?.url,
                };
              }
            });
        },
        error: err => {
          this.alert.error(errorHandler(err));
        },
      });
  }

  setStatusMessage() {
    if(this.jobStatus?.toLowerCase() == this.jobsStatus.REJECTED || this.jobStatus?.toLowerCase() == this.jobsStatus.CLOSED) {
      this.isAlertBoxShown = true;
      this.statusMessageData = {
        status: this.jobStatus,
        approve_reject_by: this.jobData?.modified_by?.first_name + " " + (this.jobData?.modified_by?.middle_name?.length > 0 ? this.jobData?.modified_by?.middle_name +" " : '') + this.jobData?.modified_by?.last_name,
        updated_by: this.jobData?.modified_by ? {name:this.jobData?.modified_by?.first_name + " " + (this.jobData?.modified_by?.middle_name?.length > 0 ? this.jobData?.modified_by?.middle_name + ' ' : '') + this.jobData?.modified_by?.last_name} : {},
        date: this.jobData?.modified_on_timestamp,
        reason: this.jobData?.status_reason,
        notes: this.jobStatus?.toLowerCase() == this.jobsStatus.CLOSED ? this.jobData?.closed_notes : this.jobData?.status_note,
      }
    }
  }

  checkRoutePermission() {
    if (this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_APPROVAL && this.activeTab == 'distribution') {
      this.router.navigateByUrl(this.router.url.split('/').slice(0, 5).join('/'));
    }
  }

  getActiveClass(status) {
    if (status?.toLowerCase()?.indexOf(this.jobsStatus.PENDING_APPROVAL_SOURCING?.toLowerCase()) > -1) {
      status = 'pending-approval-sourcing';
    } else if (status?.toLowerCase() === this.jobsStatus.OPEN?.toLowerCase()) {
      status = 'open';
    } else if (status?.toLowerCase() === this.jobsStatus.DEFAULT?.toLowerCase()) {
      status = 'default';
    } else if (status?.toLowerCase() === this.jobsStatus.PENDING_APPROVAL?.toLowerCase()) {
      status = 'pending-approval';
    } else if (
      status?.toLowerCase() === this.jobsStatus.CLOSED?.toLowerCase() ||
      status?.toLowerCase() === this.jobsStatus.FILLED?.toLowerCase()
    ) {
      status = 'closed';
    } else if (status?.toLowerCase() === this.jobsStatus.HOLD?.toLowerCase()) {
      status = 'hold';
    } else if (status?.toLowerCase() === this.jobsStatus.REJECTED?.toLowerCase()) {
      status = 'rejected';
    } else if (status?.toLowerCase() === this.jobsStatus.SOURCING?.toLowerCase()) {
      status = 'sourcing';
    } else if (status?.toLowerCase() === this.jobsStatus.HALTED?.toLowerCase()) {
      status = 'halted';
    } else if (status?.toLowerCase() === this.jobsStatus.PENDING_REVIEW?.toLowerCase()) {
      status = 'pending-review';
    }
    return status?.toLowerCase();
  }

  updateJobStatus(status) {
    if (this.currentJobId) {
      this.dataLoader = true;
      this.loader.show();
      let url = `/job-manager/programs/${this.currentProgram.id}/jobs/${this.jobData.id}`;
      this.jobService.put(url, { status: status }).subscribe({
        next: (data: any) => {
          this.dataLoader = false;
          this.loader.hide();
          if (data.message) {
            this.getUpdatedJobData();
            this.tableLoaded = true;
            this.jobData.status = status;
            const currentUrl = window.location.href;
            if(currentUrl.includes('available')) {
              this.router.navigate(['/jobs/details/job-details', this.currentJobId, 'available'], {
                queryParams: { templateId: this.jobData?.template, jobStatus: this.jobData.status.toLowerCase() },
              });
            }
            this.eventStream.emit(new EmitEvent(Events.UPDATE_JOB_STATUS, this.jobData.status));
          }
        },
        error: (error) => {
          this.loader.hide();
          // this._alert.error(errorHandler(error), {});
          // this._loader.hide();
          this.dataLoading = false;
          this.dataLoader = false;
        },
    });
    }
  }

  isUserRole(role: string): boolean {
    return this.userPermissionService.isUserRole(role as UserType);
  }

  getUpdatedJobData() {
    this.jobStatus = '';
    this.JobDetailsService.getUpdatedJobData(this.jobData.id,true).subscribe({
      next: (data: any) => {
        if (data?.job) {
          this.jobData = data.job;
          this.jobData.status = this.jobData?.status?.toLowerCase() === 'halt' ? 'HALTED' : this.jobData.status;
          // if (this.jobData?.opt_option) {
          //   this.isOptOutText = this.jobData?.opt_option;
          // }
          if (this.jobData?.opt_option) {
            if (this.jobData?.opt_option === 'no_response') {
              this.isOptOutText = 'opt_in';
            } else {
              this.isOptOutText = this.jobData?.opt_option;
            }
          }
          //  if(this.isOptOutText === 'opt_out') {
          //   this.isOptOut = false;
          //  }
          this._storageService.set('viewd_job', this.jobData, true);
          this.jobStatus = this.jobData?.status;
          this.isAlertBoxShown = false;
          this.setStatusMessage();
          // if (this.userType === 'VENDOR') {
          //   this.jobStatus = this.getVendorStatus(this.jobData?.status);
          // } else {
          //   if (this.jobData?.status?.toLowerCase() ==  this.jobsStatus.PENDING_APPROVAL.toLowerCase()) {
          //     this.jobStatus = 'Pending Approval';
          //   } else {
          //
          //   }
          //   this.dataLoader = false;
          // }

          this.dataLoader = false;
        }
      },
      error: (err) => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }

  getTime(time) {
    if (time) {
      time = time?.toString()?.match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
      if (time?.length > 1) {
        time = time.slice(1);
        time[5] = +time[0] < 12 ? ' AM' : ' PM';
        time[0] = +time[0] % 12 || 12;
      }
      return time.join('');
    }
  }

  openCreateOfferSidebar() {
    this.eventStream.emit(new EmitEvent(Events.JOB_DETAIL_SIDEBAR_CREATE, true));
  }

  approvalCount = 0;
  hasOwnApprovalPending = false;
  jobApprovalStatus;
  approvalInstance: any;
  checkUserApproval() {
    if(this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_REVIEW || this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_APPROVAL_SOURCING || this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_APPROVAL) {
      // approval data not required for other job statuses
    } else {
      return;
    }
    const workflow_action = this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_REVIEW ? 'REVIEW' : 'APPROVAL';
    let url = `/approval/programs/${this.programId}/jobs/${this.param}/approval-instances`;
    if (this.newWorkFlow) {
      url += `?workflow_action=${workflow_action}` + (this.jobData?.version > 0 ? '-V-'+ this.jobData?.version : '');
    }
    this.jobService.get(url).subscribe((res: any) => {
      // this.approvalList = res.approvers;
      this.jobApprovalStatus = res.status;
      this.hasOwnApprovalPending = Boolean(res.pending_approvals);
      this.approvalCount = res.pending_approvals;
      const approvers = res?.approvers;
      this.approvalInstance = res?.approvers;
      approvers.forEach((approver)=>{
        if(approver?.status?.toUpperCase() == 'PENDING') {
          approver?.members?.every((approverD)=>{
            if(approverD?.is_approval_allowed) {
              this.approvalChainId = approver?.approval_chain_id;
              if(this.jobData?.status?.toLocaleLowerCase() == JobStatus.PENDING_APPROVAL) {
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
                  if(this.jobData?.status?.toLocaleLowerCase() == JobStatus.PENDING_APPROVAL) {
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
      // if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      //   res?.approvers?.forEach(approver => {
      //     if (approver?.members.find(member => member.id === this.userId)) {
      //       this.isLoggedInUserApprover = true;
      //     }
      //   });
      // } else if (this.userType === 'SUPER_ORG') {
      //   this.isLoggedInUserApprover = true;
      // }
    });
    // let url = `/approval/programs/${this.currentProgram.id}/jobs/user-approvals?status=pending&entity_id=${this.param}`
    // this.jobService.get(url).subscribe(data => {
    //   if (data.data && data.data.length > 0) {
    //     this.userApproval = data.data;
    //     this.isShowStatus = this.userApproval?.some(appr => appr.status == 'pending' && appr.is_approval_required);
    //   }
    // }, (err) => {
    //   this.approvalCount = 0;
    //   this.isShowStatus = false;
    //   this.userApproval = [];
    //   // this.alertService.error(errorHandler(err));
    // });
  }
  goToApproval() {
    this.router.navigate(['/jobs/details/job-details/' + this.param + '/approval']);
  }

 /*
  getAvailableCanCount() {
    let url = `${this.baseURL}/programs/${this.programId}/jobs/${this.currentJobId}/candidates?is_inversed=true&limit=10&page=1`;
    this.candidateService.get(url).subscribe({
      next: (data: any) => {
        this.availableCanCount = data?.total_records;
      },
      error: err => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }
  */

  /*
  getSubmittedCanCount() {
    let search = '';
    this.subscriptions.push(
      this.candidateService.getSubmittedCandidate(10, 1, search, this.programId, this.currentJobId).subscribe({
        next: (data: any) => {
          if (data) {
            this.submittedCanCount = data?.total_records;
          }
        },
        error: (err) => {
          // this.alert.error(errorHandler(err));
          this.showError(err);
        },
  }),
    );
  } */

  /*
  getInterviewsCount() {
    this.subscriptions.push(
      this.JobDetailsService.getInterviewList(this.currentJobId, this.searchTerm).subscribe({
        next: (data: any) => {
          if (data) {
            this.interviewCount = data?.total_records;
          }
        },
        error: (err) => {
          // this.alert.error(errorHandler(err));
          this.showError(err);
        },
  }),
    );
  } */

  /* getOfferCount() {
    let search = '';
    let url = `${this.baseURL}/programs/${this.programId}/jobs/${this.currentJobId}/offers${search}?level=basic`;
    this.subscriptions.push(
      this.jobService.get(url).subscribe({
        next: (data: any) => {
          if (data) {
            this.offerCount = data?.total_records;
          }
        },
        error: (err) => {
          // this.alert.error(errorHandler(err));
          this.showError(err);
        },
  }),
    );
  } */

  /*getAssignmentCount() {
    this.assignmentService.getAssignmentsByJobId(1, 10, this.programId, this.currentJobId).subscribe({
      next: (data: any) => {
        if (data) {
          this.assignmentCount = data?.data?.total_records;
        }
      },
      error: (err) => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }*/

  ngOnDestroy() {
    this.subscriptions?.forEach(s => s?.unsubscribe());
  }

  draftOptionClicked(key): void {
    this._confirmService
      .confirm('', `${key === 'remove' ? 'Remove' : 'Close'} this Job?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          if (key === 'close') this.updateJobStatus('Closed');
          else if (key === 'remove') {
            this.jobService.delete(`/job-manager/programs/${this.jobData.program_id}/jobs/${this.jobData.id}`, this.jobData).subscribe({
              next: (data: any) => {
                this.loader.hide();
                if (data?.job?.id === this.jobData.id) {
                  this.alert.success('Job deleted sucessfully.');
                  this.router.navigate(['/jobs/list/all']);
                }
              },
              error: (error) => {
                // this.alert.error(`Unable to delete the job.<br>${error.message}`);
                this.showError(error);
                this.loader.hide();
                this.dataLoading = false;
                this.dataLoader = false;
              },
          });
          }
        }
      })
      .catch(() => {});
  }

  showError(err , emitLog?){
    window.scrollTo(0,0);
    if(emitLog){
      let log={
        type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
      };
      return log;
    }
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });

  }
  emitLogs(logs) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_JOB_OPT_IN_OUT_LOGS, logs));
  }

  showDetailTooltip() {
    const metabox = document.querySelector(".detail-meta .updated").getBoundingClientRect();
    const targettooltip = document.querySelector(".meta-tooltip");
    if(targettooltip) {
      targettooltip.setAttribute('style', 'left:' + metabox.left + 'px; top:' + metabox.top + 'px');
      this.metaTooltip = true;
    }
  }

  hideDetailTooltip() {
    this.metaTooltip = false;
  }

  routeTOWorkFlow() {
    this.router.navigateByUrl(`/jobs/details/job-details/${this.param}/workflow`)
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
  }

  onSidePanelClose() {
    this.approvalNote = "hidden";
    this.approvalFor = null;
  }

  onSubmitApproveReject(event) {
    this.loader.show();
    const { approval_for, approval_reason, approval_notes, approval_chain_id, is_program_admin, superAdminEdit} = event;
    let workflow_action = this.jobData?.status?.toLowerCase() == this.jobsStatus.PENDING_REVIEW ? 'REVIEW' : 'APPROVAL';
    if(workflow_action){
      workflow_action+= this.jobData?.version > 0 ? '-V-'+ this.jobData?.version : '';
    }
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
    this.jobService.put(`/approval/programs/${this.programId}/jobs/${this.currentJobId}/approval-request`, payload)
      .subscribe({
        next: (res: any) => {
        this.loader.hide();
        const account = this._storageService.get(StorageKeys?.CURRENT_ACCOUNT);
        const isUserJobManager = (this.jobData?.job_manager_id == account?.id);
        const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
        if(!isUserJobManager && this.userType?.toUpperCase() == UsersType.CLIENT?.toUpperCase()  && accessType?.toUpperCase() != AccessType.ALL?.toUpperCase()) {
          this.router.navigate(['/jobs/list/all']);
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


  changeActiveTab(tabName) {
    this.activeTab = tabName?.toLowerCase();
  }
  backToJob(){
    const glv = this._storageService.get(StorageKeys.GLV_PREFERENCE);
    if(glv['jobs']['glv']){
      this.router.navigate([glv['jobs']['newUrl']]);
    }else{
      this.router.navigate([glv['jobs']['oldUrl']]);
    }
  }

}
