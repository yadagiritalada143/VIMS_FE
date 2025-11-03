import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { EmitEvent, EventStreamService, Events } from '../../../../core/services/event-stream.service';
import { HttpService } from '../../../../core/services/http.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import {
  IDisableOrEnableRequestPayload,
  IExpensesConfigurationListData,
  IExpensesConfigurationListResponse
} from './expense-configuration-list-interface';


@Injectable()
export class ExpenseConfigurationListService {
    private readonly programId: string;
    private readonly path: string;
    public dataLoader: boolean;
    public httpParamsItem: object;
    public listResponse$: Observable<IExpensesConfigurationListData>;
    private listObserver: any;

    constructor(
        private http: HttpService,
        private storageService: StorageService,
        private alertService: AlertService,
        public route: ActivatedRoute,
        private eventStream: EventStreamService

    ) {
        this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
        this.path = `/expense/programs/${this.programId}/config-expense`;
        this.dataLoader = false;
        this.httpParamsItem = {};
        this.listResponse$ = new Observable<any>(observer => this.listObserver = observer).pipe(share());
    }

    public getExpenseConfigurationList() {
        this.dataLoader = true;
        const params: HttpParams = this.getParams();
        const path = params ? `${this.path}?${params}` : this.path;
        this.http.get(path).subscribe(
            (response: IExpensesConfigurationListResponse) => {
                if (this.listObserver) {
                    this.dataLoader = false;
                    this.listObserver.next(response.data as IExpensesConfigurationListData);
                }
            },
            err => {
                this.dataLoader = false;
                this.alertService.error(errorHandler(err));
            }
        );
    }

    private getParams(): HttpParams {
        let params = new HttpParams();
        Object.keys(this.httpParamsItem).forEach((key) => {
            if (this.httpParamsItem[key] || typeof this.httpParamsItem[key] === 'boolean') {
                params = params.append(key, this.httpParamsItem[key]);
            } else {
                delete this.httpParamsItem[key];
            }
        });
        return params;
    }

    public delete(uuid: string) {
        const path = `/expense/programs/${this.programId}/config-expense/${uuid}`;
        this.http.delete(path).subscribe(
            (data: any) => {
                this.alertService.success(data.message);
                this.getExpenseConfigurationList();
            },
          err => {
            this.showError(err);
            }
        );
    }

    public disableOrEnable(uuid: string, payload: IDisableOrEnableRequestPayload) {
        const path: string = `/expense/programs/${this.programId}/config-status/${uuid}`;
        this.http.put(path, payload).subscribe(
            (res: any) => {
                this.alertService.success(res.data.message);
                this.getExpenseConfigurationList();
            },
          err => {
            this.showError(err);
            }
        );
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_EXPENSE_LOGS, logs));
  }
}
