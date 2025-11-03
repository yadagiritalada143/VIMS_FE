import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { InvoiceService } from 'src/app/invoice/service/invoice.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UsersType } from 'src/app/shared/enums';
import { ConsolidateInvoiceTabEnum, IndividualInvoiceHeaderButton, IndividualInvoiceTabEnum } from "src/app/invoice/enums/consolidate-invoice.enum";
import { DownloadReportService } from 'src/app/reports/components/download-report/download-report.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
import { InvoiceType } from 'src/app/invoice/enums/Individual-invoice.enum';
import  { AccessControlService } from 'src/app/core/services/access-control.service';
import { map, Subject } from 'rxjs';
@Component({
  selector: 'app-individual-invoice-list',
  templateUrl: './individual-invoice-list.component.html',
  styleUrls: ['./individual-invoice-list.component.scss'],
})
export class IndividualInvoiceListComponent implements OnInit {
  public tableConfig: VMSConfig;
  accuracyEnum = AccuracyConfigEnum;
  public candidateInput$ = new Subject<string | null>();
  public selectedTab = 'Pending Consolidation';
  public invoiceLists: any[] = [];
  public selectedInvoicelist = [];
  public selectedAllInvoiceIds = [];
  public excludeInvoiceIds = [];
  public invoiceDetail = [];
  public total_records = 0;
  headerActionButtons = [];
  isDownloadInvoiceEnable: boolean = true;
  limit: number = 10;
  public itemPerPage = 10;
  pageNo: number = 1;
  sortObj: any;
  baseURL:any = '/configurator/programs/';
  columnMapping: any = {
    totExp: 'total_amount_with_tax',
    missExp: 'misc_expense_amount',
    timeSheet: 'timesheet_amount',
    expAmount: 'expense_amount',
    totalHours: 'total_hours',
  };
  public history = false;
  public invoiceCount = [];
  public count = [];
  public loader = false;
  filters: any = {};
  navigation: any = {};
  currentProgram: any;
  programCode: any;
  programName: any;
  isChange: boolean;
  is_tax_hidden: boolean;
  logs:Log = undefined;
  isCreditDebitEnable: any;
  user_type: any;
  searchText: any;
  isFilterCleared: boolean;
  public viewCurrencyStrict: string = '0.4-4' ;
  defaultCurrency = 'USD';
  subHeaderActionButtons= [
  ];
  selectedRecords: any;
  selectedInvoiceCount: number = 0;
  selectedAllRecordsPage: number;
  selectPageData: boolean = false;
  isHiddenColumns: any;
  isConsolidateInvoicePermission: boolean;
  isAllRecordsSelected: boolean;
  hierarchyList: any = [];
  currencies: any = []
  is_invoice_info_flyout_show: boolean =  false;
  foundationDatas: any = ['cost_center', 'gl_account',  'gl_dept_no', 'gl_legal_entity', 'gl_location', 'gl_service_department', 'gl_intra_company'];
  private hierarchyMap: Map <string, string> = new Map <string, string> ();
  constructor(
    private authorizationService: AuthorizationService,
    private invoiceService: InvoiceService,
    private router: Router,
    private eventStream: EventStreamService,
    private _downloadReportService: DownloadReportService,
    private localDatePipe: LocalDateFormatPipe,
    private _loader: LoaderService,
    private storageService: StorageService,
    public accuracyPipe: AccuracyPipe,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultCurrency = this.currentProgram?.defaultCurrency || this.defaultCurrency;
    const edit_accuracy = this.currentProgram?.config?.currency?.edit_accuracy;
    this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
    this.programCode = this.currentProgram?.code;
    this.programName = this.currentProgram?.name;
    this.is_tax_hidden = this.currentProgram.config?.is_tax_hidden || false;
    this.isConsolidateInvoicePermission = this.authorizationService.authorize('create_consolidate_invoice');
    if (this.isConsolidateInvoicePermission && this.accessControlService.accessControl()) {
      this.subHeaderActionButtons.push({ name: 'consolidate_invoice', title: IndividualInvoiceHeaderButton?.ConsolidateInvoice, icon: '',  disabled: !this.accessControlService.accessControl() });
    }
    if (this.authorizationService.authorize('create_credit_debit')) {
      this.headerActionButtons.push({ title: 'Credit/Debit', class: 'btn-outine  invoice-header-btn', disabled: !this.accessControlService.accessControl() });
    }
    this.headerActionButtons.push({ title: IndividualInvoiceHeaderButton?.DownloadData, class: 'btn-outine  invoice-header-btn', disabled: !this.accessControlService.accessControl() });
    let recordsPerPageSetting= [10, 20, 30, 50];
    this.getCurrencies();
    this.invoiceService.getInvoiceConfigDetails().subscribe((res) => {
      if(res && res?.data){
        if(res?.data?.is_invoice_info_flyout_show) {
          this.is_invoice_info_flyout_show = true;
          const columnList:any[] = this.tableConfig.columnList
          columnList[0].infoIcon =  true;
          this.tableConfig.columnList =  columnList;
          this.tableConfig =  {... this.tableConfig};
        } 
        
        this.isDownloadInvoiceEnable = res?.data?.is_individual_download_enable;
        this.isCreditDebitEnable = res?.data?.is_credit_debit_enable;    
        this.isHiddenColumns = res?.data?.hide_columns;
        if(!this.isCreditDebitEnable){
          let CreditDebitIndex = this.headerActionButtons.findIndex((element: any) => element?.title == ConsolidateInvoiceTabEnum?.CreditDebit)
          if(CreditDebitIndex !== -1){
            this.headerActionButtons.splice(CreditDebitIndex,1)
           }
         }
         if(!this.isDownloadInvoiceEnable){
          let downloadInvoiceIndex = this.headerActionButtons.findIndex((element: any) => element?.title == IndividualInvoiceHeaderButton?.DownloadData)
          if(downloadInvoiceIndex !== -1){
            this.headerActionButtons.splice(downloadInvoiceIndex,1)
           }
         }
         this.user_type = res?.data?.user_type?.toLowerCase()
        this.hideColumnForAMFProgram();
      }
    })
    this.tableConfig = {
      title: 'Invoice',
      columnList: this.getinvoiceColumns(),
      tabsList: ['Pending Consolidation', 'All Individual','In-Progress'],
      showTabs: true,
      isExpand: true,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      recordsPerPageSetting: recordsPerPageSetting,
      isTopHeader: false,
      density: 'COMFORTABLE',
      headerActionButtons: this.headerActionButtons,
      subHeaderActionButtons: this.subHeaderActionButtons,
      tableWidth: '100%',
      isCheckboxOption: true,
      checkboxTooltip: 'Change in selection not allowed!',
      allowMultiselect: false,
      advanceFilter: [
        { name: 'invoice_number', title: 'Invoice Id', filterType: 'TEXT' },
        {
          name: 'invoice_status',
          title: 'Invoice Status',
          filterType: 'MULTISELECT',
          multiSelectData: [{ value: 'pending', name: 'Pending' }, { value: 'consolidated', name: 'Approved' }],
        },
        {
          name: 'invoice_type',
          title: 'Invoice Type',
          filterType: 'MULTISELECT',
          multiSelectData: [
            { value: 'timesheet', name: 'Timesheet' },
            { value: 'expense', name: 'Expense' },
            { value: 'misc_expense', name: 'Misc Expense' },
            { value: 'by_milestone', name: 'Progress Update' },
          ],
        },
        { name: 'assignment_manager', title: 'Assignment Manager Name', filterType: 'TEXT' },
        {
          name: 'worker_uuids',
          title: 'Worker',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.candidateInput$,
          changeHandler: this.getCandidateList,
        },
        // { name: 'worker_name', title: 'Worker Name', filterType: 'TEXT' },
        { name: 'hierarchy', title: 'Hierarchy Name', filterType: 'MULTISELECT', multiSelectData: this.hierarchyList },
        { name: 'total_hours', title: 'Total Hours', filterType: 'NUMBER' },
        {
          name: 'currency',
          title: 'Currency',
          filterType: 'SELECT',
          multiSelectData: this.currencies
        }
      ],
    };

    if (this.user_type === UsersType?.VENDOR?.toLowerCase()) {
      this.tableConfig.advanceFilter.push({ name: 'vendor_amount', title: 'Invoice Amount', filterType: 'NUMBER' });
    } else {
      this.tableConfig.advanceFilter.push({ name: 'client_amount', title: 'Invoice Amount', filterType: 'NUMBER' });
    }
    this.fetchInvoiceList({ page: 1, limit: 10 });
    this.fetchInvoiceCount();
    this.eventStream.on(Events.CREDIT_DEBIT_CLOSE).subscribe(data => {
      if (this.selectedTab == "Pending Consolidation") {
        this.fetchInvoiceList({ page: this.pageNo, limit: this.limit });
      } else {
        this.fetchAllIndividualList({ page: this.pageNo, limit: this.limit, status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
      }
      this.fetchInvoiceCount();
    });
    if(this.is_tax_hidden){
     let index= this.tableConfig.columnList.findIndex((element: any) => element.name =="totExp")
     if(index !== -1){
      this.tableConfig.columnList.splice(index,1)
     }
    }
    this.tableConfig.isCheckboxOption = this.isConsolidateInvoicePermission ? true : false;

      // Fetch hierarchy details
      this.invoiceService.fetchHierarchyObservable().subscribe({
        next: (data: any) => {
          if(Array.isArray(data?.result) && data?.result?.length)
            this.hierarchyMapper(data?.result?.[0]);
            this.fetchHierarchyList(data.result?.[0], false);
        }, error: (err: any) => {
          let message = 'Error encountered while fetching hierarchy details';
          this.showError(message);
        }, complete: () => {
        }
      });
  }

  getAllindividualColumns() {
    let columnList: any;
    columnList = [
      {
        name: 'iWorker',
        title: 'Worker/Progress Update',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isOpenView: false,
        isNoOption: true,
        infoIcon: this.is_invoice_info_flyout_show,
        toolTipVisibility: true
      },
      {
        name: 'invoice_status',
        title: 'Status',
        width: 9,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      {
        name: 'invoice_number',
        title: 'Invoice Id',
        width: 16,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
        isNavigation: true,
        isOpenView: true,
        isSort: true,
      },
      {
        name: 'consolidated_invoice_number',
        title: 'Consolidated Invoice Number',
        width: 16,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
        isNavigation: true,
        isOpenView: true,
        isSort: true,
      },
      {
        name: 'consolidated_date',
        title: 'Date of consolidation',
        width: 15,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
      },
      {
        name: 'duration',
        title: 'Billing Duration',
        width: 15,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
      },
      {
        name: 'assignment_code',
        title: 'Assignment ID',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      { name: 'ts_es_id', title: 'INVOICE TYPE ID', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'type', title: 'Invoice Type', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      {
        name: 'vendorName',
        title: 'Vendor',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      {
        name: 'charge_number',
        title: 'Charge Number',
        width: 15,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      {
        name: 'am',
        title: 'AM',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      {
        name: 'totalHours',
        title: 'Total Hours',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      {
        name: 'invoice_amount',
        title: 'Invoice Amount',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
        isCurrency: true
      },
      {
        name: 'hierarchy.name',
        title: 'Hierarchy',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      {
        name: 'sourcing_model',
        title: 'Sourcing Model',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
    ]
    return columnList;
  }
  getinvoiceColumns() {
    let columnList: any;
    columnList = [
      {
        name: 'iWorker',
        title: 'Worker/Progress Update',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isOpenView: false,
        infoIcon: this.is_invoice_info_flyout_show,
        isNoOption: true,
      },
      {
        name: 'invoice_status',
        title: 'Status',
        width: 9,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      {
        name: 'invoice_number',
        title: 'Invoice Id',
        width: 16,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
        isNavigation: true,
        isOpenView: true,
        isSort: true,
      },
      {
        name: 'duration',
        title: 'Billing Duration',
        width: 15,
        isIcon: false,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isNoOption: true,
      },
      {
        name: 'assignment_code',
        title: 'Assignment ID',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      { name: 'ts_es_id', title: 'INVOICE TYPE ID', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
      { name: 'type', title: 'Invoice Type', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      {
        name: 'vendorName',
        title: 'Vendor',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      // {
      //   name: 'journal_id',
      //   title: 'Journal Id',
      //   width: 16,
      //   isIcon: false,
      //   isImage: false,
      //   isContact: false,
      //   isNumberBadge: false,
      //   isNoOption: false,
      //   isNavigation: false,
      //   isOpenView: false,
      //   isSort: true,
      // },
      {
        name: 'charge_number',
        title: 'Charge Number',
        width: 15,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true
      },
      {
        name: 'am',
        title: 'AM',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      {
        name: 'totalHours',
        title: 'Total Hours',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      },
      {
        name: 'invoice_amount',
        title: 'Invoice Amount',
        width: 8,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
        isCurrency: true
      },
      {
        name: 'hierarchy.name',
        title: 'Hierarchy',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
      {
        name: 'sourcing_model',
        title: 'Sourcing Model',
        width: 15,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: true,
        isOpenView: false,
        isNoOption: true,
      },
    ]
    return columnList;
  }

  onSortClick(event) {
    if (!!event) {
      this.sortObj = event;
      if (this.selectedTab == "Pending Consolidation") {
        this.fetchInvoiceList({ page: this.pageNo, limit: this.limit });

      } else {
        this.fetchAllIndividualList({ page: this.pageNo, limit: this.limit, status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
      }
    }
  }

  
  getCandidateList = (term = '') => {
    let url = `${this.baseURL}${this.currentProgram.id}/members?limit=25&name=`;
    if (term) {
      url += `${term}`;
    }
    return this.invoiceService
      .get(url)
      .pipe(
        map((res: any) => {
          const members = res.members.map(({ id, first_name, last_name }) => {
            return {
              value: id,
              name: first_name + ' ' + (last_name || ''),
            };
          });
          return members;
        }),
      )
      .subscribe((data: any) => {
        const index = this.tableConfig.advanceFilter.findIndex(filterObj => filterObj?.name === 'worker_uuids');
        this.tableConfig.advanceFilter[index].multiSelectData = data;
      });
  };

  getWorkerId(worker: any) {
    return worker?.code;
  }
    fetchInvoiceCount() {
      this.invoiceService.fetchIndividualInvoiceListCount({ search: this.searchText, filter: this.filters }).subscribe(data => {
        this.invoiceCount = data.data;
        let filterLengh = this.filters ? Object.keys(this.filters).length : 0;
        if (!!this.searchText || filterLengh !== 0) {
          if (this.selectedTab == "Pending Consolidation") {
            let index = this.invoiceCount.findIndex((val) => val.status == 'pending_invoice');
            this.count[0] = this.invoiceCount[index].count;
          } else {
            let index = this.invoiceCount.findIndex(x => x.status === 'All')
            this.count[1] = this.invoiceCount[index].count;
            this.count[2] = this.invoiceCount[this.invoiceCount.findIndex(x => x.status === 'in_progress')]?.count;
          }
        } else {
          this.count[0] = (this.invoiceCount.find(x => x.status === 'pending_invoice')['count']);
          this.count[1] = (this.invoiceCount.find(x => x.status === 'All')['count']);
          this.count[2] = this.invoiceCount[this.invoiceCount.findIndex(x => x.status === 'in_progress')]?.count;
          // this.count.push(this.invoiceCount.find(x => x.status === 'history')['count']);
        }
      this.count = [...this.count];
    });
  }

  previewClicked(event) {
    this.eventStream.emit(
      new EmitEvent(Events.INVOICE_DETAILS_SIDE_PANEL, {
        data: event
      })
    );
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
    if(this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress) {
      args.status = 'in_progress';
    }
    this.invoiceService.fetchInvoiceList({ ...args }).subscribe(
      res => {
        let invoices = res?.data?.invoices;
        this.total_records = res?.data?.total_records;
        this.invoiceLists = [
          ...invoices.map(x => {
            return {
              ...x,
              iWorker: x?.worker?.first_name ?  this.capitalizeWords(x?.worker?.first_name) + ' ' + this.capitalizeWords(x?.worker?.last_name) || '' : (x?.sow_progress_info?.progress_name ? this.capitalizeWords(x?.sow_progress_info?.progress_name) : '--'),
              vendorName: this.capitalizeWords(x?.vendor?.name),
              charge_number: this.getChargeNumber(x?.invoice_foundational_data),
              am: x?.assignment_manager?.name,
              journal_id: x?.invoice_custom_data?.some(r => r.entity_ref == "invoices" && r.slug == "journal_id") ? x?.invoice_custom_data?.find(r => r.entity_ref == "invoices" && r.slug == "journal_id")?.value : "--",
              totalHours: this.accuracyPipe?.transform(x?.total_hours, this.accuracyEnum?.HOUR),
              type: x?.invoice_type?.toLowerCase() === InvoiceType?.ByMilestone?.toLowerCase() ? InvoiceType?.ProgressUpdate : this.capitalizeWords(x?.invoice_type),
              totExp: { amount: x?.total_amount_with_tax, currency: x?.currency || this.defaultCurrency },
              duration: `${this.getDate(x?.invoice_start_date, true)} - ${this.getDate(x?.invoice_end_date, true)}`,
              sourcing_model: x?.sourcing_model?.toLowerCase() == 'sow' ? x?.sourcing_model?.toUpperCase() : this.capitalizeWords(x?.sourcing_model),
              invoice_amount: (this.user_type === UsersType.VENDOR?.toLowerCase()) ? { amount: x?.vendor_amount === undefined ? '0': x?.vendor_amount, currency: x?.currency || this.defaultCurrency } : { amount: x?.client_amount === undefined ? '0': x?.client_amount, currency: x?.currency || this.defaultCurrency }
            };
          }),
        ];
        let count = 0;
        this.selectedInvoicelist.forEach((invoice_uuid) => {
          this.invoiceLists?.forEach((invoiceDetail) => {
            if (invoiceDetail.invoice_uuid === invoice_uuid) {
              count = count + 1;
            }
          })
        })
        if (this.selectedRecords) {
          this.selectedInvoiceCount = this.selectedRecords;
          let count = this.selectedRecords - ((this.pageNo - 1) * this.itemPerPage)
          if(this.selectPageData) count = this.itemPerPage;
          if(this.selectedAllRecordsPage !== this.pageNo && this.selectPageData) return;
          this.invoiceLists?.forEach((invoiceDetail, ind) => {
            if (this.excludeInvoiceIds.length) {
              invoiceDetail.all_invoice_uuid.forEach((val) => {
                let invoiceCount = 0;
                this.excludeInvoiceIds.forEach((id, ind) => {
                  if (id === val) {
                    invoiceCount = invoiceCount + 1;
                  }
                  if (!invoiceCount && (ind + 1) === this.excludeInvoiceIds.length) {
                    invoiceDetail.isChecked = true;
                  } else {
                    invoiceDetail.isChecked = false;
                  }
                })
              })
            }
            else if (ind < count) {
              invoiceDetail.isChecked = true;
            }
          });
        }
        else if (this.selectedInvoicelist.length) {
          this.selectedInvoicelist.forEach((invoice_uuid) => {
            this.invoiceLists?.forEach((invoiceDetail) => {
              if (invoiceDetail.invoice_uuid === invoice_uuid) {
                invoiceDetail.isChecked = true;
              }
            });
          });
        }
        this.addSelectedStatus();
        this.loader = false;
      },
      err => {
        this.showError('Failed to load data due to API timeout');
        this.loader = false;
      },
    );
  }
  
  fetchAllIndividualList({ ...args }) {
    this.loader = true;
    if (this.sortObj) {
      if (this.sortObj.name) args.sort_by = this.columnMapping[this.sortObj.name] || this.sortObj.name;
      if (this.sortObj.order) args.order_by = this.sortObj.order?.toLowerCase();
    }
    this.invoiceService.fetchAllIndividualList({ ...args }).subscribe(
      res => {
        this.loader = false;
        let invoices = res?.data?.invoices;
        this.total_records = res?.data?.total_records;
        this.invoiceLists = [
          ...invoices.map(x => {
            return {
              ...x,
              iWorker: x?.worker?.first_name ?  this.capitalizeWords(x?.worker?.first_name) + ' ' + this.capitalizeWords(x?.worker?.last_name) || '' : (x?.sow_progress_info?.progress_name ? this.capitalizeWords(x?.sow_progress_info?.progress_name) : '--'),
              vendorName: this.capitalizeWords(x?.vendor?.name),
              charge_number: this.getChargeNumber(x?.invoice_foundational_data),
              am: x?.assignment_manager?.name,
              type: x?.invoice_type?.toLowerCase() === InvoiceType?.ByMilestone?.toLowerCase() ? InvoiceType?.ProgressUpdate : this.capitalizeWords(x?.invoice_type),
              totalHours: this.accuracyPipe?.transform(x?.total_hours, this.accuracyEnum.HOUR),
              totExp: { amount: x?.total_amount_with_tax, currency: x?.currency || this.defaultCurrency },
              duration: `${this.getDate(x?.invoice_start_date, true)} - ${this.getDate(x?.invoice_end_date, true)}`,
            	consolidated_invoice_number: x?.consolidated_invoice_number ?  (x?.consolidated_invoice_number) : '--',
              consolidated_date: x?.consolidated_date ?  this.getDate(x?.consolidated_date, false) : '--',
              sourcing_model: x?.sourcing_model?.toLowerCase() == 'sow' ? x?.sourcing_model?.toUpperCase() : this.capitalizeWords(x?.sourcing_model),
              invoice_amount: (this.user_type === UsersType.VENDOR?.toLowerCase()) ? { amount: x?.vendor_amount === undefined ? '0': x?.vendor_amount, currency: x?.currency || this.defaultCurrency } : { amount: x?.client_amount === undefined ? '0': x?.client_amount, currency: x?.currency || this.defaultCurrency }
            };
          }),
        ];
        if (this.selectedInvoicelist.length) {
          this.selectedInvoicelist.forEach((invoice_uuid) => {
            this.invoiceLists?.forEach((invoiceDetail) => {
              if (invoiceDetail.invoice_uuid === invoice_uuid) {
                invoiceDetail.selected = true;
              }
            });
          });
        }
        this.addSelectedStatus();
      },
      err => {
        this.showError('Failed to load data due to API timeout');
        this.loader = false;
      },
    );
  }
  numberWithTwoDecimals(number) {
    return parseFloat(number).toFixed(2);
  }

  onExpandClick(e) { }
  viewSidePanel(e) { }
  onListFilter(e) {
    this.filters = e;
    this.pageNo = 1;
    this.isFilterCleared = false;
    if (this.selectedTab == "Pending Consolidation") {
      this.fetchInvoiceList({ page: this.pageNo, limit: this.limit, filter: this.filters });

    } else {
      this.fetchAllIndividualList({ page: this.pageNo, limit: this.limit, filter: this.filters, status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
    }
    this.fetchInvoiceCount();

  }
  onSearch(event) {
    this.searchText = event;
    this.pageNo = 1;
    this.isFilterCleared = false;
    if (this.selectedTab == "Pending Consolidation") {
      this.fetchInvoiceList({ page: this.pageNo, limit: this.limit, search: event });

    } else {
      this.fetchAllIndividualList({ page: this.pageNo, limit: this.limit, search: event, status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
    }
    this.fetchInvoiceCount();
  }

  onselectAllClick(event) {
    if (event.selected.filter((val) => val.isChecked === false).length == this.invoiceLists?.length) {
      let invoiceIds = event.selected.filter(x => this.selectedInvoicelist.includes(x.invoice_uuid));
      invoiceIds.forEach((id) => this.selectedInvoicelist.splice(id, 1));
      let allInvoiceIds = event.selected.map(x => x?.all_invoice_uuid);
      let allIds = [];
      allInvoiceIds.forEach((allInvoiceId) => {
        if (this.excludeInvoiceIds.indexOf(allInvoiceId) === -1 && this.isAllRecordsSelected) {
          this.excludeInvoiceIds = [...this.excludeInvoiceIds, ...allInvoiceId];
        }
        allIds = [...allIds, ...allInvoiceId];
      })
      allIds.forEach((id) => this.selectedAllInvoiceIds.splice(id, 1));
      this.selectedInvoiceCount = this.selectedInvoicelist.length;
    }
    else {
      if (typeof (event.selected[0]) === 'object') {
        let invoiceIds = event?.selected.map(x => x?.invoice_uuid);
        invoiceIds.forEach((invoiceId) => {
          if (this.selectedInvoicelist.indexOf(invoiceId) === -1) {
            this.selectedInvoicelist = [...this.selectedInvoicelist, invoiceId];
          } else {
            if (event.selected.filter((val) => val.isChecked).length > this.itemPerPage) {
              this.selectedInvoicelist.splice(this.selectedInvoicelist.indexOf(invoiceId), 1);
            }
          }
        })
        let allInvoiceIds = event?.selected.map(x => x?.all_invoice_uuid);
        allInvoiceIds.forEach((allInvoiceId) => {
          allInvoiceId.forEach((id) => {
            if (this.excludeInvoiceIds.indexOf(id) !== -1 && this.isAllRecordsSelected) {
              this.excludeInvoiceIds.splice(this.excludeInvoiceIds.indexOf(id), 1);
            }
          })
          if (this.selectedAllInvoiceIds.indexOf(allInvoiceId) === -1) {
            this.selectedAllInvoiceIds = [...this.selectedAllInvoiceIds, ...allInvoiceId];
          } else {
            if (event.selected.filter((val) => val.isChecked).length > this.itemPerPage) {
              this.selectedAllInvoiceIds.splice(this.selectedAllInvoiceIds.indexOf(allInvoiceId), 1);
            }
          }
        })

      }
      else {
        this.selectedAllInvoiceIds = this.selectedAllInvoiceIds.filter(x => event.selected.includes(x));
        this.selectedInvoicelist = this.selectedInvoicelist.filter(x => event.selected.includes(x));
        this.excludeInvoiceIds = [];
      }
      this.selectedInvoiceCount = this.selectedInvoicelist.length;
    }
    
    if (this.selectedInvoicelist?.length > 0) {
      this.subHeaderActionButtons.map(x => {
        if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
          x.disabled = false;
        }
        return x;
      });
    } else {
      this.subHeaderActionButtons.map(x => {
        if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
          x.disabled = true;
        }
        return x;
      });
    }
    this.tableConfig.subHeaderActionButtons = [...this.subHeaderActionButtons];
  }
  
  getChargeNumber(invoice_foundational_data) {
    let chargeNumber = '';
    this.foundationDatas.forEach((val) => {
      invoice_foundational_data?.find((foundationData) => {
        if (foundationData?.data_type_label === val) {
          chargeNumber +=   (foundationData?.data_id_code ? (foundationData?.data_id_code + '.') : '--');
        }
      });
    });
    return chargeNumber;
  }

  addSelectedStatus() {
    this.invoiceLists = this.invoiceLists.map(invoice => {
      if(invoice.invoice_status === "in_progress") {
        invoice.invoice_status = "in progress"
      }
      invoice.selected = this.selectedInvoicelist.includes(invoice.invoice_uuid);
      return invoice;
    });
  }

  onselectClick(event) {
    let allInvoiceIds;
    if (this.selectedTab === "Pending Consolidation") {
      allInvoiceIds = event?.selected?.all_invoice_uuid;
      this.selectedInvoiceCount = event?.selected?.isChecked ? this.selectedInvoiceCount + 1 : this.selectedInvoiceCount - 1;
    }
    else {
      allInvoiceIds = event?.row?.all_invoice_uuid;
      this.selectedInvoiceCount = event?.row?.selected ? this.selectedInvoiceCount + 1 : this.selectedInvoiceCount - 1;
    }
    if (event?.selected) {
      allInvoiceIds.forEach((allInvoiceId) => {
        if (this.selectedAllInvoiceIds.indexOf(allInvoiceId) === -1) {
          this.selectedAllInvoiceIds = [...this.selectedAllInvoiceIds, allInvoiceId];
        } else {
          this.selectedAllInvoiceIds.splice(this.selectedAllInvoiceIds.indexOf(allInvoiceId), 1);
        }
        if (this.isAllRecordsSelected) {
          if (this.excludeInvoiceIds.indexOf(allInvoiceId) === -1) {
            this.excludeInvoiceIds = [...this.excludeInvoiceIds, allInvoiceId];
          } else {
            this.excludeInvoiceIds.splice(this.excludeInvoiceIds.indexOf(allInvoiceId), 1);
          }
        }
      })

    if (this.selectedInvoicelist.indexOf(event?.selected?.invoice_uuid) === -1) {
      this.selectedInvoicelist = [...this.selectedInvoicelist, event?.selected?.invoice_uuid];
    } else {
      this.selectedInvoicelist.splice(this.selectedInvoicelist.indexOf(event?.selected?.invoice_uuid), 1);
    }
  }
    if (event?.row) {
      allInvoiceIds.forEach((allInvoiceId) => {
        if (this.selectedAllInvoiceIds.indexOf(allInvoiceId) === -1) {
          this.selectedAllInvoiceIds = [...this.selectedAllInvoiceIds, allInvoiceId];
        } else {
          this.selectedAllInvoiceIds.splice(this.selectedAllInvoiceIds.indexOf(allInvoiceId), 1);
        }
      })
      if (this.selectedInvoicelist.indexOf(event?.row?.invoice_uuid) === -1) {
        this.selectedInvoicelist = [...this.selectedInvoicelist, event?.row?.invoice_uuid];
      } else {
        this.selectedInvoicelist.splice(this.selectedInvoicelist.indexOf(event?.row?.invoice_uuid), 1);
      }
    }
    if (this.selectedInvoicelist?.length > 0) {
      this.subHeaderActionButtons.map(x => {
        if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
          x.disabled = false;
        }
        return x;
      });
    } else {
      this.subHeaderActionButtons.map(x => {
        if (x?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
          x.disabled = true;
        }
        return x;
      });
    }
    this.tableConfig.subHeaderActionButtons = [...this.subHeaderActionButtons];
    this.addSelectedStatus();
  }

  selectedRecord(event){
    if(event === 0) {
      this.excludeInvoiceIds = [];
    }
    this.selectedRecords = event;
  }

  onAllRecordsSelected(event){
    this.isAllRecordsSelected = event;
  }  
  
  onSelectedAllRecordsPage(event) {
    this.selectedAllRecordsPage = event;
  }

  onSelectPageData(event) {
    this.selectPageData = event;
  }

  confirmConsolidation() {
    this._loader.show();
    let paylod = {
      consolidation_using: this.selectedRecords ? 'filter' : 'uuid',      
      invoice_uuids: this.selectedRecords ? [] : this.selectedAllInvoiceIds,
      filters: {
        invoice_status: this.filters?.invoice_status ? this.filters?.invoice_status?.toString() : '',
        invoice_type: this.filters?.invoice_type ? this.filters?.invoice_type?.toString() : '',
      },
      excludes: this.isAllRecordsSelected ? this.excludeInvoiceIds : [],
      search: this.searchText ? this.searchText : '',
      limit: this.selectedRecords
    }
    this.invoiceService.createConsoloidatedInvoiceList(paylod).subscribe(
      res => {
        this._loader.hide();
        this.router.navigate([`invoice/consolidate-invoice-details/${res.data.data.invoice_uuid}/Client Bill`]);
      },
      error => {
        this._loader.hide();
        let message = error?.error?.message;
        message = message ? message : 'Consolidation Failed';
        this.showError(message);
      },
    );
  }

  changerecords(event) {
    this.limit = event;
    this.itemPerPage = event;
    if(this.pageNo > this.total_records / this.itemPerPage) {
      this.pageNo = Number((this.total_records / this.itemPerPage)?.toFixed()) >= 1 ? Number((this.total_records / this.itemPerPage)?.toFixed())  : 1;
    }
    if (this.selectedTab == "Pending Consolidation") {
      this.fetchInvoiceList({ page: this.pageNo, limit: event, filter: this.filters, search: this.searchText});
    } else {
      this.fetchAllIndividualList({ page: this.pageNo, limit: event, filter: this.filters, search: this.searchText, status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
    }
    this.fetchInvoiceCount();
  }

  openCreditDebit() {
    this.eventStream.emit(new EmitEvent(Events.CREDIT_DEBIT, { consolidatedInvoiceId: null }));
  }

  actionButtonClicked(event) {
    if (event?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.ConsolidateInvoice?.toLowerCase()) {
      this.confirmConsolidation();
    } else if (event?.title?.toLowerCase() === IndividualInvoiceHeaderButton?.DownloadData?.toLowerCase()) {
      this.downloadInvoiceReport();
    }
    else {
      this.openCreditDebit();
    }
  }

  onPaginationClick(event) {
    this.pageNo = event;
    if (this.selectedTab == "Pending Consolidation") {
      this.fetchInvoiceList({ page: this.pageNo, limit: this.limit, filter: this.filters, search: this.searchText });
    } else {
      this.fetchAllIndividualList({ page: this.pageNo, limit: this.limit, filter: this.filters,search: this.searchText , status: this.selectedTab?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress ? 'in_progress' : 'all' });
    }
  }

  getSelectedTab(tabName) {
    if(this.selectedTab != tabName){
      this.itemPerPage = 10;
      this.searchText = '';
      this.filters = undefined
      this.isFilterCleared = true;
      if (tabName === 'History') {
        this.history = true;
        this.isChange = false;
      } else if (tabName === 'All Individual') {

        this.tableConfig.columnList = this.getAllindividualColumns()
        // this.tableConfig.columnList = [...this.tableConfig.columnList];
      
        this.fetchAllIndividualList({ page: 1, limit: 10, status:'all' });
      } else if (tabName?.toLowerCase() === IndividualInvoiceTabEnum?.InProgress) {
        this.tableConfig.columnList = this.getAllindividualColumns()
        this.fetchAllIndividualList({ page: 1, limit: 10, status:'in_progress' });
      }else {

        this.tableConfig.columnList = this.getinvoiceColumns()
        // this.tableConfig.columnList = [...this.tableConfig.columnList];
        this.fetchInvoiceList({ page: 1, limit: 10 });
      }
      if(this.is_tax_hidden){
        let index= this.tableConfig.columnList.findIndex((element: any) => element.name =="totExp")
        if(index !==-1) {
            this.tableConfig.columnList.splice(index,1)
        }
      }
      this.fetchInvoiceCount();
      this.hideColumnForAMFProgram();
    }
    this.selectedTab = tabName;
    this.tableConfig.allowMultiselect = (this.selectedTab == "Pending Consolidation") ? false :  this.authorizationService.authorize('create_consolidate_invoice');
    this.tableConfig.isCheckboxOption = (this.selectedTab == "Pending Consolidation" && this.isConsolidateInvoicePermission) ? true : false;
  }


  hideColumnForAMFProgram(){
    this.isHiddenColumns.forEach((columnName) => {
      let index = this.tableConfig.columnList.findIndex((element: any) => element.name.toLowerCase() === columnName.toLowerCase())
      if(index !== -1){
        this.tableConfig.columnList.splice(index,1)
      }
      index = this.tableConfig.columnList.findIndex((element: any) => element.name.toLowerCase() === columnName.toLowerCase())
      if(index !== -1){
        this.tableConfig.columnList.splice(index,1)
      }
    });
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) {
      return a?.toUpperCase();
    });
  }

  onClickView(event) {
    this.router.navigate([
      `/invoice/invoice-details/${event?.invoice_uuid}`,
    ]);
  }
  downloadInvoiceReport() {
    this._downloadReportService.downloadInvoiceListReportAsExcel().subscribe(
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
    );
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
  showTooltip(val) {
    if(this.currentProgram?.config?.accuracy_config){
      return this.accuracyPipe?.transform(val, this.accuracyEnum.RATE);
    } else{
      return this.accuracyPipe?.transform(val, this.accuracyEnum.RATE, {  digitInfo: this.viewCurrencyStrict});
    }  
  }

  fetchHierarchyList(hierarchy, flag) {
    if(flag) {
      this.hierarchyList?.push({
        value: hierarchy?.id,
        name: hierarchy?.name
      });
    } else {
      flag = true;
    }
  
    if(Array(hierarchy?.hierarchies)?.length === 0)
      return;
  
    hierarchy?.hierarchies?.forEach(item => {
      this.fetchHierarchyList(item, true);
    });
  }
  
  hierarchyMapper(hierarchy: any) {
    if(!hierarchy) {
      return;
    }

    const { name, id, hierarchies } = hierarchy;
    if(name && id) {
      this.hierarchyMap.set(id, name);
    }

    if(Array.isArray(hierarchies)) {
      hierarchies.forEach((entry: any) => {
        this.hierarchyMapper(entry);
      });
    }
  }

  getCurrencies() {
    if(this.currentProgram?.config?.billing?.supported_currencies?.length > 0) {
      const currencies = this.currentProgram?.config?.billing?.supported_currencies;
      currencies?.forEach((currency: any) => {
        this.currencies.push( {
          name : currency,
          value : currency
        });
      })
    }
  }
}