import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, tap,  debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { CurrencyService } from 'src/app/shared/service/currency.service';
import { CandidateService } from '../service/candidate.service';
import { LOG_TYPE , Log } from 'src/app/library/logs/logs.model';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';
@Component({
  selector: 'app-submit-candidate',
  templateUrl: './submit-candidate.component.html',
  styleUrls: ['./submit-candidate.component.scss'],
})

export class SubmitCandidateComponent implements OnInit {
  questionFormValid: any;
  updatedQuestion: any;
  disabledid = true;
  isDisabled: boolean = false;
  disabledfield = true;
  warningActive = false;
  currentJobId: any;
  candidateId: any;
  coverData: any;
  jobData: any;
  selectedSourceType: any;
  submittedCandidateId;
  showBillRateValidation = false;
  isSaveLoader: boolean = false;
  uploadedDocs = [];
  afterSaveText = 'Created';
  saveCandidateModal = false;
  viewMode = false;
  isLoader: boolean = false;
  public currency = '';
  public datepickerpermission;
  skillSets;
  public foundational_data = [];
  public custom_fields = [];
  isCustomFieldsFormValid: boolean = true;
  public submissionForm: UntypedFormGroup;
  skillRatingOptions = ['Trainee', 'Novice', 'Proficient', 'Expert'];

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
  minPayNum: any = 0;
  maxPayNum: any = 0;
  minNum: any = 0;
  maxNum: any = 0;
  optionsStartDate: any;
  optionsEndDate: any;
  startDate;
  start;
  endDate;
  end;
  markupConfigOriginal = 0;
  clientOverTimeBillRateFactor;
  clientDoubleTimeBillRateFactor;
  clientOverTimePayRateFactor;
  clientDoubleTimePayRateFactor;
  submission_exceed_max_bill_rate;
  candidateData: any;
  templateId: any;
  programId: any;
  questionnaireList: any;
  answer: string[];
  submission_id: any;
  isRequired: boolean;
  validate: boolean;
  isSubmitted: any;
  invalidDateMesg;
  programRateModel: any;
  customFieldsFormData: any = [];
  public isBillDriven = false;
  public programModel: string;
  public isSubmittedInvalid: boolean=false;
  is_ot_exempt: any = false;
  remote_worker: any = false;
  re_hire_candidate: boolean = false;
  pastWorkCommentBox: boolean = false;
  programDetails: any;
  PrefferedDateFormat: any;
  rateMarkup;
  logs: Log= undefined;
  public isPayroll: boolean = false;
  public isSourced: boolean = false;
  public isPayrollSourced: boolean = false;
  public isPredIdCandidate: boolean = false;
  public isDefaultSourcingType: boolean = true;
  baseURL:any;
  candidateCustomfields:any;
  isAvailableEndDateDisabled: boolean = false;
  currentProgram;
  stFlatAdustment;
  rateFactorSorting;
  otRateFactors;
  noOTRateFactors;
  jobProgramLaborCategory;
  jobHierarchy;
  jobWorkLocation;
  jobRates;
  oTRates;
  user_type;
  vendorBillRate;
  clientBillRate;
  factorClientBillRate;
  rateModelObj = {
    BILL_RATE : 'billrate',
    MARKUP : 'markup',
    PAY_RATE : 'payrate'
  }
  options2: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
  };
  isSubmitDescription: boolean = false;
  isfeesIncluded: boolean;
  mspFee;
  amount_type;
  applicable_on;
  funded_by;
  submitDisabled:boolean = false;
  isCandidateSourcingTypeChanged: boolean = false;
  candidatePrimaryAddress: any;
  remote_worker_details;
  remoteLocation: any;
  countryValidated;
  stRateFactor;
  isRatesFromJob;
  rate_factors_arr;
  rateFactor: any[] = [];
  ratesConfiguration;
  rateInputForExpress;
  candidateResumeData : any;
  resumeData: any;
  resumeError: boolean = false;
  isResumeRequired: boolean = false;
  taxAdjustment;
  disableResumeDelete:boolean = false;
  isShowTax: boolean = false;
  payloadRateFactors;
  rateDetailsVisible: boolean = false;
  isRatesUpdated: boolean = false;
  copyPayloadFactors;
  updatedMarkupRateFactors;
  fee_details;
  fee_info;
  costComponentGroupDetails: any;
  costComponentEnabled:boolean;
  cost_component_config;
  cost_component_group_id;
  moduleId;
  currencyId;
  sourcingModel;
  costComponentPayload;
  currencyList;
  isDsaasVendor;
  warning: {};
  showOverlapWarning:boolean = false;
  assignmentOverlapData = []
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private candidateService: CandidateService,
    private alert: AlertService,
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private location: Location,
    public storageService: StorageService,
    public currencyService: CurrencyService,
    private datePipe: LocalDateFormatPipe,
    private userPermissionService: UserPermissionService,
    private accuracy: AccuracyPipe,
    private loader: LoaderService,
    private authorizationService: AuthorizationService
  ) {}
  ngOnInit(): void {
    this.programId = this.storageService.get('PROGRAM_ID');
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isRatesFromJob = this.programDetails?.config?.is_rate_factors_from_job;
    this.programModel = this.programDetails?.config?.program_model;
    this.costComponentEnabled = this.programDetails?.config?.cost_component || false;
    this.cost_component_config  =  this.programDetails?.config?.cost_component || false;;
    this.baseURL = '/submission-manager';
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.currentJobId = this.route.snapshot.queryParams['jobId'];
    this.candidateId = this.route.snapshot.queryParams['candidateId'];
    this.templateId = this.route.snapshot.queryParams['templateId'];
    this.isSubmitted = this.route.snapshot.queryParams['isSubmitted'];
    // this.combineSourceAndModulesRequests();
    if (this.templateId) {
      this.getQuestionnaireListByTemplateId(this.templateId);
    }
    this.loadBasicDetails();
    if (this.currentJobId && this.candidateId && this.programId && this.isSubmitted === 'true') {
      this.getCandidateDetailsById();
    }
    this.getDateAuthority();
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isAvailableEndDateDisabled = this.currentProgram?.config?.offer?.disable_offer_end_date_edit;
    this.isShowTax = this.jobService.showTaxInComponents(this.currentProgram?.config);

  }

  get hideRateAuthority() {
    return this.jobService.rateAuthority();
  }

  get showRemoteWorker(){
    return this.jobService.remoteWorker();
  }

  get clientBillRateEnabled(){
    return this.jobService.clientBillRateEnabled();
  }

  get ratesArray(): UntypedFormArray {
    return this.submissionForm?.get('rates') as UntypedFormArray;
  }

  rateTypeMap = new Map<string, string>([
    ['per_hour', 'Hourly'],
    ['per_day', 'Daily'],
    ['per_month', 'Monthly'],
    ['per_week', 'Weekly'],
    ['per_year', 'Yearly'],
  ]);

  createForm() {
    this.submissionForm = this.fb.group({
      availableStartDate: [null, Validators.required],
      availableEndDate: [null, ''],
      dob: [null, ''],
      stateId: [null, ''],
      sourcingType: [null, ''],
      type: [null, ''],
      comments: [null, ''],
      COVER_LETTER: [null],
      SAMPLE_PORTFOLIO: [null],
      uploads: [null],
      candidate_worked_as: [[]],
      required_qualifications: [null],
      rate_type: [this.rateTypeMap.get(this.jobData?.rate_type || 'per_hour'), [Validators.required]],
      minBillRate: ['', [Validators.required]],
      maxBillRate: ['', [Validators.required]],
      // minPayRate: ['', [Validators.required]],
      // maxPayRate: ['', [Validators.required]],
      markUp: false,
      rateMarkUpValue: [''],
      candidate_sourcing_type: [null, [Validators.required]],
      markUpValue: [{ value: 30, disabled: true }],
      candidatePayRate: [this.offerPayRate, [Validators.required]],
      unique_id: [{ value: this.candidateData?.unique_id, disabled: true }, ''],
      vendorBillRateValue: [this.offerBillRate, [Validators.required]],
      clientBillRateValue: [0, [Validators.required]],
      DefaultRateValue:[],
      notes: [],
      rates: this.fb.array([]),
      custom_fields: this.fb.array([]),
      candidate_type: ['sourced'],
      is_ot_exempt: [false],
      remote_worker: [false],
      shareWorkDetails: [''],
      submitdescription: [null, [Validators.required]]
    });

    if (!this.isBillDriven) {
      this.isDisabled = this.offerPayRate === 0 || this.offerPayRate === null ? true : false;
    }

    if (this.jobData?.is_pre_identified_candidate) {
      this.submissionForm.get('candidate_sourcing_type').disable();
    }
    else {
      this.submissionForm.get('candidate_sourcing_type').enable();
    }

    if (this.programRateModel === 'MARKUP' || this.programRateModel === 'PAY_RATE') {
      //this.getMarkupValidate();
    }

    this.checkAvaialableDates();
    this.submissionForm.get('candidate_sourcing_type').setValue(this.selectedSourceType);
    this.submissionForm.controls.candidatePayRate.valueChanges
    .pipe(
      tap(() => this.submitDisabled = true),
      debounceTime(2000),
      distinctUntilChanged((prev, curr) => {
        this.submitDisabled = prev !== curr
        return prev === curr
      }))
    .subscribe((value:number) => {
        if(this.submissionForm.controls.candidatePayRate.dirty && this.programRateModel === 'PAY_RATE') {
          this.submitDisabled = true;
          if(!this.hideRateAuthority){
            if (value > this.maxPayNum && !this.submission_exceed_max_bill_rate) {
              this.submissionForm.controls.candidatePayRate.setErrors({
                max: `Maximum number can be ${this.maxPayNum}`,
              });
              return;
            } else if (value < this.minPayNum) {
              this.submissionForm.controls.candidatePayRate.setErrors({
                min: `Minimum number can be ${this.minPayNum}`,
              });
              return;
            }
            else if (value <= 0 || value == 0) {
              this.submissionForm.controls.candidatePayRate.setErrors({
                min: `Candidate Pay Rate can not be zero or empty`
              });
              return;
            }
            else {
              this.submissionForm.controls.candidatePayRate.setErrors(null);
            }
        }
          this.calculateRates('payrate');
      }
    });
    this.submissionForm.controls.clientBillRateValue.valueChanges
    .pipe(
      tap(() => this.submitDisabled = true),
      debounceTime(2000),
      distinctUntilChanged((prev, curr) => {
        this.submitDisabled = prev !== curr
        return prev === curr
      }))
    .subscribe((value:number) => {
      if(this.submissionForm.controls.clientBillRateValue.dirty && (this.programRateModel === 'MARKUP' || this.programRateModel === 'BILL_RATE')) {
        if(!this.hideRateAuthority){
          this.submitDisabled = true;
          if (value > this.maxNum && !this.submission_exceed_max_bill_rate) {
            this.submissionForm.controls.clientBillRateValue.setErrors({
              max: `Maximum number can be ${this.maxNum}`,
            });
            return;
          } else if (value < this.minNum) {
            this.submissionForm.controls.clientBillRateValue.setErrors({
              min: `Minimum number can be ${this.minNum}`,
            });
            return;
          }
          else if (value <= 0 || value == 0) {
            this.submissionForm.controls.clientBillRateValue.setErrors({
              min: `Client Bill Rate can not be zero or empty`
            });
            return;
          }
          else {
            this.submissionForm.controls.clientBillRateValue.setErrors(null);
          }
      }
        this.calculateRates('billrate')
      }
    });
    this.submissionForm.controls.vendorBillRateValue.valueChanges
    .pipe(
      tap(() => this.submitDisabled = true),
      debounceTime(2000),
      distinctUntilChanged((prev, curr) => {
        this.submitDisabled = prev !== curr
        return prev === curr
      }))
    .subscribe((val:number) => {
      if(this.submissionForm.controls.vendorBillRateValue.dirty && (this.programRateModel === 'BILL_RATE' || this.programRateModel === 'MARKUP')) {
        this.submitDisabled = true;
        if(!this.hideRateAuthority){
          if (val > this.maxNum && !this.submission_exceed_max_bill_rate ) {
            this.submissionForm.controls.vendorBillRateValue.setErrors({
              max: `Maximum number can be ${this.maxNum}`,
            });
            return;
          } else if (val < this.minNum) {
            this.submissionForm.controls.vendorBillRateValue.setErrors({
              min: `Minimum number can be ${this.minNum}`,
            });
            return;
          }
          else if (val <= 0 || val == 0) {
            this.submissionForm.controls.vendorBillRateValue.setErrors({
              min: `Vendor Bill Rate can not be zero or empty`
            });
            return;
          }
          else {
            this.submissionForm.controls.vendorBillRateValue.setErrors(null);
          }
        }
        this.calculateRates('vendor_rate')
      }
    });

    this.submissionForm.controls.rateMarkUpValue.valueChanges
    .pipe(
      tap(() => this.submitDisabled = true),
      debounceTime(2000),
      distinctUntilChanged((prev, curr) => {
        this.submitDisabled = prev !== curr
        return prev === curr
      }))
    .subscribe((val:number) => {
      this.submissionForm.patchValue({
        rateMarkUpValue : this.accuracy.transform(val, AccuracyConfigEnum.MARKUP_PERCENTAGE,{isEdit: true})
      },{emitEvent:false})
      if(this.submissionForm.controls.rateMarkUpValue.dirty && (this.programRateModel === 'MARKUP' || this.programRateModel === 'PAY_RATE') || this.isCandidateSourcingTypeChanged) {
        this.submitDisabled = true
        this.getMarkupValidate(val);
        this.calculateRates('markup');
      }
    });

  }

  submissionStartDAte(){
    let jobStartDate=new Date(this.jobData?.job_start_date);
    let availableStartDateLimit = this.jobData?.available_start_date_limit?.no;
    const availableStartDate= jobStartDate.setDate(jobStartDate.getDate()-availableStartDateLimit+1);
        return  new Date(availableStartDate);
  }

  getDateAuthority(){
    const isVendor = this.storageService.get('user_type') === 'VENDOR';
    const user_permission = this.storageService.get('user_permission');
    if (isVendor || user_permission?.includes('schedule_interview')) {
      this.datepickerpermission = false;
    }
    else {
      this.datepickerpermission = true;
    }
  }

  getMarkupValidate(value:number) {
    if (value && this.selectedSourceType === 'Sourced') {
      if (value > Number(this.markupConfigObj?.markups?.sourced_markup)) {
        this.submissionForm?.controls?.rateMarkUpValue?.setErrors({
          max: `Maximum number can be ${this.markupConfigObj?.markups?.sourced_markup}`,
        });
        return;
      }
    } else if (value && this.selectedSourceType === 'Payrolled') {
      if (value > Number(this.markupConfigObj?.markups?.payrolled_markup)) {
        this.submissionForm?.controls?.rateMarkUpValue?.setErrors({
          max: `Maximum number can be ${this.markupConfigObj?.markups?.payrolled_markup}`,
        });
        return;
      }
    } else if (value <= 0 || value == 0) {
        this.submissionForm?.controls?.rateMarkUpValue?.setErrors({
          min: `Mark up can not be zero or empty`,
        });
        return;
      }
      else {
        this.submissionForm?.controls?.rateMarkUpValue?.setErrors(null);
      }
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
    let mainPayRate =  +this.submissionForm.get('candidatePayRate')?.value;
    let mainBillRate = +this.submissionForm.get('vendorBillRateValue')?.value;
    const rateMarkupValue = this.submissionForm?.get('rateMarkUpValue')?.value || null;
    if(this.is_ot_exempt){
      this.otRateFactors?.forEach(element => {
        bill_rate_formula = element?.bill_rate;
        pay_rate_formula = element?.pay_rate;

        let billRate = (bill_rate_formula?.length > 1) ? [bill_rate_formula?.find(x => x.rate_type.toUpperCase() == 'BILL_RATE')] : bill_rate_formula;
        let payRate = (pay_rate_formula?.length > 1) ? [pay_rate_formula?.find(x => x.rate_type.toUpperCase() == 'PAY_RATE')] : pay_rate_formula;

        bill_rate_formula = this.getFormula([billRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]);
        pay_rate_formula =  this.getFormula([payRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]);
        this.patchFormula(element, bill_rate_formula, pay_rate_formula);
      });
      const copyFactors = JSON.parse(JSON.stringify((this.payloadRateFactors)));
      this.updateOTFactors(copyFactors);
      copyFactors.forEach(element => {element.markup = rateMarkupValue});
      if(this.costComponentEnabled){
        let stCostComponentValue = this.submissionForm?.get('costComponent')?.value || {};
        stCostComponentValue = this.removeMakupCostCComponentGroupId(stCostComponentValue);
        copyFactors.forEach(element => {element.cost_component = (stCostComponentValue || null)});
      }
      this.payloadRateFactors = copyFactors;
      this.rate_factors_arr = copyFactors;
    }
    else {
        this.noOTRateFactors?.forEach(element => {
        bill_rate_formula = this.getFormula(element?.bill_rate);
        pay_rate_formula = this.getFormula(element?.pay_rate);
        this.patchFormula(element, bill_rate_formula, pay_rate_formula);
      });
      this.rate_factors_arr = this.isRatesUpdated ? this.updatedMarkupRateFactors : this.updateMarkupValues(this.copyPayloadFactors, this.submissionForm.get('rateMarkUpValue')?.value);
      this.payloadRateFactors = this.isRatesUpdated ? this.updatedMarkupRateFactors : this.updateMarkupValues(this.copyPayloadFactors, this.submissionForm.get('rateMarkUpValue')?.value);
      if(this.isRatesUpdated){
        this.payloadRateFactors?.forEach(element => {
          bill_rate_formula = this.getFormula(element?.bill_rate);
          pay_rate_formula = this.getFormula(element?.pay_rate);
          this.patchFormula(element, bill_rate_formula, pay_rate_formula);
        });
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

  changeRemoteWorker(remoteWorker: boolean){
    this.remote_worker = remoteWorker ? true : false;
  }

  patchFormula(element,bill_rate_formula,pay_rate_formula){
   const rateIndex = this.ratesArray?.controls?.findIndex(v => v?.get('rate_factor')?.value?.toLowerCase() === element?.abbreviation.toLowerCase())
    if (rateIndex > -1) {
      this.ratesArray?.at(rateIndex)?.patchValue({
        bill_rate_formula: bill_rate_formula,
        pay_rate_formula: pay_rate_formula
      });
    }
  }
  checkAvaialableDates() {
    this.submissionForm.get('availableEndDate').valueChanges.subscribe(data => {
      this.validateDates(data);
    });
    this.submissionForm.get('availableStartDate').valueChanges.subscribe(data => {
      this.validateDates(data);
    });
  }


  validateDates(data) {
    if (data && this.submissionForm.controls['availableEndDate'].value) {
      let available_start_date = this.datePipe.transform(this.submissionForm.controls['availableStartDate'].value,DATE_FORMAT?.FORMATMDY,null,null,true,this.PrefferedDateFormat);
      let available_end_date = this.datePipe.transform(this.submissionForm.controls['availableEndDate'].value,DATE_FORMAT?.FORMATMDY,null,null,true,this.PrefferedDateFormat);

      if (
        new Date(available_start_date) >
        new Date(available_end_date)
      ) {
        if (this.isAvailableEndDateDisabled) {
          this.invalidDateMesg = 'Please select start date less than end date'
        } else {
          this.invalidDateMesg = 'Available End Date cannot be before Available Start Date.';
        }
      } else {
        this.invalidDateMesg = null;
      }
    }
  }

  detailsLoaded = false;
  jobCurrency = 'USD';
  jobTemplateID;
  jobCategory;
  loadBasicDetails() {
    // this.getProgramModules();
    // this.getProgramSourcemodels();

    forkJoin([this.CandidateDetails, this.JobDetails]).subscribe({
      next: (data: any) => {
        this.candidateData = data[0].candidate;
        this.candidateData.full_name = this.candidateData?.middle_name ? `${this.candidateData.first_name} ${this.candidateData.middle_name} ${this.candidateData.last_name}`
        : `${this.candidateData.first_name} ${this.candidateData.last_name}`;
        this.candidateData.full_name = this.jobService.toTitleCase(this.candidateData.full_name);
        this.candidatePrimaryAddress = this.candidateData?.addresses?.find(x => x.type.toLowerCase() === 'primary');
        let jobData = data[1]?.job;
        this.jobData = JSON.parse(JSON.stringify(jobData));
        this.jobRates = JSON.parse(JSON.stringify(jobData?.rates));
        this.oTRates = JSON.parse(JSON.stringify(jobData?.rates));
        if(this.jobData?.available_start_date_limit?.is_enabled){
          this.options2['enabledDateRanges'] =  [{ start: this.submissionStartDAte() }]
        }
        this.programRateModel = this.programDetails?.config?.is_rate_model_and_markup_from_job_hierarchy ? this.jobData?.rate_model : this.programDetails?.config?.program_model;
        if(this.programRateModel === 'PAY_RATE'){
          this.combineSourceAndModulesRequests()
        }
        this.isResumeRequired = this.currentProgram?.config?.candidate?.is_resume_mandatory || this.jobData?.resume_mandatory;
        this.candidateResumeData = { name: this.candidateData?.resume, raw: null, ext: '', resume_url: this.candidateData?.resume_url, time: this.candidateData?.resume_upload_date, size: this.candidateData?.resume_filesize };
        this.resumeData = {...this.candidateResumeData};
        if(!this.candidateData?.resume && this.isResumeRequired) {
          this.resumeError = true;
        }

        // this.PrefferedDateFormat = this.jobData?.hierarchy[0]?.preferred_date_format || this.programDetails?.defaultDateFormat;
        this.PrefferedDateFormat =  this.programDetails?.defaultDateFormat?.toUpperCase();
        this.selectedSourceType = this.jobData?.is_pre_identified_candidate ? 'Payrolled' : 'Sourced';
        this.isPredIdCandidate = this.jobData?.is_pre_identified_candidate ? true :false;
        this.jobCurrency = this.jobData?.currency?.toUpperCase();
        this.costComponentEnabled = this.costComponentEnabled && this.jobData?.allow_express_offer ? false : this.costComponentEnabled;
        this.custom_fields = this.jobData?.custom_fields;
        this.jobProgramLaborCategory = this.jobData?.program_industry[0]?.id;
        this.jobHierarchy = this.jobData?.hierarchy[0]?.id;
        this.jobWorkLocation = this.jobData?.location?.id;
        this.jobTemplateID =  this.jobData?.template;
        this.jobCategory = this.jobData?.category;
        if(this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP'){
          this.getMarkup();
        }
        this.getMSPFee();
        this.getRateFactor();
        if (!!!this.jobData) {
          // this.alert.error('Problem while loading job details..');
          this.showError('Problem while loading job details..');
          setTimeout(() => this.location.back(), 1000);
        }

        if (!!!this.candidateData) {
          // this.alert.error('Problem while loading candidate details..');
          this.showError('Problem while loading candidate details..');
          setTimeout(() => this.location.back(), 1000);
        }

        this.skillSets = [];
        const skills =
          this.jobData?.qualifications?.filter(q => q.qualification_type && q.qualification_type?.code?.toLocaleLowerCase() === 'skill') ||
          [];

        skills?.forEach(skill => {
          skill?.values?.forEach(skill => {
            this.skillSets?.push({
              ...skill,
              selectedValue: null,
            });
          });
        });
        this.is_ot_exempt = this.jobData?.is_ot_exempt;
        this.getProgramDetails();
        this.createForm();
        this.setFormDataFromJodDetails(this.jobData);

        let start_date1: any = this.datePipe.transform(this.jobData?.start_date_timestamp,this.PrefferedDateFormat,null,null,true);
        let end_date1: any = this.datePipe.transform(this.jobData?.end_date_timestamp,this.PrefferedDateFormat,null,null,true);
        this.submissionForm.patchValue({
          availableStartDate:
            start_date1 === ''
              ? ''
              : start_date1 ,
          availableEndDate:
           end_date1=== ''
            ? ''
          : end_date1
        })
        if (this.jobData?.hierarchy) {
          this.getDetailOfHierarchy();
        }
      },
      error: (error) => {
        // this.alert.error('Problem while loading job details..');
        this.showError('Problem while loading job details..');
        setTimeout(() => this.location.back(), 1000);
      },
      complete: () => {
        this.detailsLoaded = true;
      },
  });

  }
  getProgramDetails() {
    let url = `/configurator/programs/${this.programId}`
    this.jobService.get(url).subscribe((data: any) => {
      // this._loader.hide();
      if (data && data?.program) {
        let programDetails = data.program;
        this.isBillDriven = programDetails?.config?.billing?.consolidated_billing;

        if (this.programRateModel == 'MARKUP') {
          if(this.user_type?.toLowerCase() === 'vendor' || this.user_type?.toLowerCase() === 'super_org'){
            this.submissionForm.controls['vendorBillRateValue'].enable();
            this.submissionForm?.controls['candidatePayRate'].disable();
            this.submissionForm?.patchValue({
              vendorBillRateValue: this.accuracy.transform(0, AccuracyConfigEnum.RATE, { isEdit: true })
            });
          }
          else{
            this.submissionForm?.controls['candidatePayRate'].disable();
            this.submissionForm.controls['vendorBillRateValue'].disable();
            this.submissionForm.controls['clientBillRateValue'].enable();
          }
        }
        else if (this.programRateModel == 'PAY_RATE') {
          this.submissionForm.controls['candidatePayRate'].enable();
          this.submissionForm.controls['vendorBillRateValue'].disable();
          this.submissionForm.controls['clientBillRateValue'].disable();
          if(this.user_type?.toLowerCase() === 'msp'){
            this.submissionForm.controls['clientBillRateValue'].disable();
          }
        }
        else {
          this.submissionForm?.patchValue({
            candidatePayRate: this.accuracy.transform(0, AccuracyConfigEnum.RATE, { isEdit: true })
          });
          this.submissionForm?.controls['candidatePayRate'].disable();
          if(this.user_type.toLowerCase() === 'msp' || this.clientBillRateEnabled){
            this.submissionForm.controls['vendorBillRateValue'].disable();
          }
          this.submissionForm?.get('candidatePayRate').clearValidators();
          this.submissionForm?.get('candidatePayRate').updateValueAndValidity();
        }
        this.isDisabled = false;
      }
    });
  }

  programType: any;
  getDetailOfHierarchy() {
    const url = `/configurator/programs/${this.programId}/hierarchy/${this.jobData?.hierarchy[0]?.id}`
    this.jobService.get(url)
      .subscribe((res: any) => {
        const { hierarchy } = res;
        this.programType = hierarchy?.program_type;
      })
  }

  setFormDataFromJodDetails(jobdetails = { rate_model: null }) {
        if(this.programRateModel === 'PAY_RATE'){
          this.submissionForm.patchValue({
            maxBillRate: this.accuracy?.transform(jobdetails['max_pay_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit:true }),
            minBillRate: this.accuracy?.transform(jobdetails['min_pay_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit:true }),
          });
        }
        else{
          if(this.user_type.toLowerCase() === 'vendor') {
            if(this.clientBillRateEnabled){
              this.submissionForm.patchValue({
                maxBillRate: this.accuracy?.transform(jobdetails['max_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
                minBillRate: this.accuracy?.transform(jobdetails['min_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
              });
            }else{
              this.submissionForm.patchValue({
                maxBillRate: this.accuracy?.transform(jobdetails['vendor_max_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
                minBillRate: this.accuracy?.transform(jobdetails['vendor_min_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
              });
            }
          }
          else {
            this.submissionForm.patchValue({
              maxBillRate: this.accuracy?.transform(jobdetails['max_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
              minBillRate: this.accuracy?.transform(jobdetails['min_bill_rate'] ?? 0, AccuracyConfigEnum.RATE, { isEdit: true }),
            });
          }
      }
      if(this.programRateModel === 'PAY_RATE'){
        this.minPayNum = +this.submissionForm.controls.minBillRate.value;
        this.maxPayNum = +this.submissionForm.controls.maxBillRate.value;
      }
      else{
        this.minNum = +this.submissionForm.controls.minBillRate.value;
        this.maxNum = +this.submissionForm.controls.maxBillRate.value;
      }

    this.submission_exceed_max_bill_rate = jobdetails['is_submission_exceed_max_bill_rate'];
    this.submissionForm?.updateValueAndValidity();
  }

  checkConfig(){
    return this.jobService?.checkConfig(this.programRateModel,this.clientBillRateEnabled,this.user_type)
  }

  get CandidateDetails() {
    return this.candidateService.getCandidateDetail(this.candidateId);
  }

  getCandidateDetails() {
    return this.candidateService.getCandidateDetail(this.candidateId);
  }

  get JobDetails() {
    return this.jobService.getJobs(this.currentJobId);
  }
  setDocsToformData(type, data) {
    const value = {
      type: type,
      file_name: data?.name,
      raw: data?.raw,
      file_size : data?.file_size
    };
    if (data) {
      this.submissionForm.controls[type].setValue(value);
    } else {
      this.submissionForm.controls[type].setValue(null);
    }
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

  getAllRemoteData(event){
    if(event){
      if(this.costComponentEnabled && this.programRateModel === 'PAY_RATE'){
        this.getCostComponentGroupId(event)
      }
    }
  }

  remoteAPIErrors(event){
    if(event){
      this.showError(event);
    }
  }

  getSourcingType(value) {
    this.selectedSourceType = value;
    this.isDefaultSourcingType = false;
    this.isCandidateSourcingTypeChanged = true;
    this.getMarkup();
  }

  getValidatedForm(){
      this.countryValidated = (this.showRemoteWorker && this.remote_worker) ? this.countryValidated : true;
  }

  handleTaxFormValueChange(event){
    if(event){
      this.taxAdjustment = event;
      this.submitDisabled = event?.isTaxValid;
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

  saveSubmitCandidate() {
    this.isRequired = true;
    this.isLoader = true;
    this.isSubmittedInvalid=true;
    this.isSubmitDescription=true;

    this.getValidatedForm();
    if(!this.resumeData || !(this.resumeData?.name)){
      this.resumeError = true;
    }
    const isValid =
      this.submissionForm?.controls['availableStartDate'].valid &&
      !this.invalidDateMesg &&
      !(this.resumeError && this.isResumeRequired);
    if (!isValid) {
      // this.alert.error('Please fill the mandatory field/s.');
      this.showError("Please fill the mandatory field/s.");
      this.isLoader = false;
      return;
    }
    if(this.disableForm || !this.countryValidated){
      // this.alert.error('Please fill the mandatory field/s');
      this.showError("Please fill the mandatory field/s.")
      this.isLoader = false;
      return;
    }
    if (this.programRateModel == 'MARKUP' || this.programRateModel == 'PAY_RATE') {
      if(!this.submissionForm?.controls['rateMarkUpValue']?.value){
        this.showError("Please fill the mandatory field/s.")
        this.isLoader = false;
        return;
      }
      if(!this.markupConfigObj || (!this.markupConfigObj?.markups?.sourced_markup && !this.markupConfigObj?.markups?.payrolled_markup)){
        this.showError("No markup value set. Please contact the admin.")
        this.isLoader = false;
        return;
      }
    }
    if(this.programRateModel === 'PAY_RATE'){
      if (+this.submissionForm.controls.candidatePayRate.value <= 0) {
        this.submissionForm.controls.candidatePayRate.setErrors({
          min: `PayRate can not be zero or empty`,
        });
        return;
      }
    }

    if(this.submissionForm?.value['COVER_LETTER']?.file_size === false || this.submissionForm?.value['SAMPLE_PORTFOLIO']?.file_size === false){
      this.showError("File size must be less than 10 MB");
      this.isLoader = false;
      return;
    }
    const documents = [];

    if (this.submissionForm?.value['COVER_LETTER']) {
      documents.push(this.submissionForm.value['COVER_LETTER']);
    }

    if (this.submissionForm?.value['SAMPLE_PORTFOLIO']) {
      documents.push(this.submissionForm.value['SAMPLE_PORTFOLIO']);
    }

    this.submissionForm?.controls['uploads'].setValue(documents.length > 0 ? documents : null);

    const skillSets = this.skillSets
      ? this.skillSets
          .filter(s => s.selectedValue)
          .map(s => ({
            qualification_id: s.id,
            rating: s.selectedValue,
          }))
      : [];

    const formValue = this.submissionForm.getRawValue();
    let questionList = new Array();

    this.updatedQuestion?.forEach(element => {
      if (element?.values) {
        this.validate = true;
        questionList.push({ question_id: element?.custom_field_id, response: element?.values.toString() });
      } else {
        if (element?.is_required) {
          element.answer = null;
          this.validate = false;
        } else {
          this.validate = true;
        }
      }
    });
    formValue.rates.push({
      bill_rate: this.clientBillRate,
      billable:this.stRateFactor?.billable,
      applicable: true,
      name: this.stRateFactor?.name,
      client_bill_rate:this.clientBillRate,
      pay_rate: formValue.candidatePayRate,
      default: formValue.DefaultRateValue,
      rate_factor: this.stRateFactor?.abbreviation,
      abbreviation: this.stRateFactor?.abbreviation,
      markup: formValue.rateMarkUpValue || 0,
      id: this.stRateFactor?.id,
      vendor_bill_rate: this.vendorBillRate || null,
      cost_component: formValue?.costComponent
    });
    formValue.rates = formValue.rates.map(ra => {
      //payloadBillRate = this.is_ot_exempt ? this.clientBillRate : ra.client_bill_rate;
      ra.bill_rate = ra?.bill_rate;
      ra.pay_rate = ra.pay_rate;
      ra.markup = ra.markup;
      ra.cost_component = ra?.cost_component
      ra.applicable = ra.applicable;
      ra.vendor_bill_rate = ra.vendor_bill_rate;
      ra.default = ra.default;
      delete ra.client_bill_rate;
      delete ra.enable_bill_rate_edit;
      delete ra.enable_pay_rate_edit;
      return ra;
    });
    formValue.rates =  formValue.rates.filter(rate => rate.billable);
    const rateMarkupValue = this.submissionForm?.get('rateMarkUpValue')?.value || null;

  if(this.markupByRateTypeEnabled){
      if(!this.isRatesUpdated){
        formValue.rates.map(rate => {
          rate.markup = rateMarkupValue;
          return rate;
        });
        this.payloadRateFactors?.map(rate => {
          rate.markup = rateMarkupValue;
          return rate;
        });
      }
  }
  else{
    formValue.rates = this.updateRateMarkup(formValue?.rates, 'st', rateMarkupValue);
    this.payloadRateFactors = this.updateRateMarkup(this.payloadRateFactors, 'st', rateMarkupValue);
  }

  if(this.costComponentEnabled && this.costComponentGroupDetails && this.costComponentGroupDetails?.length !== 0 && this.programRateModel === 'PAY_RATE'){
    if(!this.isRatesUpdated){
      this.deleteFieldsinCostComponent(this.payloadRateFactors, 'component_name');
    }
    formValue?.rates?.map(rate => { rate.cost_component.cost_component_group_id = this.cost_component_group_id; return rate;});
  }
  else{
    formValue.rates.map(rate => { rate.cost_component = {}; return rate;});
    this.payloadRateFactors?.map(rate => { rate.cost_component = {}; return rate; });
  }

  if(this.is_ot_exempt){
    const copyFactors = JSON.parse(JSON.stringify((this.payloadRateFactors)));
    this.updateOTFactors(copyFactors);
    copyFactors.forEach(element => {element.markup = rateMarkupValue});
    this.payloadRateFactors = copyFactors;
    formValue.rates.map(rate => {rate.markup = rateMarkupValue;return rate;});
  }
  if (this.customFieldsFormData && this.customFieldsFormData?.length > 0) {
      let allCustomFields = [];
      this.customFieldsFormData?.forEach(field => {
        let custom_value = {};
        if (field?.values != undefined && field?.values != null) {
          custom_value[field?.ref_column] = field?.values;
          custom_value['type'] = field?.custom_field_type
        }
        allCustomFields.push(custom_value);
      });

      formValue.custom_fields = allCustomFields.filter( element => {
        if (Object.keys(element).length !== 0) {
          return true;
        }
        return false;
      });
    }
    if (this.programRateModel == 'MARKUP' || this.programRateModel == 'PAY_RATE') {
      this.rateMarkup = Number(formValue.rateMarkUpValue);
    }
    else{
      this.rateMarkup = 0;
    }
    const remote_worker_details = this.remote_worker_details;
    const requestObj = {
      candidate_id: this.candidateId,
      // this is for time being Hard coded for null values  --> candidate.vendor its vendor ordanization id
      vendor_id: this.candidateData?.vendor?.id,
      available_start_date: this.datePipe.transform(formValue.availableStartDate,DATE_FORMAT?.FORMATMDY,null,null,true,this.PrefferedDateFormat),
      available_end_date: this.datePipe.transform(formValue.availableEndDate,DATE_FORMAT?.FORMATMDY,null,null,true,this.PrefferedDateFormat),
      candidate_rehire_details: formValue.shareWorkDetails,
      candidate_worked_as: formValue.candidate_worked_as,
      is_rehire: this.re_hire_candidate,
      comments: formValue.comments,
      rate_type: formValue?.rate_type?.toUpperCase(),
      rate_markup: this.rateMarkup,
      ot_exempt: this.is_ot_exempt, // Mark-up filed on UI??
      candidate_sourcing_type: this.selectedSourceType,
      is_fees_included:this.isfeesIncluded,
      rates: formValue.rates,
      custom_fields: formValue.custom_fields,
      estimated_hours: this.candidateData.preferences.estimated_hours, // ??cnadidate.preferences.estimated_hours ??
      uploads: documents.length > 0 ? documents : null,
      // this is as well
      required_qualifications: skillSets, // jobData.qualifications.find(q => q.qualification_type === "skill")
      questionnaire_responses: questionList,
      rate_model: this.programRateModel.toUpperCase(),
      remote_worker: this.remote_worker,
      remote_worker_details: remote_worker_details,
      rate_input:this.rateInputForExpress,
      taxes: this.taxAdjustment?.tax || null,
      adjustment_fee: this.taxAdjustment?.adjustment_fee || this.jobService?.getAdjustmentPayload(this.taxAdjustment?.adjustment_fee),
      rate_factors_info: this.payloadRateFactors,
      markup_by_rate_type: this.markupByRateTypeEnabled,
      is_cost_component: this.programRateModel === 'PAY_RATE' ? this.costComponentEnabled : false,
      cost_component_config : this.cost_component_config,
      fee: this.fee_info,
    };
      if (requestObj?.required_qualifications?.length == 0) {
        delete requestObj.required_qualifications;
      }
      if (requestObj?.questionnaire_responses?.length == 0) {
        delete requestObj.questionnaire_responses;
      }
      if (requestObj?.custom_fields && requestObj.custom_fields?.length == 0) {
        delete requestObj.custom_fields;
      }
      if(this.programRateModel == "BILL_RATE") {
        delete requestObj.candidate_sourcing_type;
      }

      if(!this.remote_worker){
        delete requestObj.remote_worker_details;
      }

      if(!this.showRemoteWorker){
        delete requestObj.remote_worker;
      }

      if(!this.currentProgram?.config?.is_custom_tax_on_assignment || !this.hasManageTaxPermission || !this.isShowTax){
        delete requestObj.taxes;
      }
      if(!this.currentProgram?.config?.is_adjustment_fee_allowed){
        delete requestObj.adjustment_fee;
      }
      this.logs= undefined;
      this.disableResumeDelete = true;
      if (!this.submission_id) {
      this.jobService
        .saveSubmitCandidate({ candidates: [requestObj] }, this.currentJobId)
        .subscribe({
          next: (data) => {
            this.isDisabled = false;
            this.isLoader = false;
            this.alert.success('Candidate Submitted Successfully.');
            this.jobService.loadJob(`${this.currentJobId}`).subscribe({
              next: (data) => {
              setTimeout(() => {
                this.disableResumeDelete = false;
                this.router.navigateByUrl(`jobs/details/job-details/${this.currentJobId}/submitted-candidate?templateId=${this.templateId ?? ''}`);
              }, 1000);
            },
            error: (err) => {
              setTimeout(() => {
                this.disableResumeDelete = false;
                this.router.navigateByUrl(`jobs/details/job-details/${this.currentJobId}/submitted-candidate?templateId=${this.templateId ?? ''}`);
              }, 1000);
            },
          });
        },
        error: (res) => {
          this.isDisabled = false;
          this.disableResumeDelete = false;
          // this.alert.error(res.error.error.message);
          this.isLoader = false;
          if(res?.error?.data?.candidates?.[0]?.hasOwnProperty('details')){
            this.showOverlapWarning=true;
            this.assignmentOverlapData = res?.error?.data?.candidates?.[0]?.details || [];
          }
          else{
            this.showError(res);
          }
        },
    });
    } else {
      requestObj['status'] = this.programDetails?.config?.submission?.is_shortlisting_enabled ? 'PENDING_SHORTLIST' : 'SUBMITTED',
      this.jobService
        .reSubmitCandidate(requestObj, this.currentJobId, this.candidateId, this.submission_id)
        .subscribe({
          next: (data) => {
            this.isDisabled = false;
            this.isLoader = false;
            this.alert.success('Candidate Resubmitted Successfully.');
            this.jobService.loadJob(`${this.currentJobId}`).subscribe({
              next: (data) => {
              setTimeout(() => {
                this.disableResumeDelete = false;
                this.router.navigateByUrl(`jobs/details/job-details/${this.currentJobId}/submitted-candidate`);
              }, 1000);
            },
            error: (err) => {
              setTimeout(() => {
                this.disableResumeDelete = false;
                this.router.navigateByUrl(`jobs/details/job-details/${this.currentJobId}/submitted-candidate`);
              }, 1000);
            },
          });
        },
        error: (res) => {
          this.isDisabled = false;
          this.disableResumeDelete = false;
          // this.alert.error(res.error.error.message);
           this.showError(res);
          this.isLoader = false;
        },
      });
    }
  }

  goBacktoPrevRoute() {
    this.location.back();
  }

  certificates = [];
  CertificateAddedHandler($event) {
    if ($event.isEdit) {
      this.certificates[$event.clickedIndex] = $event.payload;
    } else {
      this.certificates.push($event.payload);
    }
  }
  credentials = [];
  CredentialsAddedHandler($event) {
    if ($event.isEdit) {
      this.credentials[$event.clickedIndex] = $event.payload;
    } else {
      this.credentials.push($event.payload);
    }
  }
  specializations = [];
  SpecializationAddedHandler($event) {
    if ($event.isEdit) {
      this.specializations[$event.clickedIndex] = $event.payload;
    } else {
      this.specializations.push($event.payload);
    }
  }
  vaccinations = [];
  VaccinationAddedHandler($event) {
    if ($event.isEdit) {
      this.vaccinations[$event.clickedIndex] = $event.payload;
    } else {
      this.vaccinations.push($event.payload);
    }
  }
  edications = [];
  EducationAddedHandler($event) {
    if ($event.isEdit) {
      this.edications[$event.clickedIndex] = $event.payload;
    } else {
      this.edications.push($event.payload);
    }
  }
  skills = [];
  SkillAddedHandler($event) {
    if ($event.isEdit) {
      this.skills[$event.clickedIndex] = $event.payload;
    } else {
      this.skills.push($event.payload);
    }
  }

  get isUserSuperAdmin() {
    return this.userPermissionService.isUserSuperAdmin();
  }

  get hasEditPermission() {
    return this.storageService?.get('user_permission')?.includes('update_rate_factors_on_submission') ? true : false;
  }

  get hasManageTaxPermission() {
    return ((this.storageService?.get('user_permission')?.includes('manage_tax') || this.taxAdjustment?.tax) && this.storageService?.get('user_permission')?.includes('view_tax')) ? true : false;
  }

  get checkToggleValue() {
    if (this.isUserSuperAdmin && this.isBillDriven) {
      return true;
    } else if (this.isUserSuperAdmin || this.hasEditPermission) {
      return false;
    } else {
      return true;
    }
  }

  get createOfferFormControls() {
    return this.submissionForm.controls;
  }

  getMSPFee(){
    let payload = {
      hierarchy_id: this.jobData?.hierarchy[0]?.id,
      vendor_id: this.candidateData?.vendor?.id,
      industry_id : this.jobData?.program_industry[0]?.id
    }
    this.jobService.getMspFee(payload.hierarchy_id,payload.industry_id,payload.vendor_id).subscribe({
        next: (data: any) => {
        this.submitDisabled = false;
        this.fee_info = data;
        delete this.fee_info?.trace_id;
        let msp_fee = data?.msp_fee;
        this.mspFee = msp_fee?.amount_value;
        this.amount_type = msp_fee?.amount_type;
        this.applicable_on = msp_fee?.applicable_on;
        this.funded_by = msp_fee?.funded_by;
        this.fee_details = data?.fee_details;
        },
        error: (err) => {
          // this.alert.error(errorHandler(err));
          this.showError(err?.error?.detail);
          this.submitDisabled = true;
        },
      });
    }


  calculateRates(key) {
    let mainPayRate =  this.submissionForm.get('candidatePayRate')?.value;
    let vendorBillRate = this.submissionForm.get('vendorBillRateValue')?.value;
    let clientBillRate = this.submissionForm.get('clientBillRateValue')?.value;
    const adjustedMarkup = this.submissionForm.get('rateMarkUpValue')?.value || 0;
    let vendorMarkup = this.submissionForm?.value?.rateMarkUpValue || 0;
    //const max_bill_rate = Number(this.submissionForm.get('maxBillRate')?.value)
    //const min_bill_rate = Number(this.submissionForm.get('minBillRate')?.value);
    const max_bill_rate = 0;
    const min_bill_rate = 0;
    let rate_model = this.rateModelObj[this.programRateModel];
    const payload = {
      hierarchy: this.jobHierarchy || '',
      rate_model: rate_model,
      adjusted_markup: adjustedMarkup,
      vendor_markup: vendorMarkup,
      client_bill_rate: clientBillRate,
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
      fee_details: this.fee_info?.fee_details,
      is_cost_component : rate_model?.toLowerCase() === 'payrate' ? this.costComponentEnabled : false
    }
    this.rateInputForExpress = payload.rate_input;
    let rate_factors_payload = [];
    //this.rate_factors_arr?.map(x => rate_factors_payload.filter(a => a.abbreviation == x.abbreviation).length > 0 ? null : rate_factors_payload.push(x));
    this.rate_factors_arr?.map((x) => {
      if (rate_factors_payload?.filter(a => a?.abbreviation == x?.abbreviation)?.length === 0){
        if (!x?.markup) x.markup = adjustedMarkup
        rate_factors_payload?.push(x)
      }
    })
    payload['rate_factors'] = rate_factors_payload;

    if ((key === 'billrate' && vendorBillRate === null) || (key === 'payrate' && mainPayRate === null)) {
      return;
    }

    if(!this.submissionForm.controls.rateMarkUpValue.valid){
      return;
    }

    if(this.programRateModel.toLowerCase() === 'pay_rate'){
      if(!this.submissionForm.controls.candidatePayRate.value || this.submissionForm.controls.candidatePayRate.value <=0 ||
        !this.createOfferFormControls.candidatePayRate.valid){
        return;
      }
    }

    if(this.user_type.toLowerCase === 'vendor') {
      if(this.programRateModel.toLowerCase() === 'bill_rate' || this.programRateModel.toLowerCase() === 'markup' ){
        if(!this.submissionForm.controls.vendorBillRateValue.value || this.submissionForm.controls.vendorBillRateValue.value <=0 || !this.submissionForm.controls.vendorBillRateValue.valid){
          return;
        }
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

    if(payload.msp_fee_value === null || payload.msp_fee_value === undefined){
      return false;
    }
    this.candidateService.post(`/core-money/programs/${this.programId}/rate-model`, payload)
    .subscribe({
      next: (res: any) => {
      const { data } = res;
      this.submitDisabled = false;
      this.isfeesIncluded = data?.is_fees_included;
      const rateObj = data?.rate;
      for (var prop in rateObj) {
        const ele = rateObj[prop];
        if(prop == 'regular'){
          this.vendorBillRate = ele?.vendor_rate;
          this.clientBillRate = ele?.billrate;
          this.submissionForm.patchValue({
            DefaultRateValue: ele?.default,
            clientBillRateValue: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
            vendorBillRateValue: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
            candidatePayRate: this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
            costComponent: ele?.cost_component
        }, {emitEvent: false})
        }
        const arrayValues = this.ratesArray.value;
        const rateIndex = arrayValues.findIndex(r => r.rate_factor.toLowerCase() === prop);
        if (rateIndex > -1) {
              this.ratesArray?.at(rateIndex)?.patchValue({
              bill_rate: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, { isEdit: true }),
              pay_rate:  this.accuracy.transform(ele?.payrate, AccuracyConfigEnum.RATE, { isEdit: true }),
              vendor_bill_rate: this.accuracy.transform(ele?.vendor_rate, AccuracyConfigEnum.RATE, { isEdit: true }),
              client_bill_rate: this.accuracy.transform(ele?.billrate, AccuracyConfigEnum.RATE, {isEdit: true}),
              default: ele?.default,
              cost_component: ele?.cost_component
            }, {emitEvent: false});

        }
        if(this.costComponentEnabled){
          this.jobService?.updateCostComponentValues(rateObj,this.submissionForm,this.ratesArray,this.payloadRateFactors)
        }
      }
      this.submitDisabled = false;
    },
    error: (err) => {
      // this.alert.error(errorHandler(err));
      this.showError(err);
      this.submitDisabled = true;
    }
  }
  );
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

  getProgramConfiguration(type) {
    this.jobService.getProgramConfig(type).subscribe({
      next: (data: any) => {
        if (data) {
          if (type == 'vendor_markup') {
            this.markupConfig = data.config.markup;
            this.markupConfigOriginal = data.config.markup;
          } else if (type == 'rate_factor') {
            this.rateConfig = JSON.parse(data.config);
            this.clientOverTimeBillRateFactor = this.rateConfig.rate_factors[0].rate_factors.filter(
              r => r.applies_to === 'VENDOR',
            )[0].rate_factor;
            this.clientDoubleTimeBillRateFactor = this.rateConfig.rate_factors[1].rate_factors.filter(
              r => r.applies_to === 'VENDOR',
            )[0].rate_factor;

            this.clientOverTimePayRateFactor = 1.5;
            this.rateConfig.rate_factors[0].rate_factors.filter(r => r.applies_to === 'CANDIDATE')[0].rate_factor;
            this.clientDoubleTimePayRateFactor = 2;
            this.rateConfig.rate_factors[1].rate_factors.filter(r => r.applies_to === 'CANDIDATE')[0].rate_factor;
          }
        }
      },
      error: (err) => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }

  getCandidateDetailsById() {
    let url = `${this.baseURL}/programs/${this.programId}/jobs/${this.currentJobId}/candidates/${this.candidateId}`;
    this.candidateService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          this.submission_id = data?.candidate?.submission_id;
          this.candidateCustomfields = data?.candidate?.custom_fields;
        }
      },
      error: (err) => {
        /// this.alert.error(errorHandler(err));
      },
  });
  }

  getRateFactor() {
    // this.candidateData.vendor?.id
    let url = `/configurator/programs/${this.programId}/rate-factors?is_enabled=True&hierarchy=${this.jobHierarchy}`;
    const rateHttp = this.candidateService.get(url).pipe(
      catchError(err => of({})),
    );
    forkJoin([rateHttp])
      .subscribe((res: any) => {
        // rate factor
        let { rate_factors } = res[0]?.rate_factors || [];
        rate_factors = res[0]?.rate_factors || [];
        let configSTRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
        let ratesfromConfig = rate_factors;
        this.ratesConfiguration = rate_factors;
        if (this.isRatesFromJob) {
          rate_factors = this.jobRates;
        }
        if (rate_factors) {
          this.rateFactor = JSON.parse(JSON.stringify(rate_factors));
          this.otRateFactors = JSON.parse(JSON.stringify(rate_factors));
          this.noOTRateFactors = [...rate_factors];
          let stRate = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() == 'st')[0];
          this.stRateFactor = stRate || configSTRate;
          this.rateFactor = rate_factors?.filter(rate=> rate?.abbreviation?.toLowerCase() !== 'st');
          this.rate_factors_arr = this.jobService?.createLocalRateFactorArrForUpdation(this.rateFactor, this.ratesConfiguration);
          this.rateFactor = this.jobService?.rearrangeRates(this.rateFactor);
          this.payloadRateFactors = this.jobService?.getRateFactorInfoForPayload(rate_factors,this.ratesConfiguration);
          this.copyPayloadFactors = JSON.parse(JSON.stringify(this.payloadRateFactors));
          this.rateFactor?.forEach(element => {
            if(element?.abbreviation === 'ST'){
              this.stFlatAdustment = element?.bill_rate[0]?.adjustment;
            }

          const rateForm = this.fb.group({
            rate_factor: [element?.abbreviation?.toUpperCase() ?? element?.rate_factor?.toUpperCase()],
            abbreviation: [element?.abbreviation?.toUpperCase()],
            name: [element?.name],
            applicable: true,
            id:element?.id,
            billable: element?.billable,
            bill_rate: [{ value: 0.00, disabled: true },Validators.required],
            pay_rate: [{ value: 0.00, disabled: true },Validators.required],
            markup: null,
            enable_bill_rate_edit: false,
            enable_pay_rate_edit: false,
            vendor_bill_rate: [{ value: 0.00, disabled: true },Validators.required],
            client_bill_rate:null,
            default:null,
            bill_rate_formula: this.getFormula(element?.bill_rate),
            pay_rate_formula: this.getFormula(element?.pay_rate),
          },{
            validators: [this.payRateValidator]
          });
          let formArray = this.submissionForm.get('rates') as UntypedFormArray;
          formArray.push(rateForm);
        });
        }
        if(this.rateFactor.length === 0 || this.rateFactor?.find(x => x.abbreviation != 'ST')){
          this.stFlatAdustment = ratesfromConfig?.find(element => element?.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
        }
        else{
          this.stFlatAdustment = ratesfromConfig?.find(element => element?.abbreviation == 'ST')?.bill_rate[0]?.adjustment ?? null;
        }

        if(this.jobData?.is_ot_exempt){
          let bill_rate_formula;
          let pay_rate_formula
          this.otRateFactors?.forEach(element => {
            bill_rate_formula = element?.bill_rate;
            pay_rate_formula = element?.pay_rate;
            let billRate = (bill_rate_formula?.length > 1) ? [bill_rate_formula?.find(x => x.rate_type.toUpperCase() == 'BILL_RATE')] : bill_rate_formula;
            let payRate = (pay_rate_formula?.length > 1) ? [pay_rate_formula?.find(x => x.rate_type.toUpperCase() == 'PAY_RATE')] : pay_rate_formula;
            bill_rate_formula = this.getFormula([billRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]);
            pay_rate_formula =  this.getFormula([payRate?.find(x => x.factor = this.is_ot_exempt ? 1 : x.factor)]);
            this.patchFormula(element, bill_rate_formula, pay_rate_formula);
          });
        }
        if(this.costComponentEnabled && this.programRateModel === 'PAY_RATE'){
          this.getCostComponentGroupId();
        }
      })
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  get rateDetailsEditableFactors(): boolean {
    return this.checkAuthorization('manage_rate_type_offer')
  }

  get rateDetailsEditableMarkup(): boolean {
    return  this.checkAuthorization('manage_markup');
  }

  get rateDetailsEditableCostComponent():boolean {
    return this.costComponentEnabled && this.checkAuthorization('manage_cost_component');;
  }

  get markupByRateTypeEnabled(): boolean {
   let markupbyRateType = this.programDetails?.config?.markup_by_rate_type || false;
   return (markupbyRateType && this.jobData?.allow_express_offer  || this.isDsaasVendor) ? false : markupbyRateType;
  }

  get rateDetailsPayload(): RateModelPayloadDefaults {
    if (this.submissionForm === undefined) return
    return {
      hierarchy: this.jobHierarchy,
      rate_model: this.rateModelObj[this.programRateModel],
      min_bill_rate: "0.0",
      max_bill_rate: "0.0",
      msp_fee_types: this.amount_type,
      msp_fee_value: this.mspFee,
      msp_fee_funded_by: this.funded_by,
      ot_exempt: this.is_ot_exempt,
      fee_details: this.fee_details
    }
  }

  updateRateDetailsVisibility(value) {
    this.rateDetailsVisible = !!value;
  }

  showRateDetails() {
    this.rateDetailsVisible = true;
  }

  hideRateDetails(data) {
    this.rateDetailsVisible = false;
    if(this.submissionForm===undefined)  return
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
      this.updatedMarkupRateFactors = data?.factors;
      setAndMarkDirty(this.submissionForm?.get('candidatePayRate'), data?.standardRates?.payrate, true)
      setAndMarkDirty(this.submissionForm?.get('clientBillRateValue'), data?.standardRates?.billrate, true)
      setAndMarkDirty(this.submissionForm?.get('vendorBillRateValue'), data?.standardRates?.vendor_rate, true)
      if (data?.standardRates?.markup) {
        this.submissionForm?.get('rateMarkUpValue') && setAndMarkDirty(this.submissionForm?.get('rateMarkUpValue'), data?.standardRates?.markup, true)
      }
      if (this.costComponentEnabled && data?.standardRates?.cost_component) {
        for (const cc of data.standardRates.cost_component) {
          this.submissionForm.get('costComponent')?.get(cc?.code || 'markup')?.patchValue({ ...cc });
        }
      }
      const submissionForm = this.submissionForm?.get('rates') as UntypedFormArray;
      for (const rate of submissionForm?.controls) {
        const newRateObj = data['rateValues'].find(obj => obj?.rate_factor === rate?.get('rate_factor')?.value);
        setAndMarkDirty(rate.get('bill_rate'), newRateObj?.billrate)
        setAndMarkDirty(rate.get('vendor_bill_rate'), newRateObj?.vendor_rate)
        setAndMarkDirty(rate.get('pay_rate'), newRateObj?.payrate)
        setAndMarkDirty(rate.get('markup'), newRateObj?.markup)
        if (this.costComponentEnabled && newRateObj?.cost_component?.length) {
          for (const cc of newRateObj.cost_component) {
            rate.get('cost_component')?.get(cc.code || 'markup')?.patchValue({ ...cc });
          }
        }
      }
      const arrOfAbbrs = this.rate_factors_arr?.map(obj => obj.abbreviation);
      for (const new_factor_arr of data['factors']) {
        this.rate_factors_arr[arrOfAbbrs?.indexOf(new_factor_arr.abbreviation)] = new_factor_arr;
        let bill_rate_formula = this.getFormula(new_factor_arr?.bill_rate);
        let pay_rate_formula = this.getFormula(new_factor_arr?.pay_rate);
        this.patchFormula(new_factor_arr, bill_rate_formula, pay_rate_formula);
      }
    }
  }

  combineSourceAndModulesRequests() {
    const programModules$ = this.jobService?.get(`/rule-engine/programs/${this.programId}/modules`);
    const programSourcemodels$ = this.jobService?.get(`/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=assignment_sourcing_model&is_enabled=true&order_by=asc`);
    const currenciesList$ = this.jobService?.get(`/configurator/resources/currencies`);
    if (!programModules$ || !programSourcemodels$ || !currenciesList$) {
      return;
    }

    forkJoin([
      programModules$,
      programSourcemodels$,
      currenciesList$
    ]).subscribe({
      next: (responses) => {
        const programModules = responses[0];
        const programSourcemodels = responses[1];
        const currencies = responses[2];

        if (programModules) {
          const module = programModules['modules']?.find(module => module?.slug === "CONFIGURATOR");
          this.moduleId = module?.moduleId;
        }

        if (programSourcemodels) {
          const picklistItem = programSourcemodels['picklist_items']?.find(picklist => picklist?.value.toLowerCase() === 'contingent');
          this.sourcingModel = picklistItem?.id;
        }

        if (currencies) {
          this.currencyList = currencies['currencies'];
          this.currencyId = this.currencyList?.find(cur => cur?.code?.toLowerCase() === this.jobCurrency?.toLowerCase())?.id;
        }
      },
      error: (err) => {
        this.showError(err)
      }
    });
  }

  getPayloadValues(arr){
    return arr ? [arr] : [];
  }
  getCostComponentGroupId(locationsApiData?) {
    this.loader.show();
    let remote_city = '', remote_state = '', remote_country = '';
     if (this.showRemoteWorker && this.remote_worker) {
      remote_city = locationsApiData?.cities?.find(c => c.name?.toLowerCase() === this.remote_worker_details?.city?.toLowerCase())?.id;
      remote_state = locationsApiData?.states?.find(s => s.name?.toLowerCase() === this.remote_worker_details?.state?.toLowerCase())?.id;
      remote_country = locationsApiData?.countries?.find(c => c.name?.toLowerCase() === this.remote_worker_details?.country?.toLowerCase())?.id;
    }
    const payload = {
      eventSlug: 'CONFIGURATOR_COST_GROUPING',
      programId: this.programId,
      moduleId: this.moduleId,
      payload: JSON.stringify({
        hierarchy_rule: this.getPayloadValues(this.jobHierarchy),
        hierarchy: this.getPayloadValues(this.jobHierarchy),
        sourcing_model: this.getPayloadValues(this.sourcingModel),
        program_industry: this.getPayloadValues(this.jobProgramLaborCategory),
        program_vendor: this.getPayloadValues(this.candidateData?.vendor?.id),
        location_id: this.getPayloadValues(this.jobWorkLocation),
        currency: this.getPayloadValues(this.currencyId),
        work_classification: [],
        rate_type: this.getPayloadValues(this.stRateFactor?.id),
        template: this.getPayloadValues(this.jobTemplateID),
        remote_country: this.getPayloadValues(remote_country),
        remote_state: this.getPayloadValues(remote_state),
        remote_city: this.getPayloadValues(remote_city)
      })
    };


    this.jobService?.post('/rule-engine/rule-consumption-api', payload).subscribe({
      next: (res: any) => {
        if (!res) return;
        if (res.cost_component_group) {
          this.loader.hide();
          this.cost_component_group_id = res.cost_component_group;
          this.costComponentEnabled = true;
          this.getCostComponentGroupDetails(res?.cost_component_group);
        }
        else{
          this.loader.hide();
          this.costComponentGroupDetails = {};
          this.costComponentEnabled = false;
          this.showCostComponentWarning()
        }
      },
      error: (err) => {
        this.loader.hide();
        this.showCostComponentWarning();
        this.costComponentGroupDetails = {};
        this.costComponentEnabled = false;
      }
    });
  }
  getCostComponentGroupDetails(id: string) {
    this.loader.show();
    this.jobService?.get(`/core-money/programs/${this.programId}/cost-component/component_groups/${id}`).subscribe({
      next: (res) => {
        if (!res) return;
        this.loader.hide();
        this.costComponentGroupDetails = res?.['cost_component_group_data']?.meta_data?.map(({ code, unit, level, value, component_name }) => {
          return {
            code,
            level,
            value,
            component_name,
            type: ['percentage', 'percent'].includes(unit.toLowerCase()) ? 'percentage' : 'fixed'
          }
        });
        let payload = this.createPayloadforCostComponent(this.costComponentGroupDetails);
        this.costComponentPayload = payload?.cost_component;
        this.payloadRateFactors = this.payloadRateFactors?.map((x) => {
          return {...x,cost_component: this.costComponentPayload};
        });
        this.copyPayloadFactors = JSON.parse(JSON.stringify(this.payloadRateFactors));
        this.rate_factors_arr = this.rate_factors_arr?.map((x) => {
          return {...x,cost_component: this.costComponentPayload};
        });
        this.submissionForm.addControl('costComponent', this.createFormGroupForCostComponents(this.costComponentGroupDetails));
        for (const rate of this.ratesArray.controls) {
          const rateGrp = rate as UntypedFormGroup;
          rateGrp.addControl('cost_component', this.createFormGroupForCostComponents(this.costComponentGroupDetails));
        }
      },
      error: (err) => {
        this.loader.hide();
        this.showError(err);
      }
    });
  }

  createPayloadforCostComponent(response: any[]) {
    const costComponent = {};
    response.forEach(item => {
      const { code, type, level, value, component_name} = item;
      costComponent[code] = { type, level, value, component_name };
    });

    return { cost_component: costComponent };
  }

  createFormGroupForCostComponents(costComponentGroupDetails: any[]) {
    const costComponentsForRate = this.fb.group({});
    for (const costComp of costComponentGroupDetails) {
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

    return costComponentsForRate;
  }

  deleteFieldsinCostComponent(rates,keyName){
    rates.forEach(rateFactor => {
      if (!rateFactor?.cost_component || rateFactor?.cost_component && Object?.keys(rateFactor?.cost_component)?.length === 0) return;
      for (const key in rateFactor?.cost_component) {
          if (rateFactor?.cost_component.hasOwnProperty(key)) {
              delete rateFactor?.cost_component[key][keyName];
          }
      }
   });
    return rates;
  }

  updateMarkupValues(arr, markupValue) {
    return arr.map((x) => {
      if (!x?.markup) {
        x.markup = markupValue;
      }
      return x;
    });
  }

  get standardRateDetails() {
    if (this.submissionForm)
      return {
        billrate: this.submissionForm?.get('clientBillRateValue')?.value,
        payrate: this.submissionForm?.get('candidatePayRate')?.value,
        vendor_rate: this.submissionForm?.get('vendorBillRateValue')?.value,
        markup: this.submissionForm?.get('rateMarkUpValue')?.value || 0,
        cost_component: this.submissionForm?.get('costComponent')?.value || null
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
      minValue: +this.submissionForm?.get('minBillRate')?.value,
      maxValue: +this.submissionForm?.get('maxBillRate')?.value,
      hideRateAuthority: this.hideRateAuthority,
      submission_exceed_max_bill_rate: this.submission_exceed_max_bill_rate,
      markup: this.selectedSourceType === 'Sourced' ? this.markupConfigObj?.markups?.sourced_markup : this.markupConfigObj?.markups?.payrolled_markup
    }
  }

  getFactor(rate){
  let obj = {};
  if (rate) {
    const rate_type = rate?.map(item => item.rate_type).join(', ').toLowerCase();
    const rateFact = rate?.find((item) => item.rate_type === rate_type.toUpperCase());
    if (rateFact) {
        obj[rate_type] = parseFloat(rateFact.factor)
       }
  }
  return obj;
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
    return parseFloat(str?.toString())
  }

  convertCase(str) {
    return `ST ${str?.toUpperCase().replaceAll('_', ' ')}`
  }

  markupConfigObj: any;
  getMarkup() {
    let url = `/configurator/programs/${this.programId}/vendors/${this.candidateData.vendor?.id}/markups?industry_id=${this.jobProgramLaborCategory}&hierarchy_id=${this.jobHierarchy}&work_location_id=${this.jobWorkLocation}`;
    this.candidateService.get(url).subscribe({
      next: (res: any) => {
        this.isDsaasVendor = res?.is_dsaas_vendor;
        const { markup_config } = res;
        this.markupConfigObj = markup_config;
        if(!this.isDsaasVendor) {
          if(markup_config) {
            if(!this.isPredIdCandidate && this.isDefaultSourcingType && Object.keys(this.markupConfigObj?.markups)?.length>0){
              if((this.markupConfigObj?.markups?.sourced_markup>=0 && this.markupConfigObj?.markups?.sourced_markup!=null) && (this.markupConfigObj?.markups?.payrolled_markup>=0 && this.markupConfigObj?.markups?.payrolled_markup!=null)){
                this.isPayrollSourced=true;
                this.selectedSourceType=='Sourced';
              } else if(this.markupConfigObj?.markups?.sourced_markup>=0 && this.markupConfigObj?.markups?.sourced_markup!=null){
                this.isSourced=true;
                this.selectedSourceType='Sourced';
              } else if(this.markupConfigObj?.markups?.payrolled_markup>=0 && this.markupConfigObj?.markups?.payrolled_markup!=null){
                  this.isPayroll=true;
                  this.selectedSourceType='Payrolled';
              }
            }
          }
        }
        else{
          this.costComponentEnabled = false;
          this.isPayroll=true;
          this.selectedSourceType='Payrolled';
        }
         this.submissionForm.get('candidate_sourcing_type').setValue(this.selectedSourceType);
        // let fieldName = '';
        // if (this.markupConfigObj.rate_model === 'BILL_RATE') {
        //   fieldName = 'candidatePayRate';
        // } else if (this.markupConfigObj.rate_model == 'PAY_RATE') {
        //   fieldName = 'billRatevalue';
        // }
        // this.submissionForm.get(fieldName).disable();
        if (this.selectedSourceType === 'Sourced') {
          this.submissionForm.patchValue({
            rateMarkUpValue: this.accuracy.transform(this.markupConfigObj?.markups?.sourced_markup, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
          })
          this.calculateRates('markup');
        }
        else if (this.selectedSourceType === 'Payrolled') {
          this.submissionForm.patchValue({
            rateMarkUpValue: this.accuracy.transform(this.markupConfigObj?.markups?.payrolled_markup, AccuracyConfigEnum.MARKUP_PERCENTAGE, { isEdit: true }),
          })
          this.calculateRates('markup');
        }
        else {
          this.showError('Please contact your system administrator to setup markup for you');
        }
      },
        error: err => {
          this.showError(err);
        }
      });
  }

  get showPayRate(){
    if(this.programRateModel === 'BILL_RATE'){
      return false;
    }
    else{
      return true;
    }
  }

  get gridClass(){
    if(this.programRateModel === 'PAY_RATE' || this.programRateModel === 'MARKUP'){
      if(this.user_type?.toLowerCase() === 'msp'){
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

  get disableForm() {
    return (
      !this.detailsLoaded ||
      this.invalidDateMesg ||
      !!!this.submissionForm?.controls['availableStartDate']?.valid || this.submissionForm?.controls['vendorBillRateValue']?.value == 0 ||
      this.isDisabled ||
      (!this?.questionFormValid && this?.questionnaireList && this?.questionnaireList?.length && this?.questionnaireList[0]?.question) ||
      this.submissionForm.invalid ||
      !this.isCustomFieldsFormValid
    );
  }

  getQuestionnaireListByTemplateId(templateID) {
    let url = `/configurator/programs/${this.programId}/questionnaires?job_template_ids=${templateID}`;
    this.candidateService.get(url).subscribe({
      next: (data: any) => {
        if (data.questionnaires) {
          this.questionnaireList = data?.questionnaires;
        }
      },
      error: err => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      },
  });
  }

  setFoundationalFieldsFormValid(event) {}
  foundationalFieldUpdated(event) {}
  setCustomFieldsFormValue(isvalid) {
    this.questionFormValid = isvalid;
  }

  setCustomFieldsForm(isCustomFieldsFormValid) {
    this.isCustomFieldsFormValid = isCustomFieldsFormValid;
  }
  customFieldUpdated(event) {
    if (event) {
      this.updatedQuestion = event;
    }
  }
  updateCustomFields(event) {
    if (event) {
      this.customFieldsFormData = event;
    }
  }

  checkRehire(event) {
    // event == true || event == false ? this.isSubmitDescription = true : this.isSubmitDescription = false;
    this.re_hire_candidate = event;
    if (event) {
      this.pastWorkCommentBox = true;
      this.submissionForm?.get('shareWorkDetails').setValidators([Validators.required]);
      this.submissionForm?.get('candidate_worked_as').setValidators([Validators.required]);
    }
    else {
      this.pastWorkCommentBox = false;
      this.submissionForm?.get('shareWorkDetails').setValidators([Validators.required]);
      this.submissionForm?.get('shareWorkDetails').clearValidators();
      this.submissionForm?.get('shareWorkDetails').updateValueAndValidity();
      this.submissionForm?.get('candidate_worked_as').setValidators([Validators.required]);
      this.submissionForm?.get('candidate_worked_as').clearValidators();
      this.submissionForm?.get('candidate_worked_as').updateValueAndValidity();
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

  payRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('pay_rate') && !formControl?.get('vendor_bill_rate')) {
      return null;
    }
    if (Number(formControl?.get('pay_rate')?.value) > Number(formControl?.get('vendor_bill_rate')?.value)) {
      return { gtr: 'Pay rate can not be greater than  Vendor bill rate' }
    }
    return null;
  }

  showError(err){
    window.scrollTo(0,0);
    let hideReportButton = err?.error?.error?.do_not_report ? true : false;
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400) && !hideReportButton, additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
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


  get isSourcedValid() {

    if(!this.markupConfigObj)
      return false;

    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if(!this.markupConfigObj[0].markups)
        return false;

      const { sourced_markup } = this.markupConfigObj[0].markups;
      return Boolean(sourced_markup);
    }

    if(!this.markupConfigObj.markups)
      return false;

    const { sourced_markup } = this.markupConfigObj.markups;
    return Boolean(sourced_markup);
  }

  get isPayRolledValid() {

    if(!this.markupConfigObj)
      return false;

    if(Array.isArray(this.markupConfigObj) && this.markupConfigObj.length) {
      if(!this.markupConfigObj[0].markups)
        return false;

      const { payrolled_markup } = this.markupConfigObj[0].markups;
      return Boolean(payrolled_markup);
    }

    if(!this.markupConfigObj.markups)
      return false;

    const { payrolled_markup } = this.markupConfigObj.markups;
    return Boolean(payrolled_markup);
  }

  getResumeData(data) {
    this.resumeData = data;
    if (data && data?.raw) {
      this.resumeError = false;
      this.loader.show();
      this.candidateService.updateResume({
        file_name: this.resumeData?.name ? this.resumeData?.name : null,
        raw: this.resumeData?.raw ? this.resumeData?.raw : null
      }, this.programId, this.candidateId).subscribe({
        next:()=>{
          this.loader.hide();
        },
        error:(error)=>{
          this.showError(error);
          this.loader.hide();
        }
      })
    }
    else{
      this.resumeError = true;
      if(!data){
        this.loader.show();
        this.candidateService.deleteResume(this.programId,this.candidateId).subscribe({
          next:()=>{
            this.loader.hide();
          },
          error:(error)=>{
            this.showError(error);
            this.loader.hide();
          }
        })
      }
    }
  }
}
