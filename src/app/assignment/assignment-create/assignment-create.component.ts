import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { SourcingModel }from '../enums/assignment-sourcing-models';
import { TimesheetType, TimesheetGracePeriod, UsersType } from 'src/app/wipro-timesheet/timesheet.enums';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { AmountType , JobStatus} from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentService } from '../assignment.service';
import { HttpService } from 'src/app/core/services/http.service';
import { AssignmentActiveUpon } from '../enums/assignment-active-upon';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog/confirmation-dialog.service';
import { RateVal, RateFactors, RateValWithEdit, RateFactorsWithEdit } from '../assignment.model'
import { AssignmentPermissions } from '../enums/assignment-permissions';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { RATETYPES } from '../component/assignment-details-view/assignment-details-view.component';
import { AccountCodeData } from './../../library/account-code-generate/models/account-code-data';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT } from 'src/app/shared/enums';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { UserService } from 'src/app/core/services/user.service';
import { VendorType } from '../enums/vendor-type';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import * as _ from 'lodash';

export enum CANDIDATE_SOURCE_TYPE {
  SOURCED = 'Sourced',
  PAYROLLED = 'Payrolled',
}

export enum UPDATE_FOR {
  DATE = 'date',
  RATE = 'rate',
  REVIEW = 'review',
  TAX = 'tax'
}

export enum JOB_STATUS {
  EXISTING_JOB = 'existing_job',
  JOB_TEMPLATE = 'job_template'
}

export enum PROGRAM_TYPE {
  SELF_SERVICED = 'SELF-SERVICED',
  MSP_MANAGED = 'MSP-MANAGED'
}

export enum RATE_CHANGE_TYPE {
  BASE_RATES_CHANGED = 'base_rates_changed',
  BASE_RATES_CHANGED_FOR_ABB = 'base_rates_changed_for_abb',
  ACTIVITY_BASE_RATES_CHANGED = 'activity_base_rates_changed',
  ACTIVITY_BASE_RATES_CHANGED_FOR_ABB = 'activity_base_rates_changed_for_abb',
}

export enum SOURCING_TYPE {
  SOW = 'sow'
}

export enum RATE_TYPE {
  billrate = 'bill_rate',
  payrate = 'pay_rate',
  vendorrate = 'vendor_rate',
}

const WORK_LOC_URL = '/configurator/programs/${programId}/work-locations?status=true&order_by=asc&';
const TEMPLATE_URL = '/job-manager/programs/${programId}/basic-job-templates?page=1&limit=10&is_enabled=True&';
const ASSIGNMENT_MANAGER_URL = '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&self_at_top=true';
const JOB_URL = '/job-manager/programs/${programId}/jobs?page=1&limit=10&status=active_jobs&';
@Component({
  selector: 'app-assignment-create',
  templateUrl: './assignment-create.component.html',
  styleUrls: ['./assignment-create.component.scss']
})
export class AssignmentCreateComponent implements OnInit, OnDestroy {
  existingTax: any;
  dateFormatEnum = DATE_FORMAT; 
   public accountCodeCreationActive: boolean = false;
  showAccountCode :string ='hidden';
  public accountCode: AccountCodeData;
  display_title_from: any;
  moduleName:string= undefined;
  editActivity: any;
  public emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  programId: string;
  is_activity_based = false;
  activeTab = 'candidate-info';
  is_Sourcing_Model_SOW: any;
  existingSOW: any = [];
  existingSOWProject: any = [];
  private searchCandidateSubscription: any;
  loaderObj = {};
  assignmentConfig: any;
  approvalConfig: any;
  public is_tax_hidden = false;
  supervisors: any = [];
  extend: any;
  sow_foundational_data:any=[];
  baseURL:any;
  public isOpenReject = false;
  pending_review: any= {};
  uuid : string;
  uniqueId: string;
  isEffectiveDateSetting : any;
  accuracyConfig = AccuracyConfigEnum;
  isFinancialChange : boolean = false;
  markupByRateTypeEnabled: boolean = false;
  costComponentEnabled: boolean = false;
  costComponentGroupId: string;
  costComponentGroupDetails: any;
  initialCostComponentValues: Map<string, any> = new Map();
  private _editableRateFactors: boolean = false;
  private _editableMarkup: boolean = false;
  private _editableCostComponent: boolean = false;
  applicable_on: any;
  SourcingModel = SourcingModel;
  isCreateFromSOW: boolean = false;
  support_text:any = {} ;
  dataSourceUrl: any[] = [
    {
      'slug': 'sourcing_model',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=assignment_sourcing_model&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'job_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'expense_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&k=',
        'type': 'url',
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
    },
    {
      'slug': 'timesheet_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&k=',
        'type': 'url',
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
    },
    // {
    //   'slug': 'vendor_id',
    //   'datasource': {
    //     'url': '/configurator/programs/${programId}/vendors?ordering=organization__name&active=true&exclude_dsaas_vendor=true&k=',
    //     'type': 'url',
    //     'getBy': [
    //       'program_vendors'
    //     ]
    //   },
    //   // "bind_value": "vendor?.id",
    // },
    {
      'slug': 'source_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=worker_source_type&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "value",
    },
    {
      'slug': 'assignment_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&k=',
        'type': 'url',
        'getBy': [
          'members'
        ],
        'params': [
          {
            'name': 'job_id',
            'required': true
          }
        ]
      },
      "bind_value": "id",
    },
    {
      'slug': 'job_id',
      'datasource': {
        'url': '/job-manager/programs/${programId}/jobs?page=1&limit=10&title_or_template=',
        'type': 'url',
        'getBy': [
          'jobs'
        ]
      },
      "bind_value": "id",
    },
    {
      // &order_by=desc&key=ref_title Remove for  AMFMI-2546
      'slug': 'assignment_title_uuid',
      'datasource': {
        'url': '/job-manager/programs/${programId}/basic-job-templates?page=1&limit=10&is_enabled=True&template_name=',
        'type': 'url',
        'getBy': [
          'job_templates'
        ]
      },
      "bind_value": "id",
    }, 
    // {
    //   'slug': 'work_location',
    //   'datasource': {
    //     'url': '/configurator/programs/${programId}/work-locations?status=true&order_by=asc&k=',
    //     'type': 'url',
    //     'getBy': [
    //       'work_locations'
    //     ]
    //   },
    //   "bind_value": "id",
    // },
    /*{
      'slug': 'shift_timing',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists//items?picklist_slug=shift_timing',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },*/
    {
      'slug': 'worker_classification',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=worker_classification&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    /*  {//twice same code is written
       'slug': 'worker_classification',
       'datasource': {
         'url': '/configurator/programs/${programId}/picklists//items?picklist_slug=worker_classification&order_by=asc',
         'type': 'url',
         'getBy': [
           'picklist_items'
         ]
       },
       "bind_value": "label",
     }, */

    {
      'slug': 'days_per_week',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=no_of_working_days_week&is_enabled=true',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'rate_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=unit_of_measure&is_enabled=true',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "value",
    },
    {
      'slug': 'currency',
      'datasource': {
        'url': '/configurator/programs/${programId}/currencies',
        'type': 'url',
        'getBy': [
          'currencies'
        ]
      },
      "bind_value": "code",
    },
    {
      'slug': 'timesheet_location_popup',
      'type' : 'popup_info',
      'pop_up_message': `This Work Location & Timesheet type update will discard all your impacted timesheets.
       The user must need to recreate and resubmit these discarded timesheets again.
       Do you want to continue?`,
       "is_archive" : {},
    }
  ];
  delegatedUser = {};
  dropDownOptions: any = {};
  isWorkerIncluded: boolean = false;
  programType: any;
  assignmentActiveUponValues: any = [];
  markupConfigObj: any;
  selectedSow:any = {} ;
  rateModelObj = {
    billrate: 'BILL_RATE',
    markup: 'MARKUP',
    payrate: 'PAY_RATE'
  }
  isActivityRename: { create: any; update: any; };
  taxUpdateSetting: { custom: any ; system: any };
  sowBudgetSufficient: any = null;
  budget_difference: any = null;
  assignmentValueFor: Object = {'is_hybrid_timesheet' : false};
  private searchSOWSubscription: any;
  tempRateFactor: any
  isPopoverOpen: boolean;
  otFactorsPopover: number = null;
  popoverType: string = '';
  // selected_SOW: any;
  public get UPDATE_FOR(): typeof UPDATE_FOR {
    return UPDATE_FOR;
  }

  public get CANDIDATE_SOURCE_TYPE(): typeof CANDIDATE_SOURCE_TYPE {
    return CANDIDATE_SOURCE_TYPE;
  }

  public foundational_params: any = {
    'ordering': 'ref_order'
  };

  ngAfterViewChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  dateValidator = (formControl: AbstractControl) => {
    let { worker_original_start_date, start_date, end_date } = formControl?.value;
    start_date = this.convertToNormalDate(start_date);
    worker_original_start_date = this.convertToNormalDate(worker_original_start_date);
    end_date = this.convertToNormalDate(end_date);
    if (worker_original_start_date && start_date && (new Date(worker_original_start_date).getTime() > new Date(start_date).getTime())) {
      return { workerOrignalDateErr: 'Assignment Start Date should be equal or greater than Worker Original Start Date.' }
    }

    if (start_date && end_date && (new Date(start_date).getTime() > new Date(end_date).getTime())) {
      return { workerDurationDateErr: 'Assignment End Date should be greater than Assignment Start Date.' }
    }
    if (this.dropDownOptions?.selectedMilestone && this.dropDownOptions?.selectedMilestone?.hasOwnProperty('client_selected_end_date') && end_date) {
      let sow_milestone_date = new Date(parseInt(this.dropDownOptions?.selectedMilestone?.client_end_date?.year), parseInt(this.dropDownOptions?.selectedMilestone?.client_end_date?.month) - 1, parseInt(this.dropDownOptions?.selectedMilestone?.client_end_date?.day), 0, 0, 0, 0);
      if ((new Date(end_date).getTime() > new Date(sow_milestone_date).getTime())) {
        return { workerDurationDateErr: 'Maximum duration of the assignment cannot be greater than milestone end date.' }

      }
    }
    return null;
  }

  dateValidatorStartEnd = (formControl: AbstractControl) => {
    let { start_date, end_date } = formControl?.value;
    start_date = this.convertToNormalDate(start_date);
    end_date = this.convertToNormalDate(end_date);
    if (start_date && end_date && (new Date(start_date).getTime() > new Date(end_date).getTime())) {
      return { workerDurationDateErr: 'Assignment End Date should be greater than Assignment Start Date.' }
    }
    return null;
  }

  assignmentCreateForm: UntypedFormGroup = this.fb.group({
    job_type: [null],
    candidate_uuid: [null, Validators.required],
    vendor_id: [null, Validators.required],
    source_type: [null, Validators.required],
    source_id: [],
    original_start_date: ['', Validators.required],
    official_email: ['', [Validators.required,Validators.pattern(this.emailvalidation)]],
    sso_id: [],
    worker_classification: [null],
    hierarchy_id: ['', Validators.required],
    hierarchy_name: [],
    sourcing_model: [null, Validators.required],
    job_id: [],
    sow_id: [],
    sow_project_id: [],
    sow_owner_id : [],
    assignment_title_uuid: [null, Validators.required],
    work_location: [null, Validators.required],
    assignment_manager: [null, Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    worker_original_start_date: ['', Validators.required],
    // shift_timing: [{
    //   value: 'Default',
    //   disabled: true
    // }],
    shift_timing: ['Default'],
    timesheet_manager: [null, Validators.required],
    timesheet_type: [null, Validators.required],
    st_hours: [this.accuracyPipe.transform(8 , this.accuracyConfig?.hour), Validators.required],
    days_per_week: [null, Validators.required],
    // expense_manager: [{
    //   value: null,
    //   disabled: false
    // }],
    expense_manager: [null, Validators.required],
    ot_exempt_position: [{
      value: false,
      disabled: false
    }],
    remote_worker : [false],
    remote_worker_details : this.fb.group({
     country : [null],
     state : [null],
     county:[null],
     city:[null]
    }),
    rate_model: [null, Validators.required],
    rate_type: [null, Validators.required],
    currency: [null, Validators.required],
    adjusted_markup: [this.accuracyPipe.transform(0,this.accuracyConfig?.markup_percentage, {isEdit : true})],
    vendor_markup: [{
      value: this.accuracyPipe.transform(0,this.accuracyConfig?.markup_percentage, {isEdit : true}),
      disabled: true
    }],
    rate: this.fb.array([]),
    fee: this.fb.array([]),
    tax: this.fb.array([]),
    billrate: [0, Validators.required],
    payrate: [0, Validators.required],
    vendor_rate: [0, Validators.required],
    activity: this.fb.array([this.createActivityForm(1)]),
    total_working_days: [0],
    timesheet_budget: [0],
    gross_allocated_budget: [0],
    estimated_tax: [0],
    estimated_adjustment: [0],
    net_allocated_budget: [0],
    is_timesheet_enabled: [true],
    is_quick_assignment: [true],
    is_billable: [true],
    is_account_required: false,
    is_expense_enabled: true,
    active_on: [null, Validators.required],
    job: [false],
    job_template: [false],
    rate_factor: [],
    account_code : [null],
    is_fees_applicable: [false],
    candidate_sourcing_type: [null],
    default: [null],
    total_approved_spend: [0],
    is_dsaas: [false],
    onboarding_checklist_id: [null, this.checkAuthorization('manage_onboarding_assignment') ? [Validators.required] : null ],
    adjustment_fee: this.fb.array([]),
  }, {
    validators: [this.payRateValidator, this.dateValidator, this.dateValidatorStartEnd]
  });
  isAddHirerachy = 'hidden';
  isCreateCandidate = 'hidden';
  selectedHierarchy: string[] = [];
  selectedHierachyObj: any;
  selectedHierarchyName: string = '';
  updateOfReason: any = [];
  assignmentId: string;
  feesType = [{
    'id': 'dd84f65a-6a28-42f3-85cd-9991y01049a1',
    'slug': 'percentage',
    'label': 'Percentage'
  }];
  items = [
    { label: "Yes", value: true },
    { label: "No", value: false }
  ];
  country = {
    'US': 'USA', 'CA': 'Canada', 'IN': 'India', 'USA': 'USA',
    'CAD': 'Canada', 'IND': 'India', 'SAU': 'Saudi Arabia',
    'UAE': 'UAE', 'QA': 'Qatar', 'QAT': 'Qatar',
    'TR': 'Turkey', 'TUR': 'Turkey'
  }
  assignmentActiveUpon = [
    { name: 'Background completion + Onboarding + Approval', value: 'onboard_bgcheck_approval' },
    { name: 'Background completion + Onboarding', value: 'onboard_bgcheck' },
    { name: 'Create and Saving Assignment', value: 'create' },
    { name: 'On-Boarding Completion', value: 'onboard' },
    { name: 'Background Passed & Completed', value: 'bgcheck' },
    { name: 'After Approval', value: 'approval' }]
  allDisableField = {};
  currency = '';
  dateFormat = DATE_FORMAT?.FORMATDDMMYY;
  effectiveDateOption: any;
  startDateOption: any = {
    language: 'English'
  }
  endDateOption: any = {
    language: 'English'
  };
  moreActivity = false;
  user_type: string;
  is_fees_hidden: boolean = false;
  isClient = false;
  isVendor = false;
  isMsp = false;
  isSuperAdmin = false;
  programManagedType: PROGRAM_TYPE;
  currencyObject = {};
  rateFactor: any[] = [];
  rate_factors_arr: RateFactors[] = [];
  activity_wise_rate_factors_arr:any[]=[];
  final_activity_wise_rate_factors_arr:any[]=[];
  sow_id: string;
  sow_project_id: string;
  vendor_id: string;
  showWelcomeEmail: boolean = true;
  programTypeRateModel = {
    'BILL_RATE': 'billrate',
    'MARKUP': 'markup',
    'PAY_RATE': 'payrate'
  }
  hide_fees = {}
  programDetails: any;
  candidateLoading = false;
  showCreateCandidate: boolean = false;

  user: any;
  popoverActive = false;
  isPopupVisible: boolean = false;
  approvedTSExist: boolean = false;
  orgId : any;
  logs: Log= undefined;
  warning: Log = undefined;
  assignmentPermissions= AssignmentPermissions;
  // isFromSow = false;
  constructor(private _formRendererService: FormRendererService, private fb: UntypedFormBuilder,
    private _storageService: StorageService, private changeDetectorRef: ChangeDetectorRef,
    private alert: AlertService, private router: Router, private loader: LoaderService,
    private activatedRoute: ActivatedRoute, private assignmentService: AssignmentService,
    public httpService: HttpService,
    private userPermissionService: UserPermissionService,
    private reasonCodesService: ReasonCodesService, private eventStream: EventStreamService, private datePipe: LocalDateFormatPipe, private confirmService: ConfirmationDialogService, private authorizationService: AuthorizationService, private accuracyPipe: AccuracyPipe ,    private userService: UserService) {
    }

  ngOnInit(): void {
    this.uuid = uuidv4();
    // this.dropDownOptions.rate_validation = {is_valid : true };
    // this.allDisableField['disableSaveButton']=false;
    this.allDisableField['resume']= false;
    this.allDisableField['rate_estimate']=false;
    this.allDisableField['work_location_impact']= false;
    this.assignmentValueFor['is_all_work_locations'] = true;
    this.assignmentValueFor['show_ssoId'] = true;
    this.programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    let accountConfig = this._storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    this.orgId  = this._storageService.get(StorageKeys.ORGANIZATION_ID);
    this.assignmentValueFor['currentProgram'] = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this._storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.user = this._storageService.get(StorageKeys.CURRENT_USER);
    this.assignmentValueFor['current_user'] = this._storageService.get('user');
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params?.update_for) {
        this.extend = params.update_for;
      }
    });
    if (accountConfig && accountConfig?.components) {
      this.accountCodeCreationActive = true;
    }
    this.baseURL = '/submission-manager';
    this.is_tax_hidden = this.programDetails?.config?.is_tax_hidden || false;
    if (this.programDetails) {
      this.programId = this.programDetails['id'];
      this.dateFormat = this.assignmentService.getDefaultDateFormat();
      if(this.programDetails?.config?.is_work_location_read_only) {
        this.allDisableField['work_location'] = true;
      }
    }
    if (this.programDetails?.config?.is_onboading_disabled) {
      this.assignmentActiveUpon = [
        { name: 'Create and Saving Assignment', value: 'create' },
        { name: 'After Approval', value: 'approval' }];
    } else {
      this.assignmentActiveUpon = [
        { name: 'Background completion + Onboarding + Approval', value: 'onboard_bgcheck_approval' },
        { name: 'Background completion + Onboarding', value: 'onboard_bgcheck' },
        { name: 'Create and Saving Assignment', value: 'create' },
        { name: 'On-Boarding Completion', value: 'onboard' },
        { name: 'Background Passed & Completed', value: 'bgcheck' },
        { name: 'After Approval', value: 'approval' }];

    }
    this.getProgramAssigmentConfig();
    this.assignmentId = this.activatedRoute.snapshot.params.id;
    this.moduleName = this.assignmentId ? 'ASSIGNMENT_REVISION' : 'ASSIGNMENTS';
    this.programManagedType = this.assignmentValueFor['currentProgram']?.service_type;
    this.is_fees_hidden = this.assignmentValueFor['currentProgram']?.config?.is_fees_hidden || false;
    this.hide_fees = this.assignmentValueFor['currentProgram']?.config?.hide_fees || {};
    this.activatedRoute?.queryParams?.subscribe(params => {
      this.sow_id = params['sow_id'];
      this.isCreateFromSOW= this.sow_id ? true: false ;
      if (this.sow_id && !this.assignmentId) {
        this.getFoundationalDefaultValuesForSow(this.sow_id)
      }
      this.sow_project_id = params['project_id'];
      if (params['vendor_id'] && !this.assignmentId) {
        this.vendor_id = params['vendor_id'];
        this.getVendorDetails(params['vendor_id'], true);
      }
      if(params['is_quick_assignment']) {
        this.assignmentCreateForm.get('is_quick_assignment')?.setValue(2);
      }
      if (this.sow_id && this.sow_project_id) {
        this.assignmentCreateForm.patchValue({
          sourcing_model: SOURCING_TYPE.SOW?.toUpperCase()
        });
        this.sow_foundational_data= [];
        this.sourcingModelChanged();
      } else {
        this.sow_id = undefined;
        this.sow_project_id = undefined;
        this.sow_foundational_data= [];//should we remove from foundational data as well?
      }
    });
    if(!this.programDetails?.config?.job_type ) {
      this.dataSourceUrl =  this.dataSourceUrl.filter(item => item?.slug !== 'job_type');
    }
    this.setUpdateConfig();
    this.setUserType();
    this.init();
    if(this.programDetails.config?.is_adjustment_fee_allowed  && !this.assignmentId) {
      this.createTaxAdjustmentForm();
    }
    if(this.accountCodeCreationActive && !this.assignmentId){
      this.assignmentCreateForm.get('account_code').setValidators([Validators.required]);
    }
    if(this.programDetails?.config?.job_type && !this.assignmentId) {
      this.assignmentCreateForm.get('job_type').setValidators([Validators.required]);
      this.assignmentCreateForm.get('job_type').updateValueAndValidity();
    } 
    this._editableRateFactors = this.checkAuthorization(this.assignmentPermissions?.MANAGE_RATE_TYPE_ASSIGNMENT);
    this._editableMarkup = this.checkAuthorization(this.assignmentPermissions?.MANAGE_MARKUP);
    this._editableCostComponent = this.checkAuthorization(this.assignmentPermissions?.MANAGE_COST_COMPONENT);
  }

  goToBasic() {
    this.activeTab = 'candidate-info';
    this.warning = null;
  }

  goToAssignmentDetail() {
    if (this.stepOneValid) {
      this.activeTab = 'assignment-info';
    }
    this.warning = null;
  }

  goToFinancialDetail() {
    if (this.stepTwoValid) {
      this.activeTab = 'finance-info';
      this.getCostComponentGroupId();
    }
  }

  setUpdateConfig = () => {
    if (this.assignmentId) {
      this.activeTab = this.extend == UPDATE_FOR.RATE || this.extend == UPDATE_FOR.DATE || this.extend == UPDATE_FOR.TAX ? 'finance-info' : 'candidate-info';
      this.getCostComponentGroupId();
      this.getTimesheetConfig();
      this.errorCheckList['effective_date'] = `Effective Date required.`
      this.errorCheckList['request_reason'] = `Reason for Update required.`
      this.registerEffectiveDateChange();
      this.getReasonCode();
    }
  }

  setUserType = () => {
    if (this.user_type == 'client') {
      this.isClient = true;
    } else if (this.user_type == UserType.Vendor.toLowerCase()) {
      this.isVendor = true;
    } else if (this.user_type == 'msp') {
      this.isMsp = true;
    } else if (this.user_type === UserType.Super_org.toLowerCase()) {
      this.isSuperAdmin = true
    }
  }

  init() {
    this.dataSourceUrl.forEach(element => {
      if (element?.datasource?.type === 'url') {
        let url = element?.datasource?.url.replace('${programId}', this.programId);
        if (element?.slug === 'assignment_manager' || element?.slug === 'timesheet_manager' || element?.slug === 'expense_manager') {
          url = `${url}&self_at_top=true`;
        }
        if (element?.slug === 'sourcing_model' && (this.user_type?.toUpperCase() === UserType.Vendor || this.user_type?.toUpperCase() === UserType.MSP || this.user_type?.toUpperCase() === UserType.Client) && !this.assignmentId) {
          url = `${url}&org_type=${this.user_type?.toUpperCase()}`;//bugfix AMFMI-595
        }
        // if(element?.slug === 'job_id' && !formValue.vendor_id) {
        //   return ;
        // }
        if ((element?.slug === 'assignment_title_uuid' && !this.assignmentCreateForm.get('hierarchy_id')?.value) || (element?.slug === 'job_id' && !this.assignmentCreateForm.get('hierarchy_id')?.value)) {
          return
        }
        // if (element?.slug === 'assignment_manager' && !this.assignmentCreateForm.get('hierarchy_id')?.value) {
        //     return
        // }
        if (element.subscription) {
          element.subscription.unsubscribe();
        }
        this.loaderObj[element?.slug] = true;
        element.subscription = this._formRendererService.get(url).subscribe((data: any[]) => {
          if (data) {
            element?.datasource?.getBy.forEach(d => {
              data = data[d]
            });
            const selectedOption = this.assignmentCreateForm?.get(element?.slug);
            let selectedOptionDrop;
            if (selectedOption && selectedOption?.value && this.dropDownOptions && this.dropDownOptions[element?.slug]) {
              selectedOptionDrop = this.dropDownOptions[element?.slug]?.find(op => op[element?.bind_value] === selectedOption?.value);
              if(selectedOptionDrop) {
                data.push(selectedOptionDrop);
              }
            }
            if (element.slug === 'days_per_week') {
              data?.sort(this.sortFunction('label'));
            }
            this.loaderObj[element?.slug] = false;
            this.dropDownOptions[element?.slug] = data;
            if (data?.length === 1 && element?.bind_value && !this.assignmentId) {
              this.assignmentCreateForm.patchValue({
                [element?.slug]: data[0][element?.bind_value]
              });
  
              if (element.slug === 'sourcing_model') {
                this.isSourcingModelSOW(data[0][element?.bind_value]);
                this.keepDisabledValue(data[0][element?.bind_value]);
              }
              if (element?.slug === 'currency') {
                this.currency = data[0][element?.bind_value].toUpperCase();
              }
            }
            if (element?.slug === 'currency') {
              data?.forEach(elem => {
                this.currencyObject[elem?.code] = elem?.symbol;
              });

            }
            if(element?.slug === 'sourcing_model') {
              this.hideSourcingModel();
            }
            if ((element?.slug === 'assignment_manager' || element?.slug === 'timesheet_manager' || element?.slug === 'expense_manager') && !this.assignmentId) {
              if (this.user_type?.toUpperCase() === UserType.Client && !this.assignmentConfig?.show_managers?.create?.is_enabled) { //AMFMI-740
                this.setAssignmentManager(this.user);
              }
            }
            if (element?.slug === 'vendor_id') {
              if (this.user_type?.toUpperCase() === UserType.Vendor) {
                this.getVendorDetails(this.user?.organization_id, false);
              } else if (this.user_type?.toUpperCase() !== UserType.Vendor) {
                let defaultVendor = {id: "0", vendor:{id:"0", name:"No Vendor", industries:[]}}
                this.dropDownOptions[element.slug].unshift(defaultVendor);
              }
            }
          }
        })
      } else if (element?.datasource?.type === 'picklist') {
        this.dropDownOptions[element?.slug] = element?.datasource?.options;
        if (element?.datasource?.options?.length === 1 && element?.bind_value && !this.assignmentId) {
          this.assignmentCreateForm.patchValue({
            [element?.slug]: this.dropDownOptions[element?.slug][0][element?.bind_value]
          });
          if(element?.slug === 'timesheet_type') {
            this.checkForActivityOnTimesheetType();
          }
        }
      }
    });
    this.getProgramDetail();
    this.createForm();
    this.hierarchyList();
    this.getApprovalConfig();
    // Waiting for AMFMI-741 to be  discuss.  Temporaly  removing validation.
    // if (this.sow_id) {
    //   const today = new Date();
    //   today.setDate(today.getDate() - 1);
    //   this.startDateOption.enabledDateRanges = [
    //     {
    //       start: today
    //     }
    //   ]
    //   this.endDateOption.enabledDateRanges = [
    //     {
    //       start: today
    //     }
    //   ]
    // }
    this._formRendererService.getCurrency().subscribe(data => {
      if (data) {
        this.currency = data;
      }
    })
  }
  createActivityForm(i): UntypedFormGroup {
    return this.fb.group({
      entity_name: `Activity ${i} `,
      entity_id: '',
      entity_type: "project",
      entity_source: "assignment",
      rates: this.fb.array([]),
      activity_billrate: [this.accuracyPipe?.transform(0, this.accuracyConfig.rate, { isEdit: true }),],
      activity_payrate: [this.accuracyPipe?.transform(0, this.accuracyConfig.rate, { isEdit: true }),],
      activity_vendor_rate: [this.accuracyPipe?.transform(0,this.accuracyConfig.rate, { isEdit: true }),],
      default: null,
      is_fees_applicable: false,
      rename_activity :this.isActivityRename?.create?.activity_rename || false


    },
      {
        validators: [this.activityPayRateValidator]
      }
    );
  }

  addActivity() {
    let activities = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
    let activity = this.createActivityForm(activities?.length + 1);
    activities?.push(activity);
    this.changeDetectorRef?.detectChanges();
    this.updateRateFactorActivity(activities?.length - 1, true);
    this.isActivityExist(activity?.value?.entity_name, activities?.length - 1);
  }
  isFillerJobChecked = false;
  onFilledOptionChange(event: Event): void {
    if (event?.target['checked']) {
      this.isFillerJobChecked = true;
      this.search('job_id', {queryParam : true});
    } else {
      this.isFillerJobChecked = false;
      this.search('job_id', null);
    }
   }

  checkForActivityOnTimesheetType() {
    let  { timesheet_type }  = this.assignmentCreateForm.getRawValue();
    if(this.assignmentConfig?.project_based?.is_allow && timesheet_type) {
      let input_type = this.dropDownOptions?.timesheet_type?.find(timesheet=> timesheet?.value === timesheet_type)?.input_type
      let isPresent =  this.assignmentConfig?.project_based?.timesheet_type?.some(type=> type?.toLowerCase() ===input_type?.toLowerCase());
    //  let isPresent =  this.assignmentConfig?.project_based?.timesheet_type?.some(type=> type?.toLowerCase() ===timesheet_type?.toLowerCase());
     if(isPresent) {
       this.is_activity_based = true;
       this.activityArray.clear();
       this.initializeActivity();
       this.updateRateFactorActivity(0, this?.assignmentId ? false : true);
       this.changeDetectorRef.detectChanges();
     } else {
      this.is_activity_based = false;
     }
    } else {
      this.is_activity_based = false;
    }
  }
  initializeActivity() {
    let activity = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
    activity?.push(this.createActivityForm(activity?.length + 1));
    this.changeDetectorRef.detectChanges();
  }

  removeActivity(index) {
    if (index !== -1) {
      this.activityArray?.removeAt(index);
      this.recalcualatebudget();
    }
    let activity = this.activityArray?.getRawValue() || [];;
    activity.forEach((element, index) => {
      this.isActivityExist(null, index);
    });
  }

  isActivityExist(value, i) {
    let activityData = this.assignmentCreateForm.get('activity') as UntypedFormArray;
    let isPresent = activityData?.value?.some((act, index) => {
      if (index !== i) {
        return act?.entity_name?.toLowerCase()?.trim() === value?.toLowerCase()?.trim();
      }
      return false;
    });
    if (isPresent) {
      activityData.at(i)?.get('entity_name')?.setErrors({ 'invalidName': true });
    } else {
      activityData.at(i)?.get('entity_name')?.setErrors(null);
    }
  }

  
  isCutomTaxExist(value, i) {
    let taxData = this.assignmentCreateForm.get('tax') as UntypedFormArray;
    let isPresent = taxData?.value?.some((act, index) => {
      if (index !== i) {
        let taxName = act?.entity_name || act?.name ;
        return (taxName?.toLowerCase()?.trim() === value?.toLowerCase()?.trim() && !act?.is_deleted);
      }
      return false;
    });
    if (isPresent) {
      taxData.at(i)?.get('entity_name')?.setErrors({ 'invalidName': true });
    } else {
     let err = taxData.at(i)?.get('entity_name')?.errors;
     taxData.at(i)?.get('entity_name')?.setErrors(err || null);
    }
  }

  showTaxEditable(taxName) {
    return this.assignmentId ? (this.existingTax?.length > 0 && this.existingTax?.every(existingTax => existingTax?.entity_name?.toLowerCase() !== taxName?.toLowerCase())) : true;
  }
  

  getProgramAssigmentConfig() {
    this._formRendererService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`).subscribe(res => {
      const { config } = res;
      this.assignmentConfig = config;
      const { effective_date_wise, resource_budget } = this.assignmentConfig || {};
      const budget_calculation_obj = effective_date_wise?.options?.find(data => data?.key == 'budget_calculation');
      if (budget_calculation_obj?.is_enabled && effective_date_wise?.is_allow) {
        this.dropDownOptions['budget_calculation_setting'] = true;
      } else { 
        this.dropDownOptions['budget_calculation_setting'] = false;
      }
      if(this.assignmentConfig?.validate_sow_budget?.is_allow){
        this.dropDownOptions['validate_sow_budget'] = true;
      } else{
        this.dropDownOptions['validate_sow_budget'] = false;
      }
      if(resource_budget?.is_allow && resource_budget?.post_method ) {
        this.dropDownOptions['resource_budget_setting'] = (resource_budget?.post_method === 'true' || resource_budget?.post_method === true);
      }
      let { search_by_job, search_by_job_template } = this.assignmentConfig?.assignment_title || {};
      if(this.assignmentConfig?.hasOwnProperty('effective_date_wise') && this.assignmentConfig?.effective_date_wise?.is_allow){
       this.isEffectiveDateSetting = this.assignmentConfig?.effective_date_wise?.options?.find(res => res?.key === 'allow_update');
      }
      if (this.assignmentConfig?.hasOwnProperty('project_based') && this.assignmentConfig?.project_based?.create && this.assignmentConfig?.project_based?.update) {
        let { create, update } = this.assignmentConfig?.project_based;
        this.isActivityRename = { create, update };
      }
      if (this.assignmentConfig?.hasOwnProperty('tax_update') && this.assignmentConfig?.tax_update?.custom && this.assignmentConfig?.tax_update?.system) {
        let { custom, system } = this.assignmentConfig?.tax_update;
        this.taxUpdateSetting = { custom, system };
      }
     /*  // this.allDisableField['job'] = true;
      // this.allDisableField['job_template'] = true;
      if (search_by_job) {
        this.assignmentCreateForm.get('job')?.setValue(true);
        this.assignmentCreateForm.get('job_template')?.setValue(false);
      }
      if (search_by_job_template) {
        this.assignmentCreateForm.get('job')?.setValue(false);
        this.assignmentCreateForm.get('job_template')?.setValue(true);
      } */ 
      if (!this.assignmentId) {
        this.checkJobStatus(search_by_job, search_by_job_template);
      }
      if(config?.active_on?.options && config?.active_on?.options?.length >= 1){
        let values = config?.active_on?.options?.filter(f => f?.key == 'all');
        this.assignmentActiveUponValues = values?.[0]?.value ?? [];
      }
      // this.is_activity_based = config?.project_based?.is_allow;
      if (config?.secondary_assignment?.is_allow && config?.secondary_assignment?.value) {
        this.isWorkerIncluded = true;
      }
      if(this.assignmentActiveUponValues && this.assignmentActiveUponValues?.length >= 0 && !this.assignmentId) {
        if (this.isVendor && this.assignmentActiveUponValues?.some(active_on => active_on?.value === AssignmentActiveUpon.Onboard_Approval)) {
          this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Onboard_Approval);
        }
        else{
          this.assignmentCreateForm.get('active_on')?.setValue(this.assignmentActiveUponValues[0]?.value);
        }
      }
      if(!this.programDetails?.config?.job_type) {
        this.getCandidates({ term: '' });
        this.getVendorList();
      }

      this.hideSourcingModel();
    });
  }

  hideSourcingModel() {
      if (this.assignmentConfig?.hasOwnProperty('sourcing_model_hide') && this.assignmentConfig?.sourcing_model_hide?.is_allow && this.assignmentConfig?.sourcing_model_hide?.create?.is_allow && !this.assignmentId) {
      let sourcing_model = this.assignmentConfig?.sourcing_model_hide?.create?.sourcing_model;
      if(this.dropDownOptions?.sourcing_model) {
      let result = this.dropDownOptions?.sourcing_model?.reduce((finalArray, currentObj) => {
        if(sourcing_model.some(res => res?.toLowerCase() !== currentObj?.value?.toLowerCase())) {
          return finalArray.concat([currentObj]);
        }
        return finalArray;
      }, [])
      this.dropDownOptions.sourcing_model = [...result];
     }
    }
  }

  onUpdateDisplayAssignmentTitle(search_by_job, search_by_job_template) {
    this.allDisableField['job'] = true;
    this.allDisableField['job_template'] = true;

    this.allDisableField['assignment_title_uuid'] = true;
    this.allDisableField['job_id'] = true;

    if (search_by_job && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB) && !search_by_job_template) {
      this.allDisableField['job'] = false;
      if(this.display_title_from === JOB_STATUS.EXISTING_JOB) {
        this.assignmentCreateForm.get('job')?.setValue(true);
        this.allDisableField['job_id'] = false;
      }
    } else if (!search_by_job && search_by_job_template && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
      this.allDisableField['job_template'] = false;
      if(this.display_title_from === JOB_STATUS.JOB_TEMPLATE) {
        this.assignmentCreateForm.get('job_template')?.setValue(true);
        this.allDisableField['assignment_title_uuid'] = false;
      }
    } else if (search_by_job && search_by_job_template) {
      if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE) && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
        this.allDisableField['job'] = false;
        this.allDisableField['job_template'] = false;
        if(this.display_title_from === JOB_STATUS.EXISTING_JOB) {
          this.assignmentCreateForm.get('job')?.setValue(true);
          this.allDisableField['job_id'] = false;
        } else if(this.display_title_from === JOB_STATUS.JOB_TEMPLATE) {
          this.assignmentCreateForm.get('job_template')?.setValue(true);
          this.allDisableField['assignment_title_uuid'] = false;
        }
      } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
        this.allDisableField['job_template'] = false;
         if(this.display_title_from === JOB_STATUS.JOB_TEMPLATE) {
          this.assignmentCreateForm.get('job_template')?.setValue(true);
          this.allDisableField['assignment_title_uuid'] = false;
        }
      } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
        this.allDisableField['job'] = false;
        if(this.display_title_from === JOB_STATUS.EXISTING_JOB) {
          this.assignmentCreateForm.get('job')?.setValue(true);
          this.allDisableField['job_id'] = false;
        }
      }
    }
     if(this.assignmentConfig && this.assignmentConfig?.hasOwnProperty('update_assignment_title') &&  this.assignmentConfig?.update_assignment_title &&  !this.assignmentConfig?.update_assignment_title?.is_allow) {
      this.allDisableField['assignment_title_uuid'] = true;
      this.allDisableField['job_id'] = true;
      //V2M-4027 : If  is_allow false  then disbled the title.
     }
  }

  checkJobStatus(search_by_job, search_by_job_template) {
    if (this.assignmentId) {
      this.allDisableField['job'] = true;
      this.allDisableField['job_template'] = true;
      if (search_by_job && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB) && !search_by_job_template) {
        this.allDisableField['job'] = false;
        this.display_title_from = JOB_STATUS.EXISTING_JOB;
      } else if (!search_by_job && search_by_job_template && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
        this.allDisableField['job_template'] = false;
        this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
      } else if (search_by_job && search_by_job_template) {
        if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE) && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
          this.allDisableField['job'] = false;
          this.allDisableField['job_template'] = false;
          if (this.assignmentCreateForm.get('job_template')?.value) {
            this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
          } else {
            this.display_title_from = JOB_STATUS.EXISTING_JOB;
          }
        } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
          this.allDisableField['job_template'] = false;
          this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
        } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
          this.allDisableField['job'] = false;
          this.display_title_from = JOB_STATUS.EXISTING_JOB;
        }
      }
    } else {
      this.allDisableField['job'] = true;
      this.allDisableField['job_template'] = true;
      if (search_by_job && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB) && !search_by_job_template) {
        this.assignmentCreateForm.get('job')?.setValue(true);
        this.display_title_from = JOB_STATUS.EXISTING_JOB;
      } else if (!search_by_job && search_by_job_template && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
        this.assignmentCreateForm.get('job_template')?.setValue(true);
        this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
      } else if (search_by_job && search_by_job_template) {
        if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE) && this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
          this.assignmentCreateForm.get('job')?.setValue(true);
          this.allDisableField['job'] = false;
          this.allDisableField['job_template'] = false;
          if (this.assignmentCreateForm.get('job_template')?.value) {
            this.assignmentCreateForm.get('job')?.setValue(false);
            this.assignmentCreateForm.get('job_template')?.setValue(true);
            this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
          } else {
            this.assignmentCreateForm.get('job')?.setValue(true);
            this.assignmentCreateForm.get('job_template')?.setValue(false);
            this.display_title_from = JOB_STATUS.EXISTING_JOB;
          }
        } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_JOB_TEMPLATE)) {
          this.assignmentCreateForm.get('job_template')?.setValue(true);
          this.display_title_from = JOB_STATUS.JOB_TEMPLATE;
        } else if (this.checkAuthorization(AssignmentPermissions.SELECT_QUICK_ASSIGNMENT_TITLE_FROM_EXISTING_JOB)) {
          this.assignmentCreateForm.get('job')?.setValue(true);
          this.display_title_from = JOB_STATUS.EXISTING_JOB;
        }
      }
    }

    // if(this.assignmentId) {
    //   this.assignmentCreateForm.get('job')?.setValue(false);
    //   this.assignmentCreateForm.get('job_template')?.setValue(true);
    // }
  }

  validateStartDate() {
    if (this.assignmentData?.assignments) {
      const { assignment } = this.assignmentData?.assignments;
      if (this.assignmentConfig?.update_start_date?.is_allow) {
        const update_start_date = this.assignmentConfig?.update_start_date;
        const no_of_days = update_start_date?.type?.toLowerCase() == TimesheetGracePeriod?.MONTH.toLowerCase() ? (update_start_date?.period * 30) : update_start_date?.type?.toLowerCase() == TimesheetGracePeriod?.WEEK?.toLowerCase() ? (update_start_date?.period * 7) : update_start_date?.period;
        const newDate = this.addDays(assignment?.start_date, no_of_days);
        if (newDate?.getTime() >= new Date()?.getTime()) {
          return false
        } else {
          return true
        }
      } else {
        return true;
      }
    }
  }
  addDays(dateString: string, noOfDays: number = 0) {
    const date = dateString?.split("-");
    if (date?.length === 3) {
      const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      new_Date?.setDate(new_Date?.getDate() + noOfDays);
      return new_Date;
    }
    return null;
  }

  get isSelfManagedClientAdmin() {
    return ((this.programManagedType === PROGRAM_TYPE.SELF_SERVICED && this.isClient) || this.isSuperAdmin)
  }

  get showClientBillRate() {
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_client_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase())  || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_client_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
    // return   ( this.isClient || this.isMsp || this.isSelfManagedClientAdmin || this.showClientBillRateToVendor )
  }

  get editClientBillRate() {
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return  this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_client_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
  }

  get showVendorBillRate() {    
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_vendor_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase())  || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_vendor_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
    // return   (this.isVendor || this.isMsp || this.isSelfManagedClientAdmin ) && !(this.checkAuthorization(AssignmentPermissions.HIDE_VENDOR_BILL_RATE));
  }
  
  get editVendorBillRate() {    
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return  this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_vendor_bill_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
  }

  get showPayrate() {
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_pay_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase())  || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_pay_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
    // return   (this.isMsp || this.isVendor || this.isSelfManagedClientAdmin || (this.programType === 'PAY_RATE' && this.isClient) ) && (!this.checkAuthorization(AssignmentPermissions.HIDE_PAY_RATE)) ;
  }
  
  get editPayrate() {
    let rate_model = this.assignmentCreateForm.getRawValue()?.rate_model;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_pay_rate_for_}${rate_model}${this.assignmentId ? PAGE_ASSIGNMENENT._page_assignment_revision : PAGE_ASSIGNMENENT._page_assignment }`.toLowerCase());
  }

  get showClientBillRateToVendor() {
    let assignmetnDetails = this.assignmentCreateForm.getRawValue();
    if(this.isVendor && assignmetnDetails?.sourcing_model?.toLowerCase()==='sow' && assignmetnDetails?.rate_model === 'billrate') {
      return true;
    } else {
      return false;
    }
  }
  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  navigateback() {
    this.router.navigate([`/assignment/details/${this.assignmentId}/final?tab=assignment`])
  }

  disabledModule = [];
  isExpenseManagerEnabled = true;
  getProgramDetail() {
    this._formRendererService.get(`/configurator/programs/${this.programId}`)
      .subscribe(res => {
        const { program } = res;
        const { config } = program;
        this.assignmentValueFor['programConfig'] = config;
        this.assignmentValueFor['maxSelectedItems'] = config.multiple_approval_timesheet_expense ? undefined : 1;
        this.markupByRateTypeEnabled = config?.markup_by_rate_type || false;
        this.costComponentEnabled = (config?.cost_component) || false;
        if (config?.hasOwnProperty('is_expense_manager_enabled') && !config?.is_expense_manager_enabled) {
          this.toggleChanged('is_expense_enabled');
          this.disabledModule.push('is_expense_enabled');
          this.isExpenseManagerEnabled = false;
        }
      })
  }

  getRuleApiPayloadForCostComponentGroup() {
    const { hierarchy_id, sourcing_model, vendor_id, work_location,
      worker_classification, currency, assignment_title_uuid, remote_worker, remote_worker_details } = this.assignmentCreateForm.getRawValue();
    const getDropdownId = (dropdownKey, compareWith, objId) => {
      return this.dropDownOptions?.[dropdownKey]?.find(model => model?.[objId]?.toLowerCase() == compareWith?.toLowerCase())?.id ?? '';
    }
    const currencyId = this.dropDownOptions.work_location?.find(obj => obj.id === work_location)?.currencies?.[0]?.id;
    let remote_city = '', remote_county = '', remote_state = '', remote_country = '';
    if (remote_worker) {
      remote_city = this.assignmentValueFor?.['allCitesList']?.find(c => c.name?.toLowerCase() === remote_worker_details?.city?.toLowerCase())?.id ?? '';
      remote_county = this.assignmentValueFor?.['allCountyList']?.find(c => c.name?.toLowerCase() === remote_worker_details?.county?.toLowerCase())?.id ?? '';
      remote_state = this.assignmentValueFor?.['allStatesList']?.find(s => s.name?.toLowerCase() === remote_worker_details?.state?.toLowerCase())?.id ?? '';
      remote_country = this.assignmentValueFor?.['allCountryList']?.find(c => c.name?.toLowerCase() === remote_worker_details?.country?.toLowerCase())?.id ?? '';
    }

    return {
      eventSlug: 'CONFIGURATOR_COST_GROUPING',
      programId: this.programId,
      payload: JSON.stringify({
        hierarchy_rule: hierarchy_id,
        hierarchy: hierarchy_id,
        sourcing_model: [getDropdownId('sourcing_model', sourcing_model, 'label')],
        program_industry: [this.dropDownOptions['labor_category'] || ''],
        program_vendor: [vendor_id || ''],
        location_id: [work_location || ''],
        currency: [getDropdownId('currency', currency, 'label') || currencyId],
        template: [assignment_title_uuid || ''],
        worker_classification: getDropdownId('worker_classification', worker_classification, 'value'),
        remote_city,
        remote_county,
        remote_state,
        remote_country,
      })
    };
  }

  getCostComponentGroupId() {
    if (!this.costComponentEnabled || this.assignmentId || this.assignmentCreateForm.get('rate_model')?.value !== 'payrate') {
      return;
    }

    const payload = this.getRuleApiPayloadForCostComponentGroup(); 
    this._formRendererService.post('/rule-engine/rule-consumption-api', payload).subscribe({
      next: (res: any) => {
        if (!res) return;
        if (res.cost_component_group) {
          this.warning = null;
          this.getCostComponentGroupDetails(res.cost_component_group);
        } else {
          this.showCostComponentWarning();
        }
      },
      error: (err) => {
        console.error(err);
        this.showCostComponentWarning();
        this.costComponentGroupDetails = null;
      }
    });
  }

  getCostComponentGroupDetails(id: string) {
    if (this.costComponentGroupId === id) {
      return;
    }

    this._formRendererService.get(`/core-money/programs/${this.programId}/cost-component/component_groups/${id}`).subscribe({
      next: (res) => {
        if (!res) return;
        this.costComponentGroupId = id;
        this.costComponentGroupDetails = res.cost_component_group_data?.meta_data?.map(({ code, unit, level, value }) => {
          return {
            code,
            level,
            value,
            component_name: res.cost_component_group_data?.cost_component?.find(cc => cc?.code === code)?.name,
            type: ['percentage', 'percent'].includes(unit.toLowerCase()) ? 'percentage' : 'fixed_amount'
          }
        });
        this.handleCostComponentDetails(true);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  showCostComponentWarning() {
    this.warning = {
      type: LOG_TYPE.WARNING,
      heading: 'Warning',
      messages: ['There are no cost component groups available or configured. Please contact the program administrator to ensure accurate functionality.'],
      isShown: true,
      autoClose: false
    };
  }

  get _costComponentEnabled(): boolean {
    return this.costComponentEnabled && (!!this.assignmentId || (this.assignmentCreateForm.get('rate_model')?.value == 'payrate' && !!this.costComponentGroupDetails));
  }

  handleCostComponentDetails(newValues: boolean = false) {
    if (!this._costComponentEnabled) {
      return;
    }

    // apply to each rate factor
    if (newValues) {

      // reset the initial values and fill with new cc group details
      this.initialCostComponentValues.clear();
      const updateRateFactor = (cc, arr) => {
        if (!arr) return;
        for (const rateFactor of arr) {
          if (rateFactor?.abbreviation?.toLowerCase() !== 'st' && !rateFactor?.billable) continue;
          const obj = {
            value: cc.value,
            type: cc.type,
            level: cc.level
          };
          if (rateFactor.cost_component) {
            rateFactor.cost_component[cc.code] = obj;
          } else {
            rateFactor.cost_component = { [cc.code]: obj };
          }
        }
      }
      for (const costComp of this.costComponentGroupDetails) {
        if (!costComp) continue;
        updateRateFactor(costComp, this.rate_factors_arr);
        updateRateFactor(costComp, this.final_activity_wise_rate_factors_arr?.[0]);
        updateRateFactor(costComp, this.activity_wise_rate_factors_arr?.[0]);
        if (this.dataSourceUrl?.['standard_rate_factor']) {
          updateRateFactor(costComp, [this.dataSourceUrl['standard_rate_factor']]);
        }
      }

      // apply to each rate
      const costComponentsForRate = this.fb.group({});
      for (const costComp of this.costComponentGroupDetails) {
        if (!costComp?.code) continue;
        const obj = {
          value: costComp.value,
          type: costComp.type,
          level: costComp.level,
          component_name: costComp.component_name,
          cost_amount: null,
          total_amount: null
        };
        costComponentsForRate.addControl(costComp.code, this.fb.group({ ...obj }));
      }
      costComponentsForRate.addControl('markup', this.fb.group({
        cost_amount: null,
        total_amount: null
      }));
      this.assignmentCreateForm.addControl('cost_component', costComponentsForRate);
      this.assignmentValueFor['cost_component'] = costComponentsForRate.getRawValue();
      this.initialCostComponentValues.set('st', costComponentsForRate.getRawValue());

      for (const rate of this.ratesArray.controls) {
        if (!rate.get('is_billable').value) continue;
        const costComponentsForRate = this.fb.group({});
        for (const costComp of this.costComponentGroupDetails) {
          if (!costComp?.code) continue;
          const obj = {
            value: costComp.value,
            type: costComp.type,
            level: costComp.level,
            component_name: costComp.component_name,
            cost_amount: null,
            total_amount: null
          };
          costComponentsForRate.addControl(costComp.code, this.fb.group({ ...obj }));
        }
        costComponentsForRate.addControl('markup', this.fb.group({
          cost_amount: null,
          total_amount: null
        }));
        const rateGrp = rate as UntypedFormGroup;
        rateGrp.addControl('cost_component', costComponentsForRate);
        this.initialCostComponentValues.set(rate?.get('rate_factor')?.value?.toLowerCase(), costComponentsForRate.getRawValue());
      }

    } else {

      // fill the form groups with already existing initial values
      const updateRateFactor = (arr) => {
        if (!arr) return;
        for (const rateFactor of arr) {
          if (rateFactor?.abbreviation?.toLowerCase() !== 'st' && !rateFactor?.billable) continue;
          const initialCC = this.initialCostComponentValues.get(rateFactor?.abbreviation?.toLowerCase() || 'st');
          if (!initialCC) {
            continue;
          }
          for (const cc of Object.keys(initialCC || {})) {
            if (cc === 'markup' || cc === 'cost_component_group_id') {
              continue;
            }
            const obj = {
              value: initialCC[cc]?.value,
              type: initialCC[cc]?.type,
              level: initialCC[cc]?.level
            };
            if (rateFactor.cost_component) {
              rateFactor.cost_component[cc] = obj;
            } else {
              rateFactor.cost_component = { [cc]: obj };
            }
          }
        }
      }
      updateRateFactor(this.rate_factors_arr);
      updateRateFactor(this.final_activity_wise_rate_factors_arr?.[0]);
      updateRateFactor(this.activity_wise_rate_factors_arr?.[0]);
      if (this.dataSourceUrl) {
        updateRateFactor([this.dataSourceUrl['standard_rate_factor']]);
      }

      if (this.initialCostComponentValues.has('st')) {
        const costComponentsForRate = this.fb.group({});
        const initialValue = this.initialCostComponentValues.get('st') || {};
        for (const [key, costComp] of Object.entries(initialValue)) {
          if (!costComp || key === 'markup' || key === 'cost_component_group_id') continue;
          const obj = {
            value: costComp?.['value'],
            type: costComp?.['type'],
            level: costComp?.['level'],
            component_name: costComp?.['component_name'],
            cost_amount: costComp?.['cost_amount'] || null,
            total_amount: costComp?.['total_amount'] || null
          };
          costComponentsForRate.addControl(key, this.fb.group({ ...obj }));
        }
        costComponentsForRate.addControl('markup', this.fb.group({
          cost_amount: initialValue?.['markup']?.['cost_amount'],
          total_amount: initialValue?.['markup']?.['total_amount']
        }));
        this.assignmentCreateForm.addControl('cost_component', costComponentsForRate);
        this.assignmentValueFor['cost_component'] = costComponentsForRate.getRawValue();
      }

      for (const rate of this.ratesArray.controls) {
        if (!rate.get('is_billable').value) continue;
        const costComponentsForRate = this.fb.group({});
        const abbr = rate?.get('rate_factor')?.value?.toLowerCase();
        const initialValue = this.initialCostComponentValues.get(abbr) || this.initialCostComponentValues.get('st') || {};
        for (const [key, costComp] of Object.entries(initialValue)) {
          if (!costComp || key === 'markup' || key === 'cost_component_group_id') continue;
          const obj = {
            value: costComp?.['value'],
            type: costComp?.['type'],
            level: costComp?.['level'],
            component_name: costComp?.['component_name'],
            cost_amount: costComp?.['cost_amount'] || null,
            total_amount: costComp?.['total_amount'] || null
          };
          costComponentsForRate.addControl(key, this.fb.group({ ...obj }));
        }
        costComponentsForRate.addControl('markup', this.fb.group({
          cost_amount: initialValue?.['markup']?.['cost_amount'],
          total_amount: initialValue?.['markup']?.['total_amount']
        }));
        const rateGrp = rate as UntypedFormGroup;
        rateGrp.addControl('cost_component', costComponentsForRate);
      }

    }
  }

  updateCostComponentFormValues(rate) {
    if (!rate) return;

    const updateRateFactor = (arr, cc, abbr) => {
      if (!arr) return;

      const updateObj = arr.find(o => o?.abbreviation?.toLowerCase() === abbr.toLowerCase());
      for (const key of Object.keys(updateObj?.cost_component || {})) {
        if (key === 'markup') {
          continue;
        }
        const obj = {
          value: cc?.[key]?.value,
          type: cc?.[key]?.type,
          level: cc?.[key]?.level
        };
        updateObj.cost_component[key] = obj;
      }
    }

    const getRateCC = (abbr: string) => {
      if (abbr === 'st') {
        return this.assignmentCreateForm.get('cost_component');
      } else {
        const ind = this.ratesArray.controls.findIndex(control => control.get('rate_factor')?.value?.toLowerCase() === abbr?.toLowerCase());
        if (ind > -1) {
          return this.ratesArray.get(ind.toString()).get('cost_component');
        }
      }
    }
    
    for (let [abbr, data] of Object.entries(rate)) {
      if (!data?.['billable']) continue;
      if (abbr === 'regular') {
        abbr = 'st';
      }
      if (data?.['cost_component'] && Object.keys(data['cost_component'] || {})?.length > 0) {
        for (const [code, component] of Object.entries(data['cost_component'] || {})) {
          if (code === 'markup') {
            getRateCC(abbr)?.get('markup')?.get('cost_amount')?.setValue(component?.['calculate_amount']);
            getRateCC(abbr)?.get('markup')?.get('total_amount')?.setValue(component?.['total_amount']);
            continue;
          };
          getRateCC(abbr)?.get(code)?.patchValue({
            value: component?.['value'],
            level: component?.['level'],
            type: component?.['type'],
            cost_amount: component?.['calculate_amount'],
            total_amount: component?.['total_amount'],
          });
        }

        updateRateFactor(this.rate_factors_arr, data['cost_component'], abbr);
        updateRateFactor(this.activity_wise_rate_factors_arr?.[0], data['cost_component'], abbr);
        updateRateFactor(this.final_activity_wise_rate_factors_arr?.[0], data['cost_component'], abbr);
        if (this.dataSourceUrl && abbr === 'st') {
          updateRateFactor([this.dataSourceUrl['standard_rate_factor']], data['cost_component'], abbr);
        }
      }
    }
    this.assignmentValueFor['cost_component'] = (this.assignmentCreateForm.get('cost_component') as UntypedFormGroup).getRawValue();
  }

  /** This function is used for sorting array of objects on the basis of any particular key */
  sortFunction(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0;
      }

      const varA = (typeof a[key] === 'string')
        ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string')
        ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }

  getFees() {
   return new Promise<void>((resolve) => { 
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model, hierarchy_id , vendor_id } = formValue;
    if (!sourcing_model || !hierarchy_id) {
      return;
    }

    const sourcingObj = this.dropDownOptions?.sourcing_model;
    const sourcingModel = sourcingObj?.find(model => model?.label?.toLowerCase() == sourcing_model?.toLowerCase());
    this._formRendererService.get(`/configurator/programs/${this.programId}/msps/fees?${vendor_id ? "vendor=" + vendor_id + "&" : ''}sourcing_models=${sourcingModel?.value?.toUpperCase() || sourcing_model?.toUpperCase()}&hierarchy=${hierarchy_id[0]}`)
      .subscribe(res => {
        const { msp_fees } = res;
        let feesList = [];
        this.feeArray.clear();
        const assignment = this.assignmentData?.assignments?.assignment || null;
        feesList = assignment?.tax?.filter(t => t.entity_type?.toLowerCase() === 'fee') || [];
        if(!(this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount tracking' || this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount_track') && this.assignmentCreateForm.get('is_billable').value) {
          if ((msp_fees?.length > 0 && msp_fees[0]?.categorical_fees?.length <= 0)) {
          this.validateMspFees();
          }
        }
        for (let index = 0; index < msp_fees.length; index++) {
          const element = msp_fees[index];
          for (let feeIndex = 0; feeIndex < element?.categorical_fees?.length; feeIndex++) {
            let categoricalFee = element?.categorical_fees[feeIndex];
            const validFees = categoricalFee?.applicable_config?.some(ent => ent?.entity_ref?.toUpperCase() === 'TIMESHEETS');
            if (!validFees) {
              continue;
            }
            const validfee = categoricalFee?.applicable_config?.find(ent => ent?.entity_ref?.toUpperCase() === 'TIMESHEETS');
            const value = feesList.find(fe => fe?.entity_name === categoricalFee?.fee_category?.toLowerCase());
            const alreadyHas = this.feeArray.value?.some(f => f?.entity_name?.toLowerCase() === categoricalFee?.fee_category.toLowerCase())
            if (!alreadyHas) {
              const feeForm = this.fb.group({
                amount_type: [categoricalFee.fee_type?.toUpperCase() === 'FIXED' ? AmountType.fixed_amount : AmountType.percentage ],
                amount_value: [this.accuracyPipe?.transform(value?.amount_value ? Number(value?.amount_value) : (validfee?.fee ? Number(validfee?.fee) : 0), categoricalFee?.fee_type?.toUpperCase() === 'FIXED' ? this.accuracyConfig.fee : this.accuracyConfig.fee_percentage, { isEdit: true })],
                applicable_on: [null],
                entity_name: [categoricalFee?.fee_category?.toLowerCase()],
                name: [categoricalFee?.fee_category?.split('_').join(' ')],
                funded_by:categoricalFee?.funded_by?.toLowerCase(),
              });
              if(categoricalFee?.fee_applicable_to?.toLowerCase() === 'client') {
                feeForm.get('applicable_on')?.setValue('client_bill_rate');
              } else if(categoricalFee?.fee_applicable_to?.toLowerCase() === 'vendor') {
                feeForm.get('applicable_on')?.setValue('vendor_bill_rate');
              }
              // categoricalFee?.fee_applicable_to?.toLowerCase() === 'client' ? 'client_bill_rate' : 'vendor_bill_rate'
              feeForm.get('applicable_on').disable();
              feeForm.get('amount_type').disable();

              let formArray = this.assignmentCreateForm.get('fee') as UntypedFormArray;
              formArray.push(feeForm);
            }
          }
        }
        this.calculateMspFee().then(() => {
          return resolve();
        });

        // if (feesList) {
        //   feesList.forEach(element => {
        //     const feeForm = this.fb.group({
        //       amount_type: [element?.amount_type],
        //       amount_value: [element?.amount_value],
        //       applicable_on: [element?.applicable_on],
        //       entity_name: [element?.entity_name],
        //       name: [element?.entity_name?.split('_').join(' ')]
        //     });

        //     feeForm.get('applicable_on').disable();
        //     feeForm.get('amount_type').disable();

        //     let formArray = this.assignmentCreateForm.get('fee') as FormArray;
        //     formArray.push(feeForm);
        //   });
        // }
      });
   })
  }
  validateMspFees() {
    window.scrollTo(0, 0);
    const err = 'Unable to fetch the fee configuration information, Please reach out to program administrator.';
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err, messages: [], autoClose: false, isShown: true, hideClose: true
    };
  }
  calculateMspFee() {
    return new Promise<void>((resolve) => {
    if (this.feeArray?.controls?.length > 0) {
      const feesArray = this.feeArray?.value;
      let val = 0;
      for (let index = 0; index < feesArray?.length; index++) {
        const element = feesArray[index];
        val += ['msp_partner', 'vms'].includes(element?.entity_name) ? Number(element?.amount_value) : 0
      }
      const ind = this.feeArray?.controls?.findIndex(f => f?.get('entity_name')?.value === 'msp');
      if (ind > -1) {
        this.feeArray.at(ind).patchValue({
          amount_value: this.accuracyPipe?.transform(val, this.feeArray?.controls[ind]?.get('amount_type')?.value?.toLowerCase() === 'percentage' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { view_accurate: true , isEdit: true })
        })
        this.onMarkupChange();
      } else {
        let is_funded_by_same =  this.areAllFundedByValuesSame();
        const feeForm = this.fb.group({
          amount_type: [this.feeArray?.controls[0]?.get('amount_type')?.value],
          amount_value: [this.accuracyPipe?.transform(val?.toFixed(8), this.feeArray?.controls[0]?.get('amount_type')?.value?.toLowerCase() === 'percentage' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { isEdit: true })],
          applicable_on: is_funded_by_same ? [this.feeArray?.controls[0]?.get('applicable_on')?.value] : ['both'],
          entity_name: ['msp'],
          name: ['MSP'],
          funded_by: !is_funded_by_same  ? ['hybrid'] : [this.feeArray?.controls[0]?.get('funded_by')?.value],
        });
        feeForm.disable();
        let formArray = this.assignmentCreateForm.get('fee') as UntypedFormArray;
        formArray.push(feeForm);
        
      }
      
      // if(this.assignmentId) {
      //   this.onMarkupChange();
      // }
    };
    resolve();
  })
  }
  areAllFundedByValuesSame(): boolean {
    const formArrayControls = this.feeArray.controls;
    return formArrayControls.length > 0 &&
      formArrayControls.every(control => control.get('funded_by')?.value === formArrayControls[0]?.get('funded_by')?.value);
  }

  getRateFactor(conditionParams: any = {}) {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { hierarchy_id } = formValue;
    let url = `/configurator/programs/${this.programId}/rate-factors?is_enabled=True&`;
    if (hierarchy_id) {
      url += `hierarchy=${hierarchy_id}`;
    }
    this._formRendererService
      .get(url)
      .subscribe(res => {
        if (conditionParams?.rateFactorCase) {
          let { rate_factors } = res;
          this.assignmentValueFor['configRateFactors'] = rate_factors;
          const st_rate_factor = rate_factors?.find(rate=> rate?.abbreviation?.toLowerCase() == RATETYPES.ST);
          if (this.markupByRateTypeEnabled && st_rate_factor && !st_rate_factor?.markup) {
            st_rate_factor.markup = this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
          }
          let st_rate_factor_assignment;
          if (this.assignmentData?.assignments?.finance?.rate_factor?.length && this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors) {
            st_rate_factor_assignment = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors?.find(rate=> rate?.abbreviation?.toLowerCase() == RATETYPES.ST);
            this.assignmentValueFor['markup'] = st_rate_factor_assignment?.markup ? st_rate_factor_assignment?.markup:st_rate_factor?.markup;
          }
          if(st_rate_factor && !st_rate_factor_assignment) {
            this.dataSourceUrl['standard_rate_factor'] = st_rate_factor; 
          }
          if (!(this.assignmentData?.assignments?.finance?.rate_factor?.length && !!this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors)) {
            if (rate_factors) {
              rate_factors = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase()  !== RATETYPES.ST);
              // rate_factors =  rate_factors.filter(res => res?.billable);
              this.rateFactor = this.getSortRates(rate_factors);
            }
            this.createLocalRateFactorArrForUpdation();
            this.updateActivityWiseRateFactorsArray(JSON.parse(JSON.stringify([{rate_factors: this.rate_factors_arr || []}] )));
          }
        } else {
          this.handleRateFactorRes(res , true);
        }
      });
  }


  updateRateFactorActivity(index, flag?) {
    if (this.rateFactor && this.rateFactor?.length > 0) {

      let zeroValue = 0;
      let rate_factors = this.rateFactor;
      if (!flag) {
        if (this.assignmentData?.assignments?.finance?.rate && this.assignmentData?.assignments?.finance?.rate?.length > 0) {
          if (rate_factors) {
            for (let j = 0; j < this.assignmentData?.assignments?.finance?.rate?.length; j++) {
              let is_fees_applicable = this.assignmentData?.assignments?.finance?.rate?.[j]?.is_fees_applicable || false;
              if (j > 0) {
                let activity = this.assignmentCreateForm?.get('activity') as UntypedFormArray || [];
                activity?.push(this.createActivityForm(activity?.length + 1));
                this.changeDetectorRef.detectChanges();
              }
              let activityValue = this.assignmentData?.assignments?.finance?.rate?.[j];
              (this.assignmentCreateForm.get('activity') as UntypedFormArray)
                ?.at(j)?.patchValue({
                  entity_name: activityValue?.entity_name,
                  entity_id: activityValue?.entity_id,
                  is_fees_applicable:is_fees_applicable
                });
              let st_rate = activityValue?.rates.find(r => r.rate_factor?.toLowerCase() === 'st' || r.rate_factor?.toLowerCase() === 'regular');
              if (st_rate) {

                (this.assignmentCreateForm.get('activity') as UntypedFormArray).at(j)?.patchValue({
                    activity_billrate: this.accuracyPipe.transform(st_rate?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                    activity_vendor_rate: this.accuracyPipe.transform(st_rate?.vendor_rate, this.accuracyConfig.rate, { isEdit: true}),
                    activity_payrate: this.accuracyPipe.transform(st_rate?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                    default:  Object?.keys(st_rate?.default || {})?.length  ? [st_rate?.default]: null
                  });
                this.changeDetectorRef.detectChanges();
              }
              if (this.assignmentData?.assignments?.finance?.rate?.[j]?.rates && this.assignmentData?.assignments?.finance?.rate?.[j]?.rates?.length > 0) {
                for (let i = 0; i < rate_factors?.length; i++) {
                  const element = rate_factors[i];
                  const valObj = (activityValue?.rates || []).find(r => r?.rate_factor?.toLowerCase() === element?.abbreviation?.toLowerCase());
                  if(valObj) {
                  const rateForm = this.fb.group({
                    rate_factor: [valObj?.rate_factor],
                    name: [valObj?.name],
                    billrate: [valObj?.billrate ?? this.accuracyPipe?.transform(0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],
                    payrate: [valObj?.payrate ?? this.accuracyPipe?.transform(0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],
                    vendor_rate: [valObj?.vendor_rate ?? this.accuracyPipe?.transform(0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],  
                    is_fees_applicable: [is_fees_applicable],
                    default: Object?.keys(valObj?.default || {})?.length  ? [valObj?.default]: null
                  }, {
                    validators: [this.payRateValidator]
                  });
                  rateForm.get('billrate').disable();
                  rateForm.get('payrate').disable();
                  rateForm.get('vendor_rate').disable();
                  let activityArray = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
                  let control = activityArray?.controls[j]['controls']['rates'] as UntypedFormArray;
                  let isPresent = control?.value?.some(r => r.name === element.name);
                  if (!isPresent) {
                    control?.push(rateForm);
                  }
                }
               }
              }
            }
          }
          // this.onMarkupChange();
        }
      } else {
        this.rateFactor?.forEach((rate) => {
          const form = this.fb.group({
            rate_factor: [rate?.abbreviation?.toLowerCase()],
            name: [rate?.name],
            billrate: [this.accuracyPipe?.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true })],
            payrate: [this.accuracyPipe?.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true })],
            vendor_rate: [this.accuracyPipe?.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true })],
            is_fees_applicable: [false],
            default: [ null]
          }, {
            validators: [this.payRateValidator]
          });
           //  removed for  6638
          form.get('billrate').disable();
          form.get('payrate').disable();
          form.get('vendor_rate').disable();
          let activityFormArray = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
          let activityRateControl = activityFormArray?.controls[index]['controls']['rates'] as UntypedFormArray;
          let isPresent = activityRateControl?.value.some(r => r.name === rate.name);
          if (!isPresent) {
            activityRateControl?.push(form);
            
          }
         
        });
        if (this.rateFactor?.length > 0) {
          this.createActivityWiseRateFactorsArray();
        }
      }
      this.changeDetectorRef.detectChanges();
      this.changeMarkupOption();
      this.OnOtExemptChange();
    }
  }

  makeRateChangeRequest({rate, abbreviation, i, type}: any) {
    let obj: any = null;
    this.logs= undefined;
    if (i !== -1 && this.activity_wise_rate_factors_arr && this.activity_wise_rate_factors_arr?.length > 0 && this.activity_wise_rate_factors_arr[0] != undefined) {
      let rate_factor_arr: RateFactorsWithEdit[] = this.activity_wise_rate_factors_arr[i] || [];
      let tempRateFactor = rate_factor_arr?.find(ratefromarr => ratefromarr?.abbreviation?.toLowerCase() === abbreviation?.toLowerCase());
      if (!tempRateFactor && this.dataSourceUrl['standard_rate_factor']) {
        tempRateFactor = this.dataSourceUrl['standard_rate_factor']
      }
      obj = { abbreviation, index: i, [RATE_TYPE[rate]]: rate, rates: tempRateFactor ? tempRateFactor[RATE_TYPE[rate]] : [] };
    }
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup,
      billrate,
      payrate,
      ot_exempt_position,
      vendor_rate , hierarchy_id } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    let msp_fee_types = 0;
    let msp_fee_value = 0;
    let funded_by = null;
    if (type === RATE_CHANGE_TYPE.BASE_RATES_CHANGED_FOR_ABB) {
      const arrayValues = this.ratesArray.value;
      const obj = arrayValues.find(r => r.rate_factor?.toLowerCase() === abbreviation?.toLowerCase());
      billrate = obj['billrate'] || 0;
      payrate = obj['payrate'] || 0;
      vendor_rate = obj['vendor_rate'];
    } else if (type === RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED) {
      const arrayValues = this.activityArray.value;
      billrate = arrayValues[i]?.activity_billrate;
      payrate = arrayValues[i]?.activity_payrate;
      vendor_rate = arrayValues[i]?.activity_vendor_rate;
    } else if (type === RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED_FOR_ABB) {
      let arrayValues = this.assignmentCreateForm.getRawValue();
      const obj = arrayValues?.activity[i]?.rates?.find(r => r.rate_factor?.toLowerCase() === abbreviation?.toLowerCase());
      billrate = obj['billrate'];
      payrate = obj['payrate'];
      vendor_rate = obj['vendor_rate'];
    }
    if (!rate_model) {
      return;
    }
  

    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }

    if ((rate === 'billrate' && billrate === null) || (rate === 'payrate' && payrate === null)) {
      return;
    }

    if (rate === 'billrate' && !payrate) {
      payrate = 0;
    }
     if(!(+billrate) && !(+payrate)) {
       return;
     }

    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr?.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe.transform(feeArr[indexForMsp]?.amount_value , feeArr[indexForMsp]?.amount_type?.toLowerCase() === 'percentage' ? this.accuracyConfig?.fee_percentage : this.accuracyConfig?.fee , {isEdit : true});
      funded_by = feeArr[indexForMsp]?.funded_by;
    }
    this.uniqueId = `${this.uuid}-${new Date().getTime()}`;
    const payload = {
      hierarchy: hierarchy_id?.length ? hierarchy_id[0] : '',
      rate_model: rate_model,
      adjusted_markup: this.accuracyPipe?.transform(adjusted_markup ?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
      vendor_markup: this.accuracyPipe?.transform(vendor_markup ?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
      client_bill_rate:  this.accuracyPipe.transform(billrate ? billrate : 0, this.accuracyConfig.rate, { isEdit: true}),
      vendor_bill_rate: this.accuracyPipe.transform(vendor_rate ? vendor_rate : 0 , this.accuracyConfig.rate, { isEdit: true}), 
      candidate_pay_rate: this.accuracyPipe.transform(payrate , this.accuracyConfig.rate, { isEdit: true}),
      max_bill_rate:this.accuracyPipe.transform( max_bill_rate , this.accuracyConfig.rate, { isEdit: true}),
      min_bill_rate:  this.accuracyPipe.transform(min_bill_rate, this.accuracyConfig.rate, { isEdit: true}),
      msp_fee_types: msp_fee_types,
      msp_fee_value,
      rate_input: this.returnRateInput(rate),
      ot_exempt: ot_exempt_position,
      abbreviation: abbreviation?.toLowerCase(),
      ui_unique_id: this.uniqueId,
      rate_factors: [],
      msp_fee_funded_by: funded_by,
      is_markup_by_rate_type: this.markupByRateTypeEnabled,
      is_cost_component: this._costComponentEnabled,
      fee_details: []
    }
    if(funded_by === 'hybrid') {
      payload.fee_details = this.feeArray.getRawValue();
    } else {
       delete payload.fee_details;
    }
    payload.rate_factors = this.applyRateFactorsAsRecvd(obj?.index, this.rate_factors_arr, obj);
    this.getUpdatedPayloadOnOTExemptChange(payload.rate_factors).then((data) => {
    payload.rate_factors = data;
    if (this._costComponentEnabled) {
      const stRateFactor = payload.rate_factors.find(rf => rf?.abbreviation?.toLowerCase() === 'st');
      if (stRateFactor && !stRateFactor.cost_component) {
        stRateFactor.cost_component = this.assignmentCreateForm.get('cost_component')?.value;
        delete stRateFactor.cost_component?.markup;
      }
    }
    this._formRendererService.post(`/core-money/programs/${this.programId}/rate-model`, payload)
    .subscribe({next:(res: any) => {
      this.allDisableField['rate_estimate']=false;
      // this.dropDownOptions.rate_validation.is_valid =  true;
      if (type === RATE_CHANGE_TYPE.BASE_RATES_CHANGED) {
        this.updateDataAfterBaseRatesChanged(res);
      } else if (type === RATE_CHANGE_TYPE.BASE_RATES_CHANGED_FOR_ABB) {
        this.updateDataAfterBaseRatesChangedForAbb(res);
      } else if (type === RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED) {
        this.updateDataAfterActivityBaseRatesChanged(res, i);
      } else if (type === RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED_FOR_ABB) {
        this.updateDataAfterActivityBaseRatesChangedForAbb(res, i);
      }
      if (this._costComponentEnabled) {
        this.updateCostComponentFormValues(res?.data?.rate);
      }
    }, error: (err) => {
      this.allDisableField['rate_estimate']=true;
      this.showError(err);
      // this.alert.error(errorHandler(err));
    }})
  })
  }

  baseRatesChanged(rate) {
    this.makeRateChangeRequest({rate, abbreviation: 'st', i: 0, type: RATE_CHANGE_TYPE.BASE_RATES_CHANGED});
  }

  getUpdatedPayloadOnOTExemptChange(rate_factor , changeValue = true) {
    return new Promise <any>((resolve) => {
    if(this.assignmentCreateForm.get('ot_exempt_position').value) {
      let clonedArray = JSON.parse(JSON.stringify(rate_factor));
        clonedArray?.forEach(res => {
          if(res?.abbreviation?.toLowerCase() !== 'st') {
            if(this.markupByRateTypeEnabled && !res.billable) {
               res.markup = this.accuracyPipe?.transform(0, this.accuracyConfig.markup_percentage, { isEdit: true });
            }
            res.bill_rate?.forEach(d => {
              d.factor = 1;
              d.is_edit= false;
            });
            res.pay_rate?.forEach(d => {
              d.factor =1 ;
              d.is_edit= false;
            });
          } else {
            if(!res.markup) {
              res.markup = this.accuracyPipe?.transform(this.assignmentValueFor['markup'] , this.accuracyConfig.markup_percentage, { isEdit: true });
            }
          }
        });
        resolve(clonedArray) ;
    } else {
      if(this.assignmentId && Boolean(this.assignmentData?.assignments?.finance?.ot_exempt_position) && Boolean(!this.assignmentCreateForm.get('ot_exempt_position').value)) {
        const rateToChange = this.programType !== 'PAY_RATE' ? 'billrate' : 'payrate';
        // let assignmentFactor = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors;
        let assignmentFactor = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors?.map(res => res?.abbreviation?.toLowerCase());
        let rate_factors = this.duplicatereateLocalRateFactorArrForUpdation(this.assignmentValueFor['configRateFactors']?.filter(res => assignmentFactor?.includes(res?.abbreviation?.toLowerCase())));
        rate_factors =  this.updateForOTExemptfinalactivityBasedRateFactorsArray();
        resolve(this.applyRateFactorsAsRecvd(0,rate_factors, {rateToChange, abbreviation: 'st', i: 0, type: RATE_CHANGE_TYPE.BASE_RATES_CHANGED} ));
      } else {
        resolve(rate_factor);
      }
    }
  });
  }

  updateDataAfterBaseRatesChanged(res: any) {
    const { data } = res;
    const rateObj = data?.rate;
    const is_fees_applicable = data?.is_fees_included;
    const arrayValues = this.ratesArray.value;
    for (var prop in rateObj) {
      if (prop !== 'abbreviation') {
        const ele = rateObj[prop];
        const index = arrayValues.findIndex(r => r?.rate_factor?.toLowerCase() === prop);
        if (index > -1) {
          this.ratesArray.at(index).patchValue({
            billrate: this.accuracyPipe?.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true }),
            payrate: this.accuracyPipe?.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true }),
            vendor_rate: this.accuracyPipe?.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
            is_fees_applicable: is_fees_applicable,
            default:   Object?.keys(ele?.default || {})?.length ?  [ele?.default]: null

          });
        }
      }
    }

    const regular = rateObj?.regular;
    this.assignmentCreateForm.patchValue({
      is_fees_applicable: is_fees_applicable,
      default: Object?.keys(regular.default || {})?.length ?  [regular?.default]: null,
      payrate: this.accuracyPipe?.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true }),
      billrate: this.accuracyPipe?.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true }),
      vendor_rate: this.accuracyPipe?.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true })
    });
    this.recalcualatebudget();
  }


  recalcualatebudget() {    
    this.calculateHoursEstimate();
    this.calculateResourceBudget();
  }

  onMarkupChange() {
    const rateToChange = this.programType !== 'PAY_RATE' ? 'billrate' : 'payrate';
    if (!this.is_activity_based) {
      this.baseRatesChanged(rateToChange);
    } else {
      let activityArray = this.activityArray?.getRawValue() || [];
      activityArray?.forEach((rate, i) => {
        this.activityBaseRatesChanged(rateToChange, i)
      });
    }
  }

  calculateHoursEstimate() {
    if (this.dataSourceUrl['working-hours-estimate']) {
      this.dataSourceUrl['working-hours-estimate']?.unsubscribe();
    }
    const values = this.assignmentCreateForm.getRawValue();
    const { start_date, end_date, st_hours, days_per_week, effective_date } = values || {};
    if (!start_date || !end_date || !st_hours || !days_per_week) {
      return null;
    }

    const url = `/core-money/programs/${this.programId}/working-hours-estimate?start_date=${this.convertDateFormat(start_date)}&end_date=${this.convertDateFormat(end_date)}&hours_per_day=${this.accuracyPipe.transform(st_hours , this.accuracyConfig?.hour , {isEdit : true})}&week_working_days=${days_per_week}`;
    this.dataSourceUrl['working-hours-estimate'] = this._formRendererService.get(url)
      .subscribe(res => {
        const { formatted_working_days } = res?.data;
        
        if (this.assignmentId && this.dropDownOptions['budget_calculation_setting'] && this.extend !== UPDATE_FOR.REVIEW) {
          if (!this.dropDownOptions['estimated_billing_details']) {
            this.dropDownOptions['estimated_billing_details'] = new Object();
          }
          if (effective_date && !this.checkEffectiveDate()) {
            this.dropDownOptions['estimated_billing_details'] = {
              ...this.dropDownOptions['estimated_billing_details'],
              total_working_days: formatted_working_days
            };
          }
        } else {
          if (!this.dropDownOptions['billing_details']) {
            this.dropDownOptions['billing_details'] = new Object();
          }
          this.dropDownOptions['billing_details'] = {
            ...this.dropDownOptions['billing_details'],
            total_working_days: formatted_working_days
          }
        }
        this.assignmentCreateForm.patchValue({
          total_working_days: formatted_working_days
        });
        // this.dropDownOptions['estimated_billing_details'] this.dropDownOptions['estimated_billing_details']}
      })
  }

  calculateResourceBudget() {
    this.logs= undefined;
    const index = this.dataSourceUrl.findIndex(res => res.slug === 'resource-budget');
    if (index > -1 && this.dataSourceUrl[index]?.subscription) {
      this.dataSourceUrl[index].subscription.unsubscribe();
    }
    if (index === -1) {
      this.dataSourceUrl.push({ "slug": 'resource-budget' });
    }
    const formValues = this.assignmentCreateForm.getRawValue();

    let { billrate, rate_type, total_working_days, start_date, end_date, st_hours, days_per_week, activity, adjustment_fee } = formValues;
    if (!start_date || !end_date || !st_hours || !days_per_week && !billrate && !rate_type && !total_working_days) {
      return null;
    }
    if (!days_per_week) {
      return null;
    }
    if (!rate_type) {
      return null;
    }

    if(this.assignmentId && !this.assignmentCreateForm?.get('effective_date')?.value && !this.checkEffectiveDate() && this.extend !== UPDATE_FOR.REVIEW) {
      return null;
    }
    
    if (this.is_activity_based) {
      billrate = activity.reduce((total, act) => total + Number(act?.activity_billrate), 0);
    }

    const taxValues = [...this.taxArray.getRawValue()]?.filter(res => !res.hasOwnProperty('is_deleted'));
    const adjustedFees = [...this.TaxAdjustmentFees.getRawValue()];
    
    let url = `/core-money/programs/${this.programId}/resource-budget`;
    let requestBody: any = {};
    if(this.dropDownOptions['resource_budget_setting']) {
      const { assignment, effective_data } = this.assignmentData?.assignments || {};
      let budget_obj:any = {};
      requestBody = {
        start_date: this.convertDateFormat(start_date),
        end_date: this.convertDateFormat(end_date),
        num_resources: 1,
        additional_budget: this.assignmentId && this.extend !== UPDATE_FOR.REVIEW ? this.assignmentData?.assignments?.total_additional_budget : 0,
        effective_data: this.assignmentId && this.extend !== UPDATE_FOR.REVIEW && effective_data?.rates ? effective_data?.rates : []
      }
      if (!this.assignmentId || this.extend === UPDATE_FOR.REVIEW) {
        budget_obj = {
          effective_start_date: this.convertDateFormat(start_date),
          effective_end_date: this.convertDateFormat(end_date),
          hours_per_day: this.accuracyPipe?.transform(st_hours, this.accuracyConfig?.hour),
          week_working_days: days_per_week,
          tax: taxValues,
          rate_type: rate_type,
          adjustment_fee: adjustment_fee,
          rate: !this.is_activity_based ? this.accuracyPipe?.transform(+billrate, this.accuracyConfig.rate, { isEdit: true }) : this.sortActivityRates()
        }
      } else {
        const current_change: any = {};
        current_change.tax = taxValues;
        current_change.assignment_uuid = this.assignmentId;
        current_change.effective_date = this.convertDateFormat(this.assignmentCreateForm?.get('effective_date')?.value)
        current_change.end_date = this.convertDateFormat(formValues?.end_date)
        current_change.start_date = this.convertDateFormat(formValues?.start_date)
        current_change.old_start_date = assignment.start_date
        current_change.old_end_date = assignment.end_date
        current_change.hours_per_day = this.accuracyPipe?.transform(formValues?.st_hours, this.accuracyConfig.hour);
        current_change.week_working_days = formValues?.days_per_week;
        current_change.adjustment_fee = adjustedFees;

        if (this.is_activity_based) {
          current_change.rate = this.sortActivityRates();
        } else {
          current_change.rate = formValues?.billrate;
        }
        current_change.rate_type = formValues?.rate_type;
        requestBody.update_change_reference = current_change;
      }
      if (budget_obj && Object?.keys(budget_obj)?.length > 0) {
        requestBody?.effective_data?.push(budget_obj);
      }
    } else {
      url += `?start_date=${this.convertDateFormat(start_date)}&end_date=${this.convertDateFormat(end_date)}&hours_per_day=${this.accuracyPipe?.transform(st_hours, this.accuracyConfig.hour)}&week_working_days=${days_per_week}&rate=${billrate}&rate_type=${rate_type}&total_hours=${total_working_days}&num_resources=1`;
      if(this.assignmentId) {
        url += `&additional_budget=${this.assignmentData?.assignments?.total_additional_budget || 0 }`
      }
      if (taxValues?.length > 0) {
        url += `&adjustment_type=${taxValues[0]?.amount_type}&adjustment_value=${taxValues[0]?.amount_value}`;
      }
    }
    if(this.assignmentId) {
      this.compareResurceBudget();
      if(this.dropDownOptions['compared_budget_values']?.length === 0) {
        requestBody.update_change_reference = {} ;
      }
   }
    this.dataSourceUrl[index].subscription = this._formRendererService[this.dropDownOptions['resource_budget_setting'] ? 'post' : 'get'](url, requestBody)
      .subscribe({next:(res: any) => {
        const { initial_budget, gross_budget, estimate_tax, net_budget , estimated_adjustment } = res?.data;
        if (this.assignmentId && this.dropDownOptions['budget_calculation_setting'] && this.extend !== UPDATE_FOR.REVIEW) {
          this.dropDownOptions['estimated_billing_details'] = {
            ...this.dropDownOptions['estimated_billing_details'],
            ...res.data
          };
        } else {
          this.dropDownOptions['billing_details'] = {
            ...this.dropDownOptions['billing_details'],
            ...res.data
          };
        }
        
        this.assignmentCreateForm.patchValue({
          timesheet_budget: this.accuracyPipe?.transform(initial_budget, this.accuracyConfig.amount, { isEdit: true }),
          gross_allocated_budget: this.accuracyPipe?.transform(gross_budget, this.accuracyConfig.amount, { isEdit: true }),
          estimated_tax: this.accuracyPipe?.transform(estimate_tax, this.accuracyConfig.tax, { isEdit: true }),
          net_allocated_budget: this.accuracyPipe?.transform(net_budget, this.accuracyConfig.amount, { isEdit: true }),
          estimated_adjustment:  this.accuracyPipe?.transform(estimated_adjustment, this.accuracyConfig.amount, { isEdit: true })
        })
        
      this.validateSOWBudget();
        if (!this.assignmentId) {
          this.getApprovalList({ id: null })
        } else if(this.dropDownOptions['budget_calculation_setting']) {
            this.compareResurceBudget();
        }
      },error: (err) => {
       
      }})
  }

  compareResurceBudget() {
    this.dropDownOptions['showHideDetails'] = false;
    const oldValues = this.assignmentData?.assignments;
    const newValues = this.assignmentCreateForm.getRawValue();
   
    this.dropDownOptions['compared_budget_values'] = new Array();
    const { finance , assignment } = oldValues || {};
    const financeItems = [];

    //For Tax chage
    const taxArray = this.taxArray.getRawValue();
    const taxList = assignment?.tax?.filter(t => t.entity_type === 'tax') || [];
    const adjustedFees =  assignment?.tax?.filter(t => t.entity_type === 'adjustment_fee') || [];
    const adjustedFeesArray = this.TaxAdjustmentFees.getRawValue();
    if(taxArray?.length || taxList?.length ) {
    taxArray?.forEach((originalfees) => {
    let modified_fees = taxList?.find(f=>f?.entity_name?.toLowerCase() ===originalfees?.entity_name?.toLowerCase() );
    let tax_accuracy_type = originalfees?.amount_type.toLowerCase() === 'percentage' ? this.accuracyConfig.tax_percentage : this.accuracyConfig.tax;
    if(modified_fees && originalfees?.hasOwnProperty('is_deleted')) {
      financeItems?.push({
        label: originalfees?.entity_name ? originalfees?.entity_name + ' Tax' : null + 'Tax',
        old_value: this.accuracyPipe.transform(modified_fees?.amount_value , tax_accuracy_type, tax_accuracy_type !== 'tax_percentage' ? { isEdit: true } : {}),
        new_value: '-',
        type: 'Tax'
      })
    }
    else if (modified_fees && !originalfees?.hasOwnProperty('is_deleted') && Number(originalfees?.amount_value)  !== Number(modified_fees?.amount_value)) {
      financeItems?.push({
        label: originalfees?.entity_name ? originalfees?.entity_name + ' Tax' : null + 'Tax',
        old_value: this.accuracyPipe.transform( modified_fees?.amount_value , tax_accuracy_type, tax_accuracy_type !== 'tax_percentage' ? { isEdit: true } : {}),
        new_value: this.accuracyPipe.transform( originalfees?.amount_value , tax_accuracy_type, tax_accuracy_type !== 'tax_percentage' ? { isEdit: true } : {}),
        type: 'Tax'
      })
    }
    else if (Number(originalfees?.amount_value)  !== Number(modified_fees?.amount_value) ) {
      financeItems?.push({
        label: originalfees?.entity_name ? originalfees?.entity_name + ' Tax' : null + 'Tax',
        old_value: '-',
        new_value: this.accuracyPipe.transform(originalfees?.amount_value , tax_accuracy_type, tax_accuracy_type !== 'tax_percentage' ? { isEdit: true } : {}),
        type: 'Tax'
      })
    } 
    });
   }
//  For Adjusted fees 
if(adjustedFeesArray?.length && adjustedFees?.length ) {
  adjustedFeesArray?.forEach((originalfees) => {
    let modified_fees = adjustedFees?.find(f=>f?.entity_name?.toLowerCase() ===originalfees?.entity_name?.toLowerCase() );
    if (Number(originalfees?.amount_value)  !== Number(modified_fees?.amount_value) ) {
      financeItems?.push({
        label: originalfees?.entity_name ? originalfees?.entity_name + ' Adjustment' : null + ' Adjustment',
        old_value: this.accuracyPipe.transform(modified_fees?.amount_value, this.accuracyConfig.amount, { isEdit: true}),
        new_value: this.accuracyPipe.transform(originalfees?.amount_value , this.accuracyConfig.amount, { isEdit: true}),
        type: 'adjustment',
        accuracy_type: 'amount'
      })
    } 


  })
}

  // For Rate change
    if (this.is_activity_based) {
      const old_rates = [];
      if (finance.rate && finance?.rate?.length > 0) {
        finance.rate?.forEach(e1 => {
          if (e1.rates && e1.rates?.length > 0) {
            e1.rates?.forEach(e2 => {
              if (e2.rate_factor?.toLowerCase() == RATETYPES?.ST?.toLowerCase()) {
                old_rates?.push({
                  entity_name: 'Rate',
                  billrate: this.accuracyPipe.transform(e2?.billrate, this.accuracyConfig.rate, { isEdit: true})
                })
              }
            });
          }
        });
      }
      if(old_rates && newValues?.activity && newValues.activity?.length > 0 && old_rates?.length > 0) {
        newValues?.activity?.map(new_billrate => {
          old_rates?.filter(old_billrate => {
            if (new_billrate?.entity_name === old_billrate?.entity_name) {
              if (+old_billrate?.billrate != +new_billrate?.activity_billrate) {
                financeItems?.push({
                  label: 'Rate',
                  old_value: this.accuracyPipe.transform(old_billrate?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                  new_value: this.accuracyPipe.transform(new_billrate?.activity_billrate, this.accuracyConfig.rate, { isEdit: true}),
                  type: 'rate',
                  accuracy_type: 'rate'
                })
              }
            }
          });
        })
      }
    } else if (!this.is_activity_based) {
      if (finance?.rate && finance?.rate?.length > 0 && finance?.rate?.[0]?.rates && finance?.rate?.[0]?.rates?.length > 0) {
        finance?.rate?.[0]?.rates?.forEach(element => {
          if (element?.rate_factor?.toLowerCase() === RATETYPES?.ST?.toLowerCase()) {
            if (+element.billrate == +newValues.billrate) { } else {
              financeItems?.push({
                label: 'Rate',
                old_value: this.accuracyPipe.transform(element?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                new_value: this.accuracyPipe.transform(newValues?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                type: 'rate',
                accuracy_type: 'rate'
              })
            }
          }
        });
      }
    }

    // For currency
    if(finance?.currency?.toLowerCase() !== newValues?.currency?.toLowerCase()) { 
      financeItems.push({ label : 'Currency', old_value : finance?.currency, new_value : newValues?.currency })
    }

    // For ST hours
    if(Number(finance?.st_hours) !== Number(newValues?.st_hours)) {
      financeItems.push({ label : 'No. of Straight Time Hours/Day', old_value : this.accuracyPipe?.transform(finance?.st_hours, this.accuracyConfig.hour), new_value : this.accuracyPipe?.transform(newValues?.st_hours, this.accuracyConfig.hour) })
    }

    // For Rate type
    if(finance.rate_type?.toLowerCase() !== newValues.rate_type?.toLowerCase()) {
      financeItems.push({ label : 'Unit Of Measure', old_value : finance?.rate_type, new_value : newValues?.rate_type })
    }

    // For Rate model
    if(finance.rate_model?.toLowerCase() !== newValues.rate_model?.toLowerCase()) {
      financeItems.push({ label : 'Rate Model', old_value : finance?.rate_model , new_value : newValues?.rate_model})
    }

    // For OT Exempt
    if(this.compareOtExemptValues(finance.ot_exempt_position, newValues.ot_exempt_position)) {
      financeItems.push({ label : 'OT Exempt', old_value : finance?.ot_exempt_position ? 'Yes':'No', new_value : newValues?.ot_exempt_position ? 'Yes':'No' })
    }

    // For Adjusted Markup
    if(finance.adjusted_markup && newValues.adjusted_markup && Number(finance.adjusted_markup).toFixed(2) !== Number(newValues.adjusted_markup).toFixed(2)) {
      financeItems.push({ label : 'Adjusted Markup (%)', old_value : this.accuracyPipe?.transform(finance.adjusted_markup, this.accuracyConfig.markup_percentage, { isEdit: true }), new_value : this.accuracyPipe?.transform(newValues.adjusted_markup, this.accuracyConfig.markup_percentage, { isEdit: true }) })
    }

     // For days_per_week
     if(Number(finance?.days_per_week) !== Number(newValues?.days_per_week)) {
      financeItems.push({ label : 'No. of Working Days/Week', old_value : finance?.days_per_week, new_value : newValues?.days_per_week })
    }

    // For Start date
    const old_start_date = assignment?.start_date;
    const new_start_date = this.convertDateFormat(newValues?.start_date);
    if(old_start_date !== new_start_date) {
      financeItems.push({ 
        label : 'Assignment Start Date', 
        old_value : this.datePipe.transform(old_start_date, this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD), 
        new_value : this.datePipe.transform(new_start_date, this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD) })
    }

    // For End date
    const old_end_date = assignment.end_date;
    const new_end_date = this.convertDateFormat(newValues.end_date)
    if(old_end_date !== new_end_date) {
      financeItems.push({ 
        label : 'Assignment End Date', 
        old_value : this.datePipe.transform(old_end_date, this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD),
        new_value : this.datePipe.transform(new_end_date, this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD)})
    }
    
    if(financeItems && financeItems?.length > 0) {
      this.dropDownOptions['compared_budget_values'].push(...JSON.parse(JSON.stringify(financeItems)));
    }    
  }

  compareOtExemptValues(a: boolean, b: boolean) {
    return Number(a) - Number(b);
  }

  sortActivityRates() {
    const values = this.assignmentCreateForm.getRawValue();
    let data = [];
    if(values?.activity && values?.activity?.length > 0) {
      values?.activity?.forEach(element => {
        data.push({
          activity_title: element.entity_name,
          activity_rate : this.accuracyPipe.transform(element?.activity_billrate, this.accuracyConfig.rate, { isEdit: true})
        })
      });
    }
    return data;
  }

  checkEffectiveDate() {
    const formValues = this.assignmentCreateForm.getRawValue();
    const { end_date, effective_date } = formValues || {};
    if(new Date(Date.parse(effective_date)) > new Date(Date.parse(end_date))) {
      this.dropDownOptions['estimated_billing_details'] = {};
    };
    return new Date(Date.parse(effective_date)) > new Date(Date.parse(end_date))
  }

  baseRatesChangedForAbb(abbreviation, rate) {
    this.makeRateChangeRequest({rate, abbreviation, i: 0, type: RATE_CHANGE_TYPE.BASE_RATES_CHANGED_FOR_ABB})
  }

  updateDataAfterBaseRatesChangedForAbb(res: any) {
    const { data } = res;
    const { rate } = data;
    const is_fees_applicable = data?.is_fees_included;
    const arrayValues = this.ratesArray.value;
    const abb = data?.abbreviation;
    const regular = rate?.regular;
    const index = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === abb);
    if (index > -1) {
      this.ratesArray.at(index).patchValue({
        billrate: this.accuracyPipe?.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true }),
        payrate: this.accuracyPipe?.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true }),
        vendor_rate: this.accuracyPipe?.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
        is_fees_applicable: is_fees_applicable,
        default:  Object?.keys(regular?.default || {})?.length  ? [regular?.default]: null
      });
    }
  }

  activityBaseRatesChanged(rate, i) {
    this.makeRateChangeRequest({rate, abbreviation: 'st', i, type: RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED})
  }
  updateDataAfterActivityBaseRatesChanged(res: any, i: number) {
    const { data } = res;
    const rateObj = data?.rate;
    const is_fees_applicable = data?.is_fees_included;
    const arrayValues = this.activityArray.value;
    for (var prop in rateObj) {
      if (prop !== 'abbreviation') {
        const ele = rateObj[prop];
        const index = arrayValues[i]?.rates?.findIndex(r => r?.rate_factor?.toLowerCase() === prop);
        if (index > -1) {
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(i).get('rates') as UntypedFormArray)
            .at(index).patchValue({
              billrate: this.accuracyPipe?.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true }),
              payrate: this.accuracyPipe?.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true }),
              vendor_rate: this.accuracyPipe?.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
              is_fees_applicable: is_fees_applicable,
              default:  Object?.keys(ele?.default || {})?.length  ? [ele?.default]: null
            });
        }
      }
    }


    const regular = rateObj?.regular;
    ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
      .at(i).patchValue({
        activity_payrate: this.accuracyPipe?.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true }),
        activity_vendor_rate: this.accuracyPipe?.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
        activity_billrate: this.accuracyPipe?.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true }),
        is_fees_applicable: is_fees_applicable,
        default:  Object?.keys(rateObj?.default || {})?.length  ? [rateObj?.default]: null
      }));
    this.recalcualatebudget();
  }

  activityBaseRatesChangedForAbb(abbreviation, rate, i, k) {
    this.makeRateChangeRequest({rate, abbreviation, i, type: RATE_CHANGE_TYPE.ACTIVITY_BASE_RATES_CHANGED_FOR_ABB});
  }

  updateDataAfterActivityBaseRatesChangedForAbb(res: any, i) {
    const { data } = res;
    const { rate } = data;
    const is_fees_applicable = data?.is_fees_included;
    const arrayValues = this.activityArray.value;
    const abb = data?.abbreviation;
    const regular = rate?.regular;
    const index = arrayValues[i].rates?.findIndex(r => r?.rate_factor?.toLowerCase() === abb);
    if (index > -1) {
      ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
        .at(i).get('rates') as UntypedFormArray)
        .at(index)?.patchValue({
          billrate: this.accuracyPipe?.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true }),
          payrate: this.accuracyPipe?.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true }),
          vendor_rate: this.accuracyPipe?.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
          is_fees_applicable: is_fees_applicable,
          default:  Object?.keys(regular?.default || {})?.length  ? [regular?.default]: null
        });
    }
  }

  changeEditMode(activityindex, rateIndex, key, event) {
    const updateKey = (key === 'enable_bill_rate_edit') ? 'billrate' : 'payrate';
    if (!event) {

      ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
        .at(activityindex).get('rates') as UntypedFormArray)
        .at(rateIndex)?.patchValue({
          [key]: event
        });
      ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
        .at(activityindex).get('rates') as UntypedFormArray)
        .at(rateIndex)?.get(updateKey).disable()
    } else {
      ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
        .at(activityindex).get('rates') as UntypedFormArray)
        .at(rateIndex)?.patchValue({
          [key]: event
        });
      ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
        .at(activityindex).get('rates') as UntypedFormArray)
        .at(rateIndex)?.get(updateKey).enable()
    }
  }
  rateFactorFomrula: Map<string, any> = new Map<string, any>();
  getFormulatoDisplay(abbreviation, rateFactor) {
    if (this.rateFactorFomrula?.has(abbreviation?.toLowerCase())) {
      const abbr: Map<string, string> = this.rateFactorFomrula?.get(abbreviation?.toLowerCase());
      return abbr ? abbr.get(rateFactor) : '';
    } else {
      return '';
    }
  }

  get ratesArray(): UntypedFormArray {
    return this.assignmentCreateForm.get('rate') as UntypedFormArray;
  }

  get feeArray(): UntypedFormArray {
    return this.assignmentCreateForm.get('fee') as UntypedFormArray;
  }

  get taxArray(): UntypedFormArray {
    return this.assignmentCreateForm.get('tax') as UntypedFormArray;
  }
  get TaxAdjustmentFees() : UntypedFormArray{
    return this.assignmentCreateForm.get('adjustment_fee') as UntypedFormArray;
  }

  get activityArray(): UntypedFormArray {
    return this.assignmentCreateForm.get('activity') as UntypedFormArray;
  }
  isChangeInToggleValuesOfRates() {
    let non_finance_change = true;
    let finance_change = true;
    this.ratesArray.value?.filter(res => res?.rate_factor !== RATETYPES.ST)?.forEach(data => {
      let searchItem = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors?.filter(res => res?.abbreviation?.toLowerCase() === data?.rate_factor?.toLowerCase());
      if(searchItem?.[0]?.billable) {
        finance_change = Boolean(finance_change) && Boolean(searchItem?.[0]?.applicable === data?.is_applicable);
      } else {
        non_finance_change = Boolean(non_finance_change) && Boolean(searchItem?.[0]?.applicable === data?.is_applicable);
      }
    });
    return {finance_change , non_finance_change};
  }
  resetEffectiveDate() {
    let start_date = this.assignmentCreateForm.get('start_date').value
    let end_date = this.assignmentCreateForm.get('end_date').value
    if (!start_date || !end_date) {
      return;
    }
    this.recalcualatebudget()
    if (this.assignmentCreateForm.get('effective_date') && !(this.extend === UPDATE_FOR.DATE || (this.extend === UPDATE_FOR.TAX && this.assignmentData?.assignments?.action_allow?.can_tax_update_pending))) {
      this.assignmentCreateForm.get('effective_date').setValue('');
    }
    this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets : undefined, showTable : false }));
    const startDateString = this.convertDateFormat(start_date);
    const endDateString = this.convertDateFormat(end_date);
    start_date = getDateFromString(startDateString);
    end_date = getDateFromString(endDateString);
    start_date  = this.assignmentData?.assignments?.assignment?.is_hybrid ? ((this.isChangeInToggleValuesOfRates()?.finance_change && this.isChangeInToggleValuesOfRates()?.non_finance_change) ? start_date :  new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1 + (7 - new Date().getDay()) % 7)) : start_date;
    if (this.extend !== UPDATE_FOR.DATE) {
      this.effectiveDateOption = {
        language: 'English',
        enabledDateRanges: [
          {
            start: start_date,
            end: end_date
          },
        ]
      };
    }
  }
  updateControlValue(formControlName , type , showSymbol = false) {
    this.assignmentCreateForm.controls[formControlName]?.setValue(this.accuracyPipe.transform(this.assignmentCreateForm.get(formControlName)?.value , this.accuracyConfig[type] , {isEdit : showSymbol}));
  }

  assignmentData: any;
  jobTemplateId: string;
  selectedFoundationalData = [];
  selectedCustomData = {};
  createForm() {
    this.getSupportingList();
    this.assignmentCreateForm.get('original_start_date').valueChanges.subscribe(val => {
      this.assignmentCreateForm.get('worker_original_start_date').setValue(val);
      this.allDisableField['worker_original_start_date'] = true;
    });
    this.assignmentCreateForm.get('work_location').valueChanges.subscribe(val => {
      if(!this.assignmentId) this.getCurrencyDropdownValues(null , true)
    });

    this.assignmentCreateForm.get('start_date').valueChanges.subscribe(val => { this.resetEffectiveDate(); this.recalcualatebudget(); })
    this.assignmentCreateForm.get('end_date').valueChanges.subscribe(val => {
      this.resetEffectiveDate();
      this.recalcualatebudget();
      if (this.assignmentId && val && this.programDetails?.config?.disallow_update_assignment_with_approved_timesheet) {
        const { assignment } = this.assignmentData?.assignments;
        const { end_date } = assignment;
        const endDateString = this.convertDateFormat(val);
        const new_end_date = getDateFromString(endDateString);
        if (new_end_date < getDateFromString(end_date)) {
          this.checkIfApprovedTSImpacted(endDateString);
        }
      }
    })



    if (!this.assignmentId) {
      this.getRateFactor();
      if (this.user_type?.toUpperCase() === UserType.Client && !this.assignmentConfig?.show_managers?.create?.is_enabled) {
        this.setAssignmentManager(this.assignmentValueFor['current_user']);
      }
      this.loadDefaultMemberValue(this.assignmentValueFor['current_user']);
      return;
    }

    this._formRendererService.get(`/assignment/programs/${this.programId}/assignment/${this.assignmentId}?is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled ? this.isEffectiveDateSetting?.is_enabled : false}`)
      .subscribe(res => {
        const { data } = res;
        this.assignmentData = data;
        this.markupByRateTypeEnabled = this.assignmentData?.assignments?.assignment?.is_markup_by_rate_type || false;
        this.costComponentEnabled = this.assignmentData?.assignments?.assignment?.is_cost_component || false;
        this.validateStartDate();
        const { worker, finance, foundational_data, custom, assignment, sow, total_approved_spend } = data?.assignments;
        let { vendor, work_location, assignment_manager, start_date, end_date, tax, hierarchy, job, active_on, is_quick_assignment, labor_category, candidate_sourcing_type , is_hybrid , remote_worker , remote_worker_details , job_type} = assignment;
        const { adjusted_markup, currency, days_per_week, estimated_tax, expense_budget, gross_allocated_budget, is_billable, is_expense_enabled, is_timesheet_enabled, net_allocated_budget, ot_exempt_position, overtime_budget, rate_model, rate_type, shift_timing, st_hours, timesheet_budget, timesheet_type, total_working_days, vendor_markup,estimated_adjustment } = finance;
        const { expense_manager, timesheet_manager } = finance;
        
        this.jobTemplateId = assignment?.assignment_title?.id;
        this.getJobTemplateDetails();
        if (worker) {
          const hasValue = (this.dropDownOptions?.candidate_uuid || []).some(can => can?.id === worker?.candidate?.id);
          this.assignmentValueFor['is_hybrid_timesheet'] = is_hybrid;
          if (!hasValue) {
            const opt = this.dropDownOptions?.candidate_uuid || [];
            opt.push(worker?.candidate);
            this.dropDownOptions = { ...this.dropDownOptions, candidate_uuid: opt };
            this.getSsoIdConfig(worker);
          }
          this.currency = currency?.toUpperCase();
          this.assignmentCreateForm.patchValue({
            job_type: job_type,
            candidate_uuid: worker?.candidate?.id,
            source_type: worker?.source_type, 
            source_id: worker?.source_id,
            official_email: worker?.official_email,
            original_start_date: this.datePipe.transform(getDateFromString(worker?.original_start_date), this.dateFormat, undefined, undefined, true),
            worker_original_start_date: this.datePipe.transform(getDateFromString(worker?.original_start_date), this.dateFormat, undefined, undefined, true),
            start_date: this.datePipe.transform(getDateFromString(start_date), this.dateFormat, undefined, undefined, true),
            end_date: this.datePipe.transform(getDateFromString(end_date), this.dateFormat, undefined, undefined, true),
            adjusted_markup: this.accuracyPipe?.transform(adjusted_markup ? Number(adjusted_markup) : 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
            is_quick_assignment: is_quick_assignment == 2 ? 2 : true,
            currency: currency,
            sow_id: sow?.id,
            sow_project_id: sow?.project?.id,
            sow_owner_id: sow?.sow_owner_id,
            days_per_week,
            estimated_tax,
            estimated_adjustment,
            expense_budget,
            gross_allocated_budget,
            is_billable,
            is_expense_enabled,
            is_timesheet_enabled,
            net_allocated_budget,
            ot_exempt_position,
            overtime_budget,
            active_on,
            rate_model,
            rate_type,
            shift_timing,
            st_hours : this.accuracyPipe.transform(st_hours , this.accuracyConfig?.hour),
            timesheet_budget,
            timesheet_type : timesheet_type?.value,
            total_working_days,
            vendor_markup: this.accuracyPipe?.transform(vendor_markup ? Number(vendor_markup) : 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
            hierarchy_id: [hierarchy?.id],
            hierarchy_name: hierarchy?.name,
            total_approved_spend,
            remote_worker,
            worker_classification: worker?.classification,
            sso_id:  worker?.sso_id
          });
          if(worker?.candidate?.id) {
            this.getCandidates({ term: '' });
          }
          if (sow?.id) {            
            this.selectedSow = sow;
            this.sow_id = sow?.id;
            this.existingSOW=  [...this.existingSOW, sow];
            this.sow_project_id= sow?.project?.id;
            // this.getExistingSOWProject(sow?.id, null);
            this.existingSOWProject= [...this.existingSOWProject, sow?.project];
            const selectedSowProj = this.existingSOWProject?.find(sowProjObj => sowProjObj?.id === this.sow_project_id);
            this.dropDownOptions.selectedMilestone = selectedSowProj ? selectedSowProj : this.existingSOWProject[0];
            this.assignmentCreateForm.patchValue({
              sow_id: this.sow_id,
              sow_project_id: this.sow_project_id
            });
            this.getSowProjectDetails();
          }
          this.selectedHierachyObj =  hierarchy;
          this.selectedHierachyObj = { ...this.selectedHierachyObj, rate_model: this.rateModelObj[rate_model]}
          if (!is_billable) {
            this.assignmentCreateForm.get('is_billable').setValue(true);
            this.toggleChanged('is_billable');
          }
          this.assignmentCreateForm.get('active_on').clearValidators();
          this.assignmentCreateForm.get('active_on').updateValueAndValidity();
          if (!is_expense_enabled) {
            this.assignmentCreateForm.get('is_expense_enabled').setValue(true);
            this.toggleChanged('is_expense_enabled');
          }

          if (!is_timesheet_enabled) {
            this.assignmentCreateForm.get('is_timesheet_enabled').setValue(true);
            this.toggleChanged('is_timesheet_enabled');
          }
          if(remote_worker) {
            this.assignmentCreateForm.get('remote_worker_details').patchValue({
              country: remote_worker_details?.country,
              state: remote_worker_details?.state,
              county: remote_worker_details?.county,
              city: remote_worker_details?.city
            });
          }
          this.workerSourceTypeChanged({ slug: worker?.source_type }, false)
          this.resetEffectiveDate();
          this.changeMarkupOption();
          this.checkForActivityOnTimesheetType();
        }
        if (vendor) {
          const hasValue = (this.dropDownOptions?.vendor_id || []).some(opt => opt?.id === vendor?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.vendor_id || [];
            opt.push({vendor });
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: opt };
          }
          let sourcingModel = this.dropDownOptions?.sourcing_model?.find(model => model?.value === assignment?.sourcing_model);
          if (assignment?.sourcing_model == 'headcount_track') {
            this.assignmentCreateForm.patchValue({
              vendor_id: vendor?.id,
              sourcing_model: sourcingModel?.label || assignment?.sourcing_model
            });
          } else if (assignment?.sourcing_model == 'direct_hire') {
            this.assignmentCreateForm.patchValue({
              vendor_id: vendor?.id,
              sourcing_model: sourcingModel?.label || assignment?.sourcing_model
            });
          } else {
            this.assignmentCreateForm.patchValue({
              vendor_id: vendor?.id,
              sourcing_model: assignment?.sourcing_model
            });
          };
          this.getVendorDetails(vendor?.id , true);
        }

        if (work_location) {
          const hasValue = (this.dropDownOptions?.work_location || []).some(opt => opt?.id === work_location?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.work_location || [];
            opt.push(work_location);
            this.dropDownOptions['work_location'] = [];
            this.changeDetectorRef.detectChanges();
            this.dropDownOptions = { ...this.dropDownOptions, work_location: opt };
            this.changeDetectorRef.detectChanges();
          }
          this.assignmentCreateForm.patchValue({
            work_location: work_location?.id
          });
          // this.search('work_location', null)
          this.getAllWorkLocation();
        }
        if(candidate_sourcing_type) {
          this.assignmentCreateForm.patchValue({
            candidate_sourcing_type
          });
        }
        this.assignmentCreateForm.get('candidate_sourcing_type').disable();
        this.checkIfTimeheetTypeExists();
        this.getFees().then(() => {
          this.getRateFactor({ rateFactorCase: true });
          if(this.assignmentConfig?.project_based?.is_allow) {
            this.getRateFactor();
         } else {
          if(finance?.rate_factor && finance?.rate_factor?.length > 0 && finance?.rate_factor[0]?.rate_factors) {
            this.rateFactor =  finance?.rate_factor[0]?.rate_factors;
            const st_rate_factor = this.rateFactor?.find(rate=> rate?.abbreviation?.toLowerCase() == RATETYPES.ST);
            if (this.markupByRateTypeEnabled && st_rate_factor && !st_rate_factor?.markup) {
              st_rate_factor.markup = this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
            }
            if(st_rate_factor) {
              this.dataSourceUrl['standard_rate_factor'] = st_rate_factor;
              this.assignmentValueFor['markup'] = st_rate_factor?.markup;
            } 
            this.rateFactor = this.rateFactor?.filter(rate=> rate?.abbreviation?.toLowerCase()  !== RATETYPES.ST);
            this.createLocalRateFactorArrForUpdation();
          }
          this.updateRateFactor();
         }
         if(finance?.rate_factor) {
          this.updateActivityWiseRateFactorsArray(finance?.rate_factor);
         }
        });
        this.loadTaxFields();
        this.sourcingModelChanged();
        if(this.programDetails.config?.is_adjustment_fee_allowed  &&this.assignmentId) {
          this.createTaxAdjustmentForm();
        }

        if (job) {
          const hasValue = (this.dropDownOptions?.job_id || []).some(opt => opt?.id === job?.id);
          if (!hasValue) {
            let opt = this.dropDownOptions?.job_id || [];
            job.job_id =  job?.job_code;
            opt.push({ ...job, template_name: job?.title });
            this.dropDownOptions = { ...this.dropDownOptions, job_id: opt };
            this.changeDetectorRef.detectChanges();
          }
          this.assignmentCreateForm.patchValue({
            job_id: job?.id
          });
        }

        if (assignment_manager) {
          if (this.user_type?.toUpperCase() === UserType.Client && !this.assignmentConfig?.show_managers?.update?.is_enabled) {
            // this.setAssignmentManager(assignment_manager); // this is wrong
            this.dropDownOptions.assignment_manager = [assignment_manager];
            this.loadDefaultMemberValue(this.assignmentValueFor['current_user'] , false).then(() => {
              if(this.delegatedUser['id'] && assignment_manager?.id !== this.delegatedUser['id'] && this.assignmentValueFor['currentProgram']?.config?.restrict_delegation_by_hierarchy) {
                this.dropDownOptions.assignment_manager.push(this.delegatedUser);
              }
            });
          } else {
            const hasValue = (this.dropDownOptions?.assignment_manager || []).some(option => option?.id === assignment_manager?.id);
            if (!hasValue) {
              const options = this.dropDownOptions?.assignment_manager || [];
              options.push(assignment_manager);
              this.dropDownOptions = { ...this.dropDownOptions, assignment_manager: options };
            }
          }
          this.assignmentCreateForm.patchValue({
            assignment_manager: assignment_manager?.id
          });
          this.loadDefaultMemberValue(assignment_manager , false);
        }
        if (expense_manager) {
          if(this.user_type?.toUpperCase() === UserType.Client && !this.assignmentConfig?.show_managers?.update?.is_enabled){
            this.dropDownOptions.expense_manager = [expense_manager];
            this.assignmentCreateForm.get('expense_manager').disable();
          }else{
            expense_manager?.forEach(res => {
              const hasValue = (this.dropDownOptions?.expense_manager || []).some(option => option?.id === res?.id);
              if (!hasValue) {
                const options = this.dropDownOptions?.expense_manager || [];
                options.push(res);
                this.dropDownOptions = { ...this.dropDownOptions, expense_manager: [...options] };
              }
            })
          }
          this.assignmentCreateForm.patchValue({
            expense_manager: expense_manager?.map(res => res?.id)
          });
        }
        if (timesheet_manager) {
          if(this.user_type?.toUpperCase() === UserType.Client && !this.assignmentConfig?.show_managers?.update?.is_enabled){
            this.dropDownOptions.timesheet_manager = [timesheet_manager];
            this.assignmentCreateForm.get('timesheet_manager').disable();
          } else{
            timesheet_manager?.forEach(res => {
              const hasValue = (this.dropDownOptions?.timesheet_manager || []).some(option => option?.id === res?.id);
              if (!hasValue) {
                // (this.dropDownOptions?.timesheet_manager || []).push(res);
                let options = this.dropDownOptions?.timesheet_manager || [];
                options.push(res);
                this.dropDownOptions = { ...this.dropDownOptions, timesheet_manager: [...options] };
              }
            })
          }
          this.assignmentCreateForm.patchValue({
            timesheet_manager: timesheet_manager?.map(res => res?.id)
          });
        }
        this.markupFieldValiator();
        if(this.assignmentId) {
          this.assignmentCreateForm.get('onboarding_checklist_id').clearValidators();
          this.assignmentCreateForm.get('onboarding_checklist_id').updateValueAndValidity();
        }
        //  if(this.assignmentConfig?.project_based?.is_allow) {
        //     this.getRateFactor();
        //  } else {
        //   if(finance?.rate_factor && finance?.rate_factor?.length > 0 && finance?.rate_factor[0]?.rate_factors) {
        //     this.rateFactor =  finance?.rate_factor[0]?.rate_factors;
        //     const st_rate_factor = this.rateFactor?.find(rate=> rate?.abbreviation?.toLowerCase() == RATETYPES.ST);
        //     if(st_rate_factor) {
        //       this.dataSourceUrl['standard_rate_factor'] = st_rate_factor;
        //     } 
        //     this.rateFactor = this.rateFactor?.filter(rate=> rate?.abbreviation?.toLowerCase()  !== RATETYPES.ST);
        //     this.createLocalRateFactorArrForUpdation();
        //   }
        //   this.updateRateFactor();
        //  }
        //  if(finance?.rate_factor) {
        //   this.updateActivityWiseRateFactorsArray(finance?.rate_factor);
        //  }
         this.OnOtExemptChange();
     
          this.dropDownOptions['billing_details'] = {
            ...this.dropDownOptions['billing_details'],
            initial_budget : this.accuracyPipe?.transform(timesheet_budget, this.accuracyConfig.amount, { isEdit: true }),
            gross_budget : this.accuracyPipe?.transform(gross_allocated_budget, this.accuracyConfig.amount, { isEdit: true }),
            estimate_tax: this.accuracyPipe?.transform(estimated_tax, this.accuracyConfig.tax, { isEdit: true }),
            net_budget : this.accuracyPipe?.transform(net_allocated_budget , this.accuracyConfig.amount, { isEdit: true }),
            estimated_adjustment : this.accuracyPipe?.transform(estimated_adjustment , this.accuracyConfig.amount, { isEdit: true }),
            
            total_working_days : total_working_days
          };          
        
        if (this.extend === UPDATE_FOR.DATE) {
          const modified_effective_date = this.addDays(end_date, 1);
          if (modified_effective_date) {
            this.assignmentCreateForm.get('effective_date')?.setValue(this.datePipe.transform(modified_effective_date, this.dateFormat , undefined, undefined, true))
           this.allDisableField['original_start_date']= true;
          }
        }
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        this.effectiveDateOption = {
          language: 'English',
          enabledDateRanges: [
            {
              start: start_date.setDate(start_date.getDate() - 1),
              end: end_date.setDate(end_date.getDate() + 1)
            },
          ]
        };
        if (foundational_data) {
          for (var key in foundational_data) {
            const ele = foundational_data[key];
            ele?.forEach(el => {
              const obj = {
                foundational_data_type: { id: el?.foundational_data_type_id, name: key },
                id: el?.id,
                name: el?.name,
                code: el?.code,
                is_disabled: el?.is_disabled
              }
              this.selectedFoundationalData.push(obj);
              this.selectedFoundationalData = [...this.selectedFoundationalData];
            });
          }
        }

        if (hierarchy && hierarchy?.id) {
          this.getTimesheetTypeDetails();
          this.search('assignment_manager', null)
        }

        if (custom) {
          this.selectedCustomData = custom;
        }
        this.display_title_from = assignment?.display_title_from;
        let { search_by_job, search_by_job_template } = this.assignmentConfig?.update_assignment_title || {};
        this.onUpdateDisplayAssignmentTitle(search_by_job, search_by_job_template);
        if(this.accountCodeCreationActive){
          this.accountCode = res?.account_code;
          if(this.accountCode){
            this.assignmentCreateForm.patchValue({
              account_code:  this.accountCode?.account_code
            })
          }
        }
        if(this.extend === UPDATE_FOR.REVIEW) {
          this.assignmentCreateForm.get('effective_date').clearValidators();
          this.assignmentCreateForm.get('effective_date').updateValueAndValidity();
          this.assignmentCreateForm.get('request_reason').clearValidators();
          this.assignmentCreateForm.get('request_reason').updateValueAndValidity();
      }
      this.dropDownOptions['labor_category'] = labor_category?.id;
      if(this.assignmentData?.assignments?.action_allow?.can_tax_update_pending && this.extend == UPDATE_FOR.TAX) {
        this.assignmentCreateForm.get('effective_date').setValue(this.convertDateFormat(assignment?.start_date , this.assignmentService.getDefaultDateFormat() , DATE_FORMAT?.FORMATYMD ));
        this.allDisableField['original_start_date'] = true;
      }
  });
}

  checkIfApprovedTSImpacted(end_date) {
    const url = `/timesheet/programs/${this.programId}/assignment/${this.assignmentId}/validate-approve-ts?date=${end_date}`;
    this._formRendererService.get(url).subscribe(
      (data: any) => {
        this.approvedTSExist = data?.data?.exist;
        let errors = this.assignmentCreateForm.get('end_date')?.errors || null;
        if (errors) {
          delete errors['approved_ts_exist_for_selected_end_date'];
          if (errors && this.isEmptyObject(errors)) {
            errors = null;
          }
        }
        if (this.approvedTSExist) {
          if (!errors) {
            errors = {};
          }
          errors['approved_ts_exist_for_selected_end_date'] = true;
        }
        this.assignmentCreateForm.get('end_date')?.setErrors(errors);
      });
  }


  sourcingModelChanged() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model } = formValue;
    this.isSourcingModelSOW(sourcing_model);
    this.keepDisabledValue(sourcing_model);
    this.changeMarkupOption();
    if(!this.assignmentId) {
      this.dropDownOptions.selectedMilestone = undefined;
    }
  }

  loadTaxFields() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model, work_location, hierarchy_id } = formValue;
    const sourcingObj = this.dropDownOptions?.sourcing_model;
    const sourcingModel= sourcingObj?.find(model => model?.label?.toLowerCase() == sourcing_model?.toLowerCase());
    if (this.assignmentId) {
      this.loadCustomTax(sourcingModel);
      this.populateExistingTaxes();
      return;
    }
    if(!sourcing_model) {
      return
    }
    if(this.programDetails?.config?.is_custom_tax_on_assignment) {
      this.loadCustomTax(sourcingModel);
      return
    }
    else if (!sourcing_model || !work_location || !hierarchy_id) {
      return;
    }
    const queryParam = `?sourcing_model=${sourcingModel?.value?.toUpperCase()}&work_location=${work_location}&hierarchy=${hierarchy_id[0]}`;
    this._formRendererService.get(`/configurator/programs/${this.programId}/taxes${queryParam}`)
      .subscribe(res => {
        const { taxes } = res;
        if (!taxes) {
          return;
        }
        const tax = Array.isArray(taxes) ? taxes : [taxes];
        const assignment = this.assignmentData?.assignments?.assignment || null;
        const taxList = assignment?.tax?.filter(t => t.entity_type === 'tax') || [];
        
        this.taxArray.clear();
        tax.forEach(ele => {
          const value = taxList.find(fe => fe?.entity_name === ele?.name);
          const  applicable_on =  this.programDetails?.config?.hasOwnProperty('tax_applicable_on') && this.programDetails?.config?.tax_applicable_on  ? this.programDetails?.config?.tax_applicable_on :ele?.applicable_on
          const calculated_on = this.programDetails?.config?.hasOwnProperty('tax_calculated_on')&& this.programDetails?.config?.tax_calculated_on ? this.programDetails?.config?.tax_calculated_on :applicable_on
          const feeForm = this.fb.group({
            amount_type: [ele?.tax_type?.toLowerCase() === 'percent' ? AmountType.percentage : AmountType.fixed_amount],
            amount_value: [this.accuracyPipe?.transform(value?.amount_value ?? ele?.tax_applicable, ele?.tax_type?.toLowerCase() === 'percent' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { isEdit: true })],
            applicable_on: [applicable_on?.toLowerCase()],
            calculated_on: [calculated_on?.toLowerCase()],
            entity_name: [ele?.name],
            name: [ele?.name?.split('_').join(' ')],
            config_type: ['system']
          });
          feeForm.get('applicable_on').disable();
          feeForm.get('amount_type').disable();

          let formArray = this.assignmentCreateForm.get('tax') as UntypedFormArray;
          formArray.push(feeForm);
        })
      })
  }

  loadCustomTax(sourcingModel) {
    if(!sourcingModel?.value) {
      return
    }
    this._formRendererService.get(`/configurator/programs/${this.programId}/taxes?sourcing_model=${sourcingModel?.value?.toUpperCase()}`)
    .subscribe(res => {
      const { taxes } = res;
      if (!taxes) {
        return;
      }
      this.applicable_on = taxes[0]?.applicable_on;
    })
  }

  populateExistingTaxes() {
    this.taxArray.clear();
    const assignment = this.assignmentData?.assignments?.assignment || null;
    assignment?.tax.forEach(value => {
      if (value?.entity_type?.toLowerCase() === 'tax') {
        const taxForm = this.fb.group({
          amount_type: [value?.amount_type?.toLowerCase()],
          amount_value: [this.accuracyPipe?.transform(value?.amount_value, value?.amount_type?.toLowerCase() === 'percentage' ? this.accuracyConfig.tax_percentage : this.accuracyConfig.tax, { isEdit: true })],
          applicable_on: [value?.applicable_on?.toLowerCase()],
          calculated_on: [value?.hasOwnProperty('calculated_on') ? value?.calculated_on?.toLowerCase(): value?.applicable_on?.toLowerCase()],
          entity_name: [value?.entity_name],
          name: [value?.entity_name?.split('_').join(' ')],
          config_type: [value?.config_type],

        });
        taxForm.get('applicable_on').disable();
        taxForm.get('amount_type').disable();
        // if(!this.taxUpdateSetting?.custom?.rename) { taxForm.get('entity_name').disable() }; 
        let formArray = this.assignmentCreateForm.get('tax') as UntypedFormArray;
        formArray.push(taxForm);
      }
    })
    this.existingTax = JSON.parse(JSON.stringify((this.assignmentCreateForm.get('tax') as UntypedFormArray).value));
  }
  
  currencySybmol;
  currencyChanged(curr) {
    if (curr) {
      this.currency = curr?.code;
    }
  }

  isSourcingModelSOW(sourcing_model) {
    this.sow_foundational_data= [];
    if (sourcing_model?.toLowerCase() === SOURCING_TYPE.SOW) {
      this.is_Sourcing_Model_SOW = true;
      this.getExistingSOW(null);
      this.assignmentCreateForm.controls.job_id.reset();
      this.assignmentCreateForm?.controls?.sow_id?.setValidators([Validators.required]);
      this.assignmentCreateForm?.controls?.sow_project_id?.setValidators([Validators.required]);
    } else {
      this.is_Sourcing_Model_SOW = false;
      this.assignmentCreateForm?.controls?.sow_id?.setValidators(null);
      this.assignmentCreateForm?.controls?.sow_project_id?.setValidators(null);
      this.assignmentCreateForm.controls.sow_id.reset();
      this.assignmentCreateForm.controls.sow_project_id.reset();
      //once sourcing model changed from SOW to other sourcing type, if AM is selected, show only his data   
      if(this.assignmentCreateForm?.get('assignment_manager')?.value){
        this.loadDefaultMemberValue({id: this.assignmentCreateForm?.get('assignment_manager')?.value});
      }
      this.startDateOption = {
        language: 'English'
      }
    }
  }

  getExistingSOW(searchTerm) {
    let { vendor_id, hierarchy_id } = this.assignmentCreateForm.getRawValue();
    if (!vendor_id) {
      return;
    }
    if (this.searchSOWSubscription) {
      this.searchSOWSubscription.unsubscribe();
    }
    this.loaderObj['sow_id'] = true;
    let url = `/sow/programs/${this.assignmentValueFor['currentProgram']?.id}/vendor_sow/${vendor_id}${hierarchy_id ? '?hierarchy=' + hierarchy_id + '&status=awarded' : '?status=awarded'}&ordering=title&action=create`
    if(searchTerm && searchTerm?.term) {
      url = url + '&search=' + searchTerm?.term;
    }
    this.searchSOWSubscription = this._formRendererService.get(url).subscribe(data => {
      this.loaderObj['sow_id'] = false;
      if (data) {
        this.loaderObj['sow_id'] = false;
        this.existingSOW = data?.results || [];
        if (this.sow_id) {
          this.assignmentCreateForm.patchValue({
            sow_id: this.sow_id
          });
          let isPresent  = this.existingSOW.some(sow=> sow.id === this.sow_id);
          if(!isPresent && this.selectedSow.hasOwnProperty('id')) {
          this.existingSOW = [...this.existingSOW, ... [this.selectedSow]];
          }
         if(!this.assignmentId) {
          this.getExistingSOWProject(this.sow_id, null);
         }
    
        }
      }
    });
  }
  
  getSowProjectDetails(){    
    let url =  `/sow/programs/${this.assignmentValueFor['currentProgram']?.id}/sow/${this.sow_id}/deliverables/${this.sow_project_id}?is_latest=True&is_awarded=True`;
    if(this.assignmentCreateForm?.get('sow_id')?.value) {
      this.loaderObj['sow_project_id'] = true;
    this.existingSOWProject= [];
      this._formRendererService.get(url).subscribe({next:
        (data: any) => {
        if (data) {
          this.loaderObj['sow_project_id'] = false;
          if (this.sow_project_id) {
            data.id= this.sow_project_id; //in case of SOW amendment, this value can be different
            this.existingSOWProject= [data];
            const selectedSowProj = this.existingSOWProject?.find(sowProjObj => sowProjObj?.id === data.id);
            this.dropDownOptions.selectedMilestone = selectedSowProj ? selectedSowProj : undefined;
            this.assignmentCreateForm.patchValue({
              sow_project_id: this.sow_project_id
            });
          }
          this.setAssignmentDateFromSowProject(data);
        }
      }, error: (err) => {
        this.loaderObj['sow_project_id'] = false;
      }})
    } 
  }

  getExistingSOWProject($event, searchTerm) {
    if(!this.assignmentId) {
      this.assignmentCreateForm.get('sow_project_id')?.setValue(null);    
      if($event){
        this.getFoundationalDefaultValuesForSow($event);
      }  
    }
    this.existingSOWProject = [];
    let url =  `/sow/programs/${this.assignmentValueFor['currentProgram']?.id}/sow/${this.assignmentCreateForm?.get('sow_id')?.value}/deliverables${this.sow_project_id ? '/' + this.sow_project_id : ''}?is_awarded=True${!this.assignmentId ? '&is_active=true': ''}${searchTerm?.term ? '&search=' + searchTerm?.term : ''}`;
    if(this.assignmentCreateForm?.get('sow_id')?.value) {
      this.loaderObj['sow_project_id'] = true;
      this._formRendererService.get(url).subscribe(data => {
        if (data) {
          this.loaderObj['sow_project_id'] = false;
          this.existingSOWProject = this.sow_project_id ? [data] : data?.results || [];
          // this.dropDownOptions.selectedMilestone = this.existingSOWProject[0];
          if (this.sow_project_id) {
            this.assignmentCreateForm.patchValue({
              sow_project_id: this.sow_project_id
            });
          }          
          const sowProjectId = this.assignmentCreateForm.get('sow_project_id')?.value;
          let isPresent  = this.existingSOWProject.some(sow=> sow.id === this.sow_project_id);
          if(!isPresent && this.selectedSow?.hasOwnProperty('id')) {
          this.existingSOWProject = [...this.existingSOWProject, ... [this.selectedSow?.project]];
          }
          const selectedSowProj = this.existingSOWProject?.find(sowProjObj => sowProjObj?.id === sowProjectId);
          this.dropDownOptions.selectedMilestone = selectedSowProj;
          this.setAssignmentDateFromSowProject(selectedSowProj);
          if (this.is_Sourcing_Model_SOW && !this.assignmentId && this.existingSOWProject?.length && !this.assignmentCreateForm.get('hierarchy_name')?.value) {
            const { hierarchy } = this.existingSOWProject[0];
            this.assignmentCreateForm.get('hierarchy_name')?.setValue(hierarchy.name);
            this.assignmentCreateForm.get('hierarchy_id')?.setValue(hierarchy.id);
            this.selectHierarchy([hierarchy.id], false);
          }
        }
      },err => {
        this.loaderObj['sow_project_id'] = false;
      })
    } else {
      if(!this.sow_project_id) {
        this.assignmentCreateForm.patchValue({
          sow_project_id: null
        });
      }
    }
  }

  selectedSowProject(id) {
    const selectedSowProj = this.existingSOWProject?.find(sowProjObj => sowProjObj?.id === id);
    this.dropDownOptions.selectedMilestone = selectedSowProj ? selectedSowProj: undefined;
    if(selectedSowProj){
    this.setAssignmentDateFromSowProject(selectedSowProj);
    }
  }

  setAssignmentDateFromSowProject(selectedSowProj) {
    const sowStartDate= selectedSowProj?.client_start_date;
    const sowEndDate= selectedSowProj?.client_end_date;
    if (selectedSowProj && sowStartDate?.year && sowEndDate?.year) {
      
      const enabledDateRanges = [
        {
          start: new Date(parseInt(sowStartDate?.year), parseInt(sowStartDate?.month) - 1, parseInt(sowStartDate?.day), 0, 0, 0, 0),
          end: new Date(parseInt(sowEndDate?.year), parseInt(sowEndDate?.month) - 1, parseInt(sowEndDate?.day), 0, 0, 0, 0), 
        }
      ]
      this.startDateOption.enabledDateRanges = enabledDateRanges;
      this.startDateOption = { ...this.startDateOption };
    } else {
      this.startDateOption = {
        language: 'English'
      }
    }
  }
  
  resetDate() {
    this.assignmentCreateForm.get('start_date').setValue('');
    this.assignmentCreateForm.get('end_date').setValue('');
  }

  workWeekPeriod: any;
  workWeekStartDay: any;
  configData: any;
  getTimesheetConfig() {
    if (this.assignmentId) {
      const url = `/timesheet/programs/${this.programId}/config?assignment_uuid=${this.assignmentId}`;
      this._formRendererService.get(url)
        .subscribe(res => {
          const { data } = res;
          const { work_week } = data;
          this.configData = data;
          this.workWeekPeriod = work_week?.period;
          this.workWeekStartDay = work_week?.week_start_day;
        })
    }
  }
  errorCheckList = {};
  weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  registerEffectiveDateChange() {
    this.assignmentCreateForm.addControl('effective_date', this.fb.control(null, Validators.required))
    this.assignmentCreateForm.addControl('request_reason', this.fb.control(null, Validators.required))
    this.assignmentCreateForm.addControl('reason_code_action', this.fb.control(null))
    this.assignmentCreateForm.addControl('request_notes', this.fb.control(null))
    this.assignmentCreateForm.addControl('documents', this.fb.control(null))
    this.errorCheckList['effective_date'] = `Effective Date required.`
    this.errorCheckList['request_reason'] = `Reason for Update required.`
    this.assignmentCreateForm.get('effective_date')?.valueChanges?.subscribe(updatedDate => {
      updatedDate = this.convertDateFormat(updatedDate);
      if (updatedDate) {
        const date = updatedDate?.split("-");
        let start_date = this.convertDateFormat(this.assignmentCreateForm.get('start_date').value);
        if (date?.length === 3) {
          let validTimesheetPeriod = true;
          let currentValue = this.assignmentData?.assignments?.finance;
          const {timesheet_type , st_hours , days_per_week} = this.assignmentCreateForm.getRawValue();
          if (this.workWeekPeriod && (timesheet_type !== currentValue?.timesheet_type?.value || parseFloat(st_hours) !== parseFloat(currentValue?.st_hours) || parseFloat(days_per_week) !== parseFloat(currentValue?.days_per_week)) || this.isActivityNamesChanged() || (this.assignmentData?.assignments?.assignment?.is_hybrid && (!(this.isChangeInToggleValuesOfRates()?.finance_change && this.isChangeInToggleValuesOfRates()?.non_finance_change)))) {
            const day = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0)?.getDay(); 
            if (this.workWeekPeriod === 'weekly' && this.weekday[day] !== this.workWeekStartDay) { 
              validTimesheetPeriod = false; 
            } 
            if (this.workWeekPeriod === 'monthly' && date[2] !== "01") {
              validTimesheetPeriod = false;
            }
          }
          if (updatedDate === start_date || validTimesheetPeriod) {
            this.getImpactedTimesheets(updatedDate);
            this.errorCheckList['effective_date_selection_invalid'] = undefined;
            let errors = this.assignmentCreateForm.get('effective_date')?.errors || null;
            if (errors) {
              delete errors['effective_date_selection_invalid'];
              if (errors && this.isEmptyObject(errors)) {
                errors = null;
              }
              this.assignmentCreateForm.get('effective_date')?.setErrors(errors);
            }
          } else {
            this.assignmentCreateForm.get('effective_date')?.setErrors({ 'effective_date_selection_invalid': true });
            let workPeriod = '';
            if (this.workWeekPeriod === 'weekly') {
              workPeriod = 'week';
            } else if (this.workWeekPeriod === 'monthly') {
              workPeriod = 'month'
            } else {
              workPeriod = this.workWeekPeriod;
            }
            this.errorCheckList['effective_date_selection_invalid'] = `The effective date must be start date of assignment or 1st day of every ${workPeriod}`;
          }
        }
      }
    })
  }

  getUpdatedTimsheetCofigDetails(changeTimesheetValue = false) {
    let selectedTimesheet = [...this.dropDownOptions?.timesheet_type]?.find(res => res?.value?.toLowerCase() === this.assignmentCreateForm.get('timesheet_type').value?.toLowerCase());
    this.assignmentValueFor['is_hybrid_timesheet'] = selectedTimesheet?.input_type?.toLowerCase() === TimesheetType.HOURS && selectedTimesheet?.allocation_method?.toLowerCase() === 'hybrid' ? true : false;
    if (this.assignmentValueFor['is_hybrid_timesheet']) {
      let url = `/timesheet/programs/${this.programId}/config/${selectedTimesheet?.value}/rate-factors?hierarchy_id=${this.assignmentCreateForm?.get('hierarchy_id')?.value?.[0]}`;
      this.assignmentService.get(url).subscribe((res: any) => {
        if(this.assignmentData?.assignments?.assignment?.is_hybrid && this.assignmentId && this.assignmentData?.assignments?.finance?.rate?.length > 0) {
          if(changeTimesheetValue && selectedTimesheet?.id === this.assignmentData?.assignments?.finance?.timesheet_type?.id) {
            this.updateRateFactor();
          }
        }
      this.assignmentValueFor['manualRateFactorForHybridTimesheet'] = res?.data?.rate_factors.filter(data => data?.rate_factor_ts_type?.toLowerCase() === 'manual').map(res => res?.name);
        if (!this.assignmentId || changeTimesheetValue) {
          this.handleRateFactorRes(res?.data, false);
        }
      })
    } else if(!this.assignmentId) {
      this.getRateFactor();
    }
    if (this.assignmentId) {
      if (!selectedTimesheet) { return }
      const formValue = this.assignmentCreateForm.getRawValue();
      const { hierarchy_id } = formValue;
      const url = `/timesheet/programs/${this.programId}/config/basic/${selectedTimesheet?.value}?hierarchy=${hierarchy_id}`;
      this.assignmentService.get(url).subscribe(data => {
        this.assignmentValueFor['workWeekStartDay'] = data['data']?.rules?.basic_rules?.work_week?.week_start_day;
        if(selectedTimesheet?.value && this.assignmentData?.assignments?.finance?.timesheet_type?.value !== selectedTimesheet?.value) {
          this.workWeekStartDay = data['data']?.rules?.basic_rules?.work_week?.week_start_day;
          // this.registerEffectiveDateChange();
        } 
      })
    }
  }

  isEmptyObject(value) {
    return value && Object.keys(value)?.length === 0 && value.constructor === Object;
  }

  getFormControl(key) {
    return this.assignmentCreateForm.get(key);
  }

  checkIfTaxChanged(originalArray, modifiedArray) {
    let is_Value_changed = false;
    if (originalArray?.length < modifiedArray?.length) {
      is_Value_changed = true;

    }

    originalArray?.forEach((originalfees) => {
    let modified_fees = modifiedArray?.find(f=>f?.entity_name?.toLowerCase() ===originalfees?.entity_name?.toLowerCase() );
     if( Number(originalfees?.amount_value)  !== Number(modified_fees?.amount_value)) {
      is_Value_changed = true;
     }
    });
    return is_Value_changed;
  }
  getComparedArrayValues(data) {
      return data ? (Array.isArray(data) ? data?.join(',')  : [data]?.join(',')) : [];
  }
  getImpactedTimesheets(updatedDate?) {
    const { assignment, finance } = this.assignmentData?.assignments;
    const { timesheet_manager, timesheet_type, rate, is_timesheet_enabled } = finance;
    if (!is_timesheet_enabled) {
      return;
    }
    let non_finance_change = this.isChangeInToggleValuesOfRates()?.non_finance_change;
    let finance_change = this.isChangeInToggleValuesOfRates()?.finance_change;
    this.loader.show();
    const currentValues = this.assignmentCreateForm.getRawValue();
    let old_billrate , new_billrate ;
    let project =  new Array();
    if(!this.is_activity_based) {
      const oldRateObj = rate?.[0]?.rates?.find(r => r?.rate_factor?.toLowerCase() === RATETYPES.ST);
      old_billrate = this.accuracyPipe.transform(oldRateObj?.billrate, this.accuracyConfig.rate, { isEdit: true});
      new_billrate = this.accuracyPipe.transform(currentValues?.billrate, this.accuracyConfig.rate, { isEdit: true});
    } else {
      old_billrate = 0;
      new_billrate = 0;
      let current_activities =  currentValues?.activity?.splice(0,rate?.length );
      rate?.forEach((activity) => {
        let unique_activity = current_activities?.find(f=>f?.entity_id === activity?.entity_id );
        // let unique_activity = current_activities?.find(f=>f?.entity_name?.toLowerCase() ===activity?.entity_name?.toLowerCase() );
        let old_st_rate = activity?.rates?.find(r => r?.rate_factor?.toLowerCase() === RATETYPES.ST)?.billrate;
        let new_st_rate = this.accuracyPipe.transform((unique_activity?.activity_billrate), this.accuracyConfig.rate, { isEdit: true});
         if( parseFloat(old_st_rate)  !== parseFloat(new_st_rate)) {
          old_billrate = this.accuracyPipe.transform(old_st_rate, this.accuracyConfig.rate, { isEdit: true});
          new_billrate= this.accuracyPipe.transform(new_st_rate, this.accuracyConfig.rate, { isEdit: true}) ;
         }
         if(unique_activity  && unique_activity?.entity_name?.toLowerCase() !== activity?.entity_name?.toLowerCase()) {
          project.push({id:activity?.entity_id , new: unique_activity?.entity_name , old: activity?.entity_name})
        }
        });
    }
    const { end_date , start_date} = assignment;
    let mdtChangeObj = [];
    this.foundationalFields?.forEach(res => {
      if ((res?.values || this.assignmentData?.assignments?.foundational_data?.[res?.slug]?.length) && this.getComparedArrayValues(this.assignmentData?.assignments?.foundational_data?.[res?.slug]?.map(res => res?.id)) != this.getComparedArrayValues(res?.values)) {
        let finalUpdatedMDt = {};
        finalUpdatedMDt['mdt_code'] = res?.slug; finalUpdatedMDt['is_multiple'] = res?.isMultiple; finalUpdatedMDt['is_finance'] = res?.financial_master_data_type;
        let newValue ; let oldValue ;let new_obj = {} ;let old_value = {} ; let newMultipleValues = [] ; let oldMultipleValues = []
        if(res?.isMultiple) {
          res?.values?.forEach(d => {
            new_obj = {};newValue={};
            newValue = res?.options?.filter(data => data?.id === d)?.[0];
            new_obj = {}; new_obj['id'] = newValue?.id || null; new_obj['code'] = newValue?.code || null; new_obj['name'] = newValue?.name || null;
            newMultipleValues?.push(new_obj);
          });
          this.assignmentData?.assignments?.foundational_data?.[res?.slug]?.forEach(d => {
            old_value = {};oldValue={};
            oldValue = res?.options?.filter(data => data?.id === d?.id)?.[0];
            old_value = {}; old_value['id'] = oldValue?.id || null; old_value['code'] = oldValue?.code || null; old_value['name'] = oldValue?.name || null;
            oldMultipleValues?.push(old_value);
          });
        } else {
          newValue = res?.options?.filter(data => this.getComparedArrayValues(data?.id) === this.getComparedArrayValues(res?.values))?.[0];
          oldValue = this.assignmentData?.assignments?.foundational_data?.[res?.slug]?.[0];
          new_obj = {}; new_obj['id'] = newValue?.id || null; new_obj['code'] = newValue?.code || null; new_obj['name'] = newValue?.name || null;
          old_value = {}; old_value['id'] = oldValue?.id || null ; old_value['code'] = oldValue?.code || null; old_value['name'] = oldValue?.name || null;
        }
        finalUpdatedMDt['new_value'] = res?.isMultiple ? newMultipleValues : (Array.isArray(res?.values) ? (res?.values?.length ? [new_obj] : []) : (res?.values ? [new_obj] : []));
        finalUpdatedMDt['old_value'] = res?.isMultiple ? oldMultipleValues : (this.assignmentData?.assignments?.foundational_data?.[res?.slug]?.[0]?.id ? [old_value] : []);
        mdtChangeObj?.push(finalUpdatedMDt);
      }
    })
    let requestBody: any = {
      page: 1,
      per_page: 15,
      hierarchy_id: currentValues?.hierarchy_id[0],
      effective_start_date: updatedDate ? updatedDate : this.convertDateFormat(this.assignmentCreateForm.get('effective_date')?.value),
      new_start_date: this.convertDateFormat(currentValues?.start_date),
      old_start_date: assignment?.start_date,
      new_end_date: this.convertDateFormat(currentValues?.end_date),
      old_end_date: assignment?.end_date,
      finance_change: { start_date_change: this.isStartDateChange(this.convertDateFormat(currentValues?.start_date), assignment?.start_date), end_date_change: this.isStartDateChange(this.convertDateFormat(currentValues?.end_date), assignment?.end_date),rate_change: false, st_hours: false, days_per_week: false, fee_change: false, tax_change: false,adjustment_fee_change: false , is_rate_type_change : !finance_change},
      non_finance_change: { timesheet_manager: null, custom_field: false, timesheet_type: false, activity_rename: false , is_rate_type_change : !non_finance_change },
      is_non_finance_change: 0,
      is_timesheet_type_change:timesheet_type?.value === currentValues?.timesheet_type ? 0 : 1,
      is_finance_change: 0,
      is_location_change: 0,
      location_change: {
        work_location: null,
        location_type: null
      },
      location: {
        new: null,
        old: null
      },
      is_mdt_change: mdtChangeObj?.length ? true : false,
      mdt_change: mdtChangeObj
    };
    this.assignmentValueFor['mdt_change'] = mdtChangeObj;
    let url = `/timesheet/programs/${this.programId}/assignment/${this.assignmentId}/impacted`;
    // const taxArray = this.taxArray?.value;
    const taxArray = this.taxArray?.getRawValue();
    const feesArray = this.feeArray?.getRawValue();
    const adjustedFees = this.TaxAdjustmentFees.getRawValue();
    const feesList = assignment?.tax?.filter(t => t.entity_type === 'fee') || [];
    const taxList = assignment?.tax?.filter(t => t.entity_type === 'tax') || [];
    const adjustedFeesArray =  assignment?.tax?.filter(t => t.entity_type === 'adjustment_fee') || [];
    const is_fees_changed: boolean = this.checkIfTaxChanged(feesList, feesArray );
    if (is_fees_changed) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.fee_change = true;
    }
    const is_tax_changed: boolean = this.checkIfTaxChanged(taxList, taxArray);
    if (is_tax_changed) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.tax_change = true;
    }
    const is_adjustment_fee_changed: boolean = adjustedFees?.length> 0 &&adjustedFeesArray?.length > 0 && this.checkIfTaxChanged(adjustedFees, adjustedFeesArray);
    if (is_adjustment_fee_changed && this.programDetails?.config?.is_adjustment_fee_allowed ) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.adjustment_fee_change = true;
    }
    const new_end_date = this.convertDateFormat(currentValues?.end_date);
    if (end_date && end_date !== new_end_date) {
      requestBody.new_end_date = new_end_date;
      requestBody.is_finance_change = 1;
    } 
    const new_start_date = this.convertDateFormat(currentValues?.start_date);
    if (start_date && start_date !== new_start_date) {
      requestBody.is_finance_change = 1;
    } 
    //  if (parseFloat(net_allocated_budget) != parseFloat(currentValues?.net_allocated_budget)) {//add
    //   requestBody.is_finance_change = 1;  // removed for  V2M-5984
    // } 
     if (parseFloat(finance?.st_hours) !== parseFloat(currentValues?.st_hours)) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change['st_hours'] = true;
    } 
     if (parseFloat(finance?.days_per_week) !== parseFloat(currentValues?.days_per_week)) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change['days_per_week'] = true;
    }
    if (parseFloat(old_billrate) !== parseFloat(new_billrate) ) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.rate_change = true;
    }

    if (timesheet_type?.value !== currentValues?.timesheet_type) {
      requestBody.non_finance_change.timesheet_type = true;
      requestBody.is_non_finance_change = 1;
      requestBody.timesheet_type = {
        old: timesheet_type?.value,
        new: currentValues?.timesheet_type
      }
    }

    // pending integration
    // requestBody.non_finance_change.custom_field = this.customFieldsListKey.some(e => {
    //   let oldValue = this.getFormControl(e)?.value;
    //   oldValue = oldValue ? oldValue : '';
    //   const newValue = this.updateValue?.custom ? this.updateValue?.custom[e] : '';
    //   let modified = false;
    //   // console.log('customFieldsListKeyType',e, this.customFieldsListKeyType.get(e), oldValue, newValue);
    //   modified = (oldValue || '') !== (newValue || '');
    //   return modified;
    // });

    if (requestBody.non_finance_change.custom_field) {
      requestBody.is_non_finance_change = 1;
    } 
     if(project && project?.length > 0) {
      requestBody.non_finance_change.activity_rename = true;
      requestBody.is_non_finance_change = 1;
      requestBody.project = project;
      requestBody.is_project_change = true;
     }
    const old_timesheet_manage = timesheet_manager;
    let hasValue = true;
    old_timesheet_manage?.forEach(res => {
      hasValue = hasValue &&  currentValues?.timesheet_manager?.some(cur => cur === res?.id); 
    })
    requestBody.is_non_finance_change = hasValue && (old_timesheet_manage?.length === currentValues?.timesheet_manager?.length) ? 0 : 1;
    requestBody.non_finance_change.timesheet_manager = (hasValue && (old_timesheet_manage?.length === currentValues?.timesheet_manager?.length)) ? null : currentValues?.timesheet_manager;
    // requestBody.is_manager_change = Boolean(requestBody?.is_non_finance_change) && this.assignmentValueFor['programConfig']?.multiple_approval_timesheet_expense  ? true : false;
    requestBody.is_manager_change = !hasValue ? true : false;
    if (assignment?.work_location?.id != currentValues?.work_location) {
      requestBody.is_location_change = 1;
      requestBody.location_change.work_location = currentValues?.work_location;
      requestBody.location.old= assignment?.work_location?.id;
      requestBody.location.new= currentValues?.work_location;
    }
    this.isFinancialChange = requestBody?.is_timesheet_type_change && requestBody?.is_location_change ? true : false ;
    requestBody.is_finance_change = Number(requestBody.is_finance_change || !finance_change);
    requestBody.is_non_finance_change = Number(requestBody.is_non_finance_change || !non_finance_change);

    // url+=`&is_finance_change=${is_finance_change}&is_non_finance_change=${is_non_finance_change}`;
    this._formRendererService.post(url, requestBody).subscribe({next:(data: any) => {
        let timesheetDataObj = this.dataSourceUrl?.find(data => data?.slug?.toLowerCase() === 'timesheet_location_popup');
        timesheetDataObj.is_work_week_change = data?.data?.is_work_week_change || {};
        timesheetDataObj.is_archive = data?.data?.is_archive|| {};
        // this.allDisableField['work_location_impact'] = timesheetDataObj.is_work_week_change ? timesheetDataObj.is_work_week_change?.is_work_week_change : false;
        this.allDisableField['disableSaveButton'] = timesheetDataObj.is_work_week_change ? timesheetDataObj.is_work_week_change?.is_work_week_change : false;
        let impactedTimesheets = undefined;
        let showTable = undefined;
        if (data?.data?.timesheet?.length > 0) {
          impactedTimesheets = data?.data?.timesheet;
          this.assignmentCreateForm.addControl('impacted_timesheet_data', this.fb.control(impactedTimesheets));
          showTable = true;
        } else {
          showTable = false;
        }
        this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets, showTable , is_work_week_change : timesheetDataObj?.is_work_week_change , isFinancialChange : this.isFinancialChange , mdtChange : this.assignmentValueFor['mdt_change']}));
        this.loader.hide();
      }, error: (err) => {
        let impactedTimesheets = undefined;
        let showTable = false;
        this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets, showTable }));
        if (err?.error?.error?.errors[0]?.message) {
          if (err?.error?.error?.code !== 400) {
            this.alert.error(err?.error?.error?.errors[0]?.message, { type: { INTERVAL_TIME: 5000 } });
          }
        } else {
          this.alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } });
        }
        this.loader.hide();
      }});
  }
  isActivityNamesChanged() {
    const currentValues = this.assignmentCreateForm.getRawValue();
    const { finance } = this.assignmentData?.assignments;
    const {  rate } = finance;
    let count = 0;
    let current_activities =  currentValues?.activity?.splice(0,rate?.length );
    rate?.forEach((activity) => {
      let unique_activity = current_activities?.find(f=>f?.entity_id === activity?.entity_id );
       if(unique_activity  && unique_activity?.entity_name?.toLowerCase() !== activity?.entity_name?.toLowerCase()) {
          count++;
       }
      });
    return  Boolean(count)

  }

  isStartDateChange(new_start_date, old_start_date) {
    return new_start_date != old_start_date;
  }
  getJobTemplateDetails() {
    if (this.jobTemplateId) {
      this.search('assignment_title_uuid', null).then(() => {
        this.assignmentService.getJobTemplateDetails(this.programId, this.jobTemplateId).subscribe((data: any) => {
          if (data && data?.job_template) {
            const hasValue = (this.dropDownOptions?.assignment_title_uuid || []).some(opt => opt?.id === this.jobTemplateId);
            if (!hasValue) {
              const opt = this.dropDownOptions?.assignment_title_uuid || [];
              opt.push(data?.job_template);
              this.dropDownOptions = { ...this.dropDownOptions, assignment_title_uuid: opt };
            }
            this.assignmentCreateForm.patchValue({
              assignment_title_uuid: this.jobTemplateId
            });
            this.search('job_id', null);
          }
        });
      })
    }
  }

  continue() {
    this.activeTab = this.activeTab === 'candidate-info' ? 'assignment-info' : 'finance-info';
    if (this.activeTab === 'finance-info') {
      this.getCostComponentGroupId();
    }
    window.scrollTo(0, 0);
  }

  getCandidateSourceType() {
    if(!this.assignmentId && this.selectedVendor?.vendor?.id && this.assignmentCreateForm.get('hierarchy_id').value?.length && this.assignmentCreateForm.get('work_location').value && this.dropDownOptions['labor_category']) {
      if(this.assignmentControl?.rate_model?.value === 'markup' ||  this.assignmentControl?.rate_model?.value === 'payrate') {
        this.assignmentCreateForm.controls['candidate_sourcing_type'].setValidators([Validators.required]);
        let url = `/configurator/programs/${this.programId}/vendors/${this.selectedVendor?.vendor?.id}/markups?industry_id=${this.dropDownOptions['labor_category']}&hierarchy_id=${this.assignmentCreateForm.get('hierarchy_id').value[0]}&work_location_id=${this.assignmentCreateForm.get('work_location').value}`;
        this._formRendererService.get(url).subscribe(res => {
          if (res) {
            const { markup_config } = res;
            this.markupConfigObj = markup_config;
            if (markup_config) {
              if (Object.keys(this.markupConfigObj?.markups)?.length > 0){
                let selectedSourceType = '';
                if ((this.markupConfigObj?.markups?.sourced_markup >= 0 && this.markupConfigObj?.markups?.sourced_markup != null) && (this.markupConfigObj?.markups?.payrolled_markup >=0
                  && this.markupConfigObj?.markups?.payrolled_markup != null)){
                    selectedSourceType = CANDIDATE_SOURCE_TYPE.PAYROLLED;
                  } else if (this.markupConfigObj?.markups?.sourced_markup >= 0 && this.markupConfigObj?.markups?.sourced_markup != null) {
                    selectedSourceType = CANDIDATE_SOURCE_TYPE.SOURCED;
                  } else if (this.markupConfigObj?.markups?.payrolled_markup >= 0 && this.markupConfigObj?.markups?.payrolled_markup != null) {
                    selectedSourceType = CANDIDATE_SOURCE_TYPE.PAYROLLED;
                  }
                  this.assignmentCreateForm.get('candidate_sourcing_type').setValue(selectedSourceType);
                  this.setVendorMarkup();
                }
          }
        }})
      } else {
        this.assignmentCreateForm.get('candidate_sourcing_type').clearValidators();
      }
      this.assignmentCreateForm.get('candidate_sourcing_type').updateValueAndValidity();
    }
  }
  
  get isSourcedValid() {
    if(!this.markupConfigObj)
      return false;
    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj?.length) {
      if(this.markupConfigObj[0]?.markups === null || this.markupConfigObj[0]?.markups === undefined)
        return false;
      const { sourced_markup } = this.markupConfigObj[0]?.markups;
      return Boolean(sourced_markup || sourced_markup === 0);
    }
    if(this.markupConfigObj?.markups === null || this.markupConfigObj?.markups === undefined)
      return false;
    const { sourced_markup } = this.markupConfigObj?.markups;
    return Boolean(sourced_markup || sourced_markup === 0);
  }

  get isPayRolledValid() {
    if(!this.markupConfigObj)
      return false;
    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj?.length) {
      if(this.markupConfigObj[0]?.markups === null || this.markupConfigObj[0]?.markups === undefined)
        return false;
      const { payrolled_markup } = this.markupConfigObj[0]?.markups;
      return Boolean(payrolled_markup || payrolled_markup === 0);
    }
    if(this.markupConfigObj?.markups === null || this.markupConfigObj?.markups === undefined)
      return false;
    const { payrolled_markup } = this.markupConfigObj?.markups;
    return Boolean(payrolled_markup || payrolled_markup === 0);
  }

  setSourcingType(value) {
    this.assignmentCreateForm.get('candidate_sourcing_type').setValue(value);
    this.setVendorMarkup();
    this.onMarkupChange();
  }

  previous() {
    this.activeTab = this.activeTab === 'finance-info' ? 'assignment-info' : 'candidate-info';
    if (this.activeTab !== 'finance-info') {
      this.warning = null;
    }
  }
  getCandidates(term): any {
    this.candidateLoading = true;
    const formValue = this.assignmentCreateForm.getRawValue();
    let {job_type} = formValue;
    if (this.searchCandidateSubscription) {
      this.searchCandidateSubscription.unsubscribe();
    }
    let url = `${this.baseURL}/candidates?is_worker_included=${this.isWorkerIncluded}&k=${term?.term}&program_id=${this.programId}`;
    if(this.isVendor){
      url = `${this.baseURL}/candidates?vendor_id=${this.orgId  || this.user?.organization_id}&is_worker_included=${this.isWorkerIncluded}&k=${term?.term}&program_id=${this.programId}`;
    }else if(this.sow_id && this.vendor_id){
      url = `${this.baseURL}/candidates?vendor_id=${this.vendor_id}&is_worker_included=${this.isWorkerIncluded}&k=${term?.term}&program_id=${this.programId}`;
    }
    url += `&order_by=asc&order_key=first_name&dsaas_excluded=true`;
    if(job_type?.length && Array.isArray(job_type)) {
      let job_types = this.dropDownOptions?.job_type?.filter(value => job_type?.includes(value?.value)).map(type=>type?.id)
      url += `&job_type=${job_types?.join(',')}`
    }
    this.searchCandidateSubscription = this._formRendererService.get(url).subscribe((res :any) => {
      const { candidates } = res;
      this.candidateLoading = false;
      if (candidates) {
        this.dropDownOptions['candidate_uuid'] = candidates;
      }
    });
  }

  isShowModule(moduleName) {
    if (moduleName === 'expense') {
      if (this.assignmentId) {
        return this.assignmentData?.assignments?.finance?.is_expense_allowed_display ? true : false;
      } else {
        return (this.selectedTemplate?.hasOwnProperty('is_expense_allowed_display') && this.selectedTemplate?.is_expense_allowed_display) || (this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount tracking' || this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount_track') ? true : false;
      }
    }
  }

  disableToggle(field) {
    if(field === 'is_expense_enabled') {
      return this.assignmentId ? (this.isShowModule('expense') && this.assignmentData?.assignments?.finance?.is_expense_allowed_editable && !this.disabledModule.includes(field) ? false : true) : (this.isShowModule('expense') && this.selectedTemplate?.is_expense_allowed_editable && !this.disabledModule.includes(field) ? false : true);
    }
    return this.disabledModule.includes(field);
  }

  keepDisabledValue(sourcing_model) {
    this.disabledModule = new Array();
    if (!this.isExpenseManagerEnabled) {
      this.disabledModule.push('is_expense_enabled');
      if (this.assignmentCreateForm.get('is_expense_enabled').value) {
        this.toggleChanged('is_expense_enabled');
      }
    }
    if (sourcing_model?.toLowerCase() == 'headcount tracking' || sourcing_model?.toLowerCase() == 'headcount_track') {
      // for headcount tracking timehseet, expense and billable toggle should be off and user can not toggle it on.
      this.showWelcomeEmail = false;
      if (this.assignmentCreateForm.get('is_timesheet_enabled').value) {
        this.toggleChanged('is_timesheet_enabled');
      }

      if (this.assignmentCreateForm.get('is_expense_enabled').value) {
        this.toggleChanged('is_expense_enabled');
      }

      if (this.assignmentCreateForm.get('is_billable').value) {
        this.toggleChanged('is_billable');
      }
      this.disabledModule.push('is_timesheet_enabled', 'is_expense_enabled', 'is_billable');
      if (!this.isVendor && !this.assignmentId) {
        if (this.assignmentActiveUponValues?.some(active_on => active_on?.value === AssignmentActiveUpon.Onboarding_BackgroundCheck_approval)) {
          this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Onboarding_BackgroundCheck_approval);
        }

      }

    } else if (sourcing_model?.toLowerCase() == 'direct hire' || sourcing_model?.toLowerCase() == 'direct_hire') {
      // for direct hire timehseet wil be off and disabled. expense and billable will be toggle off but user can toggle it on.
      this.showWelcomeEmail = false;
      if (!this.assignmentCreateForm.get('is_billable')?.value) {
        this.toggleChanged('is_billable');
      }

      if (this.assignmentCreateForm.get('is_timesheet_enabled').value) {
        this.toggleChanged('is_timesheet_enabled');
      }
      this.disabledModule.push('is_timesheet_enabled');

      if (this.assignmentCreateForm.get('is_expense_enabled').value) {
        this.toggleChanged('is_expense_enabled');
      }

      if (!this.isVendor && !this.assignmentId){
        if (this.assignmentActiveUponValues?.some(active_on => active_on?.value === AssignmentActiveUpon.Create_SaveAssignment)) {
          this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Create_SaveAssignment);
        }
      }
    } else {
      // for other sourcing model all toggles will be on

      if (sourcing_model?.toLowerCase() == 'contingent') {
        this.showWelcomeEmail = true;
        if (!this.isVendor && this.assignmentActiveUponValues?.some(active_on => active_on?.value === AssignmentActiveUpon.Create_SaveAssignment)) {
          this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Create_SaveAssignment);
        }
      } else if (sourcing_model?.toLowerCase() == 'sow') {
        this.showWelcomeEmail = true;
        if (!this.isVendor && this.assignmentActiveUponValues?.some(active_on => active_on?.value === AssignmentActiveUpon.Onboarding_BackgroundCheck)) {
          this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Onboarding_BackgroundCheck);
        }
      }


      if (!this.assignmentId) {
        if (!this.assignmentCreateForm.get('is_timesheet_enabled').value) {
          this.toggleChanged('is_timesheet_enabled');
        }

        if (!this.assignmentCreateForm.get('is_billable')?.value) {
          this.toggleChanged('is_billable');
        }

        if (!this.assignmentCreateForm.get('is_expense_enabled')?.value && this.isExpenseManagerEnabled) {
          this.toggleChanged('is_expense_enabled');
        }
      }
    }
    // for update assignment all toggles will be disabled. it will be same as at the time of creation 
    //'is_expense_enabled',
    if (this.assignmentId) {
      this.disabledModule.push('is_timesheet_enabled', 'is_billable');
    }
  }


  toggleChanged(field) {
    const fieldObj = !this.assignmentCreateForm.get(field)?.value;
    this.assignmentCreateForm.get(field).setValue(fieldObj);
    if (field === 'is_expense_enabled') {
      this.assignmentCreateForm.get('expense_manager').reset();
      if (!fieldObj) {
        this.assignmentCreateForm.get('expense_manager').clearValidators();
      } else {
        this.assignmentCreateForm.get('expense_manager').setValidators([Validators.required]);
        this.setExpenseManagerToDefault();
      }
      this.assignmentCreateForm.get('expense_manager').updateValueAndValidity();
      this.resetEffectiveDate();
    }

    if (field === 'is_timesheet_enabled') {
      this.assignmentCreateForm.get('timesheet_manager').reset();
      this.assignmentCreateForm.get('timesheet_type').reset();
      this.assignmentCreateForm.get('st_hours').reset();
      this.assignmentCreateForm.get('days_per_week').reset();
      this.assignmentCreateForm.get('st_hours').setValue(0);
      this.assignmentCreateForm.get('days_per_week').setValue(null);
      if (!fieldObj) {
        this.assignmentCreateForm.get('timesheet_manager').clearValidators();
        this.assignmentCreateForm.get('timesheet_type').clearValidators();
        this.assignmentCreateForm.get('st_hours').clearValidators();
        this.assignmentCreateForm.get('days_per_week').clearValidators();
        this.resetBillableToggleValues();
      } else {
        this.assignmentCreateForm.get('timesheet_manager').setValidators([Validators.required]);
        this.assignmentCreateForm.get('timesheet_type').setValidators([Validators.required]);
        this.assignmentCreateForm.get('st_hours').setValidators([Validators.required]);
        this.assignmentCreateForm.get('days_per_week').setValidators([Validators.required]);
        this.setTimesheetToDefault();
      }

      this.assignmentCreateForm.get('timesheet_manager').updateValueAndValidity();
      this.assignmentCreateForm.get('timesheet_type').updateValueAndValidity();
      this.assignmentCreateForm.get('st_hours').updateValueAndValidity();
      this.assignmentCreateForm.get('days_per_week').updateValueAndValidity();
    }
    if (field === 'is_billable') {
      this.assignmentCreateForm.get('rate_model').reset();
      this.assignmentCreateForm.get('rate_type').reset();
      // this.assignmentCreateForm.get('currency').reset();
      this.assignmentCreateForm.get('adjusted_markup')?.setValue(this.accuracyPipe.transform(0, this.accuracyConfig?.markup_percentage , {isEdit : true}));
      this.assignmentCreateForm.get('vendor_markup')?.setValue(this.accuracyPipe.transform(0, this.accuracyConfig?.markup_percentage , {isEdit : true}));
      if (!fieldObj) {
        this.resetBillableValues();
        this.resetBillableToggleValues();
      }

      if (!fieldObj) {
        this.assignmentCreateForm.get('rate_model').clearValidators();
        this.assignmentCreateForm.get('rate_type').clearValidators();
        this.assignmentCreateForm.get('currency').clearValidators();
      } else {
        this.assignmentCreateForm.get('rate_model').setValidators([Validators.required]);
        this.assignmentCreateForm.get('rate_type').setValidators([Validators.required]);
        this.assignmentCreateForm.get('currency').setValidators([Validators.required]);
        if (this.dropDownOptions?.rate_type && this.dropDownOptions?.rate_type?.length === 1) {
          this.assignmentCreateForm.patchValue({ rate_type: this.dropDownOptions?.rate_type[0]?.value })
        }
        if (this.dropDownOptions?.currency && this.dropDownOptions.currency?.length === 1) {
          this.assignmentCreateForm.patchValue({ currency: this.dropDownOptions?.currency[0]?.code })
        }
      }
      this.assignmentCreateForm.get('rate_model').updateValueAndValidity();
      this.assignmentCreateForm.get('rate_type').updateValueAndValidity();
      this.assignmentCreateForm.get('currency').updateValueAndValidity();
      this.changeMarkupOption();
    }
    if (!this.assignmentCreateForm.get('is_timesheet_enabled')?.value && !this.assignmentCreateForm.get('is_expense_enabled')?.value) {
      this.showWelcomeEmail = false;
    } else if ((this.assignmentCreateForm.get('is_timesheet_enabled')?.value || this.assignmentCreateForm.get('is_expense_enabled')?.value) && this.assignmentCreateForm.get('sourcing_model')?.value?.toLowerCase() !== 'headcount tracking') {
      this.showWelcomeEmail = true;
    }
  }
  valueChanged(event){ 
    if(event){
    this.resetEffectiveDate();
   }
  }

  getExpenseImpactedList(){
    let orignalExpenseManager = this.assignmentData?.assignments?.finance?.expense_manager?.map(manager=> manager?.id) ;
    if((this.assignmentId && (this.assignmentData?.assignments?.finance?.is_expense_enabled && this.assignmentCreateForm?.get('is_expense_enabled')?.value == false) ||(JSON.stringify(orignalExpenseManager?.sort()) !== JSON.stringify(this.assignmentCreateForm.get('expense_manager')?.value?.sort())) || (this.assignmentData?.assignments?.assignment?.assignment_manager?.id !== this.assignmentCreateForm.get('assignment_manager')?.value) )){
      if((this.assignmentId && (!this.assignmentData?.assignments?.finance?.is_expense_enabled && this.assignmentCreateForm?.get('is_expense_enabled')?.value))){
      this.checkSendEmail(this.assignmentData?.assignments?.worker?.user?.id);
    }
    let expense_manager_id;
    let hasValue = true;
    this.assignmentData?.assignments?.finance?.expense_manager?.forEach(res => {
      hasValue = hasValue && this.assignmentCreateForm.get('expense_manager')?.value?.some(cur => cur === res?.id);
    });
    expense_manager_id = hasValue && (this.assignmentData?.assignments?.finance?.expense_manager?.length ===  this.assignmentCreateForm.get('expense_manager')?.value?.length) ? null : this.assignmentCreateForm.get('expense_manager')?.value;
    let assignment_manager_id;
    if(this.assignmentData?.assignments?.assignment?.assignment_manager?.id === this.assignmentCreateForm.get('assignment_manager')?.value){
      assignment_manager_id = null;
    } else {
      assignment_manager_id = this.assignmentCreateForm.get('assignment_manager')?.value;
    }

    let requestBody:any = {
      hierarchy_id:this.assignmentData?.assignments?.assignment?.hierarchy?.id || this.assignmentCreateForm.get('hierarchy_id')?.value,
      effective_start_date: this.convertDateFormat(this.assignmentCreateForm.get('effective_date')?.value),
      is_finance_change: false,
      is_non_finance_change: true,
      is_manager_change: false,
      finance_change: [],
      is_expense_enable: this.assignmentCreateForm.get('is_expense_enabled')?.value,
      non_finance_change: {
        expense_manager: expense_manager_id,
        assignment_manager: assignment_manager_id
      }
    }
    if(expense_manager_id ||assignment_manager_id ) {
      requestBody.is_manager_change = true;
    }
    let url = `/expense/programs/${this.programId}/assignment/${this.assignmentId}/impact`;
    this._formRendererService.post(url, requestBody).subscribe({next:(data: any) => {
     
      let impactedExpenses = undefined;
      let showTable = undefined;
      if (data?.data?.expenses?.length > 0) {
        impactedExpenses = data?.data?.expenses;
        showTable = true;
      } else {
        showTable = false;
      }
      this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_EXPENSES, { impactedExpenses, showTable}));
      this.loader.hide();
    }, error: err => {
      let impactedExpenses = undefined;
      let showTable = false;
      this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_EXPENSES, { impactedExpenses, showTable }));
      if (err?.error?.error?.errors[0]?.message) {
        if (err?.error?.error?.code !== 400) {
          this.alert.error(err?.error?.error?.errors[0]?.message, { type: { INTERVAL_TIME: 5000 } });
        }
      } else {
        this.alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } });
      }
      this.loader.hide();
    }})
   } else{
    return;
   }
  }
  checkSendEmail(userid) {
    if (!userid) return;
   this.userService.sendWelcomeEmailCheck(userid).subscribe(res => {
      let data: any = res;
      this.isRegistered = data?.user?.is_activated;
    });
  }

   resetBillableToggleValues() {
    if(this.dropDownOptions['billing_details']) {
      this.dropDownOptions['billing_details'].total_working_days = 0;
      this.dropDownOptions['billing_details'].initial_budget = 0;
      this.dropDownOptions['billing_details'].gross_budget = 0;
      this.dropDownOptions['billing_details'].estimate_tax = 0;
      this.dropDownOptions['billing_details'].net_budget = 0;
      this.assignmentCreateForm.patchValue({
        timesheet_budget: this.accuracyPipe?.transform(0, this.accuracyConfig.amount, { isEdit: true }),
        gross_allocated_budget: this.accuracyPipe?.transform(0, this.accuracyConfig.amount, { isEdit: true }),
        estimated_tax: this.accuracyPipe?.transform(0, this.accuracyConfig.tax, { isEdit: true }),
        net_allocated_budget: this.accuracyPipe?.transform(0, this.accuracyConfig.amount, { isEdit: true }),
        net_budget: this.accuracyPipe?.transform(0, this.accuracyConfig.amount, { isEdit: true }),
        estimated_adjustment: this.accuracyPipe?.transform(0, this.accuracyConfig.amount, { isEdit: true }),
        total_working_days: 0
      });
      }
   }

  setTimesheetToDefault = () => {
    this.assignmentCreateForm.patchValue({
      st_hours: this.accuracyPipe?.transform(8, this.accuracyConfig.hour)
    });

    if (this.dropDownOptions?.days_per_week && this.dropDownOptions?.days_per_week?.length === 1) {
      this.assignmentCreateForm.patchValue({ days_per_week: this.dropDownOptions?.days_per_week[0]?.value })
    }
    if (this.dropDownOptions?.timesheet_type && this.dropDownOptions.timesheet_type?.length === 1) {
      this.assignmentCreateForm.patchValue({ timesheet_type: this.dropDownOptions?.timesheet_type[0]?.value })
    }
  }

  setExpenseManagerToDefault = () => {
    this.dropDownOptions['timesheet_manager'] = this.dropDownOptions['assignment_manager']
    this.dropDownOptions['expense_manager'] = this.dropDownOptions['assignment_manager']
    this.dropDownOptions = { ...this.dropDownOptions };
    const assignmentManager = this.assignmentCreateForm.get('assignment_manager').value;
    if(assignmentManager) {
      this.assignmentCreateForm.patchValue({
        timesheet_manager: [assignmentManager],
        expense_manager: [assignmentManager]
      });
    }

  }
  resetBillableValues() {
    if (this.is_activity_based) {
      this.resetActivityValue();
    } else {
      this.resetRateArray();
    }
    this.resetTaxValue();
    this.resetFeesValue();
    this.recalcualatebudget();
    this.resetTaxDetailsValue();
  }

  resetActivityValue() {
    this.activityArray.clear();
    this.addActivity();
  }

  resetRateArray() {
    const arrayValues = this.ratesArray?.value;
    arrayValues?.forEach((rate, i) => {
      this.ratesArray?.at(i).patchValue({
        billrate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}),
        payrate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}),
        vendor_rate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true})
      });
    });
    this.assignmentCreateForm.get('rate').updateValueAndValidity();
    this.assignmentCreateForm.patchValue({ billrate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}), vendor_rate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}), payrate: this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}) });
  }

  resetTaxValue() {
    const taxValues = this.taxArray.value;
    taxValues?.forEach((tax, i) => {
      this.taxArray.at(i).patchValue({
        amount_value: this.accuracyPipe.transform(0 , this.accuracyConfig?.tax , {isEdit : true})
      });
    });
  }

  resetTaxDetailsValue() {
    this.assignmentCreateForm.get('tax').reset()
  }

  resetFeesValue() {
    const feesValues = this.feeArray.value;
    feesValues?.forEach((fee, i) => {
      this.taxArray?.at(i)?.patchValue({
        amount_value: this.accuracyPipe.transform(0 , this.accuracyConfig?.tax , {isEdit : true})
      });
    });
  }

  onClickHirerachy() {
    if (this.assignmentId) {
      return;
    }
    if (this.assignmentCreateForm.get('hierarchy_id').value !== null) {
      this.selectedHierarchy = this.assignmentCreateForm.get('hierarchy_id').value;
    }
    this.isAddHirerachy = 'visible';
  }

  sidebarClose(isContinue = false) {
    this.isAddHirerachy = 'hidden';
    if(this.isCreateFromSOW){
      this.isCreateFromSOW = false ;//marking it as false so that it only runs for the first time
      return;
    }
    if (isContinue) {
      this.getCandidateSourceType();
      if (this.is_Sourcing_Model_SOW) {
        this.sow_id = undefined;
        this.sow_project_id = undefined;
        this.assignmentCreateForm.controls.sow_id.reset();
        this.assignmentCreateForm.controls.sow_project_id.reset();
        this.getFees();
        this.loadTaxFields();
        this.sourcingModelChanged();
      }
    }
  }

  onBtnClickEvent() {
    this.isCreateCandidate = 'visible';
  }

  candidateSidebarClose(data) {
    if (data) {
      this.setWorkerDetails(data);
    }
    this.isCreateCandidate = 'hidden';
  }

  selectHierarchy(event, resetHierarchy = true) {
    if(event){
      if(event?.id){
        event=[event?.id];
      }
     if (event?.length > 0) {
      const callHierarchyData = this.getHirerachyById(this.dropDownOptions['hierarchy_id'], event[0]);
      if (callHierarchyData?.id === event[0]) {
        this.assignmentCreateForm.get('hierarchy_name').setValue(callHierarchyData?.name);
        this.selectedHierachyObj = callHierarchyData;
      } else {
        this._formRendererService.setHierarchyName('');
        this.selectedHierachyObj = null;
        
      }
    } else {
      this._formRendererService.setHierarchyName(null);
      this.assignmentCreateForm.get('hierarchy_name').setValue(null);
    }
    this.changeMarkupOption();
    this.assignmentCreateForm.get('hierarchy_id').setValue(event);
    this.getTimesheetTypeDetails();
    this.getRateFactor();
    this.resetEffectiveDate();
    this.getFees();
    this.loadTaxFields();
    if (resetHierarchy) {
      this.resetWorkLocation();
    }
    // this.search('work_location', null);
    this.getAllWorkLocation();
    if(!this.assignmentId) {
      if(this.display_title_from == JOB_STATUS.JOB_TEMPLATE) {
        this.assignmentCreateForm.patchValue({'assignment_title_uuid': null})
      }
      if(this.display_title_from == JOB_STATUS.EXISTING_JOB) {
        this.assignmentCreateForm.patchValue({'job_id': null})
      }
      this.search('assignment_title_uuid', null);
      this.search('job_id', null);
      this.markupFieldValiator();
    }
  
    }
    this.sidebarClose(!!event);
  }

  getTimesheetTypeDetails(reset = false ,changeRemoteValue?) {
    const formValue = this.assignmentCreateForm.getRawValue();
    let { work_location, hierarchy_id , timesheet_type , rate_type } = formValue;
    if (hierarchy_id) {
      let url = `/timesheet/programs/${this.programId}/config/basic?hierarchy=${hierarchy_id[0]}&status=active&is_pagination_included=false`;
      if (this.assignmentCreateForm.get('remote_worker').value) {
        this.getAllCountry().then(() => {
        let group = this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup;
        let country_uuid = this.assignmentValueFor['allCountryList']?.filter(res => res?.name === group?.get('country').value)?.map(res => res?.id)?.[0];
        let state_uuid = this.assignmentValueFor['allStatesList']?.filter(res => res?.name === group?.get('state').value)?.map(res => res?.id)?.[0];
        let county_uuid = this.assignmentValueFor['allCountyList']?.filter(res => res?.name === group?.get('county').value)?.map(res => res?.id)?.[0];
        let city_uuid = this.assignmentValueFor['allCitesList']?.filter(res => res?.name === group?.get('city').value)?.map(res => res?.id)?.[0];
         url += `&remote_worker=true&remote_country=${country_uuid}${state_uuid ? `&remote_state=${state_uuid}` : ''}${county_uuid ?  `&remote_county=${county_uuid}` : ''}${city_uuid ? `&remote_city=${city_uuid}` : ''}`;
         this.handleTimesheetResponse(url , timesheet_type , true , changeRemoteValue );
        })
      } else {
        url += `${work_location ? `&location=${work_location}` : ''}${rate_type ? `&rate_type=${rate_type}` : ''}`;
        this.handleTimesheetResponse(url , timesheet_type , reset);
      }
    }
  }

  handleTimesheetResponse(url , timesheet_type , reset , changeRemoteValue?) {
    this._formRendererService.get(url).subscribe((data: any) => {
      if (data && data?.data?.config) {
        if(!this.assignmentId || changeRemoteValue){
          this.assignmentCreateForm.patchValue({
            ['timesheet_type']: null
          }); 
        }
        this.dropDownOptions['timesheet_type'] = [...data?.data?.config || []];
         this.checkIfTimeheetTypeExists(reset);
         this.dropDownOptions['timesheet_type'] = [...new Map(this.dropDownOptions['timesheet_type']?.map(item => [item['value'], item]))?.values()]
         if(reset && data?.data?.config?.length === 1) {
          this.assignmentCreateForm.patchValue({
            ['timesheet_type']: this.dropDownOptions['timesheet_type'][0]['value']
          });  
        } else  if(this.assignmentId && this.dropDownOptions['timesheet_type']?.some(location=>location?.value === timesheet_type)  && reset) {
          this.assignmentCreateForm.patchValue({
            ['timesheet_type']: timesheet_type
          });  
        }
        let default_type = this.dropDownOptions['timesheet_type']?.find(timesheetType=> timesheetType?.make_default);
         if(default_type && default_type.hasOwnProperty('value') && !this.assignmentId) {
           this.assignmentCreateForm.patchValue({
            ['timesheet_type']: default_type?.value
          });
         }
        // if (data?.data?.config?.length === 1 && !this.assignmentId) {
        //   this.assignmentCreateForm.patchValue({
        //     ['timesheet_type']: this.dropDownOptions['timesheet_type'][0]['value']
        //   });
        // }


        this.checkForActivityOnTimesheetType();
        this.getUpdatedTimsheetCofigDetails();
      } else {
        if(this.assignmentId && this.assignmentData?.assignments?.finance?.timesheet_type && this.assignmentData?.assignments?.finance?.timesheet_type?.hasOwnProperty('value')) {
          this.assignmentData.assignments.finance.timesheet_type.label = this.assignmentData?.assignments?.finance?.timesheet_type?.name
          this.dropDownOptions['timesheet_type'] = [this.assignmentData?.assignments?.finance?.timesheet_type]
          if (this.dropDownOptions['timesheet_type']?.length === 1) {
            this.assignmentCreateForm.patchValue({
              ['timesheet_type']: this.dropDownOptions['timesheet_type'][0]['value']
            });
        }
      }

        this.checkForActivityOnTimesheetType();

      }
    })

  } 
  checkIfTimeheetTypeExists(reset = false) {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { timesheet_type } = formValue;
    if (this.assignmentId && this.dropDownOptions['timesheet_type']?.some(location => location?.value !== timesheet_type) && this.assignmentData?.assignments?.finance?.timesheet_type && this.assignmentData?.assignments?.finance?.timesheet_type?.hasOwnProperty('value') && !reset) {
      this.assignmentData.assignments.finance.timesheet_type.label = this.assignmentData?.assignments?.finance?.timesheet_type?.name
      this.dropDownOptions['timesheet_type'] = [...[this.assignmentData?.assignments?.finance?.timesheet_type] , ...this.dropDownOptions['timesheet_type']];
      if (this.dropDownOptions['timesheet_type']?.length === 1) {
        this.assignmentCreateForm.patchValue({
          ['timesheet_type']: this.dropDownOptions['timesheet_type'][0]['value']
        });
      }
    }
  }

  setTimesheetTypeBasedOnWorkLocation(work_location , reset = false) {
    let workLocation:any =  {};
    if(!work_location?.hasOwnProperty('state_name')) {
      workLocation = this.dropDownOptions['work_location']?.find(location=> location?.id === work_location);
    } else {
      workLocation = work_location;
    }
    if (work_location) {
      this.getTimesheetTypeDetails( reset);
      if(reset) {
        this.assignmentCreateForm.get('timesheet_type').setValue(null);
      }

      if (this.programDetails?.config?.timesheet?.default_timesheet_type_from_worklocation) {
        let timeshet_type;
        if ((workLocation?.state?.name)?.toLowerCase() == 'california') {
          timeshet_type = this.dropDownOptions['timesheet_type']?.find(element => element?.value == 'cico')?.value ?? null;
        } else {
          timeshet_type = this.dropDownOptions['timesheet_type']?.find(element => element?.value == 'hours')?.value ?? null;
        }
        if (timeshet_type && timeshet_type != undefined && timeshet_type != null) {
          this.assignmentCreateForm.patchValue({
            ['timesheet_type']: timeshet_type
          })
        }
      }
    }
    this.checkForActivityOnTimesheetType();
  }

  resetWorkLocation = () => {
    if (!(this.allDisableField['work_location'] && this.assignmentCreateForm?.get('work_location')?.value && this.assignmentCreateForm?.get('assignment_manager')?.value)) {
      this.assignmentCreateForm.get('work_location').setValue(null);
    }
    this.dropDownOptions['work_location'] = [];
    this.getTimesheetTypeDetails();
  }

  selectedTemplate: any;
  templateChanged = (e , job?) => {
    this.selectedTemplate = this.dropDownOptions['assignment_title_uuid']
      .find(op => op?.id === e);
    if (this.display_title_from == JOB_STATUS.JOB_TEMPLATE) {
      this.dropDownOptions['labor_category'] = this.selectedTemplate?.labor_category[0]?.id;
    }
    // this condition is addded to overide this 3 keys by existing job creation entity
    if(!this.assignmentId && job && this.display_title_from?.toLowerCase() === 'existing_job') {
      this.selectedTemplate.is_expense_allowed = job?.is_expense_allowed;
      this.selectedTemplate.is_expense_allowed_display = job?.is_expense_allowed_display;
      this.selectedTemplate.is_expense_allowed_editable = job?.is_expense_allowed_editable;
    }
    this.assignmentCreateForm.patchValue({
      ['is_expense_enabled']: this.selectedTemplate?.hasOwnProperty('is_expense_allowed') && this.selectedTemplate?.is_expense_allowed && this.assignmentCreateForm?.get('sourcing_model')?.value?.toLowerCase() !== 'headcount tracking' ? false : true
    });
    this.toggleChanged('is_expense_enabled');
    this.getCandidateSourceType();
    this.setVendorMarkup();
    this.getOnboardingChecklist();
  }

  changeMarkupOption() {
    this.programType = this.selectedHierachyObj?.rate_model ?? this.programDetails?.config?.program_model;
    if (this.programType) {
      this.assignmentCreateForm.get('rate_model').setValue(this.programTypeRateModel[this.programType]);
    }
    if (!this.is_activity_based) {
      if(this.editClientBillRate){
        this.assignmentCreateForm.get('billrate').enable();
      }else{
        this.assignmentCreateForm.get('billrate').disable();
      } 
      
      if(this.editVendorBillRate){
        this.assignmentCreateForm.get('vendor_rate').enable();
      }else{
        this.assignmentCreateForm.get('vendor_rate').disable();
      } 
      
      if(this.editPayrate){
        this.assignmentCreateForm.get('payrate').enable();
      }else{
        this.assignmentCreateForm.get('payrate').disable();
      }
      
      //  this.ratesArray.controls.forEach((element, index) => {
      //   if(this.editClientBillRate){
      //     this.ratesArray.at(index)?.get('billrate').enable();
      //   }else{
      //     this.ratesArray.at(index)?.get('billrate').disable();
      //   } 
        
      //   if(this.editVendorBillRate){
      //     this.ratesArray.at(index)?.get('vendor_rate').enable();
      //   }else{
      //     this.ratesArray.at(index)?.get('vendor_rate').disable();
      //   } 
        
      //   if(this.editPayrate){
      //     this.ratesArray.at(index)?.get('payrate').enable();
      //   }else{
      //     this.ratesArray.at(index)?.get('payrate').disable();
      //   }      
      //   });
    } else {
      let activityArray = this.activityArray?.getRawValue() || [];
      activityArray.forEach((activity, index) => {
        if(this.editClientBillRate){
          ((this.assignmentCreateForm?.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_billrate')?.enable());
        }else{
          ((this.assignmentCreateForm?.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_billrate')?.disable());
        } 
        
        if(this.editVendorBillRate){
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_vendor_rate')?.enable());
        }else{
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_vendor_rate')?.disable());
        } 
        
        if(this.editPayrate){
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_payrate')?.enable());
        }else{
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_payrate')?.disable());
        }
         //  removed for  6638
        // if (activity && activity?.rates?.length > 0) {
        //   activity?.rates?.forEach((rate, rate_index) => {
        //     if(this.editClientBillRate){
        //       ((this.assignmentCreateForm.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index).get('billrate')?.enable();
        //     }else{
        //       ((this.assignmentCreateForm.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index).get('billrate')?.disable();
        //     } 
            
        //     if(this.editVendorBillRate){
        //       ((this.assignmentCreateForm?.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index)?.get('vendor_rate')?.enable();
        //     }else{
        //       ((this.assignmentCreateForm?.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index)?.get('vendor_rate')?.disable();
        //     } 
            
        //     if(this.editPayrate){
        //       ((this.assignmentCreateForm.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index)?.get('payrate')?.enable();
        //     }else{
        //       ((this.assignmentCreateForm.get('activity') as FormArray)
        //         .at(index)?.get('rates') as FormArray)
        //         .at(rate_index)?.get('payrate')?.disable();
        //     }
        //   });
        // }
      });
    }

  /**  if(this.extend && this.extend === UPDATE_FOR.DATE) {
      this.assignmentCreateForm.get('billrate').disable();
      this.assignmentCreateForm.get('vendor_rate').disable();
      this.assignmentCreateForm.get('payrate').disable();
      if(this.ratesArray?.controls && this.ratesArray?.controls?.length) {
        this.ratesArray.controls.forEach((element, index) => {
          this.ratesArray.at(index)?.get('billrate')?.disable();
          this.ratesArray.at(index)?.get('vendor_rate')?.disable();
          this.ratesArray.at(index)?.get('payrate')?.disable();
      });
      }
    } */
    this.setVendorMarkup();
  }
  OnOtExemptChange() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { ot_exempt_position } = formValue;
    if(ot_exempt_position) {
      if (!this.is_activity_based) {
        if(this.ratesArray?.controls && this.ratesArray?.controls?.length) {
          this.ratesArray.controls.forEach((element, index) => {
            this.ratesArray.at(index)?.get('billrate')?.disable();
            this.ratesArray.at(index)?.get('vendor_rate')?.disable();
            this.ratesArray.at(index)?.get('payrate')?.disable();
        });
      }

      const stMarkup = this.assignmentValueFor['markup'] || this.assignmentCreateForm.get('vendor_markup').value;
      const updateMarkup = (arr) => {
        arr?.forEach(obj => { obj.markup = stMarkup; });
      }
      updateMarkup(this.final_activity_wise_rate_factors_arr[0]);
      updateMarkup(this.activity_wise_rate_factors_arr[0]);
      updateMarkup(this.rate_factors_arr);
    } else {
      let activityArray = this.activityArray?.getRawValue() || [];
      activityArray.forEach((activity, index) => {
        if (activity && activity?.rates?.length > 0) {
          activity?.rates?.forEach((rate, rate_index) => {
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index).get('billrate')?.disable();
              ((this.assignmentCreateForm?.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('vendor_rate')?.disable();
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('payrate')?.disable();
          });
        }
      });
    }
  } 
   //  removed for  6638
  // else {
  //   if (!this.is_activity_based) {
  //     if(this.ratesArray?.controls && this.ratesArray?.controls?.length) {
  //       this.ratesArray.controls.forEach((element, index) => {
  //         this.ratesArray.at(index)?.get('billrate')?.enable();
  //         this.ratesArray.at(index)?.get('vendor_rate')?.enable();
  //         this.ratesArray.at(index)?.get('payrate')?.enable();
  //     });
  //   }
  //   } else {
  //     let activityArray = this.activityArray?.getRawValue() || [];
  //     activityArray.forEach((activity, index) => {
  //       if (activity && activity?.rates?.length > 0) {
  //         activity?.rates?.forEach((rate, rate_index) => {
  //             ((this.assignmentCreateForm.get('activity') as FormArray)
  //               .at(index)?.get('rates') as FormArray)
  //               .at(rate_index).get('billrate')?.enable();
  //             ((this.assignmentCreateForm?.get('activity') as FormArray)
  //               .at(index)?.get('rates') as FormArray)
  //               .at(rate_index)?.get('vendor_rate')?.enable();
  //             ((this.assignmentCreateForm.get('activity') as FormArray)
  //               .at(index)?.get('rates') as FormArray)
  //               .at(rate_index)?.get('payrate')?.enable();
  //         });
  //       }
  //     });
  //   }
  // }
  if(!ot_exempt_position) {
    if(this.assignmentId && Boolean(this.assignmentData?.assignments?.finance?.ot_exempt_position)) {
     let assignmentFactor = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors?.map(res => res?.abbreviation?.toLowerCase());
    // let assignmentFactor = this.assignmentData?.assignments?.finance?.rate_factor[0]?.rate_factors;
     this.rate_factors_arr =  this.duplicatereateLocalRateFactorArrForUpdation(this.assignmentValueFor['configRateFactors']?.filter(res => assignmentFactor?.includes(res?.abbreviation?.toLowerCase())));
    // this.changeMarkupOption();
    }
  }
 

  }

  getHirerachyById(hierarchy, id) {
    for (const datum of hierarchy) {
      if (datum.id == id) return datum;
      if (datum.hierarchies) {
        let result = this.getHirerachyById(datum.hierarchies, id);
        if (result) return result;
      }
    }
  }

  userAssociatedHierarchyID: string[] = [];
  is_update = false;
  //get hierarchy available in this program
  hierarchyList() {
    this.dropDownOptions['hierarchy_id'] = [];
    if (this.dropDownOptions['hierarchy_id']?.length === 0) {
      let url = `/configurator/programs/${this.programId}/hierarchy?active=true`;
      if (this.user_type?.toUpperCase() === UserType.MSP || this.user_type?.toUpperCase() === UserType.Client) {
        url += `&user_id=${this.user?.id}`;
      }
      this._formRendererService.get(url)
        .subscribe(
          data => {
            if (data) {
              let hierarchy_id_data = this.extractHierarchyData(data.result[0].hierarchies);
              this.dropDownOptions['hierarchy_id'] = hierarchy_id_data;
              this.flattenHierarchyArray(hierarchy_id_data);
              if (this.user_type !== UserType.Super_org && this.programDetails?.config?.assignment?.default_to_root_hierarchy) {
                if (
                  !  this.dropDownOptions['hierarchy_id'].filter(h => h.id === this.programDetails?.root_hierarchy?.id)?.length &&
                  Object.keys(this.programDetails?.root_hierarchy)?.length
                ) {
                  this.dropDownOptions['hierarchy_id'] = [
                    {
                      id: this.programDetails?.root_hierarchy?.id,
                      name: this.programDetails?.root_hierarchy?.name,
                      hierarchies: [],
                    },
                  ];
                } else {
                  this.dropDownOptions['hierarchy_id'][0].hierarchies = [];
                }
              }
              // this.dropDownOptions['hierarchy_id'] = data.result[0].hierarchies;
              data.result[0].hierarchies.forEach(h => {
                this.userAssociatedHierarchyID.push(h?.id)
              });
              if (this.assignmentId && this.assignmentCreateForm.get('hierarchy_id')?.value) {
                this.selectHierarchy(this.assignmentCreateForm.get('hierarchy_id')?.value, false)
              } else if(!this.assignmentId && this.programDetails?.config?.assignment?.default_to_root_hierarchy) {
                this.selectHierarchy([this.dropDownOptions['hierarchy_id'][0]?.id]);
              }
            }
          });
    }
  }

  extractHierarchyData(data): void {
    data?.forEach(elem => {
      if (elem?.is_hidden && elem?.hierarchies?.length) {
        this.extractHierarchyData(elem.hierarchies);
      } else {
        if (!this.dropDownOptions['hierarchy_data']) {
          this.dropDownOptions['hierarchy_data'] = new Array()
        }
        this.dropDownOptions['hierarchy_data'].push(elem);
      }
    });
     return this.dropDownOptions['hierarchy_data'];
  }

  getFormula(rateArray) {
    let formula = '';
    rateArray.forEach(obj => {
      formula += `(${this.convertCase(obj?.rate_type)} * ${obj?.factor}) +`;
    });
    formula = formula.slice(0, -1);
    return formula;
  }

  convertCase(str) {
    return `ST ${str.replaceAll('_', ' ')}`
  }

  convertDateFormat(dateString: string,  conversionFormat= DATE_FORMAT?.FORMATYMD, existingDateFormat=this.assignmentService.getDefaultDateFormat()) {
    if (!dateString) {
      return;
    }
    return this.datePipe.transform(dateString, conversionFormat, null, null, true, existingDateFormat);
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

  // getFees() {
  // this._formRendererService.get(`/configurator/programs/${this.programId}/msps/fees`)
  //   .subscribe(res => { })
  // }

  payRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('payrate') && !formControl?.get('billrate')) {
      return null;
    }
    if (Number(formControl?.get('payrate')?.value) > Number(formControl?.get('billrate')?.value)) {
      return { gtr: 'Pay Rate can not be greater than client bill rate' }
    }
    return null;
  }

  activityPayRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('activity_payrate') && !formControl?.get('activity_billrate')) {
      return null;
    }
    if (Number(formControl?.get('activity_payrate')?.value) > Number(formControl?.get('activity_billrate')?.value)) {
      formControl.get('activity_payrate')?.setErrors({ 'gtr': true });
    } else {
      formControl.get('activity_payrate')?.setErrors(null);
    }
    return null;
  }

  workerSourceTypeChanged = (data, resetValue = true) => {
    if (data?.slug === 'migrated_worker_data') {
      this.assignmentCreateForm.get('source_id').setValidators([Validators.required]);
    } else {
      this.assignmentCreateForm.get('source_id').enable();
      this.assignmentCreateForm.get('source_id').clearValidators();
    }
    if (resetValue) {
      this.assignmentCreateForm.get('source_id').setValue('');
    }
    this.assignmentCreateForm.get('source_id').updateValueAndValidity();
  }


  get assignmentControl() {
    return this.assignmentCreateForm.controls;
  }

  selectedCandidate: any;
  candidateSelected(candidateId) {
    const dropdownOpt = this.dropDownOptions?.candidate_uuid;
    this.selectedCandidate = dropdownOpt.find(can => can.id === candidateId);
    if (this.selectedCandidate) {
      if (this.user_type?.toUpperCase() != UserType.Vendor) {
        this.assignmentCreateForm.get('vendor_id').enable();
      }
      if (this.selectedCandidate?.vendor) {
        this.getVendorDetails(this.selectedCandidate?.vendor?.id, true);
      } else
        this.selectedVendor = null;
      this.resetWorkerFields();
      this.setWorkerDetails(candidateId);
    } else {
      this.updateCandidateWorkerDetails();
    }
    this.getCandidateSourceType();
    this.remoteWorkerValueChanged();
  }

  updateCandidateWorkerDetails() {
    this.assignmentCreateForm.get('source_type').reset();
    this.assignmentCreateForm.get('sso_id').reset();
    this.assignmentCreateForm.get('original_start_date').reset();
    this.assignmentCreateForm.get('official_email').reset();
    this.assignmentCreateForm.get('source_id').reset();
    this.assignmentCreateForm.updateValueAndValidity();
    if(!(this.user_type?.toUpperCase() == UserType.Vendor || this.selectedCandidate?.vendor || this.vendor_id)) {
      this.selectedVendor = null;
    }
    this.resetWorkerFields();
  }

  resetWorkerFields() {
    this.assignmentCreateForm.get('official_email').enable();
    this.assignmentCreateForm.get('source_type').enable();
    this.assignmentCreateForm.get('sso_id').enable();
    this.assignmentCreateForm.get('source_id').enable();
    this.allDisableField['original_start_date'] = false;
    this.allDisableField['source_type'] = false;
  }
  
  selectedVendor: any;
  vendorSelected(vendorObj) {
    const dropdownOpt = this.dropDownOptions?.vendor_id;
    this.selectedVendor = dropdownOpt.find(ven => ven?.vendor?.id === vendorObj?.vendor?.id);
    this.getExistingSOW(null);
    this.setVendorMarkup();
  }
  isRegistered = true;
  setWorkerDetails(candidateId: string) {
    this._formRendererService.get(`/assignment/programs/${this.programId}/assignment/candidate/${candidateId}`).subscribe(data => {
      if (data) {
        const candidate = (this.dropDownOptions?.candidate_uuid || []).find(can => can?.id === candidateId);
        if (candidate) {
          this.isRegistered = !!candidate?.is_registered || false;
          if (!this.isRegistered) {
            this.assignmentCreateForm.patchValue({
              is_account_required: true
            });
          }
        }
        let workerDetails = data?.data?.worker
        if (workerDetails) {
          const vendorDropOpt = this.dropDownOptions?.vendor_id || [];
          const hasValueInDropDown = vendorDropOpt?.some(ven => ven?.vendor?.id === this.selectedCandidate?.vendor?.id);
          if (!hasValueInDropDown) {
            vendorDropOpt.push(this.selectedCandidate);
            this.selectedVendor = { ...this.selectedCandidate };
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: [] };
            this.changeDetectorRef.detectChanges();
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: vendorDropOpt };
            this.changeDetectorRef.detectChanges();
          }
          this.assignmentCreateForm.get('vendor_id').setValue(workerDetails?.vendor_id?.id)
          this.assignmentCreateForm.get('original_start_date').setValue(this.datePipe.transform(getDateFromString(workerDetails?.original_start_date), this.dateFormat, undefined, undefined, true))
          this.assignmentCreateForm.get('official_email').setValue(workerDetails?.official_email)
          this.assignmentCreateForm.get('source_type').setValue(workerDetails?.source_type);

          // this.getFormBySlug('vendor_id', true).disable()//WIP-1545:Create Assignment : After Close assignment, candidate needs to show in drop down for create assignment.
          this.allDisableField['original_start_date'] = true;
          this.allDisableField['source_type'] = true;
          // this.assignmentCreateForm.get('official_email').disable()
          // this.assignmentCreateForm.get('source_type').disable()
          this.assignmentCreateForm.get('sso_id').disable()
          this.assignmentCreateForm.get('source_id').disable()
          if (workerDetails?.source_type === 'new_worker') {
            this.assignmentCreateForm.get('sso_id').setValue(workerDetails?.sso_id)
          } else {
            this.assignmentCreateForm.get('source_id').setValue(workerDetails?.source_id)
          }
          this.workerSourceTypeChanged({ slug: workerDetails?.source_type }, false);
        } else {
          this.assignmentCreateForm.get('official_email').setValue(this.selectedCandidate?.email)
        }
      }
      this.assignmentCreateForm.updateValueAndValidity();
    })
  }

  getVendorDetails(vendor_id, showAllVendor) {
    this._formRendererService.get(`/configurator/programs/${this.programId}/vendors/${vendor_id}`)
      .subscribe(res => {

        if (res && res?.program_vendor) {
          let vendorDropOpt = this.dropDownOptions?.vendor_id || [];
          if (!showAllVendor) {
            vendorDropOpt = [];
          }
          vendorDropOpt.push(res?.program_vendor);
          this.selectedVendor = { ...res?.program_vendor };
          this.dropDownOptions = { ...this.dropDownOptions, vendor_id: [] };
          this.changeDetectorRef.detectChanges();
          this.dropDownOptions = { ...this.dropDownOptions, vendor_id: vendorDropOpt };
          this.changeDetectorRef.detectChanges();
        }
        if(!this.assignmentId) {
          this.assignmentCreateForm.get('vendor_id').setValue(vendor_id);
          if(res && res?.program_vendor && res?.program_vendor?.vendor_type?.toLowerCase() === VendorType.DirectSourcing && this.isVendor) {
            this.assignmentCreateForm.get('is_dsaas')?.setValue(true);
          }
          // this.search('job_id',null);
          this.setVendorMarkup();
            this.getExistingSOW(null);
            this.getFees();
        }
      })
  }

  getFoundationalDefaultValuesForSow(sow_id) {
    let { vendor_id } = this.assignmentCreateForm.getRawValue();
    this._formRendererService.get(`/sow/programs/${this.programId}/sow/${sow_id}${vendor_id && this.isVendor ? "?vendor_id=" + vendor_id : ''}`)
      .subscribe({next:(res: any) => {
        // this.selectedFoundationalData = [...res?.foundational_data];
        this.selectedFoundationalData=[];
        this.sow_foundational_data=[];
        res.foundational_data?.forEach(fd => {
          if(fd?.id !== null) {
            this.sow_foundational_data.push({
              foundational_data_type: fd?.foundation_data_type,
              id: fd?.id,
              name: fd?.name,
              code: fd?.foundation_data_type?.code
            })
          }
         });
        let isPresent = this.existingSOW?.some(sow => sow?.id === this.sow_id);
        if (!isPresent && !this.existingSOW?.some(sow => sow?.id === res?.id)) {
          this.existingSOW = [...this.existingSOW, ...[res]];
        }
        if(res && res?.sow_coordinator?.hasOwnProperty('id')) {
          this.assignmentCreateForm?.patchValue({'sow_owner_id':res?.sow_coordinator?.id });
        }
        if(this.assignmentCreateForm?.get('assignment_manager')?.value){          
          this.loadDefaultMemberValue({id: this.assignmentCreateForm?.get('assignment_manager')?.value});
        }
        let foundationalFieldvalues= [];
        if(this.sow_foundational_data?.length > 0){
          this.sow_foundational_data?.forEach(element => {
            foundationalFieldvalues.push(element?.foundational_data_type?.id);
          });
        }
        this.setSelectedFoundationalData([...this.sow_foundational_data],foundationalFieldvalues);
      }, error: (err)=>{
        this.sow_foundational_data= [];
    }})
  }

  get stepOneValid() {
    return this.assignmentCreateForm.get('candidate_uuid').valid &&
      this.assignmentCreateForm.get('vendor_id').valid &&
      this.assignmentCreateForm.get('official_email').valid &&
      this.assignmentCreateForm.get('source_type').valid &&
      this.assignmentCreateForm.get('original_start_date').valid &&
      (this.assignmentCreateForm.get('remote_worker').value ?  (this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup).valid : true) && 
      (
        this.getFormControl('source_type')?.value === 'migrated_worker_data' ?
          !!this.assignmentCreateForm.get('source_id').value : true)
  }

  get stepTwoValid() {
    return this.assignmentCreateForm.get('hierarchy_id').valid &&
      this.assignmentCreateForm.get('sourcing_model').valid &&
      this.getJobStatusValidation && this.getEndDateValidation&&
      this.assignmentCreateForm.get('work_location').valid &&
      this.assignmentCreateForm.get('assignment_manager').valid &&
      this.assignmentCreateForm.get('start_date').valid &&
      this.assignmentCreateForm.get('end_date').valid &&
      this.assignmentCreateForm.get('worker_original_start_date').valid &&
      this.isFoundationalFieldsValid &&
      this.isCustomFieldsValid &&
      this.assignmentCreateForm.get('sow_id').valid &&
      this.assignmentCreateForm.get('sow_project_id').valid && this.assignmentCreateForm.get('account_code').valid &&
      this.assignmentCreateForm.get('onboarding_checklist_id').valid;
    }

  get getJobStatusValidation() { 
    if (this.display_title_from === JOB_STATUS.EXISTING_JOB && this.assignmentCreateForm.get('job_id').value) {
      return true
    } else if (this.display_title_from === JOB_STATUS.JOB_TEMPLATE && this.assignmentCreateForm.get('assignment_title_uuid').value) {
      return true
    } else {
      false
    }
  }
  get getEndDateValidation() { 
    if (this.assignmentCreateForm?.errors?.workerDurationDateErr) {
      return false
    } else {
        return true
    }
  }

  get disableContinue() {
    return (this.activeTab === 'candidate-info' && !this.stepOneValid) ||
      (this.activeTab === 'assignment-info' && !this.stepTwoValid)
  }

  get disableSaveAction() {
    // let action = ['resume', 'rate_estimate', 'work_location', 'resource_budget' ];  || this.allDisableField['work_location_impact'] 
     return this.allDisableField['resume'] || this.allDisableField['rate_estimate']
     
  }

  setJobTemplate(jobId: any) {
    if (!jobId) {
      return
    }
    const jobList = this.dropDownOptions?.job_id || [];
    const job = jobList.find(r => r.id === jobId);
    this.dropDownOptions['labor_category'] = job?.labor_category[0]?.id;
    if (job && job?.template) {
      const url = `/job-manager/programs/${this.programId}/job-templates/${job?.template}`
      this._formRendererService.get(url)
        .subscribe(res => {
          const template = res.job_template;
          if (template) {
            const templateDropdownList = this.dropDownOptions?.assignment_title_uuid || [];
            if (!templateDropdownList.some(temp => temp.id === template.id)) {
              templateDropdownList.push(template);
              this.dropDownOptions.assignment_title_uuid = templateDropdownList;
              this.dropDownOptions = { ...this.dropDownOptions };
              this.assignmentCreateForm.get('assignment_title_uuid').setValue(template?.id);
            } else {
              this.assignmentCreateForm.get('assignment_title_uuid').setValue(template?.id);
            }
            this.templateChanged(template?.id , job);
            this.getDefaultCurrencyValue(true , job?.currency);
          }
        })
    }

  }

  setManager(managerId: any) {
    const managerObj = this.dropDownOptions?.assignment_manager?.find(m => m?.id === managerId);
    if (managerObj) {
      this.loadDefaultMemberValue(managerObj ,true, this.assignmentId ? false : true);
      if (this.assignmentId) {
        return;
      }
      const templateDropdownList = this.dropDownOptions?.timesheet_manager || [];
      if (!templateDropdownList.some(temp => temp?.id === managerObj?.id)) {
        templateDropdownList.push(managerObj);
        this.dropDownOptions.timesheet_manager = templateDropdownList;
        this.dropDownOptions = { ...this.dropDownOptions };
        this.assignmentCreateForm.get('timesheet_manager').setValue([managerObj?.id]);
      } else {
        this.assignmentCreateForm.get('timesheet_manager').setValue([managerObj?.id]);
      }
      const expenseManagerDropdownList = this.dropDownOptions?.expense_manager || [];
      if (!expenseManagerDropdownList.some(temp => temp?.id === managerObj?.id)) {
        expenseManagerDropdownList.push(managerObj);
        this.dropDownOptions.expense_manager = templateDropdownList;
        this.dropDownOptions = { ...this.dropDownOptions };
        this.assignmentCreateForm.get('expense_manager').setValue([managerObj?.id]);
      } else {
        this.assignmentCreateForm.get('expense_manager').setValue([managerObj?.id]);
      }
    }
  }

  setAssignmentManager(user) {
    this.dropDownOptions.assignment_manager = [user];
    this.dropDownOptions.timesheet_manager = [...[user]];
    this.dropDownOptions.expense_manager = [...[user]];
    this.dropDownOptions = { ...this.dropDownOptions };
    this.assignmentCreateForm.patchValue({
      assignment_manager: user?.id,
      timesheet_manager: [user?.id],
      expense_manager: [user?.id]
    });
    if(!this.assignmentId) {
      this.loadDefaultMemberValue(user , true , true);
    }
    this.dropDownOptions?.assignment_manager?.forEach(res => {
      if ( this.delegatedUser?.hasOwnProperty('id') && res?.id !== this.delegatedUser?.['id']) {
        this.dropDownOptions?.assignment_manager?.push(this.delegatedUser);
      }
    });
  }

  isSaveLoader = false;
  getImpactedTimesheetData(event) {
    if (event) {
      this.isPopupVisible = true;
    } else {
      this.isPopupVisible = false;
    }
  }
  validateSOWBudget() {
    let formValue: any = this.assignmentCreateForm.getRawValue();
    const assignment_old_budget = this.assignmentData?.assignments?.finance?.net_allocated_budget
    const assignment_new_budget = formValue?.net_allocated_budget;
    this.budget_difference = undefined;
    if(assignment_old_budget){
      this.budget_difference = (assignment_new_budget - assignment_old_budget);
    } else{
      this.budget_difference = assignment_new_budget
    }
    const { sourcing_model } = formValue;
    if (this.dropDownOptions?.validate_sow_budget) {
      if (sourcing_model?.toLowerCase() == SourcingModel.SOW) {
        if (this.budget_difference) {
          if (this.dropDownOptions?.selectedMilestone?.remaining_budget < this.budget_difference) {
            this.sowBudgetSufficient = 'NO';
          } else {
            this.sowBudgetSufficient = 'YES';
          }
        } else if (this.dropDownOptions?.selectedMilestone?.remaining_budget > this.budget_difference) {
          this.sowBudgetSufficient = 'YES';
        }
      }
    }
  }
  saveAssignment(){
    let formValue: any = this.assignmentCreateForm.getRawValue();
    const { sourcing_model } = formValue;
    if (sourcing_model?.toLowerCase() == SourcingModel.SOW) {
      if (this.dropDownOptions?.validate_sow_budget) {
        if (this.budget_difference) {
          if (this.dropDownOptions?.selectedMilestone?.remaining_budget < this.budget_difference) {
            this.sowBudgetSufficient = 'NO';
            this.confirmService.confirm('', `The estimated budget of the assignment exceeds the remaining milestone budget. Please adjust the changes before proceeding.`,
              'Adjust Changes', '')
              .then((confirmed) => {  
                if (confirmed) {
                  // this.showPopup();
                }
              }).catch(() => {

              });
          } else {
            this.sowBudgetSufficient = 'YES';
            this.showPopup();
          }
        }  else if(this.dropDownOptions.selectedMilestone?.remaining_budget > this.budget_difference){
        this.sowBudgetSufficient = 'YES';
        this.showPopup();
        } else {
          this.compareResurceBudget();
          if(this.dropDownOptions['compared_budget_values']?.length === 0) {
            this.showPopup();
          }
        }
      } else {
        this.showPopup();
      }
    } else {
      this.showPopup();
    }
  }
   
  getOverlappingStatusOfAssignment() {
    if(this.assignmentConfig?.hasOwnProperty('overlapping_assignments') && !this.assignmentConfig?.overlapping_assignments?.is_allow) {
      new Promise<any>((resolve) => {
        let { start_date, end_date } = this.assignmentCreateForm.getRawValue();
        let url = `/assignment/programs/${this.programId}/overlapping_assignment/candidate`;
        let payload = {
          "is_multi_items": false,
          "overlapping_type": "overlapping_assignments",
          "request_action": this.assignmentId ? 'update' : 'create',
          "candidates": [
            {
              "candidate_uuid": this.assignmentId ? this.assignmentData?.assignments?.worker?.candidate?.id  : this.selectedCandidate?.id,
              "start_date": this.convertDateFormat(start_date),
              "end_date": this.convertDateFormat(end_date),
              "assignment_uuid": this.assignmentId ? this.assignmentId : null
            }
          ]
        };
        this.assignmentService.post(url, payload).subscribe({
          next: (res: any) => {
            resolve({ 'status': (res?.data?.candidates?.[0]?.is_assignment_allow || false), 'message': (res?.data?.candidates?.[0]?.message || null) , 'details' : (res?.data?.candidates?.[0]?.details || null) });
          }, error(err) {
            resolve({ 'status': (err?.error?.data?.candidates?.[0]?.is_assignment_allow || false), 'message': (err?.error?.data?.candidates?.[0]?.message || null) , 'details' : (err?.error?.data?.candidates?.[0]?.details || null) });
          }
        })
      }).then(data => {
        if (data?.status) { this.saveAssignment() }
        else {
          this.assignmentValueFor['warningModalVisibility'] = true;
          this.assignmentValueFor['warningModalVisibilityData'] = data?.message?.split('overlapping_assignment_warning_error');
          this.assignmentValueFor['warningModalVisibilityDetails'] = data?.details;
        }
      });
    } else {
      this.saveAssignment();
    }
  }

  showPopup() {
    const feeArr = this.feeArray?.getRawValue() || [];
    if(!(this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount tracking' || this.assignmentCreateForm.get('sourcing_model').value?.toLowerCase() === 'headcount_track') && this.assignmentCreateForm.get('is_billable').value) {
      if(feeArr?.length <= 0 || (feeArr?.length > 0 && !feeArr[0]?.funded_by)){
        this.validateMspFees();
        return;
      }
    }
      if (this.assignmentId) {
      let formData = this.assignmentCreateForm.getRawValue();
      let { net_allocated_budget, total_approved_spend } = formData;
      if ((net_allocated_budget - total_approved_spend) < 0) {
        this.compareResurceBudget();
        let finance_changes = this.dropDownOptions['compared_budget_values']?.map(element => element?.label);
        this.confirmService.confirm('', `Due to ${finance_changes.join(", ") || 'financial'}  change, the updated budget will be negative i.e. overspend on this assignment. Do You still want to continue?`,
          'Yes', 'No')
          .then((confirmed) => {
            if (confirmed) {
              this.checkImpactedTimesheet();
            }
          })
          .catch(() => {
          });
      } else {
        this.checkImpactedTimesheet();
      }
    } else {
      let formValue: any = this.assignmentCreateForm.getRawValue();
      const {is_billable , sourcing_model } = formValue;
      if(!this.showWelcomeEmail && sourcing_model?.toLowerCase() !== 'headcount tracking') {
        this.confirmService.confirm('', `The Timesheet ${!is_billable ? ',' : '&'} Expense ${!is_billable ? '& Billing' : ''} sections are turned Off. Please Confirm To Proceed.`,
        'Confirm', 'Cancel')
        .then((confirmed) => {
          if (confirmed) {
            this.submit();
          }
        })
        .catch(() => {
        });
      }
      else {
        this.submit();
      }
    }
  }

  updateTaxFormValue(array : any) {
    const result = array.reduce((finalArray , current) => {
     let obj = finalArray.find((res) => res?.entity_name?.toLowerCase()?.trim() === current?.entity_name?.toLowerCase()?.trim());
     if(obj) {
      finalArray.splice(finalArray.indexOf(obj), 1);
     }
     return finalArray.concat([current]);
    } , []);
    return result;
  }

  checkImpactedExpense(){ 
    let formData = this.assignmentCreateForm.getRawValue();
    if (this.assignmentData?.assignments?.finance?.is_expense_enabled && !formData?.is_expense_enabled) {
      this.confirmService.confirm('', `The General Expense toggle is turned OFF. This will discard all the impacted Expenses. Do you still want to proceed ?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.submit();
          }
        })
        .catch(() => {
        });
    } else if (!this.assignmentData?.assignments?.finance?.is_expense_enabled && formData?.is_expense_enabled) {
      this.confirmService.confirm('', `Setting the Expense toggle as ON will start the Expense entry for the worker. Do you want to continue ?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.submit();
          }
        })
        .catch(() => {
        });
    } else {
      this.submit();
    }
  }

  checkImpactedTimesheet() {
    const timesheetDataObj = this.dataSourceUrl?.find(data => data?.slug?.toLowerCase() === 'timesheet_location_popup');
    const isMultipleFinanacialMDTChange = this.assignmentValueFor['mdt_change']?.filter(res => res?.is_finance && res?.is_multiple);
    if (this.isPopupVisible && timesheetDataObj?.is_archive?.is_archive) {
      this.confirmService.confirm('', timesheetDataObj?.is_archive?.message,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            // this.submit();
            this.checkImpactedExpense();
          }
        })
        .catch(() => {
        });
    } 
    else if (this.isPopupVisible && isMultipleFinanacialMDTChange?.length) {
      this.confirmService.confirm('', `Since the Master Data Type has multiple values and is being used for Projects on Timesheets, the system is unable to automatically identify the specific changes that need to be made on impacted timesheets. Therefore, all impacted timesheets will be moved to a “Draft” status where someone will need to manually edit and resubmit the timesheet(s). Do you want to proceed?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            // this.submit();
            this.checkImpactedExpense();
          }
        })
        .catch(() => {
        });
    }
    else if (this.isPopupVisible && !this.isFinancialChange) {
      this.confirmService.confirm('', `There are timesheets which will be impacted.. Do you want to proceed?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            // this.submit();
            this.checkImpactedExpense();
          }
        })
        .catch(() => {
        });
    } 
    else if (this.isPopupVisible && !timesheetDataObj?.is_work_week_change?.is_work_week_change && this.isFinancialChange) {
      this.confirmService.confirm('', timesheetDataObj?.pop_up_message,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            // this.submit();
            this.checkImpactedExpense();
          }
        })
        .catch(() => {
        });
    } else {
      // this.submit();
      this.checkImpactedExpense();
    }
  }

  async validateEntityMapping(payload) {
    const programName = this.programDetails.name.toLowerCase().replace(' ', '-');
    let scripts;
    try {
      scripts = await import(`src/app/self-configuration/customer-scripts/${programName}-validation-script`);
    } catch(e) {
      return true;
    }
    if (scripts && scripts['assignmentValidationScript']) {
      let data: any = {};
      data.programId = this.programId;
      // foundational data
      data.foundational_data = [];
      this.foundationalFields?.forEach(fd => {
        let { slug, foundational_data_type_id, values } = fd;
        if (values) {
          data.foundational_data.push({ slug, foundational_data_type_id, foundation_data_id: values });
        }
      });
      // work locations
      let all_locations;
      if (this.assignmentId && !this.dropDownOptions?.work_location?.filter(res => res?.id === this.assignmentData?.assignments?.assignment?.work_location?.id)?.length) {
        this.dropDownOptions.work_location.push(this.assignmentData?.assignments?.assignment?.work_location);
      }
      if (this.dropDownOptions?.work_location.length > 0) {
        all_locations = this.dropDownOptions?.work_location;
      }
      data.work_locations = [
        (all_locations || [{ id: payload.work_location }])
          .find(obj => obj.id === payload.work_location)
      ]
       this.changeDetectorRef.detectChanges();
      return await scripts['assignmentValidationScript'](data, this.httpService);
    }
  }

  async submit() {
    if (this.dataSourceUrl['save_assignment']) {
      this.dataSourceUrl['save_assignment']?.unsubscribe();
    }
    let formValue: any = this.assignmentCreateForm.getRawValue();
    // if(this.assignmentCreateForm.invalid) {
    //   return
    // }
    // if(this.dropDownOptions.is_rate_valid && !this.dropDownOptions.is_rate_valid.is_valid) {
    //   this.alert.error(errorHandler(this.dropDownOptions.is_rate_valid.error));
    //   return
    // }
    const { is_expense_enabled, is_timesheet_enabled } = formValue;
    if (!is_timesheet_enabled) {
      delete formValue.timesheet_manager;
    }
    if (!is_expense_enabled) {
      delete formValue.expense_manager;
    }
    if (this._costComponentEnabled) {
      delete formValue.cost_component;
    }
    let custom = this.customFields?.map(element => {
      let customData = {};
      let isReadOnly = element?.custom_field_type == 'DROPDOWN' ? element?.is_readonly && element?.meta_data?.datasource?.options?.filter(f=>f.selected == "ON").length > 0 ? true : false : (element?.is_readonly || !element?.can_edit) ? true : false;
      let defaultValue =  element?.meta_data?.hasOwnProperty('default_value') && element?.meta_data?.default_value;
      customData['key'] = element?.slug;
      customData['value'] = typeof element?.values !== undefined ? element?.values : null;
      if(Boolean(isReadOnly && defaultValue)) {customData['is_default'] = true;}
      return customData;
    });
    // const foundational = this.foundationalFields.filter(ele => ele?.values).map(element => {
    //   return {
    //     key: element?.slug,
    //     value: Array.isArray(element.values) ? element.values : [element.values],
    //     is_disabled: element?.is_readonly,
    //   }
    // }).filter(ele=>ele.value?.length > 0);
    const foundational = this.foundationalFields.filter(ele => ele?.values).map(({ slug, values, is_readonly }) => ({
      key: slug,
      value: Array.isArray(values) ? values : [values],
      is_disabled: Boolean(is_readonly),
    })).filter(({ value }) => value?.length);
    if (formValue?.impacted_timesheet_data?.length > 0) {
      let impacted_timesheets = [];
      formValue.impacted_timesheet_data.forEach(timesheet => {
        if (timesheet.selected && timesheet.is_enable) {
          impacted_timesheets.push(timesheet.timesheet_uuid);
        }
      });
      if (impacted_timesheets?.length > 0) {
        formValue.impacted_timesheets = impacted_timesheets;
        delete formValue['impacted_timesheet_data'];
      }
    }
    if(!is_expense_enabled && !is_timesheet_enabled) {
      formValue.is_account_required = false;
    }
    if(this.extend === UPDATE_FOR.REVIEW) {
        formValue.is_pending_review = true;
        formValue.approval_status = this.pending_review?.approval_status
    }
    let { billrate, payrate, vendor_rate, fee, adjustment_fee, tax, worker_original_start_date, start_date, end_date, effective_date } = formValue;
    const taxArr = tax.map(f => { delete f.name; return f });
    const feeArr = fee.map(f => { delete f.name; return f });
    const adjustmentFeeArr = adjustment_fee.map(f=> { delete f.name ; delete f.entity_type ; return f})
    formValue = {
      ...formValue,
      is_show_remote_worker : this.programDetails?.config?.manage_remote_workers,
      is_hybrid:this.assignmentValueFor['is_hybrid_timesheet'],
      is_approval_workflow: false, // need to remove (this logic need to move to backend)
      tax_type: "adjustment",
      start_date: this.convertDateFormat(start_date),
      end_date: this.convertDateFormat(end_date),
      worker_original_start_date: this.convertDateFormat(worker_original_start_date),
      original_start_date: this.convertDateFormat(worker_original_start_date),
      effective_date: this.convertDateFormat(effective_date),
      notes_for_approver: '',
      tax: taxArr,
      fee: feeArr,
      adjustment_fee : adjustmentFeeArr,
      assignment_title: (this.dropDownOptions.assignment_title_uuid || []).find(assign => assign?.id === formValue['assignment_title_uuid'])?.template_name,
      custom,
      foundational,
      hierarchy_id: formValue?.hierarchy_id?.[0],
      display_title_from: this.display_title_from,
      ui_unique_id : this.uniqueId,
      is_expense_allowed_display: !(formValue?.sourcing_model?.toLowerCase() === 'headcount tracking' || formValue?.sourcing_model?.toLowerCase() === 'headcount_track') ? (this.selectedTemplate?.hasOwnProperty('is_expense_allowed_display') && this.selectedTemplate?.is_expense_allowed_display ? true : false) : true,
      is_expense_allowed_editable: this.selectedTemplate?.hasOwnProperty('is_expense_allowed_editable') && this.selectedTemplate?.is_expense_allowed_editable&&  !(formValue?.sourcing_model?.toLowerCase() === 'headcount tracking' || formValue?.sourcing_model?.toLowerCase() === 'headcount_track') ? true : false,
      is_markup_by_rate_type: this.markupByRateTypeEnabled,
      is_cost_component: this._costComponentEnabled
    }
    if(this.assignmentCreateForm.get('timesheet_type')?.value) {
      formValue.timesheet_type_label = this.dropDownOptions.timesheet_type?.filter(res => res?.value === this.assignmentCreateForm.get('timesheet_type')?.value)[0]?.label;
    }
    if(this.assignmentId && this.assignmentData?.assignments?.finance?.timesheet_type?.value !== this.assignmentCreateForm.get('timesheet_type')?.value) {
      formValue.old_timesheet_type_label = this.dropDownOptions.timesheet_type?.filter(res => res?.value === this.assignmentData?.assignments?.finance?.timesheet_type?.value)[0]?.label;
    }
    delete formValue.job;
    delete formValue.job_template;
    if (formValue?.sourcing_model?.toLowerCase() === 'headcount tracking') {
      formValue.sourcing_model = 'headcount_track';
      formValue.is_account_required = false;
      formValue.is_expense_enabled = false;
    } else if (formValue?.sourcing_model?.toLowerCase() === 'direct hire') {
      formValue.sourcing_model = 'direct_hire';
    }
    if (this.is_activity_based && this.assignmentControl?.is_billable?.value) {
      formValue.activity.forEach(element => {
        if (element && element?.rates && element?.rates?.length > 0) {
          element?.rates.push({ billrate: element?.activity_billrate || 0, payrate: element?.activity_payrate || 0, vendor_rate: element?.activity_vendor_rate || 0, rate_factor: 'st' , default: element?.default?? null })
        }
      });
      formValue.rate = formValue?.activity;
      let isPresent = formValue.rate.some(function (r) {
        return parseFloat(r.activity_billrate) > 0 && parseFloat(r.activity_vendor_rate) <= 0;
      });
      if (isPresent) {
        return this.alert.warn('Vendor rate cannot be 0');
      }
      formValue.rate.forEach(element => {
        delete element?.rename_activity;
        delete element?.activity_billrate;
        delete element?.activity_payrate;
        delete element?.activity_vendor_rate;
        delete element?.default;
        if (element && element?.rates && element?.rates?.length > 0) {
          element?.rates.forEach(r => {
            delete r?.enable_bill_rate_edit;
            delete r?.enable_pay_rate_edit;
            delete r?.name;
            delete r?.is_fees_applicable;
          });
        }
      });
    } else if (this.assignmentControl?.is_billable?.value) {
      if(parseFloat(formValue.billrate) > 0 && parseFloat(formValue.vendor_rate) <= 0) {
        return this.alert.warn('Vendor rate cannot be 0');
      }
      formValue.rate_factor = this.returnRateFactorsArray();
      this.getUpdatedPayloadOnOTExemptChange(formValue.rate_factor[0]?.rate_factors , false).then((data) => {
        if(data) {
          formValue.rate_factor[0].rate_factors = data;
        }

        for (const rate_factor_arr of (formValue.rate_factor || [])) { // push st rate_factor if it is not there
          if (rate_factor_arr?.rate_factors && !rate_factor_arr.rate_factors?.find(ratefromarr => ratefromarr?.abbreviation?.toLowerCase() === 'st') && this.dataSourceUrl['standard_rate_factor']) {
            rate_factor_arr.rate_factors.push((({ abbreviation, bill_rate, pay_rate }) => ({ abbreviation, bill_rate, pay_rate }))(this.dataSourceUrl['standard_rate_factor'] || {}));
            if (Object.keys(rate_factor_arr?.rate_factors[rate_factor_arr?.rate_factors?.length - 1])?.length) {
              rate_factor_arr.rate_factors[rate_factor_arr.rate_factors.length - 1]['markup'] = this.assignmentValueFor['markup'] ? this.assignmentValueFor['markup'] :formValue?.vendor_markup;
            }
          } 
        }


      });
      let { rate } = formValue;
      rate = rate?.map((rateObj: any) => {
        let rateData = formValue?.rate_factor?.[0]?.rate_factors?.filter(res => res?.abbreviation?.toLowerCase() === rateObj?.rate_factor?.toLowerCase())?.[0];
        let { billrate, payrate, vendor_rate, rate_factor} = rateObj;
        const newRate: any = {
          billrate, payrate, vendor_rate, rate_factor,
          ...{default: rateObj?.default},
          billable: (rateData?.hasOwnProperty('billable') ? rateData?.billable : true),
          applicable: (rateData?.hasOwnProperty('applicable') ? rateData?.applicable : true)
        };
        if (this._costComponentEnabled && rateObj.cost_component) {
          newRate.cost_component = rateObj.cost_component;
          newRate.cost_component.cost_component_group_id = this.costComponentGroupId;
        }
        return newRate;
      })
      // , name: 'Standard time' // need to remove in next PR
      const stRate = { billrate, payrate, vendor_rate, rate_factor: 'st',
        default:formValue?.default ? formValue?.default : null, billable: true, applicable :true };
      if (this.markupByRateTypeEnabled) {
        // stRate['markup'] = this.assignmentCreateForm?.get('vendor_markup')?.value;
        stRate['markup'] = this.assignmentValueFor['markup']? this.assignmentValueFor['markup']: this.assignmentCreateForm?.get('vendor_markup')?.value;;
      }
      if (this._costComponentEnabled && typeof this.assignmentValueFor['cost_component'] === 'object') {
        stRate['cost_component'] = _.cloneDeep(this.assignmentValueFor['cost_component']);
        stRate['cost_component']['cost_component_group_id'] = this.costComponentGroupId;
      }
      formValue.rate = [{is_fees_applicable: formValue?.is_fees_applicable, rates: [...rate, stRate] }]
    }
    if (!this.assignmentControl?.is_billable?.value) {
      formValue.rate = [];
      formValue.tax = [];
      formValue.fee = [];
      delete formValue.activity;
    }

    if (this.markupByRateTypeEnabled && formValue.rate_factor?.[0]?.rate_factors && formValue.rate?.[0]?.rates) {
      const factors = formValue.rate_factor?.[0]?.rate_factors;
      for (const rate of formValue?.rate?.[0]?.rates) {
        if (rate?.rate_factor?.toLowerCase() == 'st') {
          continue;
        }
        if(rate?.billable || rate?.abbreviation?.toLowerCase() == 'st') {
          rate.markup = factors?.find(factor => factor?.abbreviation?.toLowerCase() == rate?.rate_factor?.toLowerCase())?.markup
          || this.assignmentCreateForm.get('vendor_markup')?.value;
        } else {
           rate.markup = this.accuracyPipe?.transform(0, this.accuracyConfig.markup_percentage, { isEdit: true }) ;
        }
      }
      for (const rateFactor of formValue?.rate_factor?.[0]?.rate_factors) {
        if (rateFactor.abbreviation?.toLowerCase() !== 'st' && !rateFactor.billable) {
          rateFactor.markup = this.accuracyPipe?.transform(0, this.accuracyConfig.markup_percentage, { isEdit: true });
        }
      }
    }

    if (!formValue?.is_timesheet_enabled) {
      formValue.st_hours = this.accuracyPipe?.transform(0, this.accuracyConfig.hour);
      formValue.days_per_week = 0;
    }
    if(this.extend && this.extend === UPDATE_FOR.DATE) {
      formValue.requested_form_name = 'extension'
    } else if( this.extend && this.extend === UPDATE_FOR.RATE) {
      formValue.requested_form_name = 'rate_change'
    } else if (this.extend && this.extend === UPDATE_FOR.TAX) {
      formValue.requested_form_name = 'tax_update'
    }
    for (const rate_factor_arr of (formValue.rate_factor || [])) { // push st rate_factor if it is not there
      if (rate_factor_arr?.rate_factors && !rate_factor_arr.rate_factors?.find(ratefromarr => ratefromarr?.abbreviation?.toLowerCase() === 'st') && this.dataSourceUrl['standard_rate_factor']) {
        rate_factor_arr.rate_factors.push((({ abbreviation, bill_rate, pay_rate }) => ({ abbreviation, bill_rate, pay_rate }))(this.dataSourceUrl['standard_rate_factor'] || {}));
        if (Object.keys(rate_factor_arr?.rate_factors[rate_factor_arr?.rate_factors?.length - 1])?.length) {
          rate_factor_arr.rate_factors[rate_factor_arr.rate_factors.length - 1]['markup'] = this.assignmentValueFor['markup'] ? this.assignmentValueFor['markup'] :formValue?.vendor_markup;
          if (this._costComponentEnabled) {
            delete this.assignmentValueFor['cost_component']?.markup;
            Object.keys(this.assignmentValueFor['cost_component']).forEach(key => {
              delete this.assignmentValueFor['cost_component']?.[key]?.cost_amount;
              delete this.assignmentValueFor['cost_component']?.[key]?.total_amount;
              delete this.assignmentValueFor['cost_component']?.[key]?.component_name;
            });
            rate_factor_arr.rate_factors[rate_factor_arr.rate_factors.length - 1]['cost_component'] = this.assignmentValueFor['cost_component'];
          }
        }
      }
    }
    formValue.labor_category = this.dropDownOptions['labor_category'] || null;
    delete formValue?.activity;
    delete formValue?.default;
    delete formValue?.is_fees_applicable;
    if(this.accountCodeCreationActive && !this.assignmentId){
      formValue.account_code = this.accountCode;
    }
    if(!formValue?.remote_worker) {
      formValue.remote_worker_details = null;
    }
    this.loader.show();
    this.isSaveLoader = true;
    this.logs= undefined; 
    formValue.tax = this.updateTaxFormValue(formValue?.tax);
    if(this.assignmentData?.assignments?.action_allow?.can_tax_update_pending) {
      formValue.can_tax_update_pending = true;
    }

    // validating the mapping before creating/updating an assignment
    try {
      await this.validateEntityMapping(formValue);
    } catch(err) {
      this.loader.hide();
      this.showError(err.message);
      this.isSaveLoader = false;
      return;
    }

    return new Promise<any>((resolve) => {
      if (!this.assignmentId) {
        this.dataSourceUrl['save_assignment'] = this._formRendererService.post(`/assignment/programs/${this.programId}/assignment`, formValue)
          .subscribe({next:(data: any) => {
            if (data?.code === 200) {
              this.isSaveLoader = false;
              this.alert.success('Assignment has been created successfully.')
              this.loader.hide();
              resolve(data?.data?.assignment_id);
            }
          }, error: (err) => {
            this.showError(err);
            this.isSaveLoader = false;
            this.loader.hide();
          }})
      } else {
        this.dataSourceUrl['save_assignment'] = this.assignmentService.updateAssignmentDetails(this.programId, this.assignmentId, formValue).subscribe({next:(data: any) => {
          if (data?.code === 200) {
            this.alert.success('Assignment updated successfully!');
            this.loader.hide();
            this.isSaveLoader = false;
            resolve(this.assignmentId);
          }
        }, error: (err) => {
          this.loader.hide();
          this.showError(err);
          this.isSaveLoader = false;
        }})
      }
    }).then((data) => {
      this.router.navigate([`/assignment/details/${data}/final`], { queryParams: { ...(this.activatedRoute?.snapshot?.queryParams || {}), tab: 'assignment' } });
    })
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }

  foundationalFields: any[] = [];
  isFoundationalFieldsValid = true;
  setFoundationalFieldsFormValid(event) {
    this.isFoundationalFieldsValid = event;
  }

  foundationalFieldIds:string[]=[];
  foundationalFieldUpdated(event) {
    this.foundationalFields = event;
    if(this.foundationalFieldIds?.length == 0 || this.foundationalFields?.length != this.foundationalFieldIds?.length){
      this.foundationalFieldIds=[];
      this.foundationalFields.forEach(ff=>{
        this.foundationalFieldIds.push(ff?.id)
      })
    }
  }


  customFields: any[] = [];
  isCustomFieldsValid = true;
  setCustomFieldsFormValid(event) {
    this.isCustomFieldsValid = event;
  }

  customFieldUpdated(event) {
    this.customFields = event;
  }

  getReasonCode() {
    let reasonCodeFor = 'REQUEST_AMENDMENT';

    if (this.extend && this.extend === UPDATE_FOR.DATE) {

      reasonCodeFor = 'ASSIGNMENT_EXTENSION'

    } else if (this.extend && this.extend === UPDATE_FOR.RATE) {

      reasonCodeFor = 'ASSIGNMENT_RATE_CHANGE'
    }

    this.reasonCodesService.getResoncodesFor(reasonCodeFor).subscribe((updateReason: any) => {
      this.assignmentCreateForm.get('reason_code_action')?.setValue(updateReason?.resonCodeID);
      this.updateOfReason = updateReason?.reason_codes;
    });
  }

  document: any = undefined;
  uploadFiles(event: any): void {
    if (event && event.raw) {
      let fileExtension = event.ext?.toLowerCase();
      if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        let payload = {
          file_name: event['name'],
          raw: event['raw']
        };
        this.loader.show();
        this._formRendererService.post(`/assignment/programs/${this.programId}/assignments/upload`, payload).subscribe({next:(data: any) => {
          if (data) {
            this.document = data.data;
            this.assignmentCreateForm.get('documents').setValue(this.document)
            this.alert.success('File uploaded successfully');
            this.loader.hide();
          }
        },
        error: (err) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }});
      }
    }
  }

  onCandidateCreated(event) {
    if (event) {
      this.dropDownOptions.candidate_uuid.push(event);
      this.dropDownOptions = { ...this.dropDownOptions }
      this.assignmentCreateForm.get('candidate_uuid').setValue(event?.id);
      this.selectedVendor = event?.vendor ?? null;
      this.assignmentCreateForm.patchValue({
        vendor_id : this.selectedCandidate?.vendor?.id
      })
      this.candidateSelected(event?.id)
    }
  }
  searchAssignmentTitleBy(type) {
    this.assignmentCreateForm.get('assignment_title_uuid').setValue(null);
    this.assignmentCreateForm.get('job_id').setValue(null);
    this.dropDownOptions['labor_category'] = null;
    if(type=== 'job_template') {
      this.assignmentCreateForm.get('job').setValue(false);
    } else if(type=== 'job'){
      this.assignmentCreateForm.get('job_template').setValue(false);
    }
    if(this.assignmentId) {
      this.allDisableField['assignment_title_uuid'] = false;
      this.allDisableField['job_id'] = false;
      let { search_by_job, search_by_job_template } = this.assignmentConfig?.update_assignment_title || {};
      this.checkJobStatus(search_by_job, search_by_job_template);
    } else {
      let { search_by_job, search_by_job_template } = this.assignmentConfig?.assignment_title || {};
      this.checkJobStatus(search_by_job, search_by_job_template);
    }
  }

  search(slug, event) {
    return new Promise<void> ((resolve) => {
    const value = event?.term;
    const urlObj = this.dataSourceUrl?.find(data => data?.slug === slug);
    const index = this.dataSourceUrl?.findIndex(data => data?.slug === slug);
    if (index > -1 && urlObj?.datasource?.type === 'url' && this.dataSourceUrl[index].subscription) {
      this.dataSourceUrl[index].subscription.unsubscribe();
    }
    if (urlObj && urlObj?.datasource?.type === 'url' && (urlObj?.datasource?.url?.endsWith('k=') || urlObj?.datasource?.url?.endsWith('template_name=') || urlObj?.datasource?.url?.endsWith('title_or_template='))) {
      let url = urlObj?.datasource?.url.replace('${programId}', this.programId); 
       if ((slug != 'work_location' || slug != 'assignment_title_uuid' ) && value ) {
        url += value
      }
      if (this.isClient && !this.assignmentId && !this.assignmentConfig?.show_managers?.create?.is_enabled && (slug === 'assignment_manager' || slug === 'timesheet_manager' || slug === 'expense_manager')) {
        return;
      }

      if (this.isClient && this.assignmentId && !this.assignmentConfig?.show_managers?.update?.is_enabled && (slug === 'assignment_manager' || slug === 'timesheet_manager' || slug === 'expense_manager')) {
        return;
      }
      if(slug === 'job_id') {
        url = this.getUrlBySlug('job_id', JOB_URL, value , event?.queryParam || false);
      }
      if (slug === 'work_location' && !this.assignmentValueFor['is_all_work_locations']) {
        this.loaderObj[slug] = false; 
        return
      }
      if (slug === 'work_location') {
       url = this.getUrlBySlug('work_location', WORK_LOC_URL, value);
     }
      if(slug === 'assignment_title_uuid') {
        url = this.getUrlBySlug('assignment_title_uuid', TEMPLATE_URL, value);
      }
      if(slug === 'assignment_manager') {
        url = this.getUrlBySlug('assignment_manager', ASSIGNMENT_MANAGER_URL, value);
      }
      this.dataSourceUrl[index].subscription = this._formRendererService.get(url).subscribe((data: any[]) => {
        if (data) {
          urlObj?.datasource?.getBy.forEach(d => {
            data = data[d]
          });
          this.loaderObj[slug] = true;
          const selectedOption = this.assignmentCreateForm?.get(urlObj?.slug);
          let hasSelectedOption = false;
          let selectedOptionDrop;
          if (selectedOption && selectedOption?.value && this.dropDownOptions && this.dropDownOptions[urlObj?.slug]) {
            (Array.isArray(selectedOption?.value) ? selectedOption?.value : [selectedOption?.value]).forEach(res => {
              hasSelectedOption = this.dropDownOptions[urlObj?.slug]?.some(op => op?.[urlObj?.bind_value] === res);
              selectedOptionDrop = this.dropDownOptions[urlObj?.slug]?.find(op => op?.[urlObj?.bind_value] === res);
              if ((!hasSelectedOption && selectedOptionDrop)) {
                data.push(selectedOptionDrop);
              }
            })
          }
          this.loaderObj[slug] = false;
          this.dropDownOptions[urlObj?.slug] = data;
          if (data?.length === 1 && urlObj?.bind_value && !this.assignmentId && slug === 'work_location') {
            this.assignmentCreateForm.patchValue({
              [urlObj?.slug]: data[0][urlObj?.bind_value]
            });
          }
          if(slug=='work_location'){
            this.dropDownOptions.allWorkLocations = data || [];
            this.removeWorkLocationDuplicate();
          }
          resolve();
        }
      }, error => {
        resolve();
        this.loaderObj[slug] = false;
      })
    }
    });
  }
  getCurrencyDropdownValues(currencyObjValue? , valueChanged?) {
    this.changeDetectorRef.detectChanges();
    if (this.display_title_from?.toLowerCase() !== JOB_STATUS.EXISTING_JOB) {
      let currencyObj = {};
      let value = currencyObjValue ? currencyObjValue : this.dropDownOptions?.work_location.filter(res => res?.id === this.assignmentCreateForm.get('work_location').value);
      if (value[0]?.currencies?.length > 0) {
        value[0]?.currencies?.forEach(res => { currencyObj[res?.code] = res?.symbol });
        this.currencyObject = Object.assign(this.currencyObject, currencyObj);
        this.dropDownOptions.currency = [...value[0]?.currencies];
        let isDefaultValue = value[0]?.currencies.filter(res => res?.is_default);
        if (isDefaultValue && valueChanged) {
          this.currency = isDefaultValue[0]?.code;
          this.assignmentCreateForm.get('currency').setValue(isDefaultValue[0]?.code);
        }
      }
      else {
        this.getDefaultCurrencyValue(valueChanged);
      }
    }
  }
  getDefaultCurrencyValue(valueChanged? , valueToBePatched?) {
    let currencyObj ={};
    let currencyDropdownData = [];
    this.programDetails?.config?.billing?.supported_currencies.forEach(res => {
      currencyObj[res]=this.accuracyPipe.transform('','',{ currencyCode: res, display: 'symbol' });
      currencyDropdownData.push({code : res , label : res , symbol : currencyObj[res]});
    });
    this.currencyObject = Object.assign(this.currencyObject , currencyObj);
    if(this.programDetails?.config?.billing?.default_currency) {
      if(valueChanged) {
        if(valueToBePatched) {
          this.currency = valueToBePatched;
          this.assignmentCreateForm.get('currency').setValue(valueToBePatched);
        } else if (this.display_title_from?.toLowerCase() !== JOB_STATUS.EXISTING_JOB) {
          this.currency = this.programDetails?.config?.billing?.default_currency;
          this.assignmentCreateForm.get('currency').setValue(this.programDetails?.config?.billing?.default_currency);
        }
      }
    }
    this.dropDownOptions.currency = [...currencyDropdownData];
  }
  removeWorkLocationDuplicate() {
    if (this.dropDownOptions?.work_location) {
      this.dropDownOptions.work_location = this.dropDownOptions?.work_location.filter(function (element) {
        return element !== undefined;
      });
    } else { return }
    if (this.assignmentId && !this.dropDownOptions?.work_location?.filter(res => res?.id === this.assignmentData?.assignments?.assignment?.work_location?.id)?.length) {
      this.dropDownOptions.work_location.push(this.assignmentData?.assignments?.assignment?.work_location);
    }
    let value = this?.dropDownOptions?.work_location;
    let result: Array<any> = [];
    if (value && Array.isArray(value)) {
      let wl_map: Map<string, any> = new Map<string, any>();
      value?.forEach(node => {
        wl_map?.set(node?.id, node);
      });
      wl_map?.forEach((val, key) => {
        result?.push(val);
      });
    }
    this.dropDownOptions['work_location'] = [...result];
  }

  showMoreActivity() {
    this.moreActivity = true;
  }

  editActivityName(i) {
    if (i !== -1) {
      this.editActivity = i;
      this.resetEffectiveDate();
    }
  }
  closeEditing($event) {
    if ($event) {
      this.editActivity = undefined;
    }
  }

  getApprovalList(event) { 
    if(event && this.getApprovalStatus) {
      const formData = this.assignmentCreateForm.getRawValue();
      let { net_allocated_budget, assignment_manager } = formData;
      const url = `/configurator/programs/${this.programId}/members/${assignment_manager}/financial-authority-chain?level=50&max_approval_limit=${net_allocated_budget ? net_allocated_budget : 0}`;
      this._formRendererService.get(url)
        .subscribe(res => {
          if (res?.members) {
            this.supervisors = res?.members[res?.members.length - 1]?.supervisors;
          }
        });
    } else {
      this.supervisors = new Array();
    }
  }

  getUrlBySlug(slug, apiUrl, value , queryParam?) {
    let url = apiUrl;
    url = url.replace('${programId}', this.programId);
    const formValue = this.assignmentCreateForm.getRawValue();
    const { hierarchy_id , job_type } = formValue;
    if (hierarchy_id || formValue?.hierarchy_id) {
      if(slug ==='work_location') {
        url += `hierarchy_id=${hierarchy_id || formValue?.hierarchy_id}`;
      }else if( slug === 'job_id') {
        url += `hierarchy_ids=${hierarchy_id || formValue?.hierarchy_id}`;
        if(job_type?.length && Array.isArray(job_type)) {
          url+= `&job_type=${job_type?.join(',')}`
        }
      } else if(slug === 'assignment_title_uuid') {
        url += `hierarchies_ids=${hierarchy_id || formValue?.hierarchy_id}`;
        if(job_type?.length && Array.isArray(job_type)) {
          url+= `&job_type=${job_type?.join(',')}`
        }
      }
      // else if( slug  ===  'assignment_manager') {
      //   url += `hierarchy_ids=${hierarchy_id || formValue?.hierarchy_id}`;
        
      // }

    }
    if (slug == 'assignment_title_uuid' && value) {
      url += `&template_name=${value}`;
    }
    if(slug === 'job_id') {
      url += `&show_filled=${Number(this.isFillerJobChecked || queryParam)}`;
      if(value) {url += `&title_or_template=${value}`}
    }
    if((slug=== 'assignment_manager' || slug === 'work_location') && value) {
      url += `&k=${value}`;
    }
    return url;
  }

  setVals(data, key) {
    return data[0]?.hasOwnProperty(key) ? data.map(a => a[key]).sort().join(', ') : data.join(', ');
  }


  handleRateFactorRes = (res , modifyRateFactors?) => {
    if (res) {
      let { rate_factors } = res;
      rate_factors = modifyRateFactors ? rate_factors.filter(res => res?.billable) : rate_factors;
      const st_rate_factor = rate_factors?.find(rate=> rate?.abbreviation?.toLowerCase() == RATETYPES.ST);
      if (this.markupByRateTypeEnabled && st_rate_factor && !st_rate_factor?.markup) {
        st_rate_factor.markup = this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
      }
      if(st_rate_factor) {
        this.dataSourceUrl['standard_rate_factor'] = st_rate_factor;
      } else {
        delete this.dataSourceUrl['standard_rate_factor'];
      }
      rate_factors = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase()  !== RATETYPES.ST);
      const arrayValues = this.assignmentData?.assignments?.finance?.rate?.[0]?.rates || [];
      let is_fees_applicable = this.assignmentData?.assignments?.finance?.rate?.[0]?.is_fees_applicable || false;
      rate_factors = this.getSortRates(rate_factors);
      if (rate_factors) {
        rate_factors = this.getSortRates(rate_factors);
        this.ratesArray.clear();
        this.assignmentCreateForm.get('billrate').setValue(this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}));
        this.assignmentCreateForm.get('vendor_rate').setValue(this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}));
        this.assignmentCreateForm.get('payrate').setValue(this.accuracyPipe.transform(0 , this.accuracyConfig?.rate , {isEdit : true}));
        if (!this.assignmentId) {
          this.activity_wise_rate_factors_arr = [];
        }
        this.rateFactor = rate_factors;
        this.createLocalRateFactorArrForUpdation();
        if (!this.is_activity_based) {
          for (let index = 0; index < rate_factors?.length; index++) {
            const element = rate_factors[index];
            const valObj = arrayValues?.find(r => r.rate_factor.toLowerCase() === element?.abbreviation.toLowerCase());
            const rateForm = this.fb.group({
              rate_factor: [element?.abbreviation],
              name: [element.name],
              billrate: [this.accuracyPipe.transform(valObj?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
              payrate: [this.accuracyPipe.transform(valObj?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
              vendor_rate: [this.accuracyPipe.transform(valObj?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
              is_fees_applicable: [false],
              default: [null],
              is_billable : element?.billable,
              is_applicable : true
            }, {
              validators: [this.payRateValidator]
            }); 
            //  removed for  6638
            rateForm.get('billrate').disable();
            rateForm.get('payrate').disable();
            rateForm.get('vendor_rate').disable();
            let formArray = this.assignmentCreateForm.get('rate') as UntypedFormArray;
            formArray.push(rateForm);
          }
          const valObj = arrayValues?.find(ra => ra?.rate_factor.toLowerCase() === 'st' || ra?.rate_factor.toLowerCase() === 'regular');
          if (valObj) {
            // this.assignmentCreateForm.patchValue(valObj);
            // setTimeout(() => {
              this.assignmentCreateForm.get('billrate')?.setValue(this.accuracyPipe?.transform(+valObj?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
              this.assignmentCreateForm.get('vendor_rate')?.setValue(this.accuracyPipe?.transform(+valObj?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
              this.assignmentCreateForm.get('payrate')?.setValue(this.accuracyPipe?.transform(+valObj?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
              this.assignmentCreateForm.get('default')?.setValue(valObj?.default);
              this.assignmentCreateForm.get('is_fees_applicable')?.setValue(is_fees_applicable);
            // }, 1000);
        this.recalcualatebudget();
          }
          if (!this.assignmentId) {
            this.createActivityWiseRateFactorsArray();
          }
          this.changeDetectorRef.detectChanges();
        } else {
          this.activityArray.clear();
          this.initializeActivity();
          this.updateRateFactorActivity(0, this?.assignmentId ? false : true);
          this.changeDetectorRef.detectChanges();
        }
        
        this.changeMarkupOption();
        if (this._costComponentEnabled) {
          this.handleCostComponentDetails();
        }
      }
    }
  }

  toggleChangedForRateType(rateForm) {
    let index = this.rate_factors_arr?.findIndex(res => res?.abbreviation?.toLowerCase() === rateForm?.value.rate_factor?.toLowerCase());
    let indexOfRate = this.activity_wise_rate_factors_arr[0]?.findIndex(res => res?.abbreviation?.toLowerCase() === rateForm?.value.rate_factor?.toLowerCase());
    let indexOfFinalArray = this.final_activity_wise_rate_factors_arr[0]?.findIndex(res => res?.abbreviation?.toLowerCase() === rateForm?.value.rate_factor?.toLowerCase());
    rateForm.patchValue({
      is_applicable: !rateForm?.get('is_applicable')?.value
    })
    if(index > -1) {
      this.rate_factors_arr[index].applicable = rateForm?.value?.is_applicable;
    }
    if(indexOfRate > -1) {
      this.activity_wise_rate_factors_arr[0][indexOfRate].applicable = rateForm?.value?.is_applicable;
    }
    if(indexOfFinalArray > -1) {
      this.final_activity_wise_rate_factors_arr[0][indexOfRate].applicable = rateForm?.value?.is_applicable;
    }
    if(this.assignmentId) {
      this.resetEffectiveDate();
      if(this.assignmentData?.assignments?.assignment?.is_hybrid && (!(this.isChangeInToggleValuesOfRates()?.finance_change && this.isChangeInToggleValuesOfRates()?.non_finance_change))) {
        this.workWeekStartDay = this.assignmentValueFor['workWeekStartDay'];
      }
      
    };
  }

  updateRateFactor() {
    this.ratesArray.clear();
    let arrayValues = this.assignmentData?.assignments?.finance?.rate?.[0]?.rates || [];
    let is_fees_applicable = this.assignmentData?.assignments?.finance?.rate?.[0]?.is_fees_applicable || false;
    if (!this.is_activity_based) {
      arrayValues = this.getSortRates(arrayValues);
      this.initialCostComponentValues.clear();
      for (let index = 0; index < arrayValues?.length; index++) {
        const element = JSON.parse(JSON.stringify(arrayValues[index]));

        if (this._costComponentEnabled && element?.cost_component) {
          this.costComponentGroupId = element.cost_component?.cost_component_group_id;
          this.initialCostComponentValues.set(element.rate_factor?.toLowerCase(), element.cost_component)
        }
        if(element && (element.rate_factor.toLowerCase() !=='st')) {
        const rateForm = this.fb.group({
          rate_factor: [element?.rate_factor],
          name: [element?.name],
          billrate: [this.accuracyPipe?.transform(+element?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],
          payrate: [this.accuracyPipe?.transform(+element?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],
          vendor_rate: [this.accuracyPipe?.transform(+element?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true }), Validators.required],
          default: [element?.default || null],
          is_fees_applicable: is_fees_applicable,
          is_billable : this.rate_factors_arr?.filter(res => res?.abbreviation?.toLowerCase() === element?.rate_factor?.toLowerCase())?.[0]?.billable,
          is_applicable : this.rate_factors_arr?.filter(res => res?.abbreviation?.toLowerCase() === element?.rate_factor?.toLowerCase())?.[0]?.applicable
        }, {
          validators: [this.payRateValidator]
        });
        rateForm.get('billrate').disable();
        rateForm.get('payrate').disable();
        rateForm.get('vendor_rate').disable();
        let formArray = this.assignmentCreateForm.get('rate') as UntypedFormArray;
        formArray.push(rateForm);
      }
      }
      const valObj = arrayValues.find(ra => ra?.rate_factor.toLowerCase() === 'st' || ra?.rate_factor.toLowerCase() === 'regular');

      if (valObj) {
        // this.assignmentCreateForm.patchValue(valObj);
        this.assignmentCreateForm.get('billrate')?.patchValue(this.accuracyPipe?.transform(+valObj?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
        this.assignmentCreateForm.get('vendor_rate')?.patchValue(this.accuracyPipe?.transform(+valObj?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
        this.assignmentCreateForm.get('payrate')?.patchValue(this.accuracyPipe?.transform(+valObj?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true }));
        this.assignmentCreateForm.get('default')?.patchValue(valObj?.default);
        this.assignmentCreateForm.get('is_fees_applicable')?.patchValue(is_fees_applicable);
      }
      this.changeDetectorRef.detectChanges();
    } else {
      this.activityArray.clear();
      this.initializeActivity();
      this.updateRateFactorActivity(0, this?.assignmentId ? false : true);
      this.changeDetectorRef.detectChanges();
    }
    if (this._costComponentEnabled) {
      this.handleCostComponentDetails();
    }
    this.changeMarkupOption();
    this.recalcualatebudget();

  }

  defaultWorkLocation = (work_location) => {
    if (work_location) {
      let hasValue = (this.dropDownOptions?.work_location || []).some(opt => opt?.id === work_location?.id);
      if (!hasValue) {
        this.dropDownOptions['work_location'] = [...(this.dropDownOptions?.work_location || []), work_location.entity_object];
      }
      hasValue = (this.dropDownOptions?.work_location || []).some(opt => opt?.id === work_location?.id);
      this.assignmentCreateForm.patchValue({
        work_location: hasValue ? work_location?.id : null
      });
      if(hasValue && work_location?.entity_object) {
        this.setTimesheetTypeBasedOnWorkLocation(work_location?.entity_object);
        this.getOnboardingChecklist();
      }
    } else {
      this.assignmentCreateForm.patchValue({
        work_location: null
      });
    }
    this.getTimesheetTypeDetails();
  }

  // View/manage rate details
  rateDetailsVisible: boolean = false;

  get rateDetailsEditableFactors(): boolean {
    return this._editableRateFactors || this.assignmentConfig?.rate_factors_editable?.is_allow;
  }

  get rateDetailsEditableMarkup(): boolean {
    return this.markupByRateTypeEnabled && this._editableMarkup;
  }

  get rateDetailsEditableCostComponent(): boolean {
    return this._costComponentEnabled && this._editableCostComponent;
  }

  get rateDetailsPayload(): RateModelPayloadDefaults {
    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr?.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    let msp_fee_types, msp_fee_value, funded_by;

    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe.transform(feeArr[indexForMsp]?.amount_value , feeArr[indexForMsp]?.amount_type?.toLowerCase() === 'percentage' ? this.accuracyConfig?.fee_percentage : this.accuracyConfig?.fee , {isEdit : true});
      funded_by = feeArr[indexForMsp]?.funded_by;
    }

    return {
      hierarchy: this.assignmentCreateForm.get('hierarchy_id')?.value?.[0],
      rate_model: this.assignmentCreateForm.get('rate_model')?.value,
      min_bill_rate: "0.0",
      max_bill_rate: "0.0",
      msp_fee_types,
      msp_fee_value,
      msp_fee_funded_by: funded_by,
      ot_exempt: this.assignmentCreateForm.get('ot_exempt_position')?.value,
      uuid: this.assignmentCreateForm.get('uuid')?.value,
      adjusted_markup: this.assignmentCreateForm.get('adjusted_markup')?.value
    }
  }

  get editableBillrateFactor() {
    if (this.assignmentConfig?.rate_factors_editable?.is_allow) {
      if (this.markupByRateTypeEnabled) {
        return this.assignmentControl?.rate_model?.value == 'billrate';
      } else {
        return true;
      }
    }
    return false;
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
  }

  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  hideRateDetails(data) {
    this.rateDetailsVisible = false;
    if (data.update) {
      this.assignmentCreateForm.get('billrate')?.setValue(data.standardRates.billrate);
      this.assignmentCreateForm.get('payrate')?.setValue(data.standardRates.payrate);
      this.assignmentCreateForm.get('vendor_rate')?.setValue(data.standardRates.vendor_rate);
      if (data?.standardRates?.markup) {
        // this.assignmentCreateForm?.get('vendor_markup')?.setValue(data?.standardRates?.markup);
        this.assignmentValueFor['markup'] = data?.standardRates?.markup;
        if (this.dataSourceUrl['standard_rate_factor']?.markup) {
          this.dataSourceUrl['standard_rate_factor']['markup'] = data?.standardRates?.markup;
        }
      }
      if (this._costComponentEnabled && data?.standardRates?.cost_component) {
        for (const cc of data.standardRates.cost_component) {
          this.assignmentCreateForm.get('cost_component')?.get(cc?.code || 'markup')?.patchValue({ ...cc });
          this.assignmentValueFor['cost_component'][cc.code || 'markup'] = { ...cc };
          if (this.dataSourceUrl['standard_rate_factor']?.cost_component) {
            this.dataSourceUrl['standard_rate_factor']['cost_component'][cc.code || 'markup'] = { ...cc };
          }
        }
      }

      const assignmentRate = this.assignmentCreateForm.get('rate') as UntypedFormArray;
      for (const rate of assignmentRate?.controls) {
        const newRateObj = data['rateValues'].find(obj => obj.rate_factor === rate.get('rate_factor').value);
        rate.get('billrate')?.setValue(newRateObj?.billrate);
        rate.get('vendor_rate')?.setValue(newRateObj?.vendor_rate);
        rate.get('payrate')?.setValue(newRateObj?.payrate);
        if (this._costComponentEnabled && newRateObj?.cost_component?.length) {
          for (const cc of newRateObj.cost_component) {
            rate.get('cost_component')?.get(cc.code || 'markup')?.patchValue({ ...cc });
          }
        }
      }

      const replaceIfFound = (arr, newObj) => {
        if (!arr || arr.length <= 0) {
          return;
        }
        const abbr = newObj?.abbreviation?.toLowerCase();
        const obj = arr?.find(obj => obj?.abbreviation?.toLowerCase() == abbr);
        if (obj) {
          const index = arr?.map(obj => obj?.abbreviation?.toLowerCase())?.indexOf(abbr);
          if (index >= 0) {
            arr[index] = newObj;
          }
        } else {
          arr.push(newObj);
        }
      }

      for (const new_factor_arr of data['factors']) {
        replaceIfFound(this.final_activity_wise_rate_factors_arr[0], new_factor_arr);
        replaceIfFound(this.activity_wise_rate_factors_arr[0], new_factor_arr);
        replaceIfFound(this.rate_factors_arr, new_factor_arr);
      }

      this.calculateResourceBudget();
    }
  }
  
  get standardRateDetails() {
    return {
      billrate: this.assignmentCreateForm.get('billrate')?.value,
      payrate: this.assignmentCreateForm.get('payrate')?.value,
      vendor_rate: this.assignmentCreateForm.get('vendor_rate')?.value,
      cost_component: this.assignmentCreateForm.get('cost_component')?.value,
      // markup: this.assignmentCreateForm.get('vendor_markup')?.value,
      markup: this.assignmentValueFor['markup'] || this.assignmentCreateForm.get('vendor_markup')?.value,
    }
  }

  loadDefaultMemberValue(value, isExecute = true, valueChanged = false) {
    return new Promise<void>((resolve) => {
      let defaultFoundationValues = [];
      let foundationalFieldvalues = [];
      let defaultWorkLocation = null;
      if (value) {
        this._formRendererService.get(`/configurator/programs/${this.programId}/members/${value?.id}`).subscribe({
          next:
            (result: any) => {
              this.delegatedUser = result?.member?.delegated_by[0]?.delegated_by;
              this.assignmentValueFor['is_all_work_locations'] = result?.member?.is_all_work_locations;
              this.dropDownOptions.defaultWorkLocation = new Array();
              if(!result?.member?.is_all_work_locations) {
               this.dropDownOptions.work_location = new Array();
               this.dropDownOptions.work_location = [...result?.member?.work_locations];
               this.dropDownOptions.defaultWorkLocation = [...result?.member?.work_locations];
              } else {
               this.dropDownOptions.work_location = [... this.dropDownOptions?.allWorkLocations || []];
              }
              if (result?.member?.work_locations?.length > 0) {
                this.getCurrencyDropdownValues(result?.member?.work_locations, valueChanged);
              } else {
                this.getDefaultCurrencyValue(valueChanged);
              }
              if (isExecute) {
                  let isWorkLocation = result?.member?.defaults?.some(ele=> ele?.entity_type ==='WORK_LOCATION');
                  if(!isWorkLocation &&!this.assignmentId && this.assignmentCreateForm.get('work_location')?.value) {
                      if(!this.assignmentId) {
                        this.assignmentCreateForm.patchValue({
                          work_location:  null
                        });
                      }
                  }
                if (result?.member?.defaults) {
                  let defaults: Array<any> = result.member?.defaults;
                  if (defaults && defaults?.length > 0) {
                    defaults?.forEach(element => {
                      if (element?.entity_type === 'FOUNDATIONAL_DATA') {
                        let foundational_value = {
                          foundational_data_type: element?.foundational_data_type,
                          id: element?.entity_id,
                          name: element?.entity_object?.name,
                          code: element?.entity_object?.code,
                          custom_fields: element?.entity_object?.custom_fields
                        };
                        let isPresent = defaultFoundationValues.some(f => f?.id === element?.entity_id);
                        if (!isPresent) {
                          foundationalFieldvalues.push(element?.foundational_data_type?.id)
                          defaultFoundationValues.push(foundational_value);
                        }
                      } else if (element?.entity_type === 'WORK_LOCATION') {
                        defaultWorkLocation = {
                          id: element?.entity_id,
                          entity_type: 'WORK_LOCATION',
                          entity_object: element?.entity_object
                        }
                        if(!this.assignmentId) {
                          this.assignmentCreateForm.patchValue({
                            work_location:  null
                          });
                        }
                      } else if(element?.entity_type === 'HIERARCHY' && !this.assignmentId ) {
                        setTimeout(() => {
                          if(!this.assignmentCreateForm.get('hierarchy_id')?.value) {
                            this.selectHierarchy([element?.entity_id], false);
                          } 
                        }, 4000);
                      }  
                    });
                  }
                }
                // this.selectedFoundationalData = [...defaultFoundationValues, ...this.sow_foundational_data];
                if (this.isClient) {
                  setTimeout(() => {
                    this.setSelectedFoundationalData([...defaultFoundationValues], foundationalFieldvalues);
                  }, 4000);
                } else {
                  this.setSelectedFoundationalData([...defaultFoundationValues], foundationalFieldvalues);
                }
                if (defaultWorkLocation && defaultWorkLocation?.entity_object) {
                  this.defaultWorkLocation(defaultWorkLocation);
                  this.setTimesheetTypeBasedOnWorkLocation(defaultWorkLocation?.entity_object);
                  this.getCandidateSourceType();
                }
              }
              resolve();
              // if(!this.assignmentId){
              // this.defaultWorkLocation(defaultWorkLocation);
              // } else {
              //   if(defaultWorkLocation && defaultWorkLocation?.entity_object)
              //   this.setTimesheetTypeBasedOnWorkLocation(defaultWorkLocation?.entity_object);
              // }
            }, error: (err) => {
              this.selectedFoundationalData = [];
            }
        })
      }
    })
  }

  setSelectedFoundationalData(newValues, newIds){
    this.foundationalFields.forEach(element => {
      if(!newIds.includes(element?.foundational_data_type_id ) && ((Array.isArray(element?.values) && element?.values?.length > 0 ) || (typeof element?.values == 'string' && element?.values))){
        newValues.push({
          foundational_data_type: {id: element?.foundational_data_type_id, name: element?.foundational_data_name, slug: element?.slug},
          id: (Array.isArray(element?.values) && element?.values?.length > 0) ? element.values[0] : element.values
          // name: element?.entity_object?.name,
          // code: element?.entity_object?.code,
          // custom_fields: element?.entity_object?.custom_fields
        })
      }
    });
    this.selectedFoundationalData = newValues;
  }

  setVendorMarkup = () => {
    if(this.assignmentId) {
      return;  // V2M-26414  added for this fix
    }
    if (this.selectedVendor) {
      const { markup_config } = this.selectedVendor;
      let { hierarchy_id, work_location, rate_model, billrate } = this.assignmentCreateForm.getRawValue();
      // let labor_category = this.selectedTemplate?.labor_category;
      hierarchy_id = hierarchy_id?.[0];
      billrate = this.accuracyPipe.transform(Number(billrate), this.accuracyConfig.rate, { isEdit: true});
      if (markup_config) {
        let configObj;
        if (!hierarchy_id && !work_location && !this.dropDownOptions['labor_category']) {
          configObj = markup_config.find(config => !config?.work_location?.id && !config?.hierarchy?.id && !config?.industry?.id && this.rateModelObj[rate_model] === config?.rate_model);
        } else {
          let markupConfig = [...markup_config];
          let defaultObj = markupConfig?.splice(0, 1);
          if(Array.isArray(defaultObj) && defaultObj?.length > 0){
            defaultObj= defaultObj[0];
          }
          configObj = markupConfig.find(config => {
            let flag = true;
            if (config?.hierarchy?.id) {
              flag = config?.hierarchy?.id === hierarchy_id;
            }
            if (config?.work_location?.id) {
              flag = config?.work_location?.id === work_location;
            }
            if (config?.industry?.id) {
              flag = this.dropDownOptions['labor_category'] == config?.industry?.id;
            }
            return flag;
          });

          configObj = configObj ?? defaultObj;
        }
        if (configObj) {
          const { candidate_sourcing_type } = this.assignmentCreateForm.getRawValue();
          const vendorMarkpValue: any = candidate_sourcing_type ? candidate_sourcing_type?.toLowerCase() === CANDIDATE_SOURCE_TYPE.SOURCED.toLowerCase() ? configObj?.markups?.sourced_markup : configObj?.markups?.payrolled_markup : configObj?.markups?.sourced_markup ?? configObj?.markups?.payrolled_markup;
          if (!configObj?.is_sliding_scale) {
            if (this.assignmentId && vendorMarkpValue !== +this.assignmentData?.assignments?.finance?.vendor_markup) {
              this.onMarkupChange();
            }
            this.assignmentCreateForm.get('vendor_markup').setValue(this.accuracyPipe?.transform(vendorMarkpValue, this.accuracyConfig.markup_percentage, { isEdit: true }));
            this.assignmentValueFor['markup'] = this.accuracyPipe?.transform(vendorMarkpValue, this.accuracyConfig.markup_percentage, { isEdit: true });
          } else {
            let markupValue = configObj?.markups?.find(markup => {
              const maxNo = (markup?.max == 'MAX' ? Number.MAX_VALUE : markup?.max);
              return (markup?.min < billrate) && (markup > maxNo)
            });
            if (markupValue) {
              markupValue = candidate_sourcing_type ? candidate_sourcing_type?.toLowerCase() === CANDIDATE_SOURCE_TYPE.SOURCED.toLowerCase() ? markupValue?.sourced_markup : markupValue?.payrolled_markup : markupValue?.sourced_markup ?? markupValue?.payrolled_markup;
              if (this.assignmentId && markupValue !== +this.assignmentData?.assignments?.finance?.vendor_markup) {
                this.onMarkupChange();
              }
              this.assignmentCreateForm.get('vendor_markup').setValue(this.accuracyPipe?.transform(markupValue, this.accuracyConfig.markup_percentage, { isEdit: true }));
              this.assignmentValueFor['markup'] = this.accuracyPipe?.transform(markupValue, this.accuracyConfig.markup_percentage, { isEdit: true });
            }
          }
        }
      }
    }

  }

  ngOnDestroy() {
    this.dataSourceUrl.forEach(item => {
      if (item?.subscription) {
        item?.subscription?.unsubscribe();
      }
    })
  }



  checkAndAssignActiveOn(formValue: any) {
    if (this.isVendor) {
      formValue.active_on = AssignmentActiveUpon.After_Approval;
    }
  }
  clearActiveOnValidationforVendor() {
    if (this.isVendor) {
      this.assignmentCreateForm.get('active_on').clearValidators();
    }
  }

  cancelPopOver() {
    if(!this.isPopoverOpen) {
      this.isPopoverOpen = true;
      this.otFactorsPopover = -1;
      this.popoverType = '';
    }
    if(this.isPopoverOpen) {
      this.isPopoverOpen = false;
    }
  }

  showPopOver(index: number, rate, rateType) {
    this.isPopoverOpen = true;
    this.rateFactorDetails(index, rate, rateType)
    if (this.otFactorsPopover === index && this.popoverType === rateType) {
      this.otFactorsPopover = -1;
      this.popoverType = '';
    } else {
      this.otFactorsPopover = index;
      this.popoverType = rateType;
    }
  }

  hidePopOver(rate, ratetype) {
    if (ratetype == "billrate") {
      rate.billrateactive = !rate.billrateactive;
    }
    else if (ratetype == "payrate") {
      rate.payrateactive = !rate.payrateactive;
    }
  }

  rateFactorDetails(index, rate, rateType) {
      let rate_factor_arr: RateFactorsWithEdit[] = this.activity_wise_rate_factors_arr[0] || [];
      this.tempRateFactor = rate_factor_arr?.find(ratefromarr => ratefromarr?.abbreviation?.toLowerCase() === rate?.get('rate_factor')?.value.toLowerCase());
      this.getUpdatedPayloadOnOTExemptChange([this.tempRateFactor])?.then(data => {
        if(data) {
          this.tempRateFactor = data?.[0];
          this.tempRateFactor = {...this.tempRateFactor,'index': index,'rate_type': rateType, 'rates':this.tempRateFactor[RATE_TYPE[`${rateType}`]] };
        }
      });
  }
  submitRateFactorModification(obj, index) {
    this.tempRateFactor.rates = obj;
    if (this.is_activity_based) {
      this.activityBasedRatesChangeASPerNewFactors(index,this.rate_factors_arr, this.tempRateFactor);
    }
    else if (!this.is_activity_based) {
      this.baseRatesChangeASPerNewFactors(index, this.rate_factors_arr, this.tempRateFactor);
    }
  }
  createLocalRateFactorArrForUpdation() {
    this.rate_factors_arr = [];
    if(this.rateFactor) {
      let rate_factor = JSON.parse(JSON.stringify(this.rateFactor));
      rate_factor?.forEach((rate) => {
        let rate_factors: RateFactors = { abbreviation: "", billable : true , applicable : true, bill_rate: [], pay_rate: []};
        if (this.markupByRateTypeEnabled) {
          rate_factors.markup = rate?.markup || this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
        }
        rate_factors.abbreviation = rate?.abbreviation?.toLowerCase();
        rate_factors.billable = rate?.hasOwnProperty('billable') ? rate?.billable : true;
        rate_factors.applicable = rate?.hasOwnProperty('applicable') ? rate?.applicable : true;
        if (rate?.bill_rate?.length > 0) {
          for (var i = 0; i < rate?.bill_rate?.length; i++) {
            let rateVal: RateVal = {
              factor: 0, rate_type: "", adjustment: rate.bill_rate[i]?.adjustment || null, adjustment_type: rate.bill_rate[i]?.adjustment_type || null
            };
            rateVal.factor = this.accuracyPipe.transform(rate?.bill_rate[i]?.factor, this.accuracyConfig.rate, { isEdit: true});
            rateVal.rate_type = rate?.bill_rate[i]?.rate_type;
            rate_factors?.bill_rate?.push(rateVal);
          }
  
        }
  
        if (rate?.pay_rate?.length > 0) {
          for (var i = 0; i < rate?.pay_rate?.length; i++) {
            let rateVal: RateVal = {
              factor: 0, rate_type: "" , adjustment: rate.pay_rate[i]?.adjustment || null, adjustment_type: rate?.pay_rate[i]?.adjustment_type || null
            };
            rateVal.factor = +this.accuracyPipe.transform(rate?.pay_rate[i]?.factor, this.accuracyConfig.rate, { isEdit: true});
            rateVal.rate_type = rate?.pay_rate[i]?.rate_type;
            rate_factors?.pay_rate?.push(rateVal);
          }
        }
        this.rate_factors_arr?.push(rate_factors);
      });
    }
    
  }
  duplicatereateLocalRateFactorArrForUpdation(data) {
    let rate_factors_arr = [];
    if(data) {
      let rate_factors = JSON.parse(JSON.stringify(data));
      rate_factors?.forEach((rate) => {
        let rateFactor= this.rate_factors_arr?.filter(rates=>rates?.abbreviation?.toLowerCase() ==rate?.abbreviation?.toLowerCase() )?.[0];
        let rate_factors: RateFactors = { abbreviation: "", billable : true , applicable : true, bill_rate: [], pay_rate: []};
        if(this.markupByRateTypeEnabled) {
          rate_factors.markup = this.assignmentId ? rateFactor?.markup :   rate?.markup || this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
        }
        rate_factors.abbreviation = rate?.abbreviation?.toLowerCase();
        rate_factors.billable = rate?.hasOwnProperty('billable') ? rate?.billable : true;
        rate_factors.applicable = rate?.hasOwnProperty('applicable') ? rate?.applicable : true;
        if (rate?.bill_rate?.length > 0) {
          for (var i = 0; i < rate?.bill_rate?.length; i++) {
            let rateVal: RateValWithEdit = {
              factor: 0, is_edit: false, rate_type: "", adjustment: rate.bill_rate[i]?.adjustment || null, adjustment_type: rate.bill_rate[i]?.adjustment_type || null
            };
            rateVal.factor = this.accuracyPipe.transform(rate?.bill_rate[i]?.factor, this.accuracyConfig.rate, { isEdit: true});
            rateVal.rate_type = rate?.bill_rate[i]?.rate_type;
            rate_factors?.bill_rate?.push(rateVal);
          }
  
        }
  
        if (rate?.pay_rate?.length > 0) {
          for (var i = 0; i < rate?.pay_rate?.length; i++) {
            let rateVal: RateValWithEdit = {
              factor: 0,is_edit: false, rate_type: "" , adjustment: rate.pay_rate[i]?.adjustment || null, adjustment_type: rate?.pay_rate[i]?.adjustment_type || null
            };
            rateVal.factor = +this.accuracyPipe.transform(rate?.pay_rate[i]?.factor, this.accuracyConfig.rate, { isEdit: true});
            rateVal.rate_type = rate?.pay_rate[i]?.rate_type;
            rate_factors?.pay_rate?.push(rateVal);
          }
        }
        // if (this._costComponentEnabled) {
        //   this.handleCostComponentDetails();
        // }
        rate_factors_arr?.push(rate_factors);
      });
      return rate_factors_arr;
    }
    
  }
  applyRateFactorsAsRecvd(index,rate_factors_recvd: any[], obj: any): any[] {
    rate_factors_recvd?.forEach((rate) => {
      if (rate.abbreviation === obj?.abbreviation?.toLowerCase()) {
        obj?.rates?.forEach((objrate) => {
          if (obj?.rate_type === "billrate") {
            for (var i = 0; i < rate?.bill_rate?.length; i++) {
              if (objrate.rate_type === rate?.bill_rate[i]?.rate_type) {
                if (obj?.abbreviation?.toLowerCase() !== RATETYPES.ST) {
                  rate.bill_rate[i].factor = objrate?.factor,
                  rate.bill_rate[i].adjustment_type = objrate?.adjustment_type,
                  rate.bill_rate[i].adjustment = objrate?.adjustment
                }
              }
            }
          }
          else if (obj?.rate_type === "payrate") {
            for (var i = 0; i < rate?.pay_rate?.length; i++) {
              if (objrate.rate_type === rate?.pay_rate[i]?.rate_type) {
                if (obj?.abbreviation?.toLowerCase() !== RATETYPES.ST) {
                  rate.pay_rate[i].factor = objrate?.factor
                  rate.pay_rate[i].adjustment_type = objrate?.adjustment_type,
                  rate.pay_rate[i].adjustment = objrate?.adjustment
                }
              }
            }
          }
        });
      }
    });
    if (this.dataSourceUrl['standard_rate_factor']) {
      if (this.dataSourceUrl['standard_rate_factor']?.abbreviation?.toLowerCase() == RATETYPES.ST) {
        let rate_factors: RateFactors = { abbreviation: "", billable : true , applicable : true , bill_rate: [], pay_rate: []};
        if (this.markupByRateTypeEnabled) {
          // rate_factors.markup = this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
          rate_factors.markup = this.assignmentValueFor['markup']? this.assignmentValueFor['markup']: this.assignmentCreateForm?.get('vendor_markup')?.value
        }
        rate_factors.abbreviation = this.dataSourceUrl['standard_rate_factor']?.abbreviation?.toLowerCase();
        if (this.dataSourceUrl['standard_rate_factor']?.bill_rate?.length > 0) {
          for (var i = 0; i < this.dataSourceUrl['standard_rate_factor']?.bill_rate?.length; i++) {
            let rateVal: RateVal = {
              factor: 0, rate_type: "", adjustment: this.dataSourceUrl['standard_rate_factor']?.bill_rate[i]?.adjustment || null, adjustment_type: this.dataSourceUrl['standard_rate_factor']?.bill_rate[i]?.adjustment_type || null
            };
            delete rateVal.factor;
            delete rateVal.rate_type;
            rate_factors?.bill_rate?.push(rateVal);
          }
        }
        if (this.dataSourceUrl['standard_rate_factor']?.pay_rate?.length > 0) {
          for (var i = 0; i < this.dataSourceUrl['standard_rate_factor']?.pay_rate?.length; i++) {
            let rateVal: RateVal = {
              factor: 0, rate_type: "", adjustment: this.dataSourceUrl['standard_rate_factor']?.pay_rate[i]?.adjustment || null, adjustment_type: this.dataSourceUrl['standard_rate_factor']?.pay_rate[i]?.adjustment_type || null
            };
            delete rateVal.factor;
            delete rateVal.rate_type;
            rate_factors?.pay_rate?.push(rateVal);
          }
        }
        let objIndex = rate_factors_recvd?.findIndex((objs => objs?.abbreviation?.toLowerCase() == RATETYPES.ST));
        if(objIndex != -1) {
          rate_factors_recvd[objIndex] = rate_factors;
        } else {
          rate_factors_recvd.push(rate_factors);
        }
      }
    }
    let activity_rate_factor_array_comp = this.activity_wise_rate_factors_arr[index];
    activity_rate_factor_array_comp?.forEach((rate) => {
      if (rate?.abbreviation?.toLowerCase() === obj?.abbreviation?.toLowerCase()) {
        obj?.rates?.forEach((objrate) => {
          if (obj?.rate_type === "billrate") {
            for (var i = 0; i < rate?.bill_rate?.length; i++) {
              if (objrate.rate_type === rate?.bill_rate[i]?.rate_type) {
                if (obj?.abbreviation?.toLowerCase() == RATETYPES.ST) {
                  delete rate.bill_rate[i].factor;
                  delete rate.bill_rate[i].rate_type;
                } else {
                  rate.bill_rate[i].factor = objrate?.factor
                }
                rate.bill_rate[i].adjustment_type = objrate?.amount_type || objrate?.adjustment_type,
                rate.bill_rate[i].adjustment = objrate?.amount_value || objrate?.adjustment
              }
            }
          }
          else if (obj?.rate_type === "payrate") {
            for (var i = 0; i < rate?.pay_rate?.length; i++) {
              if (objrate.rate_type === rate?.pay_rate[i]?.rate_type) {
                if (obj?.abbreviation?.toLowerCase() == RATETYPES.ST) {
                  delete rate.pay_rate[i].factor;
                  delete rate.pay_rate[i].rate_type;
                } else {
                  rate.pay_rate[i].factor = objrate?.factor
                }
                rate.pay_rate[i].adjustment_type = objrate?.amount_type || objrate?.adjustment_type,
                rate.pay_rate[i].adjustment = objrate?.amount_value || objrate?.adjustment
              }
            }
          }
        });
      }
    });
    
    return rate_factors_recvd;
  }
  returnRateName(rate) {
    if (rate != null && rate != undefined && rate?.rate_type != "") {
      return rate.rate_type === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
    }
    else {
      return "";
    }
  }
  getRateName(abbr, ratetype, index) {
    const tempRateFactor = this.rate_factors_arr?.find(rate => rate?.abbreviation?.toLowerCase() === abbr?.toLowerCase());
    if (ratetype === "billrate" && tempRateFactor?.bill_rate?.length > index) {
      return this.returnRateName(tempRateFactor?.bill_rate[index]);
    }
    else if (ratetype === "payrate" && tempRateFactor?.pay_rate?.length > index) {
      return this.returnRateName(tempRateFactor?.pay_rate[index]);
    }
    else return "";
  }
  getRateFactorVal(activityindex, abbr, ratetype, index) {
    let activity_rate_factor_array_comp: RateFactorsWithEdit[] = this.activity_wise_rate_factors_arr[activityindex];
    const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr?.toLowerCase());
    if (ratetype === "billrate" && tempRateFactor?.bill_rate?.length > index) {
      return this.accuracyPipe.transform(tempRateFactor?.bill_rate[index]?.factor, this.accuracyConfig.rate, { isEdit: true});
    }
    else if (ratetype === "payrate" && tempRateFactor?.pay_rate?.length > index) {
      return this.accuracyPipe.transform(tempRateFactor?.pay_rate[index]?.factor, this.accuracyConfig.rate, { isEdit: true});
    }
    else return "";

  }
  activityBasedRatesChangeASPerNewFactors(index,rate_factors_arr: RateFactors[], obj: any) {
    this.logs= undefined;
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup,
      ot_exempt_position
    } = formValues;

    let msp_fee_types = 0;
    let msp_fee_value = 0
    let funded_by = null;
    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe?.transform(feeArr[indexForMsp]?.amount_value, feeArr[indexForMsp]?.amount_type?.toLowerCase() === 'percentage' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { isEdit: true });
      funded_by =  feeArr[indexForMsp]?.funded_by;
    }

    const arrayValues = this.activityArray?.value;
    let bill_rate , pay_rate ,vendor_rate  = 0;
    let  is_fees_applicable = false;
    for (var i = 0; i < arrayValues?.length; i++) {

       bill_rate = arrayValues[i]?.activity_billrate;
       pay_rate = arrayValues[i]?.activity_payrate;
       vendor_rate = arrayValues[i]?.activity_vendor_rate;
       is_fees_applicable = arrayValues[i]?.is_fees_applicable;

    }

      if (adjusted_markup === null || vendor_markup === null) {
        return;
      }

      if ((obj.rate_type === 'billrate' && bill_rate === null) || (obj.rate_type === 'payrate' && pay_rate === null)) {
        return;
      }

      if (obj.rate_type === 'billrate' && !pay_rate) {
        pay_rate = 0;
      }
      if(is_fees_applicable) {
        let default_rate =  formValues?.default;
        if(default_rate?.length > 0 && default_rate[0]?.billrate) {
          bill_rate = default_rate[0]?.billrate || bill_rate;
        }
        if(default_rate?.length > 0 && default_rate[0]?.vendor_rate) {
          vendor_rate = default_rate[0]?.vendor_rate || vendor_rate;
        }
        if(default_rate?.length > 0 && default_rate[0]?.payrate) {
          pay_rate = default_rate[0]?.payrate || pay_rate;
        }
      }

      var payload = {
        "hierarchy": this.assignmentCreateForm.get('hierarchy_id')?.value?.length ? this.assignmentCreateForm.get('hierarchy_id')?.value[0] : "",
        "rate_model": rate_model,
        "adjusted_markup": this.accuracyPipe?.transform(adjusted_markup?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
        "vendor_markup": this.accuracyPipe?.transform(vendor_markup?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
        "client_bill_rate": this.accuracyPipe.transform(bill_rate ? bill_rate : 0, this.accuracyConfig.rate, { isEdit: true}),
        "vendor_bill_rate": this.accuracyPipe.transform(vendor_rate ? vendor_rate : 0, this.accuracyConfig.rate, { isEdit: true}),
        "candidate_pay_rate": this.accuracyPipe.transform(pay_rate ? pay_rate : 0, this.accuracyConfig.rate, { isEdit: true}),
        "max_bill_rate": 0,
        "min_bill_rate": 0,
        "abbreviation": obj?.abbreviation,
        "msp_fee_types": msp_fee_types,
        "msp_fee_value": msp_fee_value,
        "rate_factors": rate_factors_arr,
        "rate_input": this.returnRateInput(obj.rate_type),
        "ot_exempt": ot_exempt_position,
        "msp_fee_funded_by": funded_by,
        "is_markup_by_rate_type": this.markupByRateTypeEnabled,
        "is_cost_component": this._costComponentEnabled,
        'fee_details': []
      }
      if(funded_by === 'hybrid') {
        payload.fee_details = this.feeArray.getRawValue();
      } else {
         delete payload.fee_details;
      }
      
      payload.rate_factors = this.applyRateFactorsAsRecvd(index,rate_factors_arr, obj);
      this.getUpdatedPayloadOnOTExemptChange(payload.rate_factors).then((data) => {
      payload.rate_factors = data;
      if (this._costComponentEnabled) {
        const stRateFactor = payload.rate_factors.find(rf => rf?.abbreviation?.toLowerCase() === 'st');
        if (stRateFactor && !stRateFactor.cost_component) {
          stRateFactor.cost_component = this.assignmentCreateForm.get('cost_component')?.value;
          delete stRateFactor.cost_component?.markup;
        }
      }
      this.loader.show();
      this._formRendererService.post(`/core-money/programs/${this.programId}/rate-model?`, payload)
        .subscribe({next:(res: any) => {

          this.loader.hide();
          this.cancelPopOver();
          this.allDisableField['rate_estimate']=false;
          const { data } = res;
          const rateObj = data?.rate;
          if (this._costComponentEnabled) {
            this.updateCostComponentFormValues(rateObj);
          }
          const arrayValues = this.activityArray?.value;
          const ele = rateObj[obj.abbreviation?.toLowerCase()];
              const index = arrayValues[obj.index]?.rates?.findIndex(r => r?.rate_factor?.toLowerCase() === obj.abbreviation?.toLowerCase());
                if (index > -1) {
                  ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                    .at(obj.index).get('rates') as UntypedFormArray)
                    .at(index).patchValue({
                      billrate: this.accuracyPipe?.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true }),
                      payrate: this.accuracyPipe?.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true }),
                      vendor_rate: this.accuracyPipe?.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true })
                    });
                  // this.activityBaseRatesChangedForAbb(obj?.abbreviation, obj?.rate_type, obj?.index, 0);
                }
       
        }, error: (err) => {
          this.allDisableField['rate_estimate']=true;
          this.cancelPopOver();
          this.loader.hide();
          this.showError(err);

        }});
      });
    // }


  }

  baseRatesChangeASPerNewFactors(index: number, rate_factors_arr: RateFactors[], obj: any) {
    this.logs= undefined;
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup,
      billrate,
      payrate,
      ot_exempt_position,
      vendor_rate, 
      is_fees_applicable,  } = formValues;
    
    let msp_fee_types = 0;
    let msp_fee_value = 0
    let funded_by = null;
    if (!rate_model) {
      return;
    }

    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }

    if ((obj.rate_type === 'billrate' && billrate === null) || (obj.rate_type === 'payrate' && payrate === null)) {
      return;
    }

    if (obj.rate_type === 'billrate' && !payrate) {
      payrate = 0;
    }

    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe?.transform(feeArr[indexForMsp]?.amount_value, feeArr[indexForMsp]?.amount_type?.toLowerCase() === 'percentage' ? this.accuracyConfig.fee_percentage :this.accuracyConfig.fee, { isEdit: true });
      funded_by = feeArr[indexForMsp]?.funded_by;
    }
    if(is_fees_applicable) {
      let default_rate =  formValues?.default;
      if(default_rate?.length > 0 && default_rate[0]?.billrate) {
        billrate = default_rate[0]?.billrate || billrate;
      }
      if(default_rate?.length > 0 && default_rate[0]?.vendor_rate) {
        vendor_rate = default_rate[0]?.vendor_rate || vendor_rate;
      }
      if(default_rate?.length > 0 && default_rate[0]?.payrate) {
        payrate = default_rate[0]?.payrate || payrate;
      }
    }
  

      var payload = {
        "hierarchy": this.assignmentCreateForm.get('hierarchy_id')?.value?.length ? this.assignmentCreateForm.get('hierarchy_id')?.value[0] : "",
        "rate_model": rate_model,
        "adjusted_markup": this.accuracyPipe?.transform(adjusted_markup?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
        "vendor_markup": this.accuracyPipe?.transform(vendor_markup?? 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
        "client_bill_rate": this.accuracyPipe?.transform(billrate ? billrate : 0, this.accuracyConfig.rate, { isEdit: true }),
        "vendor_bill_rate": this.accuracyPipe?.transform(vendor_rate ? vendor_rate : 0, this.accuracyConfig.rate, { isEdit: true }),
        "candidate_pay_rate": this.accuracyPipe?.transform(payrate ? payrate : 0, this.accuracyConfig.rate, { isEdit: true }),
        "max_bill_rate": 0,
        "min_bill_rate": 0,
        "abbreviation": obj?.abbreviation,
        "msp_fee_types": msp_fee_types,
        "msp_fee_value": msp_fee_value,
        "rate_factors": rate_factors_arr,
        "rate_input": this.returnRateInput(obj.rate_type),
        "ot_exempt": ot_exempt_position,
        "msp_fee_funded_by" : funded_by,
        "is_markup_by_rate_type": this.markupByRateTypeEnabled,
        "is_cost_component": this._costComponentEnabled,
        'fee_details': []
      }
      if(funded_by === 'hybrid') {
        payload.fee_details = this.feeArray.getRawValue();
      } else {
         delete payload.fee_details;
      }
      payload.rate_factors = this.applyRateFactorsAsRecvd(index, rate_factors_arr, obj);
      this.loader.show();
      this.getUpdatedPayloadOnOTExemptChange(payload.rate_factors).then((data) => {
      payload.rate_factors = data;
      if (this._costComponentEnabled) {
        const stRateFactor = payload.rate_factors.find(rf => rf?.abbreviation?.toLowerCase() === 'st');
        if (stRateFactor && !stRateFactor.cost_component) {
          stRateFactor.cost_component = this.assignmentCreateForm.get('cost_component')?.value;
          delete stRateFactor.cost_component?.markup;
        }
      }
      this._formRendererService.post(`/core-money/programs/${this.programId}/rate-model?`, payload)
        .subscribe({next:(res: any) => {
          this.loader.hide();
          this.cancelPopOver();
          this.allDisableField['rate_estimate']=false;
          const { data } = res;
          const rateObj = data?.rate;
          if (this._costComponentEnabled) {
            this.updateCostComponentFormValues(rateObj);
          }
          const is_fees_applicable = data?.is_fees_included;
          const arrayValues = this.ratesArray.value;
          const ele = rateObj[obj.abbreviation.toLowerCase()];
          const index = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === obj.abbreviation.toLowerCase());
          if (index > -1) {
                this.ratesArray.at(index).patchValue({
                  billrate: this.accuracyPipe?.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true }),
                  payrate: this.accuracyPipe?.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true }),
                  vendor_rate: this.accuracyPipe?.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true }),
                  is_fees_applicable: is_fees_applicable,
                  default:   Object?.keys(ele?.default || {})?.length ?  [ele?.default]: null
                });
                // this.baseRatesChangedForAbb(obj.abbreviation, obj.rate_type);
              }
      
        },
        error: (err) => {
          this.allDisableField['rate_estimate']=true;
          this.cancelPopOver();
            this.loader.hide();
          this.showError(err);

        }});
    });
  }

  returnRateInput(rate: any) {
    if (rate === 'payrate') {
      return "candidate";
    } else if (rate === 'vendor_rate') {
      return "vendor";
    } else {
      return "client";
    }
  }
  createActivityWiseRateFactorsArray() {
    let rate_factors_arr: RateFactorsWithEdit[] = [];
    let rate_factor: any[] = [];
    if(this.rateFactor) {
    rate_factor = JSON.parse(JSON.stringify(this.rateFactor));
    rate_factor?.forEach((rate) => {
      let rate_factors: RateFactorsWithEdit = { abbreviation: "" , billable : true , applicable : true , bill_rate: [], pay_rate: [] };
      if (this.markupByRateTypeEnabled) {
        rate_factors.markup = rate?.markup || this.assignmentCreateForm?.get('vendor_markup')?.value || '0.0';
      }
      rate_factors.abbreviation = rate?.abbreviation;
      rate_factors.applicable = true;
      rate_factors.billable = rate?.billable;
      if (rate?.bill_rate?.length > 0) {
        for (var i = 0; i < rate?.bill_rate?.length; i++) {
          let rateVal: RateValWithEdit = {
            is_edit: false, factor: 0, rate_type: "", adjustment: rate?.bill_rate[i]?.adjustment || null, adjustment_type: rate?.bill_rate[i]?.adjustment_type || null
          };
          rateVal.factor = rate?.bill_rate[i]?.factor;
          rateVal.rate_type = rate?.bill_rate[i]?.rate_type;
          rate_factors?.bill_rate?.push(rateVal);
        }

      }

      if (rate?.pay_rate?.length > 0) {
        for (var i = 0; i < rate?.pay_rate?.length; i++) {
          let rateVal: RateValWithEdit = {
            is_edit: false, factor: 0, rate_type: "", adjustment: rate?.pay_rate[i]?.adjustment || null, adjustment_type: rate?.pay_rate[i]?.adjustment_type || null
          };
          rateVal.factor = rate?.pay_rate[i]?.factor;
          rateVal.rate_type = rate?.pay_rate[i]?.rate_type;
          rate_factors?.pay_rate?.push(rateVal);
        }
      }
      rate_factors_arr?.push(rate_factors);
    });
  }
    if (rate_factor?.length > 0) {
      this.activity_wise_rate_factors_arr?.push(rate_factors_arr);
    }
  }
  updateActivityWiseRateFactorsArray(rates_from_assignment: any[]) {
    this.activity_wise_rate_factors_arr = [];
    let rate_factor: any[] = [];
    rate_factor = JSON.parse(JSON.stringify(rates_from_assignment ? rates_from_assignment : [] ));
    for (var i = 0; i < rate_factor?.length; i++) {
      this.activity_wise_rate_factors_arr[i] = rate_factor[i]?.rate_factors;
    }
    if(this.activity_wise_rate_factors_arr) {
      this.final_activity_wise_rate_factors_arr = JSON.parse(JSON.stringify(this.activity_wise_rate_factors_arr));
    }
  }
  updatefinalactivityBasedRateFactorsArray() {
    if (this.assignmentId) {
      for (var i = 0; i < this.final_activity_wise_rate_factors_arr?.length; i++) {
        let final_arr_comp = this.final_activity_wise_rate_factors_arr[i];
        let acti_arr_comp = this.activity_wise_rate_factors_arr[i];
        for (var j = 0; j < final_arr_comp?.length; j++) {
          let finalrf: RateFactorsWithEdit = final_arr_comp[j];
          let actrf: RateFactorsWithEdit = acti_arr_comp[j];
          for (var k = 0; k < finalrf?.bill_rate?.length; k++) {
            if (finalrf?.bill_rate?.[k]?.factor && actrf?.bill_rate?.[k]?.factor && parseFloat(finalrf?.bill_rate?.[k]?.factor?.toString()) != parseFloat(actrf?.bill_rate?.[k]?.factor?.toString())) {
              finalrf.bill_rate[k].factor = actrf?.bill_rate?.[k]?.factor;
              finalrf.bill_rate[k].is_edit = true;
            }
          }
          for (var k = 0; k < finalrf?.pay_rate?.length; k++) {
            if (finalrf?.pay_rate?.[k]?.factor && actrf?.pay_rate?.[k]?.factor && parseFloat(finalrf?.pay_rate?.[k]?.factor?.toString()) != parseFloat(actrf?.pay_rate?.[k]?.factor?.toString())) {
              finalrf.pay_rate[k].factor = actrf?.pay_rate?.[k]?.factor;
              finalrf.pay_rate[k].is_edit = true;
            }
          }
        }
      }
    }
    else {
      this.final_activity_wise_rate_factors_arr = this.activity_wise_rate_factors_arr;
    }
  }

  updateForOTExemptfinalactivityBasedRateFactorsArray() {
    if (this.assignmentId) {
      let data =  JSON.parse(JSON.stringify(this.rate_factors_arr));
      let final_arr_comp = data;
      for (var i = 0; i < this.rate_factors_arr?.length; i++) {

      
        let acti_arr_comp = this.assignmentData?.assignments?.finance?.rate_factor?.[0]?.rate_factors;
        for (var j = 0; j < final_arr_comp?.length; j++) {
          let finalrf: RateFactorsWithEdit = final_arr_comp[j];
          let actrf: RateFactorsWithEdit = acti_arr_comp[j];
          for (var k = 0; k < finalrf?.bill_rate?.length; k++) {
            if (finalrf?.bill_rate?.[k]?.factor && actrf?.bill_rate?.[k]?.factor && parseFloat(finalrf?.bill_rate?.[k]?.factor?.toString()) != parseFloat(actrf?.bill_rate?.[k]?.factor?.toString())) {
              // finalrf.bill_rate[k].factor = actrf?.bill_rate?.[k]?.factor;
              finalrf.bill_rate[k].is_edit = true;
            }
          }
          for (var k = 0; k < finalrf?.pay_rate?.length; k++) {
            if (finalrf?.pay_rate?.[k]?.factor && actrf?.pay_rate?.[k]?.factor && parseFloat(finalrf?.pay_rate?.[k]?.factor?.toString()) != parseFloat(actrf?.pay_rate?.[k]?.factor?.toString())) {
              // finalrf.pay_rate[k].factor = actrf?.pay_rate?.[k]?.factor;
              finalrf.pay_rate[k].is_edit = true;
            }
          }
        }
      }
       return final_arr_comp;
    }
    else {
      // this.final_activity_wise_rate_factors_arr = this.activity_wise_rate_factors_arr;
    }
  }
  returnRateFactorsArray() {
    let final_rate_facotrs_array: any[] = [];
    this.updatefinalactivityBasedRateFactorsArray();
    for (var i = 0; i < this.final_activity_wise_rate_factors_arr?.length; i++) {
      final_rate_facotrs_array?.push({ rate_factors: this.final_activity_wise_rate_factors_arr[i] || [] });
    }
    if (this.final_activity_wise_rate_factors_arr?.length < this.activity_wise_rate_factors_arr?.length) {
      for (var i = this.final_activity_wise_rate_factors_arr?.length - 1; i < this.activity_wise_rate_factors_arr?.length; i++) {
        final_rate_facotrs_array?.push({ rate_factors: this.activity_wise_rate_factors_arr[i] || [] });
      }

    }
    return final_rate_facotrs_array;
  }


  getSortRates(rate_factors) {
    let sortRates: any = [...(rate_factors || [])];
    const getOTIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.OT);
    const getDTIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.DT);
    const getHPIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.HP);
    if (getOTIndex >= 0) {
      sortRates[getOTIndex].position = 1;
    }
    if (getDTIndex >= 0) {
      sortRates[getDTIndex].position = 2;
    }
    if (getHPIndex >= 0) {
      sortRates[getHPIndex].position = 3;
    }
    return sortRates.sort((a, b) => a.position - b.position);
  }

  getApprovalConfig() {
    this._formRendererService.get(`/configurator/programs/${this.programId}/config?entity_code=approval_assignment`).subscribe(res => {
      const { config } = res;
      this.approvalConfig = config;
    });
  } 

  get getApprovalStatus() {
    return this.approvalConfig && this.approvalConfig?.events?.create?.trigger &&
    this.assignmentCreateForm?.get('hierarchy_id')?.value?.length > 0 &&
    !this.approvalConfig?.events?.create?.exclude_if?.hierarchy?.includes(this.assignmentCreateForm?.get('hierarchy_id')?.value[0]) &&
    !this.approvalConfig?.events?.create?.exclude_if?.active_on?.includes(this.assignmentCreateForm?.get('active_on')?.value) &&
    ((this.assignmentCreateForm?.get('sourcing_model')?.value?.toLowerCase() == SOURCING_TYPE.SOW &&
    !this.approvalConfig?.events?.create?.exclude_if_option?.sourcing_model?.sow?.user_type?.includes(this.user_type?.toLowerCase())) || this.assignmentCreateForm?.get('sourcing_model')?.value?.toLowerCase() !== SOURCING_TYPE.SOW);
  }
  onCloseSideBar =(value:string) =>{
    this.showAccountCode = 'hidden';
  }
  onAccountCodeSideBarClose = (value : AccountCodeData) =>{
    this.showAccountCode = 'hidden';
    if(value?.is_validated){
      this.accountCode = value;
      this.assignmentCreateForm.patchValue({
        account_code : this.accountCode.account_code,
      })
    }else {
      this.accountCode = value;
      this.assignmentCreateForm.patchValue({
        account_code : null,
      })
    }
  }

  public rejectUpdate() {
    this.isOpenReject = true;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.REJECT_BUDGET, true));
    });
  }

  public closeReject() {
    this.isOpenReject = false;
  }
 
  public rejectApprovalRequest({ value, type }) {
    this.pending_review = {
      approval_status: {
        status: "REJECTED",
        status_reason: value.status_reason,
        status_note : value.status_note,
        is_forced_approval : true,
        workflow_action :"DEFAULT",
        approval_chain_id: null,
        status_reason_txt: value.status_reason_txt
      }
    };
    this.showPopup();
  }

  savePendingReview() {
    this.pending_review = {
      approval_status: {
        status: "APPROVED",
        is_forced_approval: false,
        workflow_action: "DEFAULT"
      }
    }
    this.showPopup();
  }
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.currency, accuracyType);
  }
  updateToggle($event)  {
    // this.allDisableField['disableSaveButton'] = $event;
    this.allDisableField['resume'] = !$event;
  }
  markupFieldValiator() {
    if (this.assignmentControl?.rate_model?.value?.toLowerCase() === 'markup' || this.assignmentControl?.rate_model?.value?.toLowerCase() === 'payrate') {
      this.assignmentCreateForm.get('adjusted_markup').setValidators([
        Validators.required
      ]);
    }
  }
  showHideDetailButton() {
    this.dropDownOptions['showHideDetails'] = !this.dropDownOptions['showHideDetails'];
  }

  addTaxDetails() {
    let applicable_on = this.programDetails?.config?.hasOwnProperty('tax_applicable_on')&&this.programDetails?.config?.tax_applicable_on ?this.programDetails?.config?.tax_applicable_on : this.applicable_on;
    let calculated_on =  this.programDetails?.config?.hasOwnProperty('tax_calculated_on') && this.programDetails?.config?.tax_calculated_on ?this.programDetails?.config?.tax_calculated_on : applicable_on;
    const taxForm = this.fb.group({
      entity_name: ['', [Validators.required, this.noWhitespaceValidator]],
      name: [''],
      amount_value: ['', Validators.required],
      amount_type: ['percentage'],
      applicable_on: [applicable_on?.toLowerCase()],
      calculated_on: [calculated_on?.toLowerCase()],
      config_type: ['custom']
    });
    let taxArray = this.assignmentCreateForm.get('tax') as UntypedFormArray;
    taxArray.push(taxForm);
    this.assignmentCreateForm.updateValueAndValidity();    
  }
  removeTaxDetails(tax, index) {    
    this.confirmService
      .confirm('', `Do you want to remove ${tax.get('entity_name')?.value || 'selected entity'} ?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          if (index !== -1) {
            const control = this.assignmentCreateForm.get('tax') as UntypedFormArray;
            const isTaxPresent = this.assignmentData?.assignments?.assignment?.tax?.filter(res => res?.entity_name?.toLowerCase()?.trim() === tax.get('entity_name')?.value?.toLowerCase()?.trim());
            if (this.assignmentId && tax.get('entity_name')?.value && tax.get('amount_value')?.value && isTaxPresent?.length) { 
              tax.addControl('is_deleted', new UntypedFormControl(true)) 
            }
            else {
              control?.removeAt(index)
            };
            this.resetEffectiveDate();
            this.recalcualatebudget();
          }
        }
      })
      .catch(() => {});
  }

  public noWhitespaceValidator(control: AbstractControl) {
    if (control?.value?.length === 0) {
      return null;
    }
    const isWhitespace = (control?.value || '')?.trim()?.length === 0; 
    const isValid = !isWhitespace; 
    return isValid ? null : { 'whitespace': true };
}

  checkTaxAmountValue(value, i) {
    let taxData = this.assignmentCreateForm.get('tax') as UntypedFormArray;
    if (value > 100) {
      taxData.at(i)?.get('amount_value')?.setErrors({ 'invalidAmount': true });
    } else {
      taxData.at(i)?.get('amount_value')?.setErrors(null);
    }
    if(!value) {
      taxData.at(i)?.get('amount_value')?.setErrors({ 'invalidAmount': true });
    }
  }

  clearHierarchy(){
    this.assignmentCreateForm.get('hierarchy_name').setValue(null);
    this.assignmentCreateForm.get('hierarchy_id').setValue(null);
    this.selectedHierarchy=[];
    this.selectedHierachyObj = null;
  }
  
  managerChange(event,slug,allowSingleSelectionOnly = false){
    if(allowSingleSelectionOnly ? allowSingleSelectionOnly : this.assignmentValueFor['maxSelectedItems']==1){
      const index= event?.length == 1 ? 0: 1;
      this.assignmentCreateForm.get(slug).setValue([event[index]]);
    }
    this.search(slug , '');
  }


  flattenHierarchyArray(data){
    data?.forEach(elem => {
      if (!this.dropDownOptions['hierarchy_array']) {
        this.dropDownOptions['hierarchy_array'] = new Array()
      }
      this.dropDownOptions['hierarchy_array'].push(elem);
      if (elem?.hierarchies?.length) {
        this.flattenHierarchyArray(elem?.hierarchies);
      } 
    });
  }

  remoteWorkerValueChanged() {
    let group = this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup;
    if (this.assignmentCreateForm.get('remote_worker')?.value) {
      this.getAllCountry().then((res) => {
        group.get('country').addValidators(Validators.required);
        if(this.selectedCandidate?.addresses?.filter(res => res?.type?.toLowerCase() === 'primary').length) {
          group.get('country').setValue(this.selectedCandidate.addresses?.filter(res => res?.type?.toLowerCase() === 'primary')[0]?.country || null);
          group.get('city').setValue(this.selectedCandidate.addresses?.filter(res => res?.type?.toLowerCase() === 'primary')[0]?.city || null);
          group.get('state').setValue(this.selectedCandidate.addresses?.filter(res => res?.type?.toLowerCase() === 'primary')[0]?.state || null);
          group.get('county').setValue(this.selectedCandidate.addresses?.filter(res => res?.type?.toLowerCase() === 'primary')[0]?.county || null);
          this.getAllCounty(); this.getAllStates();
        }
      });
    } else {
      group.get('country').clearValidators();
      this.assignmentCreateForm.get('timesheet_type').setValue(null);
    }
    this.getTimesheetTypeDetails();
    group.get('country').updateValueAndValidity();
  }
  getNestedGroupControl(parent) {
   return (this.assignmentCreateForm.get(parent) as UntypedFormGroup).controls;
  }
  getAllCountry(term?) {
    return new Promise<void>((resolve) => {
      let res = `/configurator/resources/countries?limit=300&search_text=${term?.term || ''}`;
      this.assignmentService.get(res).subscribe({next : res => {
        this.assignmentValueFor['allCountryList'] = res['countries'];
        if(this.assignmentId) {
          this.getAllCounty().then(() => {
           this.getAllStates().then(() => {
             resolve();
           });
          });
        } else {
          resolve();
        }
      }, error : (err) => {
        this.assignmentValueFor['allCountryList'] = null;
        resolve();
      }});
    })
  }
  getAllCounty(term?) {
   return new Promise<void> ((resolve) => {
    let country_uuid = this.assignmentValueFor['allCountryList'].filter(res => res?.name?.toLowerCase() === (this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup).get('country').value?.toLowerCase()).map(res => res?.id).join(',');
    let res = `/configurator/resources/counties?limit=300&country_ids=${country_uuid || ''}&search_text=${term?.term || ''}`;
    this.assignmentService.get(res).subscribe({next : res => {
      this.assignmentValueFor['allCountyList'] =  res['counties']; 
      resolve();
    }, error : (err) => {
      this.assignmentValueFor['allCountyList'] = null;
      resolve();
    }});
   })
  }
  getAllCities(term?) {
   return new Promise<void> ((resolve) => {
    let state_uuid = this.assignmentValueFor['allStatesList'].filter(res => res?.name?.toLowerCase() === (this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup).get('state').value?.toLowerCase()).map(res => res?.id).join(',');
    let res = `/configurator/resources/cities?limit=300&state_ids=${state_uuid || ''}&search_text=${term?.term || ''}`;
    this.assignmentService.get(res).subscribe({next : res => {
      this.assignmentValueFor['allCitesList'] =  res['cities']; 
      resolve();
    }, error : (err) => {
      this.assignmentValueFor['allCitesList'] = null;
      resolve();
    }})
   })
  }
  getAllStates(term?) {
   return new Promise<void>((resolve) => {
    let country_uuid = this.assignmentValueFor['allCountryList'].filter(res => res?.name?.toLowerCase() === (this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup).get('country').value?.toLowerCase()).map(res => res?.id).join(',');
    let res = `/configurator/resources/states?limit=300&country_ids=${country_uuid || ''}&search_text=${term?.term || ''}`;
    this.assignmentService.get(res).subscribe({next : res => {
      this.assignmentValueFor['allStatesList'] =  res['states']; 
      if(this.assignmentId) {
        this.getAllCities().then(() => {
          resolve();
        });
      } else {
        resolve();
      };
    } , error : (err) => {
      this.assignmentValueFor['allStatesList'] = null;
      resolve();
    }})
   })
  }
  setDataOfRemoteDataWorker(fieldName) {
    let group = this.assignmentCreateForm.get('remote_worker_details') as UntypedFormGroup;
    if(fieldName === 'country') {
      group.get('county').setValue(null);
      group.get('state').setValue(null);
      group.get('city').setValue(null);
      this.getAllCounty();
      this.getAllStates();
    } else if(fieldName === 'state') {
      group.get('city').setValue(null);
      this.getAllCities();
    }
  }
  viewTasks() {
    this.eventStream.emit(new EmitEvent(Events.VIEW_TASKS, true));
  }
  getOnboardingChecklist() {
    const formValue = this.assignmentCreateForm.getRawValue();
    let { work_location, hierarchy_id, assignment_title_uuid ,sourcing_model  } = formValue;
    if (assignment_title_uuid && this.checkAuthorization(this.assignmentPermissions.MANAGE_ONBOARDING_ASSIGNMENT)) {
      const payload = {
        location_id: work_location,
        job_template_id: assignment_title_uuid,
        hierarchy_id: hierarchy_id[0],
        template_checklist_id:  null,
        program_industry: this.dropDownOptions['labor_category'],
        sourcing_model: sourcing_model ? sourcing_model?.toLowerCase() : null
      }
      let url = `/onboarding-manager/programs/${this.programId}/onboarding/assignments/checklist-tasks `;
      this._formRendererService.post(url, payload).subscribe((data: any) => {
        this.dropDownOptions.checklist = new Array();
        if (data && data?.checklists && data?.checklists?.length > 0  ) {
          this.dropDownOptions.checklist = data?.checklists  || [];
          this.assignmentCreateForm.patchValue({onboarding_checklist_id:  this.dropDownOptions?.checklist[0]?.id})
          this.dropDownOptions.selectedOnboardingItem = this.dropDownOptions?.checklist[0];
        } 
      })
    }
  }
  getUpdatedValue(event){
    this.assignmentCreateForm.patchValue({
      onboarding_checklist_id: event?.id
    });
    this.dropDownOptions.selectedOnboardingItem = event;
  }
  setOnboardingItem(event) {
    this.dropDownOptions.selectedOnboardingItem = event;

  }
  getClosedOnboarding(event){
    this.dropDownOptions.selectedOnboardingItem = event;
  }
  getAllWorkLocation(term?) {
    const formValue = this.assignmentCreateForm.getRawValue();
    let { hierarchy_id,} = formValue;
    let url = WORK_LOC_URL.replace('${programId}', this.programId); 
    url = url + `hierarchy=${hierarchy_id[0]}`;
    if(term) {
       url += `&k=${term?.term}`
    }
    this.assignmentService.get(url).subscribe({next : (res:any) => {
      if(res) {
        this.dropDownOptions.allWorkLocations = res?.work_locations;
        if(!this.assignmentValueFor['is_all_work_locations']) {
          this.dropDownOptions.work_location = this.dropDownOptions.defaultWorkLocation;
        } else {
          this.dropDownOptions.work_location = this.dropDownOptions.allWorkLocations;
        }
        if (this.dropDownOptions?.work_location?.length === 1  && !this.assignmentId ) {
          this.assignmentCreateForm.patchValue({
            work_location: this.dropDownOptions.work_location[0]?.id
          });
        }
        this.removeWorkLocationDuplicate();
        // this.assignmentValueFor['is_all_work_locations'] ?  this.dropDownOptions.allWorkLocations = res?.work_locations: this.dropDownOptions.work_location = this.dropDownOptions.defaultWorkLocation;
       
      }
    } , error : (err) => {
      this.dropDownOptions.allWorkLocations = new Array();
    }})
  }
  createTaxAdjustmentForm() {
    const assignment = this.assignmentData?.assignments?.assignment || null;
    const adjustedFees = assignment?.tax?.filter(t => t.entity_type === 'adjustment_fee') || [];
      const TaxAdjustmentfeeForm = this.fb.group({
        amount_type: [ AmountType.fixed_amount ],
        applicable_on: [this.programDetails?.config?.adjustment_fee_applicable_on],
        calculated_on: [this.programDetails?.config?.adjustment_fee_calculated_on],
        entity_name: ['ACA'],
        name: ['ACA Fees'],
        amount_value: [this.accuracyPipe?.transform(adjustedFees?.length > 0 ? adjustedFees[0].amount_value: 0 ,  this.accuracyConfig.adjustment, { isEdit: true })],
        entity_type: "adjustment_fee"
      });
      let formArray = this.assignmentCreateForm.get('adjustment_fee') as UntypedFormArray;
      formArray.push(TaxAdjustmentfeeForm);
    }
    sortRateFactor(orderArray, arrayToSort) {
      return arrayToSort?.sort((a, b) => {
        const indexA = orderArray?.findIndex(obj => obj?.abbreviation?.toLowerCase() === a?.rate_factor?.toLowerCase());
        const indexB = orderArray?.findIndex(obj => obj?.abbreviation?.toLowerCase() === b?.rate_factor?.toLowerCase());
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    getActiveClass(status) {
      if (status?.toLowerCase()?.indexOf(JobStatus.PENDING_APPROVAL_SOURCING?.toLowerCase()) > -1) {
        status = 'pending-approval-sourcing';
      } else if (status?.toLowerCase() === JobStatus.OPEN?.toLowerCase()) {
        status = 'open';
      } else if (status?.toLowerCase() === JobStatus.DEFAULT?.toLowerCase()) {
        status = 'default';
      } else if (status?.toLowerCase() === JobStatus.PENDING_APPROVAL?.toLowerCase()) {
        status = 'pending-approval';
      } else if (
        status?.toLowerCase() ===JobStatus.CLOSED?.toLowerCase() ||
        status?.toLowerCase() === JobStatus.FILLED?.toLowerCase()
      ) {
        status = 'closed';
      } else if (status?.toLowerCase() === JobStatus.HOLD?.toLowerCase()) {
        status = 'hold';
      } else if (status?.toLowerCase() === JobStatus.REJECTED?.toLowerCase()) {
        status = 'rejected';
      } else if (status?.toLowerCase() === JobStatus.SOURCING?.toLowerCase()) {
        status = 'sourcing';
      } else if (status?.toLowerCase() === JobStatus.HALTED?.toLowerCase()) {
        status = 'halted';
      } else if (status?.toLowerCase() === JobStatus.PENDING_REVIEW?.toLowerCase()) {
        status = 'pending-review';
      }
      return status?.toLowerCase();
    }
    applyAccuracy(formControlName , accuracyType , formControlToUpdate , i? ) {
       if(formControlToUpdate === 'adjusted_amount') {
        this.TaxAdjustmentFees.at(0).patchValue({
          amount_value: (this.accuracyPipe.transform(formControlName?.controls?.amount_value?.value || 0, this.accuracyConfig[accuracyType] , {isEdit : true}))
        });
      }
      if(formControlToUpdate === 'amount_value') {
        this.feeArray?.at(i)?.patchValue({
          amount_value: this.accuracyPipe.transform(formControlName?.controls?.amount_value?.value || 0, (accuracyType?.toLowerCase()) === 'percentage' ? this.accuracyConfig['fee_percentage'] : this.accuracyConfig['fee'] , {isEdit : true})
        });
      }
    }
    getSsoIdConfig(worker) {
      const worker_org_id = worker?.user?.organization?.id;
      if(!worker_org_id) {
        return;
      }
      this.assignmentService.getSsoIdConfig(worker_org_id).subscribe({next : (res:any) => {
        if(res) {
          this.assignmentValueFor['show_ssoId']= res?.worker_sso_update_allowed;
        }
      } , error : (err) => {
      }})
    }
    getSupportingList() {
      let url = `/configurator/programs/${this.assignmentValueFor['currentProgram']?.id}/support/support_text`;
      let param = {};
      param['event_slug'] = this.assignmentId ? 'update_assignment' : 'create_assignment';
      param['performed_by'] = this.user_type?.toUpperCase() !== UsersType.SUPER_ORG ? this.user_type?.toUpperCase() : `${UsersType.CLIENT},${UsersType.MSP}`;
      return this.assignmentService.get(url,param).subscribe((data : any) => {
        data?.support_text_data
        .find(support => support.event.slug === param['event_slug'])
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
      })
    }
    getJobTypeDependentValue(event) {
      if(event && event?.length > 0) {
        this.getCandidates({ term: '' });
        this.getVendorList();
      } else {
       this.assignmentCreateForm.get('candidate_uuid').reset();
       this.assignmentCreateForm.get('vendor_id').reset();
       this.selectedVendor = null;
       this.selectedCandidate = null;
       this.updateCandidateWorkerDetails();
      }

    }

    getVendorList(term?) {
      const formValue = this.assignmentCreateForm.getRawValue();
      let {job_type} = formValue;
      let url = `/configurator/programs/${this.programId}/vendors?ordering=organization__name&active=true&exclude_dsaas_vendor=true`; 
      // url = url + `hierarchy=${hierarchy_id[0]}`;
      if(term) {
         url += `&k=${term?.term}`
      }
      if(job_type?.length && Array.isArray(job_type)) {
        url+= `&job_type=${job_type?.join(',')}`
      }
      this.assignmentService.get(url).subscribe({next : (res:any) => {
        if(res) {
          this.dropDownOptions.vendor_id = res?.program_vendors; 
        }
      } , error : (err) => {
        this.dropDownOptions.vendor_id = new Array();
      }})
    }
}





