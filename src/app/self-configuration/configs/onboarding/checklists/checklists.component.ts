import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-checklists',
  templateUrl: './checklists.component.html',
  styleUrls: ['./checklists.component.scss']
})
export class ChecklistsComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', { static: true }) statusTemplate: TemplateRef<any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private listSubject: Subject<any> = new Subject<any>();
  private prevListConfig: any = { term: '', page: 1 };
  private statusQuery: boolean = null;

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private storage: StorageService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initListingSub();

    this.programId = this.storage.get(StorageKeys.PROGRAM_ID);
    this.listSubject.next(this.prevListConfig);
  }

  initTableConfig() {

    // Advance filter
    this.tableFilterConfig = [{
      name: 'name',
      title: 'Checklist Name',
      placeholder: 'Filter Checklist',
      type: FilterType.TEXT
    }, {
      name: 'is_enabled',
      title: 'Status',
      placeholder: 'Select Status',
      type: FilterType.SELECT,
      options: [{
        name: 'Active',
        value: true
      }, {
        name: 'Inactive',
        value: false
      }]
    }];

    // Header
    this.tableHeaderConfig = {
      title: 'Checklists',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('checklist_manage'),
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
    };

    // Action Links
    let actionLinks: Array<IActionLinks> = [{
      linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('checklist_view')
    }, {
      linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('checklist_manage')
    }, {
      linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(),
      hide: !this.authService.authorize('checklist_manage')
    }, {
      linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(),
      hide: !this.authService.authorize('checklist_manage')
    }];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'description_view', header: 'Description', width: 12, order: 3, sortable: false },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate }
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Checklist Found",
      enableColumnFilter: true,
      actionLinks,
    };
  }

  initListingSub() {
    this.subscriptions.push(
      this.listSubject.pipe(
        debounceTime(400),
        switchMap((query: any) => {

          const term: string = query?.term;
          const page: number = query?.page;

          this.prevListConfig = { term, page };
          if (this.vmsTable?.currentPage) {
            this.vmsTable.currentPage = page ?? 1;
          };

          this.loader.show();
          return this.fetchListingObservable(term, page);
        })
      ).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.totalRecords = data?.total_records;
            this.vmsData = data?.checklists?.map((res: any) => {
              return {
                ...res,
                description_view: res['description'] || '--'
              };
            });
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
    );
  }

  fetchListingObservable(term: string = '', page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/onboarding/checklists?limit=${this.itemsPerPage}&page=${page}`;
    if (term) {
      url += `&k=${term}`;
    }

    if(typeof(this.statusQuery) === 'boolean') {
      url += `&active=${this.statusQuery}`;
    }

    return this.programService.get(url);
  }

  listChecklist(created: boolean = true) {
    if (created) {
      this.listSubject.next({ ...this.prevListConfig, page: 1 });
    } else {
      this.listSubject.next(this.prevListConfig);
    }
  }

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if (this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  onPaginationClick = (page: number) => {
    this.listSubject.next({ ...this.prevListConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.listSubject.next({ ...this.prevListConfig, page: 1 });
  }

  onSearch = (term: string) => {
    this.listSubject.next({
      term: term || '', page: 1
    });
  }

  onAdvanceFilter = (evt: any) => {
    this.statusQuery = evt?.is_enabled;
    this.listSubject.next({
      term: evt?.name || '', page: 1
    });
  }

  onAddClicked = (evt: any = null) => {
    this.eventStream.emit(new EmitEvent(Events.CREATE_CHECKLIST, true));
  }

  onViewClicked = (evt: any = null) => {
    if (evt?.id) {
      const obj = { event: true, data: evt };
      this.eventStream.emit(new EmitEvent(Events.VIEW_CHECKLIST, obj));
    }
  }

  onEditClicked = (evt: any = null) => {
    if (evt?.id) {
      const obj = { event: true, data: evt };
      this.eventStream.emit(new EmitEvent(Events.EDIT_CHECKLIST, obj));
    }
  }

  onDisableClicked = (evt: any = null) => {
    if (evt?.id) {

      const tasks: Array<any> = [];
      let order: number = 1;

      evt?.tasks?.map((task: any) => {
        if (task?.dependent_task) {
          tasks.push({
            task_id: task?.task?.id, order,
            dependent_task_id: task?.dependent_task?.id
          });
        } else {
          tasks.push({
            task_id: task?.task?.id,
            order
          });
        }

        order++;
      });

      const payload = {
        ...evt
      };

      payload['tasks'] = tasks;
      payload['is_enabled'] = !payload['is_enabled'];

      this.loader.show();
      const url: string = `/configurator/programs/${this.programId}/onboarding/checklists/${evt?.id}`;
      this.programService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.alert.success(`Checklist ${evt?.is_enabled ? 'disabled' : 'enabled'} successfully`);
              this.listSubject.next(this.prevListConfig);
            }
          }, error: (err: any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          }
        });
    }
  }

  onDeleteClicked = (evt: any = null) => {
    if (evt?.id) {
      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/onboarding/checklists/${evt?.id}`;
      this.programService.delete(url)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.alert.success('Checklist deleted successfully');
              this.listSubject.next({ ...this.prevListConfig, page: 1 });
            }
          }, error: (error: any) => {
            this.alert.error(errorHandler(error));
            this.loader.hide();
          }
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}