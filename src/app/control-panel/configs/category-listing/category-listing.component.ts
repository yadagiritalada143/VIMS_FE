import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { debounceTime, interval, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { OrganizationCreateComponent } from 'src/app/organizations/organization-create/organization-create.component';

@Component({
  selector: 'app-category-listing',
  templateUrl: './category-listing.component.html',
  styleUrls: ['./category-listing.component.scss']
})
export class CategoryListingComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('contacts', {static: true}) contactsTemplate: TemplateRef <any>;
  @ViewChild(OrganizationCreateComponent) sidepanel: OrganizationCreateComponent;

  private subscriptions: Array <Subscription> = [];
  private orgType: ('client' | 'msp' | 'vendor') = null;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private categorySubject: Subject<any> = new Subject<any>();
  private prevCategoryConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  public pageTitle: string = null;
  public categoryIcon: string = null;
  public categoryType: string = null;
  public categoryTitle: string = null;  

  private createMode: boolean = false;
  private editMode: boolean = false;
  private viewMode: boolean = false;

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private programService: ProgramService,
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    }
    this.route.params.subscribe((data: Params) => {
      this.orgType = data?.['term'];
      this.initSidebar();
      this.initTableConfig();
      this.initCategorySub();
      this.categorySubject.next(this.prevCategoryConfig);
    });
  }

  initCategorySub = () => {
    this.subscriptions.push(
      this.categorySubject
        .pipe(
          debounceTime(600),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevCategoryConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            this.loader.show();
            if(this.filterPayload) {
              return this.fetchAdvanceFilterObservable(page);
            }

            return this.fetchListingObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.vmsData = data?.organizations;
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
  }

  fetchListingObservable(term: string, page: number = 1): Observable <any> {
    let url: string = `/configurator/organizations?category=${this.orgType}&limit=${this.itemsPerPage}&page=${page}`;
    if (term)
      url += `&name=${term}`;

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable <any> { 
    let url: string = `/configurator/organizations/advanced-filters`;
    let payload: any = {
      filters: this.filterPayload,
      pagination: {
        limit: this.itemsPerPage,
        page
      }
    };

    return this.programService.post(url, payload);
  }

  initSidebar = () => {

    // Initialize sidebar configuration
    switch (this.orgType) {
      case 'client':
        this.pageTitle = 'clients';
        this.categoryIcon = 'supervised_user_circle';
        this.categoryType = 'TYPE_CLIENT';
        this.categoryTitle = `create_new_${this.categoryName}`?.toLowerCase();
        break;
      case 'msp':
        this.pageTitle = 'msp_managed_service_provider';
        this.categoryIcon = 'domain';
        this.categoryType = 'TYPE_MSP';
        this.categoryTitle = `create_new_${this.categoryName}`?.toLowerCase();
        break;
      case 'vendor':
        this.pageTitle = 'vendors';
        this.categoryIcon = 'storefront';
        this.categoryType = 'TYPE_VENDOR';
        this.categoryTitle = `create_new_${this.categoryName}`?.toLowerCase();
        break;
    }

    // Sidebar visibility listener
    this.subscriptions.push(
      interval(800)
      .subscribe(() => {
        const isHidden: boolean = (this.sidepanel?.createOrganizationType === 'hidden');
        const hasMode: boolean = (this.createMode || this.editMode || this.viewMode);
        if(isHidden && hasMode) {

          if(this.createMode) {
            this.categorySubject.next({...this.prevCategoryConfig, page: 1});
          } else if (this.editMode) {
            this.categorySubject.next(this.prevCategoryConfig);
          }

          this.viewMode = false;
          this.editMode = false;
          this.createMode = false;
        }
      })
    );
  }

  initTableConfig = () => {

    this.tableFilterConfig = [{
      name: 'name',
      title: `${this.categoryName}_name`?.toLowerCase(),
      type: FilterType.TEXT
    }, {
      name: 'is_enabled',
      title: 'status',
      type: FilterType.SELECT,
      options: [
        { name: 'active', value: true },
        { name: 'inactive', value: false },
      ]
    }, {
      name: 'date_range',
      title: 'date_updated_range',
      type: FilterType.DATEPICKER
    }];

    this.tableHeaderConfig = {
      title: this.pageTitle,
      searchAllowed: true,
      showAddBtn: true,
      advanceFilter: true,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'view', linkIcon: 'visibility', method: this.onViewClicked },
      { linkName: 'edit', linkIcon: 'edit', method: this.onEditClicked }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = this.fetchColumnConfig;
    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: `No ${this.categoryName} Organization Found`,
      actionLinks
    };
  }

  get categoryName(): string {
    let term: string = '';
    switch(this.orgType) {
      case 'client':
        term = 'Client';
        break;
      case 'msp':
        term = 'MSP';
        break;
      case 'vendor':
        term = 'Vendor';
        break;
    }

    return term;
  }

  get fetchColumnConfig(): Array <IColoumnDefinition> {

    let result: Array <IColoumnDefinition> = [
      { field: 'name', header: 'msp_name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'total_programs', header: 'no_of_programs', width: 6, order: 2, sortable: true },
      { field: 'contacts', header: 'contacts', width: 6, order: 3, sortable: false, templateRef: this.contactsTemplate },
      { field: 'modified_on', header: 'created_date', width: 6, order: 4, sortable: true, type: ColumnType.DATE },
      { field: 'status', header: 'status', width: 6, order: 5, sortable: true, templateRef: this.statusTemplate },
    ];
    
    if(this.orgType === 'client' || this.orgType === 'vendor') {
      result = [
        { field: 'name', header: `${this.categoryName}_name`?.toLowerCase(), width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
        // { field: 'ref_id', header: 'Id', width: 6, order: 2, sortable: true },
        { field: 'total_programs', header: 'no_of_programs', width: 6, order: 2, sortable: true },
        { field: 'contacts', header: 'contacts', width: 6, order: 3, sortable: false, templateRef: this.contactsTemplate },
        { field: 'modified_on', header: 'created_date', width: 4, order: 5, sortable: true, type: ColumnType.DATE },
        { field: 'status', header: 'status', width: 6, order: 5, sortable: true, templateRef: this.statusTemplate },
      ];
    }

    return result;
  }

  onAddClicked = (evt: any) => {
    if(evt) {
      this.createMode = true;
      this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, true,));
    }
  }

  onViewClicked = (evt: any) => {
    if(!!evt) {
      this.viewMode = true;
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.ORG_VIEW, obj));
    }
  }

  onEditClicked = (evt: any) => {
    if(evt?.id) {
      this.editMode = true;
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.ORG_EDIT, obj));    
    }
  }

  onSearch = (term: string) => {
    this.categorySubject.next({term, page: 1});
  }

  onAdvanceFilter = (evt: any) => {
    if(!evt) {
      this.filterPayload = null;
    } else {
      this.filterPayload = {};
      if(this.orgType) {
        this.filterPayload['categories'] = [this.orgType.toUpperCase()];
      }
      if(evt?.name) {
        this.filterPayload['name'] = evt.name;
      }
      if(typeof(evt?.is_enabled) === 'boolean') {
        this.filterPayload['is_enabled'] = evt.is_enabled;
      }
      if(evt?.date_range) {
        this.filterPayload['date_range'] = evt.date_range;
      }
    }

    this.categorySubject.next({ ...this.prevCategoryConfig, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.categorySubject.next({ ...this.prevCategoryConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.categorySubject.next({ ...this.prevCategoryConfig, page: 1 });
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
