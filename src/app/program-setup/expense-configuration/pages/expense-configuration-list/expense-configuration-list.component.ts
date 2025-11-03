import {Component, OnDestroy, OnInit} from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { Subscription } from 'rxjs';
import {
    IExpensesConfigurationListData,
    IExpensesConfigurationListItem,
    IExpensesConfigurationVmsData,
    IAdvanceFilterEmit,
    IDisableOrEnableRequestPayload,
    ConfigExpenseStatus
} from './expense-configuration-list-interface';
import { ExpenseConfigurationListService } from './expense-configuration-list.service';
import { ExpenseConfigurationTableModel } from './expense-configuration-table-model';
import { NavigationPaths } from '../../enums/expense-configuration.enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log } from 'src/app/library/logs/logs.model';
import { Events, EventStreamService } from '../../../../core/services/event-stream.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
    selector: 'app-expense-configuration-list',
    templateUrl: './expense-configuration-list.component.html',
    styleUrls: ['./expense-configuration-list.component.scss'],
    providers: [ExpenseConfigurationListService]
})

export class ExpenseConfigurationListComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    public tableConfig: VMSConfig;
    public vmsData: IExpensesConfigurationVmsData[];
    public totalRecords: number;
    public limitRecords: number;
    logs: Log = undefined;
    constructor(
        public service: ExpenseConfigurationListService,
        private router: SvmsRouterService,
        private localDatePipe: LocalDateFormatPipe,
        private accessControlService: AccessControlService,
        private eventStream: EventStreamService
    ) {
        this.vmsData = [];
        this.totalRecords = 0;
        this.limitRecords = 10;
        this.tableConfig = ExpenseConfigurationTableModel;
    }

    ngOnInit() {
      this.tableConfig.columnList.forEach(x => {
        if(x.name == 'status') {
          x.isDisableorDelete = this.accessControlService.accessControl()
        }
      })
        this.subscription = this.service.listResponse$.subscribe((data: IExpensesConfigurationListData) => {
            this.totalRecords = data?.total_records;
            this.setVmsData(data?.configuration || []);
        });
      this.setHttpParams({ limit: this.limitRecords, page: 1 });
      this.eventStream.on(Events.SHOW_EXPENSE_LOGS).subscribe((data:any) => {
        this.logs = data
      });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    setVmsData(items: IExpensesConfigurationListItem[]) {
        this.vmsData = items.map((item: IExpensesConfigurationListItem) => {
            const updatedAtDate = this.localDatePipe.transform(item?.updated_at);
            return {
                config_uuid: item.config_uuid,
                config_name: item.config_name,
                hierarchy_title: item.hierarchy?.map((val => val?.title))?.toString() || [],
                updated_by: `By ${item.updated_by?.name || ''} on ${updatedAtDate}`,
                status: ConfigExpenseStatus[item.status]
            } as IExpensesConfigurationVmsData;
        });
    }

    setHttpParams(params: object) {
        Object.keys(params).forEach((key: string) => {
            this.service.httpParamsItem[key] = params[key];
        });
        this.service.getExpenseConfigurationList();
    }

    onSearch(searchText: string) {
        const params = { page: 1, search: searchText };
        this.setHttpParams(params);
    }

    onPaginationClick(pageNo: number) {
        const params = { page: pageNo };
        this.setHttpParams(params);
    }

    getToConfigurationDetails(event: boolean | IExpensesConfigurationVmsData, status: string = null) {
        if (typeof event === 'boolean' && !status) {
            this.router.navigate(NavigationPaths.user.expenseConfigurationDetails()?.split('/')?.slice(1));
        } else if (typeof event === 'object' && status) {
            const config_uuid = event.config_uuid;
            this.router.navigate(NavigationPaths.user.expenseConfigurationDetails()?.split('/')?.slice(1), { queryParams: { config_uuid, status } });
        }
    }

    onDeleteClick(item: IExpensesConfigurationVmsData) {
        this.service.delete(item.config_uuid);
    }

    onDisableOrEnableClick(item: IExpensesConfigurationVmsData) {
        const status = !item.status;
        this.service.disableOrEnable(item.config_uuid, { status } as IDisableOrEnableRequestPayload);
    }

    onListFilter(filter: IAdvanceFilterEmit) {
        const config_name = filter?.config_name;
        const status = filter?.is_enabled;
        const params = { page: 1, config_name, status };
        this.setHttpParams(params);
    }
}
