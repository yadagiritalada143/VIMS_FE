import { Injectable } from '@angular/core';
import {VMSConfig} from '../../../library/table/table/table.model';
import {
  ExpenseConfigurationListExpenseTypeTableModel,
  ExpenseConfigurationItemDetailsTabsModel
} from '../models/expense-configuration-list-expense-type-table-model';
import {HttpService} from '../../../core/services/http.service';
import {IExpensesItemsListResponse} from '../models/expense-items-model';
import {Observable} from 'rxjs';
import {IExpensesHistoryItemsListResponse} from '../models/expense-history-items-model';


@Injectable({
  providedIn: 'root'
})
export class ExpenseConfigurationListExpenseTypeService {

  public readonly expenseConfigurationItemDetailsTableConfig: VMSConfig = ExpenseConfigurationListExpenseTypeTableModel;
  public readonly expenseConfigurationItemDetailsTabsModel = ExpenseConfigurationItemDetailsTabsModel;
  constructor(public http: HttpService) { }

  public getListExpenseItems(type: string, configId: string, programId: string): Observable<IExpensesItemsListResponse> | any {
    return <Observable<IExpensesItemsListResponse>> this.http.get(`/expense/programs/${programId}/config/${type ?? 'expense-items'}?config_uuid=${configId}`);
  }

  public getHistoryListExpenseItems(
    page: number,
    perPage: number,
    moduleId: string,
    programId: string
  ): Observable<IExpensesHistoryItemsListResponse> | any {
    return <Observable<IExpensesHistoryItemsListResponse>> this.http.get(
      `/expense/programs/${programId}/history?module=expense_config&limit=${perPage}&type=all&page=${page}&module_uuid=${moduleId}`
    );
  }

}


