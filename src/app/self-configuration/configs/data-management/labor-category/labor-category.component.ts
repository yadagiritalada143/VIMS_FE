import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-labor-category',
  templateUrl: './labor-category.component.html',
  styleUrls: ['./labor-category.component.scss']
})
export class LaborCategoryComponent implements OnInit {
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableColumnConfig: Array<IColoumnDefinition>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate: TemplateRef<void>;
  tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableOptions: ITableOptions;
  // private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private groupSubject: Subject<any> = new Subject<any>();
  private prevGroupConfig: any = {term: '', page: 1};
  private filterData: any = null;
  public vmsData: Array<any> = [];

  constructor(
    private route: SvmsRouterService,
    private authService: AuthorizationService,
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    public storageService: StorageService
  ) { }

  ngOnInit(): void {
    // Initialization
    this.initTableConfig();
    this.initGroupSubject();
    // Rendering
    this.groupSubject.next(this.prevGroupConfig);
  }
  initTableConfig() {

    this.tableFilterConfig = [{
        name: 'name',
        title: 'name',
        placeholder: 'File name',
        type: FilterType.TEXT
      }, {
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
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'select_date_range',
        type: FilterType.DATEPICKER,
        advanceFilter: false
      }
    ];

    this.tableHeaderConfig = {
      title: 'Labor Category',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('labor_category_manage'),
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
      createButtonTitle: 'Create New'
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility',hide: !this.authService.authorize('labor_category_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit',hide: !this.authService.authorize('labor_category_manage') },
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2,templateRef: this.statusTemplate, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 6, order: 3, sortable: false, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Document Groups Found",
      enableColumnFilter: true,
      actionLinks
    };
  }
  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }
  initGroupSubject() {
    this.subscriptions.push(
      this.groupSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevGroupConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            if(this.filterData) {
              return this.fetchAdvanceFilterObservable(page);
            }

            this.loader.show();
            return this.fetchListingObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.vmsData = data?.industries;
              this.totalRecords = data?.total_records;
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        })
    );
  }

  fetchListingObservable(term: string, page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/industries?limit=${this.itemsPerPage}&page=${page}`;

    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }



  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/industries?limit=${this.itemsPerPage}&page=${page}`;
    if(this.filterData?.name) {
      url += `&name=${this.filterData?.name}`;
    }
    if(typeof(this.filterData?.is_enabled) === 'boolean') {
      url += `&active=${this.filterData?.is_enabled}`;
    }
    if(this.filterData?.modified_on) {
      url += `&date_range=${this.filterData?.modified_on}`;
    }

    return this.programService.get(url);
  }
  onAddClicked = (evt: any) => {
    this.route.navigate(['data-management', 'labor-create']);
    }

    onViewClicked = (evt: any) => {
      if (evt?.id) {
        this.route.navigate(['data-management', 'labor-view'], { queryParams: { id: evt?.id }});
      }
    }

    onEditClicked = (evt: any) => {
      if (evt?.id) {
        this.route.navigate(['data-management', 'labor-create'], { queryParams: { id: evt?.id }});
      }
    }
    onSearch = (term: any) => {
      this.groupSubject.next({term, page: 1});
    }

    onAdvanceFilter = (evt: any) => {
      if(!!evt) {
        this.filterData = evt;
      } else {
        this.filterData = null;
      }

      this.groupSubject.next({term: '', page: 1});
    }

    onPaginationClick = (page: number) => {
      this.groupSubject.next({ ...this.prevGroupConfig, page });
    }

    onItemCountChanged = (count: number) => {
      this.itemsPerPage = count;
      this.groupSubject.next({ ...this.prevGroupConfig, page: 1 });
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
}
