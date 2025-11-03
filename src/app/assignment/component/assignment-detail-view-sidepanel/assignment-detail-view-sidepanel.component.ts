import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { PROGRAM_TYPE } from '../../assignment-create/assignment-create.component';
import { forkJoin} from 'rxjs';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AssignmentService } from '../../assignment.service';
import { ActivatedRoute , Router } from '@angular/router';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { RATE_MODEL_PERMISSION , PAGE_ASSIGNMENENT, RATE_MODEL } from 'src/app/shared/enums';
import { AssignmentPermissions } from '../../enums/assignment-permissions';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { AssignmentConfigurationService } from 'src/app/program-setup/assignment-configuration/assignment-configuration.service';
import { VendorType } from '../../enums/vendor-type';
@Component({
  selector: 'app-assignment-detail-view-sidepanel',
  templateUrl: './assignment-detail-view-sidepanel.component.html',
  styleUrls: ['./assignment-detail-view-sidepanel.component.scss']
})
export class AssignmentDetailViewSidepanelComponent implements OnInit {
  getDateFromString = getDateFromString;
  private _assignmentData;
  public isClient:boolean= false;
  public isVendor:boolean= false;
  public isMsp:boolean= false;
  public isSuperAdmin:boolean= false;
  public hierarchy_ids: any;
  programManagedType: PROGRAM_TYPE;
  public customKeys = [];
  public foundationalKeys = [];
  public taxes = [];
  public fees = [];
  public programId: string;
  user_type: string;
  hide_fees= {};
  public is_tax_hidden = false;
  customFieldLabel ={};
  customFieldDataType ={};
  foundationDataLabel={};
  foundationalArray = [];
  foundationalSortedKeys = [];
  activeUponValueLabel: string= '--';
  dateFormat = 'dd/MM/yyyy';
  public isShow = false;
  hideMasterDataTypeName: boolean = false;
  accuracyConfig = AccuracyConfigEnum;
  showHideManagerListTimesheet: boolean = false;
  showHideManagerListExpense: boolean = false;
  financialFoundationalData = [];
  rate_model = RATE_MODEL;
  programDetails: any;
  sourcingType = 'sow';
  isDsaasAssignmemt: boolean= false;
  markupByRateTypeEnabled: boolean = false;
  @Input('assignmentData') set assignmentData(value: any) {
    if (value) {
      this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.programId = this.programDetails['id'];
      this.hierarchy_ids = value?.assignment?.hierarchy?.id;
      this._assignmentData = value;
      this.markupByRateTypeEnabled = this._assignmentData?.assignment?.is_markup_by_rate_type || false;
      if (value.foundational_data) {
        this.foundationalKeys = Object.keys(value.foundational_data);
      }
      if (value.custom) {
        this.customKeys = Object.keys(value.custom);
      }
      if (value.assignment?.tax?.length) {
        this.taxes = value.assignment?.tax?.filter(item => item.entity_type === 'tax');
        this.fees = value.assignment?.tax?.filter(item => item.entity_type === 'fee');
      }
      this.populateCustomAndFoudationalFields();
      this.reArrangeType().then(res => {
        if(this.assignmentData?.finance?.rate_factor?.length && this.assignmentData?.finance?.rate_factor[0]?.rate_factors && this.assignmentData?.finance?.rate_factor[0]?.rate_factors?.length) {
          let billableRateFactors  = this.assignmentData?.finance?.rate_factor[0]?.rate_factors?.filter(res => (res?.applicable || (res?.abbreviation?.toLowerCase() == 'regular' || res?.abbreviation?.toLowerCase() == 'st')));
          this.assignmentData.finance.rate[0].rates = this.assignmentData?.finance?.rate[0]?.rates.filter(res =>  billableRateFactors?.some(data=> data?.abbreviation?.toLowerCase() === res?.rate_factor?.toLowerCase()) );
        }
      });

    }
  }
  public _customFields : any;
  @Input('customFields') set customFields(value:any) {
    this._customFields = value;
  }
  get customFields() {
    return this._customFields;
  }

  @Input() config;
  @Input() jobID: string;
  @Input() programType: string;
  @Output() closeAssignmentDetails = new EventEmitter();
  assignementValueFor={};

  get assignmentData() {
    return this._assignmentData;
  }

  public assignmentDetails = 'visible';

  constructor(private eventStream: EventStreamService, private vendorService: VendorService, private storageService: StorageService,private s3UploadService: AwsS3FileUploadService,private assignmentService:AssignmentService,
    private route: ActivatedRoute ,private authorizationService: AuthorizationService,private assignmentConfigService: AssignmentConfigurationService , private router: Router,
    ) {
  }

  ngOnInit(): void {
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    if (this.user_type?.toUpperCase() === UserType.Client) {
      this.isClient = true;
    } else if (this.user_type?.toUpperCase() === UserType.Vendor){
      this.isVendor = true;
    } else if (this.user_type?.toUpperCase() === UserType.MSP) {
      this.isMsp = true;
    } else if (this.user_type?.toUpperCase() === UserType.Super_org) {
      this.isSuperAdmin = true;
    }
    this.is_tax_hidden = this.programDetails.config?.is_tax_hidden || false;
    this.hide_fees = this.programDetails?.config?.hide_fees  || {};    
    this.programManagedType = this.programDetails?.service_type;
    this.isShow = this.route?.snapshot?.queryParams['isshow'];
    this.dateFormat = this.assignmentService.getDefaultDateFormat();
    this.hideMasterDataTypeName = this.programDetails?.config?.show_only_master_codes ?? false;
    this.eventStream
      .on(Events.VIEW_ASSIGNMENT_DETAILS)
      .subscribe((data) => {
        if (data) {
          this.assignmentDetails = 'visible';
          this.getSsoIdConfig(this._assignmentData?.worker?.user?.organization?.id);
          this.assignmentConfigService.getAssignmentDropdownOptions()?.activeOnData?.forEach(activeOn=>{
            if(activeOn.value === this.assignmentData?.assignment?.active_on){
              this.activeUponValueLabel=  activeOn.label;
            }
          });
          this.checkDsaasAssignment();
        } else {
          this.assignmentDetails = 'hidden';
          this.closeAssignmentDetails.emit();
        }
      });
    this.getUnitOfMeasure();
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
  };

  checkNullValue(value  : any)
  {
       if(!value){
        return "0.00";
       }
       return value;
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
  openJobTemplate() {
    if (this.assignmentData?.assignment?.assignment_title?.id) {
      this.router.navigate([`job-template/create/${this.assignmentData?.assignment?.assignment_title?.id}/isview`]);
    }
  }

  checkDsaasAssignment() {
    if(( this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Payrolled || this.assignmentData?.assignment?.vendor_type?.toLowerCase() === VendorType.Both ) && this.isVendor  && this.assignmentData?.assignment?.is_dsaas) {
      this.isDsaasAssignmemt = true;
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
  populateCustomAndFoudationalFields() {
    const foundationHttp = this.vendorService.get(`/configurator/programs/${this.programId}/foundational-data-types?limit=100`);
    forkJoin([foundationHttp])
      .subscribe((res: any) => {
        const customFieldArray = this.customFields;
        this.customFields?.forEach((cust) => {
          this.customFieldDataType[cust?.slug] = cust?.type;
          this.customFieldLabel[cust?.slug] = cust?.label;
          if(cust?.type?.toUpperCase() == "SOURCE" && cust?.api_url){
            let url = cust?.api_url;
            url = url?.includes('?') ? url += `&user_ids=${this.assignmentData.custom[cust?.slug]}` : url += `?user_ids=${this.assignmentData.custom[cust?.slug]}`
            this.assignmentService.get(url).subscribe({
              next: (data: any) => {
                if(data?.members?.length > 0){
                  this.assignmentData.custom[cust?.slug] = data?.members[0]?.full_name;
                }
              }
          });
          }
        });
        const foundationalArray = res[0]?.foundational_data_types;
        foundationalArray?.forEach((cust) => {
          this.foundationDataLabel[cust?.slug] = cust?.name;
          if(cust?.configuration?.hasOwnProperty('financial_master_data_type') && cust?.configuration?.financial_master_data_type !== 'false' ? Boolean(cust?.configuration?.financial_master_data_type) : false) {
            this.financialFoundationalData?.push(cust?.name);
          }
        });
      })
  }
  downloadS3Attachment(file:any) {
    if(file && file?.name && file?.key){
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  reArrangeType() {
    return new Promise<void>((resolve) => {
      let RateInfo = new Array();
      var regular = this.assignmentData?.finance?.rate?.[0]?.rates?.filter(function (e, index) {
        if (e.rate_factor?.toLowerCase() == 'regular' || e.rate_factor?.toLowerCase() == 'st') {
          e.index = index;
          e.name = e?.name || 'Regular';
        }
        return e?.rate_factor?.toLowerCase() === 'regular' || e?.rate_factor?.toLowerCase() == 'st';
      });
      if (regular?.length > 0 && regular?.[0].index >= 0) {
        this.assignmentData?.finance?.rate?.[0]?.rates?.splice(regular?.[0]?.index, 1);
        RateInfo = [...regular];
      }
      var ot = this.assignmentData?.finance?.rate?.[0]?.rates.filter(function (e, index) {
        if (e?.rate_factor?.toLowerCase() == 'ot') {
          e.index = index;
        }
        return e.rate_factor?.toLowerCase() === 'ot';
      });
      if (ot?.length > 0 && ot?.[0].index >= 0) {
        this.assignmentData?.finance?.rate[0]?.rates?.splice(ot?.[0].index, 1);
        RateInfo = [...RateInfo, ...ot];
      }

      var dt = this.assignmentData?.finance?.rate?.[0]?.rates?.filter(function (e, index) {
        if (e?.rate_factor?.toLowerCase() == 'dt') {
          e.index = index;
        }
        return e.rate_factor?.toLowerCase() === 'dt';
      });
      if (dt?.length > 0 && dt?.[0].index >= 0) {
        this.assignmentData?.finance?.rate?.[0]?.rates?.splice(dt?.[0]?.index, 1);
        RateInfo = [...RateInfo, ...dt];
      }
      if (this.assignmentData?.finance?.rate?.[0]?.rates) {
        this.assignmentData.finance.rate[0].rates = [...RateInfo, ...this.assignmentData?.finance?.rate?.[0]?.rates];
      }
      resolve();
    });
  }

  public removedUnwanted(name) {
    return name?.replace(/Mr |Mrs |Miss |Dr |Prof |MX |IND |Misc | SR$| Jr$| Sr$| III$| IV$| V$/ig, '');
  }

  public shortAssignmentId(assignmentId = '') {
    if (assignmentId?.includes(' AM-')) {
      assignmentId = assignmentId?.substr(assignmentId?.lastIndexOf(' AM-'));
    }
    return assignmentId;
  }

  public sidebarClose() {
    this.assignmentDetails = 'hidden';
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
  getRateModelValue(value : any) {
    return RATE_MODEL[value];
  }
}
