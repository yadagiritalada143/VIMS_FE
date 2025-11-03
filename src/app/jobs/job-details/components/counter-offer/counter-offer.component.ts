import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concat, forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { JobDetailsService } from '../../job-details.service';
import { CurrencyService } from 'src/app/shared/service/currency.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { AccuracyConfigEnum, UsersType } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobService } from 'src/app/jobs/job.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import * as _ from 'lodash';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'counter-offer',
  templateUrl: './counter-offer.component.html',
  styleUrls: ['./counter-offer.component.scss'],
})
export class CounterOfferComponent implements OnInit, OnChanges, OnDestroy {
  counterOfferForm: UntypedFormGroup;
  checkedMarkUp: boolean = false;
  checkedotPayRate: boolean = true;
  checkedotBillRate: boolean = true;
  checkeddtBillRate: boolean = true;
  checkeddtPayRate: boolean = true;
  jobManagerList$?: Observable<any> = of([]);
  @Input() candidateDetails?: any;
  timesheetmanagerList$?: Observable<any>;
  holidayCalenderList: any = [];
  jobmanagerSelected;
  timesheetManagerSelected;
  expenseManagerSelected;
  public workLocationSelected;
  timeSheetTypes: any = [{ id: 'DIDO', name: 'Day In Day Out' }];
  timesheetManagerTypeAhead$: Subject<any> = new Subject<any>();
  jobManagerTypeAhead$: Subject<any> = new Subject<any>();
  expenseManagerTypeAhead$:  Subject<any> = new Subject<any>();
  public workLocationTypeAhead$: Subject<any> = new Subject<any>();
  minLengthTerm: Number = 3;
  @Input() isopen: boolean = false;
  markupConfig = 0;
  rateConfig;
  currency = '';
  submitted: boolean = false;
  clientOverTimeRateFactor;
  clientDoubleTimeRateFactor;
  public ratefactorLoading: boolean = true;
  isVendorUser: boolean = false;
  rateModel: any = 'pay_rate';
  offerPayRate: any = 0;
  overTimePayRate: any = 0;
  doubleTimePayRate: any = 0;
  getRateMarkUpValue: any;
  vendorId: any;
  selectedSourceType: any;
  offerBillRate: any = 0;
  doubleTimeBillRate: any = 0;
  overTimeBillRate: any = 0;
  programId: any;
  minNum: any = 0;
  maxNum: any = 0;
  maxPayNum: any = 0;
  minPayNum: any = 0;
  optionsStartDate: any;
  optionsEndDate: any;
  optionsTenureDate: any;
  isDisabled: boolean = false;
  startDate;
  start;
  endDate;
  end;
  markupConfigOriginal = 0;
  clientOverTimeBillRateFactor;
  clientDoubleTimeBillRateFactor;
  jobDetailsData: any;
  clientOverTimePayRateFactor;
  clientDoubleTimePayRateFactor;
  submission_exceed_max_bill_rate;
  jobId;
  initialValues;
  @Input() candidateId: any;
  @Input() offerId: any;
  loadingJobmanager: boolean = true;
  loadingTimeSheetManager: boolean = true;
  loadingWorkLocation: boolean = true;
  holidayCalenderSelected;
  loadingholidayCalender: boolean = true;
  currentProgram;
  programRateModel: any;
  timesheetTypeSelected;
  loadingtimesheetType: boolean = true;
  timesheetTypeList: any = [];
  originalMarkUp;
  private subscriptions: Subscription[] = [];
  jobLoading: boolean = true;
  @Input() public offerDetails: any;
  public jobdetailsLoading: boolean = true;
  public getOfferDetailsLoading: boolean = true;
  public isLoader: boolean = false;
  public isCounterOffer: boolean = false;
  isCounterOfferReview: boolean = false;
  public today = new Date();
  private previous_OTPayRate;
  private previous_DTPayRate;
  private previous_OTBillRate;
  private previous_DTBillRate;
  public prefferedfDateFormate: string;
  tenureSpan: any;
  tenureSpanUnit: any;
  tenureMessage: any;
  public jobDetails;
  public isBillDriven = false;
  public programModel: string;
  public customCurrency = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency
    ? this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency
    : 'USD';
  isFoundationalFieldsValid: boolean = true;
  foundationalFieldsFormData: any = undefined;
  isCustomFieldsFormValid: boolean = true;
  customFieldsFormData: any = undefined;
  public userType = this.storageService.get('user_type');
  vendorUserReadonly: boolean = false;
  public assignment_workflow_selected;
  offerDetailStageData: any;
  public hierarchyId;
  logs: Log = undefined;
  showAccountCodeDetails = 'hidden';
  markupConfigObj: any;
  jobLaborCategory: any;
  jobHierarchy: any;
  jobWorkLocation: any;
  isOfferEndDateDisabled: boolean = false;
  workLocations;
  pageNo;
  workerStateName;
  stFlatAdustment;
  otRateFactors;
  user_type;
  vendorBillRate;
  clientBillRate;
  mspFee;
  rateModelObj = {
    BILL_RATE : 'billrate',
    MARKUP : 'markup',
    PAY_RATE : 'payrate'
  }
  isVendorNeutral: any;
  timesheetTypeValue: any;
  isfeesIncluded:boolean;
  amount_type;
  applicable_on;
  funded_by;
  disabledCounter: boolean = false;
  isPayroll: boolean = false;
  isSourced: boolean = false;
  isCandidateSourcingTypeChanged: boolean = false;
  isMarkupCalled: boolean = false;
  items = [{ value: 'Yes' }, { value: 'No' }];
  adjustment_type:any;
  adjustment_value:any;
  additional_amount:any;
  rateFactor: any[] = [];
  ratesConfiguration;
  multipleApprovers;
  remote_worker: boolean = false;
  candidateRemoteWorkerDetails:any;
  remote_worker_details;
  countryValidated: boolean = true;
  expenseManagerDropDownOpt: any[] = [];
  expenseManagerSearching = false;
  loadingExpenseManager:boolean;
  rate_factors_arr;
  isRatesFromJob;
  is_ot_exempt: any = false;
  jobRates;
  oTRates;
  noOTRateFactors;
  stRateFactor;
  hybridTimesheetSelected: boolean;
  taxData:any;
  adjustmentData:any;
  isTaxValid:boolean = false;
  rateFactorFomrula: Map<string, any> = new Map<string, any>();
  isShowTax: boolean = false;
  payloadRateFactors;
  stRateFactorInfo:any;
  rateDetailsVisible: boolean = false;
  costComponentEnabled: boolean = false;
  markupByRateTypeEnabled: boolean = false;
  copyPayloadFactors;
  overTimeExemptRateFactors;
  updatedConfigRates;
  updatedHybridFactors;
  hrybridTimesheetRateFactors;
  setRateFactorValues;
  offerRateFactors;
  timeSheetTypeValue;
  updatedMarkupRateFactors;
  newWorkflow: any;
  fee_details;
  fee_info;
  showOverlapWarning:boolean = false;
  allowAssignmentOverlap: boolean;
  remoteLocation;
  overlapAssignmentData = [];
  constructor(
    private fb: UntypedFormBuilder,
    private currencyService: CurrencyService,
    private jobdetailService: JobDetailsService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    private userPermissionService: UserPermissionService,
    private jobService: JobService,
    private candidateService: CandidateService,
    private accuracyPipe: AccuracyPipe,
    private authorizationService: AuthorizationService,
    private loaderService: LoaderService
  ) {
    this.createCounterForm();
  }

  ngOnInit(): void {
    this.isCounterOffer = this.storageService.get('CurrentProgram').config?.is_counter_offer;
    this.isCounterOfferReview = this.storageService.get('CurrentProgram')?.config?.offer?.counter_offer_review
    this.jobId = this.route.snapshot.params['id'] || this.route.parent?.snapshot.params['id'];
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isRatesFromJob = this.currentProgram?.config?.is_rate_factors_from_job;
    this.multipleApprovers = this.currentProgram?.config?.multiple_approval_timesheet_expense ;
    this.isVendorNeutral = this.currentProgram.config?.is_vendor_neutral;
    this.jobDetails = this.storageService.get('viewd_job');
    this.prefferedfDateFormate = this.currentProgram.defaultDateFormat?.toUpperCase();
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    //this.prefferedfDateFormate = this.prefferedfDateFormate ? this.prefferedfDateFormate : 'dd-mm-yy';
    this.programId = this.storageService.get('PROGRAM_ID');
    this.programRateModel = this.currentProgram?.config?.program_model;
    this.isOfferEndDateDisabled = this.currentProgram?.config?.offer?.disable_offer_end_date_edit;
    this.getJobdetails();
    this.loadingJobmanager = true;
    this.loadingTimeSheetManager = true;
    this.newWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui;
    this.subscriptions.push(
      this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_COUNTER_OFFER).subscribe(data => {
        if (!data['isopen']) {
          this.counterOfferForm.reset(this.initialValues);
          this.getOfferDetailsLoading = true;
        }
      }),
    );
    this.isShowTax = this.jobdetailService.showTaxInComponents(this.currentProgram?.config);
    if (this.programRateModel === 'PAY_RATE' && this.programRateModel === 'MARKUP') {
    }

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
        this.startDate = new Date(this.createOfferFormControls['startDate'].value);
        this.start = this.startDate.setDate(this.startDate.getDate() + 1);
        this.optionsEndDate = Object.assign(
          {},
          {
            language: 'English',
            enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
          },
        );
        if(this.createOfferFormControls['startDate'].value && this.createOfferFormControls['endDate'].value) {
          if(!this.checkDateMax()){
            this.getWorkingHoursEstimate();
          }
        }
      }),
    );

    this.subscriptions.push(
      this.createOfferFormControls?.endDate?.valueChanges.subscribe(val => {
        this.endDate = new Date(this.createOfferFormControls['endDate'].value);
        this.end = this.endDate.setDate(this.endDate.getDate() - 1);
        this.optionsStartDate = Object.assign(
          {},
          {
            language: 'English',
            enabledDateRanges: [{ end: this.end }],
          },
        );
        if(this.createOfferFormControls['startDate'].value && this.createOfferFormControls['endDate'].value) {
          if(!this.checkDateMax()){
            this.getWorkingHoursEstimate();
          }
        }
      }),
    );
    this.optionsTenureDate = {
      language: 'English',
      enabledDateRanges: [{ end: this.today?.setDate(this.today?.getDate()) }],
    };

    this.subscriptions.push(
      this.createOfferFormControls?.tenure_start?.valueChanges.subscribe(val => {
        this.getEndRange(new Date(val));
      }),
    );

    if (this.userType === 'VENDOR' || this.userType === 'SUPER_ORG') {
      this.vendorUserReadonly = true;
    }
    // if (!this.candidateDetails) {
    //   this.fetchCandidateDetails();
    // } else {
    //   //this.prefillPayBillrates(this.candidateDetails);
    // }
    this.getOfferDetails();
    this.getProgramDetails();
    const programDetail = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetail?.config?.program_model) {
      this.rateModel = programDetail?.config?.program_model;
    }
    this.getAssignmentConfig();
  }
  get hideRateAuthority() {
    return this.jobdetailService.rateAuthority();
  }

  get clientBillRateEnabled(){
    return this.jobdetailService.clientBillRateEnabled();
  }

  get showRemoteWorker(){
    return this.jobdetailService.remoteWorker();
  }

  get showPayRate(){
    if(this.programRateModel === 'BILL_RATE'){
      return false;
    }
    else{
      return true;
    }
  }

  changeRemoteWorker(remoteWorker:boolean){
    this.remote_worker = remoteWorker ? true : false;
  }

  onRemoteFormSubmitted(event){
    if(event){
      this.remoteLocation = event?.formValues; // Object with country,state object
      this.remote_worker_details = Object.fromEntries(
        Object.entries(this.remoteLocation).map((entry: any)=>[entry[0],(entry[1]?.name || null)])
      ); // Object with country,state name
      this.countryValidated = event?.countryValidated;
    }
  }

  remoteAPIErrors(event){
    if(event){
      this.showError(event);
    }
  }

  getValidatedForm(){
    this.countryValidated = (this.showRemoteWorker && this.remote_worker) ? this.countryValidated : true;
  }

  get billrateValidation(){
    if(this.clientBillRateEnabled){
      if(this.counterOfferForm.controls.billRatevalue?.errors || this.counterOfferForm.controls.billRatevalue.value == 0){
        return true;
      }
      else{
        return false;
      }
    }
    else{
      if(this.counterOfferForm.controls.vendorBillRateValue?.errors || this.counterOfferForm.controls.vendorBillRateValue.value == 0){
        return true;
      }
      else{
        return false;
      }
    }
  }
  fetchCandidateDetails() {
    this.jobdetailService.fetchCurrentSubmitCandidate(this.candidateId, this.jobId).subscribe((res: any) => {
        this.candidateDetails = res;
        this.markupByRateTypeEnabled = this.candidateDetails?.candidate?.markup_by_rate_type;
        this.costComponentEnabled = this.candidateDetails?.candidate?.is_cost_component;
        this.fee_info = this.candidateDetails?.candidate?.fee;
        let msp_fee = this.fee_info?.msp_fee;
        this.mspFee = msp_fee?.amount_value;
        this.amount_type = msp_fee?.amount_type;
        this.funded_by = msp_fee?.funded_by;
        this.fee_details = this.fee_info?.fee_details;
        this.vendorId = res?.candidate?.vendor_id;
        this.selectedSourceType = res?.candidate?.candidate_sourcing_type;
        this.getRateMarkUpValue = this.accuracyPipe.transform(res?.candidate?.rate_markup, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true });
        //this.getMarkup(this.vendorId, this.getRateMarkUpValue);
        this.isopen = true;
        this.prefillPayBillrates(this.candidateDetails);
        if(this.jobLaborCategory && this.jobHierarchy && this.jobWorkLocation && !this.isMarkupCalled && this.vendorId) {
          if(this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP'){
            this.getMarkup(this.vendorId, this.counterOfferForm.get('candidate_sourcing_type'), this.jobLaborCategory, this.jobHierarchy, this.jobWorkLocation);
          }
          }
      });
  }
  createCounterForm() {
    this.counterOfferForm = this.fb.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      jobManager: [''],
      locations:['', [Validators.required]],
      timesheetManager: ['', [Validators.required]],
      timesheetType: ['', [Validators.required]],
      holidayCalender: [''],
      rateType: ['HOURLY', [Validators.required]],
      minBillRate: ['', [Validators.required]],
      maxBillRate: ['', [Validators.required]],
      markUp: [this.checkedMarkUp],
      // markUpValue: [{ value: this.markupConfig }, [Validators.required, negetiveNotAllowed]],
      rateMarkUpValue: [''],
      candidatePayRate: [this.offerPayRate, [Validators.required]],
      tenure_start: ['', Validators.required],
      vendorBillRateValue: [this.offerBillRate, [Validators.required, negetiveNotAllowed]],
      billRatevalue:[0,[Validators.required]],
      DefaultRateValue:[],
      clientBillRate:[],
      vendorBillRate:[],
      notes: [],
      assignment_workflow: ['', [Validators.required]],
      rates: this.fb.array([]),
      worker_email: ['', []],
      candidate_sourcing_type: [null,Validators.required],
      allow_expense:[],
      adjustment_type: [],
      adjustment_value: [],
      additional_amount:[],
      budget_estimate: [],
      estimated_adjustment: [],
      single_net_budget: [],
      single_initial_budget:[],
      week_working_days : [],
      hours_per_day : [],
      remote_worker:[],
      expenseManager: ['', [Validators.required]],
      is_ot_exempt: [false],
      adjustmentData:[]
    });
    this.initialValues = this.counterOfferForm.getRawValue();

    this.counterOfferForm.controls.candidatePayRate.valueChanges
    .pipe(
      tap(() => this.disabledCounter = true),
      debounceTime(2000),
      distinctUntilChanged(),
      )
    .subscribe((value:number) => {
      if(this.counterOfferForm.controls.candidatePayRate.dirty && this.programRateModel === 'PAY_RATE') {
        if (!this.hideRateAuthority) {
          if (value > this.maxPayNum && !this.submission_exceed_max_bill_rate) {
            this.counterOfferForm.controls.candidatePayRate.setErrors({
              max: `Maximum number can be ${this.maxPayNum}`,
            });
            return;
          } else if (value < this.minPayNum) {
            this.counterOfferForm.controls.candidatePayRate.setErrors({
              min: `Minimum number can be ${this.minPayNum}`,
            });
            return;
          }
          else if (value <= 0) {
            this.counterOfferForm.controls.candidatePayRate.setErrors({
              min: `Candidate Pay Rate can not be zero or empty`,
            });
            return;
          } else {
            this.counterOfferForm.controls.candidatePayRate.setErrors(null);
          }
      }
        this.calculateRates('payrate');
      }
    });


    this.counterOfferForm.controls.billRatevalue.valueChanges
    .pipe(
      tap(() => this.disabledCounter = true),
      debounceTime(2000),
      distinctUntilChanged(),)
    .subscribe((val:number) => {
      if(this.counterOfferForm.controls.billRatevalue.dirty && (this.programRateModel === 'MARKUP' || this.programRateModel === 'BILL_RATE')) {
        if(!this.hideRateAuthority){
          if (val > +this.maxNum && !this.submission_exceed_max_bill_rate ) {
            this.counterOfferForm.controls.billRatevalue.setErrors({
              max: `Maximum number can be ${this.maxNum}`,
            });
            return;
          } else if (val < +this.minNum) {
            this.counterOfferForm.controls.billRatevalue.setErrors({
              min: `Minimum number can be ${this.minNum}`,
            });
            return;
          }
          else if (val <= 0) {
            this.counterOfferForm.controls.billRatevalue.setErrors({
              min: `Vendor Bill Rate can not be zero or empty`,
            });
            return;
          }
          else {
            this.counterOfferForm.controls.billRatevalue.setErrors(null);
          }
        }
        this.calculateRates('billrate');
      }
    });

    this.counterOfferForm.controls.vendorBillRateValue.valueChanges
    .pipe(
      tap(() => this.disabledCounter = true),
      debounceTime(2000),
      distinctUntilChanged(),)
    .subscribe((val:number) => {
      if(this.counterOfferForm.controls.vendorBillRateValue.dirty) {
        if(!this.hideRateAuthority){
          if (val > +this.maxNum && !this.submission_exceed_max_bill_rate ) {
            this.counterOfferForm.controls.vendorBillRateValue.setErrors({
              max: `Maximum number can be ${this.maxNum}`,
            });
            return;
          } else if (val < +this.minNum) {
            this.counterOfferForm.controls.vendorBillRateValue.setErrors({
              min: `Minimum number can be ${this.minNum}`,
            });
            return;
          }
          else if (val <= 0) {
            this.counterOfferForm.controls.vendorBillRateValue.setErrors({
              min: `Vendor Bill Rate can not be zero or empty`,
            });
            return;
          }
          else {
            this.counterOfferForm.controls.vendorBillRateValue.setErrors(null);
          }
        }
        this.calculateRates('vendor_rate');
      }
    });

    this.counterOfferForm.controls.rateMarkUpValue.valueChanges
    .pipe(
      tap(() => this.disabledCounter = true),
      debounceTime(2000),
      distinctUntilChanged(),
      )
    .subscribe((val: number) => {
      this.counterOfferForm.patchValue({
        rateMarkUpValue : this.accuracyPipe.transform(val, AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true})
      },{emitEvent:false})
      if(this.counterOfferForm.controls.rateMarkUpValue.dirty || this.isCandidateSourcingTypeChanged) {
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
        } else if (val <= 0 || val == 0) {
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
  }

  updateMarkupValues(arr, markupValue) {
    return arr?.map((x) => {
      if (!x?.markup) {
        x.markup = markupValue;
      }
      return x;
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
      return matchingInfo ? { ...item, markup: matchingInfo.markup } : item;
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

  changeOtExempt(otExempt: boolean) {
    this.is_ot_exempt = otExempt;
    let bill_rate_formula;
    let pay_rate_formula;
    let mainPayRate =  +this.counterOfferForm.get('candidatePayRate')?.value;
    let mainBillRate = +this.counterOfferForm.get('billRatevalue')?.value;
    const rateMarkupValue = this.counterOfferForm?.get('rateMarkUpValue')?.value || null;
    if(this.is_ot_exempt){
      this.otRateFactors?.forEach(element => {
        const formula = new Map<string, string>();
        bill_rate_formula =  element?.bill_rate;
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
        let stCostComponentValue = this.counterOfferForm?.get('costComponent')?.value || {};
        stCostComponentValue = this.removeMakupCostCComponentGroupId(stCostComponentValue);
        copyFactors.forEach(element => {element.cost_component = (stCostComponentValue || null)});
      }
      this.payloadRateFactors = copyFactors;
      this.rate_factors_arr = copyFactors;
      this.overTimeExemptRateFactors = copyFactors;
    }
    else{
     //config Rates
     let configRates = this.isRatesFromJob ? this.jobRates : this.setRateFactorValues;
     configRates = this.jobdetailService?.getRateFactorInfoForPayload(configRates, this.ratesConfiguration, this.hybridTimesheetSelected);
     this.updatedConfigRates = this.getMarkupValuesForBasicRates(configRates, this.offerDetailStageData?.rate_factors_info);
     //hybrid Rates
     let hybridFactors = this.jobdetailService?.getRateFactorInfoForPayload(this.hrybridTimesheetRateFactors, this.ratesConfiguration, this.hybridTimesheetSelected);
     this.updatedHybridFactors = this.getMarkupValuesForBasicRates(hybridFactors, this.offerDetailStageData?.rate_factors_info);

     if(this.costComponentEnabled){
      this.updatedConfigRates = this.getCostComponentValuesForBasicRates(configRates,this.offerDetailStageData?.rate_factors_info);

      let costComponentValue = this.offerDetailStageData?.rate_factors_info?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component;
      this.updatedHybridFactors = this.updateCostComponentValues(hybridFactors, costComponentValue);
    }

      this.noOTRateFactors?.forEach(element => {
        const formula = new Map<string, string>();
        formula.set('bill_rate', this.getFormula(element?.bill_rate));
        formula.set('pay_rate', this.getFormula(element?.pay_rate));
        this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
      });

      let newRates = this.hybridTimesheetSelected ? this.updatedHybridFactors :
      this.offerDetailStageData?.ot_exempt ? this.updatedConfigRates : this.offerRateFactors;
      let factors =  newRates;
      this.showRateFormulas(factors?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
      this.payloadRateFactors =  this.rate_factors_arr = factors ? [...factors] : [];
      if(this.isRatesUpdated){
        let stMarkup = this.updatedMarkupRateFactors?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.markup;
        this.payloadRateFactors = this.updateStandardMarkup(this.payloadRateFactors, 'st', stMarkup);
        this.rate_factors_arr = this.updateStandardMarkup(this.rate_factors_arr, 'st', stMarkup);
        this.showRateFormulas(this.payloadRateFactors?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
        let stConstComponent;
        if(this.costComponentEnabled){
          stConstComponent = this.updatedMarkupRateFactors?.find(rate => rate?.abbreviation?.toLowerCase() === 'st')?.cost_component;
          this.payloadRateFactors = this.updateStandardCostComponent(this.payloadRateFactors, 'st', stConstComponent);
          this.rate_factors_arr = this.updateStandardCostComponent(this.payloadRateFactors, 'st', stConstComponent);
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

  updateCostComponentValues(arr, costComponentValue){
    return arr?.map((x) => {
      if (!x?.cost_component) {
        x.cost_component = costComponentValue;
      }
      return x;
    });
  }

  updateOTFactors(ratesArray) {
    ratesArray?.forEach(element => {
      if (element?.abbreviation.toLowerCase() !== 'st') {
        element.bill_rate = this.removeDuplicates(element.bill_rate, 'bill_rate');
        element.pay_rate = this.removeDuplicates(element.pay_rate, 'pay_rate');
        [...element?.bill_rate, ...element?.pay_rate].forEach((rate) => {
          rate.factor = this.accuracyPipe?.transform("1", AccuracyConfigEnum.RATE, { isEdit: true });
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

  getRateFactor(jobData, offerData?) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(jobData){
      let url = `/configurator/programs/${this.currentProgram?.id}/rate-factors?is_enabled=True&hierarchy=${jobData?.hierarchy[0]?.id}`;
      this.jobdetailService.get(url).subscribe({
        next: (res: any) => {
        this.disabledCounter = false;
        let { rate_factors } = res;
        this.stRateFactor = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
        this.rateFactor = rate_factors;
        this.ratesConfiguration = rate_factors;
        let ratesfromConfig = rate_factors;
        this.setRateFactorValues = [...rate_factors];
        if (this.isRatesFromJob && jobData && !this.hybridTimesheetSelected) {
          rate_factors = this.jobRates;
          let stRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
          this.stRateFactor = stRate ? stRate : this.stRateFactor;
        }
        if (this.hybridTimesheetSelected) {
          this.rateFactor = rate_factors;
          let stRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
          this.stRateFactor = stRate ? stRate : this.stRateFactor;
        }
        if (rate_factors) {
          this.rateFactor = rate_factors;
          this.otRateFactors = JSON.parse(JSON.stringify(rate_factors));
          this.noOTRateFactors = [...rate_factors];
          rate_factors = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() !== 'st');
        }

        if(this.rateFactor.length === 0 || this.rateFactor?.find(x => x.abbreviation != 'ST')){
          this.stFlatAdustment = ratesfromConfig.find(element => element.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
        }
        else{
          this.stFlatAdustment = ratesfromConfig.find(element => element.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
        }

      },
        error: (err) => {
          this.showError(err?.error?.message || err?.error?.error?.errors[0]?.message);
          this.disabledCounter = true;
        }
      });
    }
    if(offerData && jobData){
      if(offerData?.is_hybrid){
        this.fetchTimeSheetRateTypes(offerData?.timesheet_type?.value, jobData);
      }
      this.showRateFormulas(offerData?.rate_factors_info?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
      this.rate_factors_arr = offerData?.rate_factors_info;
    }
  }

  showRateFormulas(rates:any = []){
    rates = Array.isArray(rates) ? rates : Object.values(rates);
      rates?.forEach(element => {
        const formula = new Map<string, string>();
        formula.set(
          'bill_rate',
          this.getFormula(
            element?.bill_rate
          ),
        );
        formula.set(
          'pay_rate',
          this.getFormula(
            element?.pay_rate
          ),
        );
        this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
      });
  }

  get createOfferFormControls() {
    return this.counterOfferForm.controls;
  }

  get fetchInitialJobmanagerList() {
    return this.jobdetailService.getJobManagers().pipe(
      tap((res: any) => {
        this.loadingJobmanager = true;
        this.jobmanagerSelected = this.createOfferFormControls['jobManager'].value;
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
        this.loadingJobmanager = false;
      }),
    );
  }

  jobMangerDropDownOpt: any[] = [];
  fetchJobManagers() {
    concat(
      this.jobdetailService.getJobManagers().pipe(
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
                fullname_derived: `${y.first_name} ${y.last_name}`,
              };
            }),
          };
        }),
        tap(() => {
          this.loadingJobmanager = false;
        }),
      ), // default items
      this.jobManagerTypeAhead$.pipe(
        filter(res => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingJobmanager = true;
        }),
        switchMap(term => {
          return this.jobdetailService.getJobManagers(term).pipe(
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
                    fullname_derived: `${y.first_name} ${y.last_name}`,
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
      const hasManagerInList = this.jobMangerDropDownOpt?.some(mem => mem?.id === this.jobDetailsData?.job_manager_id);
      if (!hasManagerInList) {
        this.jobMangerDropDownOpt.push({
          ...this.jobDetailsData?.job_manager,
          fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.jobDetailsData?.job_manager?.last_name}`,
        });
        this.jobMangerDropDownOpt = [...this.jobMangerDropDownOpt];
      }
    });
  }

  timeSheetManagerDropDownOpt: any[] = [];
  fetchTimesheetManagers() {
    this.loadingTimeSheetManager = true;
    concat(
      this.jobdetailService.getJobManagers().pipe(
        tap((res: any) => {
          this.loadingTimeSheetManager = true;
            this.timesheetManagerSelected = this.createOfferFormControls['timesheetManager'].value;
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
    ).subscribe(res => {
      const { members } = res;
      this.timeSheetManagerDropDownOpt = members;
      const hasManagerInList = this.timeSheetManagerDropDownOpt.some(mem => mem?.id === this.jobDetailsData?.job_manager_id);
      if (!hasManagerInList) {
        this.timeSheetManagerDropDownOpt.push({
          ...this.jobDetailsData?.job_manager,
          fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.jobDetailsData?.job_manager?.last_name}`,
        });
        this.timeSheetManagerDropDownOpt = [...this.timeSheetManagerDropDownOpt];
      }
      if (this.offerId) {
        let timesheetManagers = this.offerDetailStageData?.timesheet_manager || [];
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
  }


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
            members: [...res.members].map((y) => {
              return {
                ...y,
                fullname_derived: `${y.first_name} ${y.last_name}`,
              };
            }),
          };
        }),
        tap(() => {
          this.loadingExpenseManager = false;
        })
      ), // default items
      this.expenseManagerTypeAhead$.pipe(
        filter((res) => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingExpenseManager = true;
          this.expenseManagerDropDownOpt = [];
          this.expenseManagerSearching = true;
        }),
        switchMap((term) => {
          return this.jobdetailService.getJobManagers(term).pipe(
            catchError(() => of([])), // empty list on error
            map((res: any) => {
              return {
                ...res,
                members: [...res.members].map((y) => {
                  return {
                    ...y,
                    fullname_derived: `${y.first_name} ${y.last_name}`,
                  };
                }),
              };
            })
          );
        }),
        tap(() => {
          this.loadingExpenseManager = false;
        })
      )
    ).subscribe((res: any) => {
      const { members } = res;
      this.expenseManagerDropDownOpt = members;
      const hasManagerInList = this.expenseManagerDropDownOpt.some(mem => mem?.id === this.jobDetailsData?.job_manager_id)
      if (!hasManagerInList && !this.expenseManagerSearching) {
        this.expenseManagerDropDownOpt.push({
          ...this.jobDetailsData?.job_manager,
          fullname_derived: `${this.jobDetailsData?.job_manager?.first_name} ${this.jobDetailsData?.job_manager?.last_name}`
        });
        this.expenseManagerDropDownOpt = [...this.expenseManagerDropDownOpt]
      }

      if (this.offerId) {
        let expenseManagers = this.offerDetailStageData?.expense_managers || [];
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
        this.expenseManagerDropDownOpt = [...this.expenseManagerDropDownOpt]
      }

    })
    this.expenseManagerSearching = false;
  }

  workLocationSearching = false;
  getWorkLocations(term, reset = false) {
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
        tap((res) => {
          this.loadingWorkLocation = true;
          if (!this.offerId) {
            this.workLocationSelected = this.createOfferFormControls[
              'locations'
            ].value;
          }
        }),
        map((res: any) => {
          return {
            ...res,
            work_locations: [...res.work_locations].map((y) => {
              return {
                ...y,
                fullname_derived: `${y?.name} - ${y?.code}`
              };
            }),
          };
        }),
        tap(() => {
          this.loadingWorkLocation = false;
        })
      ), // default items
      this.workLocationTypeAhead$.pipe(
        filter((res) => {
          return res !== null; //&& res.length >= this.minLengthTerm;
        }),
        distinctUntilChanged(),
        debounceTime(400),
        tap(() => {
          this.loadingWorkLocation = true;
          this.workLocations = [];
          this.workLocationSearching = true;
        }),
        switchMap((term) => {
          return this.jobService.get(url).pipe(
            catchError(() => of([])), // empty list on error
            map((res: any) => {
              return {
                ...res,
                work_locations: [...res.work_locations].map((y) => {
                  return {
                    ...y,
                    fullname_derived: `${y?.name} - ${y?.code}`
                  };
                }),
              };
            })
          );
        }),
        tap(() => {
          this.loadingWorkLocation = false;
        })
      )
    ).subscribe((res: any) => {
      const { work_locations } = res;
      this.workLocations = work_locations;
      const hasManagerInList = this.workLocations.some(mem => mem?.id === this.jobDetailsData?.location?.id);
      if (!hasManagerInList && !this.workLocationSearching) {
        this.workLocations.push({
          ...this.jobDetailsData?.location,
          fullname_derived: `${this.jobDetailsData?.location?.name} - ${this.jobDetailsData?.location?.code}`
        });
        this.workLocations = [...this.workLocations]
      }
      if (this.offerId) {
        this.workLocations.push({
          ...this.offerDetailStageData?.offer_work_location,
          fullname_derived: `${this.offerDetailStageData?.offer_work_location?.work_location?.name} - ${this.offerDetailStageData?.offer_work_location?.work_location?.code}`
        });
        this.workLocations = [...this.workLocations]
      }
    })
    this.workLocationSearching = false;
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


  payRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('pay_rate') && !formControl?.get('vendor_bill_rate')) {
      return null;
    }
    if (Number(formControl?.get('pay_rate')?.value) > Number(formControl?.get('vendor_bill_rate')?.value)) {
      return { gtr: 'Pay rate can not be greater than  Vendor bill rate' }
    }
    return null;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.jobId = this.route.snapshot.params['id'] || this.route.parent.snapshot.params['id'];
    let isCounterOfferSectionOpen = changes['isopen'];
    if (!!isCounterOfferSectionOpen && isCounterOfferSectionOpen['currentValue']) {
      this.getJobdetails();
      this.getOfferDetails();
      this.fetchTimesheetManagers();
      this.fetchExpenseManagers();
      //this.getHolidayCalenderList();
    }
    if (!!changes['candidateDetails']) {
      this.ratefactorLoading = true;
    }
    //this.getRateFactor();
  }
  getProgramDetails() {
    let url = `/configurator/programs/${this.currentProgram?.id}`;

    this.jobdetailService.get(url).subscribe({
      next: (data: any) => {
        if (data && data?.program) {
          let programDetails = data.program;
          this.isBillDriven = programDetails?.config?.billing?.consolidated_billing;
        }
      },
     error: (error) => {
        // this.alert.error(errorHandler(error), {});
        this.showError(error);
      },
  });
  }

  prefillPayBillrates(candidateDetails) {
    // TODO Currency is not handled properly
    let cdetails = candidateDetails || { candidate: {} };
    let ratesInfo = cdetails['candidate'] || {};
    this.originalMarkUp = +(ratesInfo['rate_markup']);
    this.counterOfferForm.updateValueAndValidity();
    this.getRateInformation();
  }

  fetchTimesheetTypes(jobDetail?,locationId?) {
    if (jobDetail) {
      this.loadingtimesheetType = true;
      this.jobdetailService
        .getTimeSheetTypes(this.currentProgram?.id,jobDetail?.hierarchy[0]?.id,locationId,jobDetail?.rate_type) //"ada7774f-6cb2-445a-94c0-28f49c3d41a2"
        .subscribe((response: any) => {
          this.loadingtimesheetType = false;
          this.timesheetTypeList = response?.data?.config;
        });
    }
  }
  fetchTimeSheetRateTypes(value, jobDetail?) {
    this.jobdetailService.getTimeSheetRates(this.currentProgram?.id, value, jobDetail?.hierarchy[0]?.id).subscribe((response: any) => {
      let rate_factors = response?.data?.rate_factors;
      let timesheetRates = JSON.parse(JSON.stringify(rate_factors))
      this.hrybridTimesheetRateFactors = timesheetRates;
    });
  }
  setOfferDetails() {
    let offerDetails = this.offerDetails['offer'] || {};
    let offerDetailsStage = offerDetails['stages'][0] || [];
    this.payloadRateFactors = offerDetailsStage?.rate_factors_info;
    this.rate_factors_arr = offerDetailsStage?.rate_factors_info;
    this.showRateFormulas(offerDetailsStage?.rate_factors_info?.filter(rate => rate.abbreviation.toLowerCase() !== 'st'));
    this.offerRateFactors = JSON.parse(JSON.stringify(this.payloadRateFactors));;
    this.copyPayloadFactors = JSON.parse(JSON.stringify(this.payloadRateFactors));
    this.hybridTimesheetSelected = offerDetailsStage?.is_hybrid;
    this.getRateFactor(this.jobDetailsData, offerDetailsStage);
    this.is_ot_exempt = offerDetailsStage?.ot_exempt;
    this.taxData = offerDetails?.taxes || [];
    this.adjustmentData = offerDetails?.adjustment_fee;
    this.offerDetailStageData = offerDetailsStage;
    this.jobmanagerSelected = !!offerDetailsStage['job_manager'] ? offerDetailsStage['job_manager']['id'] : '';
    let timesheetManagers = !!offerDetailsStage['timesheet_manager'] ? offerDetailsStage['timesheet_manager'] : [];
    let timesheetIds = timesheetManagers.map( (item) => item.id);
    let expenseManagers = !!offerDetailsStage['expense_managers'] ? offerDetailsStage['expense_managers'] : [];
    let expenseIds = expenseManagers.map( (item) => item.id);
    if(expenseManagers.length === 0){
      this.counterOfferForm.get('expenseManager').clearValidators();
      this.counterOfferForm.get('expenseManager').updateValueAndValidity();
    }
    this.timesheetManagerSelected = this.multipleApprovers ? timesheetIds : timesheetIds[0];
    this.expenseManagerSelected = this.multipleApprovers ? expenseIds : expenseIds[0];
    this.holidayCalenderSelected = offerDetailsStage['holiday_calendar_id'];
    this.workLocationSelected = !!offerDetailsStage['offer_work_location']
    ? offerDetailsStage?.offer_work_location['work_location']?.['id']
    : '';
    this.timesheetTypeSelected = !!offerDetailsStage['timesheet_type']  ? offerDetailsStage?.timesheet_type?.id : null,
    this.timesheetTypeValue = offerDetailsStage?.timesheet_type?.value;
      this.counterOfferForm.patchValue({
        jobManager: this.jobmanagerSelected,
        timesheetManager: this.timesheetManagerSelected,
        expenseManager: this.expenseManagerSelected,
        locations: this.workLocationSelected,
        holidayCalender: this.holidayCalenderSelected, //'190aa402-e82d-4d0f-8514-61f16dffa873',
        timesheetType: this.timesheetTypeSelected,
        adjustmentData: this.adjustmentData
      });

    this.counterOfferForm.updateValueAndValidity();
  }
  getOfferDetails() {
    this.getOfferDetailsLoading = true;
    this.subscriptions.push(
      this.jobdetailService.getOfferDetails(this.jobId, this.candidateId, this.offerId).subscribe(res => {
        this.getOfferDetailsLoading = false;
        this.offerDetails = res;
        if (this.offerDetails?.offer?.foundational_data && this.offerDetails?.offer?.foundational_data?.length > 0) {
          this.offerDetails.offer.foundational_data = this.jobService.setFoundationFields(this.offerDetails?.offer?.foundational_data);
        }
        let offerDetails = res['offer'] || {};
        this.isfeesIncluded = offerDetails?.is_fees_included;
        this.taxData = offerDetails?.taxes || [];
        this.adjustmentData = offerDetails?.adjustment_fee;
        let offerDetailsStage = offerDetails['stages'][0] || [];
        this.offerDetailStageData = offerDetailsStage;
        this.payloadRateFactors = offerDetailsStage?.rate_factors_info;
        this.rate_factors_arr = offerDetailsStage?.rate_factors_info;
        this.copyPayloadFactors = JSON.parse(JSON.stringify(this.payloadRateFactors));
        this.hybridTimesheetSelected = offerDetailsStage?.is_hybrid;
        this.getRateFactor(this.jobDetailsData, offerDetailsStage);
        this.is_ot_exempt = offerDetailsStage?.ot_exempt;
        this.originalMarkUp = offerDetailsStage['rate_markup'];
        let start_date: any = this.datePipe.transform(offerDetailsStage['start_date'],'','','',true);
        let end_date: any = this.datePipe.transform(offerDetailsStage['end_date'],'','','',true);
        let tenure_date: any = this.datePipe.transform(
          offerDetailsStage['tenure_date'],'','','',true);

        this.rateModel = 'rate_model' in offerDetails && !!offerDetails['rate_model'] ? offerDetails.rate_model : 'pay_rate';

        this.jobmanagerSelected = !!offerDetailsStage['job_manager'] ? offerDetailsStage['job_manager']['id'] : '';
        let timesheetManagers = !!offerDetailsStage['timesheet_manager'] ? offerDetailsStage['timesheet_manager'] : [];
        let timesheetIds = timesheetManagers.map( (item) => item.id);
        this.timesheetManagerSelected = this.multipleApprovers ? timesheetIds : timesheetIds[0];
        let expenseManagers = !!offerDetailsStage['expense_managers'] ? offerDetailsStage['expense_managers'] : [];
        let expenseIds = expenseManagers.map( (item) => item.id);
        this.expenseManagerSelected = this.multipleApprovers ? expenseIds : expenseIds[0];
        if(expenseManagers.length === 0){
          this.counterOfferForm.get('expenseManager').clearValidators();
          this.counterOfferForm.get('expenseManager').updateValueAndValidity();
        }
        this.workLocationSelected = !!offerDetailsStage['offer_work_location']
        ? offerDetailsStage?.offer_work_location['work_location']?.['id']
        : '';
        this.holidayCalenderSelected = offerDetailsStage['holiday_calendar_id'];
        this.timesheetTypeList = [offerDetailsStage?.timesheet_type];
        this.timesheetTypeSelected = !!offerDetailsStage['timesheet_type']  ? offerDetailsStage?.timesheet_type?.id : '';
        this.loadingtimesheetType = false;
        // this.fetchTimesheetTypes(this.jobDetailsData,this.workLocationSelected);
        this.markupByRateTypeEnabled = offerDetailsStage?.markup_by_rate_type;
        this.costComponentEnabled = offerDetails?.is_cost_component;
        if(this.isEmptyObject(offerDetailsStage?.rate_markup_info)){
          this.adjustment_value = this.jobDetailsData?.adjustment_value ?? 0;
          this.adjustment_type = this.jobDetailsData?.adjustment_type ? this.jobDetailsData?.adjustment_type : 'fixed' ;
          this.additional_amount = this.jobDetailsData?.adjustment_type ? this.jobDetailsData?.additional_amount : 0;
          this.counterOfferForm.patchValue({
            adjustment_type: this.adjustment_type,
            adjustment_value: this.adjustment_value,
            additional_amount: this.additional_amount,
          })
        }
        else{
          this.counterOfferForm.patchValue({
            adjustment_type: offerDetailsStage?.rate_markup_info?.adjustment_type ?? 0,
            adjustment_value: offerDetailsStage?.rate_markup_info?.adjustment_value ?? 'fixed',
            additional_amount: offerDetailsStage?.rate_markup_info?.additional_amount ?? 0,
          })
        }
        this.counterOfferForm.patchValue({
            startDate: start_date === '' ? '' : start_date,
            endDate: end_date === '' ? '' : end_date,
            tenure_start: tenure_date === '' ? '' : tenure_date,
            notes: offerDetailsStage['notes'],
            //markUpValue: +offerDetailsStage['rate_markup'],
            rateType: offerDetails['rate_type'],
            assignment_workflow: offerDetails['assignment_workflow'],
            worker_email: offerDetails['worker_email'],
            timesheetType: this.timesheetTypeSelected,
            allow_expense: offerDetailsStage['is_expense_allowed'] ? 'Yes' : 'No',
            remote_worker : offerDetails?.remote_worker,
            adjustmentData: this.adjustmentData
          });
          this.remote_worker = offerDetails?.remote_worker;
          if(this.remote_worker){
            this.candidateRemoteWorkerDetails = offerDetails?.remote_worker_details;
          }
          else{
            let candidatePrimaryAddress = this.candidateDetails?.candidate?.addresses?.find(x => x.type.toLowerCase() === 'primary');
            this.candidateRemoteWorkerDetails = candidatePrimaryAddress;
          }
          if(!this.isMarkupCalled) {
            this.counterOfferForm.patchValue({
              candidate_sourcing_type: offerDetailsStage?.candidate_sourcing_type,
              rateMarkUpValue: this.accuracyPipe.transform(this.originalMarkUp, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
            })
          }
        this.fetchCandidateDetails();
        this.previous_OTPayRate = +offerDetailsStage['ot_pay_rate'];
        this.previous_DTPayRate = +offerDetailsStage['dt_pay_rate'];
        this.previous_OTBillRate = +offerDetailsStage['ot_bill_rate'];
        this.previous_DTBillRate = +offerDetailsStage['dt_bill_rate'];
        this.assignment_workflow_selected = offerDetails['assignment_workflow'];

        this.ratesArray?.clear();
        //offerDetailsStage = offerDetailsStage?.rates?.sort((a,b) => (a.rate_factor > b.rate_factor) ? 1 : ((b.rate_factor > a.rate_factor) ? -1 : 0));

        let reArrangeRates = this.jobdetailService.rearrangeRates(offerDetailsStage?.rates);
        let sortingByBillable = reArrangeRates.sort((a, b) => (a.billable === b.billable) ? 0 : (a.billable ? -1 : 1));

        sortingByBillable?.forEach(element => {

          if (element?.rate_factor !== 'ST') {
            const rateForm = this.fb.group({
              rate_factor: [element?.rate_factor],
              abbreviation: [element?.abbreviation?.toUpperCase()],
              id:element?.id,
              name: [element.name],
              billable: element?.billable,
              applicable: element?.applicable,
              bill_rate: [{ value: element.bill_rate, disabled: true }, Validators.required],
              pay_rate: [{ value: element.pay_rate, disabled: true }, Validators.required],
              markup: [element?.markup],
              enable_bill_rate_edit: false,
              enable_pay_rate_edit: false,
              vendor_bill_rate: [{ value: element.vendor_bill_rate, disabled: true}, Validators.required],
              client_bill_rate: element.bill_rate,
              default: element?.default,
              rate_factor_ts_type: element?.rate_factor_ts_type
            },{
              validators: [this.payRateValidator]
            });
            let formArray = this.counterOfferForm.get('rates') as UntypedFormArray;
            formArray.push(rateForm);
          }
          if (element?.rate_factor == 'ST') {
            this.counterOfferForm.patchValue({
              candidatePayRate: this.accuracyPipe.transform(element.pay_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
              billRatevalue: this.accuracyPipe.transform(element?.bill_rate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              vendorBillRateValue: this.accuracyPipe.transform(element?.vendor_bill_rate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              clientBillRate: this.accuracyPipe.transform(element?.bill_rate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              DefaultRateValue: element?.default
            });
            this.stRateFactor = element;
          }
        });

        if(this.costComponentEnabled){
          let stRateCostComponent = sortingByBillable?.find(rate=> rate?.abbreviation.toLocaleLowerCase() === 'st');
          this.counterOfferForm.addControl('costComponent', this.createFormGroupForCostComponents(stRateCostComponent?.cost_component));
          for (const rate of this.ratesArray.controls) {
            const rateGrp = rate as UntypedFormGroup;
            const rateObj = rateGrp.getRawValue();
            let rateCostComponent = sortingByBillable?.find(rate => rate.abbreviation.toLocaleLowerCase() === rateObj.abbreviation?.toLocaleLowerCase())?.cost_component;
            rateGrp.addControl('cost_component', this.createFormGroupForCostComponents(rateCostComponent));
          }
        }

        this.counterOfferForm.updateValueAndValidity();

        this.startDate = !!this.createOfferFormControls['startDate'].value ? new Date(this.createOfferFormControls['startDate'].value) : '';
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
        this.getHolidayCalenderList();
        this.setOfferDetails();
        if(this.is_ot_exempt){
          let bill_rate_formula;
          let pay_rate_formula
          this.otRateFactors?.forEach(element => {
            const formula = new Map<string, string>();
            bill_rate_formula = element?.bill_rate;
            pay_rate_formula = element?.pay_rate;
            let billRate = (bill_rate_formula?.length > 1) ? [bill_rate_formula?.find(x => x.rate_type.toUpperCase() == 'BILL_RATE')] : bill_rate_formula;
            let payRate = (pay_rate_formula?.length > 1) ? [pay_rate_formula?.find(x => x.rate_type.toUpperCase() == 'PAY_RATE')] : pay_rate_formula;
            formula.set('bill_rate', this.getFormula([billRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]));
            formula.set('pay_rate',  this.getFormula([payRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]));
            this.rateFactorFomrula.set(element?.abbreviation?.toLowerCase(), formula);
          });
        }

      }),
    );
  }

  createFormGroupForCostComponents(value) {
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

  jobCurrency = 'USD';
  getJobdetails() {
    this.jobdetailsLoading = true;
    this.subscriptions.push(
      this.jobdetailService.loadJob(this.jobId).subscribe({
        next: (res: any) => {
        this.jobdetailsLoading = false;
        this.disabledCounter = false;
        let jobdetails = res['job'] || { job_manager: {} };

        this.jobDetailsData = JSON.parse(JSON.stringify(jobdetails));
        this.jobRates = JSON.parse(JSON.stringify(this.jobDetailsData?.rates));
        this.oTRates = JSON.parse(JSON.stringify(this.jobDetailsData?.rates));

        if(this.jobDetailsData){
          this.getRateFactor(this.jobDetailsData);
        }
        this.jobDetailsData = jobdetails;
        this.jobRates = JSON.parse(JSON.stringify(jobdetails?.rates));
        //this.getRateFactor(this.jobDetailsData);
        this.counterOfferForm?.patchValue({
          week_working_days : this.jobDetailsData?.day_per_week,
          hours_per_day : this.jobDetailsData?.estimated_hours
        })
        this.getWorkingHoursEstimate(this.jobDetailsData?.day_per_week,this.jobDetailsData?.estimated_hours)
        this.jobLaborCategory = this.jobDetailsData?.program_industry[0]?.id;
        this.jobHierarchy = this.jobDetailsData?.hierarchy[0]?.id;
        this.jobWorkLocation = this.jobDetailsData?.location?.id;
        if(this.jobLaborCategory && this.jobHierarchy && this.jobWorkLocation && !this.isMarkupCalled && this.vendorId) {
          if(this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP'){
            this.getMarkup(this.vendorId, this.counterOfferForm.get('candidate_sourcing_type'), this.jobLaborCategory, this.jobHierarchy, this.jobWorkLocation);
          }
          }

        this.getWorkLocations(null, true);
        this.programRateModel = this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy
          ? this.jobDetailsData?.rate_model
          : this.currentProgram?.config?.program_model;
        if(this.programRateModel == "BILL_RATE") {
          this.counterOfferForm.get('candidate_sourcing_type').clearValidators();
          this.counterOfferForm.get('candidate_sourcing_type').updateValueAndValidity();
        }
        this.jobCurrency = res?.job?.currency?.toUpperCase();
        let start_date = this.datePipe.transform(jobdetails['start_date']?.split(' ')[0], '','','', true);


        //let jobRateModel = 'rate_model' in jobdetails && !!jobdetails['rate_model'] ? jobdetails?.rate_model : 'pay_rate';
        if (this.programRateModel == 'MARKUP') {
          if(this.user_type?.toLowerCase() === 'vendor' || this.user_type?.toLowerCase() === 'super_org'){
            // if(this.clientBillRateEnabled){
            //   this.counterOfferForm.controls['vendorBillRateValue'].disable();
            // }
            // else{
            //   this.counterOfferForm.controls['vendorBillRateValue'].enable();
            // }
            this.counterOfferForm.controls['vendorBillRateValue'].enable();
            this.counterOfferForm?.controls['candidatePayRate'].disable();
          }
          else{
            this.counterOfferForm?.controls['candidatePayRate'].disable();
            this.counterOfferForm.controls['vendorBillRateValue'].enable();
          }
        } else if (this.programRateModel == 'PAY_RATE') {
          this.counterOfferForm.controls['candidatePayRate'].enable();
          this.counterOfferForm.controls['vendorBillRateValue'].disable();
        } else {
          this.counterOfferForm?.patchValue({
            candidatePayRate: this.accuracyPipe.transform(0, AccuracyConfigEnum.RATE, { isEdit: true} ),
          });
          this.counterOfferForm?.controls['candidatePayRate'].disable();
          if(this.clientBillRateEnabled){
            this.counterOfferForm.controls['vendorBillRateValue'].disable();
          }
          this.counterOfferForm?.get('candidatePayRate').clearValidators();
          this.counterOfferForm?.get('candidatePayRate').updateValueAndValidity();
        }

        if (this.programRateModel === 'PAY_RATE') {
          this.counterOfferForm.patchValue({
            maxBillRate: this.accuracyPipe.transform(jobdetails['max_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
            minBillRate: this.accuracyPipe.transform(jobdetails['min_pay_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true })
          });
        } else {
            if(this.clientBillRateEnabled){
              this.counterOfferForm.patchValue({
                maxBillRate: this.accuracyPipe.transform(jobdetails['max_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
                minBillRate: this.accuracyPipe.transform(jobdetails['min_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true })
              });
            }
            else{
              this.counterOfferForm.patchValue({
                maxBillRate: this.accuracyPipe.transform(jobdetails['vendor_max_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true }),
                minBillRate: this.accuracyPipe.transform(jobdetails['vendor_min_bill_rate'] || 0, AccuracyConfigEnum.RATE, { isEdit: true })
              });
            }
        }

        if(this.programRateModel === 'PAY_RATE'){
          this.minPayNum = +this.counterOfferForm.controls.minBillRate.value;
          this.maxPayNum = +this.counterOfferForm.controls.maxBillRate.value;
          this.getvalidRate(this.counterOfferForm.controls.candidatePayRate,this.minPayNum,this.maxPayNum,'Pay Rate')
        }
        else{
          this.minNum = +this.counterOfferForm.controls.minBillRate.value;
          this.maxNum = +this.counterOfferForm.controls.maxBillRate.value;
          if(this.clientBillRateEnabled){
            this.getvalidRate(this.counterOfferForm.controls.billRatevalue,this.minNum,this.maxNum,'Client Bill Rate')
          }
          else{
            this.getvalidRate(this.counterOfferForm.controls.vendorBillRateValue,this.minNum,this.maxNum,'Vendor Bill Rate')
          }
        }
        this.submission_exceed_max_bill_rate = jobdetails['is_submission_exceed_max_bill_rate'];
        this.counterOfferForm.updateValueAndValidity();

        this.startDate = !!this.createOfferFormControls['startDate'].value ? new Date(this.createOfferFormControls['startDate'].value) : '';
        this.start = !!this.startDate ? this.startDate.setDate(this.startDate.getDate() - 1) : '';
        this.endDate = !!this.createOfferFormControls['endDate'].value ? new Date(this.createOfferFormControls['endDate'].value) : '';
        this.end = !!this.endDate ? this.endDate.setDate(this.endDate.getDate() + 1) : '';

        this.optionsStartDate = {
          language: 'English',
          enabledDateRanges: [{ start: this.today?.setDate(this.today?.getDate() - 1) }],
          alwaysVisible: false,
        };
        this.optionsEndDate = {
          language: 'English',
          enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
          alwaysVisible: false,
        };

        this.subscriptions.push(
          this.createOfferFormControls.startDate.valueChanges.subscribe(val => {
            this.startDate = new Date(this.createOfferFormControls['startDate'].value);
            this.start = this.startDate.setDate(this.startDate.getDate() + 1);
            this.optionsEndDate = Object.assign(
              {},
              {
                language: 'English',
                enabledDateRanges: !!this.start ? [{ start: this.start }] : [],
              },
            );
            // this.getWorkingHoursEstimate();
          }),
        );

        this.subscriptions.push(
          this.createOfferFormControls.endDate.valueChanges.subscribe(val => {
            this.endDate = new Date(this.createOfferFormControls['endDate'].value);
            this.end = this.endDate.setDate(this.endDate.getDate() - 1);
            this.optionsStartDate = Object.assign(
              {},
              {
                language: 'English',
                enabledDateRanges: [{ start: start_date, end: this.end }],
              },
            );
            // this.getWorkingHoursEstimate();
          }),
        );
        if (jobdetails?.hierarchy) {
          this.getDetailOfHierarchy(jobdetails);
          this.hierarchyId = jobdetails?.hierarchy[0]?.id;
          if (this.counterOfferForm.get('tenure_start')?.value) {
            this.getTenure(this.hierarchyId, new Date(this.counterOfferForm.get('tenure_start').value));
          } else {
            this.getTenure(this.hierarchyId);
          }
        }
        },
        error: (err) => {
          this.showError(err?.error?.error?.errors[0]?.message);
          this.disabledCounter = true;
        }
      }),
    );
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
  }
  isRatesUpdated:boolean;
  hideRateDetails(data) {
    this.rateDetailsVisible = false;
    if(this.counterOfferForm===undefined)  return
    const setAndMarkDirty = (formControl, value, dirty=false)=>{
      dirty && formControl.markAsDirty()
      formControl?.setValue(value);
    }
    if (data.update) {
      this.isRatesUpdated = data?.update;
      this.vendorBillRate = data?.standardRates.vendor_rate;
      this.clientBillRate = data?.standardRates.billrate;
      this.payloadRateFactors = data?.factors;
      this.rate_factors_arr = data?.factors;
      this.updatedMarkupRateFactors = _.cloneDeep(data?.factors);
      setAndMarkDirty(this.counterOfferForm?.get('candidatePayRate'), data?.standardRates?.payrate, true)
      setAndMarkDirty(this.counterOfferForm?.get('billRatevalue'), data?.standardRates?.billrate)
      setAndMarkDirty(this.counterOfferForm?.get('vendorBillRateValue'), data?.standardRates?.vendor_rate)
      if (data?.standardRates?.markup) {
        this.counterOfferForm?.get('rateMarkUpValue') && setAndMarkDirty(this.counterOfferForm?.get('rateMarkUpValue'), data?.standardRates?.markup)
      }
      if (this.costComponentEnabled && data?.standardRates?.cost_component) {
        for (const cc of data.standardRates.cost_component) {
          this.counterOfferForm.get('costComponent')?.get(cc?.code || 'markup')?.patchValue({ ...cc });
        }
      }
      const submissionForm = this.counterOfferForm?.get('rates') as UntypedFormArray;
      for (const rate of submissionForm?.controls) {
        const newRateObj = data['rateValues'].find(obj => obj?.rate_factor === rate?.get('rate_factor')?.value);
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
    if (this.counterOfferForm)
      return {
        billrate: this.counterOfferForm?.get('billRatevalue')?.value,
        payrate: this.counterOfferForm?.get('candidatePayRate')?.value,
        vendor_rate: this.counterOfferForm?.get('vendorBillRateValue')?.value,
        markup: this.counterOfferForm?.get('rateMarkUpValue')?.value || 0,
        cost_component: this.counterOfferForm?.get('costComponent')?.value
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
      minValue: +this.counterOfferForm?.get('minBillRate')?.value,
      maxValue: +this.counterOfferForm?.get('maxBillRate')?.value,
      hideRateAuthority: this.hideRateAuthority,
      submission_exceed_max_bill_rate: this.submission_exceed_max_bill_rate,
      markup: this.selectedSourceType === 'Sourced' ? this.markupConfigObj?.markups?.sourced_markup : this.markupConfigObj?.markups?.payrolled_markup
    }
  }

  get rateDetailsEditableFactors(): boolean {
    return this.checkAuthorization('manage_rate_type_offer')
  }

  get rateDetailsEditableCostComponent():boolean {
    return this.costComponentEnabled && this.checkAuthorization('manage_cost_component');
  }

  get rateDetailsEditableMarkup(): boolean {
    return this.checkAuthorization('manage_markup') || false;
  }

  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  get rateDetailsPayload(): RateModelPayloadDefaults {
    if (this.counterOfferForm === undefined) return
    return {
      hierarchy: this.jobHierarchy,
      rate_model: this.rateModelObj[this.programRateModel],
      min_bill_rate: "0.0",
      max_bill_rate: "0.0",
      msp_fee_types: this.amount_type,
      msp_fee_value: this.mspFee,
      msp_fee_funded_by: this.funded_by,
      ot_exempt: this.is_ot_exempt,
      adjusted_markup: this.counterOfferForm?.get('rateMarkUpValue')?.value,
      fee_details: this.fee_details
    }
  }

  checkConfig(){
    return this.jobdetailService.checkConfig(this.programRateModel,this.clientBillRateEnabled,this.user_type);
   }

   get gridClass(){
    if(this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP'){
      if(this.user_type.toLowerCase() === 'msp'){
        return 'col-md-4'
      }
      else{
        return 'col-md-6'
      }
    }
    else if(this.programRateModel === 'BILL_RATE'){
      return 'col-md-6'
    }
  }

  getvalidRate(control,minNumber,maxNumber,rateType){
    if (+control.value > maxNumber && !this.submission_exceed_max_bill_rate) {
      control.setErrors({
        max: `Maximum number can be ${maxNumber}`,
      });
      return;
    } else if (+control.value < minNumber) {
      control.setErrors({
        min: `Minimum number can be ${minNumber}`,
      });
      return;
    } else if (+control.value <= 0) {
      control.setErrors({
        min: `${rateType} can not be zero or empty`,
      });
      return;
    }
    else {
      control.setErrors(null);
    }
  }

  programType: any;
  getDetailOfHierarchy(jobdetails) {
    const url = `/configurator/programs/${this.currentProgram?.id}/hierarchy/${jobdetails?.hierarchy[0]?.id}`;
    this.jobdetailService.get(url).subscribe((res: any) => {
      const { hierarchy } = res;
      this.programType = hierarchy?.program_type;
    });
  }

  formatted_working_days: any;
  working_hours: any;
  queryStringWorkEstimate: any;

  async getWorkingHoursEstimate(week_working_days?, hours_per_day?) {
    week_working_days = week_working_days|| this.counterOfferForm.get('week_working_days').value;
    hours_per_day = hours_per_day || this.counterOfferForm.get('hours_per_day').value;
    let start_date: any = this.datePipe.transform(this.counterOfferForm.get('startDate').value,'',null,null,true,this.prefferedfDateFormate);
    let end_date: any = this.datePipe.transform(this.counterOfferForm.get('endDate').value,'',null,null,true,this.prefferedfDateFormate);
    start_date = this.datePipe.transform(start_date, DATE_FORMAT?.FORMATYMD, '','',true,this.prefferedfDateFormate);
    end_date = this.datePipe.transform(end_date, DATE_FORMAT?.FORMATYMD, '', '', true,this.prefferedfDateFormate);

    if (start_date && end_date && week_working_days && hours_per_day) {
      this.jobdetailService
        .get(
          `/core-money/programs/${this.currentProgram?.id}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`,
        )
        .subscribe((data: any) => {
          if (data && data.data) {
            this.formatted_working_days = data?.data?.formatted_working_days;
            this.working_hours = data?.data?.working_hours;
            this.getResourceBudget(start_date, end_date);
          }
        });
    }
  }

  totalBudget: any;
  async getResourceBudget(startDate, endDate) {
    let formData = JSON.parse(JSON.stringify(this.counterOfferForm.getRawValue()));
    this.clientBillRate = !this.clientBillRate ?  this.counterOfferForm.getRawValue()['clientBillRate'] : this.clientBillRate;
    let mainBillRate = this.counterOfferForm.getRawValue()['billRatevalue'];
    let request: any = {};
    let effective_data_arr = [];
    let { rateType } = formData;
    request.total_hours = this.working_hours;
    request.rate = mainBillRate;
    request.week_working_days = this.counterOfferForm.get('week_working_days').value;
    request.hours_per_day = this.counterOfferForm.get('hours_per_day').value;
    if (mainBillRate ==='' || mainBillRate === null || !rateType || !startDate || !endDate) {
      return;
    }
    let req: any = {};
    request.adjustment_fee = this.adjustmentData || this.offerDetails?.offer?.adjustment_fee || this.counterOfferForm.get('adjustmentData').value;
    req.start_date = startDate;
    req.end_date = endDate;
    req.num_resources = 1;
    req.additional_budget = 0;
    req.adjustment_type = this.counterOfferForm?.controls?.adjustment_type?.value;
    req.adjustment_value = this.counterOfferForm?.controls?.adjustment_value?.value || this.adjustment_value || 0;
    let effective_data_obj: any = {
      effective_start_date : startDate,
      effective_end_date : endDate,
      hours_per_day:request.hours_per_day,
      week_working_days: request.week_working_days,
      rate: request.rate,
      total_hours:request.total_hours,
      rate_type: this.jobdetailService.getUnitOfMesaure(rateType),
      tax: [],
      adjustment_fee: request?.adjustment_fee
    };

    effective_data_arr.push(effective_data_obj);
    req.effective_data = effective_data_arr;

    this.jobdetailService.post(`/core-money/programs/${this.currentProgram?.id}/resource-budget`, req).subscribe((data: any) => {
      if (data && data.data) {
        const { net_budget } = data?.data;
        const budgetInfo = data?.data;
        this.totalBudget =  net_budget;
        this.disabledCounter = false;
        this.counterOfferForm.patchValue({
          budget_estimate: this.totalBudget,
          single_net_budget: this.totalBudget,
          single_initial_budget:budgetInfo?.single_initial_budget,
          estimated_adjustment: budgetInfo?.estimated_adjustment,
          additional_amount: budgetInfo?.adjustment_amount
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
      const splittedDate = date.split('/');
      const yy = splittedDate[2];
      const month = splittedDate[0];
      const dd = splittedDate[1];
      return new Date(yy, month - 1, dd);
    }
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  get ratesArray(): UntypedFormArray {
    return this.counterOfferForm.get('rates') as UntypedFormArray;
  }

  get isUserSuperAdmin() {
    return this.userPermissionService.isUserSuperAdmin();
  }
  getRateInformation() {
    // this.getProgramConfiguration('vendor_markup');
    // this.getProgramConfiguration('rate_factor');
  }

  setMarkupStatus(event) {
    this.checkedMarkUp = event;
    this.counterOfferForm.patchValue({
      markUp: this.checkedMarkUp,
    });
    this.counterOfferForm.updateValueAndValidity();
    this.checkedMarkUp ? this.createOfferFormControls['markUpValue'].enable() : this.createOfferFormControls['markUpValue'].disable();

    //this.calculateRates();
  }

  isEmptyObject = object => {
    return object && Object.keys(object).length === 0 && object.constructor === Object;
  };

  handleTaxFormValueChange(event){
    if(event){
      this.taxData = event?.tax || [];
      this.adjustmentData = event?.adjustment_fee;
      this.isTaxValid = event?.isTaxValid;
      if(event?.adjustmentChanged){
        this.getWorkingHoursEstimate();
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

  onSubmit() {

    let is_valid = true;

    if(!this.countryValidated){
      return;
    }
    if (!is_valid) {
      // this.alert.error(`Please enter tax value less than or equals to 100`);
      this.showError('Please enter tax value less than or equals to 100');
      return;
    }
    this.submitted = true;
    let offerForm = this.counterOfferForm.getRawValue();
    this.isLoader = true;
    if (this.counterOfferForm.valid) {
      let payload = new counterOfferPayload();
      payload.start_date = this.datePipe.transform(offerForm['startDate'],DATE_FORMAT?.FORMATMDY,null,null,true,this.prefferedfDateFormate);
      payload.end_date = this.datePipe.transform(offerForm['endDate'],DATE_FORMAT?.FORMATMDY,null,null,true,this.prefferedfDateFormate);
      payload.tenure_date = this.datePipe.transform(offerForm['tenure_start'],DATE_FORMAT?.FORMATMDY,null,null,true,this.prefferedfDateFormate);
      payload.dt_bill_rate = +offerForm['datBillRateValue'];
      payload.dt_pay_rate = +offerForm['dtPayRateValue'];
      payload.notes = offerForm['notes'];
      payload.ot_bill_rate = +offerForm['otBillRateValue'];
      payload.ot_pay_rate = +offerForm['otPayRateValue'];
      payload.rate_markup = +offerForm['rateMarkUpValue'];
      //payload.rate_model = this.rateModel;
      payload.rate_type = offerForm['rateType'];
      payload.st_bill_rate = offerForm['billRatevalue'];
      payload.st_pay_rate = offerForm['candidatePayRate'];
      //payload.job_manager_id = offerForm['jobManager'];
      //commented this as Backend team is handleing
      // if(!this.isVendorNeutral) {
      //   if(typeof offerForm['timesheetManager'] === 'string'){
      //     payload.timesheet_manager_id = [offerForm['timesheetManager']];
      //   }
      //   else{
      //     payload.timesheet_manager_id = offerForm['timesheetManager'];
      //   }
      // }
      payload.timesheet_type = this.timesheetTypeValue;
      payload.is_fees_included = this.isfeesIncluded;
      // payload.holiday_calendar_id = offerForm['holidayCalender'];
      payload.work_location_id  = offerForm['locations'];
      if(offerForm['allow_expense'] === null){
        payload.is_expense_allowed = null;
      }
      else{
        payload.is_expense_allowed = offerForm['allow_expense'] === 'Yes' ? true : false;
      }
      // if(this.jobDetailsData['is_expense_allowed'] === null || this.offerDetailStageData['is_expense_allowed'] === null){
      //   payload.is_expense_allowed = null
      // }
      let budgetDetails = {
        adjustment_type: offerForm['adjustment_type'],
        additional_amount: offerForm['additional_amount'],
        adjustment_value: offerForm['adjustment_value'],
        single_initial_budget: offerForm['single_initial_budget'],
        single_net_budget: offerForm['single_net_budget'],
        budget_estimate: offerForm['budget_estimate'],
        estimated_adjustment: offerForm['estimated_adjustment']
      }
      payload.rate_markup_info = budgetDetails;

      payload.assignment_workflow = offerForm['assignment_workflow'];
      payload.rates = offerForm['rates'];
      if(this.isCounterOffer && this.isCounterOfferReview){
        payload.status = 'COUNTERED_PENDING_REVIEW'
      }
      else if(this.newWorkflow){
        //Send for approval if review is off but new workflow enabled;
        payload.status = 'COUNTERED_PENDING_APPROVAL';
      }
      else{
        payload.status = 'COUNTERED';
      }
      payload.budget_estimate = (+offerForm['budget_estimate']);
      payload.rates.push({
        billable:this.stRateFactor?.billable,
        applicable: true,
        bill_rate: payload.st_bill_rate,
        rate_factor: this.stRateFactor?.abbreviation ?? 'ST',
        abbreviation: this.stRateFactor?.abbreviation ?? 'ST',
        name: this.stRateFactor?.name ?? 'Standard Rate',
        id: this.stRateFactor?.id,
        default: offerForm['DefaultRateValue'],
        markup: offerForm['rateMarkUpValue'] || 0,
        pay_rate: payload.st_pay_rate,
        client_bill_rate: this.clientBillRate || null,
        vendor_bill_rate: offerForm['vendorBillRateValue'] || null,
        rate_factor_ts_type: this.stRateFactor?.rate_factor_ts_type,
        cost_component: offerForm['costComponent'] || {}
      });
      payload.rates = payload.rates.map(ra => {
        // if(this.programRateModel == 'MARKUP' && (this.user_type?.toLowerCase() == 'vendor' || this.user_type?.toLowerCase() === 'super_org')){
        //   payloadBillRate = this.offerDetails?.offer?.ot_exempt ? this.clientBillRate : ra.client_bill_rate;
        // }
        // else{
        //   payloadBillRate = ra.bill_rate;
        // }
        ra.bill_rate = ra.bill_rate;
        ra.pay_rate = ra.pay_rate;
        ra.vendor_bill_rate = ra.vendor_bill_rate;
        ra.default = ra.default;
        ra.markup = ra.markup;
        ra.cost_component = ra.cost_component || {};
        delete ra.client_bill_rate;
        delete ra.enable_bill_rate_edit;
        delete ra.enable_pay_rate_edit;
        return ra;
      });
      payload.rate_factors_info = this.payloadRateFactors;
      payload.fee = this.fee_info || this.candidateDetails?.candidate?.fee;
      payload.remote_worker = this.remote_worker,
      payload.remote_worker_details = this.remote_worker_details,
      payload.taxes = (this.taxData.length > 0 ? this.taxData : null) || null;
      payload.adjustment_fee = this.adjustmentData || this.offerDetails?.offer?.adjustment_fee || this.jobdetailService?.getAdjustmentPayload(this.adjustmentData?.amount_value);
       /** Commented the Custom Field as part of V2M-17965 **/
      // payload.foundational_data = [];
      // this.foundationalFieldsFormData?.forEach(data => {
      //   let { foundational_data_type_id, values } = data;
      //   if (values) {
      //     payload.foundational_data.push({ foundation_data_type_id: foundational_data_type_id, foundation_data_id: values });
      //   }
      // });

      /** Commented the Custom Field as part of V2M-12204 **/
      // if (this.customFieldsFormData && this.customFieldsFormData?.length > 0) {
      //   let custom_value = {};
      //   this.customFieldsFormData?.forEach(field => {
      //     if (field?.values) {
      //       custom_value[field?.custom_field_slug] = field?.values;
      //     }
      //   });
      //   if (!this.isEmptyObject(custom_value)) {
      //     payload.custom_fields = custom_value;
      //   }
      // }
      const rateMarkupValue = offerForm['rateMarkUpValue'] || null;
      if(this.is_ot_exempt){
        payload.rate_factors_info.forEach(element => {element.markup = rateMarkupValue});
        payload.rates.map(rate => {rate.markup = rateMarkupValue;return rate;});
      }
      if(!this.markupByRateTypeEnabled){
        payload.rates = this.updateRateMarkup(payload?.rates, 'st', rateMarkupValue);
        this.payloadRateFactors = this.updateRateMarkup(this.payloadRateFactors, 'st', rateMarkupValue);
      }
      payload.candidate_sourcing_type = offerForm['candidate_sourcing_type'];
      payload.is_cost_component = this.costComponentEnabled;
      payload.markup_by_rate_type = this.candidateDetails?.candidate?.markup_by_rate_type;
      payload.cost_component_config = this.candidateDetails?.candidate?.cost_component_config;
      if(this.programRateModel == "BILL_RATE") {
        delete payload.candidate_sourcing_type;
      }
      if(!this.remote_worker){
        delete payload.remote_worker_details;
      }
      if(!this.showRemoteWorker){
        delete payload.remote_worker;
      }
      if(!this.currentProgram?.config?.is_custom_tax_on_assignment || !this.hasManageTaxPermission || !this.isShowTax){
        delete payload.taxes;
      }
      if(!this.currentProgram?.config?.is_adjustment_fee_allowed){
        delete payload.adjustment_fee;
      }
      payload.worker_email = offerForm['worker_email'];
      payload.ot_exempt = this.is_ot_exempt;
      this.subscriptions.push(
        this.jobdetailService.counterOffer(payload, this.jobId, this.candidateId, this.offerId).subscribe({
          next: (res:any) => {
            this.alert.success('Offer countered successfully. ');
            this.eventStream.emit(new EmitEvent(Events.RELOAD_OFFERS, true));
            this.router.navigate([`jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/offers`]);
            this.eventStream.emit(
              new EmitEvent(Events.JOB_DETAIL_SIDEBAR_COUNTER_OFFER, {
                isopen: false,
              }),
            );
            this.isLoader = false;
          },
          error: err => {
            // this.alert.error(err.error.error.message);
            this.showError(err);
            this.isLoader = false;
          },
    }),
      );
    }
  }
  get vendorMarkUp() {
    return this.jobdetailService.getProgramConfig('vendor_markup');
  }

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

  getMarkupValidate(){
    this.createOfferFormControls.rateMarkUpValue.valueChanges.subscribe((val:number) => {
      if (val && this.selectedSourceType === 'Sourced') {
        if (val > Number(this.markupConfigObj?.markups?.sourced_markup)) {
          this.createOfferFormControls.rateMarkUpValue.setErrors({
            max: `Maximum number can be ${this.markupConfigObj?.markups?.sourced_markup}`,
          });
        }
      } else if (val && this.selectedSourceType === 'Payrolled') {
        if (val > Number(this.markupConfigObj?.markups?.payrolled_markup)) {
          this.createOfferFormControls.rateMarkUpValue.setErrors({
            max: `Maximum number can be ${this.markupConfigObj?.markups?.payrolled_markup}`,
          });
        }
      } else if (val <= 0) {
        this.createOfferFormControls.rateMarkUpValue.setErrors({
          min: `Mark up can not be zero or empty`,
        });
      } else {
        this.createOfferFormControls.rateMarkUpValue.setErrors(null);
      }
    });
  }
  calculateRates(key) {
    let mainPayRate = this.counterOfferForm.get('candidatePayRate')?.value;
    let mainBillRate = this.counterOfferForm.get('billRatevalue')?.value;
    let vendorBillRate = this.counterOfferForm.get('vendorBillRateValue')?.value;
    const adjustedMarkup = this.createOfferFormControls?.rateMarkUpValue?.value;
    let vendorMarkup = this.counterOfferForm?.value?.rateMarkUpValue;
    //const max_bill_rate = Number(this.submissionForm.get('maxBillRate')?.value)
    //const min_bill_rate = Number(this.submissionForm.get('minBillRate')?.value);
    const max_bill_rate = 0;
    const min_bill_rate = 0;
    let rate_model = this.rateModelObj[this.programRateModel];
    const payload = {
      hierarchy: this.jobHierarchy || '',
      rate_model: this.rateModelObj[this.programRateModel],
      adjusted_markup: adjustedMarkup ?? 0,
      vendor_markup: vendorMarkup ?? 0,
      client_bill_rate: mainBillRate || 0,
      candidate_pay_rate: mainPayRate,
      vendor_bill_rate: vendorBillRate,
      max_bill_rate: max_bill_rate,
      min_bill_rate: min_bill_rate,
      msp_fee_types: this.amount_type,
      msp_fee_value: this.mspFee,
      msp_fee_funded_by: this.funded_by,
      rate_input: this.returnRateInput(key),
      ot_exempt: this.is_ot_exempt,
      is_markup_by_rate_type: this.markupByRateTypeEnabled,
      fee_details: this.fee_details,
      is_cost_component : this.costComponentEnabled
    }
    let rate_factors_payload = [];
    this.rate_factors_arr?.map(x => rate_factors_payload.filter(a => a.abbreviation == x.abbreviation).length > 0 ? null : rate_factors_payload.push(x));
    payload['rate_factors'] = rate_factors_payload;

    if ((key === 'billrate' && mainBillRate === null) || (key === 'payrate' && mainPayRate === null)) {
      return;
    }

    if(!this.createOfferFormControls?.rateMarkUpValue.valid){
      return;
    }

    if(this.programRateModel.toLowerCase() === 'pay_rate'){
      if(!this.createOfferFormControls?.candidatePayRate.value || this.createOfferFormControls?.candidatePayRate.value <=0 ||
        !this.createOfferFormControls.candidatePayRate.valid){
        return;
      }
    }

    if(this.programRateModel.toLowerCase() === 'bill_rate' ){
      if(this.clientBillRateEnabled){
        if(!this.createOfferFormControls?.billRatevalue.value || this.createOfferFormControls?.billRatevalue.value <=0 || !this.createOfferFormControls?.billRatevalue.valid){
          return;
        }
      }
      else{
        if(!this.createOfferFormControls?.vendorBillRateValue.value || this.createOfferFormControls?.vendorBillRateValue.value <=0 || !this.createOfferFormControls?.vendorBillRateValue.valid){
          return;
        }
      }
    }
    else if(this.programRateModel.toLowerCase() === 'markup'){
      if(!this.createOfferFormControls?.vendorBillRateValue.value || this.createOfferFormControls?.vendorBillRateValue.value <=0 || !this.createOfferFormControls?.vendorBillRateValue.valid){
        return;
      }
    }

    if (!rate_model) {
      return;
    }
    if (adjustedMarkup === null || vendorMarkup === null) {
      return;
    }

    if(payload.msp_fee_value === null || payload.msp_fee_value === undefined){
      return false;
    }

    this.candidateService.post(`/core-money/programs/${this.programId}/rate-model`, payload)
    .subscribe({
      next: (res: any) => {
    const { data } = res;
    const rateObj = data?.rate;
    this.isfeesIncluded = data?.is_fees_included;
      for (var prop in rateObj) {
        const ele = rateObj[prop];
        if(prop == 'regular'){
          this.vendorBillRate = ele?.vendor_rate;
          this.clientBillRate = ele?.billrate;
          this.counterOfferForm.patchValue({
            DefaultRateValue: ele?.default
          });
          this.counterOfferForm.patchValue({
            billRatevalue: this.accuracyPipe.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true} ),
            vendorBillRateValue: this.accuracyPipe.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true} ),
            candidatePayRate: this.accuracyPipe.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true} ),
          }, {emitEvent: false})
        }
        const arrayValues = this.ratesArray.value;
        const rateIndex = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === prop);
        if (rateIndex > -1) {
            this.ratesArray?.at(rateIndex)?.patchValue({
              bill_rate: this.accuracyPipe.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              pay_rate:  this.accuracyPipe.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              vendor_bill_rate: this.accuracyPipe.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              client_bill_rate: this.accuracyPipe.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true} ),
              default: ele?.default
          }, {emitEvent: false});
        }
        if(this.costComponentEnabled){
          this.jobdetailService?.updateCostComponentValues(rateObj,this.counterOfferForm,this.ratesArray,this.payloadRateFactors)
        }
      }
      if(this.clientBillRate){
        this.getWorkingHoursEstimate();
      }
    },
    error: (err) => {
      // this.alert.error(errorHandler(err));
      this.showError(err);
      this.disabledCounter = true;
    }
  });
}
  returnRateInput(rate: any) {
    let rate_model = this.rateModelObj[this.programRateModel];
    if (rate === 'payrate') {
      return "candidate";
    } else if (rate === 'billrate') {
      return "client";
    }
    else if(rate === 'vendor_rate'){
      return "vendor"
    }
    else if(rate === 'markup') {
      if(rate_model === 'payrate'){
        return "candidate";
      }
      else if(rate_model === 'markup'){
        return "vendor";
      }
      else{
        return "client";
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

  get hasManageTaxPermission() {
    return ((this.storageService?.get('user_permission')?.includes('manage_tax') || this.taxData.length > 0) && this.storageService?.get('user_permission')?.includes('view_tax')) ? true : false;
  }

  getFormula(rateArray) {
    let formula = '';
    rateArray?.forEach(obj => {
      let adjustment = obj?.adjustment;
      if(adjustment){
        return formula += `(${this.convertCase(obj?.rate_type)} * ${this.convertStr(obj?.factor)}) + ${adjustment} `;
      }
      return formula += `(${this.convertCase(obj?.rate_type)} * ${this.convertStr(obj?.factor)}) +`;
    });
    formula = formula.slice(0, -1)
    return formula;
  }

  convertStr(str) {
    return parseFloat(str?.toString());
  }

  convertCase(str) {
    if (str) return `ST ${str?.toUpperCase().replaceAll('_', ' ')}`;
  }


  getMarkup(vendorId?, rateMarkupValue?, jobLaborCategory?, jobHierarchy?, jobWorkLocation? ) {
    let url = `/configurator/programs/${this.programId}/vendors/${vendorId}/markups?industry_id=${jobLaborCategory}&hierarchy_id=${jobHierarchy}&work_location_id=${jobWorkLocation}`;
    this.isMarkupCalled = true;
    this.jobdetailService.get(url).subscribe((res: any) => {
      const isDsaasVendor = res?.is_dsaas_vendor;
      const { markup_config } = res;
      this.markupConfigObj = markup_config;
      if(this.markupConfigObj?.markups?.sourced_markup!=null && Number(this.markupConfigObj?.markups?.sourced_markup)>=0) {
        this.markupConfigObj.markups.sourced_markup = this.accuracyPipe.transform(this.markupConfigObj?.markups?.sourced_markup, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true });
      }
      if(this.markupConfigObj?.markups?.payrolled_markup!=null && Number(this.markupConfigObj?.markups?.payrolled_markup)>=0) {
        this.markupConfigObj.markups.payrolled_markup = this.accuracyPipe.transform(this.markupConfigObj?.markups?.payrolled_markup, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true });
      }
      if(!isDsaasVendor) {
        if (Object.keys(this.markupConfigObj?.markups)?.length > 0 && this.programRateModel !== "BILL_RATE") {
          if ((this.markupConfigObj?.markups?.sourced_markup != null && Number(this.markupConfigObj?.markups?.sourced_markup) >= 0) && this.markupConfigObj?.markups?.payrolled_markup != null && Number(this.markupConfigObj?.markups?.payrolled_markup) >= 0) {
          } else if (this.markupConfigObj?.markups?.sourced_markup != null && Number(this.markupConfigObj?.markups?.sourced_markup) >= 0) {
            this.isSourced = true;
          } else if (this.markupConfigObj?.markups?.payrolled_markup != null && Number(this.markupConfigObj?.markups?.payrolled_markup) >= 0) {
            this.isPayroll = true;
          }
        }
      }
      else{
        this.selectedSourceType = "Payrolled";
        this.isPayroll = true;
        this.counterOfferForm.patchValue({
          candidate_sourcing_type: this.selectedSourceType,
          rateMarkUpValue: this.accuracyPipe.transform(this.originalMarkUp, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
        });
        return;
      }
      if(!this.isPayRolledValid && !this.isSourcedValid && this.programRateModel !== "BILL_RATE") {
        this.selectedSourceType = "Sourced";
        this.counterOfferForm.patchValue({
          candidate_sourcing_type: this.selectedSourceType,
          rateMarkUpValue: this.markupConfigObj?.markUps?.sourced_markup
        });
        return;
      }
      if (!this.markupConfigObj?.is_sliding_scale) {
        this.counterOfferForm.patchValue({
          markUpValue:
            this.createOfferFormControls?.candidate_type?.value === 'sourced'
              ? this.markupConfigObj?.markups?.sourced_markup
              : this.markupConfigObj?.markups?.payrolled_markup,
        });
      }
      if(this.programRateModel == "BILL_RATE") {
        return;
      }
      let submissionSourceType = this.counterOfferForm.get('candidate_sourcing_type')?.value?.toLowerCase() == "sourced" ? "sourced_markup" : "payrolled_markup";
      if(this.markupConfigObj.markups[submissionSourceType] == null || Number(this.markupConfigObj.markups[submissionSourceType]) == 0) {
        if(submissionSourceType?.toLowerCase() == "sourced_markup") {
          this.selectedSourceType = "Payrolled";
          submissionSourceType = "payrolled_markup";
        } else {
          this.selectedSourceType = "Sourced";
          submissionSourceType = "sourced_markup";
        }
      } else {
        return;
      }
      this.counterOfferForm.patchValue({
        candidate_sourcing_type: this.selectedSourceType,
        rateMarkUpValue: this.markupConfigObj?.markups[submissionSourceType]
      })
      this.calculateRates('markup');
    });
  }

  getFormulatoDisplay(abbreviation, rateFactor) {
    if (this.rateFactorFomrula?.has(abbreviation.toLowerCase())) {
      const abbr: Map<string, string> = this.rateFactorFomrula?.get(abbreviation.toLowerCase());
      return abbr ? abbr.get(rateFactor) : '';
    } else {
      return '';
    }
  }

  cancel() {
    this.router.navigate([`jobs/details/job-details/${this.jobId}/candidate/${this.candidateId}/offers`]);
  }

  ngOnDestroy() {
    this.jobManagerTypeAhead$.unsubscribe();
    this.timesheetManagerTypeAhead$.unsubscribe();
    this.expenseManagerTypeAhead$.unsubscribe();
    this.jobdetailService.unsubscribe();
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }

  getCurrencyCode(currency) {
    if (currency) {
      this.currency = this.currencyService.getCurrencySymbol(currency);
    }

    // jobdetails.curency;
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

  getTenure(hierarchyId, tenureDate = null) {
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
            error: (err) => {
              // this.alert.error('Unable to get the tenure details.<br>' + err);
              this.showError('Unable to get the tenure details.');
            },
        });
        }
      }
    }
  }

  onCloseSideBar = value => {
    this.showAccountCodeDetails = 'hidden';
  };

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
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''),
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
  checkDateMax() {
    const start_date: any = this.datePipe?.transform(this.counterOfferForm.get('startDate').value,DATE_FORMAT?.FORMATMDY,'','',true,this.prefferedfDateFormate);
    const end_date: any = this.datePipe?.transform(this.counterOfferForm.get('endDate').value,DATE_FORMAT?.FORMATMDY,'','',true,this.prefferedfDateFormate);

    if (start_date && end_date) {
      if (Date.parse(start_date) < Date.parse(end_date)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  patchMarkup() {
    this.isCandidateSourcingTypeChanged = true;
    this.selectedSourceType = this.createOfferFormControls?.candidate_sourcing_type?.value;
    const markup = this.createOfferFormControls?.candidate_sourcing_type?.value === 'Sourced' ? this.markupConfigObj?.markups?.sourced_markup : this.markupConfigObj?.markups?.payrolled_markup;
    if(markup){
      this.counterOfferForm.patchValue({
        rateMarkUpValue: markup
      });
      this.calculateRates('markup');
    }
  }

  isBillRateValid(valueRef) {
    if(valueRef.value === null || valueRef.value === undefined)
      return false;

    let floatVal = parseFloat(valueRef.value);
    if(isNaN(floatVal))
      return false;

    if(floatVal <= 0)
      return false;

    return true;
  }

  get isSourcedValid() {
    if(!this.markupConfigObj)
      return false;

    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if(!this.markupConfigObj[0].markups)
        return false;

      let { sourced_markup } = this.markupConfigObj[0].markups;
      if(sourced_markup!= null) {
        sourced_markup = +sourced_markup
      }
      return Boolean(sourced_markup);
    }

    if(!this.markupConfigObj.markups)
      return false;

    let { sourced_markup } = this.markupConfigObj.markups;
    if(sourced_markup!= null) {
      sourced_markup = +sourced_markup
    }
    return Boolean(sourced_markup);
  }

  get isPayRolledValid() {

    if(!this.markupConfigObj)
      return false;

    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if(!this.markupConfigObj[0].markups)
        return false;

      let { payrolled_markup } = this.markupConfigObj[0].markups;
      if(payrolled_markup!= null) {
        payrolled_markup = +payrolled_markup
      }
      return Boolean(payrolled_markup);
    }

    if(!this.markupConfigObj.markups)
      return false;

    let { payrolled_markup } = this.markupConfigObj.markups;
    if(payrolled_markup!= null) {
      payrolled_markup = +payrolled_markup
    }
    return Boolean(payrolled_markup);
  }

  getAssignmentConfig(){
    this.loaderService.show();
    this.candidateService.getAssignmentConfig(this.currentProgram?.id).subscribe({
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
      this.isLoader = true;
      this.candidateService.getOverlappingAssignment(
        this.currentProgram?.id,
        this.candidateId,
        this.counterOfferForm.get('startDate')?.value,
        this.counterOfferForm?.get('endDate')?.value
      ).then((data:any)=>{
        if(data?.is_assignment_allow){
          this.onSubmit();
        }
        else{
          this.isLoader = false;
          this.showOverlapWarning = true;
          this.overlapAssignmentData = data?.details || [];

        }
      })
    }

  }
}



export class counterOfferPayload {
  start_date?: any;
  end_date?: any;
  // rate_model?: string;
  rate_type?: any;
  rate_markup?: any;
  st_bill_rate?: any;
  st_pay_rate?: any;
  ot_bill_rate?: any;
  ot_pay_rate?: any;
  dt_bill_rate?: any;
  dt_pay_rate?: any;
  notes?: any;
  budget_estimate: any;
  job_manager_id?: string;
  holiday_calendar_id?: string;
  timesheet_manager_id?: any;
  work_location_id?: string;
  is_expense_allowed:any;
  rate_markup_info:any;
  timesheet_type?: string;
  is_fees_included:any;
  assignment_workflow: string;
  worker_email: string;
  custom_fields?: any;
  foundational_data?: any;
  rates?: any;
  taxes?: any;
  status: string;
  tenure_date?: string;
  candidate_sourcing_type?: string;
  remote_worker: boolean;
  remote_worker_details? : any;
  ot_exempt:any;
  adjustment_fee:any;
  rate_factors_info:any;
  fee:any;
  is_cost_component:boolean;
  markup_by_rate_type: boolean;
  cost_component_config: boolean;
}

export const negetiveNotAllowed: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  if (typeof +ctrl.value === 'number' && +ctrl.value < 0) {
    ctrl.setValue((0));
  }
  return null;
};
