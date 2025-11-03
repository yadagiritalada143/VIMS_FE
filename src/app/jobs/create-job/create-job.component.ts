import { AccountCodeData } from './../../library/account-code-generate/models/account-code-data';
import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { DataTransferService } from '../../core/services/data-transfer.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { JobService } from '../job.service';
import { HttpService } from 'src/app/core/services/http.service';
import { UserService } from './../../core/services/user.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { FoundationalFieldsComponent } from 'src/app/library/foundational-fields/foundational-fields/foundational-fields.component';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccessType, AccuracyConfigEnum, UsersType } from 'src/app/shared/enums';
import * as _ from 'lodash';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';

enum JOB_STATE {
  EDIT_APPROVED_JOB = 'editApprovedJob',
  EDIT_REVIEW = 'edit_and_review',
  DRAFT_REJECT = 'isedit'
}

@Component({
  selector: 'app-create-job',
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.scss'],
})
export class CreateJobComponent implements OnInit {

  public job_action = 'create';
  public createJobForm: UntypedFormGroup;
  public programId: string;
  public clientId: string;
  private pageNo = 0;
  // public backgroundcheckData: any = [];
  public dataLoading = false;
  public loading = false;
  public totalPages = 12;
  public totalRecords = 10;
  public itemsPerPage: 5;
  public tableLoaded = false;
  public popularJobs: any = [];
  public recentJobs: any = [];
  public tempPopularArray: any = [];
  public tempRecentArray: any = [];
  public templateData = new Array();
  public selectedTemplate: any = {};
  public searchTerm: any;
  public popularJobsTotalCount: any;
  public recentJobsTotalCount: any;
  public isQualificationEnabled: boolean = false;
  public rateCard: any;
  public customFields: any = [];
  public labor_categories: any = [];
  public filteredLaborCategories: any = [];
  public readOnlyLaborCategory = false;
  public userType: any;
  public currentUser: any;
  public accountCode: AccountCodeData;
  public accountCodeCreationActive: boolean = false;
  showAccountCode :string ='hidden';
  accessType: string;
  show: boolean = true;
  tabIndex = 0;
  foundationTypeList: any[] = [];
  seletHierarchy = 'hidden';
  isCreateEstimate: boolean = false;
  hierarchyData = [];
  newHierarchyData =[];
  defaultHierarchy: string[] = [];
  userAssociateHierarchy: string[] = [];
  usersearchTemplate = new Subject<string>();
  usersearchManager = new Subject<string>();
  usersearchQualifications = new Subject<any>();
  laborCategories = new Subject<string>();
  usersearchLocation = new Subject<string>();
  ratecardsearch = new Subject<string>();
  basicJobInfo: any = {};
  createJobPayLoad: any = {};
  selectedTemplateId: any = {};
  selectedHierarchyLevel: any = {};
  jobDetails: any;
  isShow: Boolean = false;
  public currentProgram;
  dropdownShowHide = false;
  // new changes
  createJobObject: any = {};
  basicInfo = true ;
  financialDetail = false;
  isSaveLoader: boolean = false;
  // jobDetails = false;
  btnText = 'continue';
  expense = 'Yes';
  items = [{ value: 'Yes' }, { value: 'No' }];
  public modules: any = {};
  preidntified = false;
  show_activities = false;
  showSummaries = false;
  isCustomFieldsFormValid: boolean = true;
  isFoundationalFieldsValid: boolean = true;
  customFieldsFormData: any = [];
  foundationalFieldsFormData: any = undefined;
  loadingtimesheetType: boolean = true;
  timesheetTypeList: any = [];
  maxRate;
  skills = [{ value: 'HTML' }, { value: 'Java' }];
  public workPeriods: any = [];
  managerList: any[] = [];
  public credentialsData = [];
  public qualification_types = [];
  selectCredentials: any = [];
  isCreateCandidate = 'hidden';
  firstFoundationalType: any;
  _foundationTypelist: any[] = [];
  public candidates = [];
  public addCandidate = false;
  approvalList: any = [];
  selectedSkills;
  showOption = false;
  showQualification = false;
  isQualificationLocked = [];
  suggestionPaneVisible = false;
  loadingTemplateDetail = false;
  public ratemodel = '';
  public workingHours: any;
  public rate: string;
  public rate_model: string;
  public estpayrateavg: number;
  public ratevisibility: boolean;
  public estminpayrateavg: number;
  public estmaxpayrateavg: number;
  tooltipvisible = 'hidden';
  is_Edit_Description: boolean = true;
  tooltipTitle: any = '';
  private now = Date.now();
  jobData: any = {};
  isHierarchySelected = false;
  public workFlow: any = {};
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };
  public rateCardOption: any = [];
  public closePanel: EventEmitter<boolean> = new EventEmitter();
  options2: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };
  jobId: any;
  visibility: any;
  templateId: any;
  name: any;
  activity: any;
  activities: any = [];
  public rateFactor: any = [];
  public rate_factor: any = {};
  public rate_type = [];
  public duplicateRateFactorList = [];
  enforcedRateCard: any;
  is_ot_exempt: any;
  isDraft: boolean = false;
  hierarchyRateModelMapping = [];
  @ViewChild(CustomFieldsComponent) customFieldsComp:  CustomFieldsComponent;
  managerLoading = false;
  qualLoading = false;
  isUserLocation = false;
  @ViewChild(FoundationalFieldsComponent) foundationalFieldsComp: FoundationalFieldsComponent;
  originalGLAccountOptions;

  tenureSpan: any;
  tenureSpanUnit: any;
  tenureMessage: any;
  logs: Log= undefined;
  hide_ot_exempt: boolean = false;

  jdParsingFile = [];
  uploadJD = [];
  jdAttachment: boolean = false;
  candData: any;
  jdRequired: boolean = false;
  isAvailableStartDateLimit: any;
  jdAttachmentMandate: boolean = false;
  allow_equal_min_max_rate: boolean = false;
  public foundational_params: any = {
    'ordering': 'ref_order'
  };
  isMaxBudgetCalculation: boolean = false;
  canClientEditManager: boolean = false;
  avgBillRate:any;
  isCreateJobBtnDisabled: boolean = false;
  public isJobManagerDisabled: String = "";
  modalVisibility = false;

  workLocation: String = ""

  public quillData;
  public quillInputTxt;
  public jobDescriptionFile;
  public prevJobDescData;
  public isJobParsingDone = false;
  public showExpenseAllowed = true;
  public editExpenseAllowed = true;
  public support_event: string;
  public support_text: any = { };
  public showTimesheetType;
  jobManagerAssociatedWorkLocation:any = [];
  workLocationArr = [];
  hierarchyFlattenArray = [];
  hierarchyReferenceCopy = [];
  private moduleId: string;
  isJobManagerChanged: boolean = false;
  allow_pre_identified_candidates: boolean = false;
  jobTypes=[]
  popularJobsLoading: boolean = true;
  recentJobsLoading: boolean = true;
  showJobType: boolean;
  selectedJobType = null;
  customFieldParams = null;
  jobTypeLoading: boolean;
  isCreateFromTemplate;
  isHierarchyIntersectionPresent:boolean = false;
  templateQualificationData = [];
  private jobManagerDefaultHierarchy;
  isFdValuesLoaded = false;
  disablePreIdToggle = false;
  manageRatePermission: boolean = false;
  viewRatePermission: boolean = false;
  templateRateFactorsIds: Array<String> = [];
  showRateCard: number = 0;
  constructor(
    private fb: UntypedFormBuilder,
    public userService: UserService,
    private localStorage: StorageService,
    private _loader: LoaderService,
    private _alert: AlertService,
    public dataTransferService: DataTransferService,
    public jobService: JobService,
    public httpService: HttpService,
    public router: Router,
    private _changeDetectorRef: ChangeDetectorRef,
    private _confirmService: ConfirmationDialogService,
    private route: ActivatedRoute,
    public accuracyPipe: AccuracyPipe,
    private datePipe: LocalDateFormatPipe,
    public jobdetailService: JobDetailsService,
    private location: Location,
    private authService: AuthorizationService,
    private uniqueKeyPipe: UniqueKeyPipe
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.router.navigated = false;
        window.scrollTo(0, 0);
        this.selectedTemplate.template_name = '';
        this.selectedTemplate.template_code = '';
      }
    });
    this.usersearchTemplate.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      if (value?.target?.value) {
        this.searchTerm = value?.target?.value;
        this.suggestionPaneVisible = true;
        this.getJobTemplate();
      } else {
        this.logs = undefined;
        this.clearTemplate();
      }
    });
    this.usersearchManager.pipe(map((v:any) => v.term), debounceTime(300), distinctUntilChanged(), tap(() => {
      this.managerLoading = true;
    }), switchMap((value:any) => {
      let hierarhy_ids = this.hierarchyFlattenArray?.filter((res)=>!res?.isDisabled)?.map((res)=>res?.id);
      if(this.name == JOB_STATE.EDIT_APPROVED_JOB) {
        hierarhy_ids = [this.basicJobInfo?.selectedHierarchy?.id];
      }
      if(this.currentProgram?.config?.job?.default_to_root_hierarchy || (!this.jobId && !this.isCreateFromTemplate)) {
        hierarhy_ids = [];
      }
      const url = `/configurator/programs/${this.programId}/members?org_category=CLIENT&info_level=basic${value? '&name=' + value : ''}${hierarhy_ids?.length > 0 ?  ('&hierarchy_ids='+ hierarhy_ids?.join()) : ''}`;
      return this.userService.get(url)
    }
    )).subscribe((value: any) => {
      this.managerList = this.sortMembers(value.members).map(mem => {
        return {
          id: mem.id,
          first_name: mem.first_name,
          last_name: mem.last_name,
          full_name: (mem.first_name ?? '') + (mem.middle_name ? ' ' + mem.middle_name : '') + ' ' + (mem.last_name ?? ''),
          email: mem.email,
          is_enabled: mem.is_enabled,
        };
      });
      //on searching getting different objects for some users so to map replacing the current obj with the obj in manger list array
      const currentJobManager = this.createJobForm.get('job_manager')?.value;
      const isJobManagerPresent = this.managerList.find((managerObj)=>managerObj?.id == currentJobManager?.id);
      if(isJobManagerPresent) {
       let managerIndex = 0;
       this.managerList.forEach((obj,idx)=>{
        if(obj?.id == currentJobManager?.id){
          managerIndex = idx;
        }
      });
      this.managerList[managerIndex] = currentJobManager;
      }
      this.managerLoading = false;
      if (this.visibility === 'clonejob') {
        this.managerList = this.managerList.filter(x => x.is_enabled === true);
      }
    });

    this.usersearchQualifications.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.searchQualifications(value?.item, value?.event);
    });

    this.laborCategories.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.getLaborCategoryList(value?.term, true);
    });

    this.usersearchLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {

      if(this.jobManagerAssociatedWorkLocation?.length == 0) {
        if (value?.term) {
          this.getWorkLocations(value?.term, true);
        } else {
          this.getWorkLocations(value?.term, true);
        }
      } else {
        this.createJobObject.locations = this.jobManagerAssociatedWorkLocation?.filter((res)=>res?.name?.toLowerCase()?.includes(value?.term?.toLowerCase()));
      }
    });

    this.ratecardsearch.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.getAllRatefactorList(value?.term);
    });
  }

  public dateFormat;
  public sourced;
  public payroll;
  jobManagerHierarchies = [];

  ngOnInit(): void {
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.allow_equal_min_max_rate = this.currentProgram?.config?.job?.allow_equal_min_max_rate ?? false;
    this.allow_pre_identified_candidates = this.currentProgram?.config?.job?.allow_pre_identified_candidates ?? false;
    this.userType = this.localStorage.get(StorageKeys.USER_TYPE)?.toUpperCase();
    this.showJobType = this.currentProgram?.config?.job_type ?? false;
    this.viewRatePermission = this.authService.authorize("view_rate_type_job");
    this.manageRatePermission = this.authService.authorize("manage_rate_type_job");
    // this.showJobType = false;
    let accountConfig = this.localStorage.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    this.isMaxBudgetCalculation = this.currentProgram?.config?.job?.job_budget_calculation?.toLowerCase() === "max_budget";
    if (accountConfig && accountConfig?.components) {
      this.accountCodeCreationActive = true;
    }
    this.currentUser = this.localStorage.get('user');
    this.dateFormat = this.currentProgram?.defaultDateFormat?.toUpperCase();
    // this.dateFormat = this.dateFormat ? this.dateFormat.replaceAll('M', 'm') : 'dd-mm-yy';
    this.workPeriods = [
      { name: 'Monthly', value: 'monthly' },
      { name: 'Weekly', value: 'weekly' },
    ];
    this.rate_type = [
      { name: 'Bill Rate', value: 'bill_rate', is_show: true },
      { name: 'Pay Rate', value: 'pay_rate', is_show: true },
    ];
    this.rate_factor.iscollapse = false;
    this.createJobObject.rateOption = new Array();
    this.programId = this.currentProgram?.id;
    this.jobId = this.route.snapshot.params['id'];
    this.visibility = this.route.snapshot.params['name'];
    this.templateId = this.route.snapshot.params['template_id'];
    this.name = this.route.snapshot.params['name'];
    if(this.showJobType){
      this.getJobTypePicklist();
    }
    if (this.name == 'isedit') {
      this.job_action = 'edit';
      this.support_event = 'update_job';
    } else if (this.name == 'edit_review') {
      this.job_action = 'review';
      this.support_event = 'update_job';
    } else if (this.name == 'clonejob') {
      this.job_action = 'clone';
      this.support_event = 'create_job';
    }  else if (this.name == 'editApprovedJob') {
      this.job_action = 'edit';
      this.support_event = 'update_job';
    } else {
      this.job_action = 'create';
      this.support_event = 'create_job';
    }
    if (this.localStorage.get('template_Data') && !this.jobId) {
      this.isCreateFromTemplate = true;
    }

    this.getSupportingText();
    if (this.templateId) {
      this.getJobTemplateDetails(this.templateId);
    }
    this.getLaborCategoryList('');
    this.tooltipvisible = 'visible';
    const yesterday = new Date(this.now);
    yesterday.setDate(yesterday.getDate() - 1);
    this.options = {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [
        // { start:  yesterday},
      ],
    };

    if (this.visibility === 'isview') {
      // this.title = 'View'
    } else if (this.visibility === 'isedit' || this.visibility === 'editApprovedJob' || this.visibility === 'edit_review' || this.visibility === 'clonejob') {
      setTimeout(() => {
        this.loadJobDetails();
      }, 4000);
      // this.title = 'Edit'
    } else {
      // this.title = 'Add'
    }

    this.jdAttachment = this.currentProgram?.config?.job?.job_description?.attachment ?? false;
    this.jdRequired = this.currentProgram?.config?.job?.job_description?.required ?? false;
    this.jdAttachmentMandate = this.currentProgram?.config?.job?.job_description?.attachment_mandate ?? false;
    const adjustmentType=this.currentProgram?.config?.job?.adjustment_type
    this.createJobForm = this.fb.group({
      start_date: [null, [Validators.required]],
      end_date: [null, [Validators.required]],
      location: [null],
      currency: [null, [Validators.required]],
      num_resources: [1, [Validators.required, Validators.pattern(/^[0-9]\d*$/)]],
      hours_per_day: [8, [Validators.required]],
      week_working_days: [5, [Validators.required]],
      formatted_working_days: [null, [Validators.required]],
      working_hours: [null, [Validators.required]],
      working_days: [null],
      adjustment_type: [adjustmentType],
      rate_type: ['per_hour', ''], //per_hour / per_day
      single_initial_budget: [null, [Validators.required]],
      min_single_initial_budget: [null],
      max_single_initial_budget: [null],
      single_net_budget: [null, [Validators.required]],
      min_single_net_budget: [null],
      max_single_net_budget: [null],
      additional_amount: [0, [Validators.required]],
      single_gross_budget: [0, [Validators.required]],
      min_single_gross_budget: [0],
      max_single_gross_budget: [0],
      adjustment_value: ['', [Validators.required]],
      net_budget: [0, [Validators.required]],
      min_net_budget: [0],
      max_net_budget: [0],
      min_bill_rate: [0, [Validators.required]],
      max_bill_rate: [0, [Validators.required]],
      rate_dtls: [''],
      pre_identified_candidate: this.preidntified,
      vendor_rate_exceed: [false, []],
      locations: [null, [Validators.required]],
      job_manager: [null, [Validators.required]],
      hierarchy: [null, [Validators.required]],
      labor_category: [null],
      description: [null],
      allow_expense: ['Yes', ''],
      note_for_approver: [''],
      selectedQualification: [null, []],
      qualifications: this.fb.array([]),
      no_of_openings: [1, ''],
      foundational_data: this.fb.array([]),
      custom_fields: this.fb.array([]),
      unit_of_measure: [null, [Validators.required]],
      RateCardDetails: [null],
      is_ot_exempt: [false],
      activities: [[]],
      activities_base_prices: [false],
      // is_background_check: [false],
      is_onboarding_checklist: [false],
      averagemarkup: [''],
      minmarkup: [''],
      maxmarkup: [''],
      estpayrate: [''],
      estminrate: [''],
      estmaxrate: [''],
      range: [''],
      estmarkup: [''],
      estmarkuprangemax: [''],
      estmarkuprangemin: [''],
      sourcedmarkup: [''],
      payrollmarkup: [''],
      rates: [''],
      approval_workflow_required: [''],
      activity: ['', [Validators.pattern(/^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/), Validators.maxLength(100), Validators.minLength(2)]],
      // background_check_list: [[], this.validorBackgroundCheckListFunction()],
      checklist: [[]], //[[], this.validorOnBaordingCheckList()],
      min_budget: [''],
      max_budget: [''],
      rate_model: [''],
      min_pay_rate: [0, [Validators.required]],
      max_pay_rate: [0, [Validators.required, Validators.pattern(/^\s*(?=.*[1-9])\d*(?:\.\d{1,2})?\s*$/)]],
      account_code:[null],
      timesheetType: [null],
      review_notes: [null],
    },
    {
      validators:[ this.dateValidator ]
    }
    );
    if(!this.jobId) {
      this.createJobForm.patchValue({ currency: this.currentProgram?.config?.billing?.default_currency ?? this.currentProgram?.defaultCurrency ?? 'USD' }); // Temp fix. remove later
    }
    if(this.accountCodeCreationActive){
      this.createJobForm.get('account_code').setValidators([Validators.required]);
    }
    const formArray = this.createJobForm.get('foundational_data') as UntypedFormArray;
    while (formArray && formArray?.length !== 0) {
      formArray?.removeAt(0);
    }
    this.modules = {
      toolbar: [['bold', 'italic', 'link', { list: 'ordered' }, { list: 'bullet' }]],
    };

    this.hierarchyList();
    this.getWorkLocations(null, true);
    this.get_UOM_list();

    this.createJobForm?.controls['start_date']?.valueChanges?.subscribe(data => {
      if (data) {
        const start_date = this.getDate(this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
        this.options2 = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [{ start: start_date, end: this.getEndRange(start_date)  }],
        };
      }
      if (data) {
        this.getWorkingHoursEstimate();
      }
    });
    this.createJobForm?.controls['end_date']?.valueChanges?.subscribe(data => {
      if (data) {
        let start_date: any = this.createJobForm.get('start_date').value;
        let end_date = new Date(this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
        if (start_date && new Date(this.datePipe.transform(start_date, DATE_FORMAT?.FORMATMDY,null,null,true,this.dateFormat)).getTime() > end_date.getTime()) {
          this.showError('End Date should be greater then start date');
        } else {
          this.getWorkingHoursEstimate();
        }
      }
    });
    setTimeout(() => {
      if (this.localStorage.get('template_Data') && !this.jobId) {
        let templateData = this.localStorage.get('template_Data');
        if(this.showJobType && templateData?.job_type?.length==1){
          this.selectedJobType=templateData?.job_type?.[0];
          this.selectJobType(this.selectedJobType);
        }
        this.selectedJobtemplate(this.localStorage.get('template_Data'));
      }
    }, 2000);
    this.hide_ot_exempt = this.authService.authorize('hide_ot_exempt');
  }

  getSupportingText() {
    const performedBy =
      this.userType?.toUpperCase() !== UsersType.SUPER_ORG ? this.userType?.toUpperCase() : `${UsersType.CLIENT},${UsersType.MSP}`;
    if (this.support_event) {
      this.jobService
        .get(`/configurator/programs/${this.programId}/support/support_text?event_slug=${this.support_event}&performed_by=${performedBy}`)
        .subscribe({
          next: (data: any) => {
            data.support_text_data
              .find(support => support.event.slug === this.support_event)
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
            this.showError(err);
          },
        });
    }
  }

  get f() {
    return this.createJobForm.controls;
  }

  get disableOnboarding() {
    return this.currentProgram?.config?.is_onboading_disabled
  }

  async init(managerData?) {
    this.managerList = [];
    let account = this.localStorage.get(StorageKeys?.CURRENT_ACCOUNT);
    const loggedIn_USER = {
      id: this.currentUser?.id,
      first_name: this.currentUser?.first_name,
      last_name: this.currentUser?.last_name,
      full_name: (this.currentUser?.first_name ?? '') + (this.currentUser?.middle_name ? ' ' + this.currentUser?.middle_name : '') + ' ' + (this.currentUser?.last_name ?? ''),
      email: this.currentUser?.email
    };
    this.accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
    this.canClientEditManager = this.currentProgram?.config?.job?.allow_independent_hm_selection || false;
    this.managerList = (this.accessType !== AccessType.ALL && !this.canClientEditManager) ? (this.jobId ? [managerData] : [await this.getMemberById(this.currentUser?.id).toPromise()]) : await this.getManagerList(null, false).toPromise();
    if (this.managerList) {
      if (this.visibility === 'clonejob') {
        this.managerList = this.managerList.filter(x => x.is_enabled === true);
      }
      const isClient = account?.role?.organization_category === 'CLIENT';
      const isMsp = account?.role?.organization_category === 'MSP' ? true : false;
      if(!isMsp && (this.accessType == AccessType.OWN || this.accessType == AccessType.TRUE_OWN) && !this.canClientEditManager && !this.jobId) {
        const isManagerPresent = this.managerList?.find((res) => res?.id == loggedIn_USER?.id);
        if (isManagerPresent) {
          this.managerList = this.managerList?.filter((res) => res?.id != loggedIn_USER?.id);
        }
        this.managerList?.splice(0, 0, loggedIn_USER);
        this.createJobForm.patchValue({
          job_manager: this.managerList[0]
        });
        if (!this.jobId) {
          isClient && this.loadDefaultJobValue(this.managerList[0]);
        }
      }
      if (!isMsp && (this.accessType === AccessType.ALL || this.canClientEditManager) && !this.jobId) {
        const isManagerPresent = this.managerList?.find((res) => res?.id == loggedIn_USER?.id);
        if (isManagerPresent) {
          this.managerList = this.managerList?.filter((res) => res?.id != loggedIn_USER?.id);
        }
        this.managerList?.splice(0, 0, loggedIn_USER);
        if (this.managerList?.length > 0) {
          (isClient) && this.createJobForm.patchValue({
            job_manager: this.managerList[0]
          });
          if (!this.jobId) {
            isClient && this.loadDefaultJobValue(this.managerList[0]);
          }
        }
      }
      const jobManager = this.createJobForm?.value?.job_manager;
      if (this.jobId && jobManager) {
        const index = this.managerList?.findIndex((res) => res?.id == jobManager?.id);
        if (index > -1) {
          this.managerList[index] = jobManager;
        } else {
          this.managerList.push(jobManager);
        }
      }
    }
    this.checkApporvalWorkflowStatus();
  }

  getDate(date) {
    if (date) {
      return new Date(date);
    }
  }

  cancelCreateJob() {
    this._confirmService
      .confirm('', `Are you sure to cancel the Create New Job ?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.location.back();
        }
      })
      .catch(() => { });
  }
  snakeCase = string => {
    string = string.toLowerCase();
    return string
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  };

  onIndexChange(event) {
    this.tabIndex = event;
  }
  goToNext() {
    this.onIndexChange(this.tabIndex + 1);
  }
  showMoreRecent() {
    this.pageNo = this.pageNo + 1;
    this.getRecentJobList(this.pageNo);
  }
  hideMoreRecent() {
    this.tempRecentArray = [];
    this.getRecentJobList((this.pageNo = 1));
  }

  getRecentJobList(pageNo = 1) {
    this.dataLoading = true;
    this.recentJobsLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    let hierarchyIds = this.hierarchyFlattenArray?.filter(hi => !hi?.isDisabled)?.map(hi => hi?.id);
    if(this.currentProgram?.config?.job?.default_to_root_hierarchy) {
      hierarchyIds = [];
    }
    let jobType = null;
    if(this.showJobType){
      jobType = this.selectedJobType;
    }
    this.userService.getAllRecentJobs(this.programId, 10, hierarchyIds, jobType).subscribe({
      next: (data) => {
        this.recentJobs = data?.job_templates;
        if (this.recentJobs) {
          this.tempRecentArray?.push(...this.recentJobs);
          this.recentJobsTotalCount = this.recentJobs?.length;
        }

        this._loader.hide();
        this.dataLoading = false;
      },
      error: error => {
        this.showError(error);
        this._loader.hide();
      },
      complete: () => {
        this.dataLoading = false;
        this.recentJobsLoading = false;
        this._loader.hide();
      },
  });
  }

  clearTemplate() {
    this.selectedTemplate = {};
    this.selectedTemplateId = {};
    // this.clearJobForm();
  }

  /* async getFoundantionalType(pageNo = 1) {
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.userService.getFoundantionalType(this.programId).subscribe(data => {
      const { foundational_data_types } = data;
      this.foundationTypeList = foundational_data_types.filter(fd => {
        return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
      }).map(fd => {
        fd.code = this.snakeCase(fd.name);
        return fd;
      });

      const foundationalDataHttp = this.foundationTypeList.map(dataType => {
        return this.userService.get(`/configurator/programs/${this.programId}/foundational-data-types/${dataType?.id}/foundational-data`);
      });

      let foundationalValue: any[] = [];
      forkJoin(foundationalDataHttp).subscribe(res => {
        foundationalValue = res.map(foundData => foundData.foundational_data);
        foundationalValue.forEach((val, index) => {
          this.foundationTypeList[index].values = val;
        });
        this.foundationTypeList = [...this.foundationTypeList];
        this._foundationTypelist = this.chunkArray(this.foundationTypeList, 3);
        this.updateFoudationalForm();
      }, err => {
        this._alert.error(errorHandler(err));
      });

      this._loader.hide();
    }, error => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
    },
      () => {
        this.dataLoading = false;
        this._loader.hide();
      });
  }

   getfondationData(term , fondationDataType, index) {
     if(fondationDataType && fondationDataType?.get('foundational_data_type_id')?.value) {
   let dataTypeId = fondationDataType?.get('foundational_data_type_id')?.value;
   let url = `/configurator/programs/${this.programId}/foundational-data-types/${dataTypeId}/foundational-data?k=${term.term}`;
   this.userService.get(url).subscribe(data => {
      if(data && data.foundational_data && data?.foundational_data.length > 0) {
        let controlArray = <FormArray>this.createJobForm.controls["foundational_data"];
        controlArray.controls[index].patchValue({options:data?.foundational_data});
        this.dataLoading = false;
        this.skeletonLoading = false;
      }
  }, error => {
    this.dataLoading = false;
    this.skeletonLoading = false;
    this._alert.error(errorHandler(error), {});
    this._loader.hide();
  },
    () => {
      this.dataLoading = false;
      this.skeletonLoading = false;
      this._loader.hide();
    });
     }

   }
  get foundationlGroupForm() {
    return this.createJobForm.get('foundational_data') as FormGroup;
  }
  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      if (chunk.length < size) {
        chunk.push({ hidden: true });
      }
      result.push(chunk);
    }
    return result;
  }
  makeFoundationDataType(event, code) {

  }
   */
  showMore() {
    this.pageNo = this.pageNo + 1;
    this.getPopularJobList(this.pageNo);
  }
  hideMore() {
    this.tempPopularArray = [];
    this.getPopularJobList((this.pageNo = 1));
  }
  getPopularJobList(pageNo = 1) {
    this.dataLoading = true;
    this.popularJobsLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    let hierarchyIds = this.hierarchyFlattenArray?.filter(hi => !hi?.isDisabled)?.map(hi => hi?.id);
    if(this.currentProgram?.config?.job?.default_to_root_hierarchy) {
      hierarchyIds = [];
    }
    let jobType = null;
    if(this.showJobType){
      jobType = this.selectedJobType;
    }
    this.userService.getAllPopularJobs(this.programId, 10, hierarchyIds, jobType).subscribe({
      next: (data: any) => {
        this.popularJobs = data?.job_templates;
        this.tempPopularArray?.push(...this.popularJobs);
        this.popularJobsTotalCount = this.popularJobs?.length;
        this._loader.hide();
        this.dataLoading = false;
      },
      error: error => {
        this.showError(error);
        this._loader.hide();
      },
      complete: () => {
        this.dataLoading = false;
        this.popularJobsLoading = false;
        this._loader.hide();
      },
  });
  }

  checkApporvalWorkflowStatus() {
    let url = `/configurator/programs/${this.programId}/config?entity_code=approval_job`;
    this.jobService.get(url).subscribe({
      next: (workflowDetail: any) => {
        let workflowdata = workflowDetail;
        if (workflowdata && workflowdata.config) {
          this.workFlow = workflowdata.config;
          this.createJobForm.patchValue({ approval_workflow_required: workflowdata.config?.workflow_required });
        }
      },
      error: err => { },
  });
  }


  /*fetchTimesheetTypes() {
    this.jobdetailService.getPickListItems(this.currentProgram?.id, 'timesheet_type').subscribe((response: any) => {
      if (response && response?.picklist_items) {
        this.timesheetTypeList = response?.picklist_items;
      }
    });
  }*/

  searchTemplate(event) { }

  get getunitMeasureStatus() {
    let unitofMeasure = this.createJobForm.get('unit_of_measure').value;
    if (unitofMeasure) {
      if (unitofMeasure && (unitofMeasure?.unit_of_measure === 'monthly' || unitofMeasure?.unit_of_measure === 'weekly')) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }                                                                                                                                                                                                                                                                                                                          
  get isDisabled() {
    return (
      (this.basicInfo && !this.basicInfoValid) ||
      (this.financialDetail && !this.financialDetailValid) ||
      (this.jobDetails && !this.jobDetailValid) ||
      this.isCreateJobBtnDisabled
    );
  }

  get basicInfoValid() {
    const description = this.quillData;
    return (
      this.createJobForm.get('hierarchy').valid &&
      this.createJobForm.get('locations').valid &&
      this.createJobForm.get('job_manager').valid &&
      this.createJobForm.get('labor_category').valid &&
      // this.createJobForm.get('background_check_list').valid &&
      // this.createJobForm.get('checklist').valid &&
      (this.jdAttachmentMandate ? this.jdParsingFile?.length : true) &&
      (this.jdRequired ? description?.length   > 0 : true) &&
      this.isQualificationValid() &&
      ((this.showJobType && this.selectedJobType) || !this.showJobType)
    );
  }

  get financialDetailValid() {
    return (
      this.createJobForm.get('start_date').valid &&
      this.createJobForm.get('end_date').valid &&
      this.createJobForm.get('min_bill_rate').valid &&
      this.createJobForm.get('max_bill_rate').valid &&
      this.createJobForm.get('max_bill_rate').value > 0 &&
      this.createJobForm.get('num_resources').valid &&
      this.createJobForm.get('currency').valid &&
      this.createJobForm.get('unit_of_measure').valid &&
      this.isValidEndDate 
      && !this.createJobForm?.errors?.startEndDateExceedError
    );
  }

  get isValidEndDate() {
    const startDate = this.getDate(this.datePipe.transform(this.createJobForm.get('start_date').value, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
    const endDate = this.getDate(this.datePipe.transform(this.createJobForm.get('end_date').value, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
    const endRange = this.getEndRange(startDate);
    if (endDate && endRange) {
      return endDate <= endRange;
    }
    return true;
  }

  get jobDetailValid() {
    let hasInvalidControls = this.foundationalDataArray.controls.some(control => {
      return control.get('values').invalid;
    });
    hasInvalidControls = this.createJobForm.get('account_code').invalid;
    return !hasInvalidControls;
  }

  /* jobDetailCustomFields() {
    if(this.customFieldsArray.controls && this.customFieldsArray.controls.length > 0) {
      const hasValid = this.customFieldsArray.controls.some(control => {
        return control.get('values').invalid
      });
      return hasValid ;
    } else {
      return false;
    }

  } */

  stringToHTML = (htmlString :string) => {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body;
  }

  async selectedJobtemplate(event) {
    if (!event?.template_name) {
      event.template_name = event?.title?.title;
    }
    this.clearJobForm();
    this.selectedTemplate = event;
    this.suggestionPaneVisible = false;
    this.templateData = [];
    this.loadTemplateDetails();
  }

  // setActivityFlag(event) {
  //   this.show_activities = event;
  //   this.createJobForm.patchValue({ activities_base_prices: this.show_activities });
  //   if (!this.show_activities) {
  //     this.activities = new Array();
  //     this.createJobForm.get('activity').patchValue('');
  //   }
  // }
  // addActivity() {
  //   this.closePopup(null);
  //   if (this.createJobForm.get('activity').valid) {
  //     let activity = this.createJobForm.get('activity').value;
  //     if (activity.replace(/\s/g, '') == '') {
  //       this._alert.error('Plase enter the valid activity');
  //       return;
  //     }
  //     if (activity) {
  //       this.activities.push(activity);
  //       this.createJobForm.get('activity').patchValue('');
  //     } else {
  //       this._alert.error('Plase enter the valid activity');
  //     }
  //   } else {
  //     this._alert.error('Plase enter the valid activity in alpha numeric value only');
  //   }
  // }

  // removeActivity(index) {
  //   if (index !== -1) {
  //     this.activities.splice(index, 1);
  //   }
  // }

  getAllRatefactorList(term?) {
    if (!this.basicJobInfo?.selectedHierarchy?.id || ((!this.selectedTemplate?.rates || this.selectedTemplate?.rates?.length == 0) && this.templateRateFactorsIds?.length == 0 )) {
      return;
    }
    let limit = 15;
    let qry = `?hierarchy=${this.basicJobInfo.selectedHierarchy.id}&`;
    qry = qry + 'limit=' + limit + '&page=' + this.pageNo + '&is_enabled=True';
    if (term) {
      qry = qry + '&k=' + term;
    }

    const url = '/configurator/programs/' + this.programId + '/rate-factors' + qry;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data?.rate_factors) {
          this.transformRates(data?.rate_factors);
          this.transformRates(this.selectedTemplate?.rates, !!this.jobId);
          this.rateFactor = data?.rate_factors;
          this.createJobForm.patchValue({
            rates: this.rateFactor?.length
              ? this.selectedTemplate?.rates?.map(rf => {
                const currRF = this.rateFactor?.find(b => b?.id === rf?.id);
                if (currRF) {
                  return {
                    ...currRF,
                    ...rf,
                    abbreviation: currRF?.abbreviation,
                    billable: currRF?.billable,
                    rate: currRF?.rate
                  };
                };
              }).filter(x => x)
              : [],
          });
          this.modifyRateArray();
          this.updateRateFactorList();
        }
      },
      error: err => {
        this.showError(err);
      },
  });
  }


  filterTemplateRates = (rf) => {
    return (this.createJobForm?.get('rates')?.value?.findIndex((formRateFactor)=>formRateFactor?.id == rf?.id) > -1) || (this.templateRateFactorsIds?.findIndex((rateId)=>rateId == rf?.id) > -1);
  }

  // to avoid object refrence issues and move st rated on top of list
  modifyRateArray() {
    const ratesNotInRateList = [];
    for (let i = 0; i < this.createJobForm?.value?.rates?.length; i++) {
      const rf = this.createJobForm?.value?.rates[i];
      const findRateIdx = this.rateFactor?.map(a => a?.id)?.findIndex(a => rf?.id == a);
      if (findRateIdx > -1) {
        this.rateFactor[findRateIdx] = rf;
        rf?.bill_rate?.forEach((br) => {
          if (br?.flat_adjustment) {
            rf['bill_flat_adjustment'] = br?.flat_adjustment;
          }
        });
      } else ratesNotInRateList.push(rf);
    }    

    const stRate = this.createJobForm?.value?.rates?.find(rf => rf?.abbreviation?.toLowerCase() == 'st');
    if (stRate) {
      const nonStRates = this.createJobForm?.value?.rates?.filter((rf) => rf?.abbreviation?.toLowerCase() != 'st');
      this.createJobForm.get('rates').setValue([stRate, ...nonStRates]);
    }
    if(this.createJobForm?.value?.rates?.length > 0) {
      this.createJobForm.value.rates[0]['showAccordian'] = true;
      this.createJobForm?.value?.rates?.forEach((rate, i) => {
        if(rate?.bill_rate?.length > 0 && rate?.adjustment > 0) {
          this.addFlatAdjustment(i, null, null, 'bill_rate', rate?.adjustment);
        }
      });
    }
    this.rateFactor = [...this.rateFactor, ...ratesNotInRateList];
    this.rateFactor = this.rateFactor?.filter(this.filterTemplateRates);
  }


  transformRates(rates:Array<any> , isJobRates?: boolean) {
    rates?.forEach(element => {
      if (element && element?.bill_rate?.length > 0) {
        element?.bill_rate?.forEach((bill, i) => {
          bill.rate_type = bill?.rate_type?.toLowerCase() || bill?.rate?.toLowerCase();
          bill.rate = bill?.rate_type;
          if (bill?.factor) {
            bill.factor = this.accuracyPipe.transform((+bill.factor),AccuracyConfigEnum.RATE,{isEdit: true});
          }
          if (i === 1) {
            bill.is_remove_rate = true;
            element.is_bill_last = 'rate';
          }
          if((bill?.adjustment > 0 || bill?.flat_adjustment > 0)) {
            element.adjustment = isJobRates ? bill?.flat_adjustment : bill?.adjustment;
          }
        });
      }
      if (element && element?.pay_rate?.length > 0) {
        element?.pay_rate?.forEach((pay, i) => {
          pay.rate_type = pay?.rate_type?.toLowerCase() || pay?.rate?.toLowerCase();
          pay.rate = pay?.rate_type;
          if (pay?.factor) {
            pay.factor = this.accuracyPipe.transform((+pay.factor),AccuracyConfigEnum.RATE,{isEdit: true});
            // pay.factor =f?.toFixed(2);
          }
          if (i === 1) {
            // pay.is_remove_rate= true;
            // element.is_pay_last = 'rate';
            pay.is_remove_rate = true;
            element.is_pay_last = 'rate';
          }
        });
      }
    });
  }

  updateRateFactorList() {
    if (this.rateFactor && this.rateFactor?.length > 0) {
      this.rateFactor?.forEach((d, i) => {
        if (d?.is_ot_exempt === true && this.is_ot_exempt === true) {
          this.rateFactor.splice(i, 1);
        }
      });
    }
    let rates = this.createJobForm?.controls?.rates?.value;
    if (this.rateFactor && this.rateFactor?.length > 0 && rates && rates?.length > 0) {
      this.rateFactor?.forEach(element => {
        rates.forEach((r, i) => {
          if (element?.id === r?.id && this.is_ot_exempt === r?.is_ot_exempt) {
            this.createJobForm.value?.rates?.splice(i, 1);
            this.createJobForm.patchValue({ rates: this.createJobForm?.value?.rates });
          }
        });
      });
    }
  }

  toggleView() {
    if(this.name === 'editApprovedJob') return false;
    this.rate_factor.iscollapse = !this.rate_factor.iscollapse;
  }

  resetRatefactorList() {
    // this.createJobForm?.controls?.rates?.reset();
    this.createJobForm?.patchValue({
      is_ot_exempt: this.is_ot_exempt,
    });
    this.updateRateFactorList();
    this.getAllRatefactorList();
  }

  addRate(index1, index2, value, type) {
    if(this.name === 'editApprovedJob') return false;
    let v = '';
    if ((value && value?.rate?.toLowerCase() === 'pay_rate') || value?.rate_type?.toLowerCase() === 'pay_rate') {
      v = 'bill_rate';
    } else if (value?.rate?.toLowerCase() === 'bill_rate' || value?.rate_type?.toLowerCase() === 'bill_rate') {
      v = 'pay_rate';
    }
    const factor = this.accuracyPipe.transform(1, AccuracyConfigEnum.RATE, {isEdit: true});
    if (type === 'bill_rate') {
      this.createJobForm.value.rates[index1].bill_rate.push({ factor: factor, rate: v, is_remove_rate: true });
      this.createJobForm.value.rates[index1].is_bill_last = 'rate';
    } else {
      this.createJobForm.value.rates[index1].pay_rate.push({ factor: factor, rate: v, is_remove_rate: true });
      this.createJobForm.value.rates[index1].is_pay_last = 'rate';
    }
  }

  addFlatAdjustment(index1, index2, value, type , flat_adjustment_val:Number = 0) {
    if(this.name === 'editApprovedJob') return false;
    const flat_adjustment = this.accuracyPipe.transform(flat_adjustment_val, AccuracyConfigEnum.AMOUNT, {isEdit: true});
    if (type === 'bill_rate') {
      this.createJobForm.value.rates[index1].is_bill_flat = true;
      this.createJobForm.value.rates[index1].is_bill_remove_flat = true;
      this.createJobForm.value.rates[index1].bill_flat_adjustment = flat_adjustment;
      this.createJobForm.value.rates[index1].is_bill_last = 'adjustment';
    } else {
      this.createJobForm.value.rates[index1].is_pay_flat = true;
      this.createJobForm.value.rates[index1].is_pay_remove_flat = true;
      this.createJobForm.value.rates[index1].pay_flat_adjustment = flat_adjustment;
      this.createJobForm.value.rates[index1].is_pay_last = 'adjustment';
    }
  }

  removeRateOrAdjustment(index1, index2, value, type, removeBillType:String = "") {
    if(this.name === 'editApprovedJob') return false
    if (type === 'bill_rate') {
      const is_bill_last = removeBillType;
      if (is_bill_last === 'rate') {
        let index = this.createJobForm.value.rates[index1].bill_rate.findIndex(b => b.factor === value.factor && b.rate == value.rate);
        this.createJobForm.value.rates[index1].bill_rate.splice(index, 1);
        if (this.createJobForm.value.rates[index1].is_bill_flat) {
          this.createJobForm.value.rates[index1].is_bill_last = 'adjustment';
        }
      } else if (is_bill_last === 'adjustment') {
        delete this.createJobForm.value.rates[index1].is_bill_flat;
        delete this.createJobForm.value.rates[index1].is_bill_remove_flat;
        delete this.createJobForm.value.rates[index1].bill_flat_adjustment;

        let length = this.createJobForm.value.rates[index1]?.bill_rate?.length;
        if (length > 1) {
          this.createJobForm.value.rates[index1].is_bill_last = 'rate';
        }
      }
    } else {
      let is_pay_last = this.createJobForm.value.rates[index1].is_pay_last;
      if (is_pay_last === 'rate') {
        let index = this.createJobForm.value.rates[index1].pay_rate.findIndex(b => b.factor === value.factor && b.rate == value.rate);
        this.createJobForm.value.rates[index1].pay_rate.splice(index, 1);
        if (this.createJobForm.value.rates[index1].is_pay_flat) {
          this.createJobForm.value.rates[index1].is_pay_last = 'adjustment';
        }
      } else if (is_pay_last === 'adjustment') {
        delete this.createJobForm.value.rates[index1].is_pay_flat;
        delete this.createJobForm.value.rates[index1].is_pay_remove_flat;
        delete this.createJobForm.value.rates[index1].pay_flat_adjustment;

        let length = this.createJobForm.value.rates[index1]?.pay_rate?.length;
        if (length > 1) {
          this.createJobForm.value.rates[index1].is_pay_last = 'rate';
        }
      }
    }
  }

  AddBillRate(type, index1, index2, factor) {
    if (type === 'add') {
      if (index1 !== -1 && index2 !== -1) {
        let rate = factor?.factor;
        if (rate < 10) {
          factor.factor = 0.5 + parseFloat(factor?.factor);
          const f = this.accuracyPipe.transform(factor.factor, AccuracyConfigEnum.RATE, {isEdit: true});
          factor.factor = f;
        }
      }
    }
  }

  AddPayRate(type, index1, index2, factor) {
    if (type === 'add') {
      if (index1 !== -1 && index2 !== -1) {
        let rate = factor?.factor;
        if (rate < 10) {
          factor.factor = 0.5 + parseFloat(factor?.factor);
          const f = this.accuracyPipe.transform(factor.factor, AccuracyConfigEnum.RATE, {isEdit: true});
          factor.factor = f;
        }
      }
    }
  }

  removeRateFactor(rate, index) {
    this._confirmService
      .confirm('', `Do you want to remove ${rate?.name} ?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          if (index !== -1) {
            this.createJobForm.value.rates.splice(index, 1);
            this.createJobForm.patchValue({ rates: this.createJobForm.value.rates });
            // this.rateFactor = [];
            // this.rateFactor = JSON.parse(JSON.stringify(this.duplicateRateFactorList));
          }
        }
      })
      .catch(() => { });
  }

  updateRateOption(index1, index2, value, type) {
    let option_value = '';
    if (value === 'pay_rate') {
      option_value = 'bill_rate';
    } else if (value === 'bill_rate') {
      option_value = 'pay_rate';
    }
    if (type === 'bill') {
      if (index2) {
        this.createJobForm.value.rates[index1].bill_rate[index2 - 1].rate = option_value;
      } else if (index2 !== -1 && this.createJobForm.value.rates[index1].bill_rate?.length > 1) {
        this.createJobForm.value.rates[index1].bill_rate[index2 + 1].rate = option_value;
      }
    } else if (type === 'pay') {
      if (index2) {
        this.createJobForm.value.rates[index1].pay_rate[index2 - 1].rate = option_value;
      } else if (index2 !== -1 && this.createJobForm.value.rates[index1].pay_rate?.length > 1) {
        this.createJobForm.value.rates[index1].pay_rate[index2 + 1].rate = option_value;
      }
    }
  }

  clearJobForm() {
    this.createJobForm.patchValue({ num_resources: 1 });
    this.createJobForm.patchValue({ hours_per_day: 8 });
    this.createJobForm.patchValue({ additional_amount: 0 });
    this.createJobForm.patchValue({ allow_expense: 'Yes' });
    this.createJobForm.patchValue({ week_working_days: 5 });
    const value = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
    this.createJobForm.patchValue({ min_bill_rate: value });
    this.createJobForm.patchValue({ max_bill_rate: value });
    this.preidntified = false;
    this.getQualificationTypes();
    this.candidates = new Array();
  }

  async loadTemplateDetails() {
    this.loadingTemplateDetail = true;
    this.jobService.get(`/job-manager/programs/${this.programId}/job-templates/${this.selectedTemplate.id}`).subscribe({
      next: (tempDetail: any) => {
        this.selectedTemplate = tempDetail?.job_template;
        this.isQualificationEnabled = this.selectedTemplate?.is_qualification_enabled;
        if (this.selectedTemplate?.description) {
          this.createJobForm.patchValue({ description: this.stringToHTML(this.selectedTemplate.description)?.innerHTML });
          this.quillInputTxt = this.stringToHTML(this.selectedTemplate.description)?.innerHTML;
        }
        tempDetail = tempDetail?.job_template;
        this.isAvailableStartDateLimit = tempDetail?.available_start_date_limit;
        this.selectedTemplate.hierarchies = tempDetail?.hierarchy;
        if (!(this.currentProgram?.config?.job?.default_to_root_hierarchy ?? false)) {
          this.intersectHierarchies(tempDetail.hierarchy);
        } else {
          if (this.currentProgram?.config?.job?.default_to_root_hierarchy) {
            if (
              !this.hierarchyData.filter(h => h.id === this.currentProgram?.root_hierarchy?.id)?.length &&
              Object.keys(this.currentProgram?.root_hierarchy)?.length
            ) {
              this.hierarchyData = [
                {
                  id: this.currentProgram?.root_hierarchy?.id,
                  name: this.currentProgram?.root_hierarchy?.name,
                  hierarchies: [],
                },
              ];
            } else {
              this.hierarchyData[0].hierarchies = [];
            }
          }
          this.basicJobInfo.selectedHierarchy = this.hierarchyData[0];
          this.hierarchyFlattenArray = [];
          this.flattenHierarchyArray([...this.hierarchyData]);
          this.hierarchyReferenceCopy = [];
          this.getHierarchyRefFlat(this.hierarchyData);
          this.changeDefaultHierarchy(true);
        }
        if(this.isCreateFromTemplate) {
          this.init();
        }
        this.selectedTemplate.qualifications = tempDetail?.qualifications;
        if (tempDetail?.foundational_data && tempDetail?.foundational_data?.length > 0) {
          this.selectedTemplate.foundational_data = this.jobService?.setFoundationFields(tempDetail?.foundational_data);
          // this.jobData.foundational_data = new Array();
          if(!this.jobData?.foundational_data) {
            this.jobData.foundational_data = []
          }
          this.jobData.foundational_data = [...this.jobData.foundational_data, ...this.selectedTemplate.foundational_data];
        }
        this.selectedTemplate.rates = tempDetail?.rates;
        // this.selectedTemplate.background_check_list = tempDetail?.background_check_list;
        this.selectedTemplate.is_onboarding_checklist = tempDetail?.is_onboarding_checklist;
        this.selectedTemplate.is_ot_exempt = tempDetail?.is_ot_exempt;
        this.selectedTemplate.configuredCheckList = tempDetail?.checklist;
        this.selectedTemplate.user_roles = tempDetail?.user_roles;
        this.selectedTemplate.qualification_types = tempDetail?.qualification_types;
        this.selectedTemplate.resume_mandatory = tempDetail?.resume_mandatory;
        this.showExpenseAllowed = this.selectedTemplate?.is_expense_allowed;
        this.editExpenseAllowed = this.selectedTemplate?.is_expense_allowed_editable;
        this.showTimesheetType = this.selectedTemplate?.allow_express_offer;
        this.jdParsingFile = tempDetail?.jd_parsing_file?.length > 0 ? [tempDetail?.jd_parsing_file?.[0]] : [];
        this.jobDescriptionFile = tempDetail?.jd_parsing_file?.[0];
        // this.selectedTemplate.isbackgroundChecks = tempDetail?.is_background_check;
        // this.createJobForm?.patchValue({
        //   is_background_check: this.selectedTemplate.isbackgroundChecks
        // });
        this.is_ot_exempt = tempDetail?.is_ot_exempt;
        this.setQualifications();
        this.selectedTemplate = { ...this.selectedTemplate };
        if (this.selectedTemplate && this.selectedTemplate.rates && this.selectedTemplate.rates.length > 0) {
          this.selectedTemplate.rates.forEach(element => {
            element.name = element?.rate_factor;
            if (element?.bill_rate && element?.bill_rate?.length > 0) {
              element?.bill_rate?.forEach((br, i) => {
                br.rate = br?.rate_type;
                if (br.factor) {
                  br.factor = this.accuracyPipe.transform((br.factor),AccuracyConfigEnum.RATE,{isEdit: true});
                }
                if (i === 1) {
                  br.is_remove_rate = true;
                  element.is_bill_last = 'rate';
                }
              });
            }
            if (element?.pay_rate && element?.pay_rate?.length > 0) {
              element?.pay_rate?.forEach((br, i) => {
                br.rate = br?.rate_type;
                if (br.factor) {
                  br.factor = this.accuracyPipe.transform((br.factor),AccuracyConfigEnum.RATE,{isEdit: true});
                }
                if (i === 1) {
                  br.is_remove_rate = true;
                  element.is_pay_last = 'rate';
                }
              });
            }
          });
          this.createJobForm.patchValue({
            rates: this.rateFactor?.length
              ? this.rateFactor.filter(rf => this.selectedTemplate?.rates?.map(a => a.id)?.includes(rf.id))
              : this.selectedTemplate?.rates,
            is_ot_exempt: this.selectedTemplate?.is_ot_exempt,
          });
        }
        this.isEditDescription();
        this.updateRateFactorList();
      /*UAT to development merge: Need to revisit*/
      /* if (this.managerList && this.managerList?.length > 0 && this.userType !== 'MSP') {
          setTimeout(() => { */
        // let account = this.localStorage.get(StorageKeys?.CURRENT_ACCOUNT);
        // let isMsp = account?.role?.organization_category === 'MSP' ? true : false;
        // setTimeout(() => {
        //     if (this.managerList && this.managerList?.length > 0) {
        //     if(!isMsp){
        //       this.loadDefaultJobValue(this.managerList[0]);
        //       this.createJobForm.patchValue({
        //         job_manager: this.managerList[0],
        //       });
        //     }
        //   }
        // }, 500);

        this.loadingTemplateDetail = false;
      },
      error: (err) => {
        this.loadingTemplateDetail = false;
      },
  });
  }

  loadDefaultJobValue(value) {
    this.isJobManagerChanged = true;
    if (value) {
      this._loader.show();
      this.loadingTemplateDetail = true;
      this.jobService.get(`/configurator/programs/${this.programId}/members/${value?.id}`).subscribe({
        next: (result: any) => {
          this._loader.hide();
          if(!(this.currentProgram?.config?.job.default_to_root_hierarchy ?? false)) {
            const isHierarchyEntity = result?.member?.defaults?.find(defaultEntities => defaultEntities?.entity_type?.toUpperCase() === 'HIERARCHY');
            if(isHierarchyEntity?.entity_id) {
              this.jobManagerDefaultHierarchy = isHierarchyEntity?.entity_id;
            } else {
              this.jobManagerDefaultHierarchy = null;
            }
          if(this.isCreateFromTemplate) {
            this.jobManagerHierarchies = [];
            result?.member?.hierarchies?.forEach((res)=>{
              this.jobManagerHierarchies.push(res?.id,...res?.sub_hierarchies);
            });
            this.jobManagerHierarchies = [...new Set(this.jobManagerHierarchies)];
            this.hierarchyFlattenArray.forEach(a => {
              a['isDisabled'] = true;
              if (this.selectedTemplate.hierarchies.some(b => b.id === a.id) && (this.jobManagerHierarchies.some(b => b === a?.id))) {
                a['isDisabled'] = false;
              }
            });
            this.hierarchyReferenceCopy.forEach(a => {
              a['isDisabled'] = true;
              if (this.selectedTemplate.hierarchies.some(b => b.id === a.id) && (this.jobManagerHierarchies.some(b => b === a?.id))) {
                a['isDisabled'] = false;
              }
            });
            this.hierarchyFlattenArray = _.cloneDeep(this.hierarchyFlattenArray);
          } else if (!this.jobId) {
            this.intersectManagerHierarchy(result?.member);
          } else if (this.name !== JOB_STATE.EDIT_APPROVED_JOB) {
            this.jobManagerHierarchies = [];
            result?.member?.hierarchies?.forEach((res) => {
              this.jobManagerHierarchies.push(res?.id,...res?.sub_hierarchies);
            });
            this.jobManagerHierarchies = [...new Set(this.jobManagerHierarchies)];
            const filterIntersectHierarchy = (hierarchy) => {
              if(this.jobManagerHierarchies?.some((h)=> h == hierarchy?.id) && this.selectedTemplate.hierarchy?.some(h=>h?.id == hierarchy?.id)) {
                hierarchy.isDisabled = false;
              } else {
                hierarchy.isDisabled = true;
              }
            }
            this.hierarchyFlattenArray?.forEach(filterIntersectHierarchy);
            this.hierarchyReferenceCopy?.forEach(filterIntersectHierarchy);
            this.hierarchyFlattenArray = _.cloneDeep(this.hierarchyFlattenArray);
            if (this.jobManagerDefaultHierarchy) {
              const defaultHierarchy = this.hierarchyReferenceCopy?.find(hier => hier?.id === this.jobManagerDefaultHierarchy);
              if (this.jobManagerDefaultHierarchy && defaultHierarchy && !defaultHierarchy?.isDisabled) {
                this.basicJobInfo.selectedHierarchy = defaultHierarchy;
                this.changeDefaultHierarchy(true);
              } else {
                this.clearHierarchy();
              }
            } else {
              this.clearHierarchy();
            }
            this._changeDetectorRef.detectChanges();
          }
        }

          if(!this.jobId && !this.showJobType && (this.isHierarchyIntersectionPresent || this.currentProgram?.config?.job.default_to_root_hierarchy)) {
            this.isHierarchyIntersectionPresent = true;
            this.tempRecentArray = [];
            this.tempPopularArray = [];
            this.getRecentJobList((this.pageNo = 1));
            this.getPopularJobList((this.pageNo = 1));
          } else if(!this.isHierarchyIntersectionPresent) {
            this.tempRecentArray = [];
            this.tempPopularArray = [];
          }
          if (this.currentProgram.config?.is_customized_foundational_data) {
            const foundationalControl = this.foundationalFieldsComp.foundationalDataArray.controls.find(x => x.value.slug === 'gl_account');
            if (foundationalControl) {
              if (!this.originalGLAccountOptions) {
                this.originalGLAccountOptions = foundationalControl.get('options').value;
              }
              let defaultValues = result.member?.defaults;
              const customFoundationalData = (defaultValues || []).find(values => values.entity_type === 'CUSTOM_FOUNDATIONAL_DATA');
              if (
                customFoundationalData &&
                customFoundationalData.custom_foundational_data &&
                customFoundationalData.custom_foundational_data.length
              ) {
                foundationalControl.patchValue({ options: customFoundationalData.custom_foundational_data });
              } else {
                foundationalControl.patchValue({ options: this.originalGLAccountOptions });
              }
            }
          }
          if (result?.member) {
            let defaultValues = result?.member?.defaults;
            if (defaultValues && defaultValues.length > 0) {
              this.patchDefaultValues(defaultValues, result);
            } else {
              this.jobManagerAssociatedWorkLocation = [];
              this.createJobObject.locations = this.workLocationArr;
              this.createJobForm.patchValue({ locations: null });
            }
          } else {
            // this.createJobObject.rateOption = this.rateCardOption;
          }
          this.loadingTemplateDetail = false;
        },
        error: err => {
          this.loadingTemplateDetail = false;
          this.isUserLocation = false;
          this._loader.hide();
          this.showError('Error while loading the selected manager details.');
        },
    });
    }
  }

  intersectManagerHierarchy(result) {
    this.jobManagerHierarchies = [];
    result?.hierarchies?.forEach((res)=>{
      this.jobManagerHierarchies.push(res?.id,...res?.sub_hierarchies);
    });
    if(this.jobManagerHierarchies?.length == 0) {
      this.hierarchyReferenceCopy.forEach(a => {
        a['isDisabled'] = true;
      });
      this.hierarchyFlattenArray.forEach(a => {
        a['isDisabled'] = true;
      });
      this.showError('No Job Template can be selected as no Hierarchies are assosiated for this Job Manager.');
      this.isHierarchyIntersectionPresent = false;
      return;
    }
    this.jobManagerHierarchies = [...new Set(this.jobManagerHierarchies)];
    this.logs = undefined;
    const hierarchyIntersect = this.hierarchyFlattenArray.filter(a => this.jobManagerHierarchies?.some(b => b === a?.id));
    if (hierarchyIntersect?.length) {
      this.hierarchyFlattenArray.forEach(a => {
        a['isDisabled'] = true;
        if (this.jobManagerHierarchies.some(b => b === a?.id)) {
          a['isDisabled'] = false;
        }
      });
      this.hierarchyReferenceCopy.forEach(a => {
        a['isDisabled'] = true;
        if (this.jobManagerHierarchies.some(b => b === a?.id)) {
          a['isDisabled'] = false;
        }
      });
      this.isHierarchyIntersectionPresent = true;
    } else {
      this.showError('Logged in user and Job manager are not associated with a common Hierarchy, thus no Job Template is available for selection. Please select a different Job Manager.');
      this.isHierarchyIntersectionPresent = false;
      this.hierarchyReferenceCopy.forEach(a => {
        a['isDisabled'] = true;
      });
      this.hierarchyFlattenArray.forEach(a => {
        a['isDisabled'] = true;
      });
    }
  }

  patchDefaultValues(values, memberDetails) {
    this.jobData.foundational_data = new Array();
    if(this.name!=="editApprovedJob") {
      this.createJobForm.patchValue({ locations: null });
    }
    let isLocationChanges = false
    this.isUserLocation = false;
    if (values && values?.length > 0) {
      values?.forEach(element => {
        if (element?.entity_type === 'HIERARCHY') {
          // this.selectHierarchy([element?.entity_id]);
        } else if (element?.entity_type === 'FOUNDATIONAL_DATA') {
          let foundational_value = {
            foundational_data_type: element?.foundational_data_type,
            id: element?.entity_id,
            name: element?.entity_object?.name,
            code: element?.entity_object?.code,
            custom_fields: element?.entity_object?.custom_fields
          };
          let isPresent = this.jobData.foundational_data.some(f => f?.id === element?.entity_id);
          if (!isPresent) {
            this.jobData.foundational_data.push(foundational_value);
          }
        } else if (element?.entity_type === 'CUSTOM_FIELD') {
          let slug = element?.slug;
          let custom_value = {};
          custom_value[slug] = element?.entity_object?.value;
          this.jobData.custom_fields = custom_value;
        } else if (element?.entity_type === 'WORK_LOCATION') {
          isLocationChanges = true;
          if (this.name !== 'editApprovedJob') {
            this.createJobObject.locations =
              memberDetails?.member?.work_locations?.length > 0 ? memberDetails?.member?.work_locations : this.workLocationArr;
            this.jobManagerAssociatedWorkLocation = [...memberDetails?.member?.work_locations];
            const dropDownList = this.createJobObject?.locations || [];
            const hasValue = dropDownList.some(opt => opt?.id === element?.entity_id);
            let index = dropDownList.findIndex(opt => opt?.id === element?.entity_id);
            if (hasValue) {
              this.createJobForm.patchValue({ locations: element?.entity_id });
              this.createJobObject.selectedLocation = [dropDownList[index]];
            } else {
              this.createJobObject.locations = [...this.createJobObject.locations, element.entity_object];
              this.createJobForm.patchValue({ locations: element?.entity_id });
              this.createJobObject.selectedLocation = [element.entity_object];
            }
            this.isUserLocation = true;
            this.getCurrencies(this.createJobObject?.selectedLocation[0]?.currencies);
            this.getRateCard();
          }
        } else if (element?.entity_type === 'CURRENCY') {
          const dropDownList = this.createJobObject?.currencies || [];
          const hasValue = dropDownList.some(opt => opt?.name?.toLowerCase() === element?.entity_object?.name?.toLowerCase());
          if (hasValue) {
            this.createJobForm.patchValue({ currency: element?.entity_object?.name });
            this.getRateCard();
          }
        }
      });
      if(this.name!=="editApprovedJob" && !isLocationChanges) {
        this.createJobObject.locations = memberDetails?.member?.work_locations?.length > 0 ? memberDetails?.member?.work_locations : this.workLocationArr;
        this.jobManagerAssociatedWorkLocation = [...memberDetails?.member?.work_locations];
        if(memberDetails?.member?.work_locations?.length == 1) {
          this.createJobForm.patchValue({ locations: memberDetails?.member?.work_locations?.[0]?.id });
          this.createJobObject.selectedLocation = [memberDetails?.member?.work_locations?.[0]];
        }
        this.getCurrencies(this.createJobObject?.selectedLocation?.[0]?.currencies);
        this.getRateCard();
      }
    }
      const removeJobManagerFD = (res) => {
        const fdInJobManager = this.jobData.foundational_data?.find((jmFd) => jmFd?.foundational_data_type?.id == res?.foundational_data_type?.id);
        if (fdInJobManager) {
          fdInJobManager.is_read_only = res['is_read_only'];
          return false;
        }
        return true;
      }
      const templateFd = this.selectedTemplate.foundational_data?.filter(removeJobManagerFD) || [];
      this.jobData.foundational_data = [...templateFd, ...this.jobData.foundational_data];
      this.updateLocationTooltipData();
  }

  resetJobFields =() : void => {
    this.jobData.foundational_data = new Array();
    if (this.name !== 'editApprovedJob') {
      this.createJobForm.patchValue({ locations: null });
      this.createJobObject.selectedLocation = null;
      this.updateLocationTooltipData();
    }
  }

  loadJobDetails() {
    this._loader.show();
    this.loadingTemplateDetail = true;
    this.route?.data.subscribe({
      next: (tempDetail: any) => {
        this._loader.hide();
        if(tempDetail?.jobResolvedData?.is_error) {
          this._loader.hide();
          this.loadingTemplateDetail = false;
          this.showError(tempDetail?.jobResolvedData?.error);
          return;
        }
        tempDetail = tempDetail?.jobResolvedData?.job;
        if(tempDetail?.status?.toUpperCase()=='DRAFT' || this.visibility == 'clonejob') {
          this.isQualificationEnabled = this.selectedTemplate?.is_qualification_enabled;
          this.isAvailableStartDateLimit = {...this.selectedTemplate?.available_start_date_limit}
        } else {
          this.isQualificationEnabled = tempDetail?.is_qualification_enabled;
          this.isAvailableStartDateLimit = {...tempDetail?.available_start_date_limit}
        }
        this._changeDetectorRef.detectChanges();
        this.isHierarchyIntersectionPresent = true;
        // this.selectedTemplate.background_check_list = tempDetail?.background_check_list;
        // this.selectedTemplate.isbackgroundChecks = tempDetail?.is_background_check;
        this.selectedTemplate.is_onboarding_checklist = tempDetail?.is_onboarding_checklist;
        this.selectedTemplate.configuredCheckList = tempDetail?.checklist;
        this.selectedTemplate.rates = tempDetail?.rates
        this.isMaxBudgetCalculation = tempDetail?.estimate_budget_type?.toLowerCase() === "max_budget";
        // this.getbackgroundChecks();
        // this.getOnBoardingCheckList();

        this.selectedJobType = tempDetail?.job_type?.[0] ?? null;
        if(this.showJobType && this.selectedJobType){
          this.selectJobType(this.selectedJobType);
        }
        this.patchData(tempDetail);
        this.jobData = tempDetail;
        Object.keys(this.jobData?.custom_fields)?.forEach(x => {
          if (typeof this.jobData?.custom_fields?.[x] === 'object' && Object.keys(this.jobData?.custom_fields?.[x]).length === 0)
              this.jobData.custom_fields[x] = undefined;
        });
        if(this.accountCodeCreationActive){
          this.accountCode = tempDetail.account_code_data;
          if(this.accountCode){
            this.createJobForm.patchValue({
              account_code:  this.accountCode.account_code
            })
          }
        }
        this.loadingTemplateDetail = false;
        if (this.jobData?.foundational_data && this.jobData?.foundational_data?.length > 0) {
          this.jobData.foundational_data = this.jobService?.setFoundationFields(this.jobData?.foundational_data);
          this.jobData.foundational_data?.forEach((jobFd)=>{
            const isFDInTemplate = this.selectedTemplate.foundational_data?.find((tempFd)=>tempFd?.foundational_data_type?.id == jobFd?.foundational_data_type?.id);
            if(isFDInTemplate) {
              jobFd.is_read_only = isFDInTemplate['is_read_only']
            }
          });
        }
      },
      error: err => {
        this._loader.hide();
        this.loadingTemplateDetail = false;
      },
  });
  }

  setRates(data) {
    let setData = [];
    if (data) {
      data?.forEach(d => {
        if (this.rateFactor.find(x => x.id === d.id)) {
          d.name = this.rateFactor.find(x => x.id === d.id).name;
          setData.push(d);
        }
      });
    }
    return setData;
  }

  async patchData(tempDetail) {
    const managerData = await this.getMemberById(tempDetail?.job_manager?.id)?.toPromise();
    if (!(this.currentProgram?.config?.job.default_to_root_hierarchy ?? false)) {
      managerData?.hierarchies?.forEach((res)=>{
        this.jobManagerHierarchies.push(res?.id,...res?.sub_hierarchies);
      });
      this.jobManagerHierarchies = [...new Set(this.jobManagerHierarchies)];
      this.intersectHierarchies(this.selectedTemplate.hierarchy, true);
    } else {
      if (this.userType !== 'SUPER_ORG' && this.currentProgram?.config?.job?.default_to_root_hierarchy) {
        if (
          !this.hierarchyData.filter(h => h.id === this.currentProgram?.root_hierarchy?.id)?.length &&
          Object.keys(this.currentProgram?.root_hierarchy)?.length
        ) {
          this.hierarchyData = [
            {
              id: this.currentProgram?.root_hierarchy?.id,
              name: this.currentProgram?.root_hierarchy?.name,
              hierarchies: [],
              is_enabled: true
            },
          ];
        } else {
          this.hierarchyData[0].hierarchies = [];
        }
        this.hierarchyFlattenArray = [];
        this.flattenHierarchyArray(this.hierarchyData);
        this.hierarchyReferenceCopy = [];
        this.getHierarchyRefFlat(this.hierarchyData);
      }
    }
    this.init(managerData);
    this.ratemodel = tempDetail?.rate_model;
    const minRate = this.ratemodel == "PAY_RATE" ? (Number(tempDetail?.min_pay_rate) ?? 0) : (Number(tempDetail?.min_bill_rate) ?? 0);
    const maxRate = this.ratemodel == "PAY_RATE" ? (Number(tempDetail?.max_pay_rate) ?? 0) : (Number(tempDetail?.max_bill_rate) ?? 0);
    let descriptionHTML = "";
    if(tempDetail?.description) {
      descriptionHTML = this.stringToHTML(tempDetail?.description)?.innerHTML;
    }
    if(tempDetail?.status?.toUpperCase()!='DRAFT' && this.name !== 'clonejob') {
      this.showExpenseAllowed = tempDetail?.is_expense_allowed_display;
      this.editExpenseAllowed = tempDetail?.is_expense_allowed_editable;
      this.createJobForm.patchValue({
        allow_expense: tempDetail?.is_expense_allowed ? 'Yes' : 'No',
      });
      this.showTimesheetType = tempDetail?.allow_express_offer;
    }
    if(this.name !== 'clonejob') {
      this.candidates = tempDetail?.pre_candidates?.map(candidate => {
        return {
          ...candidate?.data,
          id: candidate?.id,
          candidate_id: candidate?.candidate_id,
          vendorName: {
            id: candidate?.data?.vendor_id,
            name: candidate?.data?.vendor_name
          }
        }
      });
      if(this.candidates?.length > 0) {
        this.addCandidate = this.preidntified = this.disablePreIdToggle = true;
      }
    }
    this.createJobForm.patchValue({
      locations: tempDetail?.location?.id,
      num_resources: tempDetail?.positions,
      min_bill_rate: this.accuracyPipe.transform(minRate, AccuracyConfigEnum.RATE, { isEdit: true }),
      max_bill_rate: this.accuracyPipe.transform(maxRate, AccuracyConfigEnum.RATE, { isEdit: true }),
      currency: tempDetail?.currency,
      unit_of_measure: tempDetail?.unit_of_measure ? tempDetail.unit_of_measure.toLowerCase() : null,
      description: descriptionHTML,
      rates: this.setRates(tempDetail?.rates),
    // is_background_check: tempDetail?.is_background_check,
      is_ot_exempt: tempDetail?.is_ot_exempt,
      week_working_days: tempDetail?.day_per_week,
      hours_per_day: tempDetail?.estimated_hours,
      adjustment_value: tempDetail?.adjustment_value,
      additional_amount: tempDetail?.additional_amount,
      adjustment_type: tempDetail?.adjustment_type,
      timesheetType: tempDetail?.timesheet_type
    });
    this.createJobObject.currencySymbol = this.getCurrencySymbol(tempDetail?.currency);
    this.jdParsingFile = Array.isArray(tempDetail?.jd_parsing_file) ? (tempDetail?.jd_parsing_file?.length > 0 ? [tempDetail?.jd_parsing_file?.[0]] : []) : (_.isEmpty(tempDetail?.jd_parsing_file) ? [] : [tempDetail?.jd_parsing_file]);
    this.uploadJD = Array.isArray(tempDetail?.job_description_file) ? tempDetail?.job_description_file : (_.isEmpty(tempDetail?.job_description_file) ? [] : [tempDetail?.job_description_file]);
    this.jobDescriptionFile = tempDetail?.jd_parsing_file?.[0];
    this.quillInputTxt = this.stringToHTML(tempDetail?.description)?.innerHTML;
    if(tempDetail?.location?.id) {
      this.isUserLocation = true;
    }
    this.is_ot_exempt = tempDetail?.is_ot_exempt;
    if (tempDetail && tempDetail.hierarchy?.length) {
      this.createJobForm.patchValue({
        hierarchy:
          this.visibility === 'clonejob'
            ? this.hierarchyFlattenArray?.find(x => x.is_enabled === true && x.id === tempDetail.hierarchy[0].id)?.name
            : tempDetail.hierarchy[0].name,
      });
      this.selectHierarchy([
        this.visibility === 'clonejob'
          ? this.hierarchyFlattenArray?.find(x => x.is_enabled === true && x.id === tempDetail.hierarchy[0].id)?.id
          : tempDetail.hierarchy[0].id
      ],true);
      (this.basicJobInfo.selectedHierarchy =
        this.visibility === 'clonejob'
          ? this.hierarchyFlattenArray?.find(x => x.is_enabled === true && x.id === tempDetail.hierarchy[0].id)
          : tempDetail.hierarchy[0]);
      this.changeDefaultHierarchy(true, new Date(tempDetail.start_date), tempDetail.program_industry[0], true,true);
      this.createJobForm.patchValue({
        start_date: tempDetail.start_date && this.visibility !== 'clonejob' ? this.datePipe.transform(tempDetail?.start_date?.split('T')?.[0],'','','',true) : null,
        end_date: tempDetail.end_date && this.visibility !== 'clonejob' ? this.datePipe.transform(tempDetail?.end_date?.split('T')?.[0],'','','',true) : null,
      });
      let start_date = new Date(tempDetail.start_date);
      start_date.setDate(start_date.getDate() - 1);
      this.options = {
        language: 'English',
        timepicker: true,
        format12h: true,
        range: false,
        enabledDateRanges: this.visibility === 'clonejob' ? [] : tempDetail.start_date ? [{ start: start_date }] : [],
      };
      this.options2 = {
        language: 'English',
        timepicker: true,
        format12h: true,
        range: false,
        enabledDateRanges:
          this.visibility === 'clonejob' ? [] : tempDetail.start_date ? [{ start: start_date, end: this.getEndRange(start_date) }] : [],
      };
    }
    let manager = this.managerList?.find(m => m?.id === tempDetail?.job_manager?.id);
    const index = this.managerList?.findIndex(m => m?.id === tempDetail?.job_manager?.id);
    if (manager) {
      this.createJobForm.patchValue({
        job_manager: manager,
      });
      this.managerList[index] = manager;
      if(managerData?.work_locations?.length > 0) {
        this.createJobObject.locations = this.jobManagerAssociatedWorkLocation = [...managerData?.work_locations];
      }
    } else {
      manager = managerData;
      if(manager?.work_locations?.length > 0) {
        this.createJobObject.locations = this.jobManagerAssociatedWorkLocation = [...manager?.work_locations];
      }
      if (manager  && manager?.is_enabled) {
        this.createJobForm.patchValue({
          job_manager: manager,
        });
        this.managerList.push(manager);
        this.managerList = this.sortMembers(this.managerList);
      }
      if(manager && !manager?.is_enabled) {
        this.isJobManagerDisabled = `${manager?.full_name} is currently inactive.`
      }
    }
    if(this.jobData.location && this.createJobObject.locations && this.createJobObject.locations.length > 0){
      if(!this.createJobObject.locations.find(loc => loc.id == this.jobData.location.id)) {
        this.createJobObject.locations = [...this.createJobObject.locations,this.jobData.location];
      }
    }
    if(tempDetail?.status?.toUpperCase()=='DRAFT' || this.visibility == 'clonejob') {
      if(!Array.isArray(tempDetail?.qualification_types)) {
        tempDetail.qualification_types = new Array();
      }
      if(!Array.isArray(this.selectedTemplate?.qualification_types)) {
        this.selectedTemplate.qualification_types = new Array();
      }
      this.selectedTemplate.qualification_types = [...tempDetail?.qualification_types, ...this.templateQualificationData];

    } else {
      this.selectedTemplate.qualification_types = tempDetail?.qualification_types || [];
    }
    if (this.qualification_types && this.qualification_types.length > 0) {
      this.setQualifications();
    }

    const startDateRange = tempDetail.start_date ? new Date(tempDetail.start_date) : new Date();
    startDateRange.setDate(startDateRange.getDate() - 1);
    this.options = {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [],
    };
    this.options2 = {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
      enabledDateRanges: [{ start: startDateRange, end: this.getEndRange(startDateRange)}],
    };
    //  this.updateFoudationalForm();
    this.getCurrencies(tempDetail?.location?.currencies, true);
    this.changeLocation(tempDetail?.location?.id, true);
    this._changeDetectorRef.detectChanges();
    this.updateLocationTooltipData();
  }

  setQualifications() {
    if((this.jobId && !this.jobData) || (Array.isArray(this.qualification_types) && this.qualification_types?.length  == 0) || !this.qualification_types) {
      return;
    }
    let _this = this;
    if (this.qualification_types?.length > 0 && this.selectedTemplate?.qualification_types?.length > 0) {
      this.qualification_types.forEach(qualification => {
        _this.selectedTemplate.qualification_types.forEach((templateQualification) => {
          if (qualification?.id === templateQualification?.id) {
            if(!Array.isArray(qualification?.values)) {
              qualification.values = [];
            }
            qualification.values = [...qualification?.values, ...templateQualification?.qualifications];
            qualification.selected = true;
            qualification.is_required = templateQualification?.is_required;
            qualification.is_locked= false;
            qualification.values = this.uniqueKeyPipe.transform(qualification?.values, 'id');
          }
        });
      });
      this.updateQualification();
    }
  }

  changePage(event) {
    if (event && event.type === 'changeTemplate') {
      this.tabIndex = 0;
    } else if (event && event.type === 'saveBasic') {
      this.tabIndex = event.value;
    } else if (event && event.type === 'saveQualification') {
      this.tabIndex = event.value;
    } else if (event.type === 'changeHierarchy') {
      this.sidebarOpen();
    } else if (event.type === 'saveJobDetails') {
      this.tabIndex = event.value;
    } else if (event.type === 'jobDetails') {
      this.tabIndex = event.value;
    } else if (event.type === 'saveJob') {
      this.saveJob();
    } else if (event.type === 'jobInfo') {
      this.tabIndex = event.value;
    } else if (event.type === 'jobDistribution') {
      this.tabIndex = event.value;
    }
  }

  getJobTemplate() {
    this.loading = true;
    this.logs = undefined;
    this.templateData = [];
    let query = `?limit=10&page=1&is_enabled=True${this.searchTerm ? '&template_name=' + encodeURIComponent(this.searchTerm) : ''}${this.showJobType ? ('&job_type=' + this.selectedJobType + '&include_null_job_type=true') : ''}`;
    let hierarchyIds = this.hierarchyData?.filter(hi => !hi?.isDisabled)?.map(hi => hi?.id);
    if(!this.currentProgram?.config?.job?.default_to_root_hierarchy) {
      query+= hierarchyIds.length > 0 ? '&hierarchies_ids=' + hierarchyIds?.join() : '';
    }
    const url = `/job-manager/programs/${this.programId}/job-templates` + query;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        this.loading = false;
        if (data && data.job_templates && data.job_templates.length > 0) {
          this.templateData = data.job_templates;
          this.tableLoaded = true;
        } else {
          this.templateData = [];
          if (this.searchTerm) {
            this.showError(`${this.searchTerm} Job template or title doesn't exist`);
          }
        }
      },
      error: error => {
        this.showError(error);
        this._loader.hide();
        this.loading = false;
        this.templateData = [];
      },
  });
  }

  setVals(data, key) {
    return data[0].hasOwnProperty(key) ? data.map(a => a[key]).sort().join(', ') : data.join(', ');
  }

  sidebarClose() {
    this.seletHierarchy = 'hidden';
    this.logs = undefined;
    if (!this.isHierarchySelected) {
      this.showError('Please select hierarchy');
    } else {
      this.fetchTimesheetTypes();
    }
  }

  sidebarOpen() {
    if (this.name === 'editApprovedJob') {
      return;
    }
    this.seletHierarchy = 'visible';
  }

  changeDefaultHierarchy(loadData, startDate?, laborCategory?, doNotLoadRateCard?,isEdit?) {
    this.selectedHierarchyLevel = this.basicJobInfo.selectedHierarchy;
    if (this.basicJobInfo.selectedHierarchy) {
      this.getTenure(this.basicJobInfo.selectedHierarchy.id, loadData, startDate);
      if (loadData) {
        this.jobService.get(`/configurator/programs/${this.programId}/hierarchy/${this.basicJobInfo.selectedHierarchy.id}`).subscribe({
          next: (data: any) => {
            data.hierarchy.industries = [];
            if (data?.hierarchy?.industries?.length) {
              this.filteredLaborCategories = this.labor_categories.filter(x => data?.hierarchy?.industries.includes(x.id));
              this.createJobForm.patchValue({
                labor_category: laborCategory?.id ? laborCategory?.id : this.filteredLaborCategories.length === 1 ? this.filteredLaborCategories[0].id : null
              })
              this.readOnlyLaborCategory = data?.hierarchy?.industries?.length === 1;
            } else {
              if (!isEdit) {
                this.filteredLaborCategories = this.selectedTemplate?.program_industry?.length > 0 ? this.selectedTemplate?.program_industry : this.labor_categories;
              } else {
                this.filteredLaborCategories = this.labor_categories;
                if(!this.filteredLaborCategories?.find((res)=>res?.id == laborCategory?.id) && laborCategory) {
                  this.filteredLaborCategories.push(laborCategory);
                }

              }
              this.createJobForm.patchValue({
                labor_category: laborCategory?.id ? laborCategory?.id : (this.selectedTemplate?.program_industry?.length > 0 ? this.selectedTemplate?.program_industry[0]?.id : null),
              });
              this.readOnlyLaborCategory = !!this.selectedTemplate?.program_industry?.[0]?.id;
            }
          },
          error: error => {
            console.error('Error', error)
          }
      })
      } else {
        this.filteredLaborCategories = this.labor_categories;
      }
      this.createJobForm.patchValue({ hierarchy: this.basicJobInfo.selectedHierarchy?.name });
      this.enforcedRateCard = this.basicJobInfo.selectedHierarchy?.is_rate_card_enforced;
      this.defaultHierarchy = [this.basicJobInfo.selectedHierarchy?.id];
      if (!doNotLoadRateCard) {
        this.getRateCard();
      }
      // this.getCurrencies();
      // const prevDateFormat = this.dateFormat;
      // this.dateFormat = this.basicJobInfo?.selectedHierarchy?.preferred_date_format ?? prevDateFormat;
      if (this.createJobForm.get('start_date').value || this.createJobForm.get('end_date').value) {
        const starDate = this.createJobForm.get('start_date').value;
        const endDate = this.createJobForm.get('end_date').value;
        this.createJobForm.patchValue({
          start_date: starDate ? this.datePipe.transform(starDate, null, null, null, true, this.dateFormat) : null,
          end_date: endDate ? this.datePipe.transform(endDate, null, null, null, true, this.dateFormat) : null,
        });
      }
      this.ratemodel = this.basicJobInfo.selectedHierarchy.rate_model ?? this.ratemodel ?? this.currentProgram.config.program_model;
      this.mapHierarchyRateModel(this.hierarchyData, this.ratemodel);
      this.getQualificationTypes();
      this.getAllRatefactorList();
      this._changeDetectorRef.detectChanges();
      this.sidebarClose();
    } else {
      this.sidebarClose();
    }
  }

  selectHierarchy(event , isHierarchyArray?, changeDefaultHier? , isHierarchyChangedFromSidebar?) {
      if(this.name==='editApprovedJob') return;
      if(!isHierarchyArray) {
        if(event?.id) {
          event = [event?.id];
        } else {
          event = [];
        }
      }
      if(event[0] == this.basicJobInfo?.selectedHierarchy?.id && isHierarchyChangedFromSidebar && this.filteredLaborCategories?.length > 0) {
        this.isHierarchySelected = true;
        this.createJobForm.patchValue({ hierarchy: this.basicJobInfo.selectedHierarchy.name });
        this.defaultHierarchy = [event[0]];
        this.sidebarClose();
        return;
      }
      if (event && event.length > 0) {
        this.changeHierarchy(event, this.hierarchyData);
        this.isHierarchySelected = true;
        if(changeDefaultHier) {
          this.changeDefaultHierarchy(true);
        }
      } else {
        this.isHierarchySelected = false;
      }
  }

  // get hierarchy available in this program
  hierarchyList() {
    const url =
      '/configurator/programs/' +
      this.programId +
      '/hierarchy' +
      (this.userType === 'MSP' || this.userType === 'CLIENT' ? '?user_id=' + this.currentUser?.id : '');
    this.jobService.get(url).subscribe((data: any) => {
      if (data && data?.result[0]?.hierarchies && data?.result[0]?.hierarchies.length > 0) {
        this.hierarchyData =
        this.visibility === 'clonejob' ? data?.result[0]?.hierarchies.filter(x => x.is_enabled === true) : data?.result[0]?.hierarchies;
        this.flattenHierarchyArray(this.hierarchyData);
        this.getHierarchyRefFlat(this.hierarchyData);
        this.extractHierarchyData(this.hierarchyData);
        this.hierarchyData = this.newHierarchyData;
        if (this.hierarchyData && this.hierarchyData.length > 0) {
          this.enforcedRateCard = this.hierarchyData[0].is_rate_card_enforced;
          this.defaultHierarchy = [this.hierarchyData[0].id];
          this.basicJobInfo.selectedHierarchy = this.hierarchyData[0];
          this.userAssociateHierarchy = [this.hierarchyData[0].id];
          this.selectedHierarchyLevel = this.hierarchyData[0];
          this.createJobObject.selectHierarchyData = new Array();
          this.createJobObject.hierarchyData = this.hierarchyData;
          this.isHierarchySelected = true;
          this.ratemodel = this.hierarchyData[0].rate_model ?? this.currentProgram.config.program_model;

          this.getQualificationTypes();
          this.mapHierarchyRateModel(this.hierarchyData, this.ratemodel);
        }
      }
      if(!this.jobId && !this.isCreateFromTemplate) {
        this.init();
      }
    });
    this._changeDetectorRef.detectChanges();
  }

  extractHierarchyData(data): void {
    data?.forEach(elem => {
      if (elem?.is_hidden && elem?.hierarchies.length) {
        this.extractHierarchyData(elem.hierarchies);
      } else {
        this.newHierarchyData.push(elem);
      }
    });
  }

  mapHierarchyRateModel(hierarchyData, ratemodel): void {
    hierarchyData?.forEach(element => {
      if (element?.id) {
        this.hierarchyRateModelMapping.push({
          name: element?.name,
          id: element?.id,
          rate_model: element?.rate_model ?? ratemodel ?? this.currentProgram.config.program_model
        })
        if (element.hierarchies && element.hierarchies.length > 0)
          this.mapHierarchyRateModel(element.hierarchies, element?.rate_model ?? ratemodel ?? this.currentProgram.config.program_model);
      }
    });
  }

  openhierarchy() {
    this.createJobObject.showHierarchy = true;
  }

  changeHierarchy(id, hierarchyData) {
   hierarchyData?.filter(data => {  
      if (data.id === id[0]) {
        this.basicJobInfo.selectedHierarchy = data;
        this.ratemodel = this.hierarchyRateModelMapping.find(x => x.id === data.id)?.rate_model ?? this.ratemodel;
        this.getQualificationTypes();
        return data;
      } else {
        if (data.hierarchies && data.hierarchies.length > 0) {
          data.hierarchies.forEach(element => {
            if (element.id === id[0]) {
              this.basicJobInfo.selectedHierarchy = element;
              this.ratemodel = this.hierarchyRateModelMapping.find(x => x.id === element.id)?.rate_model ?? this.ratemodel;
              this.getQualificationTypes();
              return element;
            } else {
              this.changeHierarchy(id, data.hierarchies);
            }
          });
        }
      }
    });
  }

   // Intersecting the hierarchies of Job Template with User's for better selction of Hierarchy
   intersectHierarchies(templateHierarchies, doNotLoadRateCard?): void {
    let hierarchyIntersect = [];
    this.hierarchyFlattenArray.forEach((a)=>{
      if (templateHierarchies?.some(b => b.id === a.id) && (this.jobManagerHierarchies.some(b => b === a?.id) || this.isCreateFromTemplate)) {
        hierarchyIntersect.push(a);
      }
    });
     if (hierarchyIntersect?.length) {
      this.hierarchyFlattenArray.forEach(a => {
        a['isDisabled'] = true;
        if (templateHierarchies.some(b => b.id === a.id) && (this.jobManagerHierarchies.some(b => b === a?.id) || this.isCreateFromTemplate)) {
          a['isDisabled'] = false;
        }
      });
      this.hierarchyReferenceCopy.forEach(a => {
        a['isDisabled'] = true;
        if (templateHierarchies.some(b => b.id === a.id) && (this.jobManagerHierarchies.some(b => b === a?.id) || this.isCreateFromTemplate)) {
          a['isDisabled'] = false;
        }
      });
      if (hierarchyIntersect?.length === 1) {
        this.basicJobInfo.selectedHierarchy = hierarchyIntersect[0];
        this.changeDefaultHierarchy(true, null, null, doNotLoadRateCard);
      } else if(!this.jobId) {
        const defaultHierarchy = this.hierarchyReferenceCopy?.find(hier => hier?.id === this.jobManagerDefaultHierarchy);
        if(this.jobManagerDefaultHierarchy && defaultHierarchy && !defaultHierarchy?.isDisabled) {
          this.basicJobInfo.selectedHierarchy = defaultHierarchy;
          this.changeDefaultHierarchy(true, null, null, doNotLoadRateCard);
        } else {
          this.defaultHierarchy = null;
        }
      } else {
        this.defaultHierarchy = null;
      }
    } else {
      this.hierarchyFlattenArray.forEach((a)=>{
        a['isDisabled'] = true;
      });
      this.defaultHierarchy = null;
    }
    this.hierarchyFlattenArray = _.cloneDeep(this.hierarchyFlattenArray);
  }


  // Hierarchy Tenure Data
  getTenure(hierarchyId, loadData?, startDate?) {
    this.tenureSpan = this.tenureSpanUnit = this.tenureMessage = null;
    if (hierarchyId && this.currentProgram?.config?.tenure_modules) {
      if (Object.keys(this.currentProgram?.config?.tenure_modules)?.includes(hierarchyId)) {
        if (this.currentProgram?.config?.tenure_modules[hierarchyId]?.find(tm => tm.code.toLowerCase() === 'jobs')) {
          this.jobService.get(`/configurator/programs/${this.programId}/tenures?hierarchy_id=${hierarchyId}`).subscribe({
            next: (data : any) => {
              if (data?.tenures?.length) {
                this.tenureSpan = data?.tenures[0]?.consecutive_employment_span;
                this.tenureSpanUnit = data?.tenures[0]?.consecutive_employment_span_unit?.toLowerCase();
                if (!loadData || this.createJobForm.get('start_date').value) {
                  startDate = startDate ? startDate : this.getDate(this.datePipe.transform(this.createJobForm.get('start_date').value, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
                  this.options2 = {
                    language: 'English',
                    timepicker: true,
                    format12h: true,
                    range: false,
                    enabledDateRanges:
                      this.visibility === 'clonejob' ? [] : startDate ? [{ start: startDate, end: this.getEndRange(startDate) }] : [],
                  };
                }
              }
            },
            error: err => {
              this.showError('Unable to get the tenure details.');
            }
        });
        }
      }
    }
  }

  makeJobObject(payLoad) {
    if (!this.createJobPayLoad) {
      this.createJobPayLoad = {};
    }
    if (!this.createJobPayLoad[payLoad.type]) {
      this.createJobPayLoad[payLoad.type] = {};
    }
    if (payLoad.type === 'jobInfo') {
      if (payLoad.data.min_bill_rate) {
        this.createJobPayLoad.basicInfo.min_bill_rate = payLoad.data.min_bill_rate;
      }
      if (payLoad.data.max_bill_rate) {
        this.createJobPayLoad.basicInfo.max_bill_rate = payLoad.data.max_bill_rate;
      }
    }

    this.createJobPayLoad[payLoad.type] = payLoad.data;
  }

  getRate(rateData) {
    this.rateCard = rateData;
    this._changeDetectorRef.detectChanges();
  }

  getRateType(rate) {
    return rate?.replace("_", " ");
  }

  async validateEntityMapping(payload) {
    const programName = this.currentProgram.name.toLowerCase().replace(' ', '-');
    let scripts;
    try {
      scripts = await import(`src/app/self-configuration/customer-scripts/${programName}-validation-script`);
    } catch(e) {
      return true;
    }
    if (scripts && scripts['jobValidationScript']) {
      let data: any = {};
      data.programId = this.programId;
      // foundational data
      data.foundational_data = [];
      data.work_locations= [];
      this.foundationalFieldsFormData?.forEach(fd => {
        let { slug, foundational_data_type_id, values } = fd;
        if (values) {
          data.foundational_data.push({ slug, foundational_data_type_id, foundation_data_id: values });
        }
      });
      if(Array.isArray(payload.location_id)){
        payload.location_id.map(location =>{
          if(typeof location === 'string'){
            let work_location= this.createJobObject?.locations.find(local=>local?.id === location)
            data.work_locations.push(work_location)
          }else{
            //object
            data.work_locations.push(location);
          }
        })
      }else if(typeof payload.location_id === 'string'){
        data.work_locations.push(this.createJobObject?.locations.find(local=>local?.id === payload.location_id));
      }
      // work locations
      //data.work_locations = typeof payload.location_id === 'object' ? [...payload.location_id] : [payload.location_id];

      return await scripts['jobValidationScript'](data, this.httpService);
    }
  }

  async saveJob() {
    this.isSaveLoader = this.isDraft ? false : true;
    let approval_list = [];
    this.createJobForm?.value?.qualifications?.forEach(qualification => {
      qualification?.values?.forEach(value => {
        value.is_active = value.is_active || false;
        value.is_locked = value.is_locked || false;
        if (qualification.name === 'Skill' || qualification.name === 'Speciality') {
          value.level = value.level || 0;
        } else {
          value.level = 0;
        }
      });
    });
    if (this.approvalList && this.approvalList.length > 0) {
      approval_list = this.approvalList.map(approval => {
        return {
          id: approval.id,
          status: approval?.value ? 'enabled' : 'disabled',
        };
      });
    }
    const jobDetails = this.createJobForm.value;
    const min_net_budget = parseFloat(jobDetails.min_net_budget ?? 0);
    const max_net_budget = parseFloat(jobDetails.max_net_budget ?? 0);
    let descriptionHtml = "";
    if(jobDetails?.description) {
      descriptionHtml = this.stringToHTML(jobDetails?.description)?.innerHTML;
    }
    const PayLoad: any = {
      ref_title: this.selectedTemplate?.ref_title?.id,
      category: this.selectedTemplate?.category?.id,
      job_manager_id: jobDetails?.job_manager?.id,
      msp_manager_id: this.selectedTemplate?.msp_manager?.id || null,
      description: descriptionHtml,
      job_description_file: this.uploadJD,
      jd_parsing_file: this.jdParsingFile,
      start_date: jobDetails?.start_date ? this.datePipe.transform(jobDetails?.start_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat) : null,
      end_date: jobDetails?.end_date ? this.datePipe.transform(jobDetails?.end_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat) : null,
      min_bill_rate: (this.ratemodel != 'PAY_RATE') ? +jobDetails.min_bill_rate : null,
      max_bill_rate: (this.ratemodel != 'PAY_RATE') ? +jobDetails.max_bill_rate : null,
      min_pay_rate: (this.ratemodel == 'PAY_RATE') ? +jobDetails.min_bill_rate : null,
      max_pay_rate: (this.ratemodel == 'PAY_RATE') ? +jobDetails.max_bill_rate : null,
      hierarchy: [this.basicJobInfo.selectedHierarchy?.id],
      program_industry: jobDetails?.labor_category ? [jobDetails?.labor_category] : [],
      currency: jobDetails?.currency,
      level: this?.selectedTemplate?.level,
      submit_type: this.isDraft ? 'DRAFT' : 'SUBMIT',
      candidates: [],
      location_id: jobDetails?.locations ? [jobDetails?.locations] : [],
      is_template: false,
      template: this.selectedTemplate?.id,
      is_expense_allowed: jobDetails?.allow_expense == 'Yes' && this.showExpenseAllowed ? true : false,
      is_submission_exceed_max_bill_rate: this.jobData?.is_submission_exceed_max_bill_rate ?? this.selectedTemplate?.is_submission_exceed_max_bill_rate ?? false,
      note_for_approver: jobDetails?.note_for_approver,
      unit_of_measure: jobDetails?.unit_of_measure?.unit_of_measure || jobDetails?.unit_of_measure,
      template_name: this.selectedTemplate?.template_name,
      is_qualification_enabled: this.isQualificationEnabled,
      available_start_date_limit: this.isAvailableStartDateLimit,
      template_code: this.selectedTemplate?.template_code,
      budget_estimate: jobDetails?.net_budget || '0.00',
      positions: jobDetails.num_resources || 1,
      rate_type: jobDetails.rate_type,
      day_per_week: jobDetails.week_working_days,
      estimated_hours: jobDetails.hours_per_day,
      working_days: jobDetails?.working_days ?? 0,
      working_hours: jobDetails?.working_hours ?? 0,
      submission_limit_vendor: this.selectedTemplate?.submission_limit_vendor,
      is_ot_exempt: this.is_ot_exempt,
      // is_background_check: this.createJobForm.get('is_background_check').value ?? false,
      is_onboarding_checklist: this.createJobForm.get('is_onboarding_checklist').value ?? false,
      // checklist: this.getSelectedOnBoarding(),
      // background_check_list: this.getEnabledBackgroundCheckList(),
      rate_markup_info: {
        avg_markup: this.createJobForm.get('averagemarkup')?.value?.slice(0, -1),
        min_markup: this.createJobForm.get('minmarkup')?.value?.slice(0, -1),
        max_markup: this.createJobForm.get('maxmarkup')?.value?.slice(0, -1),
        est_rate: this.createJobForm.get('estpayrate')?.value,
        est_min_rate: this.createJobForm.get('estminrate')?.value,
        est_max_rate: this.createJobForm.get('estmaxrate')?.value,
        sourcedmarkup: this.sourced,
        payrollmarkup: this.payroll,
        markup_mode: this.ratemodel,
        avg_bill_rate : this.avgBillRate?.slice(1) || null,
        single_initial_budget: this.createJobForm.get('single_initial_budget')?.value,
        single_net_budget: this.createJobForm.get('single_net_budget')?.value,
        min_single_initial_budget: this.createJobForm.get('min_single_initial_budget')?.value,
        max_single_initial_budget: this.createJobForm.get('max_single_initial_budget')?.value,
        min_single_net_budget: this.createJobForm.get('min_single_net_budget')?.value,
        max_single_net_budget: this.createJobForm.get('max_single_net_budget')?.value
      },
      min_budget: min_net_budget,
      max_budget: max_net_budget,
      rate_model: this.ratemodel
    };

    if(!this.jobId || this.jobData.status.toLowerCase() === 'draft' || this.visibility === 'clonejob') {
      PayLoad.resume_mandatory = this.selectedTemplate.resume_mandatory;
    }

    if(Object.keys(this.jobData).length){
      if(this.jobData?.status?.toLowerCase() === 'draft' || this.visibility === 'clonejob') {
        PayLoad.is_qualification_enabled = this.selectedTemplate?.is_qualification_enabled;
        PayLoad.available_start_date_limit = {...this.selectedTemplate?.available_start_date_limit}
      }
    }

    if(this.visibility === 'edit_review') {
      PayLoad.review_notes = jobDetails?.review_notes;
    }


    if(this.showTimesheetType) {
      PayLoad.timesheet_type = jobDetails?.timesheetType;
    }

    if(this.accountCodeCreationActive){
      PayLoad.account_code_data = this.accountCode;
    }

    if (this.visibility === 'clonejob') {
      PayLoad.source = 'COPYJOB';
      PayLoad.source_id = this.jobId ? this.jobId : null;
    }

    // if(this.createJobForm.get('additional_amount')?.value > 0){
      PayLoad.additional_amount = this.createJobForm.get('additional_amount')?.value ? +this.createJobForm.get('additional_amount')?.value : null;
      PayLoad.adjustment_type = this.createJobForm.get('adjustment_type')?.value;
      PayLoad.adjustment_value = this.createJobForm.get('adjustment_value')?.value ?? "";
    // }

    if (this.workFlow.hasOwnProperty('workflow_required')) {
      PayLoad.approval_workflow_required = this.workFlow.workflow_required;
    }

    if (this.candidates && this.candidates.length > 0 && this.preidntified) {
      let c = this.candidates.map(data => {
        const obj =  {
          first_name: data?.first_name,
          middle_name: data?.middle_name,
          last_name: data?.last_name,
          email: data?.email,
          phone_number: data?.phone_number ? data?.phone_number?.toString() : null,
          iso2_code: data?.iso2_code ? data?.iso2_code?.toString() : null,
          phone_isdcode: data?.phone_isdcode ? data?.phone_isdcode?.toString() : null,
          vendor_id: data?.vendorName?.id,
          vendor_name: data?.vendorName?.name,
          notes: data?.notes,
        };

        if(data?.id) obj['id'] = data?.id;
        if(data?.candidate_id) obj['candidate_id'] = data?.candidate_id;
        return obj;
      });
      if (c && c.length > 0) {
        PayLoad.candidates = c;
        PayLoad.pre_candidates = c;
      }
    } else {
      PayLoad.candidates = PayLoad.pre_candidates = [];
    }
    if (this.selectedTemplate?.tags && this.selectedTemplate?.tags?.length > 0 && this.selectedTemplate?.tags[0]?.id) {
      PayLoad.tags = [this.selectedTemplate?.tags[0]?.id] || [];
    } else {
      PayLoad.tags = [];
    }
    if (this.activities && this.activities?.length > 0) {
      PayLoad.activities = this.activities;
      PayLoad.activities_base_prices = jobDetails?.activities_base_prices;
    }

    if (approval_list && approval_list.length > 0) {
      PayLoad.approverlist = approval_list;
    }

      (PayLoad.automatic_distribution = this.selectedTemplate?.automatic_distribution),
      (PayLoad.automatic_distribution = this.selectedTemplate?.automatic_distribution),
      (PayLoad.automatic_distribute_submit = this.selectedTemplate?.automatic_distribute_submit),
      (PayLoad.automatic_distribute_final_approval = this.selectedTemplate?.automatic_distribute_final_approval),
      (PayLoad.tiered_distribute_schedule = this.selectedTemplate?.tiered_distribute_schedule),
      (PayLoad.distribute_schedule = this.selectedTemplate?.distribute_schedule?.id || null),
      (PayLoad.after_immediate_distribution_schedule = this.selectedTemplate?.after_immediate_distribution_schedule),
      (PayLoad.distribute_schedule_data) = (this.selectedTemplate?.distribute_schedule_data),
      (PayLoad.immediate_distribution = this.selectedTemplate?.immediate_distribution),
      (PayLoad.after_immediate_distribution = this.selectedTemplate?.after_immediate_distribution),
      (PayLoad.manual_distribution_job_submit = this.selectedTemplate?.manual_distribution_job_submit),
      (PayLoad.schedule_value = this.selectedTemplate?.schedule_value),
      (PayLoad.is_automatic_distribution = this.selectedTemplate?.is_automatic_distribution),
      (PayLoad.is_automatic_distribute_submit = this.selectedTemplate?.is_automatic_distribute_submit),
      (PayLoad.is_automatic_distribute_final_approval = this.selectedTemplate?.is_automatic_distribute_final_approval),
      (PayLoad.is_tiered_distribute_schedule = this.selectedTemplate?.is_tiered_distribute_schedule),
      (PayLoad.is_manual_distribution_job_submit = this.selectedTemplate?.is_manual_distribution_job_submit);

    const formValue = this.createJobForm.value;
    PayLoad.foundational_data = [];
    this.foundationalFieldsFormData?.forEach(data => {
      let { foundational_data_type_id, values } = data;
      if (values) {
        PayLoad.foundational_data.push({ foundation_data_type_id: foundational_data_type_id, foundation_data_id: values });
      }
    });
    const { qualifications } = formValue;
    const qualificationData = new Array();
    qualifications.map(data => {
      let { qualification_type_id, values } = data;
      values = values?.map(v => {
        qualificationData.push({
          qualification_type_id: qualification_type_id,
          qualification_id: v?.id,
          level: v?.level || 0,
          is_required: v?.is_active,
          is_locked: v?.is_locked
        });
      });
    }) || [];
    const qualification_types = this.createQualificationPayload();
    if(qualification_types?.length > 0 && this.isQualificationEnabled) {
      PayLoad.qualification_types = qualification_types;
    } else {
      PayLoad.qualification_types = [];
    }
    // if (qualificationData && qualificationData?.length > 0) {
    //   PayLoad.qualifications = qualificationData;
    // }

    if (this.customFieldsFormData && this.customFieldsFormData?.length > 0) {
      let custom_value = {};
      this.customFieldsFormData?.forEach(field => {
        if(field?.custom_field_type?.toUpperCase() == 'TOGGLE') field.values = field?.values?.toString();
        if (field?.values != undefined && field?.values != null) {
          custom_value[field?.ref_column] = field?.values;
        }
      });
      PayLoad.custom_fields = custom_value;
    }
    const { rates } = formValue;

    if (rates && rates?.length > 0) {
      const _this = this;
      let rate_value = rates.map(element => {
        if (element && element?.bill_rate && element?.bill_rate.length > 0) {
          element?.bill_rate.forEach(function (e, i) {
            if(!e?.factor || e?.factor == '') {
              e.factor = _this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
            }
            delete e.is_flat;
            if (element?.bill_rate?.length === i + 1 && element?.is_bill_flat) {
              element.bill_rate[i].flat_adjustment = element.bill_flat_adjustment;
            }
          });
        }
        if (element && element?.pay_rate && element?.pay_rate.length > 0) {
          element?.pay_rate.forEach(function (e, i) {
            if(!e?.factor || e?.factor == '') {
              e.factor = _this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
            }
            delete e.is_flat;
            // if (element?.pay_rate?.length === i + 1 && element?.is_pay_flat) {
            //   element.pay_rate[i].flat_adjustment = element.pay_flat_adjustment;
            // }
          });
        }
        return {
          abbreviation: element?.abbreviation,
          billable: element?.billable,
          bill_rate: element?.bill_rate,
          id: element?.id || element?.rate_factor_id,
          name: element?.name,
          ot_exemption: element?.ot_exemption,
          pay_rate: element?.pay_rate,
          type: element?.type,
        };
        // PayLoad[element.custom_field_slug] = element.values;
      });
      if (rate_value && rate_value?.length > 0) {
        PayLoad.rates = rate_value;
      }
    }
    if(this.showJobType){
      PayLoad.job_type= [this.selectedJobType];
    }
    // validating the mapping before creating/updating the job
    if (!this.isDraft) {
      try {
        await this.validateEntityMapping(PayLoad);
      } catch(err) {
        this.showError(err.message);
        this._loader.hide();
        this.isSaveLoader = false;
        this.isDraft= false;
        return;
      }
    }
    this.logs = undefined;
    let url = this.jobId && this.visibility !== 'clonejob' ? `/job-manager/programs/${this.programId}/jobs/${this.jobId}` : `/job-manager/programs/${this.programId}/jobs`;
    if (this.jobId && this.visibility !== 'clonejob') {
      if (!(PayLoad.submit_type.toLowerCase() === 'submit' && this.jobData.status.toLowerCase() === 'draft')) {
        delete PayLoad.template;
        delete PayLoad.category;
        delete PayLoad.title;
      }
      this.jobService.put(url, PayLoad).subscribe({
        next: (data: any) => {
          if (data.message) {
            this.jobDetails = data;
            this._alert.success('Job is updated');
            const account = this.localStorage.get(StorageKeys?.CURRENT_ACCOUNT);
            const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
            const isUserJobManager = jobDetails?.job_manager?.id == account?.id;
            if (!isUserJobManager && this.userType?.toUpperCase() == UsersType.CLIENT?.toUpperCase() && (accessType?.toUpperCase() != AccessType.ALL?.toUpperCase()) && this.name == 'edit_review') {
              this.router.navigate(['/jobs/list/all']);
            } else {
              this.viewJob();
            }
          }
          if (data && data.data && data.data.data.length > 0) {
            this.tableLoaded = true;
          }
        },
        error: error => {
          this.showError(error);
          this._loader.hide();
          this.dataLoading = false;
        },
      });
    } else {
      this.jobService.post(url, PayLoad).subscribe({
        next: (data: any) => {
          this.jobDetails = data.job;
          this.isSaveLoader = false;
          this._alert.success(this.isDraft ? 'Your job has been successfully saved as draft' : 'Your Job has been successfully created');
          this.viewJob();
          if (data && data.data && data.data.length > 0) {
            this.tableLoaded = true;
          }
        },
        error: error => {
          this.showError(error);
          this.isSaveLoader = false;
          this.dataLoading = false;
        },
    });
    }
  }

  viewJob() {
    if (this.jobDetails.id) {
      this.router.navigate([`jobs/details/job-details/${this.jobDetails?.id}`]);
    } else {
      this.router.navigate([`jobs/details/job-details/${this.jobDetails?.id}`]);
    }

    this.tabIndex = 0;
    this.createJobPayLoad = {};
    this.selectedTemplate = {};
    this.jobDetails = {};
    this.selectedTemplateId = {};
    this.createJobObject = {};
    this.createJobForm.reset();
    this.basicInfo = true;
    this.candidates = [];
    this.maxRate = '';
  }

  createJob() {
    this.tabIndex = 0;
    this.createJobPayLoad = {};
    this.selectedTemplate = {};
    this.jobDetails = {};
    this.selectedTemplateId = {};
    this.createJobObject = {};
    this.createJobForm.reset();
    this.basicInfo = true;
    // this.backgroundcheckData = [];
    this.candidates = [];
    this.goToBasic();
    this.createJobForm.patchValue({
      allow_expense: 'Yes',
    });
    this.hierarchyList();
    this.getWorkLocations(null, true);
    this.init();
    this.maxRate = '';
  }

  getFormattedDate(date) {
    if (date) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = date.getFullYear();
      return yyyy + '-' + mm + '-' + dd;
      // return this.datePipe.transform(date);
    }
  }

  showjobDtls() {
    this.show = !this.show;
  }

  checkCandidate() {
    if (this.preidntified) {
      if (this.candidates && this.candidates?.length <= 0) {
        return true;
      }
    } else {
      return false;
    }
  }

 clickToContinue(isFromSkipToContinue?) {
    if (this.isDisabled) {
      return;
    }
    if (this.btnText === 'Submit' || this.btnText === 'Update & Submit') {
      this.saveJob();
    } else if (this.basicInfo == true) {
        this.basicInfo = false;
        this.quillInputTxt = this.quillData;
        this.createJobForm.patchValue({description:this.quillInputTxt});
        this.financialDetail = true;
        window.scrollTo(0, 0);
    } else if (this.financialDetail == true) {
      const jobDetails = this.createJobForm.value;
      let startDate: any = this.getDate(this.datePipe.transform(jobDetails.start_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
      let endDate: any = this.getDate(this.datePipe.transform(jobDetails.end_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
      if (!this.jobId) this.setWorkerType();

      if (+jobDetails.num_resources === 0) {
        this.showError(`Please select Number of Positions greater than 0`);
        return;
      }
      if (startDate && endDate && Date.parse(startDate) <= Date.parse(endDate)) {
      } else {
        this.showError("Please select end date greater than start date");
        return;
      }
      let max_bill_rate = parseFloat(jobDetails.max_bill_rate);
      let min_bill_rate = parseFloat(jobDetails.min_bill_rate);

      if (this.createJobObject?.rates?.max_rate_rule === 'Cannot Reduce' && max_bill_rate < this.createJobObject?.rates?.max_rate) {
        this.showError(`The Maximum Rate cannot be less than ${this.createJobObject?.rates?.max_rate}`);
        return;
      }
      if (this.createJobObject?.rates?.min_rate_rule === 'Cannot Reduce' && min_bill_rate < this.createJobObject?.rates?.min_rate) {
        this.showError(`The Minimum Rate cannot be less than ${this.createJobObject?.rates?.min_rate}`);
        return;
      }

      if (
        this.createJobObject?.rates?.max_rate_rule === 'Cannot Change' &&
        (max_bill_rate < this.createJobObject?.rates?.max_rate || max_bill_rate > this.createJobObject?.rates?.max_rate)
      ) {
        this.showError("The Maximum Rate cannot be change");
        return;
      }
      if (
        this.createJobObject?.rates?.min_rate_rule === 'Cannot Change' &&
        (min_bill_rate < this.createJobObject?.rates?.min_rate || min_bill_rate > this.createJobObject?.rates?.min_rate)
      ) {
        this.showError("The Minimum Rate cannot be change")
        return;
      }
      let rate_factor = jobDetails?.rates;
      let is_valid = true;
      if (rate_factor && rate_factor?.length > 0) {
        for (let el of rate_factor) {
          if (el && el.bill_rate && el.bill_rate.length > 0) {
            for (let br of el.bill_rate) {
              if (br?.factor && br.factor > 10) {
                is_valid = false;
                break;
              }
            }
            for (let pr of el.pay_rate) {
              if (pr?.factor && pr.factor > 10) {
                is_valid = false;
                break;
              }
            }
          }
        }
      }
      if (!is_valid) {
        this.showError("Please enter factor less than or equals to 10");
        return;
      }

      if (this.createJobObject?.rates?.isMinLimit && jobDetails?.min_bill_rate < this.createJobObject?.rates?.min_rate) {
        return;
      }
      if (this.createJobObject?.rates?.isMaxLimit && jobDetails?.max_bill_rate > this.createJobObject?.rates?.max_rate) {
        return;
      }

      if(this.showTimesheetType) {
        const timesheet_type = this.createJobForm.get('timesheetType')?.value;
        if(!timesheet_type) {
          this.showError('Timesheet Type is not selected.')
          return;
        }
      }

      const additional_amount = this.createJobForm.get('additional_amount')?.value;
      const allow_expense = this.createJobForm.get('allow_expense')?.value
      if (!isFromSkipToContinue && (additional_amount == "" || additional_amount == null || additional_amount == undefined) && this.visibility !== 'editApprovedJob' && allow_expense == 'Yes' && this.showExpenseAllowed) {
        this.modalVisibility = true;
        return;
      }
      if (isFromSkipToContinue) {
        this.modalVisibility = false;
      }

      if (
        +min_bill_rate > -1 &&
        +max_bill_rate > -1 &&
        ((!this.allow_equal_min_max_rate && +min_bill_rate < +max_bill_rate) ||
          (this.allow_equal_min_max_rate && +min_bill_rate <= +max_bill_rate))
      ) {
        this.basicInfo = false;
        this.financialDetail = false;
        this.jobDetails = true;
        if (this.jobId && this.visibility !== 'clonejob') {
          this.btnText = 'Update & Submit';
        } else {
          this.btnText = 'Submit';
        }
        this.showSummaries = false;
      } else {
        if (this.ratemodel == 'PAY_RATE') {
          this.showError('Please select max pay rate greater than min pay rate');
        } else {
          this.showError('Please select max bill rate greater than min bill rate');
        }
        return;
      }
      window.scrollTo(0, 0);
    }
    this.logs = undefined;
    if (this.createJobForm.get('start_date').value == null || this.createJobForm.get('end_date').value == null ) {
      this.fetchMarkups(this.createJobForm.get('labor_category')?.value);
      if(this.timesheetTypeList?.length == 0) {
        this.fetchTimesheetTypes();
      }
    }
  }

  fetchMarkupValues() {
    if (this.ratemodel != 'BILL_RATE' && this.ratemodel != null) {
      this.fetchMarkups(this.createJobForm.get('labor_category')?.value);
    }
  }

  fetchMarkups(labor_category) {
    const url = `/configurator/programs/${this.programId}/markup-aggregate` + (labor_category != null ? `?industry_id=${labor_category}` : '');
    this.jobService.get(url).toPromise().then(
      (result: any) => {
        const mrkpAggr = result?.markup_aggregate;
        this.sourced = mrkpAggr?.sourced_markup_avg;
        this.payroll = mrkpAggr?.payrolled_markup_avg;
        const minimum_markup = mrkpAggr?.sourced_markup_min < mrkpAggr?.payrolled_markup_min ?  mrkpAggr?.sourced_markup_min : mrkpAggr?.payrolled_markup_min;
        const maximum_markup = mrkpAggr?.sourced_markup_max > mrkpAggr?.payrolled_markup_max ?  mrkpAggr?.sourced_markup_max : mrkpAggr?.payrolled_markup_max;
        this.createJobForm.get('minmarkup').setValue(this.accuracyPipe.transform(minimum_markup, 'markup_percentage'));
        this.createJobForm.get('maxmarkup').setValue(this.accuracyPipe.transform(maximum_markup, 'markup_percentage'));
        this.createJobForm
        .get('averagemarkup')
        .setValue(
          mrkpAggr?.avg_markup ? this.accuracyPipe.transform(mrkpAggr?.avg_markup, 'markup_percentage') :
          this.accuracyPipe.transform(((mrkpAggr?.sourced_markup_avg + mrkpAggr?.payrolled_markup_avg) / 2), 'markup_percentage', { view_accurate: true }));
        this.createJobForm
          .get('range')
          .setValue((parseFloat(mrkpAggr?.payrolled_markup_max) - parseFloat(mrkpAggr?.sourced_markup_min)) + '%');
          this.rate = this.ratemodel === 'MARKUP' ? 'Pay' : this.ratemodel == 'PAY_RATE' ? 'Bill' : '';
          this.rate_model = this.ratemodel === 'MARKUP' ? 'Bill' : this.ratemodel == 'PAY_RATE' ? 'Pay' : '';

        if (this.workingHours) {
          this.calculateRates(mrkpAggr);
        }
      },
      error => {
        this.showError('Unable to load the Markup Details.');
      },
    );
  }

  calculateRates(mrkpAggr) {
    const min_markup = mrkpAggr?.sourced_markup_min < mrkpAggr?.payrolled_markup_min ? mrkpAggr?.sourced_markup_min : mrkpAggr?.payrolled_markup_min;
    const max_markup = mrkpAggr?.sourced_markup_max > mrkpAggr?.payrolled_markup_max ? mrkpAggr?.sourced_markup_max : mrkpAggr?.payrolled_markup_max;
    const rate_model = this.ratemodel;
    const min_rate = parseFloat(this.createJobForm.value.min_bill_rate);
    const max_rate = parseFloat(this.createJobForm.value.max_bill_rate);
    let ratesPayload = {};
    if (this.workingHours) {
      if (this.ratemodel == 'MARKUP') {
        ratesPayload = {
          rate_model,
          min_rate,
          max_rate
        }
      } else if (this.ratemodel == 'PAY_RATE') {
        const sourced_markup = mrkpAggr?.sourced_markup_avg;
        const payrolled_markup = mrkpAggr?.payrolled_markup_avg;
        ratesPayload = {
          min_rate,
          max_rate,
          sourced_markup,
          payrolled_markup,
          min_markup,
          max_markup,
          rate_model
        }
      }
      if (!rate_model || (min_rate == null || isNaN(min_rate)) || (!max_rate || isNaN(max_rate)) || min_rate > max_rate) {
        return;
      }
      this.jobService.post(`/job-manager/programs/${this.programId}/job-calculations`, ratesPayload).subscribe({
        next: (res: any) => {
          const rates = res?.data;
          this.estpayrateavg = rates?.average_bill_rate;
          this.estminpayrateavg = rates?.min_bill_rate;
          this.estmaxpayrateavg = rates?.max_bill_rate;
          this.createJobForm.get('estpayrate').setValue(this.estpayrateavg);
          this.createJobForm.get('estminrate').setValue(this.estminpayrateavg);
          this.createJobForm.get('estmaxrate').setValue(this.estmaxpayrateavg);
          this.getResourceBudget();
        },
        error: (err) => {
          this.showError(err);
        }
      })
    }

  }

  onClickToggle() {
    if (this.name === 'editApprovedJob' || this.disablePreIdToggle) return false;
    this.addCandidate = !this.preidntified;
    this.preidntified = !this.preidntified;
    this.setWorkerType();
  }

  setWorkerType() {
    const custom_fields = this.customFieldsComp.customFieldsForm.get('custom_fields') as UntypedFormArray;
    for (let control of custom_fields.controls) {
      if (control.value.custom_field_slug === "vendor_selection") {
        control.patchValue({values: this.preidntified ? 'payroll' : 'sourced'});
        break;
      }
    }
  }

  openCreateCandidate() {
    this.createJobObject.editedCandidate = {};
    this.isCreateCandidate = 'visible';
  }

  openCreateEstimateOpen(hidePopUpModal?) {
    this.isCreateEstimate = true;
    if(hidePopUpModal) {
      this.modalVisibility = false;
    }
  }

  onAccountCodeSideBarClose = (value : AccountCodeData) =>{
    this.showAccountCode = 'hidden';
    if(value?.is_validated){
      this.accountCode = value;
      this.createJobForm.patchValue({
        account_code : this.accountCode.account_code,
      })
    }else {
      this.accountCode = value;
      this.createJobForm.patchValue({
        account_code : null,
      })
    }
  }

  onCloseSideBar =(value:string) =>{
    this.showAccountCode = 'hidden';
  }

  onCreateClose() {
    this.isCreateCandidate = 'hidden';
    this.isCreateEstimate = false;
    this.createJobObject.editedCandidate = null;
  }

  closePopup(event) {
    this.isCreateCandidate = 'hidden';
    this.isCreateEstimate = false;
    if (event) {
      this.createJobForm.patchValue(event);
      this.avgBillRate = event?.averageRate
      this.createJobForm.patchValue({
        additional_amount : event.adjustment_value,
      });
    }
  }

  candidate(e) {
    if (
      this.createJobObject.editedCandidate &&
      this.createJobObject.editedCandidate.hasOwnProperty('index') &&
      this.createJobObject?.editedCandidate?.index !== -1
    ) {
      this.candidates[this.createJobObject.editedCandidate.index] = e;
      this.createJobObject.editedCandidate = {};
    } else {
      this.candidates.push(e);
    }
  }

  removeCandidate(i) {
    this.candidates.splice(i, 1);
    this._alert.success('Candidate has been removed successfully!')
  }

  editCandidate(index) {
    const editedData = this.candidates[index];
    editedData.index = index;
    this.createJobObject.editedCandidate = editedData;
    this.isCreateCandidate = 'visible';
  }

  displayCandidateOption(index) {
    // this.showOption =! this.showOption;
    this.candidates[index].showOption = !this.candidates[index].showOption;
  }

  showSummary() {
    if (this.maxRate >= 1) {
      this.showSummaries = true;
    } else {
      this.showSummaries = false;
    }
  }

  deleteSkill(skill) {
    this.selectedSkills.splice(skill, 1);
  }

  goToBasic() {
    this.basicInfo = true;
    this.financialDetail = false;
    this.jobDetails = false;
    this.showSummaries = false;
    this.btnText = 'continue';
  }

  goToFinancialDetail() {
    if (this.basicInfoValid) {
      this.basicInfo = false;
      this.financialDetail = true;
      this.jobDetails = false;
      this.showSummaries = false;
      this.btnText = 'continue';
      this.quillInputTxt = this.quillData;
      this.createJobForm.patchValue({description:this.quillInputTxt});
    }
  }

  goToJobDetails() {
    if (this.financialDetailValid) {
      if (this.createJobForm.get('max_bill_rate').value > this.createJobForm.get('min_bill_rate').value) {
        this.basicInfo = false;
        this.financialDetail = false;
        this.jobDetails = true;
        this.btnText = (this.name === JOB_STATE.EDIT_APPROVED_JOB || this.name == JOB_STATE.EDIT_REVIEW) ? (this.btnText = 'Update & Submit') : 'Submit';
        this.showSummaries = false;
        this.quillInputTxt = this.quillData;
        this.createJobForm.patchValue({description:this.quillInputTxt});
      } else {
        this.checkMaxMin();
      }
    }
  }

  getWorkLocations(term, reset = false) {
    if(this.jobManagerAssociatedWorkLocation?.length > 0) {
      this.createJobObject.locations = [...this.jobManagerAssociatedWorkLocation];
      return;
    }
    if (reset) {
      this.pageNo = 1;
    }
    const url = `/configurator/programs/${this.programId}/work-locations?limit=25&status=true&page=${this.pageNo}${
      term ? '&k=' + term : ''
    }`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.work_locations && data.work_locations.length > 0 ) {
          if (data.work_locations && data.work_locations?.length > 0) {
            data.work_locations.push(data.work_locations[0]);
            const uniqueLocations: any = [...new Map(data.work_locations.map(item => [item.name, item])).values()];
            const locations = uniqueLocations.filter(l => l.name);
            this.createJobObject.locations = locations.sort((l1, l2) => l1.name.localeCompare(l2.name));
            this.workLocationArr = [...this.createJobObject.locations];
          }
        }
        if(this.jobManagerAssociatedWorkLocation?.length > 0){
          this.createJobObject.locations = [...this.jobManagerAssociatedWorkLocation];
        }
      },
      error: error => {
        // this._alert.error(errorHandler(error), {});
        this.showError(error);
      },
  });
  }

  async searchManagerList(event, flag) {
    if(flag && this.name!==JOB_STATE.EDIT_APPROVED_JOB){
      this.resetJobFields();
      this.createJobObject.locations = this.workLocationArr;
      this.jobManagerAssociatedWorkLocation = [];
    }
    if (this.accessType === AccessType.ALL || this.canClientEditManager) {
      this.managerList = await this.getManagerList(event, flag).toPromise();
      if (this.visibility === 'clonejob') {
        this.managerList = this.managerList.filter(x => x.is_enabled === true);
      }
    }
  }

  getLaborCategoryList(term, reset = false) {
    if (reset) {
      this.pageNo = 1;
    }
    let url = `/configurator/programs/${this.programId}/industries?${term ? 'name=' + term : ''}`;
    return this.userService.get(url).subscribe((data: any) => {
      this.labor_categories = data?.industries;
      if (this.labor_categories && this.labor_categories?.length > 0) {
        this.createJobForm?.controls?.labor_category?.setValidators([Validators.required]);
      } else {
        this.createJobForm?.controls?.labor_category?.setValidators(null);
        this.createJobForm?.controls?.labor_category?.clearValidators();
        this.createJobForm?.controls?.labor_category?.setErrors(null);
      }
    });
  }

  getMemberById = (id: string) => {
    if (id) {
      return this.jobService.get(`/configurator/programs/${this.programId}/members/${id}`).pipe(
        map((res: any) => {
          return {
            id: res.member.id,
            first_name: res.member.first_name,
            last_name: res.member.last_name,
            full_name: (res.member.first_name ?? '') + (res.member.middle_name ? ' ' + res.member.middle_name : '') + ' ' + (res.member.last_name ?? ''),
            email: res.member.email,
            is_enabled: res.member.is_enabled,
            work_locations: res?.member?.work_locations,
            hierarchies: res?.member?.hierarchies
          };
        })
      );
    }
  }

  getManagerList(term, reset = false) {
    if (reset) {
      this.pageNo = 1;
    }
    // this._loader.show();
    const hierarchyIds = this.hierarchyFlattenArray?.filter((res)=>!res?.isDisabled)?.map((res)=>res?.id);
    let url = `/configurator/programs/${this.programId}/members?org_category=CLIENT&info_level=basic${term ? '&name=' + term : ''}`;
    if(hierarchyIds?.length > 0 && (this.jobId || this.isCreateFromTemplate) && !this.currentProgram?.config?.job?.default_to_root_hierarchy && this.name!= JOB_STATE.EDIT_APPROVED_JOB) {
       url+=`&hierarchy_ids=${hierarchyIds?.join()}`
    }
    if(this.name == JOB_STATE.EDIT_APPROVED_JOB && !this.currentProgram?.config?.job?.default_to_root_hierarchy) {
      url+=`&hierarchy_ids=${this.basicJobInfo?.selectedHierarchy?.id}`
    }
    return this.userService.get(url).pipe(
      map((res: any) =>
          this.sortMembers(res.members).map(mem => {
            return {
              id: mem.id,
              first_name: mem.first_name,
              last_name: mem.last_name,
              full_name: (mem.first_name ?? '') + (mem.middle_name ? ' ' + mem.middle_name : '') + ' ' + (mem.last_name ?? ''),
              email: mem.email,
              is_enabled: mem.is_enabled,
            };
          }),
      ),
    );
  }

  sortMembers(members) {
    return members.sort((mem1, mem2) => (mem1.first_name + ' ' + mem1.last_name).localeCompare(mem2.first_name + ' ' + mem2.last_name));
  }

  updateQualification() {
    if (this.qualification_types) {
      const formArray = this.createJobForm.get('qualifications') as UntypedFormArray;
      while (formArray && formArray?.length !== 0) {
        formArray?.removeAt(0);
      }
      this.qualification_types.forEach(element => {
        if (element?.selected === true) {
          const control = this.createJobForm.get('qualifications') as UntypedFormArray;
          const group = this.fb.group({
            name: [element.name],
            // code: [element.code],
            qualification_type: [element.name],
            qualification_type_id: [element.id],
            values: [element.values],
            data: [element.values],
            is_qualification_type_required:[element?.is_required ?? false],
            qualification_type_code: [element?.code]
          });
          control.push(group);
          // this.searchQualifications(group, { term: '' });
        }
      });
    }
    setTimeout(()=>{
      this.findLockedQualification();
    }, 1000);
  }

  findLockedQualification(){
    this.isQualificationLocked = this.createJobForm?.value?.qualifications.map(qual=>{
      let temp = false;
      for (let i = 0; i < qual?.values.length; i++) {
        const element = qual?.values[i]?.is_locked;
        temp = element || temp;
      }
      return temp;
    })
  }

  removeQualification(index) {
    if(this.isQualificationLocked[index])
      return;
    const control = this.createJobForm.get('qualifications') as UntypedFormArray;
    const qualification = control.controls[index]?.get('qualification_type')?.value;
    if (qualification) {
      this.qualification_types.forEach((q, index) => {
        if (q?.name?.toLowerCase() === qualification?.toLowerCase()) {
          // qualificationTypes.splice(index, 1);
          this.qualification_types[index].selected = false;
        }
      });
    }
    control.removeAt(index);
    this.findLockedQualification();

    // this.qualification_types[index].selected = false;
  }

  updateFoudationalForm() {
    const formArray = this.createJobForm.get('foundational_data') as UntypedFormArray;
    while (formArray && formArray?.length !== 0) {
      formArray?.removeAt(0);
    }
    this.foundationTypeList.forEach(element => {
      const isRequired = element?.configuration?.module_jobs?.toUpperCase() === 'REQUIRED';
      this.foundationalDataArray.push(
        this.fb.group({
          is_required: [isRequired],
          foundational_data_name: [element.name],
          foundational_data_type_id: [element.id],
          values: [null, isRequired ? [Validators.required] : []],
          options: [element.values],
        }),
      );
    });
    // this.updateCustomFieldForm();
  }

  get foundationalDataArray() {
    return (this.createJobForm.get('foundational_data') as UntypedFormArray) || new UntypedFormArray([]);
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }
  }

  clickOnRatings(c, r) {
    if(!c?.is_locked){
      c.level = Number(r);
    }
  }

  showTooltip(i) {
    if (i == 0) {
      this.tooltipTitle = 'Beginner';
    } else if (i == 1) {
      this.tooltipTitle = 'Intermediate';
    } else if (i == 2) {
      this.tooltipTitle = 'Expert';
    }
  }

  removeFromValue(i) {
    const formArray = this.createJobForm.get('qualifications') as UntypedFormArray;
    const formGroup = formArray.controls[i] as UntypedFormGroup;
    formGroup.patchValue(formGroup.get('values').value.splice(i, 1));
  }

  searchQualifications(item, value) {
    this.qualLoading = true;
    if (!value?.term) {
      item.get('data').value = null;
      this.qualLoading = false;
      return;
    }
    const qualificationTypeId = item.get('qualification_type_id').value;
    const _url =`/configurator/programs/${this.currentProgram?.id}/qualification-types/${qualificationTypeId}/qualifications?limit=100&name=` + value?.term + '&active=True';
    this.jobService.get(_url).subscribe({
      next: (data: any) => {
      data?.qualifications?.forEach(dq => {
        this.createJobForm.get('qualifications')?.value?.forEach(data => {
          data?.values?.forEach(dt => {
            if (dq?.id === dt?.id) {
              dq.code = dt?.code;
              dq.id = dt?.id;
              dq.is_active = dt?.is_active;
              dq.level = dt?.level;
              dq.name = dt?.name;
              dq.is_locked = dt?.is_locked;
            }
          });
        });
      });
      let prev_present_vals: Array <any> = [];
      if(Array.isArray(item.get('values')?.value))
        prev_present_vals = item.get('values')?.value?.map(node => node?.id);

      let curr_fetched_vals: Array <any> = data?.qualifications?.sort((qual1, qual2) => qual1?.name?.localeCompare(qual2?.name));
      curr_fetched_vals = curr_fetched_vals?.filter(node => {
        return !prev_present_vals?.includes(node?.id);
      });

      if(Array.isArray(item.get('values')?.value))
        item.get('data').value = [ ...item.get('values')?.value, ...curr_fetched_vals ];
      else
        item.get('data').value = [...curr_fetched_vals];

      this.qualLoading = false;
    }
  });
  }

  getCurrencies(workLocCurr = [], onEditOrClone?) {
    if ((!workLocCurr || workLocCurr?.length === 0) &&
      this.currentProgram?.config?.billing?.supported_currencies?.length > 0) {
      workLocCurr = [];
      const arr = this.currentProgram?.config?.billing?.supported_currencies;
      arr?.forEach((res) => {
        const obj = {};
        obj['code'] = res;
        if (this.currentProgram?.config?.billing?.default_currency == res) {
          obj['is_default'] = true;
        }
        workLocCurr.push(obj);
      })
    }
    if (workLocCurr) {
      this.createJobObject.currencies = new Array();
      if (workLocCurr && workLocCurr?.length > 0) {
        workLocCurr.forEach(element => {
          let isPresent = this.createJobObject.currencies.some(c => c.name === element.code);
          if (!isPresent) {
            this.createJobObject.currencies.push({ name: element?.code, symbol: element?.symbol });
          }
          if (element?.is_default && !onEditOrClone) {
            this.createJobForm.patchValue({
              currency: element?.code
            })
            this.createJobObject.currencySymbol = element?.symbol;
          }
        });
      }
      this.createJobObject.currencies?.sort((c1, c2) => c1.name.localeCompare(c2.name));
    }
  }

  checkMaxMin() {
    const jobDetails = this.createJobForm.value;
    if (this.createJobObject?.rates?.isMinLimit && jobDetails.min_bill_rate < this.createJobObject?.rates?.min_rate) {
      return;
    }
    if (this.createJobObject?.rates?.isMaxLimit && jobDetails.max_bill_rate > this.createJobObject?.rates?.max_rate) {
      this.showError(`Max ${this.ratemodel == 'PAY_RATE' ? 'Pay' : 'Bill'} Rate cannot be greater than ${this.accuracyPipe.transform(this.createJobObject?.rates?.max_rate, 'rate', { currencyCode: this.createJobObject?.currencySymbol })}`);
      return;
    }
    if (
      +jobDetails.min_bill_rate > -1 &&
      +jobDetails.max_bill_rate > -1 &&
      ((!this.allow_equal_min_max_rate && +jobDetails.min_bill_rate < +jobDetails.max_bill_rate) ||
        (this.allow_equal_min_max_rate && +jobDetails.min_bill_rate <= +jobDetails.max_bill_rate))
    ) {
      this.getResourceBudget();
    } else {
      if (this.ratemodel == 'PAY_RATE') {
        this.showError('Please select max pay rate greater than min pay rate');
      } else {
        this.showError('Please select max bill rate greater than min bill rate');
      }
      return;
    }
    if (jobDetails.max_bill_rate) {
      this.fetchMarkupValues();
    }
    //commented as removing toFixed for accuracy config
    // if (jobDetails.max_bill_rate && typeof (jobDetails.max_bill_rate === 'number')) {
    //   const maxBill = jobDetails?.max_bill_rate?.toFixed(2);
    //   this.createJobForm.patchValue({ max_bill_rate: maxBill });
    // }
  }

  ToFloat() {
    const jobDetails = this.createJobForm.value;
    if (this.createJobObject?.rates?.isMinLimit && jobDetails?.min_bill_rate < this.createJobObject?.rates?.min_rate) {
      this.showError(`Min ${this.ratemodel == 'PAY_RATE' ? 'Pay' : 'Bill'} Rate cannot be less than ${this.accuracyPipe.transform(this.createJobObject?.rates?.min_rate, 'rate' , { currencyCode: this.createJobObject?.currencySymbol })}`);
      return;
    }
    if (jobDetails?.min_bill_rate > -1 && jobDetails?.max_bill_rate > -1 && jobDetails?.min_bill_rate < jobDetails?.max_bill_rate) {
      this.getResourceBudget();
    }
  }

  getApprovalList() {
    let request = JSON.parse(JSON.stringify(this.createJobForm.value));
    let payLoad = {
      module: 'job',
      data: {
        program_id: this.programId,
        job_manager: this.createJobForm.value.job_manager,
        title: this.selectedTemplate.title,
        category: this.selectedTemplate.category,
        description: request.description,
        min_bill_rate: Number(this.createJobForm.get('min_bill_rate')?.value),
        max_bill_rate: Number(this.createJobForm.get('max_bill_rate')?.value),
        hierarchy: { id: this.basicJobInfo.selectedHierarchy?.id },
        no_of_openings: request.num_resources,
        created_by: {
          id: this.currentUser?.id,
          first_name: this.currentUser?.first_name,
          last_name: this.currentUser?.last_name,
          email: this.currentUser?.email,
        },
      },
    };
    this.jobService.post('/approval/approvers-list', payLoad).subscribe({
      next: (data: any) => {
        this.approvalList = data?.data;
        if (this.approvalList && this.approvalList.length > 0) {
          this.approvalList.map(data => {
            data.value = true;
          });
        }
      },
      error: error => {
        this.approvalList = new Array();
      },
  });
  }

  showDropdown() {
    this.dropdownShowHide = true;
  }

  hideDropdown(index) {
    this.candidates[index].showOption = false;
    // this.candidates[index].showOption = !this.candidates[index].showOption
  }

  async getWorkingHoursEstimate() {
    const isValidData = await this.validateInput();
    if (isValidData) {
      const week_working_days = this.createJobForm.get('week_working_days').value;
      const hours_per_day = this.createJobForm.get('hours_per_day').value;
      let start_date: any = this.createJobForm.get('start_date').value
      ? this.datePipe.transform(this.createJobForm.get('start_date').value, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat)
      : null;
      let end_date: any = this.createJobForm.get('end_date').value
      ? this.datePipe.transform(this.createJobForm.get('end_date').value, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat)
      : null;
      if(this.createJobForm?.errors?.startEndDateExceedError) {
        return;
      }
      if (start_date && end_date) {
        this.jobService
          .get(
            `/core-money/programs/${this.programId}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`,
          )
          .subscribe({
            next: (data: any) => {
            if (data && data.data) {
              this.isCreateJobBtnDisabled = false;
              this.workingHours = data?.data?.working_hours;
              this.fetchMarkupValues();
              this.createJobForm.patchValue(data?.data);
              this.getResourceBudget();
            }
          },
          error: (err) => {
            this.showError(err?.error?.error?.errors[0]?.message);
            this.isCreateJobBtnDisabled = true;
          }});
      }
    }
  }

  validateInput() {
    let request = this.createJobForm.value;
    if (request.week_working_days < 0 || request.week_working_days > 7) {
      this.showValidationError('Please provide valid working days');
      return false;
    } else if (request.hours_per_day < 0 || request.hours_per_day > 24) {
      this.showValidationError('Please provide valid hours');
      return false;
    } else if (request.adjustment_value < 0) {
      this.showValidationError('Please provide valid adjustment value');
      return false;
    } else if (request.additional_amount < 0) {
      this.showValidationError('Please provide valid additional amount');
      return false;
    } else {
      return true;
    }
  }

  showValidationError(message) {
    // this._alert.error(message);
    this.showError(message);
  }

  async getResourceBudget() {
    const isValidData = await this.validateInput();
    if(!this.createJobForm?.value?.unit_of_measure) {
      return;
    }
    if(this.createJobForm?.errors?.startEndDateExceedError) {
      return;
    }
    if (isValidData) {
      let request = JSON.parse(JSON.stringify(this.createJobForm.value));
      delete request['foundational'];
      delete request['rate_dtls'];
      delete request['location'];
      delete request['pre_identified_candidate'];
      delete request['vendor_rate_exceed'];
      delete request['locations'];
      delete request['job_manager'];
      delete request['hierarchy'];
      delete request['description'];
      delete request['allow_expense'];
      delete request['note_for_approver'];
      delete request['selectedQualification'];
      delete request['qualifications'];
      delete request['foundational_data'];
      request.total_hours = request.working_hours;
      request.rate = this.createJobForm.get('max_bill_rate').value;
      let start_date: any = this.createJobForm.get('start_date').value
        ? this.datePipe.transform(this.createJobForm.get('start_date').value, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat)
        : null;
      let end_date: any = this.createJobForm.get('end_date').value
        ? this.datePipe.transform(this.createJobForm.get('end_date').value, DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat)
        : null;
      if (!request.rate || !start_date || !end_date) {
        return;
      }
      let req: any = {};
      if (request.max_bill_rate) {
        req.rate = request.max_bill_rate;
      }
      if (request.total_hours) {
        req.total_hours = request.total_hours;
      }
      if (request.hours_per_day) {
        req.hours_per_day = request.hours_per_day;
      }
      if (request.week_working_days) {
        req.week_working_days = request.week_working_days;
      }
      if (request.num_resources) {
        req.num_resources = request.num_resources;
      }
      req.adjustment_type = request.adjustment_type;
      let uom = 'hourly';
      if (typeof request?.unit_of_measure === 'string') {
        uom = request?.unit_of_measure?.toLowerCase();
      } else if (typeof request?.unit_of_measure === 'object') {
        uom = request?.unit_of_measure?.unit_of_measure?.toLowerCase();
      }
      if (uom) {
        req.rate_type = this.jobdetailService.getUOMType(uom);
      }
      this.createJobForm.patchValue({ rate_type: req.rate_type });
      if (this.ratemodel === 'BILL_RATE') {
        if (request.min_bill_rate !== -1 && request.max_bill_rate) {
          req.rate = ((+request.min_bill_rate) + (+request.max_bill_rate)) / 2;
        }
      } else {
        req.rate = (+request.estpayrate) ?? 0;
      }
      if (request.adjustment_value) {
        req.adjustment_value = request.adjustment_value;
      }

      req.start_date = start_date;
      req.end_date = end_date;
      const requestParam = this.jsonToQueryString(req);
      let minRequest = JSON.parse(JSON.stringify(req));
      let maxRequest = JSON.parse(JSON.stringify(req));
      minRequest.rate = this.ratemodel === 'BILL_RATE' ? (+request.min_bill_rate) ?? 0 : (+request.estminrate) ?? 0;
      maxRequest.rate = this.ratemodel === 'BILL_RATE' ? (+request.max_bill_rate) ?? 0 : (+request.estmaxrate) ?? 0;
      const minParam: any = this.jsonToQueryString(minRequest);
      const maxParam: any = this.jsonToQueryString(maxRequest);
      let req_array: Array<Observable<any>> = new Array();
      const request1 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${minParam}`);
      const request2 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${requestParam}`);
      const request3 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${maxParam}`);
      if (minRequest?.rate !== 0) {
        req_array.push(request1);
      } else {
        this.createJobForm.patchValue({
          min_single_initial_budget: 0.0,
          min_single_net_budget: 0.0,
          min_single_gross_budget: 0.0,
          min_net_budget: 0.0,
        });
      }
      if (maxRequest?.rate !== 0) {
        req_array.push(request2);
      }
      if (req?.rate !== 0) {
        req_array.push(request3);
      }
      // req_array.push(request1, request2, request3);
      forkJoin(req_array).subscribe({
        next: (results) => {
        let combineResult = JSON.parse(JSON.stringify(results));
        this.isCreateJobBtnDisabled = false;
        if (combineResult && combineResult?.length >= 1) {
          if (req_array.includes(request2)) {
            const index = req_array?.length < 3 ? 0 : 1;
            this.createJobForm.patchValue(combineResult[index]?.data);
          }
        }

        if (combineResult && combineResult?.length > 0 && req_array.includes(request1)) {
          this.createJobForm.patchValue({
            min_single_initial_budget: combineResult[0]?.data?.single_initial_budget,
            min_single_net_budget: combineResult[0]?.data?.single_net_budget,
            min_single_gross_budget: combineResult[0]?.data?.single_gross_budget,
            min_net_budget: combineResult[0]?.data?.net_budget,
          });
        }
        if (combineResult && combineResult?.length > 0 && !req_array.includes(request1)) {
          this.createJobForm.patchValue({
            min_single_net_budget: request.adjustment_type === 'fixed' ? request.adjustment_value ?? 0.00 : 0.00,
            min_net_budget: request.adjustment_type === 'fixed' ? request.adjustment_value ?? 0.00 : 0.00,
          });
        }
        if (combineResult && combineResult?.length > 1 && req_array.includes(request3)) {
          const index = req_array?.length < 3 ? 1 : 2;
          this.createJobForm.patchValue({
            max_single_initial_budget: combineResult[index]?.data?.single_initial_budget,
            max_single_net_budget: combineResult[index]?.data?.single_net_budget,
            max_single_gross_budget: combineResult[index]?.data?.single_gross_budget,
            max_net_budget: combineResult[index]?.data?.net_budget,
          });
        }
      },
      error: (err)=>{
        this.showError(err?.error?.error?.errors[0]?.message);
        this.isCreateJobBtnDisabled = true;
      }
    });
    }
  }

  jsonToQueryString(json) {
    return (
      '?' +
      Object.keys(json)
        .map(function (key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
        })
        .join('&')
    );
  }

  getQualificationTypes(pageNo = 1) {
    let hierarchiesList = '';
    if (this.hierarchyData) {
      this.hierarchyData?.filter((res)=>res?.is_enabled)?.forEach(hierarchy => {
        hierarchiesList += hierarchy?.id + ',';
      });
    }
    const url = `/configurator/programs/${this.programId}/qualification-types?limit=25&type_all=true&k=true&page=${pageNo}${hierarchiesList ? '&hierarchy_ids=' + hierarchiesList : ''
      }`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        this._loader.hide();
        this.qualification_types = data?.qualification_types?.sort((qualType1, qualType2) => qualType1?.name?.localeCompare(qualType2?.name));
        this.setQualifications();
      },
      error: err => {
        // this._alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }

  changeLocation(event, onEditOrClone?) {
    this.createJobObject.selectedLocation = this.createJobObject?.locations?.filter(l => l.id === event);
    this.fetchTimesheetTypes();
    if(!onEditOrClone) {
      this.getCurrencies(this.createJobObject?.selectedLocation[0]?.currencies);
    }
    if (event) {
      this.getRateCard(onEditOrClone);
    }
  }
  
  updateLocationTooltipData(){
    let location = this.createJobObject?.selectedLocation;
    if(location && location.length > 0){
      for (let i = 0; i < location.length; i++) {
        const element = location[i];
        this.workLocation += element?.name+" - "+element?.code;
        if(i<(location.length-1)){
          this.workLocation += ', ';
        }
      }
      this.workLocation = (location[0].name && location[0].code) ? (location[0].name+" - "+location[0].code) : "";
    }else{
      this.workLocation = '';
    }
  }

  getRateCard(onEditOrClone?) {
    if (!(this.selectedTemplate?.id && this.basicJobInfo?.selectedHierarchy?.id && this.createJobObject?.selectedLocation?.[0]?.id)) {
      return;
    }
    this._loader.show();
    this.createJobObject.rateOption = new Array();
    if (!onEditOrClone) {
      if (!this.visibility) {
        const val = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
        this.createJobForm.patchValue({
          max_bill_rate: val,
          min_bill_rate: val,
        });
      }
    }
    if (!this.createJobObject.rates) {
      this.createJobObject.rates = {};
    }
    this.createJobObject.rates.isMaxNotChange = false;
    this.createJobObject.rates.isMinNotChange = false;
    this.showSummaries = false;
    if (this.moduleId) {
      this.getRateCardFromRuleEngine(onEditOrClone);
    } else {
      this.jobService.get(`/configurator/resources/module-groups`).subscribe({
        next: (data: any) => {
          this.moduleId =
            data?.module_groups
              ?.filter(mg => mg?.name?.toLowerCase() === 'job')?.[0]
              ?.modules?.filter(m => m?.code?.toLowerCase() === 'jobs')?.[0]?.id ?? null;
          if (this.moduleId) this.getRateCardFromRuleEngine(onEditOrClone);
          else this.getRateCardFromConfigurations(onEditOrClone);
        },
        error: error => {
          this.getRateCardFromConfigurations(onEditOrClone);
        },
      });
    }
  }

  getRateCardFromRuleEngine(onEditOrClone?) {
    const payload = {
      eventSlug: 'JOB_RATE_CARDS',
      programId: this.programId,
      moduleId: this.moduleId,
      payload: JSON.stringify({
        hierarchy: [this.basicJobInfo.selectedHierarchy?.id],
        template: [this.selectedTemplate?.id],
        location_id: [this.createJobObject.selectedLocation?.[0]?.id],
        currency: this.createJobForm.get('currency')?.value ?? '',
        job_title: this.selectedTemplate?.ref_title?.title ?? '',
        job_category: this.selectedTemplate?.category?.category_name ?? '',
        program_industry: [this.createJobForm.get('labor_category').value],
        hierarchy_rule: this.basicJobInfo.selectedHierarchy?.id,
        unit_of_measure: this.createJobForm.get('unit_of_measure')?.value?.unit_of_measure || this.createJobForm.get('unit_of_measure')?.value
      }),
    };
    this.setCurrencySymbol();
    this.jobService.post(`/rule-engine/rule-consumption-api`, payload).subscribe({
      next: (data: any) => {
        if (data.max_rate || data.max_rate_rule || data.min_rate || data.min_rate_rule) {
          if(!onEditOrClone) {
            this.patchRateData(data);
          }
          this.addMinMaxLimit(data);
          this.createJobObject.rateOption = this.rateCardOption;
          this._loader.hide();
        }
        else this.getRateCardFromConfigurations(onEditOrClone);
      },
      error: error => {
        this.getRateCardFromConfigurations(onEditOrClone);
      },
    });
  }

  getRateCardFromConfigurations(onEditOrClone?) {
    let url = `/configurator/programs/${this.programId}/rate-cards${
      this.selectedTemplate?.ref_title?.id ? '?job_title_id=' + this.selectedTemplate?.ref_title?.id : ''
    }${this.selectedTemplate?.category?.id ? '&job_category_id=' + this.selectedTemplate?.category?.id : ''}&job_template_id=${
      this.selectedTemplate?.id
    }&hierarchy=${this.basicJobInfo.selectedHierarchy?.id}&currency=${this.createJobForm.get('currency')?.value ?? ''}`;
    if (this.createJobObject.selectedLocation && this.createJobObject.selectedLocation?.length > 0) {
      url = `${url}&work_location=${this.createJobObject.selectedLocation[0]?.id}`;
    } else {
      url = `${url}&work_location=`;
    }
    this.setCurrencySymbol();
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          const rateCardData = JSON.parse(JSON.stringify(data?.results));
          let jobdtls = this.createJobForm.value;
          if (rateCardData && rateCardData.length > 0) {
            this.createJobObject.rateCart = rateCardData[0];
            const filteredRates = this.filterRates([...rateCardData[0]?.filtered_rates].filter(fr => fr.is_active));
            this.createJobObject.rateOption = filteredRates[0]?.filtered_unit_of_measures;
            if (!this.enforcedRateCard) {
              let tempRateOptions = [];
              let tempRateFound;
              this.rateCardOption.forEach(rate => {
                tempRateFound = this.createJobObject.rateOption?.find(x => x?.unit_of_measure?.toLowerCase() === rate?.unit_of_measure?.toLowerCase());
                if(tempRateFound?.unit_of_measure) {
                  tempRateFound.unit_of_measure_label = this.jobdetailService.toTitleCase(tempRateFound.unit_of_measure);
                }
                tempRateOptions.push(tempRateFound ? tempRateFound : rate);
              });
              this.createJobObject.rateOption = tempRateOptions;
            }
            this.createJobForm.patchValue({ RateCardDetails: this.createJobObject.rateOption });
            this.getResourceBudget();
          } else {
            const val = this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true });
            if (!jobdtls.max_bill_rate) {
              this.createJobForm.patchValue({
                max_bill_rate: val,
              });
            }
            if (!jobdtls.min_bill_rate) {
              this.createJobForm.patchValue({
                min_bill_rate: val,
              });
            }
            this.createJobObject.rateOption = this.rateCardOption;
            this.createJobForm.patchValue({ RateCardDetails: this.createJobObject.rateOption });
            this.createJobObject.rateCart = {};
          }
        }
      },
      error: error => {
        this._loader.hide();
        this.showError(error);
      },
      complete: () => {
        this._loader.hide();
        if (typeof this.createJobForm?.get('unit_of_measure')?.value === 'object') {
          this.addMinMaxLimit(
            this.createJobObject?.rateOption?.find(
              ro => ro?.unit_of_measure?.toLowerCase() === this.createJobForm?.get('unit_of_measure')?.value?.unit_of_measure?.toLowerCase(),
            ),
          );
        } else {
          this.addMinMaxLimit(
            this.createJobObject?.rateOption?.find(
              ro => ro?.unit_of_measure?.toLowerCase() === this.createJobForm?.get('unit_of_measure')?.value?.toLowerCase(),
            ),
          );
        }
        if (!onEditOrClone) {
          if (typeof this.createJobForm?.get('unit_of_measure')?.value === 'object') {
            this.patchRateData(
              this.createJobObject?.rateOption?.find(
                ro => ro?.unit_of_measure?.toLowerCase() === this.createJobForm?.get('unit_of_measure')?.value?.unit_of_measure?.toLowerCase(),
              ),
            );
          } else {
            this.patchRateData(
              this.createJobObject?.rateOption?.find(
                ro => ro?.unit_of_measure?.toLowerCase() === this.createJobForm?.get('unit_of_measure')?.value?.toLowerCase(),
              ),
            );
          }
        }
      },
    });
  }

  addMinMaxLimit(event) {
    if (this.name === JOB_STATE.EDIT_APPROVED_JOB) {
      return;
    }
    this.createJobObject.rates = event;
    this.createJobObject.rates['isMinNotChange'] = event?.min_rate_rule === 'Cannot Change' ?? false;
    this.createJobObject.rates['isMinLimit'] = event?.min_rate_rule === 'Cannot Reduce' ?? false;
    this.createJobObject.rates['isMaxNotChange'] = event?.max_rate_rule === 'Cannot Change' ?? false;
    this.createJobObject.rates['isMaxLimit'] = event?.max_rate_rule === 'Cannot Increase' ?? false;
  }

  setCurrencySymbol() {
    if (this.createJobForm.get('currency').value) {
      let currency = this.createJobForm.get('currency').value;
      let currencySymbol = this.createJobObject?.currencies?.filter(c => c.name === currency);
      if (currencySymbol && currencySymbol.length > 0) {
        if (currencySymbol[0]?.symbol) {
          this.createJobObject.currencySymbol = currencySymbol[0]?.symbol;
        } else {
          this.createJobObject.currencySymbol = this.getCurrencySymbol(currencySymbol[0]?.name);
        }
      }
    }
  }

  filterRates(rates, caseName?) {
    if (rates && rates.length) {
      /** NOTE: This requires complete filteration, so
        * DO NOT add break; statement after cases, and
        * mantain the order/sequence */
      switch (caseName ?? 'job-template') {
        case 'job-template':
          if (this.selectedTemplate?.id) {
            rates = rates.filter(fr => fr.job_template_id && fr.job_template_id === this.selectedTemplate?.id).length ?
                    rates.filter(fr => fr.job_template_id && fr.job_template_id === this.selectedTemplate?.id) : (
                      rates.filter(fr => !fr.job_template_id).length ? rates.filter(fr => !fr.job_template_id) : rates
                    );
          }
        case 'hierarchy':
          if (this.basicJobInfo?.selectedHierarchy?.id) {
            rates = rates.filter(fr => fr.hierarchy_id && fr.hierarchy_id === this.basicJobInfo.selectedHierarchy?.id).length ?
                    rates.filter(fr => fr.hierarchy_id && fr.hierarchy_id === this.basicJobInfo.selectedHierarchy?.id) : (
                      rates.filter(fr => !fr.hierarchy_id).length ? rates.filter(fr => !fr.hierarchy_id) : rates
                    );
          }
        case 'work-location':
          if (this.createJobObject.selectedLocation && this.createJobObject.selectedLocation.length && this.createJobObject.selectedLocation[0]?.id) {
            rates = rates.filter(fr => fr.work_location_id && fr.work_location_id === this.createJobObject.selectedLocation[0]?.id).length ?
                    rates.filter(fr => fr.work_location_id && fr.work_location_id === this.createJobObject.selectedLocation[0]?.id) : (
                      rates.filter(fr => !fr.work_location_id).length ? rates.filter(fr => !fr.work_location_id) : rates
                    );
          }
      }
      return rates;
    }
    return [];
  }

  getCurrencySymbol(name) {
    if (name) {
      const currencyName = name.toUpperCase();
      const symbol = this.accuracyPipe.transform(null, null, { currencyCode: currencyName, display: 'symbol' });
      return symbol;
    }
  }

  patchRateData(event) {
    if (event) {
      this.createJobForm.patchValue({
        min_bill_rate: this.accuracyPipe.transform(event?.min_rate ?? 0.0, AccuracyConfigEnum.RATE, { isEdit: true }),
      });
      this.createJobForm.patchValue({
        max_bill_rate: this.accuracyPipe.transform(event?.max_rate ?? 0.0, AccuracyConfigEnum.RATE, { isEdit: true })
      });
      if (Number(this.createJobForm.get('min_bill_rate').value) !== 0.0 && Number(this.createJobForm.get('max_bill_rate').value) !== 0.0) {
        this.checkMaxMin();
      }
      this.ToFloat();
    } else {
      this.getResourceBudget();
    }
  }

  openDropdown() {
    this.showQualification = !this.showQualification;
  }

  onClickedOutside() {
    this.showQualification = false;
  }

  closeDropdown(qualification, index) {
    if (!qualification.selected) {
      const control = this.createJobForm.get('qualifications') as UntypedFormArray;
      const group = this.fb.group({
        name: [qualification.name],
        qualification_type: [qualification.name],
        qualification_type_id: [qualification.id],
        values: [qualification.values],
        data: [],
        qualification_type_code: [qualification?.code]
      });
      control.push(group);
      // this.searchQualifications(group, { term: '' });
      // qualification.selected= true;
      this.qualification_types[index].selected = true;
    }
    this.showQualification = false;
  }

  removeQualificationValues(item, index, isLocked) {
    if(!isLocked){
      item.get('values')?.value?.splice(index, 1);
      item.get('values').patchValue(item.get('values')?.value);
    }
  }

  getJobTemplateDetails(id) {
    this._loader.show();
    let _url = `/job-manager/programs/${this.currentProgram.id}/job-templates/${id}`;
    this.jobService.get(_url).subscribe({
      next: (data: any) => {
        if (data.job_template) {
          this.selectedTemplate = data?.job_template;
          this.showExpenseAllowed = this.selectedTemplate?.is_expense_allowed;
          this.editExpenseAllowed = this.selectedTemplate?.is_expense_allowed_editable;
          this.showTimesheetType = this.selectedTemplate?.allow_express_offer;
          this.templateQualificationData = this.selectedTemplate?.qualification_types ||  [];
          if (this.selectedTemplate.foundational_data && this.selectedTemplate.foundational_data?.length > 0) {
            this.selectedTemplate.foundational_data = this.jobService?.setFoundationFields(this.selectedTemplate.foundational_data);
          }
          this.templateRateFactorsIds = this.selectedTemplate?.rates?.map(rate => rate?.id);
          // this.getCurrencies();
          this.isEditDescription();
          setTimeout(() => {
            this.getRateCard(true);
          }, 2000);
        }
      },
      error: err => {
        // this._alert.error(errorHandler(err));
        this.showError(err);
      },
    });
  }

  isEditDescription() {
    let account = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    if (account?.role?.organization_category !== 'SUPER_ORG') {
      if (this.selectedTemplate?.user_roles?.length > 0) {
        this.is_Edit_Description = this.selectedTemplate?.user_roles?.some(
          r => r?.id === account?.role?.id,
        );
      }
    }
  }

  setFoundationalFieldsFormValid(isFoundationalFieldsValid) {
    this.isFoundationalFieldsValid = isFoundationalFieldsValid;
  }

  foundationalFieldUpdated(event) {
    this.foundationalFieldsFormData = event;
  }

  customFieldUpdated(event) {
    this.customFieldsFormData = event;
  }

  setCustomFieldsFormValue(isCustomFieldsFormValid) {
    this.isCustomFieldsFormValid = isCustomFieldsFormValid;
  }

  rateFactorEditPermission() {
    return this.userType === 'CLIENT' || this.userType === 'MSP' || this.userType === 'SUPER_ORG';
  }

  get showSaveDraft() {
    return ((this.selectedTemplate?.id ? true : false) &&
    (this.name !== 'editApprovedJob' && this.name !== 'edit_review') &&
    ((this.showJobType && this.selectedJobType) || !this.showJobType) &&
    (this.createJobForm?.value?.job_manager?.id));
  }

  saveDraft(): void {
    this.isDraft = true;
    this.quillInputTxt = this.quillData;
    this.createJobForm.patchValue({description:this.quillInputTxt});
    this.saveJob();
  }

  // get background checks
  // getbackgroundChecks() {
  //   const _url = `/configurator/programs/${this.currentProgram?.id}/background-checklists/required-criterias`;
  //   this.jobService.get(_url).subscribe(
  //     (data: any) => {
  //       if (data && data?.required_criterias && data?.required_criterias?.length > 0) {
  //         this.backgroundcheckData = data?.required_criterias?.filter(b => b.is_enabled);
  //         this.backgroundcheckData?.forEach(c => {
  //           if (this.selectedTemplate?.background_check_list && this.selectedTemplate.background_check_list.length > 0) {
  //             c.is_enabled = this.selectedTemplate.background_check_list?.some(b => b === c?.id);
  //           } else {
  //             c.is_enabled = false;
  //           }
  //         });
  //         this.createJobForm.patchValue({
  //           background_check_list: this.backgroundcheckData
  //         });
  //         this.createJobForm?.controls?.background_check_list?.updateValueAndValidity();
  //       }
  //     });
  // }

  // getEnabledBackgroundCheckList = () => {
  //   let enabledBackgroundCheckListIDs = [];
  //   if (this.createJobForm.get('background_check_list')
  //     && this.createJobForm.get('background_check_list').value?.length > 0
  //     && this.createJobForm.get('is_background_check').value) {
  //     let backGroudCheckList = this.createJobForm.get('background_check_list').value;
  //     let enabledBackgroudList = backGroudCheckList.filter(bck => bck.is_enabled);
  //     if (enabledBackgroudList && enabledBackgroudList.length > 0) {
  //       let ids = enabledBackgroudList.map(bck => bck.id);
  //       enabledBackgroundCheckListIDs.push(...ids);
  //     }
  //   }
  //   return enabledBackgroundCheckListIDs;
  // }

  // removeBackgroundChecks() {
  //   this.selectedTemplate.isbackgroundChecks = !this.selectedTemplate.isbackgroundChecks;
  //   if (!this.selectedTemplate.isbackgroundChecks) {
  //     this.createJobForm?.value?.background_check_list?.forEach(q => {
  //       q.is_enabled = false;
  //     });
  //   }
  //   this.createJobForm?.patchValue({
  //     is_background_check: this.selectedTemplate.isbackgroundChecks
  //   });
  //   this.createJobForm?.controls?.background_check_list?.updateValueAndValidity();
  // }

  // validorBackgroundCheckListFunction = (): ValidatorFn => {
  //   return (control: AbstractControl): ValidationErrors | null => {
  //     let Background = control.value;
  //     if (this.selectedTemplate.isbackgroundChecks) {
  //       if (Background && Background?.length > 0) {
  //         let isEnabled = Background.filter(c => c.is_enabled);
  //         if (isEnabled && isEnabled.length === 0) {
  //           return { backgroundCheckValidMsg: 'Please Select Background checks.' };
  //         }
  //       }
  //     }
  //     return null;
  //   }
  // }

  // toggleBackgroudCheck = (cl: any): void => {
  //   cl.is_enabled = !cl.is_enabled;
  //   this.createJobForm?.controls?.background_check_list?.updateValueAndValidity();
  // }
  /**END BACKGROUD CHECK SECTION */

  //On Boarding_Check List

  getOnBoardingCheckList() {
    const _url = `/configurator/programs/${this.currentProgram?.id}/onboarding/checklists`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        if (data) {
          this.createJobForm.patchValue({
            is_onboarding_checklist: this.selectedTemplate?.is_onboarding_checklist
          });
          let checkListData = data?.checklists;
          checkListData?.forEach(c => {
            if (this.selectedTemplate.configuredCheckList?.id === c?.id) {
              c.checkList = true;
            } else {
              c.is_enabled = false;
            }
          })
          this.createJobForm.patchValue({
            checklist: checkListData
          });
          this.createJobForm?.controls?.checklist?.updateValueAndValidity();
        }
      });
  }

  toggleOnBoardingChecklist(cl) {
    cl.is_enabled = true;
    this.createJobForm?.value?.checklist?.forEach(q => {
      if (q?.id === cl?.id) {
        cl.is_enabled = true;
      } else {
        q.is_enabled = false;
      }
    });
    this.createJobForm?.controls?.checklist?.updateValueAndValidity();
  }

  removeOnboardingCheckList() {
    let checkListActivateStatus = !this.createJobForm.get('is_onboarding_checklist').value;
    if (!checkListActivateStatus) {
      this.createJobForm?.value?.checklist?.forEach(q => {
        q.is_enabled = false;
      });
    }
    this.createJobForm?.patchValue({
      is_onboarding_checklist: checkListActivateStatus
    });
    this.createJobForm?.controls?.checklist?.updateValueAndValidity();
  }

  getSelectedOnBoarding = () => {
    let enabledCheckListID = null;
    if (this.createJobForm.get('checklist')
      && this.createJobForm.get('checklist').value?.length > 0
      && this.createJobForm.get('is_onboarding_checklist').value) {
      let checkLists = this.createJobForm.get('checklist').value;
      let enabledCheckList = checkLists.find(bck => bck.is_enabled);
      if (enabledCheckList) {
        enabledCheckListID = enabledCheckList.id;
      }
    }
    return enabledCheckListID;
  }

  validorOnBaordingCheckList = (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      let OnBoardings = control.value;
      if (this.createJobForm?.get('is_onboarding_checklist')?.value && !this.disableOnboarding) {
        if (OnBoardings && OnBoardings?.length > 0) {
          let isEnabled = OnBoardings.filter(c => c.is_enabled);
          if (isEnabled && isEnabled.length === 0) {
            return { backgroundCheckValidMsg: 'Please Select OnBoarding' };
          }
        }
      }
      return null;
    }
  }

  get disableWorkLocation() {
    return (this.currentProgram?.config?.is_work_location_read_only && this.createJobForm?.get('locations')?.value && this.isUserLocation || this.jobManagerAssociatedWorkLocation?.length == 1 );
  }

  /**END ONBOARDING CHECK SECTION */

  getEndRange(d: Date) {
    if (this.tenureSpan && this.tenureSpanUnit && d) {
      const endRange = new Date(d);
      endRange.setDate(d.getDate() - 1);
      if (d) {
        switch (this.tenureSpanUnit) {
          case 'days':
            endRange.setDate(endRange.getDate() + this.tenureSpan);
            break;
            case 'months':
              endRange.setMonth(endRange.getMonth() + this.tenureSpan);
            break;
          case 'years':
            endRange.setFullYear(endRange.getFullYear() + this.tenureSpan);
            break;
          }
        //this.tenureMessage = `Select the date within
        //${this.datePipe?.transform(d, this.dateFormat, null, null, true)} TO
        //${this.datePipe?.transform(endRange, this.dateFormat, null, null, true)}`;
        this.tenureMessage = `job_tenure_message`;
        return new Date(endRange);
      }
    }
    return;
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

  get tenureLimitCheck() {
    const startDate = this.getDate(this.datePipe.transform(this.createJobForm.get('start_date').value, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
    const endDate = this.getDate(this.datePipe.transform(this.createJobForm.get('end_date').value, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat));
    const endRange = this.getEndRange(startDate);
    if (endDate >= startDate && endDate <= endRange) {
      return true;
    }
    return false;
  }



  get_UOM_list() {
    const unit_of_measure = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.config?.unit_of_measures;
    if (unit_of_measure && Object.keys(unit_of_measure)?.length > 0) {
      Object.keys(unit_of_measure)?.forEach(key => {
        if(unit_of_measure[key]) {
          this.rateCardOption.push(
            {
              'unit_of_measure': key?.toLowerCase(),
              'unit_of_measure_label': this.jobdetailService.toTitleCase(key)
            }
          )
        }
      })
      if (this.rateCardOption?.length == 1 && !this.jobId) {
        this.createJobForm.patchValue({ unit_of_measure: this.rateCardOption[0]?.unit_of_measure });
        this.getRateCard();
      }
    }
  }
  
  addAccuracy(val){
    if(val == 'min') {
      this.createJobForm.patchValue({
        min_bill_rate: this.accuracyPipe.transform((this.createJobForm.get('min_bill_rate').value),AccuracyConfigEnum.RATE,{isEdit: true})
      })
    } else {
      this.createJobForm.patchValue({
        max_bill_rate: this.accuracyPipe.transform((this.createJobForm.get('max_bill_rate').value),AccuracyConfigEnum.RATE,{isEdit: true})
      })
    }
  }

  uploadFiles(event) {
    this.uploadJD = (event && event.length > 0) ? event : [];
  }

  getFileData(data) {
    if (data) {
      if (data?.key) {
        this.jobDescriptionFile = data;
        this.jdParsingFile = [data];
      }
    } else if(data?.isShowData){
      this.jobDescriptionFile = data;
      this.jdParsingFile = [];
    }
    else {
      this.jobDescriptionFile = data;
      this.jdParsingFile = [];
      this.quillInputTxt = this.prevJobDescData ?? "";
      if(!this.prevJobDescData) {
        this.quillInputTxt = " ";
        this.quillInputTxt = null;
      };
    }
  }

  dataBeforeParseFile(event) {
    this.prevJobDescData = event;
  }

  getQuillInputText(res) {
    this.quillData = res;
    if(!this.quillData || this.quillData?.length == 0) {
      this.quillInputTxt = res;
    }
    if(res?.isParsed) {
      this.isJobParsingDone = true;
      this.quillInputTxt = res?.data;
    }
  }

  isQualificationValid() {
    if(!this.isQualificationEnabled) return true;
    const controls = this.createJobForm.get('qualifications') as UntypedFormArray;
    const arr = controls?.value?.filter((res)=> res?.is_qualification_type_required && res?.values?.length == 0);
    return arr?.length == 0 ? true : false;
  }

  createQualificationPayload() {
    const qualifications = [];
    this.createJobForm?.value?.qualifications?.forEach((qualD)=>{
      const qualification_type_data = {
        id:qualD?.qualification_type_id,
        is_required:qualD?.is_qualification_type_required || false,
        name: qualD?.qualification_type,
        code: qualD?.qualification_type_code
      }
      const qualification_val_arr = [];
      qualD?.values?.forEach((res)=>{
        const qual_val_obj = {
          id: res?.id,
          level: res?.level || 0,
          is_required: res?.is_required || false,
          is_locked: res?.is_locked || false
        };
        qualification_val_arr.push(qual_val_obj);
      })
      qualification_type_data['qualifications'] = qualification_val_arr;
      qualifications.push(qualification_type_data);
    });
    return qualifications;
  }

  onCloseModal() {
    this.modalVisibility = false;
  }

  fetchTimesheetTypes() {
    const jobFormDetails = this.createJobForm.value;
    if (!this.showTimesheetType || !this.basicJobInfo?.selectedHierarchy?.id || !jobFormDetails?.locations) {
      return;
    }
    this.loadingtimesheetType = true;
    this.jobdetailService
      .getTimeSheetTypes(this.programId, this.basicJobInfo?.selectedHierarchy?.id, jobFormDetails?.locations , typeof jobFormDetails?.unit_of_measure == 'object' ? this.jobdetailService.getUOMType(jobFormDetails?.unit_of_measure?.unit_of_measure) : this.jobdetailService.getUOMType(jobFormDetails?.unit_of_measure))
      .subscribe({
        next: (response: any) => {
          this.timesheetTypeList = response?.data?.config;
          const timesheet_type = jobFormDetails?.timesheetType;
          const isPresent = this.timesheetTypeList?.find((res) => res?.value == timesheet_type);
          if (!isPresent) {
            this.createJobForm.get('timesheetType').setValue(null);
          }
          this.loadingtimesheetType = false;
        },
        error: (error) => {
          this.loadingtimesheetType = false;
        }
      });
  }

  flattenHierarchyArray(data){
    data?.forEach(elem => {
      if (!this.hierarchyFlattenArray) {
        this.hierarchyFlattenArray = new Array()
      }
      if(!elem?.is_hidden) {
        this.hierarchyFlattenArray.push(elem);
      }
      if (elem?.hierarchies?.length) {
        this.flattenHierarchyArray(elem?.hierarchies);
      }
    });
  }

  getHierarchyRefFlat(data) {
    data?.forEach(elem => {
      if (!this.hierarchyReferenceCopy) {
        this.hierarchyReferenceCopy = new Array()
      }
      if(!elem?.is_hidden) {
        this.hierarchyReferenceCopy.push(elem);
      }
      if (elem?.hierarchies?.length) {
        this.getHierarchyRefFlat(elem?.hierarchies);
      }
    });
  }

  clearHierarchy(){
    this.showError('Please select Hierarchy.');
    this.createJobForm.patchValue({ hierarchy: null });
    this.defaultHierarchy = [];
  }

  getCandidateDetails(data: any){
    this.candidates = data;
  }

  goBack() {
    this.location.back();
  }

  selectJobType(event: any){
    this.customFieldParams = {
      job_type: this.jobTypes?.find((jobType)=>jobType?.value===event)?.label
    }
    if(this.job_action==='create' && !this.isCreateFromTemplate){
      this.getRecentJobList();
      this.getPopularJobList();
    }

  }

  getJobTypePicklist(){
    this.jobTypeLoading=true;
    let url=`/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc`
    this.httpService.get(url).subscribe({
      next:(data:any)=>this.jobTypes= data?.picklist_items,
      error:(err:any)=>this._alert.error('An error occurred.'),
      complete:()=>this.jobTypeLoading=false
    })
  }

  dateValidator = (formControl: AbstractControl) => {
    let { start_date, end_date } = formControl?.value;
    start_date = this.convertToNormalDate(start_date);
    end_date = this.convertToNormalDate(end_date);

    if (start_date && end_date && (new Date(start_date).getTime() > new Date(end_date).getTime())) {
      return { startEndDateExceedError: 'job_end_date_should_be_greater_then_job_start_date' }
    }
    return null;
  }

  convertToNormalDate(dateString: string) {
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = this.dateFormat.split('-');

    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = this.dateFormat.split('/');
    }

    if (this.dateFormat.includes('-')) {
      formatArray = this.dateFormat.split('-');

    } else if (this.dateFormat.includes('/')) {
      formatArray = this.dateFormat.split('/');
    }

    for (let index = 0; index < formatArray?.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${month}-${date}-${year}`
  }

  stopPropagation(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  sendFdData() {
    this.isFdValuesLoaded = true;
  }


  get isStRatePresentInForm() {
    return (this.createJobForm?.get('rates')?.value?.findIndex((formRateFactor)=>formRateFactor?.abbreviation?.toLowerCase() === 'st') > -1);
  }

  addAccuracyInFactor(value) {
    if (value && value?.factor) {
      value.factor = this.accuracyPipe.transform(value?.factor, AccuracyConfigEnum.RATE, { isEdit: true });
    }
  }

  addAccuracyInFlatAdjustment(value, rateType) {
    if (value && rateType) {
      value[rateType] = this.accuracyPipe.transform(value?.[rateType], AccuracyConfigEnum.AMOUNT, { isEdit: true });
    }
  }

}
