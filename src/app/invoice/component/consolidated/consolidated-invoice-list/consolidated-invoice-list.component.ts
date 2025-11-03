import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { InvoiceService } from '../../../service/invoice.service';
import { Router } from '@angular/router';
import { UsersType } from 'src/app/shared/enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';

enum Status {
  All = '',
  Approved = 'approved',
  Pending = 'pending',
  Cancelled = 'rejected',
  Draft = 'draft',
  'In-Progress' = 'in_progress',
  Failed = 'failed'
}
@Component({
  selector: 'app-consolidated-invoice-list',
  templateUrl: './consolidated-invoice-list.component.html'
})
export class ConsolidatedInvoiceListComponent implements OnInit {
  accuracyEnum = AccuracyConfigEnum;
  public tableConfig: VMSConfig;
  public individualInvoiceLists;
  public selectedTab = 'All';
  public invoiceLists: any[] = [];
  private params = { history: true, page: 1, limit: 10, status: Status[this.selectedTab], search: '', complete: false };
  public currentPage = 1;
  public rotuterLinkParseFn;
  public limit: number = 10;
  public pageNo: number = 1;
  public total_records: number = 10;
  private searchKey = null;
  public count: number[];
  public itemPerPage = 10;
  order_by: string = '';
  sort_by: string = '';
  defaultCurrency = 'USD';
  userType: any;
  constructor(
    public invoiceService: InvoiceService,
    public datePipe: DatePipe,
    private localDatePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    private router : Router,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.defaultCurrency = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultCurrency || this.defaultCurrency;
    this.invoiceService.getInvoiceConfigDetails().subscribe((res) => {
      if(res && res?.data){
        this.userType = res?.data?.user_type?.toLowerCase();
        if(this.userType === UsersType.VENDOR.toLowerCase()){
          this.tableConfig.tabsList = ['Approved'];
          this.selectedTab = 'Approved';
          this.invoiceService.getAllconsolidatedInvoiceList({ page: this.pageNo, limit: this.limit,complete: false, history: false, status: Status[this.selectedTab], search: this.searchKey, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
            this.total_records = res?.data?.total_records;
            if(res?.data['invoices']){
              this.processInvoicesResponse(res?.data['invoices']);
            }
          })
        }
        else {
          this.getAllconsolidatedInvoiceList();
        }
      }
    })
    
    this.tableConfig = {
      title: 'Consolidated Invoice',
      columnList: [
        { name: 'invoice_number', title: 'Invoice Number', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isOpenView: true, isNavigation: true, isNoOption: true, isSort: true },
        { name: 'invoice_status', title: 'Status', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'billing_duration', title: 'Billing Period', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'consolidated_date', title: 'Consolidate Date', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'duration', title: 'Invoice Duration', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'hours', title: 'Hours', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        
        { name: 'timesheet_amount', title: 'Timesheet Amount', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true ,isCurrency: true},
        { name: 'expense_amount', title: 'Expense Amount', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true ,isCurrency: true},
        { name: 'misc_expense_amount', title: 'Misc Expense Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isSort: true,isCurrency: true },
        { name: 'by_milestone', title: 'Progress Update Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isSort: true ,isCurrency: true},
        { name: 'total_amount_with_tax', title: 'Total Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true, isSort: true ,isCurrency: true},
        { name: 'client_balance_amount', title: 'Client Balance Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true ,isCurrency: true},
        { name: 'vendor_balance_amount', title: 'Vendor Balance Amount', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true ,isCurrency: true},
        { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: true, isOpenView: false, isNoOption: true },
        { name: 'client.name', title: 'Client Name', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: true, isOpenView: false, isNoOption: true },
        { name: 'st_hours', title: 'ST Hours', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'st_amount', title: 'ST Amount', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true ,isCurrency: true},
        { name: 'ot_hours', title: 'OT Hours', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'ot_amount', title: 'OT Amount', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true,isCurrency: true },
        { name: 'dt_hours', title: 'DT Hours', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'dt_amount', title: 'DT Amount', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true,isCurrency: true }, 
      ],
      tabsList: ['All', 'Approved', 'Draft', 'In-Progress','Cancelled','Failed', 'Transaction Complete', 'History',],
      showTabs: true,
      isExpand: true,
      //  isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      isTopHeader: false,
      density: 'COMFORTABLE',
      hideBottomPagination: false,
      tableWidth: '100%',
      isCheckboxOption: false,
    };
    this.fetchInvoiceCount();
  }

  onClickView($event){
    this.router.navigate([`/invoice/consolidate-invoice-details/${$event.invoice_uuid}/Client Bill`]);
  }

  fetchInvoiceCount() {
    this.invoiceService.fetchConsolidatedInvoiceListCount().subscribe(data => {
      const invoiceCount = data.data;
      this.count = [];
      if(this.userType === UsersType.VENDOR.toLowerCase()){
        this.count.push(invoiceCount.find(x => x.status === 'approved')['count']);
      }
      else{
        this.count.push(invoiceCount.find(x => x.status === 'all')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'approved')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'draft')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'in_progress')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'cancelled')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'failed')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'transaction_complete')['count']);
        this.count.push(invoiceCount.find(x => x.status === 'history')['count']);
      }
      this.count = [... this.count];
    });
  }
  getAllconsolidatedInvoiceList() {
    this.invoiceService.getAllconsolidatedInvoiceList().subscribe(res => {
      this.total_records = res?.data?.total_records;
      this.processInvoicesResponse(res?.data['invoices']);
    });
  }

  getTime(time) {
    if (!!time) {
      return parseFloat(time)?.toFixed(2)
    } else {
      return time;
    }
  }
  onSortClick(event) {
    if (!!event) {
      const isComplete = this.selectedTab && this.selectedTab.toLowerCase() === 'transaction complete';
      const isHistory = this.selectedTab && this.selectedTab.toLowerCase() === 'history';
      this.order_by = event?.order?.toLowerCase() || '';
      this.sort_by = event?.name || '';
      this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, complete: isComplete, history: isHistory, status: Status[this.selectedTab], limit: this.limit, page: this.pageNo, search: this.searchKey, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
        this.total_records = res?.data?.total_records;
        this.processInvoicesResponse(res?.data['invoices'])
      })
    }
  }

  onSearch(event) {
    this.searchKey = event;
    const isComplete = this.selectedTab && this.selectedTab.toLowerCase() === 'transaction complete';
    const isHistory = this.selectedTab && this.selectedTab.toLowerCase() === 'history';
    this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, complete: isComplete, history: isHistory, status: Status[this.selectedTab], search: event, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
      this.total_records = res?.data?.total_records;
      this.processInvoicesResponse(res?.data['invoices'])
    })
  }

  addSelectedStatus() {
    this.individualInvoiceLists = this.individualInvoiceLists.map(invoice => {
      if(invoice.invoice_status === "in_progress") {
        invoice.invoice_status = "in progress"
      }
      return invoice;
    });
  }
    

  getSelectedTab(event) {  
    this.itemPerPage = 10;
    const isComplete =  event?.toLowerCase() === 'transaction complete';
    const isHistory = event?.toLowerCase() === 'history';
    History
    if(this.selectedTab != event){
      this.limit = 10;
      this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params,limit: this.limit, complete: isComplete, history: isHistory, status: Status[event], search: this.searchKey, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
        this.total_records = res?.data?.total_records;
        this.processInvoicesResponse(res?.data['invoices'])
      })
    }
    this.selectedTab = event;
    this.fetchInvoiceCount()
  }

  changerecords(event) {
    this.limit = event;
    this.itemPerPage = event;
    const isComplete = this.selectedTab && this.selectedTab.toLowerCase() === 'transaction complete';
    const isHistory = this.selectedTab && this.selectedTab.toLowerCase() === 'history';
    this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, complete: isComplete, history: isHistory, status: Status[this.selectedTab], limit: event, search: this.searchKey, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
      this.total_records = res?.data?.total_records;
      this.processInvoicesResponse(res?.data['invoices'])
    })
  }
  ondetailClick($event) {

  }

  getDate(d) {
    return this.localDatePipe.transform(d);
  }
  onPaginationClick(event) {
    const isComplete = this.selectedTab && this.selectedTab?.toLowerCase() === 'transaction complete';
    const isHistory = this.selectedTab && this.selectedTab?.toLowerCase() === 'history';
    this.pageNo = event;
    this.invoiceService.getAllconsolidatedInvoiceList({ ...this.params, complete: isComplete, history: isHistory, status: Status[this.selectedTab], limit: this.limit, page: this.pageNo, search: this.searchKey, order_by: this.order_by, sort_by: this.sort_by }).subscribe(res => {
      this.total_records = res?.data?.total_records;
      this.processInvoicesResponse(res?.data['invoices']);
      
    })
  }

  processInvoicesResponse(invoices) {

    this.individualInvoiceLists = [...invoices.map(x => {
      return {
        ...x, duration: `${this.getDate(x?.duration_start_date)}-${this.getDate(x?.duration_end_date)}`,
        billing_duration: `${this.getDate(x?.billing_start_date)}-${this.getDate(x?.billing_end_date)}`,
        consolidated_date: `${this.getDate(x?.consolidated_date)}`,
        hours: `${this.accuracyPipe?.transform(x?.hours, this.accuracyEnum.HOUR)}`,
        dt_hours: `${this.accuracyPipe?.transform(x?.dt_hours, this.accuracyEnum.HOUR)}`,
        ot_hours: `${this.accuracyPipe?.transform(x?.ot_hours, this.accuracyEnum.HOUR)}`,
        st_hours: `${this.accuracyPipe?.transform(x?.st_hours, this.accuracyEnum.HOUR)}`,
        misc_expense_amount: { amount: x?.misc_expense_amount, currency: x?.currency || this.defaultCurrency },
        by_milestone: { amount: x?.by_milestone, currency: x?.currency || this.defaultCurrency },
        timesheet_amount: { amount: x?.timesheet_amount, currency: x?.currency || this.defaultCurrency },
        expense_amount: { amount: x?.expense_amount, currency: x?.currency || this.defaultCurrency },
        total_amount_with_tax: { amount: x?.total_amount_with_tax, currency: x?.currency || this.defaultCurrency },
        client_balance_amount: { amount: x?.client_balance_amount, currency: x?.currency || this.defaultCurrency },
        vendor_balance_amount: { amount: x?.vendor_balance_amount, currency: x?.currency || this.defaultCurrency },
        hierarchy: x?.all_hierarchy[0],
        dt_amount: { amount: x?.dt_amount, currency: x?.currency || this.defaultCurrency },
        ot_amount: { amount: x?.ot_amount, currency: x?.currency || this.defaultCurrency },
        st_amount: { amount: x?.st_amount, currency: x?.currency || this.defaultCurrency },
        balance: `${this.accuracyPipe.transform(x?.balance, this.accuracyEnum.AMOUNT, { currencyCode: this.defaultCurrency })}`,

      };
    })];
    this.addSelectedStatus();
  }
}
