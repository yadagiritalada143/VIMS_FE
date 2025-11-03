import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AssignmentService } from '../../assignment.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { PROGRAM_TYPE } from '../../assignment-create/assignment-create.component';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { AssignmentConfigurationService } from 'src/app/program-setup/assignment-configuration/assignment-configuration.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentPermissions } from '../../enums/assignment-permissions';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT , RATE_MODEL } from 'src/app/shared/enums';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { VendorType } from '../../enums/vendor-type';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { SourcingModel }from '../../enums/assignment-sourcing-models';
import moment from 'moment';
import { RateModelPayloadDefaults } from 'src/app/shared/components/rate-details/rate-details.component';

export enum SOURCING_TYPE {
  SOW = 'sow'
}
export enum RATETYPES {
  ST = 'st',
  OT = 'ot',
  DT = 'dt',
  HP = 'hp'
}

@Component({
  selector: 'app-assignment-details-view',
  templateUrl: './assignment-details-view.component.html',
  styleUrls: ['./assignment-details-view.component.scss']
})
export class AssignmentDetailsViewComponent implements OnInit, OnDestroy {
  _assignmentData;
  getDateFromString = getDateFromString;
  customData = {};
  foundationalData = {};
  customFieldLabel = {};
  foundationDataLabel = {};
  customFieldDataType = {};
  sourcingType = SOURCING_TYPE.SOW;
  currentProgram: any;
  accountDetails: any;
  activeUponValueLabel: string= '--';
  assignmentPermissions= AssignmentPermissions;
  rate_model : RATE_MODEL;
  accountConfig: any;
  public showUniqueId : Boolean = false;
  hideEyeIcon:boolean = true;
  fixedFoundationDataSet: any;
  accountCodeCreationActive: boolean = false;
  accountCodes: any;
  accountCodeLength : any;
  workerClassificationObj = {};
  foundationalSortedKeys = [];
  foundationalArray = []
  foundationCustomFieldsList: any;
  hideMasterDataTypeName: boolean = false;
  accuracyConfig = AccuracyConfigEnum;
  isDsaasAssignmemt: boolean= false;
  showHideManagerListTimesheet: boolean = false;
  showHideManagerListExpense: boolean = false;
  SourcingModel= SourcingModel;
  assignementValueFor= {};
  programTypeRateModel = {
    'billrate':'BILL_RATE',
    'markup':'MARKUP',
    'payrate':'PAY_RATE'
  }
  public _assignmentConfig: any;
  financialFoundationalData = [];
  dropdownLabelKeys = [];
  @Input('assignmentConfig') set assignmentConfig(value:any){
    this._assignmentConfig = value;
  }
  get assignmentConfig() {
    return this._assignmentConfig;
  }

  @Input('assignmentData') set assignmentData(value: any) {
    if (value) {
      this._assignmentData = value;
      this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
      this.isVendor = this.user_type == UserType.Vendor?.toLowerCase()
      const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      if (programDetails) {
        this.currentProgram = programDetails;
      }
      let accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
      if (accountConfig && accountConfig?.components) {
      this.accountCodes = this.assignmentData?.worker?.account_code.find(res => res?.status?.toLowerCase() === 'active');
      this.accountCodeLength = this._assignmentData?.worker?.account_code?.length;
      this.accountCodeCreationActive = true;
    }
    // this.programType = programDetails?.config?.program_model || 'BILL_RATE';
      this.programType = this.programTypeRateModel[this._assignmentData?.finance?.rate_model] || 'BILL_RATE';
      this.hide_fees = programDetails?.config?.hide_fees  || {};
      this.is_tax_hidden = programDetails.config?.is_tax_hidden || false;
      this.markupByRateTypeEnabled = this._assignmentData?.assignment?.is_markup_by_rate_type || false;
      this.costComponentEnabled = this._assignmentData?.assignment?.is_cost_component || false;
      if (this._assignmentData) {
        this.reArrangeType().then(res => {
          if(this.assignmentData?.finance?.rate_factor?.length && this.assignmentData?.finance?.rate_factor[0]?.rate_factors && this.assignmentData?.finance?.rate_factor[0]?.rate_factors?.length && this.assignmentData?.assignment?.is_hybrid) {
          let billableRateFactors  = this.assignmentData?.finance?.rate_factor[0]?.rate_factors?.filter(res => (res?.applicable || (res?.abbreviation?.toLowerCase() == 'regular' || res?.abbreviation?.toLowerCase() == RATETYPES.ST)));
          this.assignmentData.finance.rate[0].rates = this.assignmentData?.finance?.rate[0]?.rates?.filter(res =>  billableRateFactors?.some(data=> data?.abbreviation?.toLowerCase() === res?.rate_factor?.toLowerCase()) );
        }
        });
        this.rearrangeTaxFees();
        this.hideTaxFees();
      }
      if (value.foundational_data) {
        this.foundationalKeys = Object.keys(value.foundational_data);
        this.setFoundationlCustomFieldsDetails(value?.foundational_data);
      }
      if (value.custom) {
        this.customKeys = Object.keys(value.custom);
      }
      this.programId = programDetails.id;
      this.populateCustomAndFoudationalFields();
      this.accountDetails = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
      this.assignmentConfigurationService.getAssignmentDropdownOptions()?.activeOnData?.forEach(activeOn=>{
        if(activeOn.value === this.assignmentData?.assignment?.active_on){
          this.activeUponValueLabel=  activeOn.label;
        }
      });
      this.checkDsaasAssignment();
      this.getSsoIdConfig(this._assignmentData?.worker?.user?.organization?.id)
      // if (this._assignmentData?.assignment?.hierarchy) {
      //   this.getDetailOfHierarchy();
      // }
    }
  }
  get assignmentData() {
    return this._assignmentData;
  }
  err : String;
  @Input('error') set error(value : any){
    this.err = value;
  }

  @Input() budget;
  @Input() evaluationItems;
  @Input() evaluationVisualData;
  @Input() config;
  private programId: string = undefined;

  @Output() isBudgetNeedLoad = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  @Output() closeEvent = new EventEmitter();
  isAssignmentDetails = true;
  isWorkerInformation = false;
  isFoundationalData = false;
  isAssignmentUserDetails = false;
  isFinancialDetails = false;
  isFees = false;
  isBillingDetails = false;
  isTaxes = false;
  isBudgetEstimate = false;
  expand = true;
  isAddAdditionalBudget = 'hidden';
  customKeys = [];
  foundationalKeys = [];
  isBillDriven = false;
  programType: string;
  isFeesShow= true;
  rating = [{ 'value': 1, 'name': 'E' },
  { 'value': 2, 'name': 'D' },
  { 'value': 3, 'name': 'C' },
  { 'value': 4, 'name': 'B' },
  { 'value': 5, 'name': 'A' }
  ];
  isClient = false;
  isVendor = false;
  isMsp = false;
  isSuperAdmin = false;
  programManagedType: PROGRAM_TYPE;
  hide_fees= {} ;
  markupByRateTypeEnabled: boolean = false;
  costComponentEnabled: boolean = false;
  user_type: string;
  assignmentId: any;
  private subscrptions: Subscription[] = [];
  dateFormat = 'dd/MM/yyyy';
  public is_tax_hidden = false;
  public showTaxFeesDetails: boolean = false;
  public isShow = false;
  detailedValue: string = "assignmentDetails" ;
  constructor(private assignmentService: AssignmentService,
    private changeDetectorRef: ChangeDetectorRef,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private activatedRoute: ActivatedRoute,
    private alert: AlertService,
    private router: Router,
    private cryptoService: CryptoService,
    private s3UploadService: AwsS3FileUploadService,private assignmentConfigurationService:AssignmentConfigurationService,
    private authorizationService: AuthorizationService)
     { }

  ngOnInit(): void {
    this.assignmentId = this.activatedRoute.snapshot.params.id;
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.isClient = this.user_type == UserType.Client?.toLowerCase();
    this.isVendor = this.user_type == UserType.Vendor?.toLowerCase()
    this.isMsp = this.user_type == UserType.MSP?.toLowerCase()
    this.isSuperAdmin = this.user_type === UserType.Super_org?.toLowerCase()
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.assignmentService.getDefaultDateFormat();
    this.programManagedType = programDetails?.service_type;
    this.programId = programDetails.id;
    this.hideMasterDataTypeName = programDetails?.config?.show_only_master_codes ?? false;
    this.hide_fees = programDetails?.config?.hide_fees  || {};
    this.accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (this.accountConfig && this.accountConfig?.components) {
      this.fixedFoundationDataSet = this.accountConfig?.components;
    }
    this.isShow = this.activatedRoute?.snapshot?.queryParams['isshow'];
    window.scroll(0, 0);
    this.subscrptions.push(this.assignmentService.getCurrency().subscribe(data => {
      if (data) {
        this.changeDetectorRef.detectChanges();
      }
    }));
    this.getUnitOfMeasure();
    this.getWorkerClassification();
    const user_permission = this.storageService.get(StorageKeys.USER_PERMISSION);
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
  }

  reArrangeType() {
    return new Promise<void> ((resolve) => {
    if (this.assignmentData?.finance?.rate) {
      this.assignmentData?.finance?.rate?.forEach(element => {
        if (element?.rates) {
          let rateInfo = new Array();
          var regular = element?.rates?.filter(function (e, index) {
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
          var ot = element?.rates.filter(function (e, index) {
            if (e.rate_factor?.toLowerCase() == RATETYPES.OT) {
              e.index = index;
            }
            return e.rate_factor?.toLowerCase() === RATETYPES.OT;
          });
          if (ot?.length > 0 && ot[0].index >= 0) {
            element?.rates.splice(ot[0].index, 1);
            rateInfo = [...rateInfo, ...ot];
          }
          var dt = element?.rates.filter(function (e, index) {
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

  rearrangeTaxFees() {
    if (this.assignmentData?.assignment?.tax && this.assignmentData?.assignment?.tax?.length) {
      const order = ['msp_partner', 'vms', 'msp'];
      this.assignmentData.assignment.tax.sort((a, b) => {
        return order.indexOf(a.entity_name) - order.indexOf(b.entity_name);
      });
    }
  }

  hideTaxFees() {
    if (this.assignmentData?.assignment?.tax && this.assignmentData?.assignment?.tax?.length) {
      this.assignmentData?.assignment?.tax?.forEach(element => {
        if (this.isVendor && element?.entity_type?.toLowerCase() === 'fee' || (element?.entity_type?.toLowerCase() === 'fee' && this.hide_fees?.[this.user_type])) {
          element.hidden = true;
        }
        if (this.is_tax_hidden && element?.entity_type?.toLowerCase() === 'tax') {
          element.hidden = true;
        }
      });
      this.showTaxFeesDetails = this.assignmentData?.assignment?.tax?.every(item => { return item.hidden });
    }
  }
  updateDuration() {
    this.eventStream.emit(new EmitEvent(Events.UPDATE_ASSIGNMENT_DURATION, true,));
  }


  getWorkerClassification() {
    this.assignmentService.get(`/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=worker_classification&is_enabled=true&order_by=asc`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        if(picklist_items && picklist_items?.length) {
          picklist_items?.forEach(element => {
            this.workerClassificationObj[element?.value?.toLowerCase()] = element?.label;
          });
        }
      })
  }

  unitOfMeasureObj = {};
  getUnitOfMeasure() {
    this.assignmentService.get(`/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=unit_of_measure`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        picklist_items.forEach(element => {
          this.unitOfMeasureObj[element?.value?.toLowerCase()] = element?.label;
        });
      })
  }

  populateCustomAndFoudationalFields() {
      this.getAllCustomFields();
      this.getAllFoundationalFields();
  }
  getAllCustomFields() {
    if (this._assignmentData?.assignment?.hierarchy?.id) {
      this.customKeys = [];
      let url = `/configurator/programs/${this.programId}/custom-fields?entity_ref=ASSIGNMENTS&active=1&hierarchy_ids=${this._assignmentData?.assignment?.hierarchy?.id}`
      if (this._assignmentData && this.currentProgram?.config?.job_type && this._assignmentData?.assignment?.job_type && this._assignmentData?.assignment?.job_type?.length > 0) {
        url += `&job_type=${this._assignmentData?.assignment?.job_type?.join(',')}`
      }
      const customFieldHttp = this.assignmentService.get(url);
      customFieldHttp.subscribe((res: any) => {
        const customFieldArray = res?.custom_fields;
        const allDependsOnFields = [];
        customFieldArray?.forEach((cust) => {
          this.customKeys.push(cust?.slug);
          this.customFieldDataType[cust?.slug] = cust?.type;
          this.customFieldLabel[cust?.slug] = cust?.label;
          if (cust?.meta_data?.depends_on?.conditions?.length) {
            allDependsOnFields.push(...cust?.meta_data?.depends_on?.conditions.map(condition => ({ ...condition, dependOn: cust?.slug })));
          }
          if (cust?.type === 'DROPDOWN') {
            if (this.assignmentData?.custom) {
              let res = [];
              (Array.isArray(this.assignmentData?.custom[cust?.slug]) ? this.assignmentData?.custom[cust?.slug] : [this.assignmentData?.custom[cust?.slug]]).forEach(cf => {
                res.push((cust?.meta_data?.datasource?.options.filter(option => option?.value === cf).map(res => res?.value)) || this.assignmentData.custom[cust?.slug]);
              });
              cust?.meta_data?.datasource?.options?.forEach(res => {
                this.dropdownLabelKeys.push({'key' : res?.value , 'value' : res?.label})
              })
              this.assignmentData.custom[cust?.slug] = res.join(", ");
            }
          }
        });
        if (this.assignmentData?.custom && this.customFieldLabel) {
          let result = Object?.keys(this.customFieldLabel).filter(o1 => !Object?.keys(this.assignmentData?.custom).some(o2 => o1 === o2));
          let obj = {};
          if (Array.isArray(result) && result?.length > 0) {
            result.forEach((item) => {
              obj[item] = null;
            });
          }
          this.customData = Object.assign({}, obj, this.assignmentData?.custom);
          customFieldArray?.forEach((cust) => {
            if (cust?.type === 'NUMBERS') {
              if (cust?.meta_data?.show_in_thousands) {
                this.customData[cust?.slug] = this.customData[cust?.slug]?.toLocaleString('en-US', { minimumFractionDigits: cust?.meta_data?.decimal });
              } else if (!cust?.meta_data?.show_in_thousands && cust?.meta_data?.decimal) {
                this.customData[cust?.slug] = Number(this.customData[cust?.slug])?.toFixed(cust?.meta_data?.decimal)
              }
            }
            if (cust?.type.toUpperCase() == "TIME" || cust?.type.toUpperCase() == "DATETIME") {
              this.customData[cust?.slug] = cust?.type?.toUpperCase() == "TIME" ?
                ((this.customData[cust?.slug] as string)?.split(' ').length === 2 ? moment(this.customData[cust?.slug] as string, 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : moment(this.customData[cust?.slug] as string, 'HH:mm:ss').format('HH:mm'))
                : (this.customData[cust?.slug] as string)?.split(" ")?.[0] + ' ' + moment((this.customData[cust?.slug] as string)?.split(" ")?.[1], "HH:mm:ss").format('HH:mm');
            }
            if (cust?.type?.toUpperCase() === 'PASSWORD') {
              this.customData[cust?.slug] = "*".repeat(this.customData[cust?.slug].length);
            }
            if (cust?.type === 'PICKLIST') {
              this.customData[cust?.slug] = cust?.pick_list?.picklist_item?.filter(res => res?.value === this.customData[cust?.slug])?.[0]?.label;
            }
            if (cust?.type?.toUpperCase() == "SOURCE" && this.customData[cust?.slug]) {
              let url = cust.api_url;
              url = url?.includes('?') ? url += `&user_ids=${this.customData[cust?.slug]}` : url += `?user_ids=${this.customData[cust?.slug]}`
              this.assignmentService.get(url).subscribe({
                next: (data: any) => {
                  this.customData[cust?.slug] = data?.members[0]?.full_name;
                }, error: (error) => {
                  // this.loadCustomDetails = false;
                },
              });
            }
          })
          for (let val of allDependsOnFields) {
            if (this.customData?.hasOwnProperty(val?.slug) && val?.condition?.operator === '=' && val?.condition?.value && this.customData[val?.dependOn] && String(val?.condition?.value)?.toLowerCase() !== String(this.customData[val?.dependOn])?.toLowerCase()) {
              this.customKeys?.indexOf(val?.slug) > -1 ? delete this.customKeys[this.customKeys?.indexOf(val?.slug)] : null;
              delete this.customData[val?.slug];
            }
          }
        }
      });
    }
  }
  getDropDownLabelValue(value : any) {
    return this.dropdownLabelKeys.filter(res => res?.key === value)?.length ? this.dropdownLabelKeys?.filter(res => res?.key === value)?.[0]?.value : value;
  }
  filterAccountCodeConfiguredFields = (foundational_data_types: Array<any>) => {
    if (foundational_data_types && foundational_data_types.length > 0) {
      let foundationFields = [...foundational_data_types];
      if (this.fixedFoundationDataSet != null && this.fixedFoundationDataSet.length > 0) {
        this.fixedFoundationDataSet.forEach(fds => {
          foundational_data_types?.forEach(fd => {
            let isMultiPurpose = fd?.configuration?.is_multi_purpose === 'true';
            if (!isMultiPurpose && fd?.slug?.toLowerCase() === fds?.slug?.toLowerCase()) {
              let index = foundationFields.indexOf(fd)
              if (index !== -1) {
                foundationFields.splice(index, 1);
              }
            }
          });
        })
      }
      return foundationFields;
    }
    return foundational_data_types;
  }
  convertToJSON(value :any) {
    if( value && typeof value === 'string') return JSON?.parse(value);
    else return value;
  }
  checkKeys(key) {
    return this.customData?.hasOwnProperty(key);
  }
  getAllFoundationalFields()
  {
    this.foundationalSortedKeys = [];
    const foundationHttp = this.assignmentService.get(`/configurator/programs/${this.programId}/foundational-data-types?active=true&ordering=ref_order`);
    foundationHttp.subscribe((res: any)=>
      {
        this.foundationalArray = res?.foundational_data_types;
        this.foundationalArray = this.filterAccountCodeConfiguredFields(this.foundationalArray);
        this.foundationalArray?.forEach((fData) => {
          this.foundationDataLabel[fData?.slug] = fData?.name;
          if(fData?.configuration?.hasOwnProperty('financial_master_data_type') && fData?.configuration?.financial_master_data_type !== 'false' ? Boolean(fData?.configuration?.financial_master_data_type) : false) {
            this.financialFoundationalData?.push(fData?.name);
          }
        });
      this.foundationalArray?.forEach((fData) => {
        if (this.foundationalKeys.find((data) => data?.toLowerCase() === fData?.slug?.toLowerCase())) {
          this.foundationalSortedKeys.push(fData?.slug);
        }
      });
        if(this.assignmentData?.foundational_data && this.foundationDataLabel) {
          let result = Object?.keys(this.foundationDataLabel)?.filter(o1 => !Object?.keys(this.assignmentData?.foundational_data)?.some(o2 => o1 === o2));
          let obj = {};
          if(Array.isArray(result) && result?.length > 0 ){
          result.forEach((item) => {
            obj[item] = null;
          });
        }
          this.foundationalData = Object.assign({}, obj, this.assignmentData?.foundational_data);
        }

      });
  }
  setFoundationlCustomFieldsDetails(masterDataArray: any) {
    this.foundationCustomFieldsList = [];
    if(masterDataArray) {
    for (const key in masterDataArray) {
      masterDataArray[key]?.forEach(fdType => {
        if (fdType?.custom_fields && fdType?.custom_fields?.length > 0) {
          const customFields = [];
          customFields.push({
            label: fdType?.name,
            customFields: fdType?.custom_fields,
          });
          if (customFields?.length) {
            this.foundationCustomFieldsList.push({
              label: `${fdType?.name} dependent Custom Fields`,
              foundationalData: customFields,
            });
          }
        }
      });
    }
  }
  }
  changeCase(username) {
    return username?.replace('wip', 'WIP');
  }

  removedUnwanted(name) {
    return name?.replace(/Mr |Mrs |Miss |Dr |Prof |MX |IND |Misc | SR$| Jr$| Sr$| III$| IV$| V$/ig, '');
  }
  onAddAdditionalBudget() {
    this.isAddAdditionalBudget = 'visible';
  }
  onCreateClose(event) {
    this.isAddAdditionalBudget = 'hidden';
    if (event) {
      this.isBudgetNeedLoad.emit(true);
    }
  }

  shortAssignmentId(assignmentId = '') {
    if (assignmentId?.includes(' AM-')) {
      assignmentId = assignmentId?.substr(assignmentId?.lastIndexOf(' AM-'));
    }
    return assignmentId;
  }

  viewProfile() {
    this.eventStream.emit(new EmitEvent(Events.ASSIGNMENT_SIDEBAR_VIEW,
      {
        value: this.assignmentData,
        candidateId: this.assignmentData?.worker?.candidate?.id
      }));
  }
  getCloseEvent(event) {
    this.closeEvent.emit(true);
  }
  downloadAttachment(data) {
    data = this.cryptoService?.decrypt(data);
    const link = document.createElement('a');
    if (data) {
      link.href = data;
    }
    else {
      this.alert.error('Resume Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }

  downloadS3Attachment(file:any) {
    if(file && file.name && file.key){
      this.s3UploadService.downloadS3Attachment(file);
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
  checkNullValue(value  : any)
  {
       if(!value){
        return "0.00";
       }
       return value;
  }

  // getDetailOfHierarchy() { // Hierarchy based program type is not required program config has program type
  //   const url = `/configurator/programs/${this.programId}/hierarchy/${this.assignmentData?.assignment?.hierarchy?.id}`
  //   this.vendorService.get(url)
  //     .subscribe(res => {
  //       const { hierarchy } = res;
  //       let programType = hierarchy?.program_type;
  //       if (programType === 'BILL_RATE_DRIVEN') {
  //         this.isBillDriven = true;
  //       }
  //     })
  // }

  submit(data) {
    this.onSubmit.emit(data)
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  get profileImageHide() {
    return (this.currentProgram?.config?.is_candidate_image_hidden && this.accountDetails?.role?.name?.toLowerCase().includes('hiring manager'));
  }

  openJobTemplate() {
    if (this.assignmentData?.assignment?.assignment_title?.id) {
      this.router.navigate([`job-template/create/${this.assignmentData?.assignment?.assignment_title?.id}/isview`]);
    }
  }

  openJobTitle() {
    if(( this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Payrolled || this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Both ) && this.isVendor  && this.assignmentData?.assignment?.is_dsaas) {
       return;
    }
    if (this.assignmentData?.assignment?.job?.id) {
      this.router.navigate([`jobs/details/job-details/${this.assignmentData?.assignment?.job?.id}`]);
    }
  }

  navigateToActivityBasedPricing() {
    this.router.navigate(['/assignment/activity'],{ queryParams: { assignmentId: this.assignmentId} });
  }
  navigateToAccountCodeSetup() {
    this.router.navigate(['/setup/account-codes'], { queryParams: { assignmentId: this.assignmentId, workerId: this.assignmentData?.worker?.user?.id } });
  }
  showToolTip(amount : any, accuracy = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.assignmentData?.finance?.currency, accuracy);
  }
  checkDsaasAssignment() {
    if(( this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Payrolled || this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Both ) && this.isVendor  && this.assignmentData?.assignment?.is_dsaas) {
      this.isDsaasAssignmemt = true;
   }
  }
  copyToClipboard() {
    const work_location_str = `${this.assignmentData?.assignment?.work_location?.address_line_1 ? this.assignmentData?.assignment?.work_location?.address_line_1 + '\n' : this.assignmentData?.assignment?.work_location?.name +' - '+ this.assignmentData?.assignment?.work_location?.code + '\n'}${this.assignmentData?.assignment?.work_location?.address_line_2 ? this.assignmentData?.assignment?.work_location?.address_line_2 + '\n' : ''}${this.assignmentData?.assignment?.work_location?.city?.name ? this.assignmentData?.assignment?.work_location?.city?.name + ', ' : ''}${this.assignmentData?.assignment?.work_location?.state?.name ? this.assignmentData?.assignment?.work_location?.state?.name +' ' : ''}${this.assignmentData?.assignment?.work_location?.zipcode ? this.assignmentData?.assignment?.work_location?.zipcode + '\n' : '\n'}${this.assignmentData?.assignment?.work_location?.country?.name ? this.assignmentData?.assignment?.work_location?.country?.name  : ''}`
    navigator.clipboard.writeText(work_location_str);
  }
  getRateModelValue(value:any) {
   return RATE_MODEL[value];
  }

  detailCollapse(value){
    this.detailedValue = value;
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
  getSsoIdConfig(worker_org) {
    if(!worker_org) {
       return;
    }
    this.assignmentService.getSsoIdConfig(worker_org).subscribe({next : (res:any) => {
      if(res) {
        this.assignementValueFor['show_ssoId']= res?.worker_sso_update_allowed;
      }
    } , error : (err) => {
    }})
  }

  // View rate details
  rateDetailsVisible: boolean = false;

  get rateDetailsRateArray() {
    if (this.assignmentData?.finance?.rate?.length) {
      return this.assignmentData?.finance?.rate[0].rates?.filter(obj => obj?.rate_factor?.toLowerCase() != 'st') || [];
    } else {
      return [];
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
  }

  get rateModelPayload(): RateModelPayloadDefaults {
    return {
      rate_model: this.assignmentData?.finance?.rate_model,
      hierarchy: this.assignmentData?.assignment?.hierarchy?.id,
      msp_fee_types: null,
      msp_fee_value: null,
      msp_fee_funded_by: null
    }
  } 
  
  get standardRateDetails() {
    const ratesExist = this.assignmentData?.finance?.rate?.length && this.assignmentData?.finance?.rate[0]?.rates?.length;
    const stRates = ratesExist ? this.assignmentData?.finance?.rate[0].rates.find(obj => obj.rate_factor?.toLowerCase() === "st") : {};
    return {
      billrate: stRates?.billrate,
      payrate: stRates?.payrate,
      vendor_rate: stRates?.vendor_rate,
      markup: stRates?.markup || this.assignmentData?.finance?.vendor_markup || "0.0",
      cost_component: stRates?.cost_component
    }
  }
}
