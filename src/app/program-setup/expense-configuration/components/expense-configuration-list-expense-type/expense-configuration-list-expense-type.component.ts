import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { VMSConfig } from '../../../../library/table/table/table.model';
import { EmitEvent, Events, EventStreamService } from '../../../../core/services/event-stream.service';
import { ExpenseConfigurationListExpenseTypeService } from '../../services/expense-configuration-list-expense-type.service';
import { IExpensesItem, IExpensesItemsListResponse, IExpensesItemVmsData } from '../../models/expense-items-model';
import { ExpenseConfigurationItemDetailsTabsModel } from '../../models/expense-configuration-list-expense-type-table-model';
import { Subscription } from 'rxjs';
import { IExpensesHistoryItemsListResponse } from '../../models/expense-history-items-model';
import { AddExpenseTypeService } from '../../services/add-expense-type.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-expense-configuration-list-expense-type',
  templateUrl: './expense-configuration-list-expense-type.component.html',
  styleUrls: ['./expense-configuration-list-expense-type.component.scss']
})
export class ExpenseConfigurationListExpenseTypeComponent implements OnInit, OnDestroy, AfterContentChecked {
  public tabIndex = 0;
  public currentPageHistory = 1;
  public perPageHistory = 10;
  public selectedFilter: string;
  private subscription: Subscription;
  public vmsData: IExpensesItemVmsData[] = [];
  public historyData: IExpensesHistoryItemsListResponse;
  public isLoading: boolean;
  public isOpenEditExpenseType = false;
  public programId: string;
  @Input() configId: string;
  logs: Log = undefined;
  constructor(private eventStream: EventStreamService,
              private ref: ChangeDetectorRef,
              private service: ExpenseConfigurationListExpenseTypeService,
              private eventStreamService: EventStreamService,
              private addExpenseTypeService: AddExpenseTypeService,
              private storageService: StorageService,
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM).id;
    this.eventStream.on(Events.FETCH_CONFIGURATION_LIST_EXPENSE_TYPE).subscribe( (data: IExpensesItem) => {
      if (this.configId) {
        this.getListExpenseItems(this.selectedFilter);
      }
    });
    this.eventStream.on(Events.SHOW_EXPENSE_LOGS).subscribe((data:any) => {
      this.logs = data
    });

  }

  ngAfterContentChecked() {
    this.ref.detectChanges();
  }
  public onEditClick(event: IExpensesItemVmsData) {
    this.toggleOpenEditExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, { itemId: event.id, mode: 'edit' }));
    });
  }

  public onViewClick(event: IExpensesItemVmsData) {
    this.toggleOpenEditExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, { itemId: event.id, mode: 'view' }));
    });
  }

  public getListExpenseItems(type: string): void {
    this.selectedFilter = type;
    this.isLoading = true;
    this.service.getListExpenseItems(type, this.configId, this.programId)
      .subscribe((response: IExpensesItemsListResponse) => {
        this.setVmsData(response?.data?.expenseItems || []);
        this.isLoading = false;
      }, error => {
        this.isLoading = false;
      });
  }

  public getHistoryListExpenseItems(page: number, perPage: number): void {
    this.isLoading = true;
    this.service.getHistoryListExpenseItems(page, perPage, this.configId, this.programId)
      .subscribe((response: IExpensesHistoryItemsListResponse) => {
        this.historyData = response;
        this.isLoading = false;
      }, error => {
        this.isLoading = false;
      });
  }

  public onIndexChange(event) {
    if (this.configId) {
      switch (event) {
        case 0:
          this.getListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.generalExpenses.filter);
          break;
        case 1:
          this.getListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.miscellaneousExpenses.filter);
          break;
        case 2:
          this.getHistoryListExpenseItems(this.currentPageHistory, this.perPageHistory);
          break;
      }
    }
  }

  public get expenseConfigurationItemDetailsTableConfig(): VMSConfig {
    return this.service.expenseConfigurationItemDetailsTableConfig;
  }
  public get expenseConfigurationItemDetailsTabsModel(): any {
    return this.service.expenseConfigurationItemDetailsTabsModel;
  }

  public setVmsData(items: IExpensesItem[]) {
    this.vmsData = items.map((item: IExpensesItem) => {
      // const createdAtDate = this.localDatePipe.transform((item.created_at), 'DD MMM yyyy hh:mm:ss a z');
      return {
        id: item.expense_item_id,
        code: item.expense_code,
        expense_name: item.expense_name,
        icon: item.expense_icon ? item.expense_icon : null,
        // created_at: item.created_by.name ? `By ${item.created_by.name} on` : '' + ` ${createdAtDate}`,
        is_enabled: item.status === 'active',
      } as IExpensesItemVmsData;
    });
  }

  public toggleOpenEditExpenseType(): void {
    this.isOpenEditExpenseType = !this.isOpenEditExpenseType;
  }
  public changePage(event) {
    this.currentPageHistory = event;
    this.getHistoryListExpenseItems(this.currentPageHistory, this.perPageHistory);
  }

  public changePerPage(event) {
    this.currentPageHistory = 1;
    this.perPageHistory = event;
    this.getHistoryListExpenseItems(this.currentPageHistory, this.perPageHistory);
  }

  public onDisableOrEnableClick(item: IExpensesItemVmsData) {
    const status = !item.is_enabled;
    this.addExpenseTypeService.addOrEditExpenseType(
      { status, expense_code: item.code, expense_name: item.expense_name },
      this.programId,
      item.id
    ).subscribe((res:any) => {
      if (res.status === 201) {
        this.eventStreamService.emit(new EmitEvent(Events.FETCH_CONFIGURATION_LIST_EXPENSE_TYPE, res.data));
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }


}
