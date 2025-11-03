import { Component, OnInit, Input } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { PROGRAM_TYPE } from '../../assignment-create/assignment-create.component';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AssignmentService } from '../../assignment.service';
import { ActivatedRoute } from '@angular/router';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { ApprovalStatus } from 'src/app/shared/enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { RateFactorsWithEdit, RateFactorsShowHide } from '../../assignment.model'
import { AssignmentPermissions } from '../../enums/assignment-permissions';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT , RATE_MODEL } from 'src/app/shared/enums';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { SourcingModel }from '../../enums/assignment-sourcing-models';

export enum RATETYPES {
  ST = 'st',
  OT = 'ot',
  DT = 'dt'
}

@Component({
  selector: 'app-view-assignment-history-flyout',
  templateUrl: './view-assignment-history-flyout.component.html',
  styleUrls: ['./view-assignment-history-flyout.component.scss']
})
export class ViewAssignmentHistoryFlyoutComponent implements OnInit {
  public assignmentData: any;
  public programID: any;
  public assignmentID: any;
  public isClient: boolean = false;
  public isVendor: boolean = false;
  public isMsp: boolean = false;
  public isSuperAdmin: boolean = false;
  public approvalList :any;
  public version:any;
  foundationalArray = [];
  foundationalSortedKeys = [];
  assignmentPermissions= AssignmentPermissions;
  rate_model = RATE_MODEL;
  programManagedType: PROGRAM_TYPE;
  foundationalKeys = [];
  foundationDataLabel = {};
  accuracyConfig = AccuracyConfigEnum;
  getDateFromString = getDateFromString;
  @Input() viewAssignment = 'hidden';
  private subscrptions: Subscription[] = [];
  customFieldLabel = {};
  customFieldDataType = {};
  user_type: string;
  hide_fees = {};
  public is_tax_hidden = false;
  public hierarchy_ids: any;
  public showTaxFeesDetails: boolean = false;
  currentDateFormat: any;
  logs:Log= undefined;
  programType: any;
  public readonly ApprovalStatus = ApprovalStatus;
  activity_wise_rate_factors_arr: any[] = [];
  activity_wise_rate_factors_arr_show_hide: any[] = [];
  hideMasterDataTypeName: boolean = false;
  SourcingModel = SourcingModel;
  showHideManagerListTimesheet: boolean = false;
  showHideManagerListExpense: boolean = false;
  programDetail : any;

  public _assignmentConfig: any;
  public _customFields: any;
  financialFoundationalData = [];
  @Input('assignmentConfig') set assignmentConfig(value:any){
    this._assignmentConfig = value;
  }
  get assignmentConfig() {
    return this._assignmentConfig;
  }
  @Input('customFields') set customFields(value:any) {
    this._customFields = value;
  }
  get customFields() {
    return this._customFields;
  }
  constructor(
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
    private s3UploadService: AwsS3FileUploadService,
    private authorizationService: AuthorizationService,
    private accuracyPipe: AccuracyPipe
  ) { }

  ngOnInit(): void {
    const programDetails = this.programDetail =  this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programID = programDetails.id;
    this.assignmentID = this.route.snapshot.params.id;
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    if (this.user_type?.toUpperCase() === UserType.Client) {
      this.isClient = true;
    } else if (this.user_type?.toUpperCase() === UserType.Vendor) {
      this.isVendor = true;
    } else if (this.user_type?.toUpperCase() === UserType.MSP) {
      this.isMsp = true;
    } else if (this.user_type?.toUpperCase() === UserType.Super_org) {
      this.isSuperAdmin = true;
    }
    this.is_tax_hidden = programDetails.config?.is_tax_hidden || false;
    this.hide_fees = programDetails?.config?.hide_fees || {};
    this.programManagedType = programDetails?.service_type;
    this.programType = programDetails?.config?.program_model || 'BILL_RATE';
    const dateformat = this.assignmentService.getDefaultDateFormat();
    this.hideMasterDataTypeName = programDetails?.config?.show_only_master_codes ?? false;
    this.currentDateFormat = `${dateformat} hh:mm:ss a z`
    this.subscrptions.push(
      this.eventStream.on(Events.VIEW_ASSIGNMENT_SIDEBAR).subscribe((data: any) => {
        if (data) {
          this.logs= undefined;
          this.assignmentService.getHistoryRevDetails(this.programID, this.assignmentID, data.revisionId).subscribe({
            next: (res: any) => {
              this.hierarchy_ids = res?.data?.assignments?.new_meta_data?.assignments?.assignment?.hierarchy?.id;
              this.version = res?.data?.assignments?.version;
              this.assignmentData = res?.data?.assignments?.new_meta_data?.assignments;
              this.assignmentData.updated_at = res?.data?.assignments?.updated_at;
              this.assignmentData.updated_by.name = res?.data?.assignments?.updated_by?.name;
              this.assignmentData.impersonated_by = res?.data?.assignments?.impersonated_by;
              // console.log(this.assignmentData)
              if (this.assignmentData.foundational_data) {
                this.foundationalKeys = Object.keys(this.assignmentData.foundational_data);
              }
              if (this.assignmentData?.assignment?.tax && this.assignmentData?.assignment?.tax?.length) {
                this.assignmentData?.assignment?.tax?.forEach(element => {
                  if (this.isVendor && element?.entity_type?.toLowerCase() === 'fee' || (element?.entity_type?.toLowerCase() === 'fee' && this.hide_fees?.[this.user_type])) {
                    element.hidden = true;
                  }
                  if (this.is_tax_hidden && element?.entity_type?.toLowerCase() === 'tax') {
                    element.hidden = true;
                  }
                });
              }
              this.showTaxFeesDetails = this.assignmentData?.assignment?.tax?.every(item => { return item.hidden });
              this.populateCustomAndFoudationalFields();
              this.reArrangeType().then(res => {
                if(this.assignmentData?.finance?.rate_factor?.length && this.assignmentData?.finance?.rate_factor[0]?.rate_factors && this.assignmentData?.finance?.rate_factor[0]?.rate_factors?.length) {
                  let billableRateFactors  = this.assignmentData?.finance?.rate_factor[0]?.rate_factors.filter(res => (res?.applicable || (res?.abbreviation?.toLowerCase() == 'regular' || res?.abbreviation?.toLowerCase() == RATETYPES.ST)));
                  this.assignmentData.finance.rate[0].rates = this.assignmentData?.finance?.rate[0]?.rates.filter(res =>  billableRateFactors?.some(data=> data?.abbreviation?.toLowerCase() === res?.rate_factor?.toLowerCase()) );
                }
              });
              this.showApprovalTable();
              // this.getUnitOfMeasure();
              if(this.assignmentData?.finance?.rate_factor && this.assignmentData?.finance?.rate_factor?.length > 0 && this.assignmentData?.finance?.rate_factor[0] != null) {
                this.createActivityWiseRateFactorsArray(this.assignmentData?.finance?.rate_factor);
              }
            },
            error: err => {
              this.logs= { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
            }
          });
          this.viewAssignment = 'visible';
        }
      }),
    );
  };

  showErrorMessges(err){
    let messages= [];
    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
       messages.push(msg?.message);
      }
    });
    return messages;
  }

  unitOfMeasureObj = {};
  getUnitOfMeasure() {
    this.assignmentService.get(`/configurator/programs/${this.programID}/picklists/*/items?picklist_slug=unit_of_measure`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        picklist_items.forEach(element => {
          this.unitOfMeasureObj[element?.value?.toLowerCase()] = element?.label;
        });
      })
  }


  populateCustomAndFoudationalFields() {
    const foundationHttp = this.assignmentService.get(`/configurator/programs/${this.programID}/foundational-data-types?limit=100`);
    forkJoin([foundationHttp])
      .subscribe((res: any) => {
        const customFieldArray = this.customFields;
        this.foundationalArray = res[1]?.foundational_data_types;
        this.foundationalArray?.forEach((fData) => {
          this.foundationDataLabel[fData?.slug] = fData?.name;
          if(fData?.configuration?.hasOwnProperty('financial_master_data_type') && fData?.configuration?.financial_master_data_type !== 'false' ? Boolean(fData?.configuration?.financial_master_data_type) : false) {
            this.financialFoundationalData?.push(fData?.name);
          }
        });
        if(this.assignmentData?.foundational_data){
          this.foundationalArray?.forEach((fData) => {
            if(!(this.assignmentData?.foundational_data?.hasOwnProperty(fData?.slug))){
              this.foundationalSortedKeys.push(fData);
            }
          });
        }
        else{
          this.foundationalSortedKeys = this.foundationalArray;
        }
        customFieldArray?.forEach((cust) => {
          this.customFieldDataType[cust?.slug] = cust?.type;
          this.customFieldLabel[cust?.slug] = cust?.label;
          if (cust?.type === 'DROPDOWN') {
            if (this.assignmentData?.custom) {
              let res = [];
              Array.isArray(this.assignmentData?.custom[cust?.slug]) && (this.assignmentData?.custom[cust?.slug]).length > 0 ? this.assignmentData?.custom[cust?.slug] : [this.assignmentData?.custom[cust?.slug]]?.forEach(cf => {
                res.push((cust?.meta_data?.datasource?.options.filter(option => option?.value === cf).map(res => res?.label)) || this.assignmentData.custom[cust?.slug]);
              });
              this.assignmentData.custom[cust?.slug] = res.join(", ");
            }
          }
          if (cust?.type?.toUpperCase() == "SOURCE" && cust?.api_url) {
            let url = cust?.api_url;
            url = url?.includes('?') ? url += `&user_ids=${this.assignmentData.custom[cust?.slug]}` : url += `?user_ids=${this.assignmentData.custom[cust?.slug]}`
            if (this.assignmentData.custom[cust?.slug]) {
              this.assignmentService.get(url).subscribe({
                next: (data: any) => {
                  if (data?.members?.length > 0) {
                    this.assignmentData.custom[cust?.slug] = data?.members[0]?.full_name;
                  }
                }
              });
            }
          }
          if(cust?.type === 'PICKLIST') {
            let value = this.customFields.filter(res => res?.type === 'PICKLIST' && res?.slug === cust?.slug)[0];
            this.assignmentData.custom[cust?.slug] = value?.pick_list?.picklist_item?.filter(res => res?.value === this.assignmentData.custom[cust?.slug])?.[0]?.label;
          }
        });
        const foundationalArray = res[0]?.foundational_data_types;
        foundationalArray?.forEach((cust) => {
          this.foundationDataLabel[cust?.slug] = cust?.name;
          });
        });
  }
  downloadS3Attachment(file:any) {
    if(file && file.name && file.key){
      this.s3UploadService.downloadS3Attachment(file);
    }
  }
  removedUnwanted(name) 
  {
    return name?.replace(/Mr |Mrs |Miss |Dr |Prof |MX |IND |Misc | SR$| Jr$| Sr$| III$| IV$| V$/ig, '');
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

  hideBillingDetails(permission) {
    return this.authorizationService.authorize(permission)
  }
  sidebarClose() {
    this.viewAssignment = 'hidden';
  }
  showApprovalTable()
  {
    this.assignmentService.getApproversData(this.programID, this.assignmentID, this.version).subscribe((res: any)=>
    {
      this.approvalList=res?.data;
    });
  }
  reArrangeType() {
    return new Promise<void>((resolve, reject) => {
      if (this.assignmentData?.finance?.rate) {
        this.assignmentData?.finance?.rate?.forEach(element => {
          if (element?.rates) {
            let rateInfo = new Array();
            let regular = element?.rates?.filter(function (e, index) {
              if (e.rate_factor?.toLowerCase() == 'regular' || e.rate_factor?.toLowerCase() == RATETYPES.ST) {
                e.index = index;
                e.name = e.name || 'Regular';
              }
              return e.rate_factor?.toLowerCase() === 'regular' || e.rate_factor?.toLowerCase() == RATETYPES.ST;
            });
            if (regular?.length > 0 && regular[0].index >= 0) {
              element?.rates.splice(regular[0].index, 1);
              rateInfo = [...regular];
            }
            let ot = element?.rates.filter(function (e, index) {
              if (e.rate_factor?.toLowerCase() == RATETYPES.OT) {
                e.index = index;
              }
              return e.rate_factor?.toLowerCase() === RATETYPES.OT;
            });
            if (ot?.length > 0 && ot[0].index >= 0) {
              element?.rates.splice(ot[0].index, 1);
              rateInfo = [...rateInfo, ...ot];
            }
            let dt = element?.rates.filter(function (e, index) {
              if (e.rate_factor?.toLowerCase() == RATETYPES.DT) {
                e.index = index;
              }
              return e.rate_factor?.toLowerCase() === RATETYPES.DT;
            });
            if (dt?.length > 0 && dt[0].index >= 0) {
              element?.rates.splice(dt[0].index, 1);
              rateInfo = [...rateInfo, ...dt];
            }
            if (element?.rates) {
              element.rates = [...rateInfo, ...element?.rates];
            }
          }
        });
        resolve();
      }
    });
  }
  getFormatDate(date){
    const d = new Date(date * 1000);
    return `${d.getUTCDay()}/${d.getUTCDate()}/${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
  }
  
  createActivityWiseRateFactorsArray(rates_from_assignment: any[]) {
    this.activity_wise_rate_factors_arr = [];
    this.activity_wise_rate_factors_arr_show_hide = [];
    let rate_factor: any[] = [];
    rate_factor = JSON.parse(JSON.stringify(rates_from_assignment));
   
    for (var i = 0; i < rate_factor?.length; i++) {
      this.activity_wise_rate_factors_arr[i] = rate_factor[i]?.rate_factors;
      let rate_factors_arr: RateFactorsShowHide[] = [];
      for (var j = 0; j < rate_factor[i]?.rate_factors?.length; j++) {
        let rate: RateFactorsShowHide = rate_factor[i].rate_factors[j];
        let rate_factors_local: RateFactorsShowHide = { abbreviation: rate.abbreviation, bill_rate: false, pay_rate: false };
        rate_factors_arr.push(rate_factors_local);      
      }
      this.activity_wise_rate_factors_arr_show_hide.push(rate_factors_arr);
      }
    }

  getRateName(activityindex,abbr, ratetype, index) {
    let activity_rate_factor_array_comp: RateFactorsWithEdit[] = this.activity_wise_rate_factors_arr[activityindex];
    const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr?.toLowerCase());
    if (ratetype === "billrate" && tempRateFactor?.bill_rate?.length > index) {
      return this.returnRateName(tempRateFactor?.bill_rate[index]);
    }
    else if (ratetype === "payrate" && tempRateFactor?.pay_rate?.length > index) {
      return this.returnRateName(tempRateFactor?.pay_rate[index]);
    }
    else return "";
  }
  getRateFactorVal(activityindex,abbr, ratetype, index) {
    let activity_rate_factor_array_comp: RateFactorsWithEdit[] = this.activity_wise_rate_factors_arr[activityindex];
    const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr?.toLowerCase());
    if (ratetype === "billrate" && tempRateFactor?.bill_rate?.length > index) {
      return this.accuracyPipe.transform(tempRateFactor?.bill_rate[index].factor, this.accuracyConfig.rate, { isEdit: true });
    }
    else if (ratetype === "payrate" && tempRateFactor?.pay_rate?.length > index) {
      return this.accuracyPipe.transform(tempRateFactor?.pay_rate[index]?.factor, this.accuracyConfig.rate, { isEdit: true });
    }
    else return "";

  }
  returnRateName(rate) {
    if (rate != null && rate != undefined && rate?.rate_type != "") {
      return rate.rate_type === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
    }
    else {
      return "";
    }
  }
  showPopOver(activityindex, abbr, ratetype) {
    let activity_rate_factor_array_comp: RateFactorsShowHide[] = this.activity_wise_rate_factors_arr_show_hide[activityindex];
    const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr);
    if (tempRateFactor == null || tempRateFactor == undefined)
      return ;
    if (ratetype === "billrate") {
      tempRateFactor.bill_rate = !tempRateFactor.bill_rate;
    }
    else if (ratetype === "payrate") {
      tempRateFactor.pay_rate = !tempRateFactor.pay_rate;
    }
  }

  hidePopOver(activityindex, abbr, ratetype) {
    let activity_rate_factor_array_comp: RateFactorsShowHide[] = this.activity_wise_rate_factors_arr_show_hide[activityindex];
    const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr);
    if (tempRateFactor == null || tempRateFactor == undefined)
      return ;
    if (ratetype === "billrate") {
      tempRateFactor.bill_rate = !tempRateFactor.bill_rate;
      return tempRateFactor.bill_rate;
    }
    else if (ratetype === "payrate") {
      tempRateFactor.pay_rate = !tempRateFactor.pay_rate;
      return tempRateFactor.pay_rate;
    }
  }
  active(activityindex, abbr, ratetype) {
    if(abbr) {
      let activity_rate_factor_array_comp: RateFactorsShowHide[] = this.activity_wise_rate_factors_arr_show_hide[activityindex];
      const tempRateFactor = activity_rate_factor_array_comp?.find(rate => rate?.abbreviation?.toLowerCase() === abbr);
      if (tempRateFactor == null || tempRateFactor == undefined)
        return false;
      if (ratetype === "billrate") {
        return tempRateFactor.bill_rate;
      }
      else if (ratetype === "payrate") {
        return tempRateFactor.pay_rate;
      }
    }
  }

  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.assignmentData?.finance?.currency, accuracyType);
  }


  showManagerListTimesheet(){
    this.showHideManagerListTimesheet = true;
  }

  hideMoreNameListTimesheet(){
    this.showHideManagerListTimesheet = false;
  }

  showManagerListExpense(){
    this.showHideManagerListExpense = true;
  }

  hideMoreNameListExpense(){
    this.showHideManagerListExpense = false;
  }
  checkProperty(value , property) {
    return value?.hasOwnProperty(property);
  }
  getRateModelValue(value  :any) {
    return RATE_MODEL[value];
  }
}

