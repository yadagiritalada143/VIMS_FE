import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import {
  ITableHeaderConfig,
  IColoumnDefinition,
  ITableOptions,
  ITablePaginationConfig,
  IAdvanceFilterConfig,
  FilterType,
  IActionLinks,
  ColumnType,
} from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

type Query = { term: string, page: number };

@Component({
  selector: 'app-support-text-list',
  templateUrl: './support-text-list.component.html',
  styleUrls: ['./support-text-list.component.scss'],
})
export class SupportTextListComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;

  private filterPayload: any = null;
  private prevSupportingConfig: Query = { term: '', page: 1 };

  private subscriptions: Array <Subscription> = [];
  private supportingTextSub: Subject <Query> = new Subject <Query>();

  @ViewChild('first', { static: true }) firstCol: TemplateRef<void>;
  @ViewChild('primary', { static: true }) mainCol: TemplateRef<void>;

  public svmsData: Array <any>;
  public sidepanelVisibility: ('visible' | 'hidden') = 'hidden';

  tableOptions: ITableOptions;
  tableHeaderConfig: ITableHeaderConfig;
  tablePaginationConfig: ITablePaginationConfig;
  svmstableColomnDefn: Array <IColoumnDefinition>;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'event.module.name',
        title: 'Module',
        placeholder: 'Search Module',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'event.name',
        title: 'Event',
        placeholder: 'Search Event Name',
        type: FilterType.TEXT,
        advanceFilter: false
      },
      {
        name: 'performed_by',
        title: 'Performed By',
        placeholder: 'Search Performed By',
        type: FilterType.TEXT,
        advanceFilter: false
      }, {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date Range',
        type: FilterType.DATEPICKER,
        advanceFilter: false
      }
    ];

    this.tableHeaderConfig = {
      title: 'Supporting Text',
      searchAllowed: false,
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onClickView, disable: false, hide: !this.authService.authorize('supporting_text_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('supporting_text_manage') },
      // { linkName: 'Enable/Disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('work_location_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged,
    };

    this.svmstableColomnDefn = [
      { field: 'event.name', header: 'Event', width: 16, order: 2, primary: false, sortable: true, type: ColumnType.TEMPLATE, templateRef: this.mainCol },
      { field: 'event.module.name', header: 'Module', width: 24, order: 1, primary: true, sortable: true, type: ColumnType.TEMPLATE, templateRef: this.firstCol, showActionLinkForTemplate: true },
      { field: 'performed_by', header: 'Performed By', width: 16, order: 3, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 16, order: 4, sortable: true, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: 'No Supporting Text data found for the selected program.',
      actionLinks: actionLinks,
      enableColumnFilter: true,
    };
  };

  onPaginationClick = (page: number) => {
    this.supportingTextSub.next({ ...this.prevSupportingConfig, page });
  };

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.supportingTextSub.next({ ...this.prevSupportingConfig, page: 1 });
  };

  onListFilter = evt => {
    if (!!evt) {
      this.filterPayload = evt;
    } else {
      this.filterPayload = null;
    }

    this.supportingTextSub.next({ term: '', page: 1 });
  };

  onClickView = (evt: any) => {
    if (evt) {
      this.svmsRouter.navigate(['program', 'support-text', 'view', evt.id]);
    }
  };

  onEditClick = (evt: any) => {
    if (evt) {
      this.svmsRouter.navigate(['program', 'support-text', 'edit', evt.id], {
        queryParams: {
          isEdit: true,
        },
      });
    }
  };

  onDisableClicked = (evt: any) => {
    if (evt?.id) {
      this.loader.show();
      var payload = {
        name: evt?.name,
        event_id: evt?.event.id,
        module_id: evt?.event.module.id,
        performed_by: evt?.performed_by,
        is_enabled: !evt.is_enabled,
        id: evt?.id,
      };

      let url = `/configurator/programs/${this.programId}/support/support_text/${evt?.id}`;

      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`Supporting Text updated successfully`);
            this.supportingTextSub.next(this.prevSupportingConfig);
          }
        },
        error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        },
      });
    }
  };

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private svmsRouter: SvmsRouterService,
    private programService: ProgramService,
    private storageService: StorageService,
    private authService: AuthorizationService,
  ) { }

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.initDocumentSub();

    this.supportingTextSub.next(this.prevSupportingConfig);
  }

  initDocumentSub = () => {
    this.subscriptions.push(
      this.supportingTextSub
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {
            const term: string = query?.term;
            const page: number = query?.page;
            this.prevSupportingConfig = { term, page };
            if (this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            }

            this.loader.show();
            return this.fetchAdvanceFilterObservable(page);
          }),
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.svmsData = (data?.support_text_data || []).map((entry: any) => {
                return {
                  ...entry,
                  performed_by: entry?.performed_by?.[0]
                }
              });
              this.itemsPerPage = data?.items_per_page;
              this.totalRecords = data?.total_records;
              this.tableOptions.totalRecords = data?.total_records;
            }
          },
          error: (err: any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          },
        }),
    );
  };

  fetchListingObservable(term: string, page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/support/support_text?limit=${this.itemsPerPage}&page=${page}&ordering=module,name`;
    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/support/support_text?limit=${this.itemsPerPage}&page=${page}&ordering=module,name`;
    if (this.filterPayload) {
      if (this.filterPayload?.['event.module.name']) {
        url += `&module_name=${encodeURIComponent(this.filterPayload['event.module.name'])}`;
      }

      if (this.filterPayload?.['event.name']) {
        url += `&event_name=${encodeURIComponent(this.filterPayload['event.name'])}`;
      }

      if (this.filterPayload?.['performed_by']) {
        url += `&performed_by=${encodeURIComponent((this.filterPayload['performed_by'] || '').toUpperCase())}`;
      }

      if (this.filterPayload?.['modified_on']) {
        url += `&date_range=${this.filterPayload['modified_on']}`;
      }
    }

    return this.programService.get(url);
  }

  get itemsPerPage() {
    return this.tableOptions?.paginationConfig?.itemsPerPage || 10;
  }

  set itemsPerPage(data: number) {
    if(this.tableOptions?.paginationConfig) {
      this.tableOptions.paginationConfig['itemsPerPage'] = (data || 10);
    }
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords || 0;
  }

  set totalRecords(data: number) {
    if(this.tableOptions) {
      this.tableOptions.totalRecords = (data || 0);
    }
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
