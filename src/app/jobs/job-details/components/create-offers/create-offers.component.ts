import { AccountCodeData } from './../../../../library/account-code-generate/models/account-code-data';
import { Component, Input, OnChanges, OnDestroy, OnInit, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concat, forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobService } from 'src/app/jobs/job.service';
import { AccessType, AccuracyConfigEnum, UsersType } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobDetailsService } from '../../job-details.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { HttpService } from 'src/app/core/services/http.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-offers',
  templateUrl: './create-offers.component.html',
  styleUrls: ['./create-offers.component.scss'],
})
export class CreateOffersComponent implements OnInit, OnChanges, OnDestroy {
  createOfferForm: UntypedFormGroup;
  checkedMarkUp: boolean = true;
  checkedotPayRate: boolean = true;
  checkedotBillRate: boolean = true;
  checkeddtBillRate: boolean = true;
  checkeddtPayRate: boolean = true;
  @Input() candidateDetails?: any;
  public jobManagerList$?: Observable<any>;
  public timesheetmanagerList$?: Observable<any>;
  public holidayCalenderList: any = [];
  public timesheetManagerTypeAhead$: Subject<any> = new Subject<any>();
  public expenseManagerTypeAhead$: Subject<any> = new Subject<any>();
  public workLocationTypeAhead$: Subject<any> = new Subject<any>();
  public jobManagerTypeAhead$: Subject<any> = new Subject<any>();
  minLengthTerm: Number = 3;
  private subscriptions = [];
  @Input() isopen: boolean = false;
  markupConfig = 0;
  rateConfig;
  submitted: boolean = false;
  clientOverTimeRateFactor;
  clientDoubleTimeRateFactor;
  rateModel: any = 'pay_rate';
  offerPayRate: any = 0;
  overTimePayRate: any = 0;
  doubleTimePayRate: any = 0;
  offerBillRate: any = 0;
  doubleTimeBillRate: any = 0;
  overTimeBillRate: any = 0;
  isDisabled: boolean = false;
  minNum: any = 0;
  maxNum: any = 0;
  minPayNum: any = 0;
  maxPayNum: any = 0;
  optionsStartDate: any;
  optionsEndDate: any;
  optionsTenureDate: any;
  vendorId: any;
  getRateMarkUpValue: any;
  selectedSourceType: any;
  jobCurrency = 'USD';
  startDate;
  start;
  endDate;
  end;
  markupConfigOriginal = 0;
  clientOverTimeBillRateFactor;
  clientDoubleTimeBillRateFactor;
  prefferedfDateFormate: any;
  clientOverTimePayRateFactor;
  clientDoubleTimePayRateFactor;
  submission_exceed_max_bill_rate;
  jobId;
  jobLoading: boolean = true;
  loadingJobmanager: boolean = true;
  loadingTimeSheetManager: boolean = true;
  loadingExpenseManager: boolean = true;
  loadingWorkLocation: boolean = true;
  initialValues;
  currentProgram;
  programRateModel;
  timesheetTypeSelected;
  loadingtimesheetType: boolean = true;
  timesheetTypeList: any = [];
  private originalMarkUp: number = 0;
  loadingholidayCalender: boolean = true;
  private subscription: Subscription[] = [];
  public ratefactorLoading: boolean = true;
  public jobdetailsLoading: boolean = true;
  public isLoader: boolean = false;
  public isBillDriven = false;
  @Input() isfeomDetails?: boolean = false;
  public today = new Date();
  public holidayCalenderSelected;
  public assignment_workflow_selected;
  public jobmanagerSelected;
  public workLocationSelected;
  public timesheetManagerSelected;
  public expenseManagerSelected;
  private previous_OTPayRate;
  private previous_DTPayRate;
  private previous_OTBillRate;
  private previous_DTBillRate;
  isCustomFieldsFormValid: boolean = true;
  isFoundationalFieldsValid: boolean = true;
  foundationalFieldsFormData: any = undefined;
  customFieldsFormData: any = undefined;
  isVendorUser: boolean = false;
  isReviewMode:boolean = false;
  public customCurrency = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency
    ? this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency
    : 'USD';
  showOverlapWarning: boolean = false;
  allowAssignmentOverlap: boolean;
  overlapAssignmentData = [];
  @Input() set offerPageMode(value : String){
    if(value==='review'){
      this.isReviewMode=true;
      this._offerPageMode='edit';
    }
    else{
      this._offerPageMode=value;
    }
  };
  _offerPageMode:String;
  get offerPageMode(){
    return this._offerPageMode;
  }
  @Input() offerId: any;
  @Input() candidateId: any;
  @Input() public offerDetails: any;
  @Output() offerModeReset = new EventEmitter();
  public getOfferDetailsLoading: boolean = true;

  public jobDetails: any;
  public programModel: string;
  approvalStatus: any;
  programId: any;
  offerDetailStageData;
  isOfferDateDisabled = false;
  standardRate: any;
  public accountCodeCreationActive: boolean = false;
  public accountCodeData: AccountCodeData;
  showAccountCode = 'hidden';
  tenureSpan: any;
  tenureSpanUnit: any;
  tenureMessage: any;
  logs: Log = undefined;
  userType: any;
  workerStartDate: boolean = false;
  jobDetailsData: any;
  jobLaborCategory;
  jobHierarchy;
  jobWorkLocation;
  customFields: any;
  submissionCustomFields: any;
  stFlatAdustment;
  workLocations;
  pageNo;
  isOfferEndDateDisabled: boolean = false;
  workerStateName;
  otRateFactors: any;
  vendorBillRate;
  clientBillRate;
  factorClientBillRate;
  user_type;
  rateModelObj = {
    BILL_RATE: 'billrate',
    MARKUP: 'markup',
    PAY_RATE: 'payrate',
  };
  mspFee;
  amount_type;
  applicable_on;
  funded_by;
  allowOfferMinRate;
  timeSheetTypeValue;
  offerBudgetInfo;
  accuracyConfig = AccuracyConfigEnum;
  isfeesIncluded: boolean;
  isSourced: boolean = false;
  isPayroll: boolean = false;
  isCandidateSourcingTypeChanged: boolean = false;
  isMarkupCalled: boolean = false;
  isCreate: boolean;
  items = [{ value: 'Yes' }, { value: 'No' }];
  modalVisibility: boolean = false;
  isCreateEstimate = false;
  additional_amount;
  adjustment_value;
  adjustment_type;
  workingData;
  disabledEstimate: boolean = true;
  jobFoundationalData;
  multipleApprovers;
  showExpenseManager: boolean = false;
  remote_worker: boolean = false;
  remote_worker_details: any;
  candidatePrimaryAddress: any;
  candidateRemoteWorkerDetails: any;
  countryValidated: boolean = true;
  rate_factors_arr;
  isRatesFromJob;
  is_ot_exempt: any = false;
  jobRates;
  oTJobRates;
  rateFactor: any[] = [];
  ratesConfiguration;
  noOTRateFactors;
  rateFactorFomrula: Map<string, any> = new Map<string, any>();
  onboardingCheckListData;
  selectedOnboardingItem;
  configRateFactors;
  stRateFactor;
  hybridTimesheetSelected: boolean;
  private workLocCopy = [];
  private jobManagerAssociatedWorkLoc = [];
  usersearchLocation = new Subject<string>();
  taxData:any;
  adjustmentData:any
  canClientEditManager: any;
  isTaxValid:boolean = false;
  isShowTax: boolean = false;
  otFactorsPopover: number = null;
  popoverType: string = '';
  currentlyEditingRateIndex: number | null = null;
  currentlyEditingRateType: string | null = null;
  payloadRateFactors:any;
  remoteLocation: any;
  stRateFactorInfo:any;
  setRateFactorValues;
  timesheetChanged: boolean = false;
  offerRateFactors:any;
  hrybridTimesheetRateFactors:any;
  rateDetailsVisible: boolean = false;
  costComponentEnabled: boolean = false;
  isRatesUpdated:boolean = false;
  otExemptChanged;
  copyJobFactors;
  candidateRateFactors;
  overTimeExemptRateFactors;
  updatedHybridFactors;
  updatedConfigRates;
  updatedMarkupRateFactors;
  newWorkflow: boolean = false;
  fee_details;
  fee_info;
  constructor(
    private fb: UntypedFormBuilder,
    private jobdetailService: JobDetailsService,
    private alert: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe,
    private userPermissionService: UserPermissionService,
    private jobService: JobService,
    private candidateService: CandidateService,
    private accuracy: AccuracyPipe,
    private loaderService: LoaderService,
    private changeD: ChangeDetectorRef,
    public httpService: HttpService,
    private authorizationService: AuthorizationService
  ) {
    this.createForm();
  }

  onCloseModal() {
    this.modalVisibility = false;
  }

  showEstimation(value?) {
    this.isCreateEstimate = true;
    this.modalVisibility = false;
  }

  closePopup(event) {
    this.isCreateEstimate = false;
    if (event) {
      this.offerBudgetInfo = event;
      this.createOfferForm.patchValue(this.offerBudgetInfo);
    }
  }

  openCreateEstimateOpen(hidePopUpModal?) {
    this.isCreateEstimate = true;
    if (hidePopUpModal) {
      this.modalVisibility = false;
    }
  }

  createForm() {
    this.createOfferForm = this.fb.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      jobManager: ['', [Validators.required]],
      locations: [null, [Validators.required]],
      timesheetManager: ['', [Validators.required]],
      expenseManager: ['', [Validators.required]],
      timesheetType: ['', [Validators.required]],
      holidayCalender: [''],
      rateType: ['', [Validators.required]],
      minBillRate: ['', [Validators.required]],
      maxBillRate: ['', [Validators.required]],
      markUp: false,
      markUpValue: [{ value: this.markupConfig, disabled: true }, [Validators.required]],
      rateMarkUpValue: [''],
      tenure_date: ['', [Validators.required]],
      candidatePayRate: [this.offerPayRate, [Validators.required, negetiveNotAllowed]],
      billRatevalue: [this.standardRate, [Validators.required, negetiveNotAllowed]],
      vendorBillRateValue: [[Validators.required, negetiveNotAllowed]],
      DefaultRateValue: [],
      clientBillRate: [],
      vendorBillRate: [],
      notes: [],
      assignment_workflow: ['', [Validators.required]],
      rates: this.fb.array([]),
      worker_email: ['', [Validators.required, Validators.email]],
      account_code: [null],
      candidate_sourcing_type: [null, Validators.required],
      allow_expense: [],
      adjustment_type: [],
      adjustment_value: [],
      additional_amount: [],
      budget_estimate: [],
      estimated_adjustment: [],
      single_net_budget: [],
      single_initial_budget:[],
      week_working_days : [],
      hours_per_day : [],
      remote_worker: [],
      is_ot_exempt: [false],
      onboarding_checklst: ['', [Validators.required]],
      adjustmentData:[],
      tax:[],
      review_notes:['']
    });

    this.initialValues = this.createOfferForm.getRawValue();
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.currentProgram) {
      this.prefferedfDateFormate = this.currentProgram.defaultDateFormat;
      this.prefferedfDateFormate = this.prefferedfDateFormate ? this.prefferedfDateFormate : 'dd-mm-yy';
    }
  }

  ngOnInit(): void {
    this.route?.snapshot.params['id'] || this.route.parent?.snapshot.params['id'];
    this.jobDetails = this.storageService.get('viewd_job');
    if (this.offerPageMode !== 'edit' && this.jobDetails?.foundational_data && this.jobDetails?.foundational_data?.length > 0) {
      this.jobFoundationalData =  this.jobService?.setFoundationFields([...this.jobDetails?.foundational_data]);
      this.jobFoundationalData = this.jobFoundationalData?.filter(x => x?.foundational_data_type?.slug !== 'physical_work_location');
    }
    this.allowOfferMinRate = this.currentProgram?.config?.is_enforce_min_rate;
    this.isRatesFromJob = this.currentProgram?.config?.is_rate_factors_from_job;
    this.userType = this.storageService?.get('user_type');
    this.loadingTimeSheetManager = true;
    this.programId = this.storageService?.get('PROGRAM_ID');
    this.newWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui;
    let accountConfig = this.storageService?.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (accountConfig && accountConfig?.components) {
      this.accountCodeCreationActive = true;
    }
    if (this.accountCodeCreationActive) {
      this.createOfferForm.get('account_code').setValidators([Validators.required]);
    }
    this.isShowTax = this.jobdetailService.showTaxInComponents(this.currentProgram?.config);
    this.isCreate = this.offerPageMode === 'edit' ? false : true;
    if (this.offerPageMode != 'edit') {
      if (this.disableOfferAcceptance) {
        this.assignment_workflow_selected = 'ONBOARDING_COMPLETION';
      } else if (this.disableOnboarding) {
        this.assignment_workflow_selected = 'OFFER_ACCEPTANCE';
      }
    }
    this.route.parent?.params.subscribe(params => {
      this.jobId = this.candidateDetails?.jobId ?? params['id'];
      this.currentProgram = this.storageService?.get(StorageKeys.CURRENT_PROGRAM);
      this.candidateId = this.candidateDetails?.candidateId ?? params['candidateId'];
    });
    this.isOfferDateDisabled = this.currentProgram?.config?.is_offer_date_disabled;
    this.isOfferEndDateDisabled = this.currentProgram?.config?.offer?.disable_offer_end_date_edit;
    this.multipleApprovers = this.currentProgram?.config?.multiple_approval_timesheet_expense;
    if (this.offerPageMode === 'edit') {
      this.getOfferDetails();
    } else {
      this.fetchCandidateDetails();
    }
    this.getJobdetails();
    this.getAssignmentConfig();
    this.subscriptions.push(
      this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_CREATE_OFFER).subscribe(data => {
        if (!data['isopen']) {
          this.createOfferForm.reset(this.initialValues);
        }
        this.jobId = data['jobId'];
      }),
    );
    this.getProgramDetails();
    this.subscriptions.push(
      this.createOfferFormControls.markUpValue.valueChanges.subscribe((val: number) => {
        if (val > this.originalMarkUp || (!val && this.originalMarkUp !== 0)) {
          this.createOfferFormControls['markUpValue'].setErrors({
            max: `Mark up value should not be greater than ${this.originalMarkUp}`,
            required: true,
          });
        } else {
          this.createOfferFormControls['markUpValue'].setErrors(null);
        }
      }),
    );
    this.isVendorUser = this.storageService.get('account')?.role?.organization_category?.toLowerCase() === UsersType.VENDOR?.toLowerCase();
    this.subscriptions.push(
      this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_CREATE_OFFER).subscribe(data => {
        if (!data['isopen']) {
          this.loadingJobmanager = true;
          this.loadingTimeSheetManager = true;
        }
      }),
    );
    this.subscriptions.push(
      this.createOfferFormControls?.startDate?.valueChanges.subscribe(val => {
        this.startDate = new Date(
          this.datePipe.transform(
            this.createOfferFormControls['startDate'].value,
            DATE_FORMAT?.FORMATMDY,
            null,
            null,
            true,
            this.prefferedfDateFormate,
          ),
        );

        this.start = this.startDate.setDate(this.startDate.getDate() + 1);
        this.optionsEndDate = Object.assign(
          {},
          {
            language: 'English',
            enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
          },
        );
        if (this.createOfferFormControls['startDate'].value && this.createOfferFormControls['endDate'].value) {
          if (!this.checkDateMax()) {
            this.getWorkingHoursEstimate();
          }
        }
      }),
    );
    this.subscriptions.push(
      this.createOfferFormControls?.endDate?.valueChanges.subscribe(val => {
        this.endDate = new Date(
          this.datePipe.transform(
            this.createOfferFormControls['endDate'].value,
            DATE_FORMAT?.FORMATMDY,
            null,
            null,
            true,
            this.prefferedfDateFormate,
          ),
        );
        this.end = this.endDate.setDate(this.endDate.getDate() - 1);
        this.optionsStartDate = Object.assign(
          {},
          {
            language: 'English',
            enabledDateRanges: [{ start: this.start, end: this.end }],
          },
        );
        if (this.createOfferFormControls['startDate'].value && this.createOfferFormControls['endDate'].value) {
          if (!this.checkDateMax()) {
            this.getWorkingHoursEstimate();
          }
        }
      }),
    );

    this.subscriptions.push(
      this.createOfferFormControls?.tenure_date?.valueChanges.subscribe(val => {
        this.getEndRange(new Date(val));
      }),
    );

    const programDetail = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetail?.config?.program_model) {
      this.rateModel = programDetail?.config?.program_model;
    }

      this.createOfferForm.controls.candidatePayRate.valueChanges
      .pipe(
        tap(() => (this.isDisabled = true)),
        debounceTime(2000),
        distinctUntilChanged(),
      )
      .subscribe((val: number) => {
        if (this.createOfferForm.controls.candidatePayRate.dirty && this.programRateModel === 'PAY_RATE') {
          if (val > Number(this.maxPayNum) && !this.submission_exceed_max_bill_rate) {
            this.createOfferForm.controls.candidatePayRate.setErrors({
              max: `Maximum number can be ${this.maxPayNum}`,
            });
            return;
          } else if (this.allowOfferMinRate) {
            this.createOfferForm.controls.candidatePayRate.setErrors({
              min: `Minimum number can be ${this.minPayNum}`,
            });
            return;
          } else if (val <= 0) {
            this.createOfferFormControls.candidatePayRate.setErrors({
              min: `Pay Rate can not be zero or empty`,
            });
            return;
          } else {
            this.createOfferForm.controls.candidatePayRate.setErrors(null);
          }
          this.calculateRates('payrate');
        }
      });

      this.createOfferForm.controls.billRatevalue.valueChanges
        .pipe(
          tap(() => (this.isDisabled = true)),
          debounceTime(2000),
          distinctUntilChanged(),
        )
        .subscribe((val: number) => {
          if (this.createOfferForm.controls.billRatevalue.dirty && (this.programRateModel === 'MARKUP' || this.programRateModel === 'BILL_RATE')) {
            if (val > Number(this.createOfferFormControls.maxBillRate.value) && !this.submission_exceed_max_bill_rate) {
              this.createOfferFormControls.billRatevalue.setErrors({
                max: `Maximum can be ${this.createOfferFormControls.maxBillRate.value}`,
              });
              return;
            } else if (this.allowOfferMinRate) {
              this.createOfferFormControls.billRatevalue.setErrors({
                min: `Minimum can be ${this.createOfferFormControls.minBillRate.value}`,
              });
              return;
            } else if (val <= 0) {
              this.createOfferFormControls.billRatevalue.setErrors({
                min: `Bill Rate can not be zero or empty`,
              });
              return;
            } else {
              this.createOfferFormControls.billRatevalue.setErrors(null);
            }
            this.calculateRates('billrate');
          }
        });

    this.createOfferForm.controls.rateMarkUpValue.valueChanges
      .pipe(
        tap(() => (this.isDisabled = true)),
        debounceTime(2000),
        distinctUntilChanged(),
      )
      .subscribe((val: number) => {
        this.createOfferForm.patchValue({
          rateMarkUpValue : this.accuracy.transform(val, AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true})
        },{emitEvent:false})
        if (this.programRateModel == 'BILL_RATE') {
          return;
        }
        if (this.createOfferForm.controls.rateMarkUpValue.dirty && (this.programRateModel === 'MARKUP' || this.programRateModel === 'PAY_RATE') || this.isCandidateSourcingTypeChanged) {
          if (val && this.selectedSourceType === 'Sourced') {
            if (val > Number(this.markupConfigObj?.markups?.sourced_markup)) {
              this.createOfferFormControls.rateMarkUpValue.setErrors({
                max: `Maximum number can be ${this.markupConfigObj?.markups?.sourced_markup}`,
              });
              return;
            }
          } else if (val && this.selectedSourceType === 'Payrolled') {
            if (val > Number(this.markupConfigObj?.markups?.payrolled_markup)) {
              this.createOfferFormControls.rateMarkUpValue.setErrors({
                max: `Maximum number can be ${this.markupConfigObj?.markups?.payrolled_markup}`,
              });
              return;
            }
          } else if (val <= 0) {
            this.createOfferFormControls.rateMarkUpValue.setErrors({
              min: `Mark up can not be zero or empty`,
            });
            return;
          } else {
            this.createOfferFormControls.rateMarkUpValue.setErrors(null);
          }
          this.calculateRates('markup');
        }
      });
      this.onBoardAuthority();

      this.usersearchLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
        if(this.jobManagerAssociatedWorkLoc?.length == 0) {
          this.workLocationSearching = true;
          if (value?.term) {
            this.getWorkLocations(value?.term, true, null);
          } else {
            this.getWorkLocations(null, true);
          }
        } else {
          this.jobManagerAssociatedWorkLoc?.forEach((y)=>y.fullname_derived = `${y?.name} - ${y?.code}`);
          this.workLocations = this.jobManagerAssociatedWorkLoc?.filter((res)=>res?.name?.toLowerCase()?.includes(value?.term?.toLowerCase()));
        }
      });
  }
  workerOriginalDate: any;

  showFactorPopover(index: number, type: string) {
    if (this.otFactorsPopover === index && this.popoverType === type) {
      this.otFactorsPopover = -1;
      this.popoverType = '';
    } else {
      this.otFactorsPopover = index;
      this.popoverType = type;
    }
  }

  popupMessage() {
    let allowExpenseField = this.createOfferFormControls['allow_expense'].value;
    let value = allowExpenseField === 'Yes' ? true : false;
    if (value) {
      this.modalVisibility = true;
      this.showExpenseManager = true;
      if (this.offerPageMode === 'edit' && !this.offerDetailStageData?.expense_managers) {
        let expenseManagerFromJob = this.jobDetailsData['job_manager'] ? this.jobDetailsData['job_manager']['id'] : [];
        this.expenseManagerSelected = this.multipleApprovers ? [expenseManagerFromJob] : expenseManagerFromJob;
      }
    } else {
      this.showExpenseManager = false;
      this.createOfferForm.get('expenseManager').clearValidators();
      this.createOfferForm.get('expenseManager').updateValueAndValidity();
    }
  }

  onBoardAuthority(){
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('manage_onboarding_offer') && this.userType != "SUPER_ORG") {
      return true;
    }
    else {
      this.createOfferForm.get('onboarding_checklst').clearValidators();
      this.createOfferForm.get('onboarding_checklst').updateValueAndValidity();
      return false;
    }
  }

  get hasManageTaxPermission() {
    return ((this.storageService?.get('user_permission')?.includes('manage_tax') || this.taxData?.length > 0) && this.storageService?.get('user_permission')?.includes('view_tax')) ? true : false;
  }

  updateOTFactors(ratesArray) {
    ratesArray?.forEach(element => {
      if (element?.abbreviation.toLowerCase() !== 'st') {
        element.bill_rate = this.removeDuplicates(element.bill_rate, 'bill_rate');
        element.pay_rate = this.removeDuplicates(element.pay_rate, 'pay_rate');
        [...element?.bill_rate, ...element?.pay_rate].forEach((rate) => {
          rate.factor = this.accuracy?.transform("1", AccuracyConfigEnum.RATE, { isEdit: true });
        });
      }
    });
  }

  removeDuplicates(rateArray,keyName) {
    const uniqueRates = new Map();
    return rateArray.filter(rate => {
      const key = rate.rate_type.toLowerCase();
      if (key === keyName && !uniqueRates.has(key)) {
        uniqueRates.set(key, true);
        return true;
    }
        return false;
    });
}

  changeOtExempt(otExempt: boolean) {
    this.is_ot_exempt = otExempt;
    let bill_rate_formula;
    let pay_rate_formula;
    let mainPayRate =  +this.createOfferForm.get('candidatePayRate')?.value;
    let mainBillRate = +this.createOfferForm.get('billRatevalue')?.value;
    const rateMarkupValue = this.createOfferForm?.get('rateMarkUpValue')?.value || null;
    this.otExemptChanged = true;
    if(this.is_ot_exempt){
      this.otRateFactors?.forEach(element => {
        const formula = new Map<string, string>();
        bill_rate_formula = element?.bill_rate;
        pay_rate_formula =  element?.pay_rate;
        let billRate = (bill_rate_formula?.length > 1) ? [bill_rate_formula?.find(x => x.rate_type.toUpperCase() == 'BILL_RATE')] : bill_rate_formula;
        let payRate = (pay_rate_formula?.length > 1) ? [pay_rate_formula?.find(x => x.rate_type.toUpperCase() == 'PAY_RATE')] : pay_rate_formula;
        formula.set('bill_rate', this.getFormula([billRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]));
        formula.set('pay_rate',  this.getFormula([payRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]));
        this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
      });
      const copyFactors = JSON.parse(JSON.stringify((this.payloadRateFactors)));
      this.updateOTFactors(copyFactors);
      copyFactors.forEach(element => {element.markup = rateMarkupValue});
      if(this.costComponentEnabled){
        let stCostComponentValue = this.createOfferForm?.get('costComponent')?.value || {};
        stCostComponentValue = this.removeMakupCostCComponentGroupId(stCostComponentValue);
        copyFactors.forEach(element => {element.cost_component = (stCostComponentValue || null)});
      }
      this.payloadRateFactors = copyFactors;
      this.rate_factors_arr = copyFactors;
      this.overTimeExemptRateFactors = copyFactors;
    }
    else{
      let factors;
      //config Rates
      let configRates = this.isRatesFromJob ? this.jobRates : this.setRateFactorValues;
      configRates = this.jobdetailService?.getRateFactorInfoForPayload(configRates, this.ratesConfiguration, this.hybridTimesheetSelected);
      //this.updatedConfigRates = this.updateMarkupValues(configRates, this.createOfferForm.get('rateMarkUpValue')?.value);
      this.updatedConfigRates = this.getMarkupValuesForBasicRates(configRates, (this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info :
      this.offerDetailStageData?.rate_factors_info));

      //hybrid Rates
      let hybridFactors = this.jobdetailService?.getRateFactorInfoForPayload(this.hrybridTimesheetRateFactors, this.ratesConfiguration, this.hybridTimesheetSelected);
      this.updatedHybridFactors = this.updateMarkupValues(hybridFactors, this.createOfferForm.get('rateMarkUpValue')?.value);

      if(this.costComponentEnabled){
        this.updatedConfigRates = this.getCostComponentValuesForBasicRates(configRates, (this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info :
        this.offerDetailStageData?.rate_factors_info));

        let costComponentValue = this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component :
        this.offerDetailStageData?.rate_factors_info?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component;
        this.updatedHybridFactors = this.updateCostComponentValues(hybridFactors, costComponentValue);
      }

      let newRates = this.hybridTimesheetSelected ? this.updatedHybridFactors :
      this.candidateDetails?.candidate?.ot_exempt ? this.updatedConfigRates : this.candidateRateFactors;
      if(this.offerPageMode === 'edit'){
        if(this.timeSheetTypeValue != this.offerDetailStageData?.timesheet_type?.value){
          newRates = this.hybridTimesheetSelected ? this.updatedHybridFactors : (this.offerDetailStageData?.ot_exempt ? this.updatedConfigRates : this.candidateDetails?.candidate?.rate_factors_info);
        }
      }
      factors =  newRates;
      this.showRateFormulas(factors);
      this.payloadRateFactors = this.rate_factors_arr = factors ? [...factors] : [];
      if(this.isRatesUpdated){
        let stMarkup = this.updatedMarkupRateFactors?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.markup;
        this.payloadRateFactors = this.updateStandardMarkup(this.payloadRateFactors, 'st', stMarkup);
        this.rate_factors_arr = this.updateStandardMarkup(this.rate_factors_arr, 'st', stMarkup);
        let stConstComponent;
        if(this.costComponentEnabled){
          stConstComponent = this.updatedMarkupRateFactors?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component;
          this.payloadRateFactors = this.updateStandardCostComponent(this.payloadRateFactors, 'st', stConstComponent);
          this.rate_factors_arr = this.updateStandardCostComponent(this.payloadRateFactors, 'st', stConstComponent);
        }
        if(this.hybridTimesheetSelected){
          const submissionForm = this.createOfferForm?.get('rates') as UntypedFormArray;
          for (const formRate of (submissionForm).controls) {
            formRate.get('markup').setValue(stMarkup);
            if(this.costComponentEnabled){
              formRate.get('cost_component').setValue(stConstComponent);
            }
          }
        }
      }
    }

    if(this.programRateModel === 'PAY_RATE'){
      if(mainPayRate <= 0){
        return false;
      }
      else{
        this.calculateRates('payrate');
      }
    }
    if(this.programRateModel === 'MARKUP'){
      if(mainPayRate <= 0){
        return false
      }
      else{
        this.calculateRates('markup');
      }
    }
    if(this.programRateModel === 'BILL_RATE'){
      if(mainBillRate <= 0){
        return false
      }
      else{
        this.calculateRates('billrate');
      }
    }

  }
  removeMakupCostCComponentGroupId(obj){
    ['markup', 'cost_component_group_id'].forEach(key =>{
      if(obj?.hasOwnProperty(key)){
        delete obj[key]
      }
    });
    return obj
  }

  updateStandardMarkup(array, abbreviation, newMarkup) {
    return array?.map(item => {
        if (item?.abbreviation?.toLowerCase() === abbreviation) {
            return { ...item, markup: newMarkup };
        }
        return item;
    });
  }

  updateStandardCostComponent(array, abbreviation, costComponentValue) {
    return array?.map(item => {
        if (item?.abbreviation?.toLowerCase() === abbreviation) {
            return { ...item, cost_component: costComponentValue };
        }
        return item;
    });
  }


  getMarkupValuesForBasicRates(payload: any[], info: any[]): any[] {
    const infoMap = new Map<string, any>();
    info.forEach((item) => {
      infoMap.set(item.id, item);
      infoMap.set(item.abbreviation, item);
    });

    return payload.map((item) => {
      const matchingInfo = infoMap.get(item.id) || infoMap.get(item.abbreviation);
      return matchingInfo ? { ...item, markup: matchingInfo?.markup } : item;
    });
  }

  getCostComponentValuesForBasicRates(payload: any[], info: any[]): any[] {
    const infoMap = new Map<string, any>();
    info.forEach((item) => {
      infoMap.set(item.id, item);
      infoMap.set(item.abbreviation, item);
    });

    return payload.map((item) => {
      const matchingInfo = infoMap.get(item.id) || infoMap.get(item.abbreviation);
      return matchingInfo ? { ...item, cost_component: matchingInfo?.cost_component } : item;
    });
  }

  dateChange(){
    this.getWorkerInfo();
    this.jobdetailService.getWorkerDetails(this.candidateId).subscribe((res: any) => {
      let originalStartDate = this.datePipe.transform(res?.data?.worker?.original_start_date, DATE_FORMAT?.FORMATMDY, '', '', true);
      let offerStartDate = this.datePipe.transform(
        this.candidateDetails?.candidate['available_start_date'],
        DATE_FORMAT?.FORMATMDY,
        '',
        '',
        true,
      );
      let formTenureDate = this.createOfferFormControls['tenure_date'].value;
      let originalDate = this.getDate(originalStartDate);
      let offerDate = this.getDate(offerStartDate);
      let OfferStartingDate = this.datePipe.transform(this.candidateDetails?.candidate['available_start_date'], '', '', '', true);

      if (originalDate < offerDate) {
        this.createOfferForm.patchValue({
          tenure_date: OfferStartingDate || '',
        });
      }
      if (OfferStartingDate == formTenureDate) {
        this.createOfferForm.patchValue({
          tenure_date: this.createOfferFormControls['startDate'].value || '',
        });
      }

      let changedStartDate = new Date(this.datePipe.transform(this.createOfferFormControls['startDate'].value, null, null, null, true));
      let apiStartDate = this.datePipe.transform(res?.data?.worker?.original_start_date, '', '', '', true) || '';

      if (changedStartDate > originalDate) {
        this.createOfferForm.patchValue({
          tenure_date: apiStartDate,
        });

        originalStartDate = new Date(originalStartDate);
        this.optionsTenureDate = {
          language: 'English',
          enabledDateRanges: [{ end: originalStartDate.setDate(originalStartDate.getDate()) }],
        };
        return false;
      }
    });

    let ofStartDate = new Date(this.createOfferFormControls['startDate'].value);
    let freezeEnd = ofStartDate.setDate(ofStartDate.getDate());
    this.optionsTenureDate = {
      language: 'English',
      enabledDateRanges: [{ end: freezeEnd }],
    };
  }

  changeRemoteWorker(remoteWorker: boolean) {
    this.remote_worker = remoteWorker ? true : false;
    this.changeLocationValue = true;
    if(!this.remote_worker){
      this.createOfferForm.get('timesheetType').reset();
      this.fetchTimesheetTypes(this.jobDetails,this.createOfferForm.get('locations').value);
    }
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  getWorkerInfo() {
    this.jobdetailService.getWorkerDetails(this.candidateId).subscribe((res: any) => {
      let originalStartDate = this.datePipe.transform(
        res?.data?.worker?.original_start_date,
        this.prefferedfDateFormate,
        '',
        '',
        true,
        DATE_FORMAT?.FORMATMDY,
      );

      let offerStartDate = this.datePipe.transform(
        this.candidateDetails?.candidate['available_start_date'],
        DATE_FORMAT?.FORMATMDY,
        '',
        '',
        true,
      );

      let OfferStartingDate = this.datePipe.transform(this.candidateDetails?.candidate['available_start_date'], '', '', '', true);

      this.workerOriginalDate = originalStartDate;
      let tenureDate;
      if (!res?.data?.worker) {
        tenureDate = OfferStartingDate;
        this.workerStartDate = false;

        this.createOfferForm.patchValue({
          tenure_date: tenureDate || '',
        });
      } else {
        tenureDate = originalStartDate;
        this.workerStartDate = true;

        let originalDate = this.getDate(originalStartDate);
        let offerDate = this.getDate(offerStartDate);

        if (originalDate > offerDate) {
          this.workerStartDate = false;
          tenureDate = OfferStartingDate;
        }

        this.createOfferForm.patchValue({
          tenure_date: tenureDate || '',
        });
      }
    });
  }

  fetchCandidateDetails(offerDetails?) {
    let _url = `/submission-manager/programs/${this.currentProgram?.id}/jobs/${this.jobId}/candidates/${this.candidateId}`;
    if (!offerDetails) {
      _url += `?auto_populate_custom_fields=OFFERS`;
    }
    this.jobdetailService.get(_url).subscribe((res: any) => {
      this.candidateDetails = res;
      this.vendorId = res?.candidate?.vendor_id;
      if(this.offerPageMode != 'edit'){
        this.payloadRateFactors = res?.candidate?.rate_factors_info || []
        this.showRateFormulas(res?.candidate?.rate_factors_info?.filter(rate => rate?.abbreviation?.toLowerCase() !== 'st'));
      }
      this.candidateRateFactors = _.cloneDeep(res?.candidate?.rate_factors_info);
      this.getRateMarkUpValue = res?.candidate?.rate_markup;
      this.customFields = this.candidateDetails?.candidate?.custom_fields || {};
      this.getWorkerInfo();
      this.isopen = true;
      this.fee_info = this.candidateDetails?.candidate?.fee;
      let msp_fee = this.fee_info?.msp_fee;
      this.mspFee = msp_fee?.amount_value;
      this.amount_type = msp_fee?.amount_type;
      this.funded_by = msp_fee?.funded_by;
      this.fee_details = this.fee_info?.fee_details;
      this.costComponentEnabled = this.candidateDetails?.candidate?.is_cost_component;
      if (this.offerPageMode != 'edit') {
        this.selectedSourceType = res?.candidate?.candidate_sourcing_type;
        this.isfeesIncluded = res?.candidate?.is_fees_included;
        this.createOfferForm.patchValue({
          rateMarkUpValue: this.accuracy.transform(this.getRateMarkUpValue, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
          candidate_sourcing_type: res?.candidate?.candidate_sourcing_type,
          remote_worker: this.candidateDetails?.candidate?.remote_worker,
          ot_exempt: this.candidateDetails?.candidate?.ot_exempt,
          adjustmentData: this.candidateDetails?.candidate?.adjustment_fee,
          taxData : this.candidateDetails?.candidate?.taxes
        });
        this.is_ot_exempt = this.candidateDetails?.candidate?.ot_exempt;
        this.patchOTFormulas()
        this.remote_worker = this.candidateDetails?.candidate?.remote_worker;
        if (this.remote_worker) {
          this.candidateRemoteWorkerDetails = this.candidateDetails?.candidate?.remote_worker_details;
        } else {
          this.candidatePrimaryAddress = this.candidateDetails?.candidate?.addresses?.find(x => x.type.toLowerCase() === 'primary');
          this.candidateRemoteWorkerDetails = this.candidatePrimaryAddress;
        }
        this.prefillPayBillrates(this.candidateDetails);
        this.getRateDetails(this.candidateDetails?.candidate?.rates);
        if(this.offerPageMode != 'edit'){
          this.patchSTValues(this.candidateDetails?.candidate?.rates.filter(rate => rate.abbreviation.toLowerCase() == 'st'))
        }
        this.taxData = this.candidateDetails?.candidate?.taxes || [];
        this.adjustmentData = this.candidateDetails?.candidate?.adjustment_fee;
      }
      if (
        this.jobLaborCategory &&
        this.jobHierarchy &&
        this.jobWorkLocation &&
        !this.isMarkupCalled &&
        this.vendorId &&
        (Number(this.createOfferForm.get('rateMarkUpValue').value) ||
          (this.programRateModel == 'BILL_RATE' && this.userType == UsersType.SUPER_ORG))
      ) {
        if (this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP') {
          this.getMarkup(this.vendorId, Number(this.createOfferForm.get('rateMarkUpValue').value));
        }
      }
    });
    this.getCustomFields();
  }
  patchAccountCodeDetails = (accountCodeDetails: AccountCodeData) => {
    this.accountCodeData = accountCodeDetails;
    if (
      this.accountCodeCreationActive &&
      this.accountCodeData &&
      this.accountCodeData.fields?.length > 0 &&
      this.accountCodeData.account_code
    ) {
      this.createOfferForm.patchValue({
        account_code: this.accountCodeData.account_code,
      });
    } else {
      this.createOfferForm.patchValue({
        account_code: null,
      });
    }
  };

  onChangeJobManager(event, resetWorkLoc?, isPatchOfferWorkLoc?) {
      if (event?.id) {
        this.workLocations = []
        let entity_object;
        this.jobService.get(`/configurator/programs/${this.programId}/members/${event?.id}`).subscribe( (res:any) => {
          if (resetWorkLoc) {
            this.createOfferForm.patchValue({
              locations: null
            });
            let indx = res['member']?.defaults?.findIndex(a => a.entity_type == "WORK_LOCATION");
            if (indx != -1) {
              entity_object = res['member']?.defaults?.find(a => a.entity_type == "WORK_LOCATION")?.entity_object
              this.workLocations.push({
                ...entity_object,
                fullname_derived: `${entity_object?.name} - ${entity_object?.code}`
              });
              this.workLocations = [...this.workLocations]
              this.createOfferForm.patchValue({
                locations: entity_object?.id
              })
            }
          }
          if(res?.member?.work_locations?.length > 0) {
            this.jobManagerAssociatedWorkLoc = res?.member?.work_locations;
            this.jobManagerAssociatedWorkLoc?.forEach((y)=>y.fullname_derived = `${y?.name} - ${y?.code}`);
            this.workLocations = this.jobManagerAssociatedWorkLoc;
          } else {
            this.workLocations = [...this.workLocCopy];
            if(entity_object?.id) {
              this.workLocations.push({
                ...entity_object,
                fullname_derived: `${entity_object?.name} - ${entity_object?.code}`
              });
            }
            this.jobManagerAssociatedWorkLoc = [];
          }
          if(isPatchOfferWorkLoc) {
            if (this.offerId && this.offerDetailStageData) {
              const hasWorkLocInList = this.workLocations.some(mem => mem?.id === this.offerDetailStageData?.offer_work_location?.work_location?.id);
              if(!hasWorkLocInList) {
                this.workLocations.push({
                  ...this.offerDetailStageData?.offer_work_location?.work_location,
                  fullname_derived: `${this.offerDetailStageData?.offer_work_location?.work_location?.name} - ${this.offerDetailStageData?.offer_work_location?.work_location?.code}`,
                });
                this.workLocations = [...this.workLocations];
              }
            }
          }
        }
        );
      }
  }
  getOfferDetails() {
    if (this.offerId) {
      this.fetchCandidateDetails(this.offerId);
      this.getOfferDetailsLoading = true;
      this.subscriptions.push(
        this.jobdetailService.getOfferDetails(this.jobId, this.candidateId, this.offerId).subscribe(res => {
          this.getOfferDetailsLoading = false;
          this.offerDetails = res;
          this.patchAccountCodeDetails(this.offerDetails?.offer?.account_code_data);
          if (this.offerDetails?.offer?.foundational_data && this.offerDetails?.offer?.foundational_data?.length > 0) {
            this.offerDetails.offer.foundational_data = this.jobService?.setFoundationFields(this.offerDetails?.offer?.foundational_data);
          }
          let offerDetails = res['offer'] || {};
          let offerDetailsStage = offerDetails['stages'][0] || [];
          this.hybridTimesheetSelected = offerDetailsStage?.is_hybrid;
          this.offerDetailStageData = offerDetailsStage;
          this.is_ot_exempt = offerDetailsStage?.ot_exempt;
          this.patchOTFormulas();
          let rateDetails = offerDetailsStage?.rates;
          this.getRateDetails(rateDetails);
          this.timeSheetTypeValue = offerDetailsStage?.timesheet_type?.value;
          this.patchSTValues(offerDetailsStage?.rates.filter(rate => rate.abbreviation.toLowerCase() == 'st'))
          this.taxData = offerDetails?.taxes || [];
          this.originalMarkUp = offerDetailsStage['rate_markup'];
          let start_date: any = this.datePipe.transform(offerDetailsStage['start_date'], this.prefferedfDateFormate, '', '', true);

          let end_date: any = this.datePipe.transform(offerDetailsStage['end_date'], this.prefferedfDateFormate, '', '', true);

          let tenure_date: any = this.datePipe.transform(offerDetailsStage['tenure_date'], this.prefferedfDateFormate, '', '', true);

          this.rateModel = 'rate_model' in offerDetails && !!offerDetails['rate_model'] ? offerDetails.rate_model : 'pay_rate';

          this.jobmanagerSelected = !!offerDetailsStage['job_manager'] ? offerDetailsStage['job_manager']['id'] : '';
          this.onChangeJobManager({id:offerDetailsStage['job_manager']['id']}, false, true);
          let timesheetManagers = !!offerDetailsStage['timesheet_manager'] ? offerDetailsStage['timesheet_manager'] : [];
          let expenseManagers = !!offerDetailsStage['expense_managers'] ? offerDetailsStage['expense_managers'] : [];
          let timesheetIds = timesheetManagers.map(item => item.id);
          let expenseIds = expenseManagers.map(item => item.id);
          this.timesheetManagerSelected = this.multipleApprovers ? timesheetIds : timesheetIds[0];
          this.expenseManagerSelected = this.multipleApprovers ? expenseIds : expenseIds[0];
          this.workLocationSelected = !!offerDetailsStage['offer_work_location']
            ? offerDetailsStage?.offer_work_location['work_location']?.['id']
            : '';
          this.holidayCalenderSelected = offerDetailsStage['holiday_calendar_id'];
          let ofStartDate = new Date(this.createOfferFormControls['startDate'].value);
          let freezeEnd = ofStartDate.setDate(ofStartDate.getDate());
          this.optionsTenureDate = {
            language: 'English',
            enabledDateRanges: [{ end: freezeEnd }],
          };
          (this.timesheetTypeSelected = offerDetailsStage?.timesheet_type?.id),
            this.createOfferForm.patchValue({
              startDate: start_date === '' ? '' : start_date,
              endDate: end_date === '' ? '' : end_date,
              tenure_date: tenure_date === '' ? '' : tenure_date,
              notes: offerDetailsStage['notes'],
              markUpValue: this.accuracy.transform(+offerDetailsStage['rate_markup'], AccuracyConfigEnum.MARKUP_PERCENTAGE, {
                isEdit: true,
              }),
              rateMarkUpValue: this.accuracy.transform(+offerDetailsStage['rate_markup'], AccuracyConfigEnum.MARKUP_PERCENTAGE, {
                isEdit: true,
              }),
              rateType: offerDetails['rate_type'],
              candidate_sourcing_type: offerDetailsStage?.candidate_sourcing_type,
              allow_expense: offerDetailsStage?.is_expense_allowed ? 'Yes' : 'No',
              expenseManager: this.expenseManagerSelected,
              remote_worker: offerDetails?.remote_worker,
              adjustmentData: offerDetails?.adjustment_fee,
              taxData : offerDetails?.taxes
            });
            this.adjustmentData = offerDetails?.adjustment_fee || [];
          this.remote_worker = offerDetails?.remote_worker;
          if (this.remote_worker) {
            this.candidateRemoteWorkerDetails = offerDetails?.remote_worker_details;
          } else {
            this.candidatePrimaryAddress = this.candidateDetails?.candidate?.addresses?.find(x => x.type.toLowerCase() === 'primary');
            this.candidateRemoteWorkerDetails = this.candidatePrimaryAddress;
          }
          if (offerDetailsStage?.is_expense_allowed) {
            this.showExpenseManager = true;
          }
          if (!offerDetailsStage?.is_expense_allowed) {
            this.showExpenseManager = false;
            this.createOfferForm.get('expenseManager').clearValidators();
            this.createOfferForm.get('expenseManager').updateValueAndValidity();
          }
          let offerData = offerDetailsStage?.rate_markup_info;
          this.showRateFormulas(offerDetailsStage?.rate_factors_info.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
          this.rate_factors_arr = offerDetailsStage?.rate_factors_info || [];
          this.payloadRateFactors = offerDetailsStage?.rate_factors_info || [];
          this.offerRateFactors = _.cloneDeep(offerDetailsStage?.rate_factors_info);
          if (this.isEmptyObject(offerDetailsStage?.rate_markup_info) || !offerDetailsStage?.rate_markup_info) {
            this.createOfferForm.patchValue({
              adjustment_type: this.adjustment_type,
              adjustment_value: this.adjustment_value,
              additional_amount: this.additional_amount,
            });
          } else {
            this.createOfferForm.patchValue({
              adjustment_type: offerData?.adjustment_type,
              adjustment_value: offerData?.adjustment_value,
              additional_amount: offerData?.additional_amount,
              budget_estimate: offerData?.budget_estimate,
              estimated_adjustment: offerData?.estimated_adjustment,
              single_net_budget: offerData?.single_net_budget,
              single_initial_budget: offerData?.single_initial_budget,
            });
          }
          this.selectedSourceType = offerDetailsStage?.candidate_sourcing_type;
          if (
            this.jobLaborCategory &&
            this.jobHierarchy &&
            this.jobWorkLocation &&
            !this.isMarkupCalled &&
            this.vendorId &&
            (Number(this.createOfferForm.get('rateMarkUpValue').value) ||
              (this.programRateModel == 'BILL_RATE' && this.userType == UsersType.SUPER_ORG))
          ) {
            if (this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP') {
              this.getMarkup(this.vendorId, this.createOfferForm.get('rateMarkUpValue').value);
            }
          }
          this.getTenure(this.jobDetails?.hierarchy[0]?.id, new Date(offerDetailsStage['tenure_date']));
          this.createOfferForm.updateValueAndValidity();

          this.previous_OTPayRate = +offerDetailsStage['ot_pay_rate'];
          this.previous_DTPayRate = +offerDetailsStage['dt_pay_rate'];
          this.previous_OTBillRate = +offerDetailsStage['ot_bill_rate'];
          this.previous_DTBillRate = +offerDetailsStage['dt_bill_rate'];
          this.assignment_workflow_selected = offerDetails['assignment_workflow'];

          this.startDate = !!this.createOfferFormControls['startDate'].value
            ? new Date(this.createOfferFormControls['startDate'].value)
            : '';
          this.start = !!this.startDate ? this.startDate.setDate(this.startDate.getDate()) : '';
          this.endDate = !!this.createOfferFormControls['endDate'].value ? new Date(this.createOfferFormControls['endDate'].value) : '';
          this.end = !!this.endDate ? this.endDate.setDate(this.endDate.getDate() + 1) : '';

          this.optionsStartDate = {
            language: 'English',
            enabledDateRanges: [{ start: !!this.start ? this.start : this.today?.setDate(this.today?.getDate() - 1) }],
          };
          this.optionsEndDate = {
            language: 'English',
            enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
          };

          this.fetchJobManagers();
          this.fetchTimesheetManagers();
          this.fetchExpenseManagers();
          //this.fetchTimesheetTypes();
          this.getHolidayCalenderList();
          this.setOfferDetails();
        }),
      );
    }
  }
  getMarkupValidate() {
    this.subscriptions.push(
      this.createOfferFormControls.rateMarkUpValue.valueChanges.subscribe((val: number) => {
        if (this.createOfferForm.controls.rateMarkUpValue.dirty) {
          if (val && this.selectedSourceType === 'Sourced') {
            if (val > Number(this.markupConfigObj?.markups?.sourced_markup)) {
              this.createOfferFormControls.rateMarkUpValue.setErrors({
                max: `Maximum number can be ${this.markupConfigObj?.markups?.sourced_markup}`,
              });
              return;
            }
          } else if (val && this.selectedSourceType === 'Payrolled') {
            if (val > Number(this.markupConfigObj?.markups?.payrolled_markup)) {
              this.createOfferFormControls.rateMarkUpValue.setErrors({
                max: `Maximum number can be ${this.markupConfigObj?.markups?.payrolled_markup}`,
              });
            }
            return;
          } else if (val <= 0) {
            this.createOfferFormControls.rateMarkUpValue.setErrors({
              min: `Mark up can not be zero or empty`,
            });
            return;
          } else {
            this.createOfferFormControls.rateMarkUpValue.setErrors(null);
          }
        }
      }),
    );
  }

  formatted_working_days: any;
  working_hours: any;
  queryStringWorkEstimate: any;
  async getWorkingHoursEstimate() {
    let week_working_days = this.createOfferForm.get('week_working_days').value;
    let hours_per_day = this.createOfferForm.get('hours_per_day').value;
    let start_date = this.datePipe.transform(this.createOfferForm.get('startDate').value, '', null, null, true, this.prefferedfDateFormate);
    let end_date = this.datePipe.transform(this.createOfferForm.get('endDate').value, '', null, null, true, this.prefferedfDateFormate);
    // start_date= this.getDate(start_date);
    // end_date= this.getDate(this.createOfferForm.get('endDate').value);

    start_date = this.datePipe.transform(start_date, DATE_FORMAT?.FORMATYMD, '', '', true, this.prefferedfDateFormate);
    end_date = this.datePipe.transform(end_date, DATE_FORMAT?.FORMATYMD, '', '', true, this.prefferedfDateFormate);

    if (start_date && end_date && week_working_days && hours_per_day) {
      await this.jobdetailService
        .get(
          `/core-money/programs/${this.currentProgram?.id}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`,
        )
        .subscribe({
          next: (data: any) => {
            if (data && data.data) {
              this.workingData = data?.data;
              this.formatted_working_days = data?.data?.formatted_working_days;
              this.working_hours = data?.data?.working_hours;
              // this.createJobForm.patchValue(data.data);
              this.getResourceBudget(start_date, end_date);
            }
          },
          error: error => {
            // this.alert.error(errorHandler(error), {});
            this.showError(error);
          },
        });
    }
  }

  totalBudget: any;
  async getResourceBudget(startDate, endDate) {
    let formData = JSON.parse(JSON.stringify(this.createOfferForm.getRawValue()));
    let mainBillRate = this.createOfferForm.getRawValue()['billRatevalue'];
    let request: any = {};
    let effective_data_arr = [];
    let { rateType } = formData;
    request.total_hours = this.working_hours;
    request.rate = mainBillRate;
    request.week_working_days = this.createOfferForm.get('week_working_days').value;
    request.hours_per_day = this.createOfferForm.get('hours_per_day').value;

    request.adjustment_fee = this.adjustmentData || this.createOfferForm.get('adjustmentData').value;

    if (!mainBillRate || !rateType || !startDate || !endDate) {
      return;
    }

    let req: any = {};

    req.start_date = startDate;
    req.end_date = endDate;
    req.num_resources = 1;
    req.additional_budget = 0;
    req.adjustment_type = this.createOfferForm?.controls?.adjustment_type?.value;
    req.adjustment_value = this.createOfferForm?.controls?.adjustment_value?.value || this.adjustment_value || 0;

    let effective_data_obj: any = {
      effective_start_date : startDate,
      effective_end_date : endDate,
      hours_per_day:request?.hours_per_day,
      week_working_days: request?.week_working_days,
      rate: request?.rate,
      total_hours:request?.total_hours,
      rate_type: this.jobdetailService.getUnitOfMesaure(rateType),
      tax: [],
      adjustment_fee: request?.adjustment_fee
    };

    effective_data_arr.push(effective_data_obj);
    req.effective_data = effective_data_arr;
    await this.jobdetailService
      .post(`/core-money/programs/${this.currentProgram?.id}/resource-budget`,req)
      .subscribe((data: any) => {
        if (data && data.data) {
          const budgetInfo = data?.data;
          this.totalBudget = budgetInfo?.net_budget;
          this.isDisabled = false;
          this.disabledEstimate = false;
          this.createOfferForm.patchValue({
            budget_estimate: this.totalBudget,
            single_net_budget: this.totalBudget,
            rate_markup_info:budgetInfo?.budgetInfo,
            single_initial_budget: budgetInfo?.single_initial_budget,
            additional_amount: budgetInfo?.adjustment_amount,
            estimated_adjustment: budgetInfo?.estimated_adjustment
          });
        }
      });
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

  getDate(date) {
    if (date) {
      return new Date(date);
    }
  }

  getFormattedDate(date) {
    if (date && date.toString() !== 'Invalid Date') {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = date.getFullYear();
      return yyyy + '-' + mm + '-' + dd;
      // return this.datePipe.transform(date);
    }
  }

  get createOfferFormControls() {
    return this.createOfferForm.controls;
  }
  jobMangerDropDownOpt: any[] = [];
  jobManagerSearching = false;
  fetchJobManagers() {
    const account = this.storageService.get(StorageKeys?.CURRENT_ACCOUNT);
    const currentUser = this.storageService.get('user');
    const loggedIn_USER = {
      id: currentUser?.id,
      first_name: currentUser?.first_name,
      last_name: currentUser?.last_name,
      fullname_derived: `${currentUser.first_name} ${currentUser.middle_name || ''} ${currentUser.last_name}`,
      email: currentUser?.email
    };
    const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_oWN
    this.canClientEditManager = this.currentProgram?.config?.job?.allow_independent_hm_selection || false;
    const isClient = this.storageService.get(StorageKeys.USER_TYPE)?.toUpperCase() == UsersType.CLIENT;
    if(isClient && (accessType == AccessType.OWN || accessType == AccessType.TRUE_OWN) && !this.canClientEditManager) {
      const jobManagerData = this.offerPageMode !== 'edit' ? this.jobDetailsData?.job_manager : this.offerDetailStageData?.['job_manager'];
      this.jobMangerDropDownOpt = [loggedIn_USER];
      const hasManagerInList = loggedIn_USER.id == jobManagerData?.id;
      if (!hasManagerInList && (this.jobDetailsData?.job_manager || this.offerDetailStageData?.['job_manager'])) {
        this.jobMangerDropDownOpt.push({
          ...jobManagerData,
          fullname_derived: `${jobManagerData?.first_name} ${jobManagerData?.middle_name || ''} ${jobManagerData?.last_name
            }`,
        });
        this.jobMangerDropDownOpt = [...this.jobMangerDropDownOpt];
      }
      this.loadingJobmanager = false;
    } else {
      concat(
        this.jobdetailService.getJobManagers(null, this.jobHierarchy).pipe(
          tap(res => {
            this.loadingJobmanager = true;
            if (!this.offerId) {
              this.jobmanagerSelected = this.createOfferFormControls['jobManager'].value;
            }
          }),
          map((res: any) => {
            return {
              ...res,
              members: [...res.members].map(y => {
                return {
                  ...y,
                  fullname_derived: `${y.first_name} ${y.middle_name || ''} ${y.last_name}`,
                };
              }),
            };
          }),
          tap(() => {
            this.loadingJobmanager = false;
          }),
        ), // default items

        this.jobManagerTypeAhead$.pipe(
          filter((res: any) => {
            return res !== null; //&& res.length >= this.minLengthTerm;
          }),
          distinctUntilChanged(),
          debounceTime(400),
          tap(() => {
            this.jobManagerSearching = true;
            this.loadingJobmanager = true;
            this.jobMangerDropDownOpt = [];
          }),
          switchMap(term => {
            return this.jobdetailService.getJobManagers(term, this.jobHierarchy).pipe(
              catchError(() => of([])), // empty list on error
              tap(res => {
                this.jobLoading = false;
              }),
              map((res: any) => {
                return {
                  ...res,
                  members: [...res.members].map(y => {
                    return {
                      ...y,
                      fullname_derived: `${y.first_name} ${y.middle_name || ''} ${y.last_name}`,
                    };
                  }),
                };
              }),
              tap(() => {
                this.loadingJobmanager = false;
              }),
            );
          }),
        ),
      ).subscribe((res: any) => {
        const { members } = res;
        this.jobMangerDropDownOpt = members;
        const hasManagerInList = this.jobMangerDropDownOpt.some(mem => mem?.id === this.jobDetailsData?.job_manager_id);
        if (!hasManagerInList && !this.jobManagerSearching) {
          this.jobMangerDropDownOpt.push({
            ...this.jobDetailsData?.job_manager,
            fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.offerDetailStageData?.job_manager?.middle_name || ''} ${
              this.jobDetailsData?.job_manager?.last_name
            }`,
          });
          this.jobMangerDropDownOpt = [...this.jobMangerDropDownOpt];
        }
        if (this.offerId && this.offerDetailStageData?.job_manager?.first_name) {
          this.jobMangerDropDownOpt.push({
            ...this.offerDetailStageData?.job_manager,
            fullname_derived: `${this.offerDetailStageData?.job_manager?.first_name} ${
              this.offerDetailStageData?.job_manager?.middle_name || ''
            } ${this.offerDetailStageData?.job_manager?.last_name}`,
          });
          this.jobMangerDropDownOpt = [...this.jobMangerDropDownOpt];
        }
        this.jobManagerSearching = false;
      });
    }
  }
  timeSheetManagerDropDownOpt: any[] = [];
  timeSheetManagerSearching = false;
  fetchTimesheetManagers() {
    this.loadingTimeSheetManager = true;
    concat(
      this.jobdetailService.getJobManagers().pipe(
        tap((res: any) => {
          this.loadingTimeSheetManager = true;
          if (!this.offerId) {
            this.timesheetManagerSelected = this.createOfferFormControls['timesheetManager'].value;
          }
        }),
        map((res: any) => {
          return {
            ...res,
            members: [...res.members].map(y => {
              return {
                ...y,
                fullname_derived: `${y.first_name} ${y.last_name}`,
              };
            }),
          };
        }),
        tap(() => {
          this.loadingTimeSheetManager = false;
        }),
      ), // default items
      this.timesheetManagerTypeAhead$.pipe(
        filter(res => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingTimeSheetManager = true;
          this.timeSheetManagerDropDownOpt = [];
          this.timeSheetManagerSearching = true;
        }),
        switchMap(term => {
          return this.jobdetailService.getJobManagers(term).pipe(
            catchError(() => of([])), // empty list on error
            map((res: any) => {
              return {
                ...res,
                members: [...res.members].map(y => {
                  return {
                    ...y,
                    fullname_derived: `${y.first_name} ${y.last_name}`,
                  };
                }),
              };
            }),
          );
        }),
        tap(() => {
          this.loadingTimeSheetManager = false;
        }),
      ),
    ).subscribe((res: any) => {
      const { members } = res;
      this.timeSheetManagerDropDownOpt = members;
      const hasManagerInList = this.timeSheetManagerDropDownOpt.some(mem => mem?.id === this.jobDetailsData?.job_manager_id);
      if (!hasManagerInList && !this.timeSheetManagerSearching) {
        this.timeSheetManagerDropDownOpt.push({
          ...this.jobDetailsData?.job_manager,
          fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.jobDetailsData?.job_manager?.last_name}`,
        });
        this.timeSheetManagerDropDownOpt = [...this.timeSheetManagerDropDownOpt];
      }

      if (this.offerId) {
        let timesheetManagers = [this.offerDetailStageData?.timesheet_manager] || [];
        timesheetManagers.forEach(manager => {
          const fullname = `${manager?.first_name} ${manager?.last_name}`;
          const managerId = manager?.id;
          if (!this.timeSheetManagerDropDownOpt.some(existingManager => existingManager.fullname_derived === fullname && existingManager.id === managerId)) {
            this.timeSheetManagerDropDownOpt.push({
              ...manager,
              fullname_derived: fullname,
            });
          }
        });
        this.timeSheetManagerDropDownOpt = [...this.timeSheetManagerDropDownOpt];
      }
    });
    this.timeSheetManagerSearching = false;
  }

  expenseManagerDropDownOpt: any[] = [];
  expenseManagerSearching = false;
  fetchExpenseManagers() {
    this.loadingTimeSheetManager = true;
    concat(
      this.jobdetailService.getJobManagers().pipe(
        tap((res: any) => {
          this.loadingExpenseManager = true;
          if (!this.offerId) {
            this.expenseManagerSelected = this.createOfferFormControls['expenseManager'].value;
          }
        }),
        map((res: any) => {
          return {
            ...res,
            members: [...res.members].map(y => {
              return {
                ...y,
                fullname_derived: `${y.first_name} ${y.last_name}`,
              };
            }),
          };
        }),
        tap(() => {
          this.loadingExpenseManager = false;
        }),
      ), // default items
      this.expenseManagerTypeAhead$.pipe(
        filter(res => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingExpenseManager = true;
          this.expenseManagerDropDownOpt = [];
          this.expenseManagerSearching = true;
        }),
        switchMap(term => {
          return this.jobdetailService.getJobManagers(term).pipe(
            catchError(() => of([])), // empty list on error
            map((res: any) => {
              return {
                ...res,
                members: [...res.members].map(y => {
                  return {
                    ...y,
                    fullname_derived: `${y.first_name} ${y.last_name}`,
                  };
                }),
              };
            }),
          );
        }),
        tap(() => {
          this.loadingExpenseManager = false;
        }),
      ),
    ).subscribe((res: any) => {
      const { members } = res;
      this.expenseManagerDropDownOpt = members;
      const hasManagerInList = this.expenseManagerDropDownOpt.some(mem => mem?.id === this.jobDetailsData?.job_manager_id);
      if (!hasManagerInList && !this.expenseManagerSearching) {
        this.expenseManagerDropDownOpt.push({
          ...this.jobDetailsData?.job_manager,
          fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.jobDetailsData?.job_manager?.last_name}`,
        });
        this.expenseManagerDropDownOpt = [...this.expenseManagerDropDownOpt];
      }

      if (this.offerId) {
        let expenseManagers = [this.offerDetailStageData?.expense_managers] || [];
        expenseManagers.forEach(manager => {
          const fullname = `${manager?.first_name} ${manager?.last_name}`;
          const managerId = manager?.id;
          if (!this.expenseManagerDropDownOpt.some(existingManager => existingManager.fullname_derived === fullname && existingManager.id === managerId)) {
            this.expenseManagerDropDownOpt.push({
              ...manager,
              fullname_derived: fullname,
            });
          }
        });
        this.expenseManagerDropDownOpt = [...this.expenseManagerDropDownOpt];
      }
    });
    this.expenseManagerSearching = false;
  }
  getHolidayCalenderList() {
    this.loadingholidayCalender = true;
    this.subscriptions.push(
      this.jobdetailService.getHolidayCalenderList().subscribe(res => {
        this.holidayCalenderList = res;
        this.loadingholidayCalender = false;
      }),
    );
  }

  fetchTimesheetTypes(jobDetail?, locationId?, remoteLocation =null) {
    if (jobDetail) {
      this.loadingtimesheetType = true;
      this.jobdetailService
        .getTimeSheetTypes(this.currentProgram?.id, jobDetail?.hierarchy[0]?.id, locationId, jobDetail?.rate_type, remoteLocation)
        .subscribe((response: any) => {
          this.timesheetTypeList = response?.data?.config;
          this.loadingtimesheetType = false;
          if (this.offerPageMode != 'edit') {
            this.timesheetTypeSelected = this.timesheetTypeList.length > 1 ? null : this.timesheetTypeList[0]?.id;
          }
          if (this.changeLocationValue) {
            this.timesheetTypeSelected = this.timesheetTypeList.length > 1 ? null : this.timesheetTypeList[0]?.id;
          }
          //this.timesheetTypeSelected = this.createOfferFormControls['timesheetType'].value;
          this.timesheetTypeList.forEach((item: any) => {
            if (item.id === this.createOfferFormControls['timesheetType'].value || item.id===this.timesheetTypeSelected) {
              this.timeSheetTypeValue = item.value;
              if (item?.allocation_method?.toLowerCase() === 'hybrid') {
                this.hybridTimesheetSelected = true;
                this.fetchTimeSheetRateTypes(this.timeSheetTypeValue, jobDetail);
              } else {
                this.hybridTimesheetSelected = false;
              }
            }
          });
        });
    }
  }
  fetchTimeSheetRateTypes(value, jobDetail?) {
    this.loaderService.show();
    this.jobdetailService.getTimeSheetRates(this.currentProgram?.id, value, jobDetail?.hierarchy[0]?.id).subscribe((response: any) => {
      let rate_factors = response?.data?.rate_factors;
      let timesheetRates = JSON.parse(JSON.stringify(rate_factors))
      this.hrybridTimesheetRateFactors = timesheetRates;
      if (rate_factors) {
        this.setRateFactors(rate_factors);
        this.loaderService.hide();
      }
    });
  }

  timesheetTypeChange(event) {
    this.timeSheetTypeValue = event?.value;
    this.timesheetChanged = true;
    this.isRatesUpdated = false;
      if (event?.allocation_method?.toLowerCase() === 'hybrid') {
        this.hybridTimesheetSelected = true;
        this.fetchTimeSheetRateTypes(event?.value, this.jobDetailsData);
      } else{
        this.hybridTimesheetSelected = false;
        this.loaderService.show();
        setTimeout(() => {
          let rates = JSON.parse(JSON.stringify(this.configRateFactors));
          // let configRates = rates?.filter(rate => rate?.abbreviation?.toLowerCase() !== 'st');
          this.setRateFactors(rates);
          this.loaderService.hide();
        }, 1000);
      }
  }

  workLocationSearching = false;
  getWorkLocations(term, reset = false, jobdetails?) {
    if (reset) {
      this.pageNo = 1;
    }
    this.loadingWorkLocation = true;
    //?hierarchy_id=${jobdetails?.hierarchy[0]?.id}
    const url = `/configurator/programs/${this.programId}/work-locations?limit=25&status=true&page=${this.pageNo}${
      term ? '&k=' + term : ''
    }`;
    //const url = `/configurator/programs/${this.programId}/work-locations?limit=25&hierarchy_id=${jobdetails?.hierarchy[0]?.id}`
    concat(
      this.jobService.get(url).pipe(
        tap(res => {
          this.loadingWorkLocation = true;
          if (!this.offerId) {
            this.workLocationSelected = this.createOfferFormControls['locations'].value;
          }
        }),
        map((res: any) => {
          return {
            ...res,
            work_locations: [...res.work_locations].map(y => {
              return {
                ...y,
                fullname_derived: `${y?.name} - ${y?.code}`,
              };
            }),
          };
        }),
        tap(() => {
          this.loadingWorkLocation = false;
        }),
      ), // default items
      this.workLocationTypeAhead$.pipe(
        filter(res => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingWorkLocation = true;
          this.workLocations = [];
          this.workLocationSearching = true;
        }),
        switchMap(term => {
          return this.jobService.get(url).pipe(
            catchError(() => of([])), // empty list on error
            map((res: any) => {
              return {
                ...res,
                work_locations: [...res.work_locations].map(y => {
                  return {
                    ...y,
                    fullname_derived: `${y?.name} - ${y?.code}`,
                  };
                }),
              };
            }),
          );
        }),
        tap(() => {
          this.loadingWorkLocation = false;
        }),
      ),
    ).subscribe(res => {
      const { work_locations } = res;
      if(this.jobManagerAssociatedWorkLoc?.length > 0){
        if(term) {
          this.jobManagerAssociatedWorkLoc?.forEach((y)=>y.fullname_derived = `${y?.name} - ${y?.code}`);
          this.workLocations = this.jobManagerAssociatedWorkLoc?.filter((res)=>res?.fullname_derived?.toLowerCase()?.includes(term?.toLowerCase()))
        } else {
          this.jobManagerAssociatedWorkLoc?.forEach((y)=>y.fullname_derived = `${y?.name} - ${y?.code}`);
          this.workLocations = this.jobManagerAssociatedWorkLoc;
        }
        this.changeD.detectChanges();
      } else {
        this.workLocations = work_locations;
      }
      this.workLocCopy = work_locations;
      const hasManagerInList = this.workLocations.some(mem => mem?.id === this.jobDetailsData?.location?.id);
      if (!hasManagerInList && !this.workLocationSearching) {
        this.workLocations.push({
          ...this.jobDetailsData?.location,
          fullname_derived: `${this.jobDetailsData?.location?.name} - ${this.jobDetailsData?.location?.code}`,
        });
        this.workLocations = [...this.workLocations];
      }
      if (this.offerId && this.offerDetailStageData) {
        const hasWorkLocInList = this.workLocations.some(mem => mem?.id === this.offerDetailStageData?.offer_work_location?.work_location?.id);
        if(!hasWorkLocInList) {
          this.workLocations.push({
            ...this.offerDetailStageData?.offer_work_location?.work_location,
            fullname_derived: `${this.offerDetailStageData?.offer_work_location?.work_location?.name} - ${this.offerDetailStageData?.offer_work_location?.work_location?.code}`,
          });
          this.workLocations = [...this.workLocations];
        }
      }
    });
    this.workLocationSearching = false;
  }
  changeLocationValue: boolean;
  changeLocation(event) {
    if (event) {
      this.fetchTimesheetTypes(this.jobDetailsData, event?.id);
    }
    this.changeLocationValue = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.jobId) {
      this.jobId = this.route.snapshot.params['id'] || this.route.parent.snapshot.params['id'];
    }
    if (changes['isopen']) {
      if (changes.isopen.currentValue) {
        this.getJobdetails();
        this.getOfferDetails();
        this.fetchTimesheetManagers();
        this.fetchExpenseManagers();
        this.getHolidayCalenderList();
        //this.fetchTimesheetTypes();
      }
    }
    if (!!changes['candidateDetails']) {
      this.ratefactorLoading = true;
      //this.prefillPayBillrates(changes['candidateDetails']['currentValue']);
    }
  }

  prefillPayBillrates(candidateDetails) {
    // TODO Currency is not handled properly
    let cdetails = candidateDetails || { candidate: {} };
    let ratesInfo = cdetails['candidate'] || {};
    this.originalMarkUp = +(ratesInfo['rate_markup'] || 0);
    let start_date = this.datePipe.transform(ratesInfo['available_start_date'], '', '', '', true);
    let end_date = this.datePipe.transform(ratesInfo['available_end_date'], '', '', '', true);

    let ofStartDate = new Date(this.createOfferFormControls['startDate'].value);
    let freezeEnd = ofStartDate.setDate(ofStartDate.getDate());
    this.optionsTenureDate = {
      language: 'English',
      enabledDateRanges: [{ end: freezeEnd }],
    };
    /*UAT to development merge: Need to revisit*/
    /*  let start_date = this.datePipe.transform(this.currentProgram?.config?.offer_date_from_job && this.jobDetailsData?.start_date || ratesInfo['available_start_date'], 'MM/dd/yyyy');
     let end_date = this.datePipe.transform(this.currentProgram?.config?.offer_date_from_job && this.jobDetailsData?.end_date || ratesInfo['available_end_date'], 'MM/dd/yyyy'); */
    this.createOfferForm.patchValue({
      startDate: start_date || '',
      endDate: end_date || '',
      markUpValue: this.accuracy.transform(+ratesInfo['rate_markup'], AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
      rateType: ratesInfo['rate_type'] || null,
    });
    //this.ratesArray.clear();
    this.createOfferForm.updateValueAndValidity();
    this.getRateInformation();
  }

  get isUserSuperAdmin() {
    return this.userPermissionService.isUserSuperAdmin();
  }

  get showRemoteWorker() {
    return this.jobdetailService.remoteWorker();
  }

  get ratesArray(): UntypedFormArray {
    return this.createOfferForm.get('rates') as UntypedFormArray;
  }

  getRateDetails(rates =[],isSameRates?) {
    let getRates = [...rates];
    if(this.hybridTimesheetSelected){
      getRates = getRates?.map((obj) => {
        const { abbreviation, ...rest } = obj;
        return { abbreviation, rate_factor: abbreviation, ...rest };
      });
    }
    let reArrangeRates =  this.jobdetailService.rearrangeRates(getRates);
    let sortingByBillable = reArrangeRates.sort((a, b) => (a.billable === b.billable) ? 0 : (a.billable ? -1 : 1));
    let formArray: any = this.createOfferForm.get('rates') as UntypedFormArray;
    if (this.hybridTimesheetSelected) {
      formArray = this.fb.array([]); // Create a new FormArray
      sortingByBillable?.forEach(element => {
        let markupValue = element?.markup || this.createOfferForm.controls.rateMarkUpValue?.value;
        if(element?.rate_factor !== 'ST'){
          let timesheetRateForm = this.fb.group(
            {
              rate_factor: [element?.rate_factor ? element?.rate_factor.toUpperCase() : element?.abbreviation?.toUpperCase()],
              abbreviation: [element?.abbreviation ? element?.abbreviation?.toUpperCase() : element?.rate_factor?.toUpperCase()],
              id:element?.id,
              name: [element.name],
              billable: element?.billable,
              applicable: element?.applicable ?? true,
              bill_rate: [{ value: element?.bill_rate, disabled: true }, Validators.required],
              pay_rate: [{ value: element?.pay_rate, disabled: true }, Validators.required],
              markup: [markupValue],
              enable_bill_rate_edit: false,
              enable_pay_rate_edit: false,
              vendor_bill_rate: [{ value: element?.vendor_bill_rate, disabled: true }, Validators.required],
              client_bill_rate: null,
              default: null,
              rate_factor_ts_type: element?.rate_factor_ts_type,
            },
            {
              validators: [this.payRateValidator],
            },
          );
          formArray.push(timesheetRateForm);
      }
      else{
        if(element?.rate_factor?.toLowerCase() == 'st'){
           let candidateRates = this.candidateDetails?.candidate?.rates?.filter(rate => rate?.abbreviation.toLowerCase() === 'st');
           isSameRates ? this.patchSTValues(element) : this.patchSTValues(candidateRates)
        }
      }
      });

      this.createOfferForm.setControl('rates', formArray);

        if(this.programRateModel === 'PAY_RATE'){
          this.calculateRates('payrate');
        }
        else {
          this.calculateRates('billrate');
        }
      }
      else {
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }
      sortingByBillable?.forEach(element => {
        if (element?.rate_factor?.toLowerCase() !== 'st') {
          const rateForm = this.fb.group(
            {
              rate_factor: [element?.rate_factor],
              abbreviation: [element?.abbreviation?.toUpperCase()],
              id:element?.id,
              name: [element.name],
              billable: element?.billable,
              applicable: element?.applicable,
              bill_rate: [{ value: element?.bill_rate, disabled: true }, Validators.required],
              pay_rate: [{ value: element?.pay_rate, disabled: true }, Validators.required],
              markup: [element?.markup],
              enable_bill_rate_edit: false,
              enable_pay_rate_edit: false,
              vendor_bill_rate: [{ value: element?.vendor_bill_rate, disabled: true }, Validators.required],
              client_bill_rate: element?.bill_rate,
              default: element?.default,
            },
            {
              validators: [this.payRateValidator],
            },
          );
          formArray.push(rateForm);
        }
        else if (element?.rate_factor?.toLowerCase() == 'st') {
          this.patchSTValues(element)
        }
      });
        if(this.programRateModel === 'PAY_RATE'){
          this.calculateRates('payrate');
        }
        else {
          this.calculateRates('billrate');
        }
    }

    if(this.costComponentEnabled){
      let stRateCostComponent = sortingByBillable?.find(rate=> rate?.abbreviation.toLocaleLowerCase() === 'st')?.cost_component;
      let submissionSTCostComponent = this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rates?.find(rate=> rate?.abbreviation.toLocaleLowerCase() === 'st')?.cost_component :
      this.offerDetailStageData?.rates?.find(rate=> rate?.abbreviation.toLocaleLowerCase() === 'st')?.cost_component;
      this.createOfferForm?.addControl('costComponent', this.createFormGroupForCostComponents(stRateCostComponent || submissionSTCostComponent));
      if(this.ratesArray?.controls?.length != 0){
        for (const rate of this.ratesArray?.controls) {
          const rateGrp = rate as UntypedFormGroup;
          const rateObj = rateGrp?.getRawValue();
          let rateCostComponent = sortingByBillable?.find(rate => rate?.abbreviation?.toLocaleLowerCase() === rateObj?.abbreviation?.toLocaleLowerCase())?.cost_component;
          rateGrp?.addControl('cost_component', this.createFormGroupForCostComponents(rateCostComponent || submissionSTCostComponent));
        }
      }
    }



    if (this.programRateModel === 'PAY_RATE') {
      this.getvalidRate(this.createOfferForm.controls.candidatePayRate, this.minPayNum, this.maxPayNum, 'Pay Rate');
    } else {
      this.getvalidRate(
        this.createOfferForm.controls.billRatevalue,
        this.createOfferFormControls.minBillRate.value,
        this.createOfferFormControls.maxBillRate.value,
        'Bill Rate',
      );
    }
    this.getWorkingHoursEstimate();
  }

  createFormGroupForCostComponents(value) {
    if(!value) return;
    const costComponentsForRate = this.fb.group({});
    for (const [key, costComp] of Object.entries(value)) {
      if (!costComp || key === 'markup' || key === 'cost_component_group_id') continue;
      const obj = {
        value: costComp?.['value'],
        type: costComp?.['type'],
        level: costComp?.['level'],
        component_name: costComp?.['component_name'],
        cost_amount: costComp?.['cost_amount'],
        total_amount: costComp?.['total_amount']
      };
      costComponentsForRate.addControl(key, this.fb.group({ ...obj }));
    }
    costComponentsForRate.addControl('markup', this.fb.group({
      cost_amount: value?.['markup']?.['cost_amount'],
      total_amount: value?.['markup']?.['total_amount']
    }));
    costComponentsForRate.addControl('cost_component_group_id', this.fb.control(value?.cost_component_group_id));
    return costComponentsForRate;
  }

  patchSTMarkup(rates){
    let stMarkupValue = rates?.find(rate => rate?.abbreviation.toLowerCase() === 'st')?.markup;
    this.createOfferForm?.controls?.rateMarkUpValue?.setValue(stMarkupValue);
  }
  patchSTValues(element){
    if(element) {
      element = Array.isArray(element) ? element[0] : element;
      this.createOfferForm.patchValue({
        candidatePayRate: this.accuracy.transform(element.pay_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
        billRatevalue: this.accuracy.transform(element.bill_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
        vendorBillRate: this.accuracy.transform(element?.vendor_bill_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
        vendorBillRateValue: this.accuracy.transform(element?.vendor_bill_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
        clientBillRate: this.accuracy.transform(element?.bill_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
        DefaultRateValue: element?.default,
      });
      this.standardRate = element?.bill_rate;
      this.stRateFactor = element;
    }
  }

  getvalidRate(control, minNumber, maxNumber, rateType) {
    if (+control.value > maxNumber && !this.submission_exceed_max_bill_rate) {
      control.setErrors({
        max: `Maximum number can be ${maxNumber}`,
      });
      return;
    } else if (this.allowOfferMinRate) {
      control.setErrors({
        min: `Minimum number can be ${minNumber}`,
      });
      return;
    } else if (+control.value <= 0) {
      control.setErrors({
        min: `${rateType} can not be zero or empty`,
      });
      return;
    } else {
      control.setErrors(null);
    }
  }
  checkDateMax() {
    const start_date: any = this.datePipe.transform(
      this.createOfferForm.get('startDate').value,
      DATE_FORMAT?.FORMATMDY,
      '',
      '',
      true,
      this.prefferedfDateFormate,
    );
    const end_date: any = this.datePipe.transform(
      this.createOfferForm.get('endDate').value,
      DATE_FORMAT?.FORMATMDY,
      '',
      '',
      true,
      this.prefferedfDateFormate,
    );

    if (start_date && end_date) {
      if (start_date && Date.parse(start_date) < Date.parse(end_date)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

   getJobdetails() {
    this.jobdetailsLoading = true;
    this.subscriptions.push(
        this.jobdetailService.loadJob(this.jobId).subscribe((res: any) => {
        this.jobdetailsLoading = false;
        let jobdetails = res['job'] || { job_manager: {} };
        this.jobDetailsData = JSON.parse(JSON.stringify(jobdetails));
        this.oTJobRates = JSON.parse(JSON.stringify(this.jobDetailsData?.rates));
        this.jobRates = JSON.parse(JSON.stringify(jobdetails?.rates));
        this.copyJobFactors = JSON.parse(JSON.stringify(jobdetails?.rates));
        if (this.jobDetailsData?.is_expense_allowed_display && this.jobDetailsData?.is_expense_allowed_editable) {
          this.createOfferForm.get('allow_expense').enable();
        } else {
          this.createOfferForm.get('allow_expense').disable();
        }
        if (!this.jobDetailsData?.is_expense_allowed_display || !this.jobDetailsData?.is_expense_allowed) {
          this.createOfferForm.get('expenseManager').clearValidators();
          this.createOfferForm.get('expenseManager').updateValueAndValidity();
        }
        this.additional_amount = this.jobDetailsData?.additional_amount;
        this.accountCodeData = this.jobDetails?.account_code_data;
        this.patchAccountCodeDetails(this.jobDetails?.account_code_data);
        const locationId = jobdetails?.location?.id;
        this.fetchTimesheetTypes(jobdetails, locationId);
        this.getWorkLocations(null, true, jobdetails);
        this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy
          ? this.jobDetailsData.rate_model
          : this.currentProgram?.config?.program_model;
        if (this.programRateModel == 'BILL_RATE') {
          this.createOfferForm.get('candidate_sourcing_type').clearValidators();
          this.createOfferForm.get('candidate_sourcing_type').updateValueAndValidity();
        }
        this.createOfferForm?.patchValue({
          week_working_days: this.jobDetailsData?.day_per_week,
          hours_per_day: this.jobDetailsData?.estimated_hours,
        });
        this.adjustment_value = this.jobDetailsData?.adjustment_value ?? 0;
        this.adjustment_type = this.jobDetailsData?.adjustment_type ? this.jobDetailsData?.adjustment_type : 'fixed';
        this.additional_amount = this.jobDetailsData?.adjustment_type ? this.jobDetailsData?.additional_amount : 0;
        this.createOfferForm.patchValue({
          adjustment_type: this.adjustment_type,
          adjustment_value: this.adjustment_value,
          additional_amount: this.additional_amount,
        });
        //this.prefferedfDateFormate = this.jobDetailsData?.hierarchy[0]?.preferred_date_format || this.currentProgram?.defaultDateFormat;
        this.prefferedfDateFormate = this.currentProgram?.defaultDateFormat?.toUpperCase();
        this.jobLaborCategory = this.jobDetailsData?.program_industry[0]?.id;
        this.jobHierarchy = this.jobDetailsData?.hierarchy[0]?.id;
        this.jobWorkLocation = this.jobDetailsData?.location?.id;
        this.getRateFactor(this.jobHierarchy);
        let jobTemplateid = this.jobDetailsData?.template;
        let checkListId = this.jobDetailsData?.checklist?.id;
        this.getOnboardingCheckList(this.jobWorkLocation,this.jobLaborCategory,jobTemplateid, checkListId,this.jobHierarchy)
        // if (this.programRateModel === 'BILL_RATE') {
        //   //this.calculateRates('bill_rate');
        // }
        if (this.programRateModel === 'MARKUP' || this.programRateModel === 'PAY_RATE') {
          this.getMarkupValidate();
        }
        if (this.programRateModel == 'MARKUP') {
          this.createOfferForm?.controls['candidatePayRate'].disable();
          this.createOfferForm.controls['billRatevalue'].enable();
          this.createOfferForm.controls['vendorBillRateValue'].disable();
          if (this.userType?.toLowerCase() === 'msp') {
            this.createOfferForm.controls['rateMarkUpValue'].disable();
          }
        } else if (this.programRateModel == 'PAY_RATE') {
          this.createOfferForm.controls['candidatePayRate'].enable();
          this.createOfferForm.controls['billRatevalue'].disable();
          this.createOfferForm.controls['vendorBillRateValue'].disable();
        } else {
          //this.createOfferForm?.patchValue({ candidatePayRate: 0 });
          this.createOfferForm?.controls['candidatePayRate'].disable();
          this.createOfferForm?.get('candidatePayRate').clearValidators();
          this.createOfferForm?.get('candidatePayRate').updateValueAndValidity();
          this.createOfferForm.controls['vendorBillRateValue'].disable();
        }
        this.jobCurrency = res?.job?.currency?.toUpperCase();
        let sdate: any = jobdetails['start_date']?.split(' ')[0] || null;
        if (sdate && new Date(sdate) > new Date()) {
          sdate = jobdetails['start_date'].split(' ')[0];
        } else {
          // sdate=  new Date()
        }
        let jobRateModel = 'rate_model' in jobdetails && !!jobdetails['rate_model'] ? jobdetails?.rate_model : 'pay_rate';

        if (jobRateModel === 'PAY_RATE') {
          this.createOfferForm.patchValue({
            maxBillRate: this.accuracy.transform(jobdetails['max_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
            minBillRate: this.accuracy.transform(jobdetails['min_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
          });
          this.minPayNum = this.accuracy.transform(jobdetails['min_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
          this.maxPayNum = this.accuracy.transform(jobdetails['max_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
        } else {
          this.createOfferForm.patchValue({
            maxBillRate: this.accuracy.transform(jobdetails['max_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
            minBillRate: this.accuracy.transform(jobdetails['min_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
          });
          this.minNum = this.accuracy.transform(jobdetails['min_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
          this.maxNum = this.accuracy.transform(jobdetails['max_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
        }
        //this.jobDetailsData['is_expense_allowed'] = null;
        if (!this.offerId) {
          this.createOfferForm.patchValue({
            jobManager: jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : '',
            timesheetManager: jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : '',
            expenseManager: jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : '',
            rateType: this.getRateType(jobdetails['unit_of_measure']),
            allow_expense: this.jobDetails?.is_expense_allowed ? 'Yes' : 'No',
          });
          const isManagerPresent = this.jobMangerDropDownOpt?.find((res) => res?.id == this.jobDetailsData?.job_manager?.id);
          if (!isManagerPresent && this.jobDetailsData) {
            this.jobMangerDropDownOpt.push({
              ...this.jobDetailsData?.job_manager,
              fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.offerDetailStageData?.job_manager?.middle_name || ''} ${this.jobDetailsData?.job_manager?.last_name
                }`,
            });
            this.jobMangerDropDownOpt = [...this.jobMangerDropDownOpt];
          }
          this.onChangeJobManager({id:jobdetails['job_manager']['id']});
        }
        if (this.jobDetails?.is_expense_allowed) {
          this.showExpenseManager = true;
        }
        if (!this.offerId) {
          let timeSheetManagerFromJob = jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : [];
          let expenseManagerFromJob = jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : [];
          this.jobmanagerSelected = jobdetails['job_manager'] ? jobdetails['job_manager']['id'] : '';
          this.workLocationSelected = jobdetails['location'] ? jobdetails['location']['id'] : '';
          this.timesheetManagerSelected = this.multipleApprovers ? [timeSheetManagerFromJob] : timeSheetManagerFromJob;
          this.expenseManagerSelected = this.multipleApprovers ? [expenseManagerFromJob] : expenseManagerFromJob;
        }
        this.minNum = this.accuracy.transform(jobdetails['min_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
        this.maxNum = this.accuracy.transform(jobdetails['max_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true });
        this.submission_exceed_max_bill_rate = jobdetails['is_submission_exceed_max_bill_rate'];
        this.createOfferForm.updateValueAndValidity();

        this.startDate = !!this.createOfferFormControls['startDate'].value ? new Date(this.createOfferFormControls['startDate'].value) : '';
        this.start = !!this.startDate ? this.startDate.setDate(this.startDate.getDate()) : '';
        this.endDate = !!this.createOfferFormControls['endDate'].value ? new Date(this.createOfferFormControls['endDate'].value) : '';
        this.end = !!this.endDate ? this.endDate.setDate(this.endDate.getDate() + 1) : '';
        this.optionsStartDate = {
          language: 'English',
          enabledDateRanges: [{ start: !!this.start ? this.start : this.today?.setDate(this.today?.getDate() - 1) }],
          alwaysVisible: false,
        };
        this.optionsEndDate = {
          language: 'English',
          enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
          alwaysVisible: false,
        };
        if (jobdetails?.hierarchy) {
          this.getDetailOfHierarchy(jobdetails);
          if (this.offerPageMode != 'edit') {
            this.getTenure(jobdetails?.hierarchy[0]?.id);
          }
        }
        this.fetchJobManagers();
      }),
    );
  }
  programType: any;
  getDetailOfHierarchy(jobdetails) {
    const url = `/configurator/programs/${this.currentProgram?.id}/hierarchy/${jobdetails?.hierarchy[0]?.id}`;
    this.jobdetailService.get(url).subscribe((res: any) => {
      const { hierarchy } = res;
      this.programType = hierarchy?.program_type;
      if (this.programType !== 'MARKUP_DRIVEN') {
        this.createOfferForm.get('markUpValue').clearValidators();
        this.createOfferForm.get('markUpValue').updateValueAndValidity();
      }
      if (this.programType === 'BILL_RATE_DRIVEN') {
      }
    });
  }
  getRateInformation() {
    // this.getProgramConfiguration();
  }

  payRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('pay_rate') && !formControl?.get('bill_rate')) {
      return null;
    }
    if (Number(formControl?.get('pay_rate')?.value) > Number(formControl?.get('bill_rate')?.value)) {
      return { gtr: 'Pay rate can not be greater than  client bill rate' };
    }
    return null;
  }

  getProgramDetails() {
    let url = `/configurator/programs/${this.currentProgram?.id}`;
    this.jobdetailService.get(url).subscribe({
      next: (data: any) => {
        if (data && data?.program) {
          let programDetails = data.program;
          this.isBillDriven = programDetails?.config?.billing?.consolidated_billing;
          this.approvalStatus = programDetails?.config?.is_approval_for_offers === true ? 'PENDING_APPROVAL' : 'RELEASED';
        }
      },
      error: error => {
        // this.alert.error(errorHandler(error), {});
        this.showError(error);
      },
    });
  }


  getRateTypeFactors(rateFactor,rateType){
    let rateFactors = this.offerPageMode !='edit' ? this.candidateRateFactors : this.offerRateFactors;

    if((this.candidateDetails?.candidate?.ot_exempt && this.otExemptChanged && !this.is_ot_exempt)){
      rateFactors = this.updatedConfigRates
    }
    else if(this.isRatesUpdated){
      rateFactors = this.updatedMarkupRateFactors;
    }
    else if((this.otExemptChanged && this.is_ot_exempt)){
      rateFactors = this.overTimeExemptRateFactors;
    }
    else if((this.hybridTimesheetSelected && this.otExemptChanged && !this.is_ot_exempt )){
      rateFactors = this.updatedHybridFactors;
    }
    else if(this.offerPageMode ==='edit') {
      if(this.timeSheetTypeValue != this.offerDetailStageData?.timesheet_type?.value){
        rateFactors = this.candidateDetails?.candidate?.rate_factors_info;
      }
      else{
        rateFactors = this.offerRateFactors;
      }
    }
    else if(this.hybridTimesheetSelected){
      rateFactors = this.updatedHybridFactors;
    }

    if(!rateFactors){
      rateFactors = []
    }

    for (const element of rateFactors) {
      if (element?.abbreviation?.toLowerCase() === rateFactor?.toLowerCase() && element[rateType] !== undefined) {
        return element[rateType]
      }
    }
  }

  get checkToggleValue() {
    let isAdmin = this.userPermissionService.isUserSuperAdmin();
    if (isAdmin && this.isBillDriven) {
      return true;
    } else if (isAdmin) {
      return false;
    } else {
      return true;
    }
  }

  get showPayRate() {
    if (this.programRateModel === 'BILL_RATE') {
      return false;
    } else if (this.programRateModel === 'MARKUP' && this.userType?.toLowerCase() === 'client') {
      return false;
    } else {
      return true;
    }
  }

  get gridClass() {
    if (this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP') {
      if (this.userType?.toLowerCase() === 'msp' || this.userType?.toLowerCase() === 'super_org') {
        return 'col-md-4';
      } else {
        return 'col-md-6';
      }
    } else if (this.programRateModel === 'BILL_RATE') {
      return 'col-md-6';
    }
  }

  onRemoteFormSubmitted(event) {
    if (event) {
      this.remoteLocation = event?.formValues; // Object with country,state object
      this.remote_worker_details = Object.fromEntries(
        Object.entries(this.remoteLocation).map((entry: any)=>[entry[0],(entry[1]?.name || null)])
      ); // Object with country,state name
      this.countryValidated = event?.countryValidated;
      if(this.countryValidated){
        this.fetchTimesheetTypes(this.jobDetails,null,this.remoteLocation);
      }
      else{
        this.createOfferForm.get('timesheetType').reset();
        this.timesheetTypeList = [];
      }
    }
  }

  remoteAPIErrors(event) {
    if (event) {
      this.showError(event);
    }
  }

  getValidatedForm() {
    this.countryValidated = this.showRemoteWorker && this.remote_worker ? this.countryValidated : true;
  }

  handleTaxFormValueChange(event){
    if(event){
      this.taxData = event?.tax || [];
      this.isTaxValid = event?.isTaxValid;
      this.adjustmentData = event?.adjustment_fee;
      if(event?.adjustmentChanged){
        this.getWorkingHoursEstimate();
        this.createOfferForm.patchValue({
          adjustmentData: event?.adjustment_fee
        });
      }
    }
  }

  updateRateMarkup(rates, abbreviation, markupValue) {
    return rates?.map(rate => {
      if (rate?.abbreviation.toLowerCase() === abbreviation.toLowerCase()) {
        rate.markup = markupValue;
      } else {
        rate.markup = null;
      }
      return rate;
    });
  }

  nonBillableMarkupForHybridTimesheet(array) {
    return array.map(item => {
        if (!item.billable) {
            return { ...item, markup: 0 };
        }
        return item;
    });
}

  async onSubmit() {
    this.submitted = true;
    this.isLoader = true;
    let offerForm = this.createOfferForm.getRawValue();
    this.getValidatedForm();

    if (this.createOfferForm.valid && this.isCustomFieldsFormValid && this.isFoundationalFieldsValid && this.countryValidated) {
      this.isDisabled = true;
      let payload: any = new releaseOfferPayload();
      payload.start_date = this.datePipe.transform(
        offerForm['startDate'],
        DATE_FORMAT?.FORMATMDY,
        null,
        null,
        true,
        this.prefferedfDateFormate,
      );
      payload.status = this.approvalStatus;
      payload.end_date = this.datePipe.transform(
        offerForm['endDate'],
        DATE_FORMAT?.FORMATMDY,
        null,
        null,
        true,
        this.prefferedfDateFormate,
      );
      payload.notes= offerForm['notes'];
      if(this.isReviewMode){
        payload.review_notes = offerForm['review_notes']
      }
      payload.rate_markup = +offerForm['rateMarkUpValue'];
      if (this.offerPageMode !== 'edit') {
        payload.rate_model = this.programRateModel.toUpperCase();
      }
      if (this.accountCodeCreationActive) {
        payload.account_code_data = this.accountCodeData;
      }
      let userType = this.storageService.get('user_type');
      if ((userType == 'CLIENT' || this.newWorkflow) && this.currentProgram?.config?.offer?.pending_offer_review) {
        payload.status = 'PENDING_OFFER_REVIEW';
      }
      if (!this.jobDetailsData?.is_expense_allowed_display) {
        payload.is_expense_allowed = null;
        payload.expense_managers = null;
      } else {
        payload.is_expense_allowed = offerForm['allow_expense'] === 'Yes' ? true : false;
        if (payload.is_expense_allowed) {
          if (typeof offerForm['expenseManager'] === 'string') {
            payload.expense_managers = [offerForm['expenseManager']];
          } else {
            payload.expense_managers = offerForm['expenseManager'];
          }
        } else {
          payload.expense_managers = null;
        }
      }
      let budgetDetails = {
        adjustment_type: offerForm['adjustment_type'],
        additional_amount: offerForm['additional_amount'],
        adjustment_value: offerForm['adjustment_value'],
        single_initial_budget: offerForm['single_initial_budget'],
        single_net_budget: offerForm['single_net_budget'],
        budget_estimate: offerForm['budget_estimate'],
        estimated_adjustment: offerForm['estimated_adjustment']
      };
      payload.rate_markup_info = budgetDetails;
      payload.rate_type = offerForm['rateType'];
      payload.st_bill_rate = offerForm['billRatevalue'];
      payload.st_pay_rate = offerForm['candidatePayRate'];
      payload.tenure_date = this.datePipe.transform(
        offerForm['tenure_date'],
        DATE_FORMAT?.FORMATMDY,
        null,
        null,
        true,
        this.prefferedfDateFormate,
      );
      payload.job_manager_id = offerForm['jobManager'];
      if (typeof offerForm['timesheetManager'] === 'string') {
        payload.timesheet_manager_id = [offerForm['timesheetManager']];
      } else {
        payload.timesheet_manager_id = offerForm['timesheetManager'];
      }
      payload.timesheet_type = this.timeSheetTypeValue;
      payload.is_fees_included = this.isfeesIncluded;
      // payload.holiday_calendar_id = offerForm['holidayCalender'];
      payload.assignment_workflow = offerForm['assignment_workflow'];
      payload.work_location_id = offerForm['locations'];
      payload.rates = offerForm['rates'];
      payload.ot_exempt = this.is_ot_exempt;
      payload.taxes = (this.taxData?.length > 0 ? this.taxData : null) || null;
      payload.adjustment_fee = this.adjustmentData || offerForm['adjustmentData'] || this.jobdetailService?.getAdjustmentPayload(this.adjustmentData?.amount_value);
      if (this.onBoardAuthority()){
        payload.onboarding_checklist_id = offerForm['onboarding_checklst'];
      }
      else{
        delete payload.onboarding_checklist_id;
      }
      payload.budget_estimate = (+offerForm['budget_estimate']);
      payload.is_hybrid = this.hybridTimesheetSelected;
      this.vendorBillRate = !this.vendorBillRate ?  (this.createOfferForm.getRawValue()['vendorBillRate']) : this.vendorBillRate;
      payload.rates.push({
        billable:this.stRateFactor?.billable,
        applicable: true,
        default: offerForm['DefaultRateValue'],
        rate_factor: this.stRateFactor?.abbreviation ?? 'ST',
        abbreviation: this.stRateFactor?.abbreviation ?? 'ST',
        name: this.stRateFactor?.name,
        id: this.stRateFactor?.id,
        bill_rate: payload.st_bill_rate,
        pay_rate: payload.st_pay_rate,
        rate_factor_ts_type: this.stRateFactor?.rate_factor_ts_type,
        vendor_bill_rate: this.vendorBillRate || null,
        markup: offerForm['rateMarkUpValue'] || 0,
        cost_component: offerForm['costComponent'] || {}
      });
      payload.rates = payload.rates.map(ra => {
        ra.bill_rate = ra?.bill_rate;
        ra.pay_rate = ra?.pay_rate;
        ra.vendor_bill_rate = ra?.vendor_bill_rate;
        ra.default = ra.default;
        ra.markup = ra.markup;
        ra.cost_component = ra.cost_component || {};
        delete ra.client_bill_rate;
        delete ra.enable_bill_rate_edit;
        delete ra.enable_pay_rate_edit;
        return ra;
      });
      payload.fee = this.fee_info || this.candidateDetails?.candidate?.fee;
      payload.rates =  this.hybridTimesheetSelected ? payload?.rates : payload?.rates?.filter(rate => rate.billable);
      payload.rate_factors_info = this.jobdetailService?.removeDuplicateIdObjects(this.payloadRateFactors);
      const rateMarkupValue = offerForm['rateMarkUpValue'] || null;
      payload.is_cost_component = this.candidateDetails?.candidate?.is_cost_component;
      payload.cost_component_config = this.candidateDetails?.candidate?.cost_component_config;
      if(this.is_ot_exempt){
        payload.rate_factors_info.forEach(element => {element.markup = rateMarkupValue});
        payload.rates.map(rate => {rate.markup = rateMarkupValue;return rate;});
        if(this.costComponentEnabled){
          let stCostComponentFactor = payload?.rate_factors_info?.find(rate=> rate?.abbreviation.toLowerCase() === 'st')?.cost_component;
          let stCostComponentRates = payload?.rates?.find(rate=> rate?.abbreviation.toLowerCase() === 'st')?.cost_component;
          payload.rate_factors_info.forEach(element => {element.cost_component = stCostComponentFactor});
          payload.rates.map(rate => {rate.cost_component = stCostComponentRates;return rate;});
        }
      }
      if(!this.markupByRateTypeEnabled){
        payload.rates = this.updateRateMarkup(payload?.rates, 'st', rateMarkupValue);
        this.payloadRateFactors = this.updateRateMarkup(this.payloadRateFactors, 'st', rateMarkupValue);
      }
      payload.foundational_data = [];
      this.foundationalFieldsFormData?.forEach(data => {
        let { foundational_data_type_id, values } = data;
        if (values) {
          payload.foundational_data.push({ foundation_data_type_id: foundational_data_type_id, foundation_data_id: values });
        }
      });
      if (this.customFieldsFormData && this.customFieldsFormData?.length > 0) {
        let allCustomFields = [];
        this.customFieldsFormData?.forEach(field => {
          let custom_value: any = {};
          if (field?.values != undefined && field?.values != null) {
            custom_value[field?.ref_column] = field?.values;
            custom_value['type'] = field?.custom_field_type;
          }
          allCustomFields.push(custom_value);
        });
        payload.custom_fields = allCustomFields.filter(element => {
          if (Object.keys(element).length !== 0) {
            return true;
          }
          return false;
        });
      }
      payload.worker_email = offerForm['worker_email'];
      (payload.remote_worker = this.remote_worker), (payload.remote_worker_details = this.remote_worker_details);
      payload.candidate_sourcing_type = offerForm['candidate_sourcing_type'];
      payload.markup_by_rate_type = this.candidateDetails?.candidate?.markup_by_rate_type;

      if(payload.is_hybrid && payload.markup_by_rate_type){
       payload.rates = this.nonBillableMarkupForHybridTimesheet(payload?.rates);
       payload.rate_factors_info = this.nonBillableMarkupForHybridTimesheet(payload?.rate_factors_info);
      }

      if (this.programRateModel == 'BILL_RATE') {
        delete payload.candidate_sourcing_type;
      }
      if (!this.remote_worker) {
        delete payload.remote_worker_details;
      }
      if (!this.showRemoteWorker) {
        delete payload.remote_worker;
      }
      if(!this.currentProgram?.config?.is_custom_tax_on_assignment || !this.hasManageTaxPermission || !this.isShowTax){
        delete payload.taxes;
      }
      if(!this.currentProgram?.config?.is_adjustment_fee_allowed){
        delete payload.adjustment_fee;
      }
      this.logs = undefined;
      if (this.offerPageMode === 'edit') {
        payload.status = 'RELEASED';
        let userType = this.storageService.get('user_type');
        if ((userType == 'CLIENT' || this.newWorkflow) && this.currentProgram?.config?.offer?.pending_offer_review) {
          payload.status = 'PENDING_OFFER_REVIEW';
        }
        if (
          (userType == 'CLIENT' || userType == 'MSP') &&
          (this.offerDetails?.offer?.status.toLowerCase() == 'countered_pending_review' ||
            this.offerDetails?.offer?.status.toLowerCase() == 'countered_cancelled') &&
          this.currentProgram?.config?.offer?.counter_offer_review
        ) {
          payload.status = 'RELEASED';
        }
        // When countered offer is reviewed
        if(this.offerDetails?.offer?.status.toLowerCase()=='countered_pending_review' &&
          this.currentProgram?.config?.offer?.counter_offer_review &&
          this.isReviewMode
        ){
          payload.status='COUNTERED_PENDING_REVIEW';
        }
        this.subscriptions.push(
          this.jobdetailService.updateReleasedOffer(payload, this.jobId, this.candidateDetails.candidate.id, this.offerId).subscribe({
            next: (res: any) => {
              if(this.isReviewMode){
                this.alert.success('Offer is reviewed successfully. ');
              }
              else this.alert.success('Offer is updated successfully. ');
              this.isLoader = false;
              if (this.isfeomDetails) {
                // this.eventStream.emit(new EmitEvent(Events.RELOAD_OFFERS, true));
                this.offerModeReset.emit(true);
                this.router.navigate([`jobs/details/job-details/${this.jobId}/candidate/${this.candidateDetails.candidate.id}/offers`]);
              } else {
                this.offerModeReset.emit(true);
                this.router.navigate(['/jobs/details/job-details/' + this.jobId + '/offers']);
              }
            },
            error: err => {
              // this.alert.error(
              //   JSON.parse(JSON.stringify(err)).error.error.message
              // );
              this.showError(err);
              this.isLoader = false;
              this.isDisabled = false;
            },
          }),
        );
      } else {
        this.subscriptions.push(
          this.jobdetailService.releaseOffer(payload, this.jobId, this.candidateDetails.candidate.id).subscribe({
            next: (res: any) => {
              this.alert.success('Offer created successfully.');
              this.isLoader = false;
              if (this.isfeomDetails) {
                this.eventStream.emit(new EmitEvent(Events.RELOAD_OFFERS, true));
                this.router.navigate([`jobs/details/job-details/${this.jobId}/candidate/${this.candidateDetails.candidate.id}/offers`]);
              } else {
                this.router.navigate(['/jobs/details/job-details/' + this.jobId + '/offers']);
              }
            },
            error: err => {
              // this.alert.error(
              //   JSON.parse(JSON.stringify(err)).error.error.message
              // );
              this.showError(err);
              this.isLoader = false;
              this.isDisabled = false;
            },
          }),
        );
      }
    } else {
      this.submitted = false;
      this.isLoader = false;
    }
  }
  isEmptyObject = object => {
    return object && Object.keys(object).length === 0 && object.constructor === Object;
  };
  get vendorMarkUp() {
    return this.jobdetailService.getProgramConfig('vendor_markup');
  }

  // get rateFactor() {
  //   return this.jobdetailService.getProgramConfig('rate_factor');
  // }
  getProgramConfiguration() {
    this.ratefactorLoading = true;
    this.subscriptions.push(
      forkJoin([this.vendorMarkUp, this.rateFactor]).subscribe({
        next: (data: any) => {
          this.ratefactorLoading = false;
          if (data) {
            this.markupConfig = data[0].config.markup;
            this.markupConfigOriginal = data[0].config.markup;

            this.rateConfig = data[1]?.config; //JSON.parse(data[1].config);
            this.clientOverTimeBillRateFactor = this.rateConfig.rate_factors[0].rate_factors.filter(
              r => r.applies_to === 'VENDOR',
            )[0].rate_factor;
            this.clientDoubleTimeBillRateFactor = this.rateConfig.rate_factors[1].rate_factors.filter(
              r => r.applies_to === 'VENDOR',
            )[0].rate_factor;

            this.clientOverTimePayRateFactor = this.rateConfig.rate_factors[0].rate_factors.filter(
              r => r.applies_to === 'CANDIDATE',
            )[0].rate_factor;
            this.clientDoubleTimePayRateFactor = this.rateConfig.rate_factors[1].rate_factors.filter(
              r => r.applies_to === 'CANDIDATE',
            )[0].rate_factor;
          }
        },
        error: err => {
          // this.alert.error(errorHandler(err));
          this.showError(err);
        },
      }),
    );
  }

  calculateRates(key, value?) {
    let mainPayRate = this.createOfferForm.get('candidatePayRate')?.value;
    let mainBillRate = this.createOfferForm.get('billRatevalue')?.value;
    const adjustedMarkup = this.createOfferFormControls?.rateMarkUpValue?.value || 0;
    let vendorMarkup = this.createOfferForm?.value?.rateMarkUpValue || 0;
    //const max_bill_rate = Number(this.submissionForm.get('maxBillRate')?.value)
    //const min_bill_rate = Number(this.submissionForm.get('minBillRate')?.value);
    const max_bill_rate = 0;
    const min_bill_rate = 0;
    let rate_model = this.rateModelObj[this.programRateModel];
    const payload = {
      hierarchy: this.jobHierarchy || '',
      rate_model: this.rateModelObj[this.programRateModel],
      adjusted_markup: adjustedMarkup,
      vendor_markup: vendorMarkup,
      client_bill_rate: mainBillRate,
      candidate_pay_rate: mainPayRate,
      max_bill_rate: max_bill_rate,
      min_bill_rate: min_bill_rate,
      msp_fee_types: this.amount_type,
      msp_fee_value: this.mspFee,
      msp_fee_funded_by: this.funded_by,
      rate_input: value ? value : this.returnRateInput(key),
      ot_exempt: this.is_ot_exempt,
      is_markup_by_rate_type: this.markupByRateTypeEnabled,
      fee_details: this.fee_details,
      is_cost_component : this.costComponentEnabled
    }

    let rate_factors_payload = [];
    this.rate_factors_arr?.map(x =>
      rate_factors_payload?.filter(a => a?.abbreviation?.toLowerCase() == x?.abbreviation?.toLowerCase())?.length > 0 ? null : rate_factors_payload?.push(x),
    );
    payload['rate_factors'] = rate_factors_payload;

    if ((key === 'billrate' && mainBillRate === null) || (key === 'payrate' && mainPayRate === null)) {
      return;
    }
    if (this.programRateModel.toLowerCase() === 'pay_rate' || this.programRateModel.toLowerCase() === 'markup') {
      if (!this.createOfferFormControls?.rateMarkUpValue.value) {
        return;
      }
    }

    if (this.programRateModel.toLowerCase() === 'pay_rate') {
      if (
        !this.createOfferFormControls?.candidatePayRate.value ||
        this.createOfferFormControls?.candidatePayRate.value <= 0 ||
        !this.createOfferFormControls?.candidatePayRate.valid
      ) {
        return;
      }
    }

    if(!payload['rate_factors'] || payload['rate_factors']?.length === 0){
      return;
    }

    if (!rate_model) {
      return;
    }
    if (adjustedMarkup === null || vendorMarkup === null) {
      return;
    }

    if (payload.msp_fee_value === null || payload.msp_fee_value === undefined) {
      return false;
    }

    this.candidateService.post(`/core-money/programs/${this.programId}/rate-model`, payload).subscribe({
      next: (res: any) => {
        const { data } = res;
        const rateObj = data?.rate;
        this.isfeesIncluded = data?.is_fees_included;
        for (var prop in rateObj) {
          const ele = rateObj[prop];
          if (prop == 'regular') {
            this.vendorBillRate = ele?.vendor_rate;
            this.clientBillRate = ele?.billrate;
            this.createOfferForm.patchValue({
              DefaultRateValue: ele?.default,
            });
            if (this.programRateModel == 'MARKUP') {
              this.createOfferForm.patchValue(
                {
                  billRatevalue: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  vendorBillRateValue: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  candidatePayRate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                },
                { emitEvent: false },
              );
            } else if (this.programRateModel == 'PAY_RATE') {
              this.createOfferForm.patchValue(
                {
                  billRatevalue: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  candidatePayRate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  vendorBillRateValue: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
                },
                { emitEvent: false },
              );
            } else {
              this.createOfferForm.patchValue(
                {
                  candidatePayRate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  billRatevalue: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  vendorBillRateValue: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
                },
                { emitEvent: false },
              );
            }
          }
          const arrayValues = this.ratesArray.value;
          const rateIndex = arrayValues?.findIndex(r => r.rate_factor?.toLowerCase() === prop);
          if (rateIndex > -1) {
            if (this.programRateModel == 'MARKUP') {
              this.ratesArray?.at(rateIndex)?.patchValue(
                {
                  bill_rate: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  pay_rate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  vendor_bill_rate: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  client_bill_rate: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  default: ele?.default,
                },
                { emitEvent: false },
              );
            } else {
              this.ratesArray?.at(rateIndex)?.patchValue(
                {
                  bill_rate: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  pay_rate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  vendor_bill_rate: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
                  default: ele?.default,
                },
                { emitEvent: false },
              );
            }
          }
          if(this.costComponentEnabled){
            this.jobdetailService?.updateCostComponentValues(rateObj,this.createOfferForm,this.ratesArray,this.payloadRateFactors)
          }
        }
        if (this.clientBillRate) {
          this.getWorkingHoursEstimate();
        }
      },
      error: err => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
        this.isDisabled = true;
      },
    });
  }


  getOnboardingCheckList(locationId,program_industry,template_id,checklist_id,hierarchy_id){
    let payload = {
      location_id: locationId,
      program_industry: program_industry,
      job_template_id: template_id,
      template_checklist_id: checklist_id,
      hierarchy_id: hierarchy_id,
      sourcing_model:"CONTINGENT"

    }
    this.jobdetailService.getOnboardingCheckListData(this.currentProgram?.id, payload).subscribe(data => {
      this.onboardingCheckListData = data['checklists'];
      if(this.onboardingCheckListData){
        this.createOfferForm.patchValue({
        onboarding_checklst: this.onboardingCheckListData[0]?.id
        })
        this.selectedOnboardingItem = this.onboardingCheckListData[0];
      }

    })
  }


  setSelectedItem(event) {
    this.selectedOnboardingItem = event;
  }

  getTasksLength(): number {
    if (this.selectedOnboardingItem && this.selectedOnboardingItem?.tasks) {
      return this.selectedOnboardingItem?.tasks?.length;
    }
    return 0;
  }

  viewTasks() {
    this.eventStream.emit(new EmitEvent(Events.VIEW_TASKS, true));
  }

  getUpdatedValue(event){
    this.createOfferForm.patchValue({
      onboarding_checklst: event?.id
    })
    this.selectedOnboardingItem = event;
  }

  getClosedOnboarding(event){
    this.selectedOnboardingItem = event;
  }

  returnRateInput(rate: any) {
    let rate_model = this.rateModelObj[this.programRateModel];
    if (rate === 'payrate') {
      return 'candidate';
    } else if (rate === 'billrate') {
      return 'client';
    } else if (rate === 'markup') {
      if (rate_model === 'payrate') {
        return 'candidate';
      } else if (rate_model === 'markup') {
        return 'client';
      }
    }
  }

  updateMarkupValues(arr, markupValue) {
    return arr?.map((x) => {
      if (!x?.markup) {
        x.markup = markupValue;
      }
      return x;
    });
  }

  updateCostComponentValues(arr, costComponentValue){
    return arr?.map((x) => {
      if (!x?.cost_component) {
        x.cost_component = costComponentValue;
      }
      return x;
    });
  }


 getRateFactor(jobHierarchy?) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${this.currentProgram?.id}/rate-factors?is_enabled=True&hierarchy=${jobHierarchy}`;
    this.jobdetailService.get(url).subscribe((res: any) => {
      let { rate_factors } = res;
      this.configRateFactors = JSON.parse(JSON.stringify(res?.rate_factors));
      this.stRateFactor = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
      this.ratesConfiguration = rate_factors;
      this.setRateFactors(rate_factors);
    });
  }
  setRateFactors(rate_factors) {
    this.rateFactor = rate_factors;
    this.setRateFactorValues = rate_factors;
    let ratesfromConfig = rate_factors;

    if (this.isRatesFromJob && !this.hybridTimesheetSelected) {
      this.rateFactor = this.candidateDetails?.candidate?.rate_factors_info;
      let stRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
      this.stRateFactor = stRate ? stRate : this.stRateFactor;
    }
    else if (this.hybridTimesheetSelected) {
      this.rateFactor = rate_factors;
      let stRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
      this.stRateFactor = stRate ? stRate : this.stRateFactor;
    }
    this.otRateFactors = rate_factors ? JSON.parse(JSON.stringify(rate_factors)) : [];
    this.noOTRateFactors = rate_factors ? [...rate_factors] : [];
    rate_factors = rate_factors?.filter(rate => rate?.abbreviation?.toLowerCase() !== 'st');

    this.patchOTFormulas();

    if (this.rateFactor?.length === 0 || this.rateFactor?.find(x => x.abbreviation != 'ST')) {
      this.stFlatAdustment = ratesfromConfig?.find(element => element.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
    } else {
      this.stFlatAdustment = ratesfromConfig?.find(element => element.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
    }

  if(this.timesheetChanged) {
     //config Rates
     let configRates = this.isRatesFromJob ? this.jobRates : this.setRateFactorValues;
     configRates = this.jobdetailService?.getRateFactorInfoForPayload(configRates, this.ratesConfiguration, this.hybridTimesheetSelected);
     //this.updatedConfigRates = this.updateMarkupValues(configRates, this.createOfferForm.get('rateMarkUpValue')?.value);

     this.updatedConfigRates = this.getMarkupValuesForBasicRates(configRates, (this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info :
      this.offerDetailStageData?.rate_factors_info));

     //hybrid Rates
     let hybridFactors = this.jobdetailService?.getRateFactorInfoForPayload(rate_factors, this.ratesConfiguration, this.hybridTimesheetSelected);
     this.updatedHybridFactors = this.updateMarkupValues(hybridFactors, this.createOfferForm.get('rateMarkUpValue')?.value);

     if(this.costComponentEnabled){
      this.updatedConfigRates = this.getCostComponentValuesForBasicRates(configRates, (this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info :
      this.offerDetailStageData?.rate_factors_info));

      let costComponentValue = this.offerPageMode != 'edit' ? this.candidateDetails?.candidate?.rate_factors_info?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component :
      this.offerDetailStageData?.rate_factors_info?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component;
      this.updatedHybridFactors = this.updateCostComponentValues(hybridFactors, costComponentValue);
    }


    let newRates = this.hybridTimesheetSelected ? this.updatedHybridFactors : this.jobdetailService?.getRateFactorInfoForPayload(this.rateFactor, this.ratesConfiguration, this.hybridTimesheetSelected);
    this.rate_factors_arr = newRates;
    this.payloadRateFactors = newRates;
    if(this.offerPageMode === 'edit'){
      let isSameTimesheet = this.timeSheetTypeValue === this.offerDetailStageData?.timesheet_type?.value;
      if (this.hybridTimesheetSelected){
        this.rate_factors_arr = isSameTimesheet ? this.offerRateFactors : this.updatedHybridFactors;
        this.payloadRateFactors = isSameTimesheet ? this.offerRateFactors : this.updatedHybridFactors;
      }
    }
    this.showRateFormulas(newRates.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
  }
    let otFactorConditions = false;
    if(this.candidateDetails?.candidate?.ot_exempt && this.otExemptChanged && !this.is_ot_exempt){
      this.rate_factors_arr = this.updatedConfigRates;
      this.showRateFormulas(this.updatedConfigRates.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
      this.payloadRateFactors = this.updatedConfigRates;
      otFactorConditions = true;
    }

    let timesheetsSame = this.timeSheetTypeValue === this.offerDetailStageData?.timesheet_type?.value;
    if(this.offerPageMode === 'edit'){
      if (this.hybridTimesheetSelected){
        timesheetsSame ? this.getRateDetails(this.offerDetailStageData?.rates, true) : this.getRateDetails(rate_factors);
        timesheetsSame ? this.showRateFormulas(this.offerRateFactors?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'))
        : this.showRateFormulas(rate_factors?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
        this.rate_factors_arr = timesheetsSame ? this.offerRateFactors : this.updatedHybridFactors;
        this.payloadRateFactors = timesheetsSame ? this.offerRateFactors : this.updatedHybridFactors;
        this.patchSTMarkup(timesheetsSame ? this.offerRateFactors : this.updatedHybridFactors);
      }
      else{
        this.rate_factors_arr = timesheetsSame ? this.offerRateFactors : this.candidateDetails?.candidate?.rate_factors_info;
        this.payloadRateFactors = timesheetsSame ? this.offerRateFactors : this.candidateDetails?.candidate?.rate_factors_info;
        this.patchSTMarkup(timesheetsSame ? this.offerRateFactors : this.candidateDetails?.candidate?.rate_factors_info);
        timesheetsSame ? this.getRateDetails(this.offerDetailStageData?.rates) : this.getRateDetails(this.candidateDetails?.candidate?.rates);
      }
    }
    else{
      if(!otFactorConditions){
        this.rate_factors_arr = this.hybridTimesheetSelected ? this.updatedHybridFactors : this.candidateDetails?.candidate?.rate_factors_info;
        this.payloadRateFactors = this.hybridTimesheetSelected ? this.updatedHybridFactors : this.candidateDetails?.candidate?.rate_factors_info;
        this.patchSTMarkup(this.hybridTimesheetSelected ? this.updatedHybridFactors : this.candidateDetails?.candidate?.rate_factors_info);
      }
      this.hybridTimesheetSelected ?
      this.showRateFormulas(this.updatedHybridFactors?.filter(rate => rate.abbreviation.toLowerCase() !== 'st')) :
      this.showRateFormulas(this.candidateDetails?.candidate?.rate_factors_info?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
      this.hybridTimesheetSelected ? this.getRateDetails(rate_factors) : this.getRateDetails(this.candidateDetails?.candidate?.rates);
    }
    this.patchOTFormulas();
  }

  patchOTFormulas(){
    if (this.is_ot_exempt) {
      let bill_rate_formula;
      let pay_rate_formula;
      this.otRateFactors?.forEach(element => {
        const formula = new Map<string, string>();
        bill_rate_formula = element?.bill_rate;
        pay_rate_formula =  element?.pay_rate;
        let billRate =
          bill_rate_formula?.length > 1 ? [bill_rate_formula?.find(x => x.rate_type.toUpperCase() == 'BILL_RATE')] : bill_rate_formula;
        let payRate =
          pay_rate_formula?.length > 1 ? [pay_rate_formula?.find(x => x.rate_type.toUpperCase() == 'PAY_RATE')] : pay_rate_formula;
        formula.set(
          'bill_rate',
          this.getFormula([billRate.find(x => (x.factor = this.is_ot_exempt ? 1 : x.factor))]),
        );
        formula.set(
          'pay_rate',
          this.getFormula([payRate.find(x => (x.factor = this.is_ot_exempt ? 1 : x.factor))]),
        );
        //this.patchFormula(element, bill_rate_formula, pay_rate_formula);
        this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
      });
    }
  }

  showRateFormulas(rates:any = []){
    rates?.forEach(element => {
    const formula = new Map<string, string>();
      formula.set('bill_rate',this.getFormula(element?.bill_rate));
      formula.set('pay_rate',this.getFormula(element?.pay_rate));
      this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
    });
  }

  getUpdatedRateFactorvalues(event){
    this.cancelPopOver(true);

    let rateFactors = this.offerPageMode !='edit' ? this.candidateRateFactors : this.offerRateFactors;

    if((this.candidateDetails?.candidate?.ot_exempt && this.otExemptChanged && !this.is_ot_exempt)){
      rateFactors = this.updatedConfigRates
    }
    else if(this.isRatesUpdated){
      rateFactors = this.updatedMarkupRateFactors;
    }
    else if((this.otExemptChanged && this.is_ot_exempt)){
      rateFactors = this.overTimeExemptRateFactors;
    }
    else if((this.hybridTimesheetSelected && this.otExemptChanged && !this.is_ot_exempt )){
      rateFactors = this.updatedHybridFactors;
    }
    else if(this.offerPageMode ==='edit') {
      if(this.timeSheetTypeValue != this.offerDetailStageData?.timesheet_type?.value){
        rateFactors = this.candidateDetails?.candidate?.rate_factors_info;
      }
      else{
        rateFactors = this.offerRateFactors;
      }
    }
    else if(this.hybridTimesheetSelected){
      rateFactors = this.updatedHybridFactors;
    }

    if(!rateFactors){
      rateFactors = []
    }

    let finalRates = [...rateFactors];
    let rates = this.updateRateFactors(finalRates, event);
    this.rate_factors_arr = rates;
    this.calculateRatesBasedonRateModel();
    this.showRateFormulas(rates);
    this.payloadRateFactors = JSON.parse(JSON.stringify(rates));
  }

  calculateRatesBasedonRateModel(){
    let rate_model = this.rateModelObj[this.programRateModel];
    if (rate_model === 'payrate'){
      this.calculateRates('payrate')
    }
    else{
      this.calculateRates('billrate')
    }
  }

  cancelPopOver(event) {
    if(event){
      this.otFactorsPopover = -1;
      this.popoverType = '';
    }
  }

  updateRateFactors( rateFactors: any[],updatedValues: any[]): any[] {
    const updatedRateFactors = rateFactors?.map((rateFactor) => {
      const updatedRateFactor = { ...rateFactor };
      const abbreviation = updatedRateFactor?.abbreviation.toLowerCase();

      const matchingUpdatedValues  = updatedValues.filter(
        (value) => value.abbreviation.toLowerCase()  === abbreviation.toLowerCase()
      );

      if (matchingUpdatedValues?.length > 0) {
          matchingUpdatedValues.forEach((matchingUpdatedValue) => {
          const rateFactorType = matchingUpdatedValue?.rateFactorType;
          const rateType = matchingUpdatedValue?.rate_type;

          updatedRateFactor[rateFactorType].forEach((factor) => {
            if (factor.rate_type === rateType) {
              factor.factor = matchingUpdatedValue?.factor;
            }
          });

        });
    }
      return updatedRateFactor;
    });

    return updatedRateFactors;
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
  }

  hideRateDetails(data) {
    this.rateDetailsVisible = false;
    if(this.createOfferForm===undefined)  return
    const setAndMarkDirty = (formControl, value, dirty=false)=>{
      dirty && formControl.markAsDirty()
      formControl?.setValue(value);
    }
    if (data.update) {
      this.isRatesUpdated = data?.update;
      this.vendorBillRate = data?.standardRates.vendor_rate;
      this.clientBillRate = data?.standardRates.billrate;
      this.payloadRateFactors = data?.factors;
      this.updatedMarkupRateFactors = _.cloneDeep(data?.factors);
      this.rate_factors_arr = data?.factors;
      setAndMarkDirty(this.createOfferForm?.get('candidatePayRate'), data?.standardRates?.payrate, true)
      setAndMarkDirty(this.createOfferForm?.get('billRatevalue'), data?.standardRates?.billrate)
      setAndMarkDirty(this.createOfferForm?.get('vendorBillRateValue'), data?.standardRates?.vendor_rate)
      if (data?.standardRates?.markup) {
        this.createOfferForm?.get('rateMarkUpValue') && setAndMarkDirty(this.createOfferForm?.get('rateMarkUpValue'), data?.standardRates?.markup)
      }
      if (this.costComponentEnabled && data?.standardRates?.cost_component) {
        for (const cc of data.standardRates.cost_component) {
          this.createOfferForm.get('costComponent')?.get(cc?.code || 'markup')?.patchValue({ ...cc });
        }
      }
      const submissionForm = this.createOfferForm?.get('rates') as UntypedFormArray;
      for (const rate of submissionForm?.controls) {
        const newRateObj = data['rateValues']?.find(obj => obj?.rate_factor === rate?.get('rate_factor')?.value);
        setAndMarkDirty(rate.get('bill_rate'), newRateObj?.billrate);
        setAndMarkDirty(rate.get('vendor_bill_rate'), newRateObj?.vendor_rate);
        setAndMarkDirty(rate.get('pay_rate'), newRateObj?.payrate);
        setAndMarkDirty(rate.get('markup'), newRateObj?.markup);
        if (this.costComponentEnabled && newRateObj?.cost_component?.length) {
          for (const cc of newRateObj.cost_component) {
            rate.get('cost_component')?.get(cc.code || 'markup')?.patchValue({ ...cc });
          }
        }
      }
      this.showRateFormulas(data['factors']);
      this.getWorkingHoursEstimate();
    }
  }

  get standardRateDetails() {
    if (this.createOfferForm)
      return {
        billrate: this.createOfferForm?.get('billRatevalue')?.value,
        payrate: this.createOfferForm?.get('candidatePayRate')?.value,
        vendor_rate: this.createOfferForm?.get('vendorBillRateValue')?.value,
        markup: this.createOfferForm?.get('rateMarkUpValue')?.value || 0,
        cost_component: this.createOfferForm?.get('costComponent')?.value
      }
  }

  get ratesArrayValues(){
    let rawValues = this.ratesArray?.getRawValue();
    return rawValues?.map(({ bill_rate, vendor_bill_rate, pay_rate, ...rest }) => ({
        billrate: bill_rate,
        vendor_rate: vendor_bill_rate,
        payrate: pay_rate,
        ...rest
      }));
  }

  get requiredValidationData(){
    return {
      minValue: +this.createOfferForm?.get('minBillRate')?.value,
      maxValue: +this.createOfferForm?.get('maxBillRate')?.value,
      hideRateAuthority: true,
      allowOfferMinRate: this.allowOfferMinRate,
      submission_exceed_max_bill_rate: this.submission_exceed_max_bill_rate,
      markup: this.selectedSourceType === 'Sourced' ? this.markupConfigObj?.markups?.sourced_markup : this.markupConfigObj?.markups?.payrolled_markup
    }
  }
  get rateDetailsEditableFactors(): boolean {
    return this.checkAuthorization('manage_rate_type_offer')
  }

  get rateDetailsEditableMarkup(): boolean {
    return  this.checkAuthorization('manage_markup');
  }

  get rateDetailsEditableCostComponent():boolean {
    return this.costComponentEnabled && this.checkAuthorization('manage_cost_component');
  }

  get markupByRateTypeEnabled(): boolean {
    return this.candidateDetails?.candidate?.markup_by_rate_type || false;
  }

  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  get rateDetailsPayload(): RateModelPayloadDefaults {
    if (this.createOfferForm === undefined) return
    return {
      hierarchy: this.jobHierarchy,
      rate_model: this.rateModelObj[this.programRateModel],
      min_bill_rate: "0.0",
      max_bill_rate: "0.0",
      msp_fee_types: this.amount_type,
      msp_fee_value: this.mspFee,
      msp_fee_funded_by: this.funded_by,
      ot_exempt: this.is_ot_exempt,
      adjusted_markup: this.createOfferForm?.get('rateMarkUpValue')?.value,
      fee_details: this.fee_details
    }
  }

  getFormula(rateArray = []) {
    let formula = '';
    rateArray?.forEach(obj => {
      let adjustment = obj?.adjustment;
      if (adjustment) {
        return (formula += `(${this.convertCase(obj?.rate_type)} * ${this.convertStr(obj?.factor)}) + ${adjustment} `);
      }
      return (formula += `(${this.convertCase(obj?.rate_type)} * ${this.convertStr(obj?.factor)}) +`);
    });
    formula = formula.slice(0, -1);
    return formula;
  }

  convertStr(str) {
    return parseFloat(str?.toString())
  }

  rateFactorApplicable(value: boolean, index: number){
    const rate = this.ratesArray.at(index);
    rate.get('applicable').setValue(value);
    let abbreviation = rate?.value?.abbreviation;
    const matchingFactor = this.payloadRateFactors?.find(rate => rate?.abbreviation.toLowerCase() === abbreviation.toLowerCase());
    if (matchingFactor) {
      matchingFactor.applicable = value;
    }
  }

  convertCase(str) {
    if (str)
      return `ST ${str?.toUpperCase().replaceAll('_', ' ')}`
  }

  markupConfigObj: any;
  getMarkup(vendorId, rateMarkupValue) {
    let url = `/configurator/programs/${this.programId}/vendors/${vendorId}/markups?industry_id=${this.jobLaborCategory}&hierarchy_id=${this.jobHierarchy}&work_location_id=${this.jobWorkLocation}`;
    this.isMarkupCalled = true;
    this.jobdetailService.get(url).subscribe((res: any) => {
      const isDsaasVendor = res?.is_dsaas_vendor;
      const { markup_config } = res;
      this.markupConfigObj = markup_config;
      if (this.markupConfigObj?.markups?.sourced_markup != null && Number(this.markupConfigObj?.markups?.sourced_markup) >= 0) {
        this.markupConfigObj.markups.sourced_markup = this.accuracy.transform(
          this.markupConfigObj?.markups?.sourced_markup,
          AccuracyConfigEnum.MARKUP_PERCENTAGE,
          { isEdit: true },
        );
      }
      if (this.markupConfigObj?.markups?.payrolled_markup != null && Number(this.markupConfigObj?.markups?.payrolled_markup) >= 0) {
        this.markupConfigObj.markups.payrolled_markup = this.accuracy.transform(
          this.markupConfigObj?.markups?.payrolled_markup,
          AccuracyConfigEnum.MARKUP_PERCENTAGE,
          { isEdit: true },
        );
      }
      if (!isDsaasVendor) {
        if (Object.keys(this.markupConfigObj?.markups)?.length > 0 && this.programRateModel != 'BILL_RATE') {
          if (
            this.markupConfigObj?.markups?.sourced_markup != null &&
            Number(this.markupConfigObj?.markups?.sourced_markup) >= 0 &&
            this.markupConfigObj?.markups?.payrolled_markup != null &&
            Number(this.markupConfigObj?.markups?.payrolled_markup) >= 0
          ) {
          } else if (this.markupConfigObj?.markups?.sourced_markup != null && Number(this.markupConfigObj?.markups?.sourced_markup) >= 0) {
            this.isSourced = true;
          } else if (
            this.markupConfigObj?.markups?.payrolled_markup != null &&
            Number(this.markupConfigObj?.markups?.payrolled_markup) >= 0
          ) {
            this.isPayroll = true;
          }
        }
      } else {
        this.selectedSourceType = 'Payrolled';
        this.isPayroll = true;
        this.createOfferForm.patchValue({
          candidate_sourcing_type: this.selectedSourceType,
          rateMarkUpValue: this.accuracy.transform(rateMarkupValue, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
        });
        return;
      }

      // let fieldName = '';
      // if (this.markupConfigObj.rate_model === 'BILL_RATE') {
      //   fieldName = 'candidatePayRate';
      // } else if (this.markupConfigObj.rate_model == 'PAY_RATE') {
      //   fieldName = 'billRatevalue';
      // }
      // this.createOfferForm.get(fieldName).disable();
      if (!this.isPayRolledValid && !this.isSourcedValid && this.programRateModel != 'BILL_RATE') {
        this.selectedSourceType = 'Sourced';
        this.createOfferForm.patchValue({
          candidate_sourcing_type: this.selectedSourceType,
          rateMarkUpValue: this.markupConfigObj?.markUps?.sourced_markup,
        });
        return;
      }

      if (rateMarkupValue) {
        this.createOfferForm.patchValue({
          rateMarkUpValue: this.accuracy.transform(rateMarkupValue, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
        });
      } else if (!this.markupConfigObj?.is_sliding_scale) {
        this.createOfferForm.patchValue({
          markUpValue:
            this.createOfferFormControls?.candidate_type?.value === 'sourced'
              ? this.markupConfigObj?.markups?.sourced_markup
              : this.markupConfigObj?.markups?.payrolled_markup,
          rateMarkUpValue: this.markupConfigObj?.markups?.sourced_markup,
        });
        return;
      }
      if (this.programRateModel == 'BILL_RATE') {
        return;
      }
      let submissionSourceType =
        this.createOfferForm.get('candidate_sourcing_type')?.value?.toLowerCase() == 'sourced' ? 'sourced_markup' : 'payrolled_markup';

      if (this.markupConfigObj.markups[submissionSourceType] == null || Number(this.markupConfigObj.markups[submissionSourceType]) == 0) {
        if (submissionSourceType?.toLowerCase() == 'sourced_markup') {
          this.selectedSourceType = 'Payrolled';
          submissionSourceType = 'payrolled_markup';
        } else {
          this.selectedSourceType = 'Sourced';
          submissionSourceType = 'sourced_markup';
        }
      } else {
        return;
      }
      this.createOfferForm.patchValue({
        candidate_sourcing_type: this.selectedSourceType,
        rateMarkUpValue: this.markupConfigObj?.markups[submissionSourceType],
      });
      this.calculateRates('markup');
    });
  }

  getFormulatoDisplay(abbreviation, rateFactor) {
    if (this.rateFactorFomrula?.has(abbreviation?.toLowerCase())) {
      const abbr: Map<string, string> = this.rateFactorFomrula?.get(abbreviation?.toLowerCase());
      return abbr ? abbr.get(rateFactor) : '';
    } else {
      return '';
    }
  }

  twodecimalPlaces(e: any, ctrl: string) {
    this.createOfferForm.patchValue({ [ctrl]: +e.target.valueAsNumber });
    this.createOfferForm.updateValueAndValidity();
  }

  setFoundationalFieldsFormValid(isFoundationalFieldsValid) {
    this.isFoundationalFieldsValid = isFoundationalFieldsValid;
  }
  foundationalFieldUpdated(event) {
    this.foundationalFieldsFormData = event;
  }
  setCustomFieldsFormValue(isCustomFieldsFormValid) {
    this.isCustomFieldsFormValid = isCustomFieldsFormValid;
  }
  customFieldUpdated(event) {
    this.customFieldsFormData = event;
  }

  ngOnDestroy() {
    this.jobManagerTypeAhead$.unsubscribe();
    this.timesheetManagerTypeAhead$.unsubscribe();
    this.expenseManagerTypeAhead$.unsubscribe();
    this.jobdetailService.unsubscribe();
    this.subscription.forEach(sub => {
      sub.unsubscribe();
    });
  }

  populateHolidayCalenderList(res) {
    this.holidayCalenderList = res;
    this.loadingholidayCalender = false;
  }

  onAccountCodeSideBarClose = (value: AccountCodeData) => {
    this.showAccountCode = 'hidden';
    this.accountCodeData = value;
    if (value?.is_validated && this.accountCodeData.account_code) {
      this.createOfferForm.patchValue({
        account_code: this.accountCodeData.account_code,
      });
    } else {
      this.createOfferForm.patchValue({
        account_code: null,
      });
    }
  };

  onCloseSideBar = (value: string) => {
    this.showAccountCode = 'hidden';
  };

  setOfferDetails() {
    let offerDetails = this.offerDetails['offer'] || {};
    let offerDetailsStage = offerDetails['stages'][0] || [];
    this.hybridTimesheetSelected = offerDetailsStage?.is_hybrid;
    this.jobmanagerSelected = !!offerDetailsStage['job_manager'] ? offerDetailsStage['job_manager']['id'] : '';
    let jobManager: any;
    offerDetails?.stages?.forEach(element => {
      if (Object.keys(element?.job_manager).length != 0) {
        jobManager = element?.job_manager?.id;
      }
    });
    this.showRateFormulas(offerDetailsStage?.rate_factors_info.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
    this.rate_factors_arr = offerDetailsStage?.rate_factors_info;
    this.payloadRateFactors = offerDetailsStage?.rate_factors_info;
    this.offerRateFactors = _.cloneDeep(offerDetailsStage?.rate_factors_info);
    let timesheetManagers = !!offerDetailsStage['timesheet_manager'] ? offerDetailsStage['timesheet_manager'] : [];
    let expenseManagers = !!offerDetailsStage['expense_managers'] ? offerDetailsStage['expense_managers'] : [];
    let timesheetIds = timesheetManagers.map(item => item.id);
    let expenseIds = expenseManagers.map(item => item.id);
    this.timesheetManagerSelected = this.multipleApprovers ? timesheetIds : timesheetIds[0];
    this.expenseManagerSelected = this.multipleApprovers ? expenseIds : expenseIds[0];
    this.holidayCalenderSelected = offerDetailsStage['holiday_calendar_id'];
    this.taxData = offerDetails?.taxes || [];
    this.adjustmentData = offerDetails?.adjustment_fee;
    this.timeSheetTypeValue = offerDetailsStage?.timesheet_type?.value;
    (this.timesheetTypeSelected = offerDetailsStage?.timesheet_type?.id),
      this.fetchTimesheetTypes(this.jobDetailsData, this.workLocationSelected);
    this.createOfferForm.patchValue({
      jobManager: this.jobmanagerSelected || jobManager,
      timesheetManager: this.timesheetManagerSelected,
      expenseManager: this.expenseManagerSelected,
      locations: this.workLocationSelected,
      holidayCalender: this.holidayCalenderSelected, //'190aa402-e82d-4d0f-8514-61f16dffa873',
      timesheetType: this.timesheetTypeSelected, //'22b82f22-b0a5-4bd9-a549-060113d1f56e',
      adjustmentData: this.adjustmentData
    });

    this.createOfferForm.updateValueAndValidity();
  }

  // get the rate type for the selected job
  getRateType = (unitOfMeasure: string): string => (unitOfMeasure ? unitOfMeasure.toUpperCase() : '');

  get disableOnboarding() {
    return this.currentProgram?.config?.is_onboading_disabled;
  }

  get disableOfferAcceptance() {
    return this.currentProgram?.config?.is_offer_acceptance_disabled;
  }
  getCustomFields() {
    let url = `/configurator/programs/${this.currentProgram?.id}/custom-fields?entity_ref=SUBMISSIONS`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.submissionCustomFields = data.custom_fields;
        }
      },
      error: error => {},
    });
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500 || err?.status == 400,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  getTenure(hierarchyId, tenureDate?) {
    this.tenureSpan = this.tenureSpanUnit = this.tenureMessage = null;
    if (hierarchyId && this.currentProgram?.config?.tenure_modules) {
      if (Object.keys(this.currentProgram?.config?.tenure_modules)?.includes(hierarchyId)) {
        if (this.currentProgram?.config?.tenure_modules[hierarchyId]?.find(tm => tm.code.toLowerCase() === 'offers')) {
          this.jobService.get(`/configurator/programs/${this.programId}/tenures?hierarchy_id=${hierarchyId}`).subscribe({
            next: (data: any) => {
              if (data?.tenures?.length) {
                this.tenureSpan = data?.tenures[0]?.consecutive_employment_span;
                this.tenureSpanUnit = data?.tenures[0]?.consecutive_employment_span_unit?.toLowerCase();
                if (tenureDate) {
                  this.getEndRange(tenureDate);
                }
              }
            },
            error: err => {
              // this.alert.error('Unable to get the tenure details.<br>' + err);
              this.showError('Unable to get the tenure details.');
            },
          });
        }
      }
    }
  }

  getEndRange(d: Date) {
    if (this.tenureSpan && this.tenureSpanUnit && d) {
      const endRange = new Date(d);
      endRange.setDate(d?.getDate() - 1);
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
        let dateCheck = new Date();
        let tenureDate = new Date(endRange);
        const currentDate = this.dateTimestamp(dateCheck?.toString());
        const endDate = Date.parse(tenureDate?.toString());
        if (currentDate && endDate) {
          if (endDate < currentDate) {
            this.tenureMessage = 'The tenure is greater than required duration.';
          } else {
            this.tenureMessage = null;
          }
        }
      }
    }
    return;
  }

  dateTimestamp(date_str: string) {
    if (!date_str) {
      date_str = new Date().toString();
    }
    const date_rgx = new RegExp(/([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})/g);
    let resultDate = date_str.replace(date_rgx, '00:00:00');
    let intervalDate = Date.parse(resultDate);
    return intervalDate;
  }

  patchMarkup() {
    this.isCandidateSourcingTypeChanged = true;
    this.selectedSourceType = this.createOfferFormControls?.candidate_sourcing_type?.value;
    const markup =
      this.createOfferFormControls?.candidate_sourcing_type?.value === 'Sourced'
        ? this.markupConfigObj?.markups?.sourced_markup
        : this.markupConfigObj?.markups?.payrolled_markup;
    this.createOfferForm.patchValue({
      markUpValue: markup,
      rateMarkUpValue: markup,
    });
    this.calculateRates('markup');
  }

  get isSourcedValid() {
    if (!this.markupConfigObj) return false;

    if (Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if (!this.markupConfigObj[0].markups) return false;

      let { sourced_markup } = this.markupConfigObj[0].markups;
      if (sourced_markup != null) {
        sourced_markup = +sourced_markup;
      }
      return Boolean(sourced_markup);
    }

    if (!this.markupConfigObj.markups) return false;

    let { sourced_markup } = this.markupConfigObj.markups;
    if (sourced_markup != null) {
      sourced_markup = +sourced_markup;
    }
    return Boolean(sourced_markup);
  }

  get isPayRolledValid() {
    if (!this.markupConfigObj) return false;

    if (Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if (!this.markupConfigObj[0].markups) return false;

      let { payrolled_markup } = this.markupConfigObj[0].markups;
      if (payrolled_markup != null) {
        payrolled_markup = +payrolled_markup;
      }
      return Boolean(payrolled_markup);
    }

    if (!this.markupConfigObj.markups) return false;

    let { payrolled_markup } = this.markupConfigObj.markups;
    if (payrolled_markup != null) {
      payrolled_markup = +payrolled_markup;
    }
    return Boolean(payrolled_markup);
  }

  resetWorkLoc(isResetFromJobManager?) {
    this.createOfferForm.patchValue({
      locations: null
    })
    if(isResetFromJobManager || !this.createOfferForm.get('jobManager')?.value ) {
      this.workLocations = this.workLocCopy;
    } else {
      if(this.jobManagerAssociatedWorkLoc?.length > 0) {
        this.workLocations = this.jobManagerAssociatedWorkLoc;
      } else {
        this.workLocations = this.workLocCopy;
      }
    }
  }

  getAssignmentConfig(){
    this.loaderService.show();
    this.candidateService.getAssignmentConfig(this.programId).subscribe({
      next:(data:any)=>{
        if(data){
          this.allowAssignmentOverlap = data?.config?.overlapping_assignments?.is_allow;
        }
        this.loaderService.hide();
      },
      error:(err)=>{
        this.showError(err);
        this.loaderService.hide();
      }
    })
  }

  checkOverlap(){
    if(this.allowAssignmentOverlap){
      this.onSubmit();
    }
    else{
      //Check overlapping assignments if setting is disabled
      this.isLoader=true;
      this.candidateService.getOverlappingAssignment(
        this.programId,
        this.candidateId,
        this.createOfferForm.get('startDate')?.value,
        this.createOfferForm.get('endDate')?.value
      ).then(
        (data:any)=>{
          if(data?.is_assignment_allow){
            this.onSubmit();
          }
          else{
            this.isLoader=false;
            this.showOverlapWarning = true;
            this.overlapAssignmentData = data?.details || [];
          }
        }
      )
    }

  }

}

export class releaseOfferPayload {
  start_date?: string;
  end_date?: string;
  rate_model?: string;
  rate_type?: any;
  rate_markup?: any;
  st_bill_rate?: any;
  st_pay_rate?: any;
  notes?: string;
  job_manager_id?: string;
  holiday_calendar_id?: string;
  timesheet_manager_id?: string;
  timesheet_type_id?: string;
  assignment_workflow: string;
  worker_email: string;
  custom_fields?: any;
  foundational_data?: any;
  rates?: any;
  candidate_sourcing_type?: any;
  ot_exempt:any;
  onboarding_checklist_id:any;
  taxes:any;
  adjustment_fee:any;
  review_notes?: string;
}

export const negetiveNotAllowed: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  if (typeof +ctrl.value === 'number' && +ctrl.value < 0) {
    ctrl.setValue(0);
  }
  return null;
};
