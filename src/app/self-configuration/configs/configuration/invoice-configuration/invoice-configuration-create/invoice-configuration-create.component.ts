import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ConfigurationMode } from '../../../../../program-setup/expense-configuration/enums/configuration-mode.enums';
import { InvoiceConfigurationService } from '../../invoice-configuration/service/invoice-configuration.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';


export enum TransactionType {
  MANUAL= 'manual',
  AUTOMATIC= 'automatic'
}

@Component({
  selector: 'app-invoice-configuration-create',
  templateUrl: './invoice-configuration-create.component.html',
  styleUrls: ['./invoice-configuration-create.component.scss']
})
export class InvoiceConfigurationCreateComponent implements OnInit {
  public saveInprogress = false;
  logs: Log = undefined;
  public readonly configurationMode = ConfigurationMode;
  public foundationalData: any = [];
  public hierarchyIds: any = [];
  public payload: any = {
    config_name : "",
    config_uuid : "",
    is_active: 1,
    hierarchy_uuid: "",
    invoice_start_date: "",
    config: {
      invoice_rollup_logic: {
        rollup_file: false,
        rollup_method: "",
        rollup_by_field: "",
        rollup_file_format: "",
        rollup_file_method: "",
        rollup_file_template: ""
    },
      pa: false,
      rebate: {
        is_enabled: false,
        percentage: 0
      },
      rollback: false,
      msp_email: "",
      other_notes: false,
      to_template: {
        logo: "",
        address: "",
        position: "right"
      },
      batch_number: {
        code: "",
        type: 1,
        status: true,
        start_from: ""
      },
      client_email: "",
      credit_debit: {
        code: "",
        is_enabled: false
      },
      invoice_type: 2,
      from_template: {
        logo: "",
        address: "",
        position: "left"
      },
      invoice_cycle: null,
      tade_discount: false,
      invoice_number: {
        code: "",
        type: 1,
        start_from: ""
      },
      voucher_number: {
        code: "",
        type: 1,
        start_from: ""
      },
      week_start_day: null,
      client_rollback: false,
      download_option: [
        {
          user_type: "MSP",
          is_enabled: true,
          fee_taxable: true,
          tax_applicable: true
        },
        {
          user_type: "CLIENT",
          is_enabled: false,
          fee_taxable: true,
          tax_applicable: true
        },
        {
          user_type: "VENDOR",
          is_enabled: false,
          fee_taxable: true,
          tax_applicable: true
        }
      ],
      invoice_modules: [
        {
          is_enabled: true,
          fee_taxable: true,
          module_type: "TIMESHEET",
          tax_applicable: true
        },
        {
          is_enabled: true,
          fee_taxable: true,
          module_type: "EXPENSE",
          tax_applicable: true
        },
        {
          is_enabled: true,
          fee_taxable: true,
          module_type: "MISC_EXPENSE",
          tax_applicable: true
        },
        {
          is_enabled: true,
          fee_taxable: true,
          module_type: "BY_MILESTONE",
          tax_applicable: true
        }
      ],
      vendor_rollback: false,
      generate_invoice: false,
      invoice_template: [
        {
          type: "",
          label: "",
          format: ""
        }
      ],
      consolidate_invoice: {
        type: "",
        generate_time: null,
        consolidation_day: null,
        consolidation_cycle: {
          cycle_type: 1,
          cycle_end_at: null,
          cycle_start_at: null
        },
        consolidate_till_consolidation_day: false
      },
      transaction_complete: {
        type: "",
        option: "",
        start_day: "",
        generate_time: "",
        is_notes_mandatory: ""
      },
      foundational_selection: "",
      invoice_generated_time: null,
      invoice_generation_logic: 1,
      individual_download_option: [
        {
          user_type: "MSP",
          is_enabled: false,
          invoice_template: [
            {
              type: "",
              label: "",
              format: ""
            }
          ]
        },
        {
          user_type: "CLIENT",
          is_enabled: false,
          invoice_template: [
            {
              type: "",
              label: "",
              format: ""
            }
          ]
        },
        {
          user_type: "VENDOR",
          is_enabled: false,
          invoice_template: [
            {
              type: "",
              label: "",
              format: ""
            }
          ]
        },
        {
          user_type: "SUPER_ORG",
          is_enabled: false,
          invoice_template: [
            {
              type: "",
              label: "",
              format: ""
            }
          ]
        },
        {
          user_type: "ADMIN",
          is_enabled: false,
          invoice_template: [
            {
              type: "",
              label: "",
              format: ""
            }
          ]
        }
      ],
      cancel_approved_consolidated_invoice: false
    }
  }
  currentprogram: any = undefined;
  public mode: string = undefined;
  public configId: string = undefined;
  dateFormat: string = DATE_FORMAT.FORMATMMDDYY;
  calendarOptions: any = {
    language: 'English',
    range: false,
    enabledDateRanges: [
      { end: new Date() },
    ]
  };
  consolidationTime: boolean = false;
  isPaymentAuthorization: boolean = false;
  public options: any;
  isHideTCDropdown: boolean = false;
  isHideFoundationalSelection: boolean = false;
  updatedSelectBoxValue: any;
  inoiceNumberValue: any;
  batchNumberValue: any;
  voucherNumberValue: string;
  public hierarchyId;
  public hierarchyName;
  isHideConsolidationData: boolean = false;
  isTransactionToggle: boolean = false;
  standardTemplateModal: boolean = false;
  fromInvoiceAddess: boolean = false;
  toInvoiceAddress: boolean = false;
  filePath : any = null;
  headerLayout: boolean = false;
  fromTemplateFileName: string = '';
  toTemplateFileName: string = '';
  invoiceModules = [];
  standardTemplateFile = [];
  constructor(
    public invoiceConfigurationService: InvoiceConfigurationService,
    private route: SvmsRouterService,
    private storageService: StorageService,
    private alertService: AlertService,
    private accessControlService: AccessControlService,
    private datePipe: LocalDateFormatPipe,
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.getHierarcyList();
    this.getconfigpickList();
    this.getFoundationalTypes();
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.currentprogram.defaultDateFormat.toUpperCase()
    this.loadInvoiceConfiguration();
  }

  get formInValid() {
    return !this.payload?.config_name || ! this.payload?.invoice_start_date || !this.payload?.config?.consolidate_invoice?.type || !this.payload?.config?.invoice_generation_logic || !this.payload.config.invoice_number?.code || !this.payload?.config?.invoice_number?.start_from || !this.payload?.config.batch_number?.start_from || (this.payload.config.pa && (!this.payload.config.voucher_number?.code || !this.payload.config.voucher_number.start_from))
  }

  createForm() {
    this.options = this.invoiceConfigurationService.getInvoiceDropdownOptions();
  }

  getconfigpickList(){
    this.invoiceConfigurationService.getconfigpickList().subscribe((data:any)=>{
      Object.keys(data?.data?.invoice_modules).forEach((val) => {
        this.invoiceModules.push({
          key: data?.data?.invoice_modules[val],
          value: val
        })
      });
      Object.keys(data?.data?.upload_standard_template_file).forEach((val) => {
        this.standardTemplateFile.push({
          name: data?.data?.upload_standard_template_file[val],
          value: val
        })
      });
      this.invoiceModules.forEach((val) => {
        this.payload.config.invoice_modules.push({
            is_enabled: false,
            fee_taxable: false,
            module_type: val.key,
            tax_applicable: false
        })
      })
    })
  }

  loadInvoiceConfiguration() {
    const url = `/invoice/programs/${this.currentprogram?.id}/config/get-current-invoice-config`;
    this.invoiceConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          this.payload = { ...this.payload, ...data?.data };
          this.payload.config = { ...this.payload.config, ...data?.data?.invoice_config };
          this.configId = data.data.config_uuid;
          this.fromTemplateFileName = data?.data?.invoice_config?.from_template?.logo?.split('/')[6]?.split('?')[0];
          this.toTemplateFileName = data?.data?.invoice_config?.to_template?.logo?.split('/')[6]?.split('?')[0];
          this.payload.invoice_start_date = this.datePipe.transform(this.payload?.invoice_start_date, this.dateFormat, null, null, true, DATE_FORMAT.FORMATYMD);
          if (this.payload.config.transaction_complete.type.toLowerCase() !== TransactionType.MANUAL.toLowerCase()) {
            this.isHideTCDropdown = true;
            this.payload.config.transaction_complete.type === '' ? this.isTransactionToggle = false :  this.isTransactionToggle = true;
          } else if(this.payload.config.transaction_complete.type.toLowerCase() == TransactionType.MANUAL.toLowerCase()) {
            this.isTransactionToggle = true;
          }
          if (this.payload.config.consolidate_invoice.type.toLowerCase() !== TransactionType.MANUAL.toLowerCase()) {
            this.isHideConsolidationData = true;
          }
          if (Number(this.payload.config.invoice_generation_logic) === 3 || Number(this.payload.config.invoice_generation_logic) === 4) {
            this.isHideFoundationalSelection = true;
          }
        }, error: (error: Error | any) => {
           this.showError(error);
          }
      }
      );
  }



  onGeneratedTime(e) {
    this.payload.config.transaction_complete.generate_time = e;
  }

  updateCreditDebit() {
    this.payload.config.credit_debit.is_enabled = !this.payload.config.credit_debit.is_enabled;
  }

  updateInvoiceModuleToggle(i){
    this.payload.config.invoice_modules[i].is_enabled = !this.payload?.config?.invoice_modules[i]?.is_enabled;
  }

  updateFeetaxableModuleToggle(i){
    this.payload.config.invoice_modules[i].fee_taxable = !this.payload?.config?.invoice_modules[i]?.fee_taxable;
  }

  updateTaxapplicableModuleToggle(i){
    this.payload.config.invoice_modules[i].tax_applicable = !this.payload?.config?.invoice_modules[i]?.tax_applicable;
  }
  
  updateRollback() {
    this.payload.config.rollback = !this.payload.config.rollback;
  }

  valueChanged(e, key) {
    this.payload.config[key] = e;
  }

  getPaymentAuthorization(event) {
    if (!event) {
      this.payload.config.rollback = false;
      this.isTransactionToggle = false;
    }
    this.payload.config.pa = event;
  }

  changeApporvlaWorkflow(event) {
    this.payload.config.approval_workflow = event;
  }

  getConsolidationType(type) {
    if (type.toLowerCase() === TransactionType.MANUAL.toLowerCase()) {
      this.isHideConsolidationData = false;
      this.payload.config.invoice_cycle = null;
      this.payload.config.consolidate_invoice.consolidation_cycle.cycle_start_at = null;
      this.payload.config.week_start_day = null;
      this.payload.config.consolidate_invoice.consolidation_day = null;
      this.payload.config.consolidate_invoice.consolidation_cycle.cycle_end_at = null;
      this.payload.config.invoice_generated_time = null;
      this.payload.config.consolidate_invoice.generate_time = null;
      this.payload.config.client_email = '';
      this.payload.config.msp_email = '';
    } else {
      this.isHideConsolidationData = true
    }
    this.payload.config.consolidate_invoice.type = type;
  }

  getConsolidationInvoiceCycle(event) {
    this.payload.config.invoice_cycle = event;
    this.payload.config.consolidate_invoice.consolidation_cycle.cycle_start_at = event;
  }
  getConsolidationWeekDay(event) {
    this.payload.config.week_start_day = event;
    this.payload.config.consolidate_invoice.consolidation_day = event;

  }
  getConsolidationBillingType(event) {
    this.payload.config.consolidate_invoice.consolidation_cycle.cycle_end_at = event;

  }
  getTimeValue(e) {
    this.payload.config.invoice_generated_time = e;
    this.payload.config.consolidate_invoice.generate_time = e;
  }
  getInvoiceRolloup(event) {
    if (Number(event) === 3 || Number(event) === 4) {
      this.isHideFoundationalSelection = true;
    } else {
      this.isHideFoundationalSelection = false;
      this.payload.config.foundational_selection = '';
    }
    this.payload.config = { ...this.payload.config, invoice_generation_logic: event }
  }
  getFoundationalSelection(event) {
    this.payload.config = { ...this.payload.config, foundational_selection: event?.$ngOptionLabel }
  }

  getTransactionCompleteType(type) {
    type.toLowerCase() !==  TransactionType.MANUAL.toLowerCase() ?  this.isHideTCDropdown = true :  this.isHideTCDropdown = false;
    this.payload.config.transaction_complete.type = type;
  }

  getTransactionCompleteData(event, key) {
    this.payload.config.transaction_complete[key] = event;
  }

  getconsolidateToggleChange(event){
    this.payload.config.consolidate_invoice.consolidate_till_consolidation_day = event;
  }

  transactionToggleChange(event){
    this.isTransactionToggle = event;
    this.isHideTCDropdown = false;
    this.payload.config.transaction_complete.type = 'MANUAL';
    if(!this.isTransactionToggle){
      this.isTransactionToggle = false;
      this.payload.config.transaction_complete.type = '';
      this.payload.config.transaction_complete.option = '';
      this.payload.config.transaction_complete.start_day = '';
      this.payload.config.transaction_complete.generate_time = '';
      this.payload.config.transaction_complete.is_notes_mandatory = '';
    }
  }

  onToggleChanged(key) {
    if (!this.payload.config.rollback) {
      this.payload.config.client_rollback = false;
      this.payload.config.vendor_rollback = false;
    }
    this.payload.config[key] = !this.payload.config[key];
  }

  saveAction() {

    if(this.formInValid) {
      this.logs = {
        type: LOG_TYPE.ERROR, heading: 'Please Fill All Mandatory Fields', messages: [], autoClose: true, isShown: true, showReportButton: false
      };
      return;
    }

    this.saveInprogress = true;
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/invoice/programs/${this.currentprogram.id}/config`;
    let methodType = 'post';
    if (this.configId) {
      // this.mode === this.configurationMode.View &&
      url += `/${this.configId}`;
      methodType = 'put';
    }  
    let formattedDate = this.datePipe.transform(this.payload?.invoice_start_date, DATE_FORMAT.FORMATYMD, null, null, true, this.dateFormat);
    // let invoice_number = this.payload.config['invoice_number'].start_from;
    // this.payload.config['invoice_number'].start_from =invoice_number[invoice_number.length-1];
    // let batch_number = this.payload.config['batch_number'].start_from.split('-')
    // this.payload.config['batch_number'].start_from =batch_number[batch_number.length-1];
    // let voucher_number = this.payload.config['voucher_number'].start_from.split('-')
    // this.payload.config['voucher_number'].start_from =voucher_number[voucher_number.length-1];
    let payloadObject = { ...this.payload };
    payloadObject.invoice_start_date = formattedDate;
    this.invoiceConfigurationService[methodType](url, payloadObject).subscribe((data: any) => {
      this.saveInprogress = false;
      this.alertService.success(data?.message);
      this.loadInvoiceConfiguration();
      // this.onBack();
    }, (error) => {
      this.saveInprogress = false;
      if (error?.error?.errors || error?.error?.error?.errors) {
        this.showError(error);
      } else {
        this.alertService.error('Error While Saving Invoice Configuration.');
      }
    });
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.errors?.message, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  getInvoiceNumberData(invoiceCode, key) {
    invoiceCode != '-' ? this.inoiceNumberValue = invoiceCode : this.inoiceNumberValue = '';
    this.payload.config[key].code = this.inoiceNumberValue + '-';
  }
  getBatchNumberData(batchCode,key) {
    batchCode != '-'? this.batchNumberValue = batchCode : this.batchNumberValue = '';
    this.payload.config[key].code = this.batchNumberValue + '-';
  }
  getVoucherNumberData(voucherCode, key) {
    voucherCode != '-' ? this.voucherNumberValue = voucherCode : this.voucherNumberValue = '';
    this.payload.config[key].code = this.voucherNumberValue + '-';
  }


  getTextValueChange(e, key) {
    this.payload.config[key].start_from = e;
  }

  getValueChange(e,key){
    this.payload.config[key].code = e;
  }

  onBack() {
    this.route.navigate(['configuration', 'invoice-configuration', 'list']);
    // /config/invoice-configuration/list
  }

  getFoundationalTypes() {
    this.invoiceConfigurationService.getFoundationalTypes().subscribe((data: any) => {
      this.foundationalData = data?.foundational_data_types;
    });
  }
  getHierarcyList() {
    this.invoiceConfigurationService.getHierarcyList().subscribe((res: any) => {
      if (res?.result) {
        let hierarchy = res?.result[0]?.hierarchies?.find(item => item?.hierarchy_level === 1);
        this.payload.hierarchy_uuid = hierarchy?.id;
        this.hierarchyName = hierarchy?.name;
      }
    })
  }
  addStandardTemplate(event) {
    if(event) {
      this.standardTemplateModal = true;
    }
  }

  sidebarClose() {
      this.standardTemplateModal = false;
  }

  addIvoiceFromAddress(event) {
    if(event) {
      this.fromInvoiceAddess = true;
    }
  }

  fromAddressClose() {
    this.fromInvoiceAddess = false;
  }

  fromHeader(logo, address, btnClick) {
    this.payload.config.from_template.logo = logo;
    this.payload.config.from_template.address = address;
    if(btnClick){
      this.fromAddressClose();
    }
  }

  toHeader(logo, address, btnClick) {
    this.payload.config.to_template.logo = logo;
    this.payload.config.to_template.address = address;
    if(btnClick){
      this.toAddressClose();
    }
  }

  onTeamplateDatachange(label, type, format, btnClick){
    this.payload.config.invoice_template[0].label = label;
    this.payload.config.invoice_template[0].type = type;
    this.payload.config.invoice_template[0].format = format;
    if(btnClick){
      this.sidebarClose();
    }
  }

  rebateToggleChange(event) {
    if(!event){
      this.payload.config.rebate.is_enabled = event;
      this.payload.config.rebate.percentage = 0;
    }else{
      this.payload.config.rebate.is_enabled = event;
    }
  }
  getRebateIsPercentage(event: any) {
    this.payload.config.rebate.percentage = +event;
  }
  
  filesUpload(event, key) {
    let fileEvent = event?.target?.files ? event?.target?.files : event?.dataTransfer?.files;
    let readyToUploadDoc = fileEvent[0];
    key === 'from_template' ? this.fromTemplateFileName = readyToUploadDoc.name : this.toTemplateFileName = readyToUploadDoc.name;
    let invoice_config = {};
    //file to base64
    invoice_config['file_name'] = readyToUploadDoc.name;
    this.invoiceConfigurationService.encodeToBase64(readyToUploadDoc)
      .then((data) => {
        invoice_config['raw'] = String(data);
        invoice_config['key'] = `programs/${this.currentprogram?.id}/invoices/${readyToUploadDoc.name}`;
        invoice_config['entity_ref'] = 'invoices';
        this.invoiceConfigurationService.createConnectionToS3FileServer(invoice_config).subscribe(
          (res: any) => {
            this.payload.config[key].logo = res.file.url.url + invoice_config['key'] + '?' + 'AWSAccessKeyId=' + res.file.url.fields.AWSAccessKeyId + '&Signature=' + res.file.url.fields.signature + '&x-amz-security-token=' + res.file.url.fields['x-amz-security-token'];
          }
        );
      }).catch((err) => {
      });
  }

  addIvoiceToAddress(event) {
    if(event) {
      this.toInvoiceAddress = true;
    }
  }

  toAddressClose() {
    this.toInvoiceAddress = false;
  }

  getFilePath(event) {
    this.filePath = event.srcElement.files[0].name;
  }

  changeHeaderLayout(event) {
    if(event) {
      this.headerLayout = true
    }
  }

  headerLayoutClose() {
    this.headerLayout = false;
  }

  get accessControl() {
    return this.accessControlService.accessControl();
  }
}
