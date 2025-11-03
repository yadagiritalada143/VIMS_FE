import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { AmountType } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentService } from '../assignment.service';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
import { AssignmentActiveUpon } from '../enums/assignment-active-upon';

export enum PROGRAM_TYPE {
  SELF_SERVICED = 'SELF-SERVICED',
  MSP_MANAGED = 'MSP-MANAGED'
}

export enum SOURCING_TYPE {
  SOW = 'sow'
}
const WORK_LOC_URL = '/configurator/programs/${programId}/work-locations?status=true&order_by=asc&';

@Component({
  selector: 'app-create-quick-assignment',
  templateUrl: './create-quick-assignment.component.html',
  styleUrls: ['./create-quick-assignment.component.scss']
})
export class CreateQuickAssignmentComponent implements OnInit {

  constructor(private _formRendererService: FormRendererService, private fb: UntypedFormBuilder,
    private _storageService: StorageService, private changeDetectorRef: ChangeDetectorRef,
    private alert: AlertService, private router: Router, private loader: LoaderService,
    private activatedRoute: ActivatedRoute, private assignmentService: AssignmentService, private accuracyPipe: AccuracyPipe,
    private reasonCodesService: ReasonCodesService, private eventStream: EventStreamService, private datePipe: LocalDateFormatPipe) {
  }
  activeTab = "basic-info";
  manageTimesheet = false;
  manageExpense = false;
  manageBillable = true;
  welcomeEmail = true;
  rateFactorEdit = false;
  popoverActive = false;
  popover;
  editActivity: any;
  programId: string;
  is_activity_based = false;
  is_Sourcing_Model_SOW: any;
  existingSOW: any = [];
  existingSOWProject: any = [];
  accuracyConfig = AccuracyConfigEnum;
  dataSourceUrl = [
    {
      'slug': 'vendor_id',
      'datasource': {
        'url': '/configurator/programs/${programId}/vendors?k=',
        'type': 'url',
        'getBy': [
          'program_vendors'
        ]
      },

    },
    {
      'slug': 'source_type',
      'datasource': {
        'type': 'picklist',
        'options': [
          {
            'id': 'ee21ce38-2c1a-4056-9254-837fd1ba99cc',
            'slug': 'migrated_worker_data',
            'label': 'Migrated Worker Data'
          },
          {
            'id': 'dd84f65a-6a28-42f3-85cd-9991a01049f0',
            'slug': 'new_worker',
            'label': 'New Worker'
          }
        ]
      },
      "bind_value": "slug",
    },
    {
      'slug': 'sourcing_model',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=assignment_sourcing_model',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
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
      'slug': 'assignment_title_uuid',
      'datasource': {
        'url': '/job-manager/programs/${programId}/job-templates?page=1&limit=10&order_by=desc&key=ref_title&template_name=',
        'type': 'url',
        'getBy': [
          'job_templates'
        ]
      },
      "bind_value": "id",
    }, {
      'slug': 'work_location',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&order_by=asc&k=',
        'type': 'url',
        'getBy': [
          'work_locations'
        ]
      },
      "bind_value": "id",
    }, {
      'slug': 'assignment_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&order_by=asc&k=',
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
      'slug': 'shift_timing',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=shift_timing',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'worker_classification',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=worker_classification',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'timesheet_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&order_by=asc&k=',
        'type': 'url',
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
    },
    {
      'slug': 'days_per_week',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=no_of_working_days_week',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'timesheet_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=timesheet_type',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "value",
    },
    {
      'slug': 'expense_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&order_by=asc&k=',
        'type': 'url',
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
    },
    {
      'slug': 'rate_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=unit_of_measure',
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
    }
  ];
  dropDownOptions: any = {};
  isWorkerIncluded: boolean = false;
  programType: any;
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
    candidate_uuid: [null, Validators.required],
    vendor_id: [null, Validators.required],
    source_type: [null, Validators.required],
    source_id: [],
    original_start_date: ['', Validators.required],
    official_email: ['', Validators.required],
    sso_id: [],
    worker_classification: [null],
    hierarchy_id: ['', Validators.required],
    hierarchy_name: [],
    sourcing_model: [null, Validators.required],
    job_id: [],
    sow_id: [],
    sow_project_id: [],
    assignment_title_uuid: [null, Validators.required],
    work_location: [null, Validators.required],
    assignment_manager: [null, Validators.required],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    worker_original_start_date: ['', Validators.required],
    shift_timing: [{
      value: null,
      disabled: true
    }],
    timesheet_manager: [null, Validators.required],
    timesheet_type: [null, Validators.required],
    st_hours: [8],
    days_per_week: [5, Validators.required],
    expense_manager: [{
      value: null,
      disabled: false
    }],
    ot_exempt_position: [{
      value: false,
      disabled: false
    }],
    rate_model: [null, Validators.required],
    rate_type: [null, Validators.required],
    currency: [null, Validators.required],
    adjusted_markup: [0],
    vendor_markup: [0],
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
    net_allocated_budget: [0],
    is_timesheet_enabled: [true],
    is_quick_assignment: [true],
    is_billable: [true],
    is_account_required: false,
    is_expense_enabled: true,
    active_on: [null, Validators.required]
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
  applicableOn = [{
    'id': 'dd84f65a-6a28-42f3-85cd-9991y01049a1',
    'slug': 'vendor_bill_rate',
    'label': 'Vendor Bill Rate'
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
  allDateFieldDisable = {};
  currency = '';
  dateFormat = 'dd/MM/yyyy';
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
  sow_id: string;
  sow_project_id: string;
  showWelcomeEmail: boolean = true;
  programTypeRateModel = {
    'BILL_RATE':'billrate' ,
    'MARKUP':'markup',
    'PAY_RATE': 'payrate'
  }
  programDetails: any;

  ngOnInit(): void {
    let programDetails = this.programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails['id'];
      this.dateFormat = this.assignmentService.getDefaultDateFormat();
    }
    this.getProgramAssigmentConfig();
    this.assignmentId = this.activatedRoute.snapshot.params.id;
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programManagedType = currentProgram?.service_type;
    this.is_fees_hidden = currentProgram?.config?.is_fees_hidden || false;
    this.user_type = this._storageService.get('user_type')?.toLowerCase();
    this.activatedRoute?.queryParams?.subscribe(params => {
      this.sow_id = params['sow_id'];
      if (this.sow_id && !this.assignmentId) {
        this.getFoundationalDefaultValuesForSow()
      }
      this.sow_project_id = params['project_id'];
      if (params['vendor_id'] && !this.assignmentId) {
        this.getVendorDetails(params['vendor_id'], true);
      }
      if (this.sow_id && this.sow_project_id) {
        this.assignmentCreateForm.patchValue({
          sourcing_model: SOURCING_TYPE.SOW?.toUpperCase()
        });
        this.sourcingModelChanged();
      } else {
        this.sow_id = undefined;
        this.sow_project_id = undefined;
      }
    });
    this.setUpdateConfig();
    this.setUserType();
    this.init();
  }

  continue() {
    if(this.activeTab == "basic-info") {
      this.activeTab = "assignment-info";
    }
    else if(this.activeTab == "assignment-info") {
      this.activeTab = "time-expense";
    }
    else if(this.activeTab == "time-expense") {
      this.activeTab = "finance-info";
    }
    else if(this.activeTab == "financial-info") {
      this.activeTab = "finance-info";
    }
   window.scrollTo(0, 0);
  }

  toggleTimesheet($event) {
    if($event) {
      this.manageTimesheet = true;
    }
    else {
      this.manageTimesheet = false;
    }
  }

  toggleExpense($event) {
    if($event) {
      this.manageExpense = true;
    }
    else {
      this.manageExpense = false;
    }
  }

  toggleBillable($event) {
    if($event) {
      this.manageBillable = true;
    }
    else {
      this.manageBillable = false;
    }
  }

  toggleWelcomeEmail($event) {
    console.log($event)
  }

  finishAssignment() { }

  showPopOver($event) {
    if($event.target.checked) {
      this.rateFactorEdit = true;
    }
    else {
      this.rateFactorEdit = false;
      this.popoverActive = false;
    }
  }

  ShowPopOverBox() {
    this.popoverActive = true;
  }

  hidePopOver() {
    this.popoverActive = false;
  }
  setUpdateConfig = () => {
    if (this.assignmentId) {
      this.activeTab = 'assignment-info';
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
    } else if (this.user_type == 'vendor') {
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
        if(element?.slug === 'assignment_manager' || element?.slug === 'timesheet_manager' || element?.slug === 'expense_manager'){
          url=`${url}&self_at_top=true`;
        }
        if(element?.slug === 'sourcing_model' && (this.user_type?.toUpperCase() === UserType.Vendor || this.user_type?.toUpperCase() === UserType.MSP || this.user_type?.toUpperCase() === UserType.Client)){
          url=`${url}&org_type=${this.user_type?.toUpperCase()}`;//bugfix AMFMI-595
        }
        this._formRendererService.get(url).subscribe((data: any[]) => {
          if (data) {
            element?.datasource?.getBy.forEach(d => {
              data = data[d]
            });
            const selectedOption = this.assignmentCreateForm?.get(element?.slug);
            let selectedOptionDrop;
            if (selectedOption && selectedOption?.value && this.dropDownOptions && this.dropDownOptions[element?.slug]) {
              selectedOptionDrop = this.dropDownOptions[element?.slug].find(op => op[element?.bind_value] === selectedOption?.value);
              data.push(selectedOptionDrop);
            }

            if (element.slug === 'days_per_week') {
              data.sort(this.sortFunction('label'));
            }
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
            if(element?.slug === 'assignment_manager'){
              if(this.user_type?.toUpperCase() === UserType.Client && !this.assignmentId){        
                const user = this._storageService.get('user');
                this.setAssignmentManager(user);
              }
            }
            if(element?.slug==='vendor_id'){
              if(this.user_type?.toUpperCase() === UserType.Vendor){
                const currentUser = this._storageService.get(StorageKeys.CURRENT_USER);
                this.getVendorDetails(currentUser?.organization_id, false);
              }
            }
          }
        })
      } else if (element?.datasource?.type === 'picklist') {
        this.dropDownOptions[element?.slug] = element?.datasource?.options;
        if (element?.datasource?.options?.length === 1 && element?.bind_value && !this.assignmentId) {
          this.assignmentCreateForm.patchValue({
            [element?.slug]: this.dropDownOptions[element?.slug][0][element?.bind_value]
          })
        }
      }
    });
    this.getProgramDetail();
    this.createForm();
    this.hierarchyList();
    if (this.sow_id) {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      this.startDateOption.enabledDateRanges = [
        {
          start: today
        }
      ]
      this.endDateOption.enabledDateRanges = [
        {
          start: today
        }
      ]
    }
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
      activity_billrate: [0,],
      activity_payrate: [0,],
      activity_vendor_rate: [0],
    },
      {
        validators: [this.activityPayRateValidator]
      }
    );
  }

  addActivity() {
    let activity = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
    activity?.push(this.createActivityForm(activity?.length + 1));
    this.changeDetectorRef?.detectChanges();
    this.updateRateFactorActivity(activity?.length - 1, true);
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
  }

  isActivityExist(event, i) {
    let activityData = this.assignmentCreateForm.get('activity') as UntypedFormArray;
    let isPresent = activityData?.value?.some((act, index) => {
      if (index !== i) {
        return act?.entity_name?.toLowerCase()?.trim() === event?.target?.value?.toLowerCase()?.trim();
      }
      return false;
    });
    if (isPresent) {
      activityData.at(i)?.get('entity_name')?.setErrors({ 'invalidName': true });
    } else {
      activityData.at(i)?.get('entity_name')?.setErrors(null);
    }
  }

  getProgramAssigmentConfig() {
    this._formRendererService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`).subscribe(res => {
      const { config } = res;
      this.is_activity_based = config?.project_based?.is_allow;
      if (config?.secondary_assignment?.is_allow && config?.secondary_assignment?.value) {
        this.isWorkerIncluded = true;
      }
      this.getCandidates({term: ''});
    });
  }

  get isSelfManagedClientAdmin() {
    return ((this.programManagedType === PROGRAM_TYPE.SELF_SERVICED && this.isClient) || this.isSuperAdmin)
  }

  get showClientBillRate() {
    return this.isClient || this.isMsp || this.isSelfManagedClientAdmin;
  }

  get showVendorBillRate() {
    return this.isVendor || this.isMsp || this.isSelfManagedClientAdmin;
  }

  get showPayrate() {
    return this.isMsp || this.isVendor || this.isSelfManagedClientAdmin || (this.programType === 'PAY_RATE' && this.isClient);
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
        if (config.hasOwnProperty('is_expense_manager_enabled') && !config?.is_expense_manager_enabled) {
          this.toggleChanged('is_expense_enabled');
          this.disabledModule.push('is_expense_enabled');
          this.isExpenseManagerEnabled = false;
        }
      })
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
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model, hierarchy_id } = formValue;
    if (!sourcing_model || !hierarchy_id) {
      return;
    }

    const sourcingObj = this.dropDownOptions?.sourcing_model;
    const sourcingModel = sourcingObj?.find(model => model?.label == sourcing_model);
    this._formRendererService.get(`/configurator/programs/${this.programId}/msps/fees?sourcing_model=${sourcingModel?.value?.toUpperCase()}&hierarchy=${hierarchy_id[0]}`)
      .subscribe(res => {
        const { msp_fees } = res;
        let feesList = [];
        this.feeArray.clear();
        const assignment = this.assignmentData?.assignments?.assignment || null;
        feesList = assignment?.tax?.filter(t => t.entity_type === 'fee') || [];

        for (let index = 0; index < msp_fees.length; index++) {
          const element = msp_fees[index];
          for (let feeIndex = 0; feeIndex < element?.categorical_fees.length; feeIndex++) {
            let categoricalFee = element?.categorical_fees[feeIndex];
            const validFees = categoricalFee?.applicable_config?.some(ent => ent?.entity_ref === 'TIMESHEETS');
            if (!validFees) {
              continue;
            }
            const validfee = categoricalFee?.applicable_config?.find(ent => ent?.entity_ref === 'TIMESHEETS');
            const value = feesList.find(fe => fe?.entity_name === categoricalFee?.fee_category.toLowerCase());
            const alreadyHas = this.feeArray.value?.some(f => f?.entity_name === categoricalFee?.fee_category.toLowerCase())
            if (!alreadyHas) {
              const feeForm = this.fb.group({
                amount_type: ['percentage'],
                amount_value: [this.accuracyPipe?.transform(value?.amount_value ? Number(value?.amount_value) : (validfee?.fee ? Number(validfee?.fee) : 0), this.accuracyConfig.fee, { isEdit: true })],
                applicable_on: [categoricalFee?.fee_applicable_to === 'Client' ? 'client_bill_rate' : 'vendor_bill_rate'],
                entity_name: [categoricalFee?.fee_category.toLowerCase()],
                name: [categoricalFee?.fee_category?.split('_').join(' ')]
              });

              feeForm.get('applicable_on').disable();
              feeForm.get('amount_type').disable();

              let formArray = this.assignmentCreateForm.get('fee') as UntypedFormArray;
              formArray.push(feeForm);
            }
          }
        }
        this.calculateMspFee();

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

      })
  }

  calculateMspFee() {
    if (this.feeArray?.controls?.length > 0) {
      const feesArray = this.feeArray?.value;
      let val = 0;
      for (let index = 0; index < feesArray.length; index++) {
        const element = feesArray[index];
        val += ['msp_partner', 'vms'].includes(element?.entity_name) ? Number(element?.amount_value) : 0
      }
      const ind = this.feeArray?.controls?.findIndex(f => f?.get('entity_name')?.value === 'msp');
      if (ind > -1) {
        this.feeArray.at(ind).patchValue({
          amount_value: val
        })
        this.onMarkupChange();
      } else {
        const feeForm = this.fb.group({
          amount_type: ['percentage'],
          amount_value: [this.accuracyPipe?.transform(val, this.accuracyConfig.fee, { isEdit: true })],
          applicable_on: [this.feeArray?.controls[0].get('applicable_on').value],
          entity_name: ['msp'],
          name: ['MSP']
        });
        feeForm.disable();
        let formArray = this.assignmentCreateForm.get('fee') as UntypedFormArray;
        formArray.push(feeForm);
      }

    }

  }

  getRateFactor() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { hierarchy_id } = formValue;
    let url = `/configurator/programs/${this.programId}/rate-factors?is_enabled=True&`;
    if (hierarchy_id) {
      url += `hierarchy=${hierarchy_id}`;
    }
    this._formRendererService
      .get(url)
      .subscribe(res => this.handleRateFactorRes(res));
  }


   updateRateFactorActivity(index, flag?) {
    if (this.rateFactor && this.rateFactor?.length > 0) {
      let zeroValue = 0;
      let rate_factors = this.rateFactor;
      if (!flag) {
        if (this.assignmentData?.assignments?.finance?.rate && this.assignmentData?.assignments?.finance?.rate?.length > 0) {
          if (rate_factors) {
            for (let j = 0; j < this.assignmentData?.assignments?.finance?.rate?.length; j++) {
              if (j > 0) {
                let activity = this.assignmentCreateForm?.get('activity') as UntypedFormArray || [];
                activity?.push(this.createActivityForm(activity?.length + 1));
                this.changeDetectorRef.detectChanges();
              }
              let activityValue = this.assignmentData?.assignments?.finance?.rate?.[j];
              (this.assignmentCreateForm.get('activity') as UntypedFormArray)
                ?.at(j)?.patchValue({
                  entity_name: activityValue?.entity_name,
                  entity_id: activityValue?.entity_id
                });
              let st_rate = activityValue?.rates.find(r => r.rate_factor?.toLowerCase() === 'st' || r.rate_factor?.toLowerCase() === 'regular');
              if (st_rate) {
                ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                  ?.at(j)?.patchValue({
                    activity_billrate: this.accuracyPipe.transform(st_rate?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                    activity_vendor_rate: this.accuracyPipe.transform(st_rate?.vendor_rate, this.accuracyConfig.rate, { isEdit: true}),
                    activity_payrate: this.accuracyPipe.transform(st_rate?.payrate, this.accuracyConfig.rate, { isEdit: true})
                  }));
                this.changeDetectorRef.detectChanges();
              }
              if (this.assignmentData?.assignments?.finance?.rate?.[j]?.rates && this.assignmentData?.assignments?.finance?.rate?.[j]?.rates?.length > 0) {
                for (let i = 0; i < rate_factors.length; i++) {
                  const element = rate_factors[i];
                  const valObj = (activityValue?.rates || []).find(r => r?.rate_factor?.toLowerCase() === element?.abbreviation?.toLowerCase());
                  const rateForm = this.fb.group({
                    rate_factor: [element?.abbreviation],
                    name: [element.name],
                    billrate: [this.accuracyPipe.transform(valObj?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
                    payrate: [this.accuracyPipe.transform(valObj?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
                    vendor_rate: [this.accuracyPipe.transform(valObj?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required]
                  }, {
                    validators: [this.payRateValidator]
                  });
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
      } else {
        this.rateFactor?.forEach((rate) => {
          const form = this.fb.group({
            rate_factor: [rate?.abbreviation?.toLowerCase()],
            name: [rate?.name],
            billrate: [this.accuracyPipe.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true})],
            payrate: [this.accuracyPipe.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true})],
            vendor_rate: [this.accuracyPipe.transform(zeroValue, this.accuracyConfig.rate, { isEdit: true})]
          }, {
            validators: [this.payRateValidator]
          });
          let activityFormArray = this.assignmentCreateForm?.get('activity') as UntypedFormArray;
          let activityRateControl = activityFormArray?.controls[index]['controls']['rates'] as UntypedFormArray;
          let isPresent = activityRateControl?.value.some(r => r.name === rate.name);
          if (!isPresent) {
            activityRateControl?.push(form);
          }

        });
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  baseRatesChanged(rate) {
    let url = '';
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup,
      billrate,
      payrate,
      vendor_rate } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    let msp_fee_types = 0;
    let msp_fee_value = 0
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

    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe?.transform(feeArr[indexForMsp]?.amount_value, this.accuracyConfig.fee, { isEdit: true });
    }

    url = `rate_model=${rate_model}&adjusted_markup=${adjusted_markup}&vendor_markup=${vendor_markup}&client_bill_rate=${billrate ? billrate: 0}&candidate_pay_rate=${payrate}&max_bill_rate=${max_bill_rate}&min_bill_rate=${min_bill_rate}&vendor_bill_rate=${vendor_rate ? vendor_rate: 0 }`;
    this._formRendererService.get(`/core-money/programs/${this.programId}/rate-model?${url}&abbreviation=st&msp_fee_types=${msp_fee_types}&msp_fee_value=${msp_fee_value}`)
      .subscribe({
        next: res => {
          const { data } = res;
          const rateObj = data?.rate;
          const arrayValues = this.ratesArray.value;
          for (var prop in rateObj) {
            if (prop !== 'abbreviation') {
              const ele = rateObj[prop];
              const index = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === prop);
              if (index > -1) {
                this.ratesArray.at(index).patchValue({
                  billrate: this.accuracyPipe.transform(ele?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                  payrate: this.accuracyPipe.transform(ele?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                  vendor_rate: this.accuracyPipe.transform(ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
                })
              }
            }
          }
          const regular = rateObj?.regular;
          if (rate == 'billrate') {
            this.assignmentCreateForm.patchValue({
              payrate: this.accuracyPipe.transform(regular?.payrate, this.accuracyConfig.rate, { isEdit: true}),
              vendor_rate: this.accuracyPipe.transform(regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
            })
          } else if (rate === 'vendor_rate') {
            this.assignmentCreateForm.patchValue({
              billrate: this.accuracyPipe.transform(regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
              payrate: this.accuracyPipe.transform(regular?.payrate , this.accuracyConfig.rate, { isEdit: true})
            })
          } else {
            this.assignmentCreateForm.patchValue({
              billrate: this.accuracyPipe.transform(regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
              vendor_rate: this.accuracyPipe.transform(regular?.vendor_rate , this.accuracyConfig.rate, { isEdit: true})
            })
          }
          this.recalcualatebudget();
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
        }
      })

  }

  recalcualatebudget() {
    this.calculateHoursEstimate();
    this.calculateResourceBudget();
  }

  onMarkupChange() {
    const rateToCahnge = this.programType === 'PAY_RATE' ? 'billrate': 'payrate';
    if (!this.is_activity_based) {
      this.baseRatesChanged(rateToCahnge);
    } else {
      let activityArray = this.activityArray?.getRawValue() || [];
      activityArray?.forEach((rate, i) => {
        this.activityBaseRatesChanged(rateToCahnge, i)
      });
    }
  }

  calculateHoursEstimate() {
    const values = this.assignmentCreateForm.getRawValue();
    const { start_date, end_date, st_hours, days_per_week } = values;
    if (!start_date || !end_date || !st_hours || !days_per_week) {
      return null;
    }

    const url = `/core-money/programs/${this.programId}/working-hours-estimate?start_date=${this.convertDateFormat(start_date)}&end_date=${this.convertDateFormat(end_date)}&hours_per_day=${st_hours}&week_working_days=${days_per_week}`;
    this._formRendererService.get(url)
      .subscribe(res => {
        const { formatted_working_days } = res?.data;
        this.assignmentCreateForm.patchValue({
          total_working_days: formatted_working_days
        });
      })
  }

  calculateResourceBudget() {
    const values = this.assignmentCreateForm.getRawValue();
    let { billrate, rate_type, total_working_days, start_date, end_date, st_hours, days_per_week, activity } = values;
    if (!start_date || !end_date || !st_hours || !days_per_week && !billrate && !rate_type && !total_working_days) {
      return null;
    }

    if (this.is_activity_based) {
      billrate = activity.reduce((total, act) => total + Number(act?.activity_billrate), 0);
    }

    const taxValues = this.taxArray.getRawValue();

    let url = `/core-money/programs/${this.programId}/resource-budget`;
    url += `?start_date=${this.convertDateFormat(start_date)}&end_date=${this.convertDateFormat(end_date)}&hours_per_day=${st_hours}&week_working_days=${days_per_week}&rate=${billrate}&rate_type=${rate_type}&total_hours=${total_working_days}&num_resources=1`;

    if (taxValues?.length > 0) {
      url += `&adjustment_type=${taxValues[0]?.amount_type}&adjustment_value=${taxValues[0]?.amount_value}`;
    }
    this._formRendererService.get(url)
      .subscribe(res => {
        const { initial_budget, gross_budget, estimate_tax, net_budget } = res?.data;
        this.assignmentCreateForm.patchValue({
          timesheet_budget: this.accuracyPipe?.transform(initial_budget, this.accuracyConfig.amount, { isEdit: true }),
          gross_allocated_budget: this.accuracyPipe?.transform(gross_budget, this.accuracyConfig.amount, { isEdit: true }),
          estimated_tax: this.accuracyPipe?.transform(estimate_tax, this.accuracyConfig.tax, { isEdit: true }),
          net_allocated_budget: this.accuracyPipe?.transform(net_budget, this.accuracyConfig.amount, { isEdit: true })
        })
      })
  }

  baseRatesChangedForAbb(abbreviation, rate) {
    let url = '';
    const arrayValues = this.ratesArray.value;
    const obj = arrayValues.find(r => r.rate_factor?.toLowerCase() === abbreviation?.toLowerCase());
    let billrate = obj['billrate'];
    let payrate = obj['payrate']
    let vendor_rate = obj['vendor_rate'];
    if (rate === 'billrate' && !payrate) {
      payrate = 0;
    }
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup
    } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    if (!rate_model) {
      return;
    }

    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }

    if ((rate === 'billrate' && billrate === null) || (rate === 'payrate' && payrate === null)) {
      return;
    }

    url = `rate_model=${rate_model}&adjusted_markup=${adjusted_markup}&vendor_markup=${vendor_markup}&client_bill_rate=${billrate? billrate: 0}&candidate_pay_rate=${payrate}&max_bill_rate=${max_bill_rate}&min_bill_rate=${min_bill_rate}&vendor_bill_rate=${vendor_rate ?vendor_rate: 0}`;
    this._formRendererService.get(`/core-money/programs/${this.programId}/rate-model?${url}&abbreviation=${abbreviation?.toLowerCase()}`)
      .subscribe({
        next: res => {
          const { data } = res;
          const { rate } = data;
          const arrayValues = this.ratesArray.value;
          const abb = data?.abbreviation;
          const regular = rate?.regular;
          const index = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === abb);
          if (index > -1) {
            this.ratesArray.at(index).patchValue({
              billrate: this.accuracyPipe.transform(regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
              payrate: this.accuracyPipe.transform(regular?.payrate, this.accuracyConfig.rate, { isEdit: true}),
              vendor_rate: this.accuracyPipe.transform(regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
            });
          }
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
        }
      })
  }
  activityBaseRatesChanged(rate, i) {
    let url = '';
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup,
    } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    let msp_fee_types = 0;
    let msp_fee_value = 0
    if (!rate_model) {
      return;
    }
    const arrayValues = this.activityArray.value;
    let bill_rate = arrayValues[i]?.activity_billrate;
    let pay_rate = arrayValues[i]?.activity_payrate;
    let vendor_rate = arrayValues[i]?.activity_vendor_rate;
    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }

    if ((rate === 'billrate' && bill_rate === null) || (rate === 'payrate' && pay_rate === null)) {
      return;
    }

    if (rate === 'billrate' && !pay_rate) {
      pay_rate = 0;
    }

    const feeArr = this.feeArray?.getRawValue() || [];
    const indexForMsp = feeArr.findIndex(entity => entity?.name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe?.transform(feeArr[indexForMsp]?.amount_value, this.accuracyConfig.fee, { isEdit: true });
    }

    url = `rate_model=${rate_model}&adjusted_markup=${adjusted_markup}&vendor_markup=${vendor_markup}&client_bill_rate=${bill_rate? bill_rate: 0 }&candidate_pay_rate=${pay_rate}&max_bill_rate=${max_bill_rate}&min_bill_rate=${min_bill_rate}&vendor_bill_rate=${vendor_rate?vendor_rate: 0 }`;
    this._formRendererService.get(`/core-money/programs/${this.programId}/rate-model?${url}&abbreviation=st&msp_fee_types=${msp_fee_types}&msp_fee_value=${msp_fee_value}`)
      .subscribe({
        next: res => {
          const { data } = res;
          const rateObj = data?.rate;
          const arrayValues = this.activityArray.value;
          for (var prop in rateObj) {
            if (prop !== 'abbreviation') {
              const ele = rateObj[prop];
              const index = arrayValues[i]?.rates?.findIndex(r => r?.rate_factor?.toLowerCase() === prop);
              if (index > -1) {
                ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                  .at(i).get('rates') as UntypedFormArray)
                  .at(index).patchValue({
                    billrate: this.accuracyPipe.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                    payrate: this.accuracyPipe.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                    vendor_rate: this.accuracyPipe.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
                  });
              }
            }
          }
  
          const regular = rateObj?.regular;
          if (rate == 'billrate') {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(i).patchValue({
                activity_payrate: this.accuracyPipe.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                activity_vendor_rate: this.accuracyPipe.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
              }));
          } else if (rate === 'vendor_rate') {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(i).patchValue({
                activity_billrate: this.accuracyPipe.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                activity_payrate: this.accuracyPipe.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true})
              }));
          }  else {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(i).patchValue({
                activity_billrate: this.accuracyPipe.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                activity_vendor_rate: this.accuracyPipe.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
              }));
          }
          this.recalcualatebudget();
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
        }
      })

  }

  activityBaseRatesChangedForAbb(abbreviation, rate, i1, i2) {
    let url = '';
    let arrayValues = this.assignmentCreateForm.getRawValue();
    const obj = arrayValues?.activity[i1]?.rates?.find(r => r.rate_factor?.toLowerCase() === abbreviation?.toLowerCase());
    let billrate = obj['billrate'];
    let payrate = obj['payrate'];
    let vendor_rate = obj['vendor_rate'];
    if (rate === 'billrate' && !payrate) {
      payrate = 0;
    }
    const formValues = this.assignmentCreateForm.getRawValue();
    let {
      rate_model,
      adjusted_markup,
      vendor_markup
    } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    if (!rate_model) {
      return;
    }

    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }

    if ((rate === 'billrate' && billrate === null) || (rate === 'payrate' && payrate === null)) {
      return;
    }

    url = `rate_model=${rate_model}&adjusted_markup=${adjusted_markup}&vendor_markup=${vendor_markup}&client_bill_rate=${billrate?billrate: 0 }&candidate_pay_rate=${payrate}&max_bill_rate=${max_bill_rate}&min_bill_rate=${min_bill_rate}&vendor_bill_rate=${vendor_rate? vendor_rate: 0}`;
    this._formRendererService.get(`/core-money/programs/${this.programId}/rate-model?${url}&abbreviation=${abbreviation?.toLowerCase()}`)
      .subscribe({
        next: res => {
          const { data } = res;
          const { rate } = data;
          const arrayValues = this.activityArray.value;
          const abb = data?.abbreviation;
          const regular = rate?.regular;
          const index = arrayValues[i1].rates?.findIndex(r => r?.rate_factor?.toLowerCase() === abb);
          if (index > -1) {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(i1).get('rates') as UntypedFormArray)
              .at(index)?.patchValue({
                billrate: this.accuracyPipe.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                payrate: this.accuracyPipe.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                vendor_rate: this.accuracyPipe.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
              });
          }
  
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
        }
      })

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

  get activityArray(): UntypedFormArray {
    return this.assignmentCreateForm.get('activity') as UntypedFormArray;
  }

  resetEffectiveDate() {
    let start_date = this.assignmentCreateForm.get('start_date').value
    let end_date = this.assignmentCreateForm.get('end_date').value
    if (!start_date || !end_date) {
      return;
    }

    if (this.assignmentCreateForm.get('effective_date')) {
      this.assignmentCreateForm.get('effective_date').setValue('');
    }

    const startDateString = this.convertDateFormat(start_date);
    const endDateString = this.convertDateFormat(end_date);
    start_date = getDateFromString(startDateString)
    end_date = getDateFromString(endDateString)
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

  assignmentData: any;
  jobTemplateId: string;
  selectedFoundationalData = [];
  selectedCustomData = {};
  createForm() {

    this.assignmentCreateForm.get('original_start_date').valueChanges.subscribe(val => {
      this.assignmentCreateForm.get('worker_original_start_date').setValue(val);
      this.allDateFieldDisable['worker_original_start_date'] = true;
    });

    this.assignmentCreateForm.get('start_date').valueChanges.subscribe(val => { this.resetEffectiveDate(); this.recalcualatebudget(); })
    this.assignmentCreateForm.get('end_date').valueChanges.subscribe(val => { this.resetEffectiveDate(); this.recalcualatebudget(); })

    if (!this.assignmentId) {
      this.getRateFactor();
      return;
    }

    this._formRendererService.get(`/assignment/programs/${this.programId}/assignment/${this.assignmentId}`)
      .subscribe(res => {
        const { data } = res;
        this.assignmentData = data;
        const { worker, finance, foundational_data, custom, assignment, sow } = data?.assignments;
        let { vendor, work_location, assignment_manager, start_date, end_date, hierarchy, job, active_on } = assignment;
        const { adjusted_markup, currency, days_per_week, estimated_tax, expense_budget, gross_allocated_budget, is_billable, is_expense_enabled, is_timesheet_enabled, net_allocated_budget, ot_exempt_position, overtime_budget, rate_model, rate_type, shift_timing, st_hours, timesheet_budget, timesheet_type, total_working_days, vendor_markup } = finance;
        const { expense_manager, timesheet_manager } = finance;

        if (sow?.id) {
          this.getExistingSOWProject(sow?.id);
        }
        this.jobTemplateId = assignment?.assignment_title?.id;
        this.getJobTemplateDetails();
        if (worker) {
          const hasValue = (this.dropDownOptions?.candidate_uuid || []).some(can => can?.id === worker?.candidate?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.candidate_uuid || [];
            opt.push(worker?.candidate);
            this.dropDownOptions = { ...this.dropDownOptions, candidate_uuid: opt };
          }

          this.currency = currency?.toUpperCase();
          this.assignmentCreateForm.patchValue({
            candidate_uuid: worker?.candidate?.id,
            source_type: worker?.source_type,
            source_id: worker?.source_id,
            official_email: worker?.official_email,
            original_start_date: this.datePipe.transform(getDateFromString(worker?.original_start_date), this.dateFormat),
            worker_original_start_date: this.datePipe.transform(getDateFromString(worker?.original_start_date), this.dateFormat),
            start_date: this.datePipe.transform(getDateFromString(start_date), this.dateFormat),
            end_date: this.datePipe.transform(getDateFromString(end_date), this.dateFormat),
            adjusted_markup: this.accuracyPipe?.transform(adjusted_markup ? Number(adjusted_markup) : 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
            currency: currency,
            sow_id: sow?.id,
            sow_project_id: sow?.project?.id,
            days_per_week,
            estimated_tax,
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
            st_hours,
            timesheet_budget,
            timesheet_type,
            total_working_days,
            vendor_markup: this.accuracyPipe?.transform(vendor_markup ? Number(vendor_markup) : 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
            hierarchy_id: [hierarchy?.id],
            hierarchy_name: hierarchy?.name
          });
          this.workerSourceTypeChanged({ slug: worker?.source_type }, false)
          this.resetEffectiveDate();
          this.changeMarkupOption();
        }

        if (vendor) {
          const hasValue = (this.dropDownOptions?.vendor_id || []).some(opt => opt?.id === vendor?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.vendor_id || [];
            opt.push({ vendor });
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: opt };
          }
          let sourcingModel = this.dropDownOptions?.sourcing_model.find(model => model?.value === assignment?.sourcing_model);
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
          }
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
          this.search('work_location', null)
        }

        this.getFees();
        this.loadTaxFields();
        this.sourcingModelChanged();

        if (job) {
          const hasValue = (this.dropDownOptions?.job_id || []).some(opt => opt?.id === job?.id);
          if (!hasValue) {
            let opt = this.dropDownOptions?.job_id || [];
            opt.push({ ...job, template_name: job?.title });
            this.dropDownOptions = { ...this.dropDownOptions, job_id: opt };
            this.changeDetectorRef.detectChanges();
          }
          this.assignmentCreateForm.patchValue({
            job_id: job?.id
          });
        }

        if (assignment_manager) {
          const hasValue = (this.dropDownOptions?.assignment_manager || []).some(opt => opt?.id === assignment_manager?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.assignment_manager || [];
            opt.push(assignment_manager);
            this.dropDownOptions = { ...this.dropDownOptions, assignment_manager: opt };
          }
          this.assignmentCreateForm.patchValue({
            assignment_manager: assignment_manager?.id
          });
        }

        if (expense_manager) {
          const hasValue = (this.dropDownOptions?.expense_manager || []).some(opt => opt?.id === expense_manager?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.expense_manager || [];
            opt.push(expense_manager);
            this.dropDownOptions = { ...this.dropDownOptions, expense_manager: opt };
          }
          this.assignmentCreateForm.patchValue({
            expense_manager: expense_manager?.id
          });
        }

        if (timesheet_manager) {
          const hasValue = (this.dropDownOptions?.timesheet_manager || []).some(opt => opt?.id === timesheet_manager?.id);
          if (!hasValue) {
            const opt = this.dropDownOptions?.timesheet_manager || [];
            opt.push(timesheet_manager);
            this.dropDownOptions = { ...this.dropDownOptions, timesheet_manager: opt };
          }
          this.assignmentCreateForm.patchValue({
            timesheet_manager: timesheet_manager?.id
          });
        }
        this.getRateFactor();
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
                name: el?.name
              }
              this.selectedFoundationalData.push(obj);
              this.selectedFoundationalData = [...this.selectedFoundationalData];
            });
          }
        }

        if (custom) {
          this.selectedCustomData = custom;
        }
      });
  }

  sourcingModelChanged() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model } = formValue;
    this.isSourcingModelSOW(sourcing_model);
    this.keepDisabledValue(sourcing_model);

  }

  loadTaxFields() {
    const formValue = this.assignmentCreateForm.getRawValue();
    const { sourcing_model, work_location, hierarchy_id } = formValue;
    if (!sourcing_model || !work_location || !hierarchy_id) {
      return;
    }
    const sourcingObj = this.dropDownOptions?.sourcing_model;
    const sourcingModel = sourcingObj?.find(model => model?.label == sourcing_model);
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
          const feeForm = this.fb.group({
            amount_type: [ele?.tax_type?.toLowerCase() === 'percent' ? AmountType.percentage : AmountType.fixed_amount],
            amount_value: [this.accuracyPipe?.transform(value?.amount_value ?? ele?.tax_applicable, this.accuracyConfig.fee, { isEdit: true })],
            applicable_on: [ele?.applicable_on?.toLowerCase()],
            entity_name: [ele?.name],
            name: [ele?.name?.split('_').join(' ')]
          });

          feeForm.get('applicable_on').disable();
          feeForm.get('amount_type').disable();

          let formArray = this.assignmentCreateForm.get('tax') as UntypedFormArray;
          formArray.push(feeForm);
        })
      })
  }
  currencySybmol;
  currencyChanged(curr) {
    if (curr) {
      this.currency = curr?.code;
    }
  }

  isSourcingModelSOW(sourcing_model) {
    if (sourcing_model?.toLowerCase() === SOURCING_TYPE.SOW) {
      this.is_Sourcing_Model_SOW = true;
      this.getExistingSOW();
      this.assignmentCreateForm.controls.job_id.reset();
      this.assignmentCreateForm?.controls?.sow_id?.setValidators([Validators.required]);
      this.assignmentCreateForm?.controls?.sow_project_id?.setValidators([Validators.required]);
    } else {
      this.is_Sourcing_Model_SOW = false;
      this.assignmentCreateForm?.controls?.sow_id?.setValidators(null);
      this.assignmentCreateForm?.controls?.sow_project_id?.setValidators(null);
      this.assignmentCreateForm.controls.sow_id.reset();
      this.assignmentCreateForm.controls.sow_project_id.reset();
    }
  }

  getExistingSOW() {
    const programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this._formRendererService.get(`/sow/programs/${programDetails?.id}/sow?status=awarded`).subscribe(data => {
      if (data) {
        this.existingSOW = data?.results || [];
      }
    });
    if (this.sow_id) {
      this.assignmentCreateForm.patchValue({
        sow_id: this.sow_id
      });
      this.getExistingSOWProject(this.sow_id);
    }
  }

  getExistingSOWProject($event) {
    this.assignmentCreateForm.get('sow_project_id').setValue(null);
    const programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.existingSOWProject = [];
    if ($event) {
      this._formRendererService.get(`/sow/programs/${programDetails?.id}/sow/${$event}/deliverables?is_awarded=True`).subscribe(data => {
        if (data) {
          this.existingSOWProject = data?.results;
          if (this.sow_project_id) {
            this.assignmentCreateForm.patchValue({
              sow_project_id: this.sow_project_id
            });
          }
        }
      })
    } else {
      this.assignmentCreateForm.patchValue({
        sow_project_id: null
      });
    }
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
          // if (this.workWeekPeriod) {
          //   const day = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0)?.getDay(); 
          //   if (this.workWeekPeriod === 'weekly' && this.weekday[day] !== this.workWeekStartDay) { 
          //     validTimesheetPeriod = false; 
          //   } 
          //   if (this.workWeekPeriod === 'monthly' && date[2] !== "01") {
          //     validTimesheetPeriod = false;
          //   }
          // }
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

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  getFormControl(key) {
    return this.assignmentCreateForm.get(key);
  }

  checkIfTaxChanged(originalArray, modifiedArray) {
    let is_Value_changed = false;
    if (originalArray?.length < modifiedArray?.length) {
      is_Value_changed = true;

    }
    originalArray?.forEach((originalFees, index) => {
      if (originalFees) {
        for (let [key, value] of Object.entries(originalFees)) {
          let feeKey = undefined;
          if (modifiedArray?.length >= index && modifiedArray[index]?.hasOwnProperty(key)) {
            feeKey = modifiedArray[index][key];
            if (key === 'amount_value') {
              value = Number(value);
              feeKey = Number(modifiedArray[index][key]);
            }
            if (feeKey != value) {
              is_Value_changed = true;
            }
          }


        }
      }
    });
    return is_Value_changed;
  }
  getImpactedTimesheets(updatedDate) {
    this.loader.show();
    const { assignment, finance } = this.assignmentData?.assignments;
    const { net_allocated_budget, timesheet_manager, timesheet_type, rate } = finance;
    const olDRateObj = rate?.[0]?.rates?.find(r => r.rate_factor.toLowerCase() === 'st');
    const { end_date } = assignment;

    const currentValues = this.assignmentCreateForm.getRawValue();
    // const end_date = ;
    // const net_allocated_budget = this.getFormControl("net_allocated_budget")?.value;
    const timesheet_manager_id = timesheet_manager?.id;
    const regular_billrate = olDRateObj?.billrate;
    // const timesheet_type = this.getFormControl("timesheet_type")?.value;
    let requestBody: any = {
      page: 1,
      per_page: 15,
      hierarchy_id: currentValues?.hierarchy_id[0],
      effective_start_date: updatedDate,
      new_start_date: this.convertDateFormat(currentValues?.start_date),
      old_start_date: assignment?.start_date,
      finance_change: {start_date_change : true, rate_change: false, st_hours: false, days_per_week: false, fee_change: false, tax_change: false },
      non_finance_change: { timesheet_manager: null, custom_field: false, timesheet_type: false },
      is_non_finance_change: 0,
      is_finance_change: 0,
      is_location_change: 0,
      location_change: {
        work_location: null,
        location_type: null
      }
    };

    let url = `/timesheet/programs/${this.programId}/assignment/${this.assignmentId}/impacted`;
    const taxArray = this.taxArray?.value;
    const feesArray = this.feeArray?.value;
    const feesList = assignment?.tax?.filter(t => t.entity_type === 'fee') || [];
    const taxList = assignment?.tax?.filter(t => t.entity_type === 'tax') || [];
    const is_fees_changed: boolean = this.checkIfTaxChanged(feesList, feesArray);
    if (is_fees_changed) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.fee_change = true;
    }
    const is_tax_changed: boolean = this.checkIfTaxChanged(taxList, taxArray);
    if (is_tax_changed) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.tax_change = true;
    }
    const new_end_date = this.convertDateFormat(currentValues?.end_date);
    if (end_date && end_date !== new_end_date) {
      requestBody.new_end_date = new_end_date;
      requestBody.is_finance_change = 1;
    } else if (parseFloat(net_allocated_budget) != parseFloat(currentValues?.net_allocated_budget)) {//add
      requestBody.is_finance_change = 1;
    } else if (finance?.st_hours !== currentValues?.st_hours) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change['st_hours'] = true;
    } else if (finance?.days_per_week !== currentValues?.days_per_week) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change['days_per_week'] = true;
    }

    if (parseFloat(regular_billrate) !== parseFloat(currentValues?.billrate)) {
      requestBody.is_finance_change = 1;
      requestBody.finance_change.rate_change = true;
    }

    if (timesheet_type !== currentValues?.timesheet_type) {
      requestBody.non_finance_change.timesheet_type = true;
      requestBody.is_non_finance_change = 1;
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

    if (currentValues.timesheet_manager && timesheet_manager_id && timesheet_manager_id != currentValues.timesheet_manager) {
      requestBody.is_non_finance_change = 1;
      requestBody.non_finance_change.timesheet_manager = timesheet_manager_id;
    }

    if (assignment?.work_location?.id != currentValues.work_location) {
      requestBody.is_location_change = 1;
      requestBody.location_change.work_location = currentValues.work_location;
    }

    // url+=`&is_finance_change=${is_finance_change}&is_non_finance_change=${is_non_finance_change}`;
    this._formRendererService.post(url, requestBody).subscribe({
      next: (data: any) => {
        let impactedTimesheets = undefined;
        let showTable = undefined;
        if (data?.data?.timesheet?.length > 0) {
          impactedTimesheets = data?.data?.timesheet;
          this.assignmentCreateForm.addControl('impacted_timesheet_data', this.fb.control(impactedTimesheets));
          showTable = true;
        } else {
          showTable = false;
        }
        this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets, showTable }));
        this.loader.hide();
      },
      error: err => {
        if (err?.error?.error?.errors[0]?.message) {
          this.alert.error(err.error.error.errors[0].message, { type: { INTERVAL_TIME: 5000 } });
        } else {
          this.alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } });
        }
        this.loader.hide();
      }
    });
  }

  getJobTemplateDetails() {
    if (this.jobTemplateId) {
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
        }
      });
    }
  }

  // continue() {
  //   this.activeTab = this.activeTab === 'candidate-info' ? 'assignment-info' : 'finance-info';
  //  window.scrollTo(0, 0);
  // }

  // previous() {
  //   this.activeTab = this.activeTab === 'finance-info' ? 'assignment-info' : 'candidate-info';
  // }

  getCandidates(term): any {
    return this._formRendererService.get(`/configurator/candidates?is_worker_included=${this.isWorkerIncluded}&k=${term?.term}&program_id=${this.programId}` )
      .subscribe(res => {
        const { candidates } = res;
        this.dropDownOptions['candidate_uuid'] = candidates;
      })
  }

  disableToggle(field) {
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
    if (sourcing_model.toLowerCase() == 'headcount tracking' || sourcing_model.toLowerCase() == 'headcount_track') {
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
      if (!this.assignmentId) {
        this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Onboarding_BackgroundCheck_approval);
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

      if (!this.assignmentId) {
        this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Create_SaveAssignment);
      }
    } else {
      // for other sourcing model all toggles will be on
      if ( sourcing_model?.toLowerCase() == 'contingent') {
        this.showWelcomeEmail = true;
        this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Create_SaveAssignment);
      } else if (sourcing_model?.toLowerCase() == 'sow' ) {
        this.showWelcomeEmail = true;
        this.assignmentCreateForm.get('active_on')?.setValue(AssignmentActiveUpon.Onboarding_BackgroundCheck);
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
    if (this.assignmentId) {
      this.disabledModule.push('is_timesheet_enabled', 'is_expense_enabled', 'is_billable');
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
      }
      this.assignmentCreateForm.get('expense_manager').updateValueAndValidity();
    }

    if (field === 'is_timesheet_enabled') {
      this.assignmentCreateForm.get('timesheet_manager').reset();
      this.assignmentCreateForm.get('timesheet_type').reset();
      this.assignmentCreateForm.get('st_hours').reset();
      this.assignmentCreateForm.get('days_per_week').reset();
      this.assignmentCreateForm.get('st_hours').setValue(0);
      this.assignmentCreateForm.get('days_per_week').setValue(0);
      if (!fieldObj) {
        this.assignmentCreateForm.get('timesheet_manager').clearValidators();
        this.assignmentCreateForm.get('timesheet_type').clearValidators();
        this.assignmentCreateForm.get('st_hours').clearValidators();
        this.assignmentCreateForm.get('days_per_week').clearValidators();
      } else {
        this.assignmentCreateForm.get('timesheet_manager').setValidators([Validators.required]);
        this.assignmentCreateForm.get('timesheet_type').setValidators([Validators.required]);
        this.assignmentCreateForm.get('st_hours').setValidators([Validators.required]);
        this.assignmentCreateForm.get('days_per_week').setValidators([Validators.required]);
      }

      this.assignmentCreateForm.get('timesheet_manager').updateValueAndValidity();
      this.assignmentCreateForm.get('timesheet_type').updateValueAndValidity();
      this.assignmentCreateForm.get('st_hours').updateValueAndValidity();
      this.assignmentCreateForm.get('days_per_week').updateValueAndValidity();
    }
    if (field === 'is_billable') {
      this.assignmentCreateForm.get('rate_model').reset();
      this.assignmentCreateForm.get('rate_type').reset();
      this.assignmentCreateForm.get('currency').reset();
      this.assignmentCreateForm.get('adjusted_markup')?.setValue(0);
      this.assignmentCreateForm.get('vendor_markup')?.setValue(0);
      if (!fieldObj) {
        this.resetBillableValues();
      }

      if (!fieldObj) {
        this.assignmentCreateForm.get('rate_model').clearValidators();
        this.assignmentCreateForm.get('rate_type').clearValidators();
        this.assignmentCreateForm.get('currency').clearValidators();
      } else {
        this.assignmentCreateForm.get('rate_model').setValidators([Validators.required]);
        this.assignmentCreateForm.get('rate_type').setValidators([Validators.required]);
        this.assignmentCreateForm.get('currency').setValidators([Validators.required]);
      }
      this.assignmentCreateForm.get('rate_model').updateValueAndValidity();
      this.assignmentCreateForm.get('rate_type').updateValueAndValidity();
      this.assignmentCreateForm.get('currency').updateValueAndValidity();

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
  }

  resetActivityValue() {
    this.activityArray.clear();
    this.addActivity();
  }

  resetRateArray() {
    const arrayValues = this.ratesArray?.value;
    arrayValues?.forEach((rate, i) => {
      this.ratesArray?.at(i).patchValue({
        billrate: 0,
        payrate: 0,
        vendor_rate: 0
      });
    });
    this.assignmentCreateForm.get('rate').updateValueAndValidity();
    this.assignmentCreateForm.patchValue({ billrate: 0, vendor_rate: 0, payrate: 0 });
  }

  resetTaxValue() {
    const taxValues = this.taxArray.value;
    taxValues?.forEach((tax, i) => {
      this.taxArray.at(i).patchValue({
        amount_value: 0
      });
    });
  }

  resetFeesValue() {
    const feesValues = this.feeArray.value;
    feesValues?.forEach((fee, i) => {
      this.taxArray?.at(i)?.patchValue({
        amount_value: 0
      });
    });
  }

  onClickHirerachy() {
    if (this.assignmentId) {
      return;
    }
    if (this.assignmentCreateForm.get('hierarchy_id').value !== null) {
      this.selectedHierarchy = this.assignmentCreateForm.get('hierarchy_id').value
    }
    this.isAddHirerachy = 'visible';
  }

  sidebarClose() {
    this.isAddHirerachy = 'hidden';
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
      this._formRendererService.setHierarchyName('')
    }
    this.changeMarkupOption();
    this.assignmentCreateForm.get('hierarchy_id').setValue(event);
    this.getRateFactor();
    this.resetEffectiveDate();
    this.getFees();
    this.loadTaxFields();
    if (resetHierarchy) {
      this.resetWorkLocation();
    }
    this.search('work_location', null)
  }

  resetWorkLocation = () => {
    this.assignmentCreateForm.get('work_location').setValue(null);
    this.dropDownOptions['work_location'] = [];
  }

  changeMarkupOption() {
    this.programType = this.selectedHierachyObj?.rate_model ?? this.programDetails?.config?.program_model;
    if (this.programType) {
      this.assignmentCreateForm.get('rate_model').setValue(this.programTypeRateModel[this.programType]);
    }
    if (!this.is_activity_based) {
      if (this.programType === 'PAY_RATE') {
        this.assignmentCreateForm.get('billrate').disable();
        this.assignmentCreateForm.get('vendor_rate').disable();
        this.assignmentCreateForm.get('payrate').enable();
      } else {
        this.assignmentCreateForm.get('billrate').enable();
        if (this.isVendor) {
          this.assignmentCreateForm.get('vendor_rate').enable();
        } else {
          this.assignmentCreateForm.get('vendor_rate').disable();
        }
        this.assignmentCreateForm.get('payrate').disable();
      }

      this.ratesArray.controls.forEach((element, index) => {
        if (this.programType === 'PAY_RATE') {
          this.ratesArray.at(index)?.get('billrate')?.disable();
          this.ratesArray.at(index)?.get('vendor_rate')?.disable();
          this.ratesArray.at(index)?.get('payrate')?.enable();
        } else {
          this.ratesArray.at(index)?.get('billrate').enable();
          if (this.isVendor) {
            this.ratesArray.at(index).get('vendor_rate').enable();
          } else {
            this.ratesArray.at(index).get('vendor_rate').disable();
          }
          this.ratesArray.at(index).get('payrate').disable();
        }
      });
    } else {
      let activityArray = this.activityArray?.getRawValue() || [];
      activityArray.forEach((activity, index) => {
        if (this.programType === 'PAY_RATE') {
          ((this.assignmentCreateForm?.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_billrate')?.disable());
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_vendor_rate')?.disable());
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_payrate')?.enable());
        } else {
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_billrate')?.enable());
          if (this.isVendor) {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(index)?.get('activity_vendor_rate')?.enable());
          } else {
            ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
              .at(index)?.get('activity_vendor_rate')?.disable());
          }
          ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
            .at(index)?.get('activity_payrate')?.disable());
        }
        if (activity && activity?.rates?.length > 0) {
          activity?.rates?.forEach((rate, rate_index) => {
            if (this.programType === 'PAY_RATE') {
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index).get('billrate')?.disable();
              ((this.assignmentCreateForm?.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('vendor_rate')?.disable();
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('payrate')?.enable();
            } else {
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('billrate')?.enable();
              if (this.isVendor) {
                ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                  .at(index)?.get('rates') as UntypedFormArray)
                  .at(rate_index)?.get('vendor_rate')?.enable();
              } else {
                ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                  .at(index)?.get('rates') as UntypedFormArray)
                  .at(rate_index)?.get('vendor_rate')?.disable();
              }
              ((this.assignmentCreateForm.get('activity') as UntypedFormArray)
                .at(index)?.get('rates') as UntypedFormArray)
                .at(rate_index)?.get('payrate')?.disable();
            }
          });
        }

      });
 
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
    const currentUser = this._storageService.get(StorageKeys.CURRENT_USER);
    this.dropDownOptions['hierarchy_id'] = [];
    if (this.dropDownOptions['hierarchy_id'].length === 0) {
      let url = `/configurator/programs/${this.programId}/hierarchy`;
      if (this.user_type?.toUpperCase() === UserType.MSP || this.user_type?.toUpperCase() === UserType.Client) {
        url += `?user_id=${currentUser?.id}`;
      }
      this._formRendererService.get(url)
        .subscribe(
          data => {
            if (data) {
              this.dropDownOptions['hierarchy_id'] = data.result[0].hierarchies;
              data.result[0].hierarchies.forEach(h => {
                this.userAssociatedHierarchyID.push(h?.id)
              });

              if (this.assignmentId && this.assignmentCreateForm.get('hierarchy_id')?.value) {
                this.selectHierarchy(this.assignmentCreateForm.get('hierarchy_id')?.value, false)
              } else {
                if ((this.dropDownOptions['hierarchy_id']?.length === 1) && (this.dropDownOptions['hierarchy_id'][0]?.hierarchies?.length === 0)) {
                  this.selectHierarchy([this.dropDownOptions['hierarchy_id'][0]?.id])
                }
              }
            }
          });
    }
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

  convertDateFormat(dateString: string) {
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

    for (let index = 0; index < formatArray.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${year}-${month}-${date}`
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

    for (let index = 0; index < formatArray.length; index++) {
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
      return { gtr: 'Pay Rate can not be greater than  client bill rate' }
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
      if(this.user_type?.toUpperCase() != UserType.Vendor){
        this.assignmentCreateForm.get('vendor_id').enable();
      }
      this.assignmentCreateForm.get('official_email').enable();
      this.assignmentCreateForm.get('source_type').enable();
      this.assignmentCreateForm.get('sso_id').enable();
      this.assignmentCreateForm.get('source_id').enable();
      this.allDateFieldDisable['original_start_date'] = false;
      this.setWorkerDetails(candidateId);
    }
  }

  selectedVendor: any;
  vendorSelected(vendorObj) {
    const dropdownOpt = this.dropDownOptions?.vendor_id;
    this.selectedVendor = dropdownOpt.find(ven => ven?.vendor?.id === vendorObj?.vendor?.id);
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
          const vendorDropOpt = this.dropDownOptions?.vendor_id;
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
          this.assignmentCreateForm.get('original_start_date').setValue(this.datePipe.transform(getDateFromString(workerDetails?.original_start_date), this.dateFormat))
          this.assignmentCreateForm.get('official_email').setValue(workerDetails?.official_email)
          this.assignmentCreateForm.get('source_type').setValue(workerDetails?.source_type);

          // this.getFormBySlug('vendor_id', true).disable()//WIP-1545:Create Assignment : After Close assignment, candidate needs to show in drop down for create assignment.
          this.allDateFieldDisable['original_start_date'] = true;
          // this.assignmentCreateForm.get('official_email').disable()
          this.assignmentCreateForm.get('source_type').disable()
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
    })
  }

  getVendorDetails(vendor_id, showAllVendor) {
    this._formRendererService.get(`/configurator/programs/${this.programId}/vendors/${vendor_id}`)
      .subscribe(res => {
        if (res && res?.program_vendor) {
          let vendorDropOpt = this.dropDownOptions?.vendor_id || [];
          if(!showAllVendor){
            vendorDropOpt=[];
          }
            vendorDropOpt.push(res?.program_vendor);
            this.selectedVendor = { ...res?.program_vendor };
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: [] };
            this.changeDetectorRef.detectChanges();
            this.dropDownOptions = { ...this.dropDownOptions, vendor_id: vendorDropOpt };
            this.changeDetectorRef.detectChanges();
        }
        this.assignmentCreateForm.get('vendor_id').setValue(vendor_id);
      })
  }

  getFoundationalDefaultValuesForSow() {
    this._formRendererService.get(`/sow/programs/${this.programId}/sow/${this.sow_id}`)
      .subscribe(res => {
        this.selectedFoundationalData = [...res.foundational_data];
      })
  }

  get stepOneValid() {
    return this.assignmentCreateForm.get('candidate_uuid').valid &&
      this.assignmentCreateForm.get('vendor_id').valid &&
      this.assignmentCreateForm.get('official_email').valid &&
      this.assignmentCreateForm.get('source_type').valid &&
      this.assignmentCreateForm.get('original_start_date').valid &&
      (
        this.getFormControl('source_type')?.value === 'migrated_worker_data' ?
          !!this.assignmentCreateForm.get('source_id').value : true)
  }

  get stepTwoValid() {
    return this.assignmentCreateForm.get('hierarchy_id').valid &&
      this.assignmentCreateForm.get('sourcing_model').valid &&
      this.assignmentCreateForm.get('assignment_title_uuid').valid &&
      this.assignmentCreateForm.get('work_location').valid &&
      this.assignmentCreateForm.get('assignment_manager').valid &&
      this.assignmentCreateForm.get('start_date').valid &&
      this.assignmentCreateForm.get('end_date').valid &&
      this.assignmentCreateForm.get('worker_original_start_date').valid &&
      this.isFoundationalFieldsValid &&
      this.isCustomFieldsValid;
  }


  get disableContinue() {
    console.log()
    return (this.activeTab === 'basic-info' && !this.stepOneValid) ||
      (this.activeTab === 'assignment-info' && !this.stepTwoValid)
  }

  setJobTemplate(jobId: any) {
    if (!jobId) {
      return
    }
    const jobList = this.dropDownOptions?.job_id || [];
    const job = jobList.find(r => r.id === jobId);
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
          }
        })
    }

  }

  setManager(managerId: any) {
    const managerObj = this.dropDownOptions?.assignment_manager?.find(m => m?.id === managerId);
    if (this.assignmentId) {
      return;
    }
    if (managerObj) {
      const templateDropdownList = this.dropDownOptions?.timesheet_manager || [];
      if (!templateDropdownList.some(temp => temp.id === managerObj.id)) {
        templateDropdownList.push(managerObj);
        this.dropDownOptions.timesheet_manager = templateDropdownList;
        this.dropDownOptions = {...this.dropDownOptions};
        this.assignmentCreateForm.get('timesheet_manager').setValue(managerObj?.id);
      } else {
        this.assignmentCreateForm.get('timesheet_manager').setValue(managerObj?.id);
      }

      const expenseManagerDropdownList = this.dropDownOptions?.expense_manager || [];
      if (!expenseManagerDropdownList.some(temp => temp.id === managerObj.id)) {
        expenseManagerDropdownList.push(managerObj);
        this.dropDownOptions.expense_manager = templateDropdownList;
        this.dropDownOptions = {...this.dropDownOptions};
        this.assignmentCreateForm.get('expense_manager').setValue(managerObj?.id);
      } else {
        this.assignmentCreateForm.get('expense_manager').setValue(managerObj?.id);
      }
    }

  }

  setAssignmentManager(user) {
    const hasValue = (this.dropDownOptions?.assignment_manager || []).some(opt => opt?.id === user?.id);
    if (!hasValue) {
      const opt = this.dropDownOptions?.assignment_manager || [];
      opt.push(user);
      this.dropDownOptions.assignment_manager = opt;
      this.dropDownOptions = {...this.dropDownOptions};
    }
    this.assignmentCreateForm.patchValue({
      assignment_manager: user?.id
    });
    if(!this.assignmentId){      
      this.setManager(user?.id);
    }
  }

  isSaveLoader = false;

  submit() {
    let formValue: any = this.assignmentCreateForm.getRawValue();
    const { is_expense_enabled, is_timesheet_enabled } = formValue;
    if(!is_timesheet_enabled){
      delete formValue.timesheet_manager;
    }
    if (!is_expense_enabled) {
      delete formValue.expense_manager;
    }
    const custom = this.customFields.filter(ele => ele?.values).map(element => {
      return {
        key: element?.slug,
        value: element.values
      }
    });
    const foundational = this.foundationalFields.filter(ele => ele?.values).map(element => {
      return {
        key: element?.slug,
        value: Array.isArray(element.values) ? element.values : [element.values]
      }
    });
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
    let { billrate, payrate, vendor_rate, fee, tax, worker_original_start_date, start_date, end_date, effective_date } = formValue;
    const taxArr = tax.map(f => { delete f.name; return f });
    const feeArr = fee.map(f => { delete f.name; return f });
    formValue = {
      ...formValue,
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

      assignment_title: (this.dropDownOptions.assignment_title_uuid || []).find(assign => assign?.id === formValue['assignment_title_uuid'])?.template_name,
      custom,
      foundational,
      hierarchy_id: formValue?.hierarchy_id[0]
    }
    if (formValue?.sourcing_model?.toLowerCase() === 'headcount tracking') {
      formValue.sourcing_model = 'headcount_track';
    } else if (formValue?.sourcing_model?.toLowerCase() === 'direct hire') {
      formValue.sourcing_model = 'direct_hire';
    }
    if (this.is_activity_based && this.assignmentControl?.is_billable?.value) {
      formValue.activity.forEach(element => {
        if (element && element?.rates && element?.rates?.length > 0) {
          element?.rates.push({ billrate: element?.activity_billrate || 0, payrate: element?.activity_payrate || 0, vendor_rate: element?.activity_vendor_rate || 0, rate_factor: 'st' })
        }
      });
      formValue.rate = formValue?.activity;
      formValue.rate.forEach(element => {
        delete element?.activity_billrate;
        delete element?.activity_payrate;
        delete element?.activity_vendor_rate;
        if (element && element?.rates && element?.rates?.length > 0) {
          element?.rates.forEach(r => {
            delete r?.enable_bill_rate_edit;
            delete r?.enable_pay_rate_edit;
            delete r?.name;
          });
        }
      });
    } else if (this.assignmentControl?.is_billable?.value) {
      let { rate } = formValue;
      rate = rate.map((rateObj: any) => {
        let { billrate, payrate, vendor_rate, rate_factor } = rateObj;
        return { billrate, payrate, vendor_rate, rate_factor };
      })
      // , name: 'Standard time' // need to remove in next PR
      formValue.rate = [{ rates: [...rate, { billrate, payrate, vendor_rate, rate_factor: 'st' }] }]
    }
    if (!this.assignmentControl?.is_billable?.value) {
      formValue.rate = [];
      formValue.tax = [];
      formValue.fee = [];
      delete formValue.activity;
    }
    if (!formValue?.is_timesheet_enabled) {
      formValue.st_hours = this.accuracyPipe?.transform(0, this.accuracyConfig.hour);
      formValue.days_per_week = 0;
    }
    delete formValue?.activity;
    this.loader.show();
    this.isSaveLoader = true;
    if (!this.assignmentId) {
      this._formRendererService.post(`/assignment/programs/${this.programId}/assignment`, formValue)
        .subscribe({
          next: (data: any) => {
            if (data?.code === 200) {
              this.isSaveLoader = false;
  
              this.alert.success('Assignment has been created successfully.')
              this.loader.hide();
              this.router.navigate([`/assignment/details/${data.data.assignment_id}/final`], { queryParams: { tab: 'assignment' } });
            }
          },
          error: err => {
            this.isSaveLoader = false;
            this.loader.hide();
            this.alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } })
          }
        })
    } else {

      this.assignmentService.updateAssignmentDetails(this.programId, this.assignmentId, formValue).subscribe({
        next: (data: any) => {
          if (data?.code === 200) {
            this.alert.success('Assignment updated successfully!');
            this.loader.hide();
            this.isSaveLoader = false;
            this.router.navigate([`/assignment/all-list`]);
          }
        },
        error: err => {
          this.loader.hide();
          this.isSaveLoader = false;
          if (err?.error?.error?.errors?.length > 0 && err.error.error.errors[0]?.message) {
            this.alert.error(err.error.error.errors[0].message);
          } else if (err?.error?.error?.message) {
            this.alert.error(err.error?.error.message)
          } else {
            this.alert.error(errorHandler(err));
          }
        }
      })
    }

  }

  foundationalFields: any[] = [];
  isFoundationalFieldsValid = true;
  setFoundationalFieldsFormValid(event) {
    this.isFoundationalFieldsValid = event;
  }

  foundationalFieldUpdated(event) {
    this.foundationalFields = event;
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
    this.reasonCodesService.getResoncodesFor('REQUEST_AMENDMENT').subscribe((updateReason: any) => {
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
        this._formRendererService.post(`/assignment/programs/${this.programId}/assignments/upload`, payload).subscribe({
          next: (data: any) => {
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
          }
        });
      }
    }
  }

  onCandidateCreated(event) {
    if (event) {
      this.dropDownOptions.candidate_uuid.push(event);
      this.dropDownOptions = { ...this.dropDownOptions }
      this.assignmentCreateForm.get('candidate_uuid').setValue(event?.id);
      this.candidateSelected(event?.id)
    }
  }

  search(slug, event) {
    const value = event?.term;
    const urlObj = this.dataSourceUrl?.find(data => data?.slug === slug);
    if (urlObj && urlObj?.datasource?.type === 'url' && urlObj?.datasource?.url?.endsWith('k=')) {
      let url = urlObj?.datasource?.url.replace('${programId}', this.programId);
      if (slug != 'work_location') {
        url += value;
      }

      if (slug === 'work_location') {
        url = this.getURLForWorkLocation(value);
      }

      this._formRendererService.get(url).subscribe((data: any[]) => {
        if (data) {
          urlObj?.datasource?.getBy.forEach(d => {
            data = data[d]
          });
          const selectedOption = this.assignmentCreateForm?.get(urlObj?.slug);
          let selectedOptionDrop;
          if (selectedOption && selectedOption?.value && this.dropDownOptions && this.dropDownOptions[urlObj?.slug]) {
            selectedOptionDrop = this.dropDownOptions[urlObj?.slug].find(op => op[urlObj?.bind_value] === selectedOption?.value);
            data.push(selectedOptionDrop)
          }
          this.dropDownOptions[urlObj?.slug] = data;
          if (data?.length === 1 && urlObj?.bind_value && !this.assignmentId) {
            this.assignmentCreateForm.patchValue({
              [urlObj?.slug]: data[0][urlObj?.bind_value]
            });
          }
        }
      })
    }
  }

  showMoreActivity() {
    this.moreActivity = true;
  }

  editActivityName(i) {
    if (i !== -1) {
      this.editActivity = i;
    }
  }
  closeEditing($event) {
    if ($event) {
      this.editActivity = undefined;
    }
  }

  getURLForWorkLocation(value): string {
    let url = WORK_LOC_URL;
    url = url.replace('${programId}', this.programId);
    const formValue = this.assignmentCreateForm.getRawValue();
    const { hierarchy_id } = formValue;
    if (hierarchy_id) {
      url += `hierarchy_id=${hierarchy_id}&`;
    }
    if (value) {
      url += `k=${value}`;
    }
    return url;
  }

  handleRateFactorRes = (res) => {
    if (res) {
      const { rate_factors } = res;
      const arrayValues = this.assignmentData?.assignments?.finance?.rate?.[0]?.rates || [];
      if (rate_factors) {
        this.ratesArray.clear();
        this.rateFactor = rate_factors;
        if (!this.is_activity_based) {
          for (let index = 0; index < rate_factors.length; index++) {
            const element = rate_factors[index];
            const valObj = arrayValues.find(r => r.rate_factor.toLowerCase() === element?.abbreviation.toLowerCase());
            const rateForm = this.fb.group({
              rate_factor: [element?.abbreviation],
              name: [element.name],
              billrate: [this.accuracyPipe.transform(valObj?.billrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
              payrate: [this.accuracyPipe.transform(valObj?.payrate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required],
              vendor_rate: [this.accuracyPipe.transform(valObj?.vendor_rate ?? 0, this.accuracyConfig.rate, { isEdit: true}), Validators.required]
            }, {
              validators: [this.payRateValidator]
            });
            let formArray = this.assignmentCreateForm.get('rate') as UntypedFormArray;
            formArray.push(rateForm);
          }
          const valObj = arrayValues.find(ra => ra?.rate_factor.toLowerCase() === 'st' || ra?.rate_factor.toLowerCase() === 'regular');
          if (valObj) {
            this.assignmentCreateForm.patchValue(valObj);
          }
          this.changeDetectorRef.detectChanges();
        } else {
          this.activityArray.clear();
          this.initializeActivity();
          this.updateRateFactorActivity(0, this?.assignmentId ? false : true);
          this.changeDetectorRef.detectChanges();
        }
        this.changeMarkupOption();
      }
    }
  }
  defaultWorkLocation = (work_location) => {
    if (work_location) {
      let hasValue = (this.dropDownOptions?.work_location || []).some(opt => opt?.id === work_location?.id);
      if(!hasValue){
        this.dropDownOptions['work_location'] = [...this.dropDownOptions?.work_location,work_location.entity_object];
      }
      hasValue = (this.dropDownOptions?.work_location || []).some(opt => opt?.id === work_location?.id);
      this.assignmentCreateForm.patchValue({
        work_location: hasValue ? work_location?.id : null
      });
    }else{
      this.assignmentCreateForm.patchValue({
        work_location: null
      });
    }
  }

  loadDefaultMemberValue(value) {
    let defaultFoundationValues = [];
    let defaultWorkLocation = null;
    if (value) {
      this._formRendererService.get(`/configurator/programs/${this.programId}/members/${value?.id}`).subscribe({
        next: result => {
          if (result?.member?.defaults) {
            let defaults: Array<any> = result.member?.defaults;
            if (defaults && defaults.length > 0) {
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
                    defaultFoundationValues.push(foundational_value);
                  }
                }
              })
            }
          }
          if (result?.member?.work_locations && result?.member?.work_locations.length > 0) {
            defaultWorkLocation = {
              id: result?.member?.work_locations[0]?.id,
              entity_type: 'WORK_LOCATION',
              entity_object: result?.member?.work_locations[0]
            }
          }
          this.selectedFoundationalData = [...defaultFoundationValues]
          this.defaultWorkLocation(defaultWorkLocation);
        },
        error: () => {
          this.selectedFoundationalData = [];
        }
      })
    }
  }

  ngOnDestroy() {
    this.dataSourceUrl.forEach((item:any)=> {
      if(item?.subscription) {
        item?.subscription?.unsubscribe();
      }
    })
  }
  checkAndAssignActiveOn(formValue: any) {
    if (this.isVendor){
      formValue.active_on = AssignmentActiveUpon.After_Approval;
    }
  }
  clearActiveOnValidationforVendor() {
    if (this.isVendor) {
      this.assignmentCreateForm.get('active_on').clearValidators();
    }
  }
 
}
