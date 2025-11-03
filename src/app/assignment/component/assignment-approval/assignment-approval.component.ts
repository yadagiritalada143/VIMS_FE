import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { AssignmentService } from '../../assignment.service';
import { AccessType, ApprovalStatus } from 'src/app/shared/enums';
import { PendingItemTypes, SubStatusTypes } from '../../enums/pending-item-types';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { LocalDateFormatPipe } from '../../../shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { Router } from '@angular/router';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AssignmentPermissions } from '../../enums/assignment-permissions';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT } from 'src/app/shared/enums';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AssignmentWorkflowActions } from '../../enums/workflow-actions';
import moment from 'moment';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

export enum PROGRAM_TYPE {
  SELF_SERVICED = 'SELF-SERVICED',
  MSP_MANAGED = 'MSP-MANAGED'
}
export enum Permissions {
  ADMIN_OVERRIDE_ON_APPROVAL= 'admin_override_on_approval'
}
export enum Approval {
  SEQUENCE = 'sequence',
  ASSIGNMENT= 'assignment'
}
export enum ApprovalState {
  APPROVE = 'approve',
  REJECT= 'reject'
}
@Component({
  selector: 'app-assignment-approval',
  templateUrl: './assignment-approval.component.html',
  styleUrls: ['./assignment-approval.component.scss'],
})
export class AssignmentApprovalComponent implements OnInit, OnDestroy {
  adminApprovalMode: string= 'sequence';
  getDateFromString = getDateFromString;
  @Input() programId: string;
  @Input() assignmentId: string;
  @Input() currency: string;
  @Input() detailsConfig;
  @Input() jobID: string;
  @Input() programType: string;
  @Input() timezone: string;
  @Input() pendingItem: any;
  memberId: any;
  is_reassigned_user: any;
  @Input() public set assignmentListData(value : any) {
    if(Object.keys(value)?.length) {
      this.assignmentService.populateCustomFields(this.programId , value?.assignment?.hierarchy?.id).then((data) => {
        this.customFields = data;
      });
    }
  }
  @Output() updateAssignmentData = new EventEmitter();
  @Output() checkPendingStatus = new EventEmitter();
  @Output() updateLockStatus = new EventEmitter();
  public request_sub_type: string;
  approvalUrl:any;
  customFields: any;
  @Input() set assignmentSubStatus(value: string) {
    this.request_sub_type = value;
 }
  public revisionHistory = [];
  approversList;
  public updationDetails: any;
  public title = 'Assignment Update';
  public currentUserId: string;
  public isOpenReject = false;
  public isOpenDetails = false;
  public assignmentData;
  public effectiveDate;
  logs:Log= undefined;
  isLock = false;
  accuracyConfig = AccuracyConfigEnum;
  private subscrptions: Subscription[] = [];
  assignmentPermissions= AssignmentPermissions;
  public readonly BudgetFields = [
    'timesheet_budget',
    'gross_allocated_budget',
    'estimated_tax',
    'net_allocated_budget',
    'regular_billrate',
    'regular_vendor_rate',
    'billrate',
    'payrate',
    'fee',
    'vendor_rate',
    'sow_milestone_balance',
    'estimated_adjustment',
    'adjustment fee'
  ];
  public readonly ApprovalStatus = ApprovalStatus;
  public readonly PendingItemTypes = PendingItemTypes;
  public readonly SubStatusTypes = SubStatusTypes;

  user_type: string;
  hide_fees= {};
  isVendor = false;
  public is_tax_hidden = false;
  isClient = false;
  isMsp = false;
  isSuperAdmin = false;
  roleAccess: any;
  programManagedType: PROGRAM_TYPE;
  approvalChainId: any;
  public pageNumber = 1;
  public limit = 25;
  public multiApprovals:any = {review:true,approvals:true,acceptance:true};
  constructor(
    private assignmentService: AssignmentService,
    private transform: LocalDateFormatPipe,
    private storageService: StorageService,
    private alertService: AlertService,
    private eventStream: EventStreamService,
    private loaderService: LoaderService,
    private authorizationService: AuthorizationService,
    public router: Router,
    private accuracyPipe: AccuracyPipe
  ) {}

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

  ngOnInit() {
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    this.roleAccess = this.storageService.get('account')?.role?.access;
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.is_tax_hidden = programDetails.config?.is_tax_hidden || false;
    this.hide_fees = programDetails?.config?.hide_fees  || {};
    this.currentUserId = this.storageService.get('account').id;
    this.setUserType();
    this.getPendingItem();
    this.getAssignmentLockStatus();
    const action = this.getWorkflowAction(this.pendingItem?.request_type);
    this.approvalUrl = `/approval/programs/${this.programId}/assignments/${this.assignmentId}/approval-instances?workflow_action=${action}`;
  }
  getWorkflowAction(requestType: PendingItemTypes): AssignmentWorkflowActions {
    let action: AssignmentWorkflowActions;
    switch (requestType) {
      case PendingItemTypes.AdditionalBudget: {
        action = AssignmentWorkflowActions.BudgetExtension;
        break;
      }
      case PendingItemTypes.CreateAssignment: {
        action = AssignmentWorkflowActions.Default;
        break;
      }
      case PendingItemTypes.Terminate: {
        action = AssignmentWorkflowActions.Termination;
        break;
      }
      case PendingItemTypes.UpdateAssignment: {
        action = AssignmentWorkflowActions.AssignmentAmendment;
        break;
      }
      default: {
        action = AssignmentWorkflowActions.AssignmentAmendment;
        break;
      }
    }
    return action;
  }

  getPendingItem() {
    this.loaderService.show();
    this.assignmentService.getAssignmentHistory(this.programId, this.assignmentId, this.pageNumber, this.limit).subscribe(
      {next:(res: any) => {
        this.pendingItem = res?.data?.assignment.find(({ status }) => status.toLowerCase() === ApprovalStatus.pending);
        this.revisionHistory = [];
        if (this.pendingItem) {
          this.assignmentService.getApproversList(this.programId, this.assignmentId, this.pendingItem?.request_type)
          .subscribe((data) => {
            this.approversList = data;
          })

          if (this.pendingItem?.revision !==-1 ) {
            this.getRequestHistory(this.pendingItem?.revision);
          } else {
            this.loaderService.hide();
          }
        } else {
          this.router.navigate([`/assignment/details/${this.assignmentId}/final?tab=assignment`]);
          this.checkPendingStatus.emit();
        }
        this.loaderService.hide();
      },
      error: (err) => {
        this.loaderService.hide();
      }
    });
  }

  getRequestHistory(revision: number) {
    this.assignmentService.getHistoryRevDetails(this.programId, this.assignmentId, revision).subscribe({next: (res: any) => {
        if (res) {
          const Details = res?.data?.assignments;
          this.title = Details.request_title;
          this.effectiveDate = Details.effective_date ? getDateFromString(Details.effective_date) : Details.effective_date;
          this.updationDetails = {
            impersonated_by: Details?.impersonated_by,
            updatedBy: Details?.updated_by?.name,
            updatedByInitial: Details?.updated_by?.initials,
            updatedOn: Details?.created_at,
            updateReason: Details?.reason_code,
            updateNotes: Details?.request_notes,
            documents: JSON.parse(Details?.documents),
          };
          const HistoryData = res?.data?.assignments?.compare_meta_data;
          for (const property in HistoryData) {
            if (HistoryData.hasOwnProperty(property)) {
              HistoryData[property].forEach(item => {
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
                }else if(property?.toLocaleLowerCase() === 'adjustment fee details') {
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
              }  else if (property === 'Rate Factor Detail') {
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
                      hidden: Details?.assignment?.is_markup_by_rate_type ? false : true,
                      isPercentage: true,
                      type: property
                    });
                  }
                  if (item.hasOwnProperty('cost_component')) {
                    const costComponents = Details?.finance?.rate_factor?.[0]?.rate_factors?.find(r => r?.abbreviation?.toLowerCase() === item.abbreviation?.toLowerCase())?.cost_component;
                    for (const [cc_code, update] of Object.entries(item?.cost_component || {})) {
                      const accuracy = ['percentage', 'percent'].includes(costComponents?.[cc_code]?.type) ? this.accuracyConfig.markup_percentage : this.accuracyConfig.markup;
                      rateFactorItems.push({
                        field_name: item?.label,
                        label: `${item?.label} ${cc_code}`,
                        old_value: this.accuracyPipe.transform(update?.['old_value'], accuracy, { isEdit: true }),
                        new_value: this.accuracyPipe.transform(update?.['new_value'], accuracy, { isEdit: true }),
                        isPercentage: accuracy === this.accuracyConfig.markup_percentage,
                        isCurrency: accuracy === this.accuracyConfig.markup,
                        hidden: Details?.assignment?.is_cost_component ? false : true,
                        type: property
                      });
                    }
                  }
                  this.revisionHistory.push(...rateFactorItems);
                  return;
                }
              }
                 else {
                  // check compare meta data is property is not tax or fee
                  // if (item.label === undefined || item.label === null) {
                  //   // to handel existing data labels
                  // commented code for doubled text for Rate Bill rate, Rate Vendor rate, Rate Pay Rate
                  //   item.label = item.field_name;
                  // }
                  if ((item?.label?.toLowerCase() === 'end date') || (item?.label?.toLowerCase() === 'start date')){
                    item.old_value = this.transform.transform(getDateFromString(item.old_value), '' , '' ,'', true);
                    item.new_value = this.transform.transform(getDateFromString(item.new_value), '' , '' ,'', true);
                  }
                  if (item?.field_name === 'rate') {
                    const rateItems = [];
                    for (const key in item.old_value.rates) {
                      if (key?.toLowerCase() !== 'default' && key?.toLowerCase() !=='applicable'&& key?.toLowerCase()!=='billable' && key?.toLowerCase() !=='rate_factor' &&item.old_value.rates.hasOwnProperty(key) && item?.old_value?.rates[key]?.toLowerCase() !== item?.new_value?.rates[key]?.toLowerCase()) {
                        rateItems.push({
                          field_name: item?.field_name,
                          old_value: item?.old_value.rates[key]?.toUpperCase(),
                          new_value: item?.new_value.rates[key]?.toUpperCase(),
                          label: `${item?.label ? item?.label : ''}` + ' ' + this.setKeys(key),
                          isCurrency: this.checkCurrency(key),
                          hidden: this.checkUserStatus(key),
                          type : property
                        });
                      }
                    }
                    this.revisionHistory.push(...rateItems);

                  }
                  else if(item.field_name?.toLowerCase() === 'rate_factor')
                      {
                        const rateFactor = [];
                        for(const key in item)
                        {
                          if(item[key] && item[key]?.new_value && item[key]?.old_value && item[key]?.new_value[0]?.factor !== item[key]?.old_value[0]?.factor)
                          {
                              rateFactor.push({
                              old_value: item[key]?.old_value[0]?.factor,
                              new_value: item[key]?.new_value[0]?.factor,
                              label: `${item?.abbreviation} ${item[key]?.label}`?.toUpperCase(),
                              hidden: this.checkUserStatus(key),
                              type : property
                            });
                          }
                          if(item[key] && item[key]?.new_value && item[key]?.old_value && item[key]?.new_value[0]?.adjustment !== item[key]?.old_value[0]?.adjustment)
                          {
                              rateFactor.push({
                              old_value: item[key]?.old_value[0]?.adjustment,
                              new_value: item[key]?.new_value[0]?.adjustment,
                              label: `${item?.abbrevation} ${item[key]?.label} adjustment`?.toUpperCase(),
                              hidden: this.checkUserStatus(key),
                              type : property
                            });
                          }
                        }
                        this.revisionHistory.push(...rateFactor);
                      }
                  else {
                    item.isCurrency = this.checkCurrency(item.field_name);
                    if(item?.field_name?.toLowerCase() == 'ot_exempt_position') {
                      item.new_value = item.new_value ? 'Yes' : 'No';
                      item.old_value = item.old_value ? 'Yes' : 'No';
                    }
                    item.new_value = item.new_value?.hasOwnProperty('ext') ? item?.new_value?.name :  item?.new_value ?? '';
                    item.old_value = item.old_value?.hasOwnProperty('ext') ? item?.old_value?.name :  item?.old_value ?? '';
                    item.type = property
                    this.revisionHistory.push(item);
                  }
                }
              });
              this.assignmentData = res.data?.assignments?.old_meta_data?.assignments;
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
              } else if([...this.customFields?.[0],...this.customFields?.[1]]?.filter(res => res?.type === 'DROPDOWN' && res?.slug === element?.field_name)[0]) {
                let value = [...this.customFields?.[0],...this.customFields?.[1]]?.filter(res => res?.type === 'DROPDOWN' && res?.slug === element?.field_name)[0].meta_data?.datasource?.options;
                element.old_value =value?.filter(res => res?.value == element?.old_value)[0]?.label;
                element.new_value = value?.filter(res => res?.value == element?.new_value)[0]?.label
              } else if([...this.customFields[0],...this.customFields[1]].filter(res => res?.type === 'PICKLIST' && res?.slug === element?.field_name)[0]) {
                let value = [...this.customFields[0],...this.customFields[1]]?.filter(res => res?.type === 'PICKLIST' && res?.slug === element?.field_name)[0];
                element.old_value =value?.pick_list?.picklist_item?.filter(res => res?.value == element?.old_value)?.[0]?.label;
                element.new_value = value?.pick_list?.picklist_item?.filter(res => res?.value == element?.new_value)?.[0]?.label;
              }
            }
          });
          let custom_fields = this.revisionHistory.filter(fields=> fields.type === 'Custom Fields');
          const filteredCustomFields = custom_fields?.filter(item1 => ![...this.customFields?.[0] , ...this.customFields?.[1]].some(item2 => item1?.field_name === item2?.slug && item1?.type === 'Custom Fields'));
          if(filteredCustomFields &&filteredCustomFields?.length > 0) {
            filteredCustomFields.forEach((cust, index )=> {
              let i = this.revisionHistory?.findIndex(c=>c?.field_name ===cust?.field_name);
              if(i !==-1) {
                this.revisionHistory.splice(i,1);
              }
            })
          }
          (this.customFields?.[0].concat(this.customFields?.[1]))?.forEach(cust => {
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
          })
        this.loaderService.hide();
        }
      },
      error: (err) => {
        this.loaderService.hide();
      }
    });
  }

  checkAccuracyConfigType(type) {
    if(type?.toLowerCase() === 'billing details') {
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
    if (isPercentage) { return false; }
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
  get hasApprovalOverridePermission() {
    let canOverRideApprovalProcess = false;
    if (this.isSuperAdmin) {
      canOverRideApprovalProcess = true;
    } else {
      const user_permission: [] = this.storageService.get(StorageKeys.USER_PERMISSION);
      if (user_permission && user_permission?.length > 0) {
        canOverRideApprovalProcess = user_permission?.some(permission => permission === Permissions?.ADMIN_OVERRIDE_ON_APPROVAL)
      }
    }
    return canOverRideApprovalProcess;
  }

  public async  approveUpdate(approval_chain_id: string, member) {
    this.logs= undefined;
    let adminApproval = this.adminApprovalMode === Approval?.ASSIGNMENT || false;
    if(!approval_chain_id) {
      const approver = this.approversList?.approvers?.find(list => list?.status?.toLowerCase() === ApprovalStatus.pending);
      if(approver) {
        approval_chain_id = approver.approval_chain_id;
      }
    }
    this.loaderService.show();
    this.subscrptions.push(
      this.assignmentService.approveAssignmentRequest(this.programId, this.assignmentId, this.pendingItem?.request_type, adminApproval, approval_chain_id, member?.is_reassigned_user).subscribe(
        {next: (res: any) => {
          this.alertService.success('Request approved successfully');
          if (this.adminApprovalMode === Approval?.ASSIGNMENT) {
            this.router.navigateByUrl(
              `/assignment/details/${this.assignmentId}/final?tab=assignment`
            );
          }
          this.getPendingItem();
          this.loaderService.hide();
          this.updateAssignmentData.emit();
          if((member?.id !== this.assignmentData?.assignment?.assignment_manager?.id) && (this.roleAccess === AccessType.OWN)) {
            this.router.navigate(['assignment/all-list'])
          }
        },
        error: (err) => {
          this.loaderService.hide();
          this.logs= { type: LOG_TYPE.ERROR, heading: err?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 404, additionalInfo:{trace_id: err?.error?.trace_id } };
          // this.alertService.error(err.message);
        },
      }),
    );
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

  public async rejectUpdate(approval_chain_id: string, member) {
    this.isOpenReject = true;
    this.approvalChainId = approval_chain_id;
    this.memberId = member?.id;
    this.is_reassigned_user = member?.is_reassigned_user;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.REJECT_BUDGET, true));
    });
  }

  public viewAssignmentDetails() {
    this.isOpenDetails = true;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.VIEW_ASSIGNMENT_DETAILS, true));
    });
  }

  public closeReject() {
    this.isOpenReject = false;
  }

  public rejectApprovalRequest({ value, type }) {
    this.logs= undefined;
    if(this.approvalChainId) {
      value.approval_chain_id = this.approvalChainId;
    } else {
      const approver = this.approversList?.approvers?.find(list => list?.status?.toLowerCase() === ApprovalStatus.pending);
        if(approver) {
          value.approval_chain_id = approver.approval_chain_id;
        }
    }
    this.subscrptions.push(
      this.assignmentService
        .rejectAssignmentRequest(
          this.programId,
          this.assignmentId,
          value,
          type,
          this.is_reassigned_user
        )
        .subscribe(
          {next:(res: any) => {
            this.alertService.success('Request rejected successfully');
            this.getPendingItem();
            this.updateAssignmentData.emit();
            if((this.memberId !== this.assignmentData?.assignment?.assignment_manager?.id) && (this.roleAccess === AccessType.OWN)) {
              this.router.navigate(['assignment/all-list'])
            }
          },
          error: (err) => {
            this.logs= { type: LOG_TYPE.ERROR, heading: err?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
            // this.alertService.error(err.message);
          }},
        ),
    );
  }

  public closeDetails() {
    this.isOpenDetails = false;
  }

  openPendingReview() {
    this.router.navigate([`/assignment/edit-assignment/${this.assignmentId}`], { queryParams: { update_for: 'review' } });
  }

  getAssignmentLockStatus(approval_chain_id = null , flag= false, type='', member = null) {
    this.logs = undefined;
    this.assignmentService.getAssignmentLockStatus(this.assignmentId, this.programId).subscribe((data: any) => {
      this.isLock = data?.data?.is_lock;
      if(this.isLock) {
        this.updateLockStatus.emit({ lockStatus: this.isLock, message: data?.data?.alerts?.message});
      }
      if (flag && type === ApprovalState.APPROVE && !this.isLock) {
        this.approveUpdate(approval_chain_id, member);
      } else if (flag && type === ApprovalState.REJECT && !this.isLock) {
        this.rejectUpdate(approval_chain_id, member)
      }
    });
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.currency, accuracyType);
  }
}
