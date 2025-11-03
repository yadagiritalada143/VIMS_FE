import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ConfigurationMode } from '../../expense-configuration/enums/configuration-mode.enums';
import { InvoiceConfigurationService } from '../invoice-configuration.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
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
    is_active: '',
    hierarchy_uuid: "",
    invoice_start_date: '',
    config_name: '',
    config: {
      credit_debit: { is_enabled: false },
      client_email: '',
      msp_email: '',
      foundational_selection: '',
      pa: false,
      rollback: false,
      vendor_rollback: false,
      client_rollback: false,
      generate_invoice: false,
      cancel_approved_consolidated_invoice: false,
      tade_discount: false,
      other_notes: false,
      voucher_number: {
        code: '',
        type: 1,
        start_from: ''
      },
      invoice_number: {
        code: '',
        type: 1,
        start_from: '',
      },
      invoice_template: [
        {
          type: "",
          label: "",
          format: ""
        }
      ],
      to_template: {
        logo: "",
        address: "",
      },
      from_template: {
        logo: "",
        address: "",
      },
      transaction_complete: {
        type: 'MANUAL',
        option: '',
        start_day: '',
        generate_time: '',
        is_notes_mandatory: ''
      },
      consolidation_type:'MANUAL',
      invoice_cycle: null,
      week_start_day: null,
      invoice_generated_time:null,
      consolidate_invoice: {
        type: "",
        generate_time: "",
        consolidation_day: null,
        consolidation_cycle: {
            cycle_type: 1,
            cycle_start_at: null,
            cycle_end_at: null
        }
    }
    }
  };
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
  constructor(
    public invoiceConfigurationService: InvoiceConfigurationService,
    private route: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe,
    private alertService: AlertService,
  ) {
  }

  ngOnInit(): void {
    this.createForm();
    this.getHierarcyList();
    this.getFoundationalTypes();
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.currentprogram.defaultDateFormat.toUpperCase()
    this.activatedRoute.queryParams
      .subscribe(params => {
        this.mode = params['mode'];
        this.configId = params['id'];
        if (this.mode && this.configId) {
          this.loadInvoiceConfiguration();
        }
      });
  }

  createForm() {
    this.options = this.invoiceConfigurationService.getInvoiceDropdownOptions();
  }

  loadInvoiceConfiguration() {
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/invoice/programs/${this.currentprogram?.id}/config/${this.configId}`;
    this.invoiceConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          this.payload = data?.data;
          this.payload.config = data?.data?.invoice_config;
          this.payload.invoice_start_date = this.datePipe.transform(this.payload?.invoice_start_date, this.dateFormat, null, null, true, DATE_FORMAT.FORMATYMD);
          if (this.payload.config.transaction_complete.type.toLowerCase() !== TransactionType.MANUAL.toLowerCase()) {
            this.isHideTCDropdown = true;
            this.payload.config.transaction_complete.type === '' ? this.isTransactionToggle = false :  this.isTransactionToggle = true;
          } else if(this.payload.config.transaction_complete.type.toLowerCase() == TransactionType.MANUAL.toLowerCase()) {
            this.isTransactionToggle = true;
          }
          if (this.payload.config.consolidation_type.toLowerCase() !== TransactionType.MANUAL.toLowerCase()) {
            this.isHideConsolidationData = true;
          }
          if (Number(this.payload.config.invoice_generation_logic) === 3 || Number(this.payload.config.invoice_generation_logic) === 4) {
            this.isHideFoundationalSelection = true;
          }
        }, error: (error: Error | any) => {
          if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
            this.showError(error);
          } else {
            this.alertService.error('Error While loading Invoice Configuration.');
          }
        }
      }
      );
  }



  onGeneratedTime(e) {
    this.payload.config.transaction_complete.generate_time = e;
  }

  selectedHierarchyValue(e) {
    this.payload.hierarchy_uuid = e;
  }

  updateCreditDebit() {
    this.payload.config.credit_debit.is_enabled = !this.payload.config.credit_debit.is_enabled;
  }

  updateRollback() {
    this.payload.config.rollback = !this.payload.config.rollback;
  }

  valueChanged(e, key) {
    this.payload.config[key] = e;
  }

  getPaymentAuthorization(event) {
    this.payload.config.pa = event;
  }

  getConsolidationType(type) {
    type.toLowerCase() !==  TransactionType.MANUAL.toLowerCase() ?  this.isHideConsolidationData = true : this.isHideConsolidationData = false;
    this.payload.config.consolidation_type = type;
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
    this.payload.config[key] = !this.payload.config[key];
  }

  saveAction() {
    this.saveInprogress = true;
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/invoice/programs/${this.currentprogram.id}/config`;
    let methodType = 'post';
    if (this.mode === this.configurationMode.View && this.configId) {
      url += `/${this.configId}`;
      methodType = 'put';
    }
    let formattedDate = this.datePipe.transform(this.payload?.invoice_start_date, DATE_FORMAT.FORMATYMD, null, null, true, this.dateFormat);
    let payloadObject = { ...this.payload };
    payloadObject.invoice_start_date = formattedDate;
    this.invoiceConfigurationService[methodType](url, payloadObject).subscribe((data: any) => {
      this.saveInprogress = false;
      this.alertService.success("Invoice Configuration Saved Successfully.");
      this.onBack();
    }, (error) => {
      this.saveInprogress = false;
      if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
        this.showError(error);
      } else {
        this.alertService.error('Error While Saving Invoice Configuration.');
      }
    });
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  getInvoiceNumberData(invoiceCode, key) {
    invoiceCode != '-' ? this.inoiceNumberValue = invoiceCode : this.inoiceNumberValue = '';
    this.payload.config[key].code = this.inoiceNumberValue;
  }

  getVoucherNumberData(voucherCode, key) {
    voucherCode != '-' ? this.voucherNumberValue = voucherCode : this.voucherNumberValue = '';
    this.payload.config[key].code = this.voucherNumberValue;
  }


  getTextValueChange(e, key) {
    this.payload.config[key].start_from = e;
  }

  onBack() {
    this.route.navigate(['invoice', 'config', 'list']);
  }

  getFoundationalTypes() {
    this.invoiceConfigurationService.getFoundationalTypes().subscribe((data: any) => {
      this.foundationalData = data?.foundational_data_types;
    });
  }
  getHierarcyList() {
    this.invoiceConfigurationService.getHierarcyList().subscribe((res: any) => {
      if (res?.result) {
        this.hierarchyIds = res?.result;
        this.payload.hierarchy_uuid = res?.result[0]?.id;
        this.hierarchyName = res?.result[0]?.name;
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
}
