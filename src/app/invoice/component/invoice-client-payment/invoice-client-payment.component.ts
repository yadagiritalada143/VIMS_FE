import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { CurrencyService } from 'src/app/shared/service/currency.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { ConsolidateInvoiceTabEnum } from "src/app/invoice/enums/consolidate-invoice.enum";
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { AccessControlService } from 'src/app/core/services/access-control.service';
@Component({
  selector: 'app-invoice-client-payment',
  templateUrl: './invoice-client-payment.component.html',
  styleUrls: ['./invoice-client-payment.component.scss'],
})
export class InvoiceClientPaymentComponent implements OnInit {
  accuracyEnum = AccuracyConfigEnum;
  public tableConfig: any;
  public invoiceLists: any[] = [];
  public selectedInvoicelist = [];
  public invoiceDetail = [];
  public total_records = 0;
  headerActionButtons = [];
  showClientPaymentRollBack;
  public rollbackData;
  current_pa_uuid;
  isDownloadInvoiceEnable: boolean = true;
  isNewPaymentCreated: boolean = false;
  limit: number = 10;
  public itemPerPage = 10;
  pageNo: number = 1;
  sortObj: any;
  columnMapping: any = {
    totExp: 'total_amount_with_tax',
    missExp: 'misc_expense_amount',
    timeSheet: 'timesheet_amount',
    expAmount: 'expense_amount',
    totalHours: 'total_hours',
  };
  invoiceBasicDetails;
  public history = false;
  public invoiceCount = [];
  public count = [];
  public loader = false;
  filters: any = {};
  navigation: any = {};
  currentProgram: any;
  isUNFI: boolean;
  reasonCodes;
  isCreditDebitEnable: boolean;

  constructor(
    private authorizationService: AuthorizationService,
    private invoiceService: InvoiceService,
    private router: Router,
    private eventStream: EventStreamService,
    private localDatePipe: LocalDateFormatPipe,
    private resonCodesService: ReasonCodesService,
    private currencyService: CurrencyService,
    private confirmService: ConfirmationDialogService,
    private storageService: StorageService,
    public accuracyPipe: AccuracyPipe,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
    this.eventStream.on(Events.INVOICE_PAYMENT_COMPLETED).subscribe((data) => {
      this.isNewPaymentCreated = false;
      this.fetchInvoiceList({ page: 1, limit: 10 })
    });
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isUNFI = this.currentProgram.name.includes('UNFI');
    const consolidateInvoice = this.authorizationService.authorize('create_consolidate_invoice');
    if (consolidateInvoice) {
      this.headerActionButtons.push({ title: 'Consolidate Invoice', class: 'btn-outine invoice-header-btn', disabled: true });
    }
    if (this.authorizationService.authorize('create_credit_debit')) {
      this.headerActionButtons.push({ title: 'Credit/Debit', class: 'btn-outine  invoice-header-btn' });
    }
   
     this.invoiceService.getInvoiceConfigDetails().subscribe((res) => {
       if(res && res?.data){
        this.isDownloadInvoiceEnable = res?.data?.is_individual_download_enable
        this.isCreditDebitEnable = res?.data?.is_credit_debit_enable;
        if(!this.isCreditDebitEnable){
          let CreditDebitIndex = this.headerActionButtons.findIndex((element: any) => element.title == ConsolidateInvoiceTabEnum.CreditDebit)
          if(CreditDebitIndex !== -1){
            this.headerActionButtons.splice(CreditDebitIndex,1)
           }
         }
       }
    })
    this.tableConfig = {
      title: 'Payments',
      permission: 'menu_client_payments_invoices',
      isCreateButtonName: 'Create Payment',
      columnList: this.getColumnList(),      
      tabsList: ['Payment'],
      showTabs: false,
      isExpand: true,
      isFilter: false,
      isSearch: true,
      isSetting: true,
      isCreate: true,
      isTopHeader: false,
      density: 'COMFORTABLE',
      tableWidth: '100%',
      isCheckboxOption: false,
      allowMultiselect: false,
      advanceFilter: [
        { name: 'pa_code', title: 'PA Number', filterType: 'TEXT' },
        {
          name: 'status',
          title: 'Status',
          filterType: 'MULTISELECT',
          multiSelectData: [{ value: 'pending', name: 'Pending' },{ value: 'approved', name: 'Approved' }],
        },
        { name: 'check_number', title: 'Check Number', filterType: 'TEXT' },
        { name: 'invoice_number', title: 'Consolidate Invoice Number', filterType: 'TEXT' },
        { name: 'batch_number', title: 'Batch/Req Number', filterType: 'TEXT' },
        { name: 'received_date', title: 'Received Date', filterType: 'TEXT' },
        { name: 'entered_date', title: 'Entered Date', filterType: 'TEXT' },
        { name: 'invoice_amount', title: 'Invoice Amount', filterType: 'TEXT' },
      ],
    };
    this.fetchInvoiceList({ page: 1, limit: 10 });
    this.eventStream.on(Events.CREDIT_DEBIT_CLOSE).subscribe(data => {
      this.fetchInvoiceList({ page: this.pageNo, limit: this.limit });
    });
  }
  onViewClick(event){
    let queryParams = { isFromPaymentPage : true}
    this.router.navigate([`/invoice/consolidate-invoice-details/${event?.consolidate_invoice?.invoice_uuid}/Client Bill`],{ queryParams });
  }
  getColumnList(){
    const rollbackAllowed = this.authorizationService.authorize('view_rollback_payment') && this.accessControlService.accessControl();
    const payNow = this.authorizationService.authorize('view_pay_now');
    let columnList = [];
    if (rollbackAllowed && payNow) {
      columnList.push({ name: 'pa_code', title: 'PA Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment', isOpenView: true, isNoOption: false, isNavigation: false });
    } else if (rollbackAllowed) {
      columnList.push({ name: 'pa_code', title: 'PA Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isGenericWithdraw: true, isGenericWithdrawText: 'Rollback Payment', isOpenView: true, isNoOption: false, isNavigation: false });
    } else if (payNow) {
      columnList.push({ name: 'pa_code', title: 'PA Number', width: 16, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true });
    }
    columnList.push({
      name: 'pa_status',
      title: 'Status',
      width: 9,
      isIcon: false,
      isImage: false,
      isContact: false,
      isNumberBadge: false,
      isSort: true,
      isNoOption: true,

    });
    columnList.push({
      name: 'check_number',
      title: 'Check Number',
      width: 16,
      isIcon: false,
      isImage: true,
      isContact: false,
      isNumberBadge: false,
      isNoOption: true,
      isNavigation: true,
      isOpenView: true,
      isSort: true,
    });
    columnList.push( {
      name: 'invoice_number',
      title: 'Con.Invoice',
      width: 15,
      isIcon: false,
      isImage: true,
      isContact: false,
      isNumberBadge: false,
      isNoOption: true,
    });
    columnList.push({
      name: 'batch_number',
      title: 'Batch/Req no.',
      width: 8,
      isIcon: false,
      isImage: false,
      isContact: false,
      isNumberBadge: false,
      isSort: true,
    });
    columnList.push({
      name: 'received_date',
      title: 'Received Date',
      width: 8,
      isIcon: false,
      isImage: true,
      isContact: false,
      isNumberBadge: false,
      isNoOption: true,
      isNavigation: true,
      isOpenView: true,
      isSort: true,
    });
    columnList.push({
      name: 'entered_date',
      title: 'Entered Date',
      width: 15,
      isIcon: false,
      isImage: true,
      isContact: false,
      isNumberBadge: false,
      isNoOption: true,
      isNavigation: true,
      isOpenView: true,
      isSort: true,
    });

    columnList.push({
      name: 'invoice_amount',
      title: 'Invoice Amount',
      width: 9,
      isIcon: false,
      isImage: false,
      isContact: false,
      isNumberBadge: false,
      isSort: true,
    });
    return columnList;
  }

  onSortClick(event) {
    if (!!event) {
      this.sortObj = event;
      this.fetchInvoiceList({ page: this.pageNo, limit: this.limit });
    }
  }
  rollbacked(data) {
    if (!data) {
      this.showClientPaymentRollBack = false;
      return;
    }
    else {
      this.showClientPaymentRollBack = false;
      this.fetchInvoiceList({ page: 1, limit: 10 });
      this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED, true));
      this.eventStream.emit(new EmitEvent(Events.INVOICE_PAYMENT_COMPLETED_CP, true));
    }
  }

  paymentRollback(event) {
    this.confirmService.confirm('', `Are you sure you want to Rollback Payment Allocation?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.invoiceService.getConsolidatedInvoiceBasiDetail(event?.consolidate_invoice?.invoice_uuid).subscribe(data => {
            this.invoiceBasicDetails = data;
          })
          this.resonCodesService.getResoncodesFor('ROLLBACK_PAYMENT_ALLOCATION').subscribe(data => {
            this.reasonCodes = data.reason_codes.filter(reason => reason.is_enabled === true);
            this.current_pa_uuid = event.pa_uuid;
            this.rollbackData = event;
              this.showClientPaymentRollBack = true;
            }
          )
           }else{
             this.showClientPaymentRollBack = false;
           }
          });
  }

  getDate(d, noDateConversion) {
    return this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion);
  }
  
  fetchInvoiceList({ ...args }) {
    this.loader = true;
    if (this.sortObj) {
      if (this.sortObj.name) args.sort_by = this.columnMapping[this.sortObj.name] || this.sortObj.name;
      if (this.sortObj.order) args.order_by = this.sortObj.order?.toLowerCase();
    }
    this.invoiceService.getPaymentAllocationList({ ...args }).subscribe(
      res => {
        this.loader = false;
        let payment_allocation = res?.data?.payment_allocation;
        this.total_records = res?.data?.total_records;
        this.invoiceLists = [
          ...payment_allocation.map(x => {
            return {
              ...x,
              invoice_number : x.consolidate_invoice.invoice_number,
              batch_number : x.consolidate_invoice.batch_number,
              received_date : this.getDate(x.received_date, true),
              entered_date : this.getDate(x.entered_date, true),
              invoice_amount : this.accuracyPipe?.transform(x.invoice_amount, this.accuracyEnum.AMOUNT, { currencyCode: x.currency}),
              remaining_amount : this.accuracyPipe?.transform(x.remaining_amount, this.accuracyEnum.AMOUNT, { currencyCode: x.currency}),
              pa_amount : `${this.currencyService.getCurrencyFromCode(x.pa_amount, x.currency)}`,
            };
          }),
        ];
      },
      err => {
        this.loader = false;
      },
    );
  }
 
  onListFilter(e) {
    this.filters = e;
    this.pageNo = 1;
    this.fetchInvoiceList({ page: this.pageNo, limit: this.limit, filter: this.filters });
  }
  onSearch(event) {
    this.pageNo = 1;
    this.fetchInvoiceList({ page: this.pageNo, limit: this.limit, search: event });
  }

  onPaginationClick(event) {
    this.pageNo = event;
    this.fetchInvoiceList({ page: event, limit: this.limit });
  }
  
  onCreate(event){
    this.isNewPaymentCreated = true;
  }
}
