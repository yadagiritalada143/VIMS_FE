import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { HttpService } from '../../../core/services/http.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { IExpensesData, IExpensesDataMessage, IExpensesResponse } from './expenses-list-interfaces';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute } from '@angular/router';
import { ExpenseRoutes, ExpenseStatusMessage } from '../../enums/expense.enums';
import { UserPermissionService } from '../../services/user-permission.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service'
import { ExpenseStatusType } from '../../interfaces/expense.interfaces';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Injectable()
export class ExpensesListService {
    private programId: string;
    private path: string;
    private readonly expenseRoute: string;
    private readonly deletionStatuses: ExpenseStatusType [] = [ExpenseStatusMessage.draft];
    public listResponse$: Observable<IExpensesData>;
    private listObserver: any;
    public httpParamsItem: any;

    constructor(
        private http: HttpService,
        private storageService: StorageService,
        private alertService: AlertService,
        private userPermissionService: UserPermissionService,
        private confirmationService: ConfirmationDialogService,
        public route: ActivatedRoute,
        private eventStream: EventStreamService
    ) {
        this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM).id;
        this.expenseRoute = this.route?.routeConfig?.path?.split('/')[0];
        this.path = this.expenseRoute === ExpenseRoutes.General ?
            `/expense/programs/${this.programId}/general-expense` : `/expense/programs/${this.programId}/misc-expense`;
        this.httpParamsItem = {};
        this.listResponse$ = new Observable<IExpensesData>(observer => this.listObserver = observer).pipe(share());
    }

    public getExpenseList() {
        if(!this.programId) { 
            this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
            this.path = this.expenseRoute === ExpenseRoutes.General ? `/expense/programs/${this.programId}/general-expense` : `/expense/programs/${this.programId}/misc-expense`;
        }
        const params: HttpParams = this.getExpenseParams();
        const path = params ? `${this.path}?${params}` : this.path;
        this.http.get(path).subscribe(
            (response: IExpensesResponse) => {
                if (this.listObserver) {
                    this.listObserver.next(response.data as IExpensesData);
                }
            },
          err => {
            this.showError(err);
            }
        );
    }

    public getExpenseListCount() {
        this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
        if(this.expenseRoute === ExpenseRoutes.General){
            return this.http.get(`/expense/programs/${this.programId}/general-expense/count`);
        }else{
            return this.http.get(`/expense/programs/${this.programId}/misc-expense/count`);
        }
    }
    
    public deleteExpenseById(id: string, expenseStatus: ExpenseStatusType) {
        this.confirmationService.confirm('', 'Are you sure you want to delete current expense?', 'Delete', 'Cancel').then(confirmed => {
            if (confirmed) {
                if (this.isExpenseCanBeDeleted(expenseStatus)) {
                    this.http.delete(`/expense/programs/${this.programId}/expense/${id}`, {}).subscribe(
                        (response: IExpensesResponse) => {
                            const data = response.data as IExpensesDataMessage;
                            this.alertService.success(data.message);
                            this.getExpenseList();
                        },
                        err => {
                            this.showError(err);
                        }
                    )
                } else {
                    this.alertService.warn('Sorry, you can not delete this expense');
                }
            }
        });
    }

    private isExpenseCanBeDeleted(status: ExpenseStatusType) {
        return this.deletionStatuses.indexOf(status) === -1 ? false : true;
    }

    private getExpenseParams(): HttpParams {
        let params = new HttpParams();
        Object.keys(this.httpParamsItem).forEach((key) => {
            if (this.httpParamsItem[key]) {
                params = params.append(key, this.httpParamsItem[key]);
            } else {
                delete this.httpParamsItem[key];
            }
        });
        return params;
    }

    public currentUserRole(): string {
        return this.userPermissionService.currentUserRole();
    }

    public getExpenseRoute(): string {
        return this.expenseRoute;
    }

    public getRouteParam(param: string): string {
        return this.route.snapshot.params[param];
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_EXPENSE_LOGS, logs));
  }

}
