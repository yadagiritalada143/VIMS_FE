import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { InvoiceService } from '../../../service/invoice.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UsersType } from 'src/app/shared/enums';
// import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ConsolidateInvoiceTabEnum, ConsolidateInvoiceTabList, ConsolidateInvoiceStatus } from "src/app/invoice/enums/consolidate-invoice.enum";
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';

@Component({
  selector: 'app-consolidate-invoice-details',
  templateUrl: './consolidate-invoice-details.component.html',
  styleUrls: ['./consolidate-invoice-details.component.scss']
})
export class ConsolidateInvoiceDetailsComponent implements OnInit, OnDestroy {
  accuracyEnum = AccuracyConfigEnum;
  public tableConfig: VMSConfig;
  public invoiceList: any = [];
  public totals;
  public tabsList;
  public total_records = 0;
  private invoiceId: string;
  public tabName;
  public vendorList;
  public creditDebitData = [];
  public vendorTableConfig;
  public crediDebitTableConfig;
  public rotuterLinkParseFn = null;
  public rotuterLinkOnClick = false;
  public rollbackData;
  public reasonCodesForVendorRollback: any;
  public vendorIndex = 0;
  user_type: string;
  vendorColumn = [
    'invoice_number', 'iWorker', 'erp_external_id', 'duration', 'type', 'hour', 'assignment_code', 'ts_es_id', 'sourcing_model', 'invoice_type', 'invoice_line_item', 'vendor_amount'
  ]
  loading = false;
  public pageNo: number = 1;
  public limit: number = 10;
  public searchKey = '';
  count;
  invoiceBasicDetails;
  impersonatedBy;
  public indInvoicetabs = [

  ];
  public customDownload;
  private subscrptions: Subscription[] = [];
  private params;
  private is_tax_hidden: any;
  navigation: any = {};
  isFromPaymentPage: boolean
  logs:Log = undefined;
  isClientPaymentEnable: boolean;
  isCreditDebitEnable: boolean;
  filtersData: any = {};
  vendor_uuid: any;
  defaultCurrency = 'USD';
  isVendorPaymentRollbackEnable: boolean;
  timeInterval;
  invoiceProceed: boolean;
  constructor(
    private route: ActivatedRoute, 
    private storageService: StorageService,
    private resonCodesService: ReasonCodesService,
    private invoiceService: InvoiceService,
    private confirmService: ConfirmationDialogService,
    private localDatePipe: LocalDateFormatPipe,
    private authorizationService: AuthorizationService,
    public accuracyPipe: AccuracyPipe,
    private accessControlService: AccessControlService,
    private eventStream: EventStreamService, 
    private router: Router,
    private timesheetService: TimesheetService,
  ) {
      this.route.queryParamMap
    .subscribe((params) => {
      this.isFromPaymentPage = params['params']?.isFromPaymentPage;
      this.tabName  = 'Client Payment(s)';
    })
    this.is_tax_hidden = this.storageService?.get(StorageKeys?.CURRENT_PROGRAM)?.config?.is_tax_hidden || false;
  }

  ngOnInit(): void {
    this.defaultCurrency = this.storageService?.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency || this.defaultCurrency;
    if (this.authorizationService.authorize('view_client_bill')) {
      this.indInvoicetabs.push({ name: 'Client Bill' });
    }
    if (this.authorizationService.authorize('view_vendor_bill')) {
      this.indInvoicetabs.push({ name: 'Vendor Bill' });
    }
    if (this.authorizationService.authorize('view_credit_debit')) {
      this.indInvoicetabs.push({ name: 'Credit/Debit' });
    }
    if (this.authorizationService.authorize('view_client_payment')) {
      this.indInvoicetabs.push({ name: 'Client Payment(s)' });
    }
    if (this.authorizationService.authorize('view_vendor_payments')) {
      this.indInvoicetabs.push({ name: 'Vendor Payment(s)' });
    }
    if (this.authorizationService.authorize('view_consolidate_history')) {
      this.indInvoicetabs.push({ name: 'History' });
    }

    this.user_type = this.storageService.get('user_type')?.toLowerCase();

    let paramsTemp;

    this.tabsList = {
      ['Client Bill']: ({ invoice_uuid, page = 1, limit = this.limit, search = '', worker_name = '', invoice_number = '', invoice_type = '' }) => this.invoiceService.getClientTabConsolidatedInvoice({ invoice_uuid, page, limit, search, worker_name, invoice_number, invoice_type }),
      ['Vendor Bill']: ({ invoice_uuid }) => this.invoiceService.getVendors(invoice_uuid),
      ['Credit/Debit']: ({ invoice_uuid, page = 1, limit = this.limit, search = '', worker_name = '', invoice_number = '', invoice_type = '' }) => this.invoiceService.getCreditDebitTabConsolidatedInvoice({ invoice_uuid, page, limit, search, worker_name, invoice_number, invoice_type }),
      ['Client Payment(s)']: ({ invoice_uuid, page = 1, limit = this.limit, search = '' }) => this.invoiceService.getClientPaymentTabConsolidatedInvoice({ invoice_uuid, page, limit, search }),
      ['Vendor Payment(s)']: ({ invoice_uuid, page = 1, limit = this.limit, search = '' }) => this.invoiceService.getSupplierPaymentTabConsolidatedInvoice({ invoice_uuid, page, limit, search }),
      ['History']: ({ invoice_uuid, page = 1, limit = this.limit, search = '' }) => this.invoiceService.getHistoryTabConsolidatedInvoice({ invoice_uuid, page, limit, search }),
    };
    this.invoiceService.getInvoiceConfigDetails().subscribe((res) => {
      if(res && res?.data){
        this.isClientPaymentEnable = res?.data?.is_client_payment_enable;
        this.isCreditDebitEnable = res?.data?.is_credit_debit_enable;
        this.isVendorPaymentRollbackEnable = res?.data?.is_vendor_payment_rollback_enable;
       }
       if(!this.isClientPaymentEnable){
        let clientPaymentIndex =this.indInvoicetabs.findIndex((element: any) => element.name == ConsolidateInvoiceTabEnum.ClientPayment)
        if(clientPaymentIndex !== -1){
          this.indInvoicetabs.splice(clientPaymentIndex,1)
        }
        let vendorPaymentIndex = this.indInvoicetabs.findIndex((element: any) => element.name == ConsolidateInvoiceTabEnum.VendorPayment)
        if(vendorPaymentIndex !== -1){
          this.indInvoicetabs.splice(vendorPaymentIndex,1)
         }
       } 

      if(!this.isCreditDebitEnable){
        let CreditDebitIndex = this.indInvoicetabs.findIndex((element: any) => element.name == ConsolidateInvoiceTabEnum.CreditDebit)
        if(CreditDebitIndex !== -1){
          this.indInvoicetabs.splice(CreditDebitIndex,1)
         }
       }
    });
    this.tableConfig = {
      title: '',
      columnList: this.getClientColumns(),
      tabsList: [],
      showTabs: true,
      isExpand: true,
      isFilter: true,
      isSearch: true,
      isDownloadButton: false,
      isSetting: false,
      isTopPagination: false,
      isCreate: false,
      isTopHeader: true,
      density: 'COMFORTABLE',
      tableWidth: '100%',
      isCheckboxOption: false,
      advanceFilter: [
        { name: 'invoice_number', title: 'Invoice Number', filterType: 'TEXT' },
        { name: 'iWorker', title: 'Worker', filterType: 'TEXT' },
        //  { name: 'duration', title: 'Duration/Work Period', filterType: 'TEXT' },
        {
          name: 'invoice_type', title: 'Invoice Type', filterType: 'SELECT',
          multiSelectData: [
            // { name: 'Sourcing', value: 'sourcing' },
            { name: 'Timesheet', value: 'timesheet' },
            { name: 'Expense ', value: 'expense' },
            { name: 'Misc Expense', value: 'misc_expense' },
            { name: 'Progress Update', value: 'by_milestone' },
          ]
        },
      ]
    };
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        paramsTemp = params;
        this.params = params;
        this.OnInit(params);
      });

    this.subscrptions.push(this.eventStream.on(Events.CREDIT_DEBIT_CLOSE).subscribe((data) => {
      this.OnInit(paramsTemp, 'Credit/Debit');
      //this.tabName = 'Credit/Debit';
      //this.individualInvoiceTabChange("Credit/Debit");
      //this.router.navigate(['.'], { relativeTo: this.route, queryParams: { ... }});
    }));

    this.subscrptions.push(this.eventStream.on(Events.INVOICE_PAYMENT_COMPLETED_CP).subscribe(data => {
      this.fetchInvoiceCount();
      this.individualInvoiceTabChange("Client Payment(s)");
      this.OnInit(this.params, "Client Payment(s)")
    }));  
    
    this.subscrptions.push(this.eventStream.on(Events?.CONFIRM_CONSOLIDATION).subscribe(data => {
      this.individualInvoiceTabChange(this.tabName);
    }));  
  }

  private OnInit(params, goto = null) {
    // TODO Do we need this call, this already happening on page load
    // this.getClientInvoiceList(params.get('invoiceId'));
  if(!this.isFromPaymentPage){
    this.invoiceId = params.get('invoiceId');
    if (params.get('invoiceTab')) {
      this.tabName = this.processTabNames(params.get('invoiceTab'));
    } else {
      this.tabName = 'Client Bill';
    }
  }
  this.loading = true;
    return this.invoiceService.getConsolidatedInvoiceBasiDetail(params.get('invoiceId')).subscribe(data => {
      if(data?.data?.invoice_status === "in_progress") {
        data.data.invoice_status = "in progress"
      }
      this.invoiceBasicDetails = data;
      this.impersonatedBy = this.invoiceBasicDetails?.data?.history.find(historyObj => !!historyObj.impersonated_by)?.impersonated_by
      this.invoiceId = this.route.snapshot.paramMap.get('invoiceId');
      if(!this.isFromPaymentPage){
        this.tabName = goto || this.route.snapshot.paramMap.get('invoiceTab') || 'Client Bill';
      }
      this.tabName = this.processTabNames(this.tabName);
      this.individualInvoiceTabChange(this.tabName);
      this.fetchInvoiceCount();
      this.fetchInvoiceFiles();
      this.consolidateInvoiceProcessed(data);
      if(data?.data?.invoice_status === "failed") {
        this.invoiceProceed = true;
        this.confirmationDialog(!data?.data?.retry_flag, !data?.data?.cancel_flag, data?.data?.failed_reason);
      }
    }, (error) => {
      this.showError(error);
    });
  }

  consolidateInvoiceProcessed(res) {
    if (res?.data?.invoice_status?.toLowerCase() === ConsolidateInvoiceStatus?.INPROGRESS?.toLowerCase()) {
      this.invoiceProceed = false;
      this.timeInterval = setInterval(() => {
        this.getConsolidateStatus();
      }, 10000);
    }

    if(res?.data?.invoice_status?.toLowerCase() === ConsolidateInvoiceStatus?.DRAFT?.toLowerCase() || res?.data?.invoice_status.toLowerCase() === ConsolidateInvoiceStatus?.APPROVED?.toLowerCase() || res?.data?.invoice_status.toLowerCase() === ConsolidateInvoiceStatus?.CANCELLED?.toLowerCase()){
      this.invoiceProceed = true;
    }
  }

  getConsolidateStatus() {
    this.invoiceService?.getConsolidateStatus(this.invoiceId).subscribe(res => {
      if (res?.data?.invoice_status?.toLowerCase() === ConsolidateInvoiceStatus?.DRAFT?.toLowerCase() || res?.data?.invoice_status?.toLowerCase() === ConsolidateInvoiceStatus?.APPROVED?.toLowerCase()) {
        this.invoiceProceed = true;
        this.OnInit(this.params);
        clearInterval(this.timeInterval);
      }
      else if (res?.data?.invoice_status?.toLowerCase() === ConsolidateInvoiceStatus?.FAILED?.toLowerCase()) {
        if (res?.data?.retry_flag) {
          this.loading = false;
          clearInterval(this.timeInterval);
          this.confirmationDialog(false, false, res?.data?.failed_reason);
        }
        else if (!res?.data?.retry_flag) {
          this.loading = false;
          clearInterval(this.timeInterval);
          this.confirmationDialog(!res?.data?.retry_flag, !res?.data?.cancel_flag, res?.data?.failed_reason);
        }
      }

    }, (err) => {
      this.showError('Error while retrieving consolidate invoice status');
    });
  }
  
  confirmationDialog(disableOkButton = false, disableCancelButton = false, errorMessage = '') {
    let currentRoute = this.router?.url;
    if (currentRoute.includes("/invoice/consolidate-invoice-details/")) {
      errorMessage = !disableOkButton ? 'due to ' + errorMessage + 'Do you want to Retry?' : 'due to ' + errorMessage;
      this.confirmService.confirm('', `Consolidation is failed, ` + errorMessage,
        'Retry Consolidation', 'Cancel Consolidation', 'sm', { disableOkButton: disableOkButton, disableCancelButton: disableCancelButton })
        .then((confirmed) => {
          if (confirmed) {
            this.regenerateConsolidateInvoice();
          } else {
            this.cancelConsolidateInvoice();
          }
        });
    }
  }

  regenerateConsolidateInvoice() {
    this.invoiceService?.regenerateConsolidateInvoice(this.invoiceId).subscribe((retry) => {
      this.OnInit(this.params);
    }, (err) => {
      this.showError('Error while retrying consolidate invoice operation');
    });
  }

  cancelConsolidateInvoice() {
    this.invoiceService?.cancelConsolidateInvoice(this.invoiceId).subscribe((cancel) => {
      this.eventStream.emit(
        new EmitEvent(Events.CANCEL_CONSOLIDATION, { isopen: false, cancel: true })
      );
    }, (err) => {
      this.showError('Error while canceling consolidate invoice operation');
    });
  }
  clearInterval(){
    clearInterval(this.timeInterval);
  }
  fetchInvoiceCount() {
    this.subscrptions.push(this.invoiceService.fetchConsolidatedInvoiceDetailsCount(this.invoiceId).subscribe(data => {
      const invoiceCount = data?.data;
      this.count = [];
      if (this.authorizationService.authorize('view_client_bill')) {
        this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.Client)['count']);
      }
      
      if (this.authorizationService.authorize('view_vendor_bill')) {
        this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.Vendor)['count']);
      }
      
      if (this.isCreditDebitEnable && this.authorizationService.authorize('view_credit_debit')) {
        this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.CreditDebit)['count']);
      }
      if (this.isClientPaymentEnable) {
        if (this.authorizationService.authorize('view_client_payment')) {
          this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.ClientPayment)['count']);
        }
        
        if (this.authorizationService.authorize('view_vendor_payments')) {
          this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.SupplierPayment)['count']);
        }
      }
      if (this.authorizationService.authorize('view_consolidate_history')) {
        this.count.push(invoiceCount.find(x => x?.status?.toLowerCase() === ConsolidateInvoiceTabList.History)['count']);
      }
      this.count = [... this.count];
    }));
  }
  fetchInvoiceFiles() {
    this.subscrptions.push(this.invoiceService.fetchConsolidatedInvoiceFiles(this.invoiceId).subscribe(data => {
     if( this.accessControlService.accessControl()) {

      this.customDownload = data.data;
      this.customDownload = [... this.customDownload];
     }
    }));
  }

  toggle(obj) {
    if (this.vendorList) {
      this.vendorList.forEach(element => {
        if (element.vendor_name == obj.vendor_name) {
          element.isCollapsed = !obj.isCollapsed;
        } else {
          element.isCollapsed = true;
        }
      });
    }
    // if (this.creditDebitData) {
    //   this.creditDebitData.forEach(element => {
    //     element.isCollapsed = true;
    //   });
    //   obj.isCollapsed = !obj.isCollapsed;
    // }
  }

  getVendorTableConfig() {
    return {
      title: '',
      columnList: this.getVendorColumns(),
      tabsList: [],
      showTabs: true,
      isExpand: false,
      isSearch: true,
      isSetting: false,
      isTopPagination: false,
      hideResultCount: false,
      // isDownloadButton: true,
      isCreate: false,
      isTopHeader: false,
      density: 'COMFORTABLE',
      hideBottomPagination: false,
      tableWidth: '100%',
      isCheckboxOption: false,
      advanceFilter: [
        { name: 'invoice_number', title: 'Invoice Number', filterType: 'TEXT' },
        { name: 'iWorker', title: 'Worker', filterType: 'TEXT' },
        {
          name: 'invoice_type', title: 'Invoice Type', filterType: 'SELECT',
          multiSelectData: [
            { name: 'Timesheet', value: 'timesheet' },
            { name: 'Expense ', value: 'expense' },
            { name: 'Misc Expense', value: 'misc_expense' },
          ]
        },
      ]
    };
  }
  getCreditDebitTableConfig() {
    return {
      title: '',
      columnList: this.getCreditDebitColumns(),
      tabsList: [],
      showTabs: false,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isCreate: false,
      isTopHeader: false,
      density: 'COMFORTABLE',
      tableWidth: '100%',
      isCheckboxOption: false,
      advanceFilter: [
      ]
    };
  }
  getCreditDebitColumns() {
    var columnList = [
      { name: 'cd_code', title: 'CD Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true },
      { name: 'worker.name', title: 'Worker', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
      { name: 'type', title: 'Type', width: 13, isExpenseType: true, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'invoice_number', title: 'Individual Invoice Number', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'assignment_id', title: 'Assignment ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'ts_es_id', title: 'TS/ES/MI/SOW ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'sourcing_model', title: 'Sourcing Model', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'invoice_type', title: 'Invoice Type', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'vendor.name', title: 'Vendor', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'invoice_line_item', title: 'Invoice Line Item', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'cd_notes', title: "Notes", width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'cd_fund', title: 'CD Fund: AR/AP', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'cd_type', title: 'Credit/Debit', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'cd_amount', title: 'Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
    ];

    return columnList;
  }
  getVendorColumns() {
    let columnList: any;
    if (this.is_tax_hidden) {
      columnList = [
        { name: 'invoice_number', title: 'Invoice Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true },
        { name: 'iWorker', title: 'Worker', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'erp_external_id', title: 'ERP External Id', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'duration', title: 'Duration/Work Period', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'type', title: 'Type', width: 13, isExpenseType: true, isIcon: false, isImage: false, isContact: false, isNoOption: true, isNumberBadge: false },
        { name: 'hour', title: 'Total Hours', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_code', title: 'Assignment ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ts_es_id', title: 'TS/ES/MI ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_code', title: 'Milestone Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_name', title: 'Milestone Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_code', title: 'Sow Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_name', title: 'Sow Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sourcing_model', title: 'Sourcing Model', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_line_item', title: 'Invoice Line Item', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_type', title: 'Invoice Type', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vms_amount', title: 'vms amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true  },
        { name: 'msp_partner_amount', title: 'msp partner amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true  },
        { name: 'msp_amount', title: 'MSP Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vendor_amount', title: 'Vendor Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        // { name: 'vendor_tax_amount', title: 'Total tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'total_amount_with_tax', title: 'total vendor amount including tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'total_amount_without_tax', title: 'total amount w/o tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      ];
    }
    else {
      columnList = [
        { name: 'invoice_number', title: 'Invoice Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true },
        { name: 'iWorker', title: 'Worker', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'erp_external_id', title: 'ERP External Id', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'duration', title: 'Duration/Work Period', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'type', title: 'Type', width: 13, isExpenseType: true, isIcon: false, isImage: false, isContact: false, isNoOption: true, isNumberBadge: false },
        { name: 'hour', title: 'Total Hours', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_code', title: 'Assignment ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ts_es_id', title: 'TS/ES/MI ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_code', title: 'Milestone Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_name', title: 'Milestone Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_code', title: 'Sow Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_name', title: 'Sow Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sourcing_model', title: 'Sourcing Model', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_line_item', title: 'Invoice Line Item', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_type', title: 'Invoice Type', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vms_amount', title: 'vms amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true  },
        { name: 'msp_partner_amount', title: 'msp partner amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true  },
        { name: 'msp_amount', title: 'MSP Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vendor_amount', title: 'Vendor Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false ,isCurrency:true},
        { name: 'vendor_tax_amount', title: 'Total tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'total_amount_with_tax', title: 'total vendor amount including tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        // { name: 'total_amount_without_tax', title: 'total amount w/o tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      ];
    }
    return columnList;
  }


  vendorPaymentRollbacked(data){
    if (!data) {
      this.showVendorPaymentRollBack = false;
      return;
    }
    else{
      this.showVendorPaymentRollBack = false;
      this.fetchInvoiceCount();
      this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, ...data }).subscribe(res => {
        this.loading = false;
       if (this.tabName?.toLowerCase() === 'vendor payment(s)') {
          this.processSupplierInvoiceList(res);
        } 
    })
    }
  }
  
  
  getClientColumns() {
    let columnList: any;
    if (this.is_tax_hidden) {
      columnList = [
        { name: 'invoice_number', title: 'Invoice Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true },
        { name: 'iWorker', title: 'Worker', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'official_worker_id', title: 'Worker ID', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'erp_external_id', title: 'ERP External Id', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'duration', title: 'Duration/Work Period', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        {
          name: 'type', title: 'Type', width: 13, isExpenseType: true, isIcon: false,
          isImage: false, isContact: false, isNumberBadge: false
        },
        { name: 'hour', title: 'Total Hours', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_code', title: 'Assignment ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ts_es_id', title: 'TS/ES/MI ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_code', title: 'Milestone Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_name', title: 'Milestone Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_code', title: 'Sow Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_name', title: 'Sow Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sourcing_model', title: 'Sourcing Model', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_type', title: 'Invoice Type', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_line_item', title: 'Invoice Line Item', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'client_amount', title: 'Client Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        // { name: 'client_tax_amount', title: 'client tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'vms_tax_amount', title: 'vms tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor.name', title: 'Vendor', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor_amount', title: 'Vendor Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        // { name: 'vendor_tax_amount', title: 'vendor tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'total_adjustment_amount', title: 'adjustment amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vms_amount', title: 'vms amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'client_msp_amount', title: 'MSP Partner amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'msp_amount', title: 'MSP Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        // { name: 'msp_tax_amount', title: 'msp tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'total_amount_with_tax', title: 'total amount including tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'total_amount_without_tax', title: 'total amount w/o tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      ];
    } else {
      columnList = [
        { name: 'invoice_number', title: 'Invoice Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true },
        { name: 'iWorker', title: 'Worker', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'official_worker_id', title: 'Worker ID', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'erp_external_id', title: 'ERP External Id', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isOpenView: true },
        { name: 'duration', title: 'Duration/Work Period', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        {
          name: 'type', title: 'Type', width: 13, isExpenseType: true, isIcon: false,
          isImage: false, isContact: false, isNumberBadge: false
        },
        { name: 'hour', title: 'Total Hours', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'assignment_code', title: 'Assignment ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ts_es_id', title: 'TS/ES/MI ID', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_code', title: 'Milestone Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'milestone_name', title: 'Milestone Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_code', title: 'Sow Id', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sow_name', title: 'Sow Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sourcing_model', title: 'Sourcing Model', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_type', title: 'Invoice Type', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_line_item', title: 'Invoice Line Item', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'client_amount', title: 'Client amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'client_tax_amount', title: 'client tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true},
        // { name: 'vms_tax_amount', title: 'vms tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vendor.name', title: 'Vendor', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor_amount', title: 'Vendor amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vendor_tax_amount', title: 'vendor tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'total_adjustment_amount', title: 'adjustment amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'vms_amount', title: 'vms amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
        { name: 'client_msp_amount', title: 'MSP Partner amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false ,isCurrency:true},
        { name: 'msp_amount', title: 'MSP Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false ,isCurrency:true},
        // { name: 'msp_tax_amount', title: 'msp tax amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false ,isCurrency:true},
        { name: 'total_amount_with_tax', title: 'total amount including tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true},
        { name: 'total_amount_without_tax', title: 'total amount w/o tax', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true },
      ];
    }
    if (this.user_type === UserType.Vendor.toLowerCase()) {
      return columnList.filter(column => this.vendorColumn.includes(column?.name));
    }
    return columnList;
  }

  getHistoryTableConfig() {
    const columnList = [
      // { name: 'history_uuid', title: 'History uuid', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: false },
      { name: 'type', title: 'Type', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isOpenView: true },
      { name: 'message', title: 'Message', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
      { name: 'activity_on', title: 'Activity Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified', title: 'Updated By', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false }
    ];
    return columnList;
  }
  getSupplierPaymentsTabColumns() {
    const rollbackAllowed = this.authorizationService.authorize('view_rollback_payment');
    const payNow = this.authorizationService.authorize('view_pay_now');
    let columnList = [];
    if (rollbackAllowed && payNow && this.accessControlService.accessControl()) {
      columnList.push({ name: 'vendor.name', title: 'Vendor', width: 16, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: this.isVendorPaymentRollbackEnable ? false : true, isNavigation: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment' });
    } else if (rollbackAllowed) {
      columnList.push({ name: 'vendor.name', title: 'Vendor', width: 16, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: this.isVendorPaymentRollbackEnable ? false : true, isNavigation: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment' });
    } else if (payNow) {
      columnList.push({ name: 'vendor.name', title: 'Vendor', width: 16, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: false });
      }
    columnList.push({ name: 'vendor_amount', title: 'Vendor Amount', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCurrency:true  });
      // { name: 'vendor_tax_amount', title: 'Vendor Tax Amount', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      // { name: 'msp_amount', title: 'MSP Amount', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      // { name: 'msp_tax_amount', title: 'MSP Tax Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
    columnList.push({  name: 'vendor_total_amount', title: 'Total Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCurrency:true  });
    columnList.push({ name: 'remaining_amount', title: 'Remaining Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCurrency:true  });
    columnList.push({ name: 'voucher_amount', title: 'Voucher Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCurrency:true });
    columnList.push({ name: 'voucher_date', title: 'Voucher Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'voucher_number', title: 'Voucher Number', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'voucher_status', title: 'Voucher Status', width: 15, isIcon: true, isImage: true, isContact: false, isNoOption: true, isNumberBadge: false });
    columnList.push({ name: 'download', title: 'Download', width: 15, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false, isDownloadBtn: true });
    return columnList;
  }
  processVendorInvoiceList(res) {
    this.vendorList = res?.data;
    let invoiceLists = res && res?.data;
    const vendorList = [];
    invoiceLists?.forEach((invoice, index) => {
      const value = invoice;
      value.key = value?.vendor?.id;
      value.vendor_name = value?.vendor?.name;
      value.vendor_code = value?.vendor?.code;
      if (index === 0) {
        this.vendor_uuid = value?.vendor?.id;
        let payload = {
          invoice_uuid: this.invoiceId,
          vendor_uuid: value?.vendor?.id,
          page: this.pageNo,
          search: this.searchKey,
          limit: this.limit
        }
        this.loading = true;
        this.invoiceService.getVendorTabConsolidatedInvoiceList(payload).subscribe(
          (res) => {
            this.loading = false;
            this.total_records = res?.data?.total_records;
            value.invoiceLists = [...res?.data?.vendor?.data?.map(x => {
              return {
                ...x, iWorker: this.capitalizeWords(x?.worker.name),
                erp_external_id: (x?.erp_external_id),
                type: x?.type === "by_milestone" ? 'Progress Update' : this.capitalizeWords(x?.type),
                hour: this.accuracyPipe?.transform(x?.hour, this.accuracyEnum.HOUR),
                sourcing_model: (x?.sourcing_model)?.toUpperCase(),
                duration: `${this.getDate(x?.invoice_start_date, true)} - ${this.getDate(x?.invoice_end_date, true)}`,
               // total_amount_with_tax: this.currencyService.getCurrencyFromCode(x.client_amount?.total_amount_with_tax, this.invoiceBasicDetails.data.currency),
                total_amount_without_tax:{ amount: x?.client_amount?.total_amount_without_tax, currency: x?.currency || this.defaultCurrency },
                msp_amount: { amount: x?.msp_amount?.msp_amount, currency: x?.currency || this.defaultCurrency },
                msp_tax_amount:{ amount:x?.msp_amount?.msp_tax_amount, currency: x?.currency || this.defaultCurrency },
                vendor_amount:{ amount: x?.vendor_amount?.vendor_amount_without_tax, currency: x?.currency || this.defaultCurrency },
                vendor_tax_amount:{ amount: x?.vendor_amount?.vendor_tax_amount, currency: x?.currency || this.defaultCurrency },
                total_amount_with_tax: { amount: x?.vendor_amount?.vendor_amount, currency: x?.currency || this.defaultCurrency },
                vms_amount: { amount: x?.vms_amount?.total_vms_amount_with_tax, currency: x?.currency || this.defaultCurrency },
                msp_partner_amount: { amount: x?.client_msp_amount?.total_client_msp_amount_with_tax, currency: x?.currency || this.defaultCurrency },
                milestone_code: x?.sow_progress_info?.milestone_code ? x?.sow_progress_info?.milestone_code : '--',
                sow_code: x?.sow_progress_info?.sow_code ? x?.sow_progress_info?.sow_code : '--',
                milestone_name: x?.sow_progress_info?.milestone_name ? this.capitalizeWords(x?.sow_progress_info?.milestone_name) : '--'  ,
                sow_name: x?.sow_progress_info?.sow_name ?  this.capitalizeWords(x?.sow_progress_info?.sow_name) : '--',
              };
            })]
          })
      }
      vendorList.push(value);
    })
    this.vendorList = vendorList;
  }


  getTime(time) {
    if (time !== '0.0000') {
      return parseFloat(time).toFixed(2)
    } else {
      return "-";
    }
  }

  processPAClientInvoiceList(res) {
    this.total_records = res?.data?.total_records;
    let invoiceList = res?.data.client_payment;
    this.invoiceList = [...invoiceList.map(x => {
      return {
        ...x,
        invoice_number: x?.pa_code,
        check_type: this.capitalizeWords(x?.check_type),
        check_number: x?.check_number,
        entered_date: this.getDate(x?.entered_date, true),
        received_date: this.getDate(x?.received_date, true),
        pa_amount: { amount: x?.pa_amount, currency: x?.currency || this.defaultCurrency },
        pa_status: x?.pa_status,
        remaining_amount:{ amount: x?.remaining_amount, currency: x?.currency || this.defaultCurrency },
        created_by: x?.created_by?.name,
        updated_by: x?.updated_by?.name,
      }
    })];
    // TODO Need to check this
    // this.totals = null;
  }

  processCreditDebitData(res) {
    const creditDebit = res?.data?.credit_debit;
    this.total_records = res?.data?.total_records;
    this.invoiceList = [...creditDebit.map(x => {
      return {
        ...x,
        cd_type: this.capitalizeWordsWithSymbol(x?.cd_type),
        cd_amount:  { symbol: this.getSymbol(x?.cd_type), amount: x?.cd_amount, currency: x?.currency || this.defaultCurrency },
      }
    })];


    // const credit_debitList = res?.data?.credit_debit
    // const VendIds = credit_debitList?.map(obj => obj?.vendor?.id);
    // const uniqueVendIds = new Set(VendIds);

    // let list = [];
    // uniqueVendIds.forEach(element => {
    //   const obj = credit_debitList.find(item => item?.vendor?.id === element);
    //   const vendorObj = obj.vendor;
    //   let creditDebitItems = credit_debitList.filter(item => item?.vendor?.id === element);
    //   vendorObj.creditDebitItems = creditDebitItems;
    //   vendorObj.isCollapsed = true;
    //   list.push(vendorObj);
    // });
    // this.creditDebitData = list;
    // if (this.creditDebitData.length > 0) {
    //   this.creditDebitData[0].isCollapsed = false;
    // }
  }

  processHistoryData(res) {
    let history = res?.data?.history;
    this.invoiceList = [...history.map(x => {
      return {
        ...x,
        history_uuid: x?.history_uuid,
        type: this.capitalizeWords(x?.type),
        message: x?.message,
        activity_on: this.getDateTime(x.activity_on, false),
        modified: x?.activity?.name
      }
    })];
  }
  processSupplierInvoiceList(res) {
    this.total_records = res?.data?.total_records;
    let invoiceList = res?.data.supplier_payment;
    this.invoiceList = [...invoiceList.map(x => {
      return {
        ...x,
        msp_amount:  { amount: x?.msp_amount, currency: x?.currency || this.defaultCurrency },
        msp_tax_amount:  { amount: x?.msp_tax_amount, currency: x?.currency || this.defaultCurrency },
        msp_total_amount:  { amount: x?.msp_total_amount, currency: x?.currency || this.defaultCurrency },
        remaining_amount:  { amount: x?.remaining_amount, currency: x?.currency || this.defaultCurrency },
        total_amount:  { amount: x?.total_amount, currency: x?.currency || this.defaultCurrency },
        totalAmount: { amount: +x?.vendor_amount + (+x?.msp_amount) + '' , currency: x?.currency || this.defaultCurrency },
        vendor_amount:  { amount: x?.vendor_amount, currency: x?.currency || this.defaultCurrency },
        vendor_tax_amount:  { amount: x?.vendor_tax_amount, currency: x?.currency || this.defaultCurrency },
        vendor_total_amount:  { amount: x?.vendor_total_amount, currency: x?.currency || this.defaultCurrency },
        voucher_amount:  { amount: x?.voucher_amount, currency: x?.currency || this.defaultCurrency }, 
        voucher_date: this.getDate(x?.voucher_date, true),
        voucher_status: this.capitalizeWords(x?.voucher_status),
        vms_amount: { amount: x?.vms_amount?.total_vms_amount_with_tax, currency: x?.currency || this.defaultCurrency },
      }
    })];
  }

  getPAClientColumns() {
    const rollbackAllowed = this.authorizationService.authorize('view_rollback_payment');
    const payNow = this.authorizationService.authorize('view_pay_now');
    let columnList = [];
    if (rollbackAllowed && payNow) {
      columnList.push({ name: 'invoice_number', title: 'PA Code', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment', isOpenView: true, isNavigation: true });
    } else if (rollbackAllowed) {
      columnList.push({ name: 'invoice_number', title: 'PA Code', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment', isOpenView: true, isNavigation: true });
    } else if (payNow) {
      columnList.push({ name: 'invoice_number', title: 'PA Code', width: 16, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    }
    columnList.push({ name: 'check_type', title: 'Type', width: 13, isIcon: true, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'check_number', title: 'Check Number', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'entered_date', title: 'Entered Date', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'received_date', title: 'Received Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'pa_amount', title: 'Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true });
    columnList.push({ name: 'pa_status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'remaining_amount', title: 'Remaining Amount', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,isCurrency:true});
    columnList.push({ name: 'notes', title: "Notes", width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'created_by', title: 'Created By', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    columnList.push({ name: 'updated_by', title: 'Updated By', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    return columnList;
  }

  onExpandClick(e) {
  }
  viewSidePanel(e) {
    this.eventStream.emit(
      new EmitEvent(Events.INVOICE_VIEW_SIDE_PANEL, {
        data: e
      })
    );
  }

  onListFilter(e) {
    this.loading = true;
    this.filtersData = {
      worker_name: e ? e['iWorker'] : '', invoice_number: e ? e['invoice_number'] : '',
      invoice_type: e ? e['invoice_type'] : ''
    };
    this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, ...this.filtersData }).subscribe(res => {
      this.loading = false;
      if (this.tabName?.toLowerCase() === 'vendor bill') {
        this.processVendorInvoiceList(res);
      } else if (this.tabName?.toLowerCase() === 'client bill') {
        this.processClientInvoiceList(res);
      } else if (this.tabName?.toLowerCase() === 'client payment(s)') {
        this.processPAClientInvoiceList(res);
      } else if (this.tabName?.toLowerCase() === 'vendor payment(s)') {
        this.processSupplierInvoiceList(res);
      } else if (this.tabName?.toLowerCase() === 'history') {
        this.processHistoryData(res);
      }
      if (this.tabName?.toLowerCase() === 'credit/debit') {
        this.processCreditDebitData(res);
      }
    }, (error) => {
      this.loading = false;
    })
  }
  onSearch(event) {
    this.loading = true;
    this.searchKey = event;
    if (this.tabName?.toLowerCase() === 'vendor bill') {
      this.showVendorInfo(this.vendor_uuid, this.pageNo, this.vendorIndex, this.limit= 10);
    }
    else{
    this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, page: 1, limit: 10, search: event }).subscribe(res => {
      this.loading = false;
      if (this.tabName?.toLowerCase() === 'client bill') {
        this.processClientInvoiceList(res);
      }
      if (this.tabName?.toLowerCase() === 'client payment(s)') {
        this.processPAClientInvoiceList(res);
      }
      if (this.tabName?.toLowerCase() === 'vendor payment(s)') {
        this.processSupplierInvoiceList(res);
      }
      if (this.tabName?.toLowerCase() === 'history') {
        this.processHistoryData(res);
      }
      if (this.tabName?.toLowerCase() === 'credit/debit') {
        this.processCreditDebitData(res);
      }
      this.invoiceList = [... this.invoiceList];
    }, (error) => {
      if(error?.status == 404 && this.tabName?.toLowerCase() === 'vendor bill') {
        this.vendorList.forEach(e => {
          e.invoiceLists = []
        })
      }
      this.loading = false;
    });
  }
  }

  processClientInvoiceList(res) {
    if (res && res.data && this.invoiceBasicDetails && this.invoiceBasicDetails.data) {
      this.totals = res?.data?.client?.total;
       this.total_records = res?.data?.total_records;
      let invoiceLists = res && res?.data && res?.data?.client;
      this.invoiceList = [...invoiceLists.data.map(x => {        
        return {
          ...x, iWorker: this.capitalizeWords(x?.worker.name),
          milestone_code: x?.sow_progress_info?.milestone_code ? x?.sow_progress_info?.milestone_code : '--',
          sow_code: x?.sow_progress_info?.sow_code ? x?.sow_progress_info?.sow_code : '--',
          milestone_name: x?.sow_progress_info?.milestone_name ? this.capitalizeWords(x?.sow_progress_info?.milestone_name) : '--'  ,
          sow_name: x?.sow_progress_info?.sow_name ?  this.capitalizeWords(x?.sow_progress_info?.sow_name) : '--',
          erp_external_id: (x?.erp_external_id),
          duration: `${this.getDate(x?.invoice_start_date, true)} - ${this.getDate(x?.invoice_end_date, true)}`,
          type: x?.type === "by_milestone" ? 'Progress Update' : this.capitalizeWords(x?.type),
          hour: this.accuracyPipe?.transform(x?.hour, this.accuracyEnum.HOUR),
          sourcing_model: (x?.sourcing_model)?.toUpperCase(),
          total_amount_with_tax:  { amount: x?.client_amount?.total_amount_with_tax, currency: x?.currency || this.defaultCurrency },
          total_amount_without_tax:  { amount: x?.client_amount?.total_amount_without_tax, currency: x?.currency || this.defaultCurrency },
          client_amount:  { amount: x?.client_amount?.total_amount_without_tax, currency: x?.currency || this.defaultCurrency },
          total_adjustment_amount : { amount: x?.client_amount?.total_adjustment_amount, currency: x?.currency || this.defaultCurrency },
          client_tax_amount:  { amount: x?.client_amount?.total_tax_amount, currency: x?.currency || this.defaultCurrency },
          vms_amount:  { amount: x?.vms_amount?.total_vms_amount_with_tax, currency: x?.currency || this.defaultCurrency },
          vms_tax_amount:  { amount: x?.vms_amount?.total_vms_tax_amount, currency: x?.currency || this.defaultCurrency },
          client_msp_amount:  { amount: x?.client_msp_amount?.total_client_msp_amount_with_tax, currency: x?.currency || this.defaultCurrency },
          msp_amount: { amount: x?.msp_amount?.msp_amount, currency: x?.currency || this.defaultCurrency},
          // msp_tax_amount:  { amount: x?.msp_amount?.msp_tax_amount, currency: x?.currency || this.defaultCurrency },
          vendor_amount:  { amount: x?.vendor_amount?.vendor_amount, currency: x?.currency || this.defaultCurrency },
          vendor_tax_amount:{ amount: x?.vendor_amount?.vendor_tax_amount, currency: x?.currency || this.defaultCurrency },
          invoice_id: x.invoice_id
        };
      })];
    }

  }

  getClientInvoiceList(invoiceId: string) {
    this.subscrptions.push(this.invoiceService.getClientTabConsolidatedInvoice({ invoice_uuid: invoiceId }).subscribe(res => {
      this.processClientInvoiceList(res);
    }));
  }

  getDate(d, noDateConversion) {
    return this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion);
  }



  getDateTime(d, noDateConversion) {
    return `${this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion)} ${this.localDatePipe.transform(d , 'h:mm a z', undefined, undefined, noDateConversion)}` ;
  }

  processTabNames(event) {
    if (event) {
      switch (event.toLowerCase()) {
        case 'client payment': return 'Client Payment(s)';
        case 'vendor payment': return 'Vendor Payment(s)';
      }
    }
    return event;
  }
  individualInvoiceTabChange(event) {
    this.rotuterLinkOnClick = false;
    this.rotuterLinkParseFn = null;
    event = this.processTabNames(event);
    this.tabName = event;
    this.loading = true;
    this.creditDebitData = [];
    this.vendorList = [];
    this.invoiceList = [];
    this.tabsList[event]({ invoice_uuid: this.invoiceId }).subscribe(res => {
      if(this.invoiceProceed){
        this.loading = false;
      }
      if (event?.toLowerCase() === 'vendor bill') {
        this.vendorIndex = 0;
        this.processVendorInvoiceList(res);
        this.tableConfig.columnList = [];
        this.vendorTableConfig = this.getVendorTableConfig();
        this.tableConfig.columnList = [...this.getVendorColumns()];
        this.tableConfig.columnList = [...this.tableConfig.columnList];
        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
      if (event?.toLowerCase() === 'client bill') {
        this.processClientInvoiceList(res);
        this.tableConfig.columnList = this.getClientColumns();
        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
      if (event?.toLowerCase() === 'client payment(s)') {
        this.rotuterLinkOnClick = true;
        this.tableConfig.isFilter = true;
        this.tableConfig.isSearch = true;
        this.rotuterLinkParseFn = (rowData, options) => {
          return `invoice/consolidated-invoice-vendor-payment/${this.invoiceId}/${rowData.pa_uuid}`;
        };
        this.processPAClientInvoiceList(res);
        this.tableConfig.columnList = this.getPAClientColumns();
        this.tableConfig.columnList = [...this.tableConfig.columnList];
        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
      if (event?.toLowerCase() === 'vendor payment(s)') {
        this.processSupplierInvoiceList(res);
        this.tableConfig.columnList = this.getSupplierPaymentsTabColumns();
        this.tableConfig.columnList = [...this.tableConfig.columnList];

        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
      if (event?.toLowerCase() === 'credit/debit') {
        this.processCreditDebitData(res);
        this.tableConfig.columnList = this.getCreditDebitColumns();
        this.tableConfig.columnList = [...this.tableConfig.columnList];
        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
      if (event?.toLowerCase() === 'history') {
        this.processHistoryData(res);
        this.tableConfig.columnList = this.getHistoryTableConfig();
        this.tableConfig = { ...this.tableConfig, isFilter: true, isSearch: true };
      }
    }, (error) => {
      this.loading = false;
    });
    this.fetchInvoiceCount();
  }

  showClientPaymentRollBack; 
  showVendorPaymentRollBack: boolean = false;
  reasonCodes;
  current_pa_uuid;

  rollbacked(data) {
    if (!data) {
      this.showClientPaymentRollBack = false;
      return;
    }
    else{
      this.showClientPaymentRollBack = false;
      this.fetchInvoiceCount();
      this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, ...data }).subscribe(res => {
        this.loading = false;
       if (this.tabName?.toLowerCase() === 'client payment(s)') {
          this.processPAClientInvoiceList(res);
        } 
    })
    }
  }
  paymentRollback(event) {
    this.confirmService.confirm('', `Are you sure you want to Rollback Payment Allocation?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.resonCodesService.getResoncodesFor('ROLLBACK_PAYMENT_ALLOCATION').subscribe(data => {
            this.reasonCodes = data.reason_codes.filter(reason => reason.is_enabled === true);
            this.current_pa_uuid = event?.vendor ?  event?.pa_vendor_uuid : event.pa_uuid;
            this.rollbackData = event;
            // this.confirmationReasonBoxService.confirm('Please provide below details for Rollback Payment Allocation.', reasonCodes).then((resp: any) => {
            //   if (resp) {
            //     this.invoiceService.rollbackPaymentAllocation(event.pa_uuid, resp).subscribe(data => {
            //       this._alerts.success("Rollback Payment Allocation is completed.");
            //       this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED, true));
            //       this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED_CP, true));
            //     }, (error) => {
            //       this._alerts.error(error.message);
            //     })
            //   }
            // }, (error) => {
            //   if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
            //     this._alerts.error(error.errors[0].message);
            //   } else {
            //     this._alerts.error('Error while Payment Allocation Rollback!');
            //   }
            // });
           if(!!event?.vendor){
            this.showVendorPaymentRollBack = true;
              this.reasonCodesForVendorRollback = data?.reason_codes?.map(x => {
                return { ...x, label: x.name }
              })
            }
            else{
              this.showClientPaymentRollBack = true;
            }
            });
           }else{
             this.showClientPaymentRollBack = false;
             this.showVendorPaymentRollBack = false;
           }
          });
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
  }
  capitalizeWordsWithSymbol(string) {
    let result = string.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
    if (result == "Debit") {
      return 'Debit (+)';
    } else if (result == "Credit") {
      return 'Credit (-)';
    }
    return result;
  }

  getSymbol(req) {
    if (req == 'debit') {
      return '+';
    }
    return '';
  }

  changerecords(event) {
    this.limit = event;
    this.loading = true;
    if (this.tabName?.toLowerCase() === 'vendor bill') {
      this.showVendorInfo(this.vendor_uuid, this.pageNo, this.vendorIndex, this.limit);
    } else {
      this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, page: this.pageNo, limit: this.limit, search: this.searchKey, ...this.filtersData }).subscribe(res => {
        this.loading = false;
        if (this.tabName?.toLowerCase() === 'client bill') {
          this.processClientInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'client payment(s)') {
          this.processPAClientInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'vendor payment(s)') {
          this.processSupplierInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'history') {
          this.processHistoryData(res);
        }
        if (this.tabName?.toLowerCase() === 'credit/debit') {
          this.processCreditDebitData(res);
        }
        this.invoiceList = [... this.invoiceList];
      }, (error) => {
        this.loading = false;
      });
    }
  }

  onPaginationClick(event) {
    this.pageNo = event;
    this.loading = true;
    // this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, status: Status[this.selectedTab], limit: this.limit, page: this.pageNo, search: this.searchKey }).subscribe(res => {
    //   this.total_records = res?.data?.total_records;
    //   this.processInvoicesResponse(res?.data['invoices']);

    // });
    if (this.tabName?.toLowerCase() === 'vendor bill') {
      this.showVendorInfo(this.vendor_uuid, this.pageNo, this.vendorIndex, this.limit);
    }
    else {
      this.tabsList[this.tabName]({ invoice_uuid: this.invoiceId, page: this.pageNo, limit: this.limit, search: this.searchKey, ...this.filtersData }).subscribe(res => {
        this.loading = false;
        if (this.tabName?.toLowerCase() === 'client bill') {
          this.processClientInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'client payment(s)') {
          this.processPAClientInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'vendor payment(s)') {
          this.processSupplierInvoiceList(res);
        }
        if (this.tabName?.toLowerCase() === 'history') {
          this.processHistoryData(res);
        }
        if (this.tabName?.toLowerCase() === 'credit/debit') {
          this.processCreditDebitData(res);
        }
        this.invoiceList = [... this.invoiceList];
      }, (error) => {
        this.loading = false;
      });

    }
  }
  
  onClickView(event: any) {
    if (event && event.type) {
      this.router.navigate([`/invoice/invoice-details/` + event?.invoice_id]);
      return;
      if (event.type.toLowerCase() == 'timesheet') {
        let timeSheetData: any = {};
        this.invoiceService.getTimesheetBasicInfo(event.invoice_type_uuid).subscribe(res => {
          if (res?.data) {
            timeSheetData.assignment_code = res?.data?.assignment_code;
            timeSheetData.assignment_id = res?.data?.assignment_id;
            timeSheetData.assignment_title = res?.data?.assignment_title;
            timeSheetData.user_id = res?.data?.worker?.id,
            timeSheetData.parent_type = res?.data?.parent_type,
            timeSheetData.child_type = res?.data?.child_type;
            timeSheetData.currency = res?.data?.currency;
            timeSheetData.end_date = res?.data?.end_date;
            timeSheetData.start_date = res?.data?.start_date;
            timeSheetData.status = res?.data?.status;
            timeSheetData.timesheet_uuid = event?.invoice_type_uuid;
            timeSheetData.meta_data = res?.data?.meta_data;
            this.navigation.meta_data = res?.data?.meta_data;
            this.storageService.set('timeSheetData', timeSheetData, true);
            this.router.navigate([this.timesheetService.getTimesheetNavigationRoute(undefined, this.navigation)]);
          }
        });
      } else if (event?.type.toLowerCase() == 'expense' || event?.type.toLowerCase() == 'misc_expense') {
        this.router.navigate([`expense/${event?.invoice_type_uuid}`]);
      } else if (event?.type?.toLowerCase() == 'sow' || event?.type?.toLowerCase() == 'progress update') {
        const user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
        if (user_type === UsersType.VENDOR?.toLowerCase()) {
          this.router.navigate([
            `/vendor_sow/${event?.invoice_type_uuid}/vendor_milestones/${event.sow_data.sow_project_id}/invoicing/${event?.invoice_id}/detail`,
          ]);
        } else {
          this.router.navigate([
            `/sow/${event?.invoice_type_uuid}/milestones/${event.sow_data.sow_project_id}/invoicing/${event?.invoice_id}/detail`,
          ]);
        }
      }
    }
  }
  downloadInvoice(rowData){
    if(rowData){
      this.invoiceService.downloadInvoiceAsExce(rowData.pa_vendor_uuid).subscribe(
      res => {
          if (res && res.status === 200) {
            const path = res?.data?.attachmentDataArray?.data;
            const values: any = Object.values(path);
            let downloadLink = values[0]?.path;
            window.open(downloadLink, '_parent');
          }
        },
        err => {
          let message = 'Something went wrong with Download Report!';
          this.showError(message);

        },
      )
    }
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ? err?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }

  showVendorInfo(vendor_uuid, pageNo, i, limit) {
    this.vendor_uuid = vendor_uuid;
    let payload = {
      invoice_uuid: this.invoiceId,
      vendor_uuid: vendor_uuid,
      page: pageNo,
      search: this.searchKey,
      limit: limit
    }
    this.invoiceService.getVendorTabConsolidatedInvoiceList(payload).subscribe(
      (res) => {
        this.loading = false;
        this.total_records = res?.data?.total_records;
        this.vendorList?.forEach((val) => {
          if (val?.key === vendor_uuid) {
            val.invoiceLists = [...res?.data?.vendor?.data?.map(x => {
              return {
                ...x, iWorker: this.capitalizeWords(x?.worker.name),
                erp_external_id: (x?.erp_external_id),
                type: x?.type === "by_milestone" ? 'Progress Update' : this.capitalizeWords(x?.type),
                hour: this.accuracyPipe?.transform(x?.hour, this.accuracyEnum.HOUR),
                sourcing_model: (x?.sourcing_model)?.toUpperCase(),
                duration: `${this.getDate(x?.invoice_start_date, true)} - ${this.getDate(x?.invoice_end_date, true)}`,
                total_amount_without_tax: { amount: x?.client_amount?.total_amount_without_tax, currency: x?.currency || this.defaultCurrency },
                msp_amount: { amount: x?.msp_amount?.msp_amount, currency: x?.currency || this.defaultCurrency },
                msp_tax_amount: { amount: x?.msp_amount?.msp_tax_amount, currency: x?.currency || this.defaultCurrency },
                vendor_amount: { amount: x?.vendor_amount?.vendor_amount_without_tax, currency: x?.currency || this.defaultCurrency },
                vendor_tax_amount:{ amount: x?.vendor_amount?.vendor_tax_amount, currency: x?.currency || this.defaultCurrency },
                vms_amount: { amount: x?.vms_amount?.total_vms_amount_with_tax, currency: x?.currency || this.defaultCurrency },
                total_amount_with_tax:  { amount: x?.vendor_amount?.vendor_amount, currency: x?.currency || this.defaultCurrency },
                milestone_code: x?.sow_progress_info?.milestone_code ? x?.sow_progress_info?.milestone_code : '--',
                sow_code: x?.sow_progress_info?.sow_code ? x?.sow_progress_info?.sow_code : '--',
                milestone_name: x?.sow_progress_info?.milestone_name ? this.capitalizeWords(x?.sow_progress_info?.milestone_name) : '--'  ,
                sow_name: x?.sow_progress_info?.sow_name ?  this.capitalizeWords(x?.sow_progress_info?.sow_name) : '--',
              };
            })]
            val.data = val?.invoiceLists
          }
        })
    });
    this.vendorIndex = i;
  }
}
