import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { EventStreamService, Events, EmitEvent } from '../../../core/services/event-stream.service';
import { VMSConfig } from '../../../library/smartTable/table/table.model';
import { ExpensesListService } from './expenses-list.service';
import { IExpensesItem, IExpensesData, IExpensesVmsData, IExpensesTab } from './expenses-list-interfaces';
import { ExpenseRoutes, ExpenseType, NavigationPaths, UserType,ExpenseNames } from '../../enums/expense.enums';
import { Subscription } from 'rxjs';
import { ExpenseService } from '../../expense.service';
import { WorkerModel } from '../../models/woker.model';
import {
  ExpenseClientTableModel,
  ExpenseWorkerTableModel,
  ExpenseVendorTableModel,
  ExpenseMiscTableModel,
  TableTabsModel,
  ExpenseMiscClientTableModel,
  ExpenseMspTableModel,
  ExpenseMiscMspTableModel
} from './expenses-list-table-model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ExpenseStatusService } from '../../services/expense-status.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DownloadReportService } from 'src/app/reports/components/download-report/download-report.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-expenses-list',
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.scss'],
  providers: [ExpensesListService]
})

export class ExpensesListComponent implements OnInit, OnDestroy {
  subHeaderActionButtons= [
    { name: '', title: 'Bulk Approval', icon: '',  disabled: true },
  ];
  public isAllRecordsSelected: boolean  = false;
  public selectedExpenseCount: number = 0;
  public selectedRecords: any;
  public selectedexpenseIds:any = [];
  public selectedexpense: any = [];
  public excludeExpenseIds = [];
  public selectPageData: boolean = false;
  public searchTerm: any;
  @ViewChild('timesheetTableRef') timesheetTableRef;

  public availableCountForSelect = 0;
  private subscription: Subscription;
  public expensesTabsCount: number[];
  public currentTabName: string;
  public expenseRoute: string;
  public statusParam: string;
  public vmsData: IExpensesVmsData[];
  public totalRecords: number;
  public limitRecords: number;
  public tableConfig: VMSConfig;
  public dataLoader: boolean;
  public userRole: string;

  private selectedExpenses = [];
  private hasApprovePermission = false;
  public sortObj:any;
  public is_expense_enabled = true;
  logs: Log = undefined;
  public isWorker = false;
  constructor(
    private service: ExpensesListService,
    private eventStream: EventStreamService,
    private expenseService: ExpenseService,
    private confirmService: ConfirmationDialogService,
    private loaderService: LoaderService,
    private expenseStatusService: ExpenseStatusService,
    private router: Router,
    private location: Location,
    private alertService: AlertService,
    private authorizationService: AuthorizationService,
    private storageService: StorageService,
    private localDatePipe: LocalDateFormatPipe,
    private _downloadReportService: DownloadReportService

  ) {
    this.vmsData = [];
    this.totalRecords = 0;
    this.limitRecords = 10;
    this.tableConfig = {} as VMSConfig;
    this.expenseRoute = this.service.getExpenseRoute();
    this.statusParam = this.service.getRouteParam('status') || TableTabsModel?.all?.filter;
    this.currentTabName = TableTabsModel[this.statusParam]?.name;
    this.dataLoader = false;
  }

  ngOnInit() {
    this.expenseService.init();
    this.hasApprovePermission = this.authorizationService.authorize('approve_expense');
    this.setTableConfig();
    this.getExpenseListCount();
    this.subscription = this.service.listResponse$.subscribe((data: IExpensesData) => {
      this.dataLoader = false;
      this.isShowCheckBox(data);
      this.setVmsData(data?.expenses || []);
      setTimeout(() => {
        this.validateExpenseList();
      },1);
      this.totalRecords = data?.total_records;
      this.updateColumn();
      
    });
    this.setHttpParams({ limit: this.limitRecords, page: 1, status: this.statusParam });
    this.eventStream.on(Events.SHOW_EXPENSE_LOGS).subscribe((data:any) => {
      this.logs = data
    });
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.isWorker = user?.is_candidate;
    if (this.isWorker) {
      this.loadAllWorkers();
    }
  }

  loadAllWorkers() {
    let route = this.expenseRoute?.toLowerCase() == ExpenseRoutes?.General?.toLowerCase() ? ExpenseType?.Expense: ExpenseType?.MiscExpense
    this.expenseService.getWorkersList('',route).pipe(
      map((res:any) => res?.data?.worker.filter((worker: WorkerModel) => (worker?.user?.name || worker?.candidate?.name)))
    ).subscribe({next:(value:any) => {
      if (this.isWorker && value?.length > 0) {
        this.getAssignments(value[0].worker_id);
      }
    }, error: (err) => {
    }});
  }

  getExpenseListCount(){
    this.service.getExpenseListCount().subscribe((res:any)=>{
      this.setTabsCount(res?.data || []);
    })
  }
  public getAssignments(workerId): void {
    let route = this.expenseRoute?.toLowerCase() == ExpenseRoutes?.General?.toLowerCase() ? ExpenseType?.Expense: ExpenseType?.MiscExpense
    let expenseType = this.expenseRoute?.toLowerCase() == ExpenseRoutes?.General?.toLowerCase() ? ExpenseNames?.Expense: ExpenseNames?.MiscExpense;
    this.expenseService.getWorkerAssignment(workerId,route).pipe(
      map((res:any) => res.data)
    ).subscribe({next:(value:any) => {
      if(!value || value?.length == 0){
        this.is_expense_enabled = false;
        this.logs = { type: LOG_TYPE?.WARNING, heading: `User doesn’t have access to the ${expenseType} Expense module.`,  isShown: true, hideClose: true };
      }
    },error: err => {
      this.showError(err);
    }});
  }

  updateColumn(){
    if (UserType.MSP === this.userRole || UserType.Vendor === this.userRole  || UserType.Client === this.userRole || UserType.Super_org === this.userRole) {
      if (this.currentTabName === 'Approved Expenses') {
        const isApproved = this.vmsData?.some(expense => expense?.expense_status == 'Approved');
        if (isApproved) {
          this.tableConfig.isDownloadButton = true;
          this.tableConfig.downloadOptions = { csvOption: true, excelOption: false, pdfOption: false } //new flag
        }
      } else {
        this.tableConfig.isDownloadButton = false;
        this.tableConfig.downloadOptions = { csvOption: false, excelOption: false, pdfOption: false }
      }
    }

    if (this.currentTabName === 'Approved Expenses' || this.currentTabName === 'All Expenses') {
      let found = false;
      for (let i = 0; i < this.tableConfig.columnList?.length; i++) {
        if (this.tableConfig.columnList[i].name == 'invoice_number') {
          found = true;
          break;
        }
      }
      if (!found) {
        this.tableConfig.columnList.push(
          { name: 'invoice_number', title: 'Consolidated Invoice ID', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'consolidate_date', title: 'Date of consolidation', isIcon: false, isImage: false, isContact: false, isNumberBadge: false })
      }
    } else {
      let indx;
      this.tableConfig?.columnList?.some(m => {
        if (m?.name === 'invoice_number') {
          indx = this.tableConfig?.columnList?.indexOf(m)
        }
      })
      let found = false;
      for (let i = 0; i < this.tableConfig.columnList?.length; i++) {
        if (this.tableConfig.columnList[i].name == 'invoice_number') {
          found = true;
          break;
        }
      }
      if (found && indx !== -1) {
        this.tableConfig?.columnList?.splice(indx, (this.tableConfig?.columnList?.length - indx))
      }
    }
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.expenseStatusService.unsubscribe();
  }

  setTabsCount(tabs: IExpensesTab[]) {
    const tabIndex = this.tableConfig?.tabsList?.findIndex((e) => e?.toLowerCase() === 'in progress expenses');
    if (tabIndex === -1) {
      this.tableConfig?.tabsList?.push('In Progress Expenses');
    }
    this.expensesTabsCount = this.tableConfig.tabsList.map((name: string) => {
      // Bulk
      const bulkPendingEntry = tabs?.find(entry => entry?.title === 'bulk-pending');
      this.availableCountForSelect = bulkPendingEntry ? bulkPendingEntry?.count : 0;
      const inProgress = tabs?.find(entry => entry?.title?.toLowerCase() === 'in progress');
      if (inProgress?.count === 0) {
        const tabIndex = this.tableConfig?.tabsList?.findIndex((e) => e?.toLowerCase() === 'in progress expenses');
        if (tabIndex !== -1) {
          this.tableConfig?.tabsList.splice(tabIndex, 1);
        }
      }
      // End
      const key = Object.keys(TableTabsModel).find(
        (tab: string) => TableTabsModel[tab].name === name);
      const index = tabs.findIndex((tab: IExpensesTab) => tab.filter === key);
      return index > -1 ? tabs[index].count : 0;
    });
  }

  setTableConfig() {
    const userRole: string = this.service.currentUserRole();
    this.userRole = userRole;
    const user = this.storageService.get('user');
    const isWorker = user?.is_candidate;
    const isAdmin = user?.is_superuser;
    if (ExpenseRoutes.General === this.expenseRoute) {
      if (isWorker) {
        this.tableConfig = ExpenseWorkerTableModel;
      } else if (UserType.Vendor === userRole || isAdmin) {
        this.tableConfig = ExpenseVendorTableModel;
      } else if (UserType.MSP === userRole) {
        this.tableConfig = ExpenseMspTableModel;
      } else {
        this.tableConfig = ExpenseClientTableModel;
      }
    } else {
      if (isWorker || UserType.Vendor === userRole || isAdmin) {
        this.tableConfig = ExpenseMiscTableModel;
      } else if (UserType.MSP === userRole) {
        this.tableConfig = ExpenseMiscMspTableModel;
      } else {
        this.tableConfig = ExpenseMiscClientTableModel;
      }
    }
    this.tableConfig.isCheckboxOption = false;
  }

  setVmsData(items: IExpensesItem[]) {
    this.vmsData = items.map((item: IExpensesItem) => {
      return {
        expense_id: item.expense_id,
        worker_id: item.worker_id,
        // worker_name: item.worker.name,
        worker_name: this.createNotificationObject(item?.worker?.name, item?.actions?.mass_approval, 'worker_name'),
        vendor_name: item.vendor_organization.name,
        // expense_code: item.expense_code,
        expense_code: this.createNotificationObject(item?.expense_code, item?.actions?.mass_approval, 'expense_code'),
        expense_type: item.expense_type,
        expense_status: item.expense_status,
        submitted_date: item.submitted_date || null,
        week_end_date: this.localDatePipe.transform(item?.week_end_date ,'','','',true )|| null,
        expense_approved_date: item.approved_reject_date || null,
        expense_period:
        item.expense_start_date || item.expense_end_date
          ? `${this.localDatePipe.transform(item.expense_start_date,'','','',true )} to ${this.localDatePipe.transform(item.expense_end_date,'','','',true )}`
          : null,
        hierarchy_title: item.hierarchy.title,
        items: item.total_expense_items.toString(),
        expense_manager_name: item.expense_manager.name,
        total_billable_amount: { amount: +this.showAmountByUserRole(item?.calculation), currency: item.currency || '₹' },
        assignment_title: item.assignment.title + (item.assignment.code ? `(${item.assignment.code})` : ''),
        assignment_id: item.assignment.id,
        invoice_number: item.invoice_number,
        consolidate_date: item.consolidate_date || null,
        manager: item.expense_manager,
        disableCheckbox: (item?.actions?.mass_approval && !item?.actions?.mass_approval?.can_process) || false,
        tooltip: item?.actions?.mass_approval?.reason || '',
      } as IExpensesVmsData;
    });


  }

  createNotificationObject(value: any, massApprovalAction: any, column) {
    return (this.tableConfig?.isCheckboxOption && massApprovalAction && (column === this.tableConfig?.columnList?.[0]?.name)) ? {
      name: value,
      hasNotification: massApprovalAction && !massApprovalAction?.can_process,
      do_not_re_hire: massApprovalAction && !massApprovalAction?.can_process,
      pendingRequestType: massApprovalAction?.reason || '',
      icon: 'info',
      tooltipPlacement: 'right'
    } : value;
  }
  
  showAmountByUserRole(calculation) {
    const userRole: string = this.service.currentUserRole();
    this.userRole = userRole;
    let amount = undefined;
    if (UserType.Vendor === userRole) {
      amount = calculation?.vendor_amount_with_tax;
    } else {
      amount = calculation?.total_amount;
    }
    return amount;
  }

  setHttpParams(params: object) {
    Object.keys(params).forEach((key: string) => {
      if (key === 'status' && params[key] === TableTabsModel.all.filter) {
        this.service.httpParamsItem[key] = null;
      } else {
        this.service.httpParamsItem[key] = params[key];
      }
    });
    this.dataLoader = true;
    this.service.getExpenseList();
  }

  onPaginationClick(pageNo: number) {
    const params = { page: pageNo };
    this.setHttpParams(params);
  }

  setExpenseType() {
    const expenseType = this.expenseRoute === ExpenseRoutes.General
      ? { value: ExpenseType.Expense, name: 'General Expense' }
      : { value: ExpenseType.MiscExpense, name: 'Miscellaneous Expense' };
    this.expenseService.setExpenseType(expenseType);
    return expenseType;
  }

  onCreateClick(event) {
    if (event) {
      this.setExpenseType();
      this.eventStream.emit(new EmitEvent(Events.EXPENSE_ASSIGNMENT,{ 
          visibility: true, 
          expenseType:(this.expenseRoute === ExpenseRoutes.General ? ExpenseRoutes.General : ExpenseRoutes.Misc)  
        }));
    }
  }

  onClickView(item: IExpensesVmsData) {
    this.setExpenseType();
    this.router.navigateByUrl(NavigationPaths.user.generalListItemDetails(item.expense_id));
  }

  public onDownloadClick(value): void {
    this.logs = undefined;
    let expenseType = this.expenseRoute === ExpenseRoutes.General ? value = 'general-expense' : value = 'misc-expense';
    this._downloadReportService.downloadExpenseApprovedReport(expenseType).subscribe({next:(res:any) => {
      if (res && res?.data) {
        let downloadLink = res.data.link;
        window.open(downloadLink, '_parent');
        this.alertService.success('Report Downloaded Successful!');
      }
    }, error: (err) => {
        this.showError('Something went wrong with Download Report!');
      },
  });
  }

  onSearch(searchText: string) {
    this.searchTerm = searchText;
    const params = { page: 1, search: searchText };
    this.setHttpParams(params);
  }
  onSortClick(event) {
    if (!!event) {
      if(event.name == 'total_billable_amount') {
        event.name = 'total_amount';
      }
      this.sortObj = event;
      this.setHttpParams({ limit: this.limitRecords, page: 1, order_by: event.order.toLowerCase(), key:  event.name});
    }
  }
  onTabClick(tabName: string) {
    if (this.currentTabName !== tabName) {
      this.currentTabName = tabName; 
      this.updateColumn();
      const filter = Object.keys(TableTabsModel).find(
        (key: string) => TableTabsModel[key].name === this.currentTabName) || TableTabsModel.all.filter;
      const params = { page: 1, status: filter };
      this.location.replaceState(`${ExpenseRoutes.Root}/${this.expenseRoute}/${filter}`);
      this.setHttpParams(params);
    }
    // Commented due to backed Dependancy 
    // this.tableConfig.isCheckboxOption = this.hasApprovePermission && tabName === TableTabsModel.submitted.name;
  }

  onChangeRecords(records: number) {
    this.limitRecords = records || 10;
    this.setHttpParams({ limit: this.limitRecords, page: 1 });
  }

  onDeleteClick(event: any) {
    if (event) {
      if (event.expense_id && event.expense_status) {
        this.service.deleteExpenseById(event.expense_id, event.expense_status.toLowerCase());
      }
    }
  }

  private toogleSubmitButton() {
    this.tableConfig.isSelectSubmitButton = this.selectedExpenses.length > 0;
  }

  public onMassApproval(event: any) {
    const selectedData = this.selectedExpenses.filter(({ isChecked }) => isChecked).map(({ expense_id }) => {return {entity_id: expense_id, status: 'APPROVED' }});
    const selectedIds = this.selectedExpenses.filter(({ isChecked }) => isChecked).map(({ expense_id }) => expense_id);
    this.confirmService.confirm('', `Are you sure you want to approve selected expenses ? `, 'Yes', 'No').then(confirmed => {
      if (confirmed) {
        this.loaderService.show();
        const expenseType = this.setExpenseType();
        this.expenseStatusService.updateMassApproval(expenseType, selectedData).subscribe({next:() => {
          this.loaderService.hide();
          this.vmsData = [...this.vmsData].filter(({ expense_id }) => !selectedIds.includes(expense_id));
          this.selectedExpenses = [];
          this.toogleSubmitButton();
          this.alertService.success(
            expenseType.name.charAt(0).toUpperCase() + expenseType.name.slice(1) + 's approved successfully'
          );
        },error: (err) => {
          this.loaderService.hide();
          this.showError(err);
        }});
        this.expensesTabsCount[1] = +this.expensesTabsCount[1] - selectedIds.length;
        this.expensesTabsCount[2] = +this.expensesTabsCount[2] + selectedIds.length;
      } else {
        this.selectedExpenses = [];
        this.toogleSubmitButton();
      }
    });
  }

  // public selectAllClicked(event) {
  //   if (event) {
  //     this.selectedExpenses = event.selected;
  //     this.toogleSubmitButton();
  //   }
  // }

  onselectAllClick(event) {
    if (event?.selected?.filter((val) => !val?.disableCheckbox && val?.isChecked === false).length == this.vmsData?.filter(x => !x?.disableCheckbox).length) {
      let expenseIds = event?.selected?.filter(x => this.selectedexpense?.includes(x.expense_id));
      expenseIds?.forEach((id) => this.selectedexpense?.splice(id, 1));
      let allExpenseIds = event?.selected?.filter(t => !t.disableCheckbox)?.map(x => x?.expense_id);
      allExpenseIds?.forEach((ExpenseIds) => {
        if (this.isAllRecordsSelected) {
          if (this.excludeExpenseIds?.indexOf(ExpenseIds) === -1) {
            this.excludeExpenseIds = [...this.excludeExpenseIds, ExpenseIds];
          }
        }
        this.selectedexpense?.splice(this.selectedexpense?.findIndex(ts => ts?.expense_id == ExpenseIds), 1);
        this.selectedexpenseIds?.splice(ExpenseIds, 1)
      })
      this.selectedExpenseCount = event?.selected?.filter((val) => val?.isChecked === true)?.length;
    }
    else {
      if (typeof (event?.selected[0]) === 'object') {
        let expenses = event?.selected.map(x => !x?.disableCheckbox  ? x : undefined).filter((val) => !!val);
        expenses?.forEach((expense) => {
          if (this.isAllRecordsSelected) {
            if (this.excludeExpenseIds?.indexOf(expense?.expense_id) === -1) {
              if (expense?.disableCheckbox === false && expense?.isChecked === false) {
                this.excludeExpenseIds = [...this.excludeExpenseIds, expense?.expense_id];
              }
            } else {
              this.excludeExpenseIds?.splice(this.excludeExpenseIds?.indexOf(expense?.expense_id), 1);
            }
          }
          if (this.selectedexpense?.findIndex(selected=> selected?.expense_id === expense?.expense_id) === -1) {
            this.selectedexpense = [...this.selectedexpense, expense];
            this.selectedexpense = [...new Map(this.selectedexpense?.map((item) => [item["expense_id"], item])).values()]; // to take unique
            this.selectedexpenseIds = [...this.selectedexpense?.map(ts=> ts?.expense_id)];
          } else {
            if (event?.selected?.filter((val) => val?.isChecked).length > this.limitRecords) {
              this.selectedexpense?.splice(this.selectedexpense?.findIndex(ts => ts?.expense_id == expense?.expense_id), 1);
              this.selectedexpenseIds?.splice(this.selectedexpenseIds?.indexOf(expense?.expense_id), 1);
            }
          }
        })
      }
      else {
        this.selectedexpenseIds = this.selectedexpenseIds?.filter(x => event?.selected?.includes(x));
        this.selectedexpense = this.selectedexpense?.filter(x => event?.selected?.includes(x?.expense_id) && x?.isChecked === true);
        this.excludeExpenseIds = [];
      }
      if (typeof (this.selectedexpense[0]) === 'object') {
        this.selectedExpenseCount = this.selectedexpense?.filter((val) => val?.isChecked === true)?.length;
      } else {
        this.selectedExpenseCount = this.selectedexpense?.length;
      }
    }
    this.isShowActionButtons();
  }



  // public selectClicked(event) {
  //   if (event) {
  //     const expenses = [...this.selectedExpenses];
  //     if (!event?.selected?.isChecked && expenses) {
  //       const item = expenses.filter((exp) => exp.expense_id === event.selected.expense_id);
  //       if (item) {
  //         expenses.splice(expenses.indexOf(event.selected), 1);
  //       } 
  //       // else {
  //       //   expenses.push(item);
  //       // }
  //     } else {
  //       expenses.push(event.selected);
  //     }
  //     this.selectedExpenses = expenses;
  //     this.toogleSubmitButton();
  //   }
  // }

  selectClicked(data) {
    const expenseArr = [...this.selectedexpense];
    this.selectedExpenseCount = data?.selected?.isChecked ? this.selectedExpenseCount + 1 : this.selectedExpenseCount - 1;
    if (!data?.selected?.isChecked && expenseArr) {
      const item = expenseArr?.filter((s) => s?.expense_id === data?.selected?.expense_id);
      if (item) {
        expenseArr?.splice(expenseArr?.findIndex(expense => expense?.expense_id === data?.selected?.expense_id), 1);
        if (this.isAllRecordsSelected) {
          if (this.excludeExpenseIds?.findIndex(exId=> exId === data?.selected?.expense_id) === -1) {
            this.excludeExpenseIds = [...this.excludeExpenseIds, data?.selected?.expense_id];
          }
      }} else {
        expenseArr.push(item);
        this.selectedexpense = expenseArr;
      }
        } else {
      expenseArr?.push(data?.selected);
      this.selectedexpense = expenseArr;
      if (this.isAllRecordsSelected)
      {
        this.excludeExpenseIds?.splice(this.excludeExpenseIds?.findIndex(exId=> exId === data?.selected?.expense_id), 1);
      }
    }
    this.selectedexpense = expenseArr;
    if (this.selectedexpense?.length > 0) {
      this.tableConfig.isSelectSubmitButton = false;
    } else {
      this.tableConfig.isSelectSubmitButton = false;
    }
    this.selectedexpenseIds = [...this.selectedexpense.map(ts=> ts?.expense_id)];
    this.isShowActionButtons();
  }

  public viewSidePanel(ev) {
    if (this.authorizationService.authorize('view_assignment')) {
      this.eventStream.emit(new EmitEvent(Events.VIEW_ASSIGNMENT_TIMESHEET, { value: true, data: ev }));
    }
  }
  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  // bulk Approval
  selectedRecord(event){
    this.isAllRecordsSelected = event;
    this.selectedRecords = event;
    this.selectedExpenseCount = event;
    this.isShowActionButtons();
  }

  onAllRecordsSelected(event){
    this.isAllRecordsSelected = event;
    this.isShowActionButtons();
  }

  isShowCheckBox(data) {
    const expenseCodeColumn = this.tableConfig.columnList.find(column => column?.name === this.tableConfig?.columnList?.[0]?.name);
    if (data?.actions_allow?.bulk_approval?.is_allow === true) {
      this.updateColumnProperties(expenseCodeColumn, true);
      this.tableConfig.isCheckboxOption = true;
      this.tableConfig.selectAllRecordsFromBar = true;
      this.isShowActionButtons();
    } else {
      this.updateColumnProperties(expenseCodeColumn, false);
      this.tableConfig.isCheckboxOption = false;
    }
  }
  
  updateColumnProperties(column, isBulkApprovalAllowed) {
    if (column) {
      column.isPending = isBulkApprovalAllowed;
      column.isDoNotRehire = isBulkApprovalAllowed;
      column.toolTipVisibility = !isBulkApprovalAllowed;
    }
  }

  isShowActionButtons() {
    if(this.isAllRecordsSelected || this.selectedexpense?.length > 1){
    this.tableConfig.subHeaderActionButtons = this.subHeaderActionButtons;
    } else {
      this.tableConfig.subHeaderActionButtons = []
    }
  }

  validateExpenseList() {
    this.vmsData?.forEach((item:any) => {
      let count = 0;
      this.selectedexpenseIds?.forEach((expense_uuid) => {
          if (item?.expense_id === expense_uuid) {
            item.isChecked = true;
            count = count + 1;
          } else if (this.selectedexpenseIds?.length) {
            this.selectedexpenseIds?.forEach((expense_uuid) => {
                if (item?.expense_id === expense_uuid) {
                  if(!item?.disableCheckbox){
                    item.isChecked = true;
                  }
                }
            });
          }
      })
    });

    if (this.selectedRecords) {
      let count = this.selectedRecords - ((this.totalRecords - 1) * this.limitRecords)
      if (this.selectPageData) count = this.limitRecords;
      // if(this.selectedAllRecordsPage !== this.pageNo && this.selectPageData) return;
      this.vmsData?.forEach((item: any, ind) => {
        if (this.excludeExpenseIds?.length) {
          let expenseCount = 0;
          this.excludeExpenseIds?.forEach((id, ind) => {
            if (id === item?.expense_id) {
              expenseCount = expenseCount + 1;
            }
            if (!expenseCount && (ind + 1) === this.excludeExpenseIds?.length) {
              if (!item?.disableCheckbox) {
                item.isChecked = true;
              }
            } else {
              item.isChecked = false;
            }
          })
        } else if ((ind < count) || (this.isAllRecordsSelected && this.excludeExpenseIds?.length === 0)) {
          if (!item?.disableCheckbox) {
            item.isChecked = true;
          }
        }
      });
    } else if (this.selectedexpenseIds?.length) {
      this.selectedexpenseIds?.forEach((expense_uuid) => {
        this.vmsData?.forEach((item: any) => {
          if (item?.expense_id === expense_uuid) {
            if (!item?.disableCheckbox) {
              item.isChecked = true;
            }
          }
        });
      });
    }

    if (this.selectedRecords && this.isAllRecordsSelected && this.excludeExpenseIds) {
      this.excludeExpenseIds?.forEach((expense) => {
        this.vmsData?.forEach((item: any) => {
          if (item?.expense_id === expense) {
            item.isChecked = false;
          }
        });
      });
    }
    this.isShowActionButtons()
  }

  bulkApproval(value) {
    let payload = {
      "action": "APPROVED",
      "process": this.isAllRecordsSelected ? 'all' : 'uuids',
      "search": this.searchTerm || null,
      "filter": null,
      "expense_uuids": [],
      "exclude_expense_uuids": [],
      "expense_type": this.setExpenseType()?.value,
    }
    if (this.isAllRecordsSelected) {
      payload.exclude_expense_uuids = this.excludeExpenseIds;
      delete payload?.expense_uuids;
    } else {
      if (this.selectedexpense?.length) {
        let data: any = this.selectedexpense?.map(data => data?.expense_id || data);
        const expense_uuids = Array?.from(new Set(data?.map(a => a))).map(id => {
          return data?.find(a => a === id)
        })
        payload.expense_uuids = expense_uuids;
      }
      delete payload?.exclude_expense_uuids;
    }
    // this.confirmService.confirm('', `Are you sure you want to proceed with bulk approval for the ${this.setExpenseType()?.name}(s)?`,
    this.confirmService.confirm('', `Are you sure you want to proceed with bulk approval for these expenses?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          const expenseType = this.setExpenseType();
          this.expenseStatusService.bulkApproval(payload).subscribe((data:any) => {
            if (data) {
              this.loaderService.hide();
              this.alertService.success(data?.message);
              this.router.navigateByUrl('/RefreshComponent', { skipLocationChange: true }).then(() => {
                const type = this.expenseRoute === ExpenseRoutes?.General ? ExpenseRoutes?.General : ExpenseRoutes?.Misc;
                this.router.navigate([`expense/${type}/in_progress`]);
              });
            }
          },
            (err) => {
              this.loaderService.hide();
              if (err?.error?.error) {
                this.showError(err);
              } else {
                this.showError(err);
              }
              // this.resetSelectedExpenses();
            });
        } else {
          // this.resetSelectedTimesheets();
        }
      })
      .catch(() => {

      });
  }

  resetSelectedExpenses() {
    this.getExpenseListCount();
    this.subscription = this.service.listResponse$.subscribe((data: IExpensesData) => {
      this.dataLoader = false;
      this.isShowCheckBox(data);
      this.setVmsData(data?.expenses || []);
      setTimeout(() => {
        this.validateExpenseList();
      },1);
      this.totalRecords = data?.total_records;
      this.updateColumn();
    });
    this.resetData();
  }
  resetData() {
    this.tableConfig.isSelectSubmitButton = false;
    this.selectedexpense = [];
    this.selectedexpenseIds = [];
    this.excludeExpenseIds = [];
    this.searchTerm = null;
    this.timesheetTableRef?.resetTimesheetCheckboxes();
  }

  // end
}
