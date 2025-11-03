import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-qualifications',
  templateUrl: './qualifications.component.html',
  styleUrls: ['./qualifications.component.scss']
})
export class QualificationsComponent implements OnInit, OnDestroy {
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('count', {static: true}) countTemplate: TemplateRef <any>;
  public sidepanelVisible: ('visible' | 'hidden') = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private isAdvanceFilter: boolean = false;
  private subscriptions: Array<Subscription> = [];
  private qualSubject: Subject<any> = new Subject<any>();
  private prevQualConfig: any = {term: '', page: 1};

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private svmsRouter: SvmsRouterService,
    private eventStream: EventStreamService,
    private authorizeService: AuthorizationService,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initQualificationSub();

    // API Calls
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.qualSubject.next(this.prevQualConfig);
  }

  initTableConfig = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter Name',
        type: FilterType.TEXT
      },
      {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      {
        name: 'type_label',
        title: 'type_label',
        placeholder: 'Select ',
        type: FilterType.SELECT,
        options: [
          { name: 'Program', value: 'CUSTOM' },
          { name: 'Predefined', value: 'SYSTEM' }
        ]
      },
      {
        name: 'modified_on_new',
        title: 'modified_on_new',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Qualification Type(s)',
      searchAllowed: true,
      showAddBtn: this.addQualificationAllowed,
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', disable: (!this.editQualificationAllowed), hide: !this.authorizeService.authorize('qualification_manage') },
      { linkName: 'Details', method: this.onDetailsClicked, linkIcon: 'assignment', hide: !this.authorizeService.authorize('qualification_view') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authorizeService.authorize('qualification_manage') },
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'total_qualifications', header: 'Count', width: 6, order: 3, sortable: true, templateRef: this.countTemplate },
      { field: 'type_label', header: 'Defined By', width: 6, order: 4, sortable: true },
      { field: 'modified_on_new', header: 'Last Updated', width: 6, order: 5, sortable: false, type: ColumnType.DATETIME },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Program Found",
      actionLinks,
      enableColumnFilter: true
    };
  };

  initQualificationSub = () => {
    this.subscriptions.push(
      this.qualSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevQualConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            return this.fetchQualificationObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.vmsData = data?.qualification_types?.map((entry: any) => {
                return {
                  ...entry,
                  modified_on_new: (entry?.modified_on),
                  type_label: (entry?.['type'] === 'CUSTOM')?"Program":"Predefined"
                }
              });
              this.totalRecords = data?.total_records;
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        }
      )
    )
  };

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if(this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if(this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  get addQualificationAllowed() {
    return this.authorizeService.authorize('qualification_manage');
  }

  get editQualificationAllowed() {
    return this.authorizeService.authorize('qualification_manage');
  }

  onPaginationClick = (page: number) => {
    this.qualSubject.next({ ...this.prevQualConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.qualSubject.next({ ...this.prevQualConfig, page: 1 });
  }

  onSearch = (term: string) => {
    this.qualSubject.next({ term, page: 1 });
  }

  onAdvanceFilter = (evt: any) => {
    this.isAdvanceFilter = !!evt;
    if(!evt){
      this.prevQualConfig = null;
    }
    this.qualSubject.next({ term: evt, page: 1 });
  }

  onAddClicked = (evt: any) => {
    if(evt && this.addQualificationAllowed) {
      this.sidepanelVisible = 'visible';
    }
  }

  onViewClicked = (evt: any) => {
    if(evt?.id) {
      const {name, id} = evt;
      this.svmsRouter.navigate(['job', 'qualificationsList', 'list-qualifications'], {
        queryParams: { name, id }
      });
    }
  }

  onEditClicked = (evt: any) => {
    if (evt?.id) {

      if(evt?.type !== 'CUSTOM') {
        this.alert.error('Editing Predefined Qualification Types are not allowed');
        return;
      }

      this.sidepanelVisible = 'visible';
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_DATA_EDIT, obj));
    }
  }

  onDisableClicked = (evt: any) => {
    if(evt?.id) {

      if(evt?.type !== 'CUSTOM') {
        this.alert.error('Editing Predefined Qualification Types are not allowed');
        return;
      }

      let url: string = `/configurator/programs/${this.programId}/qualification-types/${evt?.id}`;
      let payload: any = {
        is_enabled: (evt?.is_enabled)? false : true
      };

      this.loader.show();
      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if(data) {
            this.loader.hide();
            this.alert.success(`Qualification is ${evt?.is_enabled?'disabled':'enabled'} successfully`);
            this.qualSubject.next(this.prevQualConfig);
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    }
  }

  onDetailsClicked = (evt: any) => {
    if(evt?.id) {
      this.sidepanelVisible = 'visible';
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_DATA_VIEW, obj));
    }
  }

  onClose(evt: any) {
    this.sidepanelVisible = 'hidden';
    if(evt) {
      this.qualSubject.next(this.prevQualConfig);
    }
  }

  fetchQualificationObservable(payload: any, page: number = 1) {

    let url: string = `/configurator/programs/${this.programId}/qualification-types?limit=${this.itemsPerPage}&page=${page}&type_all=true`;
    if(payload) {
      if(this.isAdvanceFilter) {
        if(payload.name){
          url += `&name=${payload.name}`;
        }
        if(payload.type_label){
          url += `&defined_by=${payload.type_label}`;
        }
        if(payload.modified_on_new) {
          url += `&date_range=${(payload.modified_on_new || []).join(',')}`;
        }
        if(payload.is_enabled !== null && payload.is_enabled != undefined){
          url += `&k=${payload.is_enabled}`;
        }
      }
    }else{
      url += `&ordering=-modified_on`
    }

    return this.programService.get(url);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
