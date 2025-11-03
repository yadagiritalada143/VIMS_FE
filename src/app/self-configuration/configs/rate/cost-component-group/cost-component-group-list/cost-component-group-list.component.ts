import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ProgramService } from 'src/app/programs/program.service';


@Component({
  selector: 'app-cost-component-group-list',
  templateUrl: './cost-component-group-list.component.html',
  styleUrls: ['./cost-component-group-list.component.scss']
})
export class CostComponentGroupListComponent implements OnInit, OnDestroy {
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('statusTemplate', {static:true}) statusTemplate: TemplateRef<void>;

  public totalRecords: number = 0;
  public costComponentGroupSub: Subject<any> = new Subject<any>();
  page: any = { size: 10, number: 1 };
  subscriptions: Array <Subscription> = [];
  filter: any = {};
  programId: String;

  constructor(
    private alertService:AlertService,
    private programService: ProgramService,
    private storageService:StorageService,
    private router:SvmsRouterService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initTableConfig();
    // Cost Group template search
    this.subscriptions.push(
      this.costComponentGroupSub.pipe(
        debounceTime(400),
       ).subscribe((term:any)=>{
        this.filter.searchTerm = term;
        this.getCostComponentGroups();
       })
    )
    this.getCostComponentGroups();
  }

  initTableConfig() {
    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Search Name',
        type: FilterType.TEXT,
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
    ];

    this.tableHeaderConfig = {
      title: 'Cost Component Group',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('cost_component_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      onSearch: this.onSearch,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.tablePaginationConfig = {
      itemsPerPage: this.page.size,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Group Name', width: 25, order: 1, primary: true, sortable: true, onClick: this.onClickView },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, templateRef: this.statusTemplate, sortable: true },
    ];

    const actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('cost_component_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('cost_component_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('cost_component_manage') },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Cost Component Group found for the selected program.",
      actionLinks,
      enableColumnFilter: true
    };
  }

  getCostComponentGroups = () => {
    let query = `?limit=${this.page.size}&page=${this.page.number}`;
    if (this.filter.hasOwnProperty('is_enabled')) {
      query = `${query}&is_enabled=${this.filter?.is_enabled}`;
    }
    if (this.filter.hasOwnProperty('name')) {
      query = `${query}&name=${this.filter?.name}`;
    }
    const url = `/core-money/programs/${this.programId}/cost-component/component_groups${query}`;
    this.loader.show();
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.vmsData = data.cost_component_groups;
        this.totalRecords = data.total_records ?? this.vmsData?.length;
        this.tableOptions.totalRecords = this.totalRecords;
        this.vmsTable.currentPage = this.page.number;
        this.loader.hide();
      },
      error: (err) => {
        this.alertService.error(errorHandler(err));
        this.vmsData = new Array();
        this.loader.hide();
      }
    })
  }

  onSearch = (term) => {
    this.page.number = 1;
    this.costComponentGroupSub.next(term);
  }

  onListFilter = (event) => {
    this.page.number = 1;
    this.filter = event ?? {};
    
    if(typeof(event?.['is_enabled']) === 'boolean') {
      this.filter.is_enabled = (event?.is_enabled)?'True':'False';
    }
    
    if (event?.['category_name']) {
      this.filter.searchTerm = event['category_name'];
    } else {
      this.filter.searchTerm = '';
    }

    this.costComponentGroupSub.next(this.filter.searchTerm);
  }

  onPaginationClick = (event) => {
    this.page.number = event;
    this.getCostComponentGroups();
  }

  onItemCountChanged = (count: number) => {
    this.page.number = 1;
    this.page.size = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.getCostComponentGroups();
  }

  onClickView = (e) => {
    this.router.navigate(['rate', 'cost-component-group', 'details', e?.id]);
  }

  onCreateClick = (e) => {
    this.router.navigate(['rate', 'cost-component-group', 'create']);
  }

  onEditClick = (e) => {
    this.router.navigate(['rate', 'cost-component-group', 'edit', e?.id]);
  }

  onDisableClick = (event) => {
    const payLoad: any = {
      ...event,
      is_enabled: !event?.is_enabled 
    }
    this.loader.show();
    const url = `/core-money/programs/${this.programId}/cost-component/component_groups/${event?.id}`;
    this.programService.put(url, payLoad).subscribe({
      next: (data: any) => {
        this.loader.hide();
        event.is_enabled = !event.is_enabled;
        this.alertService.success(`Cost Component Group status updated as ${event.is_enabled ? 'enabled' : 'disabled'} successfully`);
      },
      error: error => {
        this.loader.hide();
        this.alertService.error(errorHandler(error));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub)=>{sub?.unsubscribe()});
  }

}
