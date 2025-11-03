import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subscription, Subject, debounceTime, switchMap, Observable } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import {
  ITableOptions,
  IAdvanceFilterConfig,
  ITableHeaderConfig,
  ITablePaginationConfig,
  IColoumnDefinition,
  FilterType,
  IActionLinks,
  ColumnType,
} from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';


@Component({
  selector: 'app-reason-code',
  templateUrl: './reason-code.component.html',
  styleUrls: ['./reason-code.component.scss'],
})
export class ReasonCodeComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('module', { static: true }) moduleTemplate: TemplateRef <any>;
  @ViewChild('event', { static: true }) eventTemplate: TemplateRef <any>;
  // @ViewChild('status', { static: true }) statusTemplate: TemplateRef<any>;

  public panelVisibility: 'visible' | 'hidden' = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private reasonSubject: Subject<any> = new Subject<any>();
  private prevReasonConfig: any = { term: '', page: 1 };
  private filterPayload: any = null;

  private moduleName: Array<string> = ['reason_code'];
  private selectedModule: any = null;
  private eventList: Array<any> = [];
  private moduleList: Array<any> = [];
  currentProgram:any;

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private router : SvmsRouterService,
    private uniqueKey: UniqueKeyPipe,
    private authService: AuthorizationService,
    private sortPipe: SortHelperPipe
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.getCodeList(this.storageService.get('PROGRAM_ID'));
    // Initialization
    this.initTableConfig();
    this.initDocumentSub();

    // API Calls
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.reasonSubject.next(this.prevReasonConfig);
  }

  initTableConfig = () => {
    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter by Event',
        type: FilterType.TEXT,
      }, {
        name: 'entity_ref',
        title: 'entity_ref',
        placeholder: 'Select Module',
        type: FilterType.SELECT,
        options: [],
        loading: false
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Reason Codes',
      searchAllowed: true,
      showAddBtn: false,
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onListFilter,
    };

    // Action Links
    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, linkIcon: 'visibility', hide: !this.authService.authorize('reason_code_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('reason_code_manage') },
      // { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', hide:!this.accessControlService.accessControl(),hide: !this.authService.authorize('reason_code_manage') },
      // { linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', hide:!this.accessControlService.accessControl(), hide: !this.authService.authorize('reason_code_manage') }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged,
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Event', width: 6, primary: false, order: 2, sortable: true, templateRef: this.eventTemplate },
      // { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'entity_ref', header: 'Module', width: 6, order: 1, primary: true, sortable: true, templateRef: this.moduleTemplate, showActionLinkForTemplate: true },
      { field: 'reasons_count', header: '# Reasons', width: 6, order: 3, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 6, order: 4, sortable: true, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: 'No Reason Found',
      enableColumnFilter: true,
      actionLinks
    };
  };

  initDocumentSub = () => {
    this.subscriptions.push(
      this.reasonSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {
            const term: string = query?.term;
            const page: number = query?.page;
            this.prevReasonConfig = { term, page };
            if (this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            }

            this.loader.show();
            if (this.filterPayload) {
              return this.fetchAdvanceFilterObservable(page);
            }

            return this.fetchListingObservable(term, page);
          }),
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.vmsData = data?.reason_code_actions;
              this.totalRecords = data?.total_records;
            }
          },
          error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          },
        }),
    );
  };

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if (this.tablePaginationConfig) this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions) this.tableOptions.totalRecords = count;
  }

  fetchListingObservable(term: string, page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/pages/reason-code-actions?limit=${this.itemsPerPage}&page=${page}&ordering=entity_ref,name`;
    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/pages/reason-code-actions?limit=${this.itemsPerPage}&page=${page}&ordering=entity_ref,name`;
    if (this.filterPayload?.name) {
      url += `&name=${this.filterPayload?.name}`;
    }
    // if(typeof(this.filterPayload?.is_enabled) === 'boolean') {
    //   url += `&is_enabled=${this.filterPayload?.is_enabled}`;
    // }
    if (this.filterPayload?.entity_ref) {
      url += `&entity_ref=${this.filterPayload?.entity_ref}`;
    }

    if (this.filterPayload?.modified_on) {
      url += `&date_range=${(this.filterPayload?.modified_on || []).join(',')}`;
    }

    return this.programService.get(url);
  }

  onSearch = (term: string) => {
    this.reasonSubject.next({
      term,
      page: 1,
    });
  };

  onListFilter = evt => {
    if (!!evt) {
      this.filterPayload = evt;
    } else {
      this.filterPayload = null;
    }

    this.reasonSubject.next({ term: '', page: 1 });
  };

  onAddClicked = () => {
    this.panelVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.REASON_CODE_CREATE));
  };

  onViewClicked = (evt: any) => {
    this.router.navigate([this.programId, 'reason-codes', evt.id]);

    this.getReasonCodeName(evt.entity_ref);

    if (evt?.id) {
      let obj = { event: true, data: evt };
      this.panelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.REASON_CODE_VIEW, obj));
    }
  };

  onClickView = (evt: any) => {
    if (evt) {
      this.getReasonCodeName(evt.entity_ref);
      this.router.navigate(['data-management', 'reason-codes', 'reason-code-details'], {
        queryParams: {
          name: evt?.name,
          id: evt?.id,
          module: evt?.entity_ref,
          lastUpdated: evt?.modified_on,
          code: evt?.code
        },
      });
      this.eventStream.emit(new EmitEvent(Events.REASON_CODE_VIEW, evt));
    }
  };

  onModuleChange(title) {
    this.moduleName = title;
    this.selectedModule = this.getReasonCodeCount(title, true);
  }

  onEditClicked = (evt: any) => {
    if (evt) {
      this.getReasonCodeName(evt.entity_ref);
      this.router.navigate(['data-management', 'reason-codes', 'edit-reason'], {
        queryParams: {
          name: evt?.name,
          id: evt?.id,
          module: evt?.entity_ref,
          code: evt?.code
        },
      });
    }
  };

  getReasonCodeName(name) {
    let moduleName = '';
    switch (name) {
      case 'Job':
        moduleName = 'JOBS';
        break;
      case 'Submissions':
        moduleName = 'SUBMISSIONS';
        break;
      case 'Interview':
        moduleName = 'INTERVIEWS';
        break;
      case 'Offer':
        moduleName = 'OFFERS';
        break;
      case 'Onboarding':
        moduleName = 'ONBOARDING';
        break;
      case 'Assignment':
        moduleName = 'ASSIGNMENTS';
        break;
      case 'Timesheet':
        moduleName = 'TIMESHEETS';
        break;
      case 'Expense':
        moduleName = 'EXPENSES';
        break;
      case 'Invoice':
        moduleName = 'INVOICES';
        break;
    }
    return moduleName;
  }

  getReasonCodeCount(reason_code_name, list = false) {
    if (list) {
      return this.vmsData.filter(rc => rc['entity_ref'] == this.getReasonCodeName(reason_code_name));
    } else return this.vmsData.filter(rc => rc['entity_ref'] == this.getReasonCodeName(reason_code_name)).length;
  }

  onDisableClicked = (evt: any) => {
    if (evt?.id) {
      this.loader.show();
      var payload = {
        name: evt?.name,
        entity_ref: evt?.entity_ref,
        is_enabled: !evt.is_enabled,
        code: evt?.code,
        id: evt?.id,
      };

      var url = `/configurator/programs/${this.programId}/pages/reason-code-actions/${evt?.id}`;
    }

    this.programService.put(url, payload).subscribe({
      next: (data: any) => {
        if (data) {
          this.loader.hide();
          this.alert.success(`Reason code updated successfully`);
          this.reasonSubject.next(this.prevReasonConfig);
        }
      },
      error: (err: any) => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
      },
    });
  };

  onDeleteClicked = (evt: any) => {
    if (evt?.id) {
      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/pages/reason-code-actions/${evt?.id}`;

      this.programService.delete(url).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`Reason code deleted successfully`);
            this.reasonSubject.next({ ...this.prevReasonConfig, page: 1 });
          }
        },
        error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        },
      });
    }
  };

  onPaginationClick = (page: number) => {
    this.reasonSubject.next({ ...this.prevReasonConfig, page });
  };

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.reasonSubject.next({ ...this.prevReasonConfig, page: 1 });
  };

  // sidebarClose(evt: any, refresh: boolean = false) {
  //   this.panelVisibility = 'hidden';
  //   if (refresh) {
  //     this.reasonSubject.next({ ...this.prevReasonConfig, page: 1 });
  //   }
  // }

  getCodeList(programID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions?limit=50`).subscribe((reason: any) => {
      this.vmsData = reason.reason_code_actions;
      this.eventList = this.vmsData.map((item: any) => item.name);
      this.moduleList = this.vmsData.map((item: any) => item.entity_ref);

      this.eventList = [];
      let results: Array<any> = reason.reason_code_actions;
      results.forEach(node => {
        this.eventList.push({
          name: node?.name,
          value: node?.name,
        });
      });

      this.moduleList = [];
      let results2: Array<any> = reason.reason_code_actions;
      results2.forEach(node => {
        if(node?.entity_ref) {
          this.moduleList.push({
            name: node?.entity_ref,
            value: node?.entity_ref,
            ModuleName: node?.entity_ref,
          });
        }
      });

      this.tableFilterConfig[0].options = this.eventList;
      this.tableFilterConfig[1].options = this.sortPipe.transform(
        this.uniqueKey.transform(this.moduleList, 'value'),
      "name");

      this.getReasonCodeCount(this.moduleName, true);
      this.onModuleChange(this.moduleName);
      this.totalRecords = reason.total_records;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
