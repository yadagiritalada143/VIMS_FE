import { Component, OnInit } from '@angular/core';
import { AbstractControl,UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { EventStreamService } from 'src/app/core/services/event-stream.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CurrencyService } from 'src/app/shared/service/currency.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { getDateFromString } from '../../../app/wipro-timesheet/timesheet.utils';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AssignmentPermissions } from '../enums/assignment-permissions';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
export enum STATUS {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}
export enum PROGRAM_TYPE {
  SELF_SERVICED = 'SELF-SERVICED',
  MSP_MANAGED = 'MSP-MANAGED'
}
export enum RATETYPES {
  ST = 'st',
  OT = 'ot',
  DT = 'dt',
  HP = 'hp'
}
@Component({
  selector: 'app-activity-based-pricing',
  templateUrl: './activity-based-pricing.component.html',
  styleUrls: ['./activity-based-pricing.component.scss']
})
export class ActivityBasedPricingComponent implements OnInit {
  public activity = {
    title: 'Active',
    value: true,
    name: 'active',
  };
  public registerForm: UntypedFormGroup;
  public tableConfig: VMSConfig;
  public itemPerPage = 10;
  public tableLoaded = false;
  public vmsData: any;
  public totalPages;
  public totalRecords = 0;
  public itemsPerPage: any;
  public pageNo = 1;
  public dataLoading = true;
  public submitted: boolean;
  public programType: any;
  public activityPricingList: any = [];
  isEffectiveDateSetting : any;
  assignmentData: any;
  currency: string = undefined;
  isSaveLoader: boolean;
  assignmentId: any;
  options: any;
  isClient = false;
  isVendor = false;
  isMsp = false;
  user_type: string;
  programManagedType: PROGRAM_TYPE;
  isSuperAdmin = false;
  logs:Log= undefined;
  listLogs:Log= undefined;
  assignmentPermissions= AssignmentPermissions;
  programId: string;
  assignmentConfig: any;
  accuracyConfig = AccuracyConfigEnum;
  dateFormat: any;
  constructor(public fb: UntypedFormBuilder, private currencyService: CurrencyService,private datePipe: LocalDateFormatPipe, public alert: AlertService, private _storageService: StorageService, private loader: LoaderService,
    private _formRendererService: FormRendererService, public eventStream: EventStreamService, public router: Router, private location: Location, public _route: ActivatedRoute,
    private accuracyPipe: AccuracyPipe, private authorizationService: AuthorizationService
  ) {
      this.registerForm = this.fb.group({
        title: ['', Validators.required],
        start_date: [null, Validators.required],
        rate: this.fb.array([]),
        rate_model: [null, Validators.required],
        // fee: this.fb.array([]), 
        adjusted_markup: [0],
        vendor_markup: [0],
        billrate: [0, Validators.required],
        payrate: [0, Validators.required],
        vendor_rate: [{
          value: 0,
          disabled: true
        }, Validators.required],
      },{
        validators: [this.payRateValidator]
      });
  }
  ngOnInit(): void {
    this._route.queryParams.subscribe(params => {
        this.assignmentId = params.assignmentId;
      }
    )
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = currentProgram['id'];
    this.programManagedType = currentProgram?.service_type;
    this.user_type = this._storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.setUserType();
    this.tableConfig = {
      title: 'Activity List',
      columnList:[
        { name: 'title', title: 'Activity Name', isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isVieworEdit: false,isDisableorDelete: false },
        { name: 'status', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false },
        { name: 'startdate', title: 'Activity Added Date', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
       ],
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: true,
      isDownload: false,
      isCreate: false,
      isTopHeader: true,
      density: 'COMFORTABLE'
    }; 
    this.getProgramAssigmentConfig();
    this.init();
  }
  getCurrencyCode(currency) {
    if (currency) {
      this.currency = this.currencyService.getCurrencySymbol(currency);
    }
  }
  get regFormValidate() { return this.registerForm.controls; }
  get ratesArray(): UntypedFormArray {
    return this.registerForm.get('rate') as UntypedFormArray;
  }
  init() {
    this.getProgramDetail();
    this.getAssignmentDetails();
  }
  updateColumns() {
    setTimeout(() => {
      this.tableConfig.columnList = [
      { name: 'title', title: 'Activity Name', isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isVieworEdit: false,isDisableorDelete: false },
      { name: 'status', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false },
      { name: 'startdate', title: 'Activity Added Date', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
     ]
     if(this.showClientBillRate) {
     let list = this.updateRateColumn('billrate' , ' CLIENT BILL RATE');
     this.tableConfig.columnList = [...this.tableConfig.columnList , ...list];
     }
     if(this.showVendorBillRate) {
      let list = this.updateRateColumn('vendor_rate' , ' VENDOR BILL RATE');
      this.tableConfig.columnList = [...this.tableConfig.columnList , ...list];
    }
     if(this.showPayrate) {
      let list = this.updateRateColumn('payrate' , 'PAY RATE');
      this.tableConfig.columnList = [...this.tableConfig.columnList , ...list];
     }
     this.tableConfig.columnList = [...this.tableConfig.columnList];
     this.tableConfig= {...this.tableConfig}
    }, 1000);
  }
  updateRateColumn(type, name) {
    let columnList = [] ;
    if(this.activityPricingList && this.activityPricingList.length > 0 ) {
        for (const rates in this.activityPricingList[0]?.rate) {
           let isPresent = this.tableConfig.columnList.some(c=> c?.name?.toLowerCase() === rates?.toLowerCase());
            if(!isPresent) {
              if(rates?.includes(type)) {

                this.tableConfig.columnList.push({ name:  'rate.'+ rates?.toLowerCase(), title: name + '(' + rates?.slice(0, 2)?.toUpperCase() + ')', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },)
                this.dataLoading = false;
              }
          
          }
        }
    }
    return columnList
  }
  
  getSortRates(rate_factors) {
    let sortRates: any = [...(rate_factors || [])];
    const getSTIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.ST);
    const getOTIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.OT);
    const getDTIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.DT);
    const getHPIndex = sortRates.findIndex(c => (c?.abbreviation?.toLowerCase() || c?.rate_factor?.toLowerCase()) == RATETYPES.HP);
    if (getSTIndex !==-1) {
      sortRates[getSTIndex].position = 0;
    }
    if (getOTIndex >= 0) {
      sortRates[getOTIndex].position = 1;
    }
    if (getDTIndex >= 0) {
      sortRates[getDTIndex].position = 2;
    }
    if (getHPIndex >= 0) {
      sortRates[getHPIndex].position = 3;
    }
    return  sortRates.sort((a, b) => a.position - b.position);
  }
  onClickToggleActivity() {
    if (this.activity.value) {
      this.activity.value = false;
      this.activity.title = "Inactive";
    }
    else {
      this.activity.value = true;
      this.activity.title = "Active";
    }
  }
  getProgramDetail() {
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = currentProgram?.defaultDateFormat;
    this._formRendererService.get(`/configurator/programs/${currentProgram?.id}`)
      .subscribe(res => {
        const { program } = res;
        const { config } = program;
        if (!config?.is_expense_manager_enabled) {
        }
        this.programType = program?.config?.program_model || 'BILL_RATE';
        this.registerForm.get('rate_model').setValue(this.programType !== 'BILL_RATE' ? 'markup' : 'billrate');
      })
  }
  goToDetailPage() {
    this.location.back();
  }
  onSubmit() {
    this.submitted = true;
    this.logs= undefined;
    if (this.registerForm.invalid) {
      this.logs = { type: LOG_TYPE.ERROR, heading: 'Invalid form details', autoClose: true, isShown: true, showReportButton: false, additionalInfo: undefined };
      return;
    }
    this.registerForm.value.status = this.activity?.title;
    if (this.activity.value) {
      this.activity.name = 'active';
    } else {
      this.activity.name = 'in-active';
    }
    const formValues = this.registerForm.getRawValue();
    const {
      title,
      rate_model,
      payrate,
      billrate,
      start_date,
      vendor_rate } = formValues;
    let payload = {
      title: title,
      start_date: start_date,
      rate_model: rate_model,
      rate: {
        billrate: this.accuracyPipe.transform(Number(billrate), this.accuracyConfig.rate, { isEdit: true}),
        payrate: this.accuracyPipe.transform(Number(payrate), this.accuracyConfig.rate, { isEdit: true}),
        vendor_rate: this.accuracyPipe.transform(Number(vendor_rate), this.accuracyConfig.rate, { isEdit: true}),
        rate_factor: "st"
      },
      status: this.activity.name
    }
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this._formRendererService.post(`/assignment/programs/${currentProgram?.id}/assignment/${this.assignmentId}/project`, payload)
      .subscribe({next:(data: any) => {
        if (data?.code === 200) {
          this.isSaveLoader = false;
          this.alert.success('Activity Based Pricing Added successfully.')
          this.registerForm.reset();
          this.submitted = false;
          this.loader.hide();
          this.getAssignmentDetails();
        }
      }, error: (err) => {
        this.isSaveLoader = false;
        this.loader.hide();
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
        // this.alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } })
      }})
  }
  showErrorMessges(err){
    let messages= [];
    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
       messages.push(msg?.message);
      }
    });
    return messages;
  }
  payRateValidator(formControl: AbstractControl) {
    if (!formControl?.get('payrate') && !formControl?.get('billrate')) {
      return null;
    }
    if (Number(formControl?.get('payrate')?.value) > Number(formControl?.get('billrate')?.value)) {
      return { gtr: 'Pay Rate can not be greater than client bill rate' }
    }
    return null;
  }
  baseRatesChanged(rate) {
    this.registerForm.value
    let url = '';
    const formValues = this.registerForm.getRawValue();
    const {
      rate_model,
      adjusted_markup,
      vendor_markup,
      billrate,
      payrate } = formValues;
    const max_bill_rate = 0
    const min_bill_rate = 0;
    let msp_fee_types = 0;
    let msp_fee_value = 0;
    if (!rate_model) {
      return;
    }
    if (adjusted_markup === null || vendor_markup === null) {
      return;
    }
    if ((rate === 'billrate' && billrate === null) || (rate === 'payrate' && payrate === null)) {
      return;
    }
    const feeArr = this.assignmentData.assignment.tax.filter(t => t.entity_type === 'fee') || [];
    const indexForMsp = feeArr.findIndex(entity => entity?.entity_name?.toLowerCase() === 'msp');
    if (indexForMsp > -1) {
      msp_fee_types = feeArr[indexForMsp]?.amount_type;
      msp_fee_value = this.accuracyPipe?.transform(feeArr[indexForMsp]?.amount_value, this.accuracyConfig.fee, { isEdit: true });
    }
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    url = `rate_model=${rate_model}&adjusted_markup=${adjusted_markup}&vendor_markup=${vendor_markup}&client_bill_rate=${billrate}&candidate_pay_rate=${payrate || 0}&max_bill_rate=${max_bill_rate}&min_bill_rate=${min_bill_rate}`;
    this._formRendererService.get(`/core-money/programs/${currentProgram?.id}/rate-model?${url}&abbreviation=st&msp_fee_types=${msp_fee_types}&msp_fee_value=${msp_fee_value}`)
      .subscribe({next:(res: any) => {
        const { data } = res;
        const rateObj = data?.rate;
        const arrayValues = this.ratesArray?.value;
        for (var prop in rateObj) {
          if (prop !== 'abbreviation') {
            const ele = rateObj[prop];
            const index = arrayValues.findIndex(r => r?.rate_factor?.toLowerCase() === prop);
            if (index > -1) {
              this.ratesArray.at(index).patchValue({
                billrate: this.accuracyPipe.transform(+ele?.billrate, this.accuracyConfig.rate, { isEdit: true}),
                payrate: this.accuracyPipe.transform(+ele?.payrate, this.accuracyConfig.rate, { isEdit: true}),
                vendor_rate: this.accuracyPipe.transform(+ele?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
              })
            }
          }
        }
        const regular = rateObj?.regular;
        if (rate == 'billrate') {
          this.registerForm.patchValue({
            payrate: this.accuracyPipe.transform(+regular?.payrate, this.accuracyConfig.rate, { isEdit: true}),
            vendor_rate: this.accuracyPipe.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
          })
        } else {
          this.registerForm.patchValue({
            billrate: this.accuracyPipe.transform(+regular?.billrate, this.accuracyConfig.rate, { isEdit: true}),
            vendor_rate: this.accuracyPipe.transform(+regular?.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
          })
        }
        // this.recalcualatebudget();
      }, error: (err) => {
        this.alert.error(errorHandler(err));
      }})
  }
  getAssignmentDetails() {
    this.loader.show();
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/assignment/programs/${currentProgram?.id}/assignment/${this.assignmentId}`;
    this._formRendererService.get(url).subscribe(
      {next:(data: any) => {
        if (data?.data) {           
          this.assignmentData = data?.data?.assignments;
          let startDate = new Date(this.assignmentData?.assignment?.start_date);
          let endDate = new Date(this.assignmentData?.assignment?.end_date);
          startDate.setDate(startDate?.getDate());
          endDate.setDate(endDate?.getDate());
          this.options = {
            language: 'English',
            enabledDateRanges: [
              { start: startDate, end: endDate },
            ]
          };
           if(this.assignmentData?.finance?.currency){
            this.getCurrencyCode(this.assignmentData?.finance?.currency);
           }
           this.getActivityPricingList();
           this.registerForm.patchValue({
            rate_model : this.assignmentData?.finance?.rate_model,
            adjusted_markup : this.accuracyPipe?.transform(this.assignmentData?.finance?.adjusted_markup || 0, this.accuracyConfig.markup_percentage, { isEdit: true }),
            vendor_markup : this.accuracyPipe?.transform(this.assignmentData?.finance?.adjusted_markup || 0, this.accuracyConfig.markup_percentage, { isEdit: true })
           })
        }
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this.getActivityPricingList();
      }});
  }
  onSearch($event) {
  }
  onListFilter($event) {
  }
  onPaginationClick(e) {
    this.getActivityPricingList(e);
  }
  getActivityPricingList(pageNo = 1) {
    this.loader.show();
    this.listLogs= undefined;
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/assignment/programs/${currentProgram?.id}/assignment/${this.assignmentId}/projects?page=${pageNo}&limit=${this.itemPerPage}&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled ? this.isEffectiveDateSetting?.is_enabled : false}`;
    this._formRendererService.get(url).subscribe(
      {next:(data: any) => {
        if (data) {
          this.totalRecords = data?.data?.total_records || 0;
          if(data?.data?.project) {
            this.activityPricingList = this.formatData(data?.data?.project);
            this.updateColumns();
          }
          this.loader.hide();
        }
      },
      error: (err) => {
        this.loader.hide();
        this.dataLoading = false;
        this.listLogs= { type: LOG_TYPE.ERROR, heading: errorHandler(err), autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
        // this.alert.error(errorHandler(err));
      }});
  }
  formatData(data) {
    data?.forEach(e => {
      const start_date = getDateFromString(e?.start_date);
      e.startdate = this.datePipe?.transform(start_date , '' , '' ,'', true)
      // e.showDynamicOptions = true;  //commenting for  V2M-1125
      // if(e?.status === STATUS.ACTIVE.toLowerCase()){
      //   e.options = [{name: STATUS.INACTIVE}];
      // } else{
      //   e.options = [{name: STATUS.ACTIVE}];
      // }
       if(Array.isArray(e?.rate) &&  e.rate?.length > 0) {
         let rate =   this.getSortRates(e.rate);
         e.rate = rate;
         let activity_rates = {} ;
        e.rate.forEach(rates => {
          if (rates?.billrate) {
            // rates.bill_rate  = rates?.billrate ? this.customCurrencyPipe?.transform(rates?.billrate, this.currency) : '-'
            activity_rates[rates.rate_factor?.toLowerCase()+'_billrate'] = rates?.billrate ? this.accuracyPipe?.transform(rates?.billrate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
          }
          if (rates?.vendor_rate) {
            // rates.vendorRate  = rates?.vendor_rate ? this.customCurrencyPipe?.transform(rates?.vendor_rate, this.currency) : '-'
            activity_rates[rates.rate_factor?.toLowerCase() +'_vendor_rate'] = rates?.vendor_rate ? this.accuracyPipe?.transform(rates?.vendor_rate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
          }
          if (rates?.payrate) {
            activity_rates[rates.rate_factor?.toLowerCase()+ '_payrate'] = rates?.payrate ? this.accuracyPipe?.transform(rates?.payrate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
            // rates.pay_rate  = rates?.payrate ? this.customCurrencyPipe?.transform(rates?.payrate, this.currency) : '-'
          }
        });
        e.rate = activity_rates;
       } else {
        if (e?.rate?.billrate) {
          e.rate[e?.rate.rate_factor?.toLowerCase()+'_billrate']  = e?.rate?.billrate ? this.accuracyPipe?.transform(e?.rate?.billrate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
           delete e?.rate?.billrate;
        }
        if (e?.rate?.vendor_rate) {
          e.rate[e?.rate.rate_factor?.toLowerCase()+'_vendor_rate']  = e?.rate?.vendor_rate ? this.accuracyPipe?.transform(e?.rate?.vendor_rate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
         delete e?.rate?.vendor_rate
        }
        if (e?.rate?.payrate) {
          e.rate[e?.rate.rate_factor?.toLowerCase()+'_payrate']  = e?.rate?.payrate ? this.accuracyPipe?.transform(e?.rate?.payrate, this.accuracyConfig.rate, { currencyCode: this.currency }) : '-'
          delete e?.rate?.payrate
        }
       }
    });
    return data;
  }
  optionClicked(e) {
    if (e?.data?.status) {
      this.updateStatus(e?.data);
    }
  }
  updateStatus(data) {
    this.listLogs= undefined;
    if (data?.status === "active") {
      data.status = 'in-active';
    } else {
      data.status = 'active';
    }
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this._formRendererService.put(`/assignment/programs/${currentProgram?.id}/assignment/${this.assignmentId}/project/${data?.project_id}`, data).subscribe(
      {next:(data: any) => {
        if (data) {
          this.alert.success(`You have updated activity status successfully.`);
        }
        this.getActivityPricingList()
      },
      error: (err) => {
        this.listLogs= { type: LOG_TYPE.ERROR, heading: errorHandler(err), autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
        // this.alert.error(errorHandler(err));
      }});
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
  get isSelfManagedClientAdmin() {
    return ((this.programManagedType === PROGRAM_TYPE.SELF_SERVICED && this.isClient) || this.isSuperAdmin)
  }
  get showClientBillRate() {
    let rate_model = this.assignmentData?.finance?.rate_model;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_client_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_client_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase());
  }
  get showVendorBillRate() {
    let rate_model = this.assignmentData?.finance?.rate_model;
    return (this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_vendor_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_vendor_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase())) && !(this.checkAuthorization(AssignmentPermissions.HIDE_VENDOR_BILL_RATE));
  }
  get showPayrate() {
    let rate_model = this.assignmentData?.finance?.rate_model;
    return (this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_pay_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_pay_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase())) && !(this.checkAuthorization(AssignmentPermissions.HIDE_PAY_RATE));
  }
  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }
  getProgramAssigmentConfig() {
    this._formRendererService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`).subscribe(res => {
      const { config } = res;
      this.assignmentConfig = config;
      if(this.assignmentConfig?.hasOwnProperty('effective_date_wise') && this.assignmentConfig?.effective_date_wise?.is_allow){
        this.isEffectiveDateSetting = this.assignmentConfig?.effective_date_wise?.options?.find(res => res?.key === 'allow_list');
       }
    });
  }
}