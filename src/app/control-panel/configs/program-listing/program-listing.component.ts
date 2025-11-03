import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable, Subject, Subscription, switchMap, tap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-program-listing',
  templateUrl: './program-listing.component.html',
  styleUrls: ['./program-listing.component.scss']
})
export class ProgramListingComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('program', {static: true}) programTemplate: TemplateRef <any>;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('organization', {static: true}) orgTemplate: TemplateRef <any>;
  @ViewChild('options', {static: true}) optionsTemplate: TemplateRef <any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  public clickSubject: Subject <any> = new Subject <any> ();

  private subscriptions: Array<Subscription> = [];
  private programSubject: Subject<any> = new Subject<any>();
  private prevProgramConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private program: ProgramService,
    private router: SvmsRouterService,
    private storage: StorageService,
    private appRoute: Router,
    private authorization: AuthorizationService
  ) { }

  ngOnInit(): void {
    
    // Initialization
    this.initTableConfig();
    this.initProgramSub();
    this.initClickSubject();

    // API Calls
    this.programSubject.next(this.prevProgramConfig);
  }

  initTableConfig = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'Program Name',
        placeholder: 'Program Name',
        type: FilterType.TEXT
      },
      {
        name: 'is_enabled',
        title: 'Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }, {
        name: 'start_date',
        title: 'Effective Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'programs',
      searchAllowed: true,
      showAddBtn: this.authorization.authorize('create_program'),
      advanceFilter: true,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onListFilter,
    };

    // Action Links

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'program', width: 6, primary: true, order: 1, sortable: true, templateRef: this.programTemplate },
      { field: 'is_enabled', header: 'status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate, type: ColumnType.TEMPLATE },
      { field: 'client.name', header: 'organization', width: 6, order: 3, sortable: true, templateRef: this.orgTemplate },
      { field: '_', header: '', width: 12, order: 4, templateRef: this.optionsTemplate },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Program Found",
      // actionLinks:actionLinks,
      // linksValidatorFn: this.validatorActionLinksFn
    };

  };

  initProgramSub = () => {
    this.subscriptions.push(
      this.programSubject
        .pipe(
          distinctUntilChanged((prev: any, curr: any) => {
            return (prev?.term === curr?.term) && (prev?.page === curr?.page);
          }),
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevProgramConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            if(this.filterPayload) {
              return this.fetchAdvanceFilterObservable(page);
            }

            return this.fetchProgramObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.vmsData = data?.programs;
              this.totalRecords = data?.total_records;
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        })
    )
  };

  initClickSubject = () => {
    this.subscriptions.push(
      this.clickSubject.pipe(
        tap((data: any) => { this.loader.show() }),
        debounceTime(1500)
      ).subscribe(({ program, location }) => {
        const selectedProgram: any = program?.id;
        const activeProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
        if (selectedProgram !== activeProgram?.id) {
          this.storage.set(StorageKeys.PROGRAM_ID, selectedProgram, true);
          this.program.setProgram(program, true);
        }

        this.appRoute.navigate([location]);
        setTimeout(() => {
          this.loader.hide();
        }, 1500);
      })
    );
  }

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

  fetchProgramObservable(term: string, page: number = 1): Observable <any> {
    let url: string = `/configurator/programs?limit=${this.itemsPerPage}&page=${page}`;
    if (term)
      url += `&name=${term}`;

    return this.program.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {

    let url: string = `/configurator/programs/advanced-filters`;
    let payload: any = {
      "filters": {},
      "pagination": {
        "limit": this.itemsPerPage,
        "page": page
      }
    };

    let name: string = this.filterPayload?.name;
    let is_enabled: boolean = this.filterPayload?.is_enabled;
    let start_date: Array<number> = this.filterPayload?.start_date;

    if (name) {
      payload['filters'].name = name;
    }

    if (typeof (is_enabled) === 'boolean') {
      payload['filters'].is_enabled = is_enabled;
    }

    if (start_date) {
      payload['filters'].start_date = start_date;
    }

    return this.program.post(url, payload);
  }

  navigateToProgramDetails(details: any) {
    this.router.navigate(['program-setup', 'program-detail'], {
      queryParams: {
        'programId': details?.unique_id,
        'clientId': details?.client?.id,
        'program_req_id': details?.id
      }
    });
  }

  launchProgram(program: any, location: string = 'dashboard') {
    this.clickSubject.next({program, location});
  }

  onCreateClick = () => {
    this.router.navigate(['programs', 'create']);
  }

  onSearch = (term: string) => {
    this.programSubject.next({
      term, page: 1
    });
  }

  onListFilter = (evt) => {
    if(!!evt) {
      this.filterPayload = evt;
    } else {
      this.filterPayload = null;
    }

    this.programSubject.next({ term: '', page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.programSubject.next({ ...this.prevProgramConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.programSubject.next({ ...this.prevProgramConfig, page: 1 });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
