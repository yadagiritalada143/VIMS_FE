import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AssignmentService } from '../../assignment.service';
import { Subscription } from 'rxjs';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { LocalDateFormatPipe } from '../../../shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ApprovalStatus } from 'src/app/shared/enums';
import { AssignmentPermissions } from '../../enums/assignment-permissions';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT } from 'src/app/shared/enums';
// import { RateVal, RateFactors, RateValWithEdit, RateFactorsWithEdit, RateFactorsShowHide } from '../../assignment.model'
import { IBudgetChartItem } from '../budget/budget.interfaces';
import { DonutColorScheme, DetailsChartColors, ApprovalChartColors } from '../budget/charts.const';
import { BudgetLabels } from '../budget/budget.enums';

import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { Router } from '@angular/router';
import moment from 'moment';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
export enum PROGRAM_TYPE {
  SELF_SERVICED = 'SELF-SERVICED',
  MSP_MANAGED = 'MSP-MANAGED'
}

@Component({
  selector: 'app-assignment-history',
  templateUrl: './assignment-history.component.html',
  styleUrls: ['./assignment-history.component.scss'],
})
export class AssignmentHistoryComponent implements OnInit, OnDestroy {
  public _customFields:any;
  public asssignmentDetail:any;
  public historyDetail:any = {} ;
  @Input() ViewHistoryPanel = 'hidden';
  @Input() rateModel ;
  @Input('customFields') set customFields(value:any) {
    this._customFields = value;
  }
  @Input('assignmentData') set assignmentData(value:any) {
       this.asssignmentDetail = value
  }
  get customFields() {
    return this._customFields;
  }
  get  assignmentData() {
     return this.asssignmentDetail;
  }
  programID: any;
  assignmentID: any;
  revision: any;
  revisionHistory = [];
  activityHistory = [];
  assignmentPermissions= AssignmentPermissions;
  updationDetails: any;
  accuracyConfig = AccuracyConfigEnum;
  BudgetFields = [
    'timesheet_budget',
    'gross_allocated_budget',
    'estimated_tax',
    'net_allocated_budget',
    'regular_billrate',
    'regular_vendor_rate',
    'fee',
    'rate',
    'billrate',
    'vendor_rate',
    'payrate',
    'estimated_adjustment',
    'adjustment fee'

  ];
  Assignmentdata: any;
  currency: string = undefined;
  getDateFromString = getDateFromString;
  private subscrptions: Subscription[] = [];
  currentDateFormat: any;
  user_type: string;
  hide_fees= {};
  isVendor = false;
  public is_tax_hidden = false;
  isClient = false;
  isMsp = false;
  isSuperAdmin = false;
  programManagedType: PROGRAM_TYPE;
  programType: any;
  logs:Log= undefined;
  approvalList: any;
  version: any;
  hasBudgetHistory = false;
  dateFormat: any = this.assignmentService.getDefaultDateFormat() + ' hh:mm:ss a z';
  public readonly ApprovalStatus = ApprovalStatus;
  public detailsChartData: IBudgetChartItem[];
  public detailsChartColorScheme= DonutColorScheme;
  public readonly BudgetLabels = BudgetLabels;
  budgetData: any;
  rate_factor_array: any[] = [];
  metaTooltip: boolean = false;
  assignmentCurrency: string ;
  constructor(
    private eventStream: EventStreamService,
    private sessionStorage: StorageService,
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
    private loaderService: LoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private transform: LocalDateFormatPipe,
    private authorizationService: AuthorizationService,
    private accuracyPipe: AccuracyPipe,
    private router: Router
  ) {}

  get isSelfManagedClientAdmin() {
    return ((this.programManagedType === PROGRAM_TYPE.SELF_SERVICED && this.isClient) || this.isSuperAdmin)
  }

  get showClientBillRate() {
    let rate_model = this.Assignmentdata?.old_meta_data?.assignments?.finance?.rate_model || this.rateModel;
    return this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_client_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_client_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase());
  }

  get showVendorBillRate() {
    let rate_model = this.Assignmentdata?.old_meta_data?.assignments?.finance?.rate_model || this.rateModel;
    return (this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_vendor_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_vendor_bill_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase())) && !(this.checkAuthorization(AssignmentPermissions.HIDE_VENDOR_BILL_RATE));
  }

  get showPayrate() {
    let rate_model = this.Assignmentdata?.old_meta_data?.assignments?.finance?.rate_model || this.rateModel;
    return (this.checkAuthorization(`${RATE_MODEL_PERMISSION.view_pay_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase()) || this.checkAuthorization(`${RATE_MODEL_PERMISSION.edit_pay_rate_for_}${rate_model}${PAGE_ASSIGNMENENT._page_assignment}`.toLowerCase())) && !(this.checkAuthorization(AssignmentPermissions.HIDE_PAY_RATE));
  }
  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  hideBillingDetails(permission) {
    return this.authorizationService.authorize(permission)
  }

  setUserType = () => {
    if (this.user_type?.toLowerCase() == UserType.Client.toLowerCase()) {
      this.isClient = true;
    } else if (this.user_type?.toLowerCase() == UserType.Vendor.toLowerCase()) {
      this.isVendor = true;
    } else if (this.user_type?.toLowerCase() == UserType.MSP.toLowerCase()) {
      this.isMsp = true;
    } else if (this.user_type?.toLowerCase() === UserType.Super_org.toLowerCase()) {
      this.isSuperAdmin = true
    }
  }

  ngOnInit(): void {
    const programDetails = this.sessionStorage?.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.sessionStorage?.get('user_type')?.toLowerCase();
    this.is_tax_hidden = programDetails?.config?.is_tax_hidden || false;
    this.hide_fees = programDetails?.config?.hide_fees  || {};    
    const dateformat = this.assignmentService.getDefaultDateFormat();
    this.currentDateFormat = `${dateformat}​ hh:mm:ss`
    this.programID = programDetails.id;
    this.assignmentID = this.route.snapshot.params.id;
    this.programType = programDetails?.config?.program_model || 'BILL_RATE';
    this.setUserType();
    this.subscrptions.push(
      this.assignmentService.getCurrency().subscribe(data => {
        if (data) {
          this.currency = data;
          this.changeDetectorRef.detectChanges();
        }
      }),
    );
    this.subscrptions.push(
      this.eventStream.on(Events.VIEW_HISTORY_OF_ASSIGNMENT).subscribe((data: any) => {
        if (data) {
          this.version = data?.revisionDetails?.version;
          this.revision = data.revisionDetails;
          this.currency = data.currency;
          this.getSsoIdConfig(this.assignmentData?.worker?.user?.organization?.id)
          this.showApprovalTable();
          this.getHistoryDetails();
          this.ViewHistoryPanel = 'visible';
        }
      }),
    );

   
  }

  
  getBudjetDetails(data) {
      this.budgetData = data;
      this.detailsChartData = [
        { amount: this.budgetData?.total_spend, label: BudgetLabels.SpendApproved },
        { amount: this.budgetData?.left_budget, label: BudgetLabels.TotalRemaining },
        { amount: this.budgetData?.total_pending_approval, label: BudgetLabels.AwaitingApproval },
      ].sort((a:any, b:any) => +b['amount'] - a['amount']);
      this.detailsChartColorScheme=[];
      this.detailsChartData.forEach(data =>{
        this.detailsChartColorScheme.push(this.findColor('details', data.label) );
      });
      if(this.detailsChartColorScheme?.length == 0){
        this.detailsChartColorScheme= DonutColorScheme;
      }
      this.changeDetectorRef.detectChanges();
    }
  public findColor(chartName: string, paramLabel: string) {
    const chartColors = chartName === 'details' ? DetailsChartColors : ApprovalChartColors;
    return chartColors && chartColors.find(({ label }) => label === paramLabel).color;
  }

  showApprovalTable()
  {
    this.assignmentService.getApproversData(this.programID, this.assignmentID, this.version).subscribe({next:(res: any)=> 
    {
      this.approvalList=res?.data;
    },error: (err) => {
      this.approvalList = {};
    }})
  }

  getHistoryDetails() {
    this.logs= undefined;
    this.loaderService.show();
    this.hasBudgetHistory = false;
    this.subscrptions.push(
      this.assignmentService.getHistoryRevDetails(this.programID, this.assignmentID, this.revision?.revision).subscribe(
        {next:(res: any) => {
          if (res) {
            const Details = res?.data?.assignments;
            this.Assignmentdata = res?.data?.assignments; 
            this.assignmentCurrency = this.Assignmentdata?.new_meta_data?.assignments?.finance?.currency ?? this.Assignmentdata?.old_meta_data?.assignments?.finance?.currency ;          
            this.updationDetails = {
              impersonated_by: Details?.impersonated_by,
              do_not_re_hire: Details?.do_not_re_hire,
              updatedBy: Details?.updated_by?.name,
              updatedByInitial: Details?.updated_by?.initials,
              updatedOn: Details?.updated_at,
              updateReason: Details?.reason_code,
              updateNotes: Details?.action_notes || Details?.requested?.notes,
              timezone: Details?.timezone,
              documents: Details?.documents ? JSON.parse(Details?.documents) : Details?.documents,
            };
            const HistoryData = res?.data?.assignments?.compare_meta_data;
            if(!HistoryData) {
              this.loaderService.hide();
              return;
            }
            if(HistoryData &&  HistoryData['Rate Factor Detail']) {
              this.rate_factor_array = HistoryData['Rate Factor Detail'];
            }
            for (const property in HistoryData) {
              if (HistoryData.hasOwnProperty(property)) {
                HistoryData[property]?.forEach(item => {
                  // check compare meta data is property is tax or fee
                  if (property === 'Tax Details' || property === 'Fee Details') {
                    if (item.label === undefined || item.label === null) {
                      // to handel existing data labels
                      item.label = item.field_name;
                    }
                    if (item?.field_name == 'tax') {
                      const rateItems = [];
                      item?.new_value?.forEach((newValue, index) => {
                        const oldValue = item?.old_value?.filter(res => res?.entity_name?.toLowerCase()?.trim() === newValue?.entity_name?.toLowerCase()?.trim());
                        if (oldValue && oldValue[0]) {
                          if(newValue?.amount_value !== oldValue[0]?.amount_value ) {
                          rateItems.push({
                            old_value: this.accuracyPipe.transform(oldValue[0]?.amount_value, this.accuracyConfig.tax_percentage, { isEdit: true }),
                            new_value: this.accuracyPipe.transform(newValue?.amount_value, this.accuracyConfig.tax_percentage, { isEdit: true }),
                            label: newValue?.entity_name,
                            isPercentage: true,
                            type:property
                          });
                         }
                         else if (newValue?.is_deleted) {
                          rateItems.push({
                            old_value: this.accuracyPipe.transform(newValue?.amount_value, this.accuracyConfig.tax_percentage, { isEdit: true }),
                            label: newValue?.entity_name,
                            isPercentage: true,
                            type: property,
                            fieldStrike : true
                          });
                         }
                        }
                        else {
                          rateItems.push({
                            new_value: this.accuracyPipe.transform(newValue?.amount_value, this.accuracyConfig.tax_percentage, { isEdit: true }),
                            label: newValue?.entity_name,
                            isPercentage: true,
                            type: property
                          });
                        }
                      });
                      this.revisionHistory.push(...rateItems);
                    } else {
                      item?.new_value?.forEach((newValue, index) => {
                        const oldValue = item?.old_value?.filter(res => res?.entity_name?.toLowerCase()?.trim() === newValue?.entity_name?.toLowerCase()?.trim());
                        if (oldValue && oldValue[0]) {
                          if (newValue?.amount_value !== oldValue[0]?.amount_value) {
                            let rateObj = {
                              old_value: this.accuracyPipe.transform(oldValue[0]?.amount_value, newValue?.amount_type === 'percentage' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { isEdit: true }),
                              new_value: this.accuracyPipe.transform(newValue?.amount_value, newValue?.amount_type === 'percentage' ? this.accuracyConfig.fee_percentage : this.accuracyConfig.fee, { isEdit: true }),
                              label: newValue?.label || newValue?.entity_name,
                              isPercentage: newValue?.amount_type === 'percentage',
                              type: property
                            };
                            if(rateObj?.label){
                              rateObj['label']=rateObj.label+" Fee";
                            }
                            rateObj['isCurrency'] = this.checkCurrency(item?.field_name, rateObj.isPercentage);
                            this.revisionHistory.push(rateObj);
                          }
                        }
                      });
                    }

                  } else if(property?.toLocaleLowerCase() === 'adjustment fee details') {
                      item?.new_value?.forEach((newValue, index) => {
                        item?.old_value?.forEach((oldValue, i) => {
                        if (newValue?.amount_value !== oldValue?.amount_value ) {
                          let feeObj: any = {
                            label: item?.label ? item?.label : null,
                            old_value: this.accuracyPipe.transform(oldValue?.amount_value, this.accuracyConfig.amount, { isEdit: true }),
                            new_value: this.accuracyPipe.transform(newValue?.amount_value, this.accuracyConfig.amount, { isEdit: true }),
                            type:property
                          };
                          feeObj.isCurrency = this.checkCurrency(item?.label, feeObj.isPercentage);
                          this.revisionHistory.push(feeObj);
                        }
                      });
                      });       
                  }
                  else if (property === 'Rate Factor Detail') {
                    if (item.hasOwnProperty('applicable')) {
                      const rateFactorItems = [];
                      rateFactorItems.push({
                        field_name: item?.label,
                        label: `${item?.label} (Rate Type)`,
                        old_value: item?.applicable?.old_value ? 'Enabled' : 'Disabled',
                        new_value: item?.applicable?.new_value ? 'Enabled' : 'Disabled',
                        type: property
                      });
                      this.revisionHistory.push(...rateFactorItems);
                      return;
                    }
                    if(item.hasOwnProperty('markup') || item.hasOwnProperty('cost_component')) {
                      const rateFactorItems = [];
                      if (item.hasOwnProperty('markup')) {
                        rateFactorItems.push({
                          field_name: item?.label,
                          label: `${item?.label} ${item?.markup?.label}`,
                          old_value: this.accuracyPipe.transform(item?.markup?.old_value, this.accuracyConfig.markup, { isEdit: true }),
                          new_value: this.accuracyPipe.transform(item?.markup?.new_value, this.accuracyConfig.markup, { isEdit: true }),
                          hidden: this.asssignmentDetail?.assignment?.is_markup_by_rate_type ? false : true,
                          isPercentage: true,
                          type: property
                        });
                      }
                      if (item.hasOwnProperty('cost_component')) {
                        const costComponents = this.asssignmentDetail?.finance?.rate_factor?.[0]?.rate_factors?.find(r => r?.abbreviation?.toLowerCase() === item.abbreviation?.toLowerCase())?.cost_component;
                        for (const [cc_code, update] of Object.entries(item?.cost_component || {})) {
                          const accuracy = ['percentage', 'percent'].includes(costComponents?.[cc_code]?.type) ? this.accuracyConfig.markup_percentage : this.accuracyConfig.markup;
                          rateFactorItems.push({
                            field_name: item?.label,
                            label: `${item?.label} ${cc_code}`,
                            old_value: this.accuracyPipe.transform(update?.['old_value'], accuracy, { isEdit: true }),
                            new_value: this.accuracyPipe.transform(update?.['new_value'], accuracy, { isEdit: true }),
                            isPercentage: accuracy === this.accuracyConfig.markup_percentage,
                            isCurrency: accuracy === this.accuracyConfig.markup,
                            hidden: this.asssignmentDetail?.assignment?.is_cost_component ? false : true,
                            type: property
                          });
                        }
                      }
                      this.revisionHistory.push(...rateFactorItems);
                      return;
                    }
                  }
                   else if (property?.toLowerCase() === 'budget estimate' && item?.budget_data) {
                    this.hasBudgetHistory = item?.budget_data ? true : false;
                    this.getBudjetDetails(item?.budget_data);
                    if(this.budgetData?.transaction_type) {
                    this.budgetData['transaction_type'] = this.budgetData?.transaction_type === 'credit' ? 'add':'reduce';
                    }
                  } else if (property?.toLowerCase() === 'remote worker flag') {
                    const remoteWorkerFlag = [];
                    if (item?.field_name?.toLowerCase() === 'remote_worker') {
                      remoteWorkerFlag.push({
                        field_name: item?.label,
                        label: item?.label,
                        old_value: item?.old_value ? 'ON' : 'OFF',
                        new_value: item?.new_value ? 'ON' : 'OFF',
                        type: property
                      });
                      this.revisionHistory.push(...remoteWorkerFlag);
                    }
                  } else if (property?.toLowerCase() === 'special temperory access') {
                    for (const type in item) {
                      const rateItems = [];
                      if (type?.toLowerCase() === 'timesheet') {
                        item[type].forEach(res => {
                          if (res?.old_value !== res?.new_value) {
                            rateItems.push({
                              field_name: res?.field_name,
                              label: res?.label,
                              old_value: res?.old_value?.toUpperCase() || '--',
                              new_value: res?.new_value?.toUpperCase() || '--',
                              type: property
                            });
                          }
                        });
                      }
                      this.revisionHistory.push(...rateItems);
                    }
                  }
                  else {
                    // check compare meta data is property is not tax or fee
                    // if (item.label === undefined || item.label === null) {
                    //   // to handel existing data labels
                    // commented code for doubled text for Rate Bill rate, Rate Vendor rate, Rate Pay Rate
                    //   item.label = item.field_name;
                    // }
           
                    if ((item?.label?.toLowerCase() === 'end date') || (item?.label?.toLowerCase() === 'start date') || (item?.label?.toLowerCase() === 'original start date')) {
                      item.old_value = this.transform.transform(getDateFromString(item.old_value), '' , '' ,'', true);
                      item.new_value = this.transform.transform(getDateFromString(item.new_value), '' , '' ,'', true);
                    }
                    if(item?.field_name?.toLowerCase() === 'activity_name') {
                      const rateItems = [];
                      rateItems.push({
                        field_name: item?.field_name,
                        label: item?.label,
                        old_value: item?.old_value?.toUpperCase() || '--',
                        new_value: item?.new_value?.toUpperCase() || '--',
                        type:property
                      });
                      this.revisionHistory.push(...rateItems);
                    }
                    if (item?.field_name?.toLowerCase() === 'rate') {
                      const rateItems = [];
                      const activeItems = [];
                      for (const key in item.old_value?.rates) {
                        if (key?.toLowerCase() !== 'default' && key?.toLowerCase() !=='applicable'&& key?.toLowerCase()!=='billable' && key?.toLowerCase() !=='rate_factor' && item.old_value.rates.hasOwnProperty(key) && this.accuracyPipe.transform(item?.old_value?.rates[key] , this.accuracyConfig.rate , {isEdit : true}) !== this.accuracyPipe.transform(item?.new_value?.rates[key] , this.accuracyConfig.rate , {isEdit : true})) {
                          let rate_factor_data = [];
                          if (this.rate_factor_array) {
                            this.rate_factor_array.forEach(res => {
                              if (item?.new_value?.rates?.rate_factor?.toUpperCase() === res?.abbreviation?.toUpperCase()) {
                                if (res[this.setRateLabel(key)]?.new_value && res[this.setRateLabel(key)]?.old_value && res[this.setRateLabel(key)]?.new_value[0]?.factor !== res[this.setRateLabel(key)]?.old_value[0]?.factor) {
                                  rate_factor_data.push({
                                    showModifiedRate: true,
                                    old_rate_value: res[this.setRateLabel(key)]?.old_value[0]?.factor,
                                    new_rate_value: res[this.setRateLabel(key)]?.new_value[0]?.factor
                                  })
                                }
                              }
                            });
                          }
                          rateItems.push({
                            field_name: item?.field_name,
                            old_value: item?.old_value?.rates[key]?.toUpperCase(),
                            new_value: item?.new_value?.rates[key]?.toUpperCase(),
                            label: `${item?.label ? item?.label : ''}` + ' ' + this.setKeys(key),
                            isCurrency: this.checkCurrency(key),
                            hidden: this.checkUserStatus(key),
                            rate_factor: item?.label?.toLowerCase(),
                            rate_type:key,
                            type:property,
                            rate_factor_detail : rate_factor_data
                          });
                          rate_factor_data = [];
                        }
                      }
                      this.revisionHistory.push(...rateItems);
                   
                      if(item?.old_value?.rates === null) {
                            activeItems.push({
                              rate_type: item?.label,
                              client_rate: item?.new_value?.rates?.billrate,
                              vendor_rate: item?.new_value?.rates?.vendor_rate,
                              pay_rate: item?.new_value?.rates?.payrate,
                              type:property
                            });
                      }
                      this.activityHistory.push(...activeItems);
                    } else {
                      if(item?.field_name?.toLowerCase() == 'ot_exempt_position') {
                        item.new_value = item.new_value ? 'Yes' : 'No';
                        item.old_value = item.old_value ? 'Yes' : 'No';
                      }
                      if(item?.field_name?.toLowerCase() == 'end_date' && item?.new_value?.toLowerCase() === item?.old_value?.toLowerCase()) {
                         item['hideOldValue'] = true;
                      }
                      const { old_value } = item;
                      if(item?.field_name?.toLowerCase() === 'adjusted_markup') {
                        item.label = `${item?.label} (%)`;
                      }
                      item.new_value = item.new_value?.hasOwnProperty('ext') ? item?.new_value?.name : item?.new_value ?? '';
                      item.old_value = item.old_value?.hasOwnProperty('ext') ? item?.old_value?.name : item?.old_value ?? '';
                      item.type = property
                      item.isCurrency = this.checkCurrency(item?.field_name);
                      if(item?.field_name ==='activity_name' || item.field_name === 'rate_factor') {return}
                      this.revisionHistory.push({...item, old_value: old_value ?? ''});
                    }
                  }
                });
              }
            } 
            this.revisionHistory.forEach(element => {
              if(this.isVendor && element?.field_name?.toLowerCase() === 'fee' || (element?.field_name?.toLowerCase() === 'fee' && this.hide_fees?.[this.user_type])) {
                element.hidden = true;
              }
              if(this.is_tax_hidden && element?.field_name?.toLowerCase() === 'tax') {
                element.hidden = true;
              }
              if (element?.type?.toLowerCase() === 'custom fields') {
                if ((moment(element?.old_value as string, ("YYYY-MM-DD" || "YYYY-MM-DD HH:mm:ss"), true).isValid() || moment(element?.new_value as string, ("YYYY-MM-DD" || "YYYY-MM-DD HH:mm:ss"), true).isValid())) {
                  let old_value = element.old_value ? moment(element.old_value as string, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm') : null;
                  let new_value = element.new_value ? moment(element.new_value as string, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm') : null;
                  element.old_value = old_value ? `${this.transform.transform(old_value.split(' ')[0], this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD)} ${element?.old_value?.split(' ')?.length > 1 ? old_value?.split(' ')[1] : ''}` : null;
                  element.new_value = new_value ? `${this.transform.transform(new_value.split(' ')[0], this.assignmentService.getDefaultDateFormat(), null, null, true, DATE_FORMAT?.FORMATYMD)} ${element?.new_value?.split(' ')?.length > 1 ? new_value?.split(' ')[1] : ''}` : null;
                } else if([...this.customFields[0],...this.customFields[1]].filter(res => res?.type === 'DROPDOWN' && res?.slug === element?.field_name)[0]) {
                  let value = [...this.customFields[0],...this.customFields[1]].filter(res => res?.type === 'DROPDOWN' && res?.slug === element?.field_name)[0].meta_data?.datasource?.options;
                  element.old_value =value?.filter(res => res?.value == element?.old_value)[0]?.label;
                  element.new_value = value?.filter(res => res?.value == element?.new_value)[0]?.label
                } else if([...this.customFields[0],...this.customFields[1]].filter(res => res?.type === 'PICKLIST' && res?.slug === element?.field_name)[0]) {
                  let value = [...this.customFields[0],...this.customFields[1]]?.filter(res => res?.type === 'PICKLIST' && res?.slug === element?.field_name)[0];
                  element.old_value =value?.pick_list?.picklist_item?.filter(res => res?.value == element?.old_value)?.[0]?.label;
                  element.new_value = value?.pick_list?.picklist_item?.filter(res => res?.value == element?.new_value)?.[0]?.label;
                }
              }
            });
          }
          this.activityHistory = this.getSortRates(this.activityHistory);
          let custom_fields = this.revisionHistory.filter(fields=> fields.type === 'Custom Fields');
          const filteredCustomFields = custom_fields.filter(item1 => ![...this.customFields?.[0] , ...this.customFields?.[1]].some(item2 => item1?.field_name === item2?.slug && item1?.type === 'Custom Fields'));
          if(filteredCustomFields &&filteredCustomFields?.length > 0) {
            filteredCustomFields.forEach((cust, index )=> {
              let i = this.revisionHistory.findIndex(c=>c?.field_name ===cust?.field_name);
              if(i !==-1) {
                this.revisionHistory.splice(i,1);
              }
            })
          }
          [...this.customFields?.[0] , ...this.customFields?.[1]].forEach(cust => {
            if(cust?.type?.toUpperCase() == "SOURCE" && cust?.api_url){
              let filteredValue = this.revisionHistory.filter(res => res?.type?.toLowerCase() === 'custom fields' && res?.field_name === cust?.slug)[0];
              let url = cust?.api_url;
              url = url?.includes('?') ? url += `&user_ids=${[filteredValue?.new_value ,filteredValue?.old_value  ]}` : url += `?user_ids=${[filteredValue?.new_value ,filteredValue?.old_value  ]}`
              this.assignmentService.get(url).subscribe({
                next: (data: any) => {
                  if(data?.members?.length > 0){
                    filteredValue.new_value = data?.members[0]?.full_name;
                    filteredValue.old_value = data?.members[1]?.full_name;
                  }
                }
              });
            }
          });
          this.loaderService.hide();
        },
        error: (err) => {
          this.logs= { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
        // this.alert.error(err?.error?.message);
          this.loaderService.hide();
        },
      }),
    );
  }
  checkAccuracyConfigType(type) {
    if(type?.toLowerCase() === 'billing details' || type?.toLowerCase() === 'rate factor detail') {
       return this.accuracyConfig?.rate;
    }
    else if (type?.toLowerCase() === 'adjust markup detail') {
      return this.accuracyConfig?.markup_percentage;
    }
    else if (type?.toLowerCase() === 'timesheet') {
      return this.accuracyConfig?.hour;
    }
    else {
      return this.accuracyConfig?.amount;
    }
  }

  setKeys(key) {  
    if(key === 'billrate') {
      return 'Bill Rate';
    } else if(key === 'payrate') {
      return 'Pay Rate';
    } else  return key;
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

  checkUserStatus(key) {
    if(key === 'billrate' && !this.showClientBillRate) {
      return true;
    } else if(key ==='vendor_rate' && !this.showVendorBillRate) {
      return true;
    } else if(key === 'payrate' && !this.showPayrate) {
      return true;
    } else {
      return false;
    }
  }

  checkCurrency(label, isPercentage = false) {
    if (isPercentage) { return false }
    else if(label?.toLowerCase() === 'st_hours' || label?.toLowerCase() === 'adjusted_markup') {
      return true;
    }
    for (const item of this.BudgetFields) {
      if (item === label) {
        return true;
      }
    }
    return false;
  }

  closehistoryView() {
    this.activityHistory = [];
    this.revisionHistory = [];
    this.updationDetails = {};
    this.eventStream.emit(new EmitEvent(Events.HIDE_HISTORY, false));
    this.ViewHistoryPanel = 'hidden';
    // this.closehistoryView.emit();
  }
  downloadAttachment(doc) {
    const payload = {
      key: doc.key,
      file_name: doc.filename,
    };
    this.subscrptions.push(
      this.assignmentService.downloadAttachment(this.programID, payload).subscribe(
        (data: any) => {
          if (data) {
            const link = document.createElement('a');
            link.href = data?.data?.url;
            link.download = doc.filename;
            link.dispatchEvent(new MouseEvent('click'));
          }
        },
        err => {
          this.logs= { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
          /* if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.alert.error(err?.error?.error?.errors[0]?.message);
          } else {
            this.alert.error('Some error occured while downloading attachment');
          } */
        },
      ),
    );
  }

  setRateLabel(data) {
   if(data === 'payrate') { return 'pay_rate'}
   else if(data === 'billrate') {return 'bill_rate'}
   else {return data};
  }

  getSortRates(rate_factors) {
    let ot = [];
    let st = [];
    let dt = [];
    let other =[];
    rate_factors.forEach((res) => {
      if (res?.rate_type?.toLowerCase()?.search("over time") > -1)
        ot.push(res);
      else if (res?.rate_type?.toLowerCase()?.search("double time") > -1)
        dt.push(res);
      else if (res?.rate_type?.toLowerCase()?.search("straight time rate") > -1)
        st.push(res);
      else
        other.push(res);
    });
    return [...st, ...ot, ...dt,...other];
  }

  ngOnDestroy(): void {
    this.subscrptions.forEach(sub => sub.unsubscribe());
  }
  getFormatDate(date){
    const d = new Date(date * 1000);
    return `${d.getUTCDay()}/${d.getUTCDate()}/${d.getUTCFullYear()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
  }
  // showPopOver(fieldname,rate_type) {
  //   let rateobj: any = this.rate_factor_array?.filter(ele => ele?.key === fieldname);
  //   if (rate_type === 'billrate') {
  //     if (rateobj[0]?.value?.bill_rate?.new_value && rateobj[0]?.value?.bill_rate?.new_value[0]?.is_edit) {
  //       rateobj[0].billrateactive = !rateobj[0].billrateactive;
  //     }
  //   }
  //   else if (rate_type === 'payrate') {
  //     if (rateobj[0]?.value?.pay_rate?.new_value && rateobj[0]?.value?.pay_rate?.new_value[0]?.is_edit) {
  //       rateobj[0].payrateactive = !rateobj[0].payrateactive;
  //     }
  //   }
  // }
  // hidePopOver(fieldname, rate_type) {
  //   let rateobj: any = this.rate_factor_array?.filter(ele => ele.key === fieldname);
  //   if (rate_type === 'billrate') {
  //     if (rateobj[0]?.value?.bill_rate?.new_value && rateobj[0]?.value?.bill_rate?.new_value[0]?.is_edit) {
  //       rateobj[0].billrateactive = !rateobj[0]?.billrateactive;
  //     } 
  //   }
  //   else if (rate_type === 'payrate') {
  //     if (rateobj[0]?.value?.pay_rate?.new_value && rateobj[0]?.value?.pay_rate?.new_value[0]?.is_edit) {
  //       rateobj[0].payrateactive = !rateobj[0]?.payrateactive;
  //     }
  //   }
  // }
  // active(fieldname, rate_type) {
  //   let rateobj: any = this.rate_factor_array.filter(ele => ele.key === fieldname);
  //   if (rate_type === 'billrate') {
  //     if (rateobj[0]?.value?.bill_rate?.new_value && rateobj[0]?.value?.bill_rate?.new_value[0]?.is_edit) {
  //       return rateobj[0]?.billrateactive;
  //     }
  //   }
  //   else if (rate_type === 'payrate') {
  //     if (rateobj[0]?.value?.pay_rate?.new_value && rateobj[0]?.value?.pay_rate?.new_value[0]?.is_edit) {
  //       return rateobj[0]?.payrateactive;
  //     }
  //   }
  // }
  // getRateName(fieldname, rate_type, value, index) {
   
  //   let rateobj: any = this.rate_factor_array?.filter(ele => ele?.key === fieldname);
  //   if (rate_type === "billrate") {
  //     if (value === "new") {
  //       if (rateobj[0]?.value?.bill_rate?.new_value && rateobj[0]?.value?.bill_rate?.new_value?.length > index) {
  //         return this.returnRateName(rateobj[0]?.value?.bill_rate?.new_value[index]?.rate_type);
  //       }
  //     }
  //     else if (value === "old") {
  //       if (rateobj[0]?.value?.bill_rate?.old_value && rateobj[0]?.value?.bill_rate?.old_value?.length > index) {
  //         return this.returnRateName(rateobj[0]?.value?.bill_rate?.old_value[index]?.rate_type);
  //       }
  //     }
  //   }
  //   if (rate_type === "payrate")
  //   {
  //     if (value === "new") {
  //       if (rateobj[0]?.value?.pay_rate?.new_value && rateobj[0]?.value?.pay_rate?.new_value?.length > index) {
  //         return this.returnRateName(rateobj[0]?.value?.pay_rate?.new_value[index]?.rate_type);
  //       }
  //     }
  //     else if (value === "old") {
  //       if (rateobj[0]?.value?.pay_rate?.old_value && rateobj[0]?.value?.pay_rate?.old_value?.length > index) {
  //         return this.returnRateName(rateobj[0]?.value?.pay_rate?.old_value[index]?.rate_type);
  //       }
  //     }
  //   }
  //   return "";
  // }
  // getRateFactorVal(fieldname, rate_type, value, index) {
  
  //   let rateobj: any[] = this.rate_factor_array?.filter(ele => ele.key === fieldname);

  //   if (rate_type === "billrate") {
  //     if (value === "new") {
  //       if (rateobj[0]?.value?.bill_rate?.new_value && rateobj[0]?.value?.bill_rate?.new_value?.length > index) {
  //         return this.accuracyPipe.transform(rateobj[0]?.value?.bill_rate?.new_value[index]?.factor, this.accuracyConfig.rate, { isEdit: true });
  //       }
  //     }
  //     else if (value === "old") {
  //       if (rateobj[0]?.value?.bill_rate?.old_value && rateobj[0]?.value?.bill_rate?.old_value?.length > index) {
  //         return this.accuracyPipe.transform(rateobj[0]?.value?.bill_rate?.old_value[index]?.factor, this.accuracyConfig.rate, { isEdit: true });
  //       }
  //     }
  //   }
  //   if (rate_type === "payrate") {
  //     if (value === "new") {
  //       if (rateobj[0]?.value?.pay_rate?.new_value && rateobj[0]?.value?.pay_rate?.new_value?.length > index) {
  //         return this.accuracyPipe.transform(rateobj[0]?.value?.pay_rate?.new_value[index]?.factor, this.accuracyConfig.rate, { isEdit: true });
  //       }
  //     }
  //     else if (value === "old") {
  //       if (rateobj[0]?.value?.pay_rate?.old_value && rateobj[0]?.value?.pay_rate?.old_value?.length > index) {
  //         return  this.accuracyPipe.transform(rateobj[0]?.value?.pay_rate?.old_value[index]?.factor, this.accuracyConfig.rate, { isEdit: true });
  //       }
  //     }
  //   }
  //   return "";

  // }
  // returnRateName(rate) {
  //   if (rate != null && rate != undefined) {
  //     return rate === "BILL_RATE" ? "Bill Rate" : "Pay Rate";
  //   }
  //   else {
  //     return "";
  //   }
  // }
  // displayRateType(rate_type) {
  //   if (rate_type != null && rate_type != undefined) {
  //     return rate_type === "billrate" ? "Bill Rate" : "Pay Rate";
  //   }
  //   else {
  //     return "";
  //   }
  // }

  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.assignmentCurrency, accuracyType);
  }
  goToAssignmentPage(id) {
    if (id) {
      this.router.navigate([`/assignment/details/${id}/final`], { queryParams: { tab: 'assignment' } });
    }
  }

  showDetailTooltip() {
    this.metaTooltip = true;
  }

  hideDetailTooltip() {
    this.metaTooltip = false;
  }
  getSsoIdConfig(worker_org) {
    this.assignmentService.getSsoIdConfig(worker_org).subscribe({next : (res:any) => {
      if(res) {
        this.historyDetail['show_ssoId']= res?.worker_sso_update_allowed;
        this.checkSsoConfig()
      }
    } , error : (err) => {
    }})
  }
  checkSsoConfig() {
    if(this.revisionHistory && this.revisionHistory.length > 0) {
      let index =  this.revisionHistory.findIndex(rev=> rev.field_name === 'sso_id');
       if(index !==-1 && !this.historyDetail['show_ssoId']) {
        this.revisionHistory.splice(index, 1);
       }
    }
  }
}
