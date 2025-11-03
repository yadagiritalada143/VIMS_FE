import { Component, EventEmitter, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-user-role-listing',
  templateUrl: './user-role-listing.component.html',
  styleUrls: ['./user-role-listing.component.scss']
})
export class UserRoleListingComponent implements OnInit {

  private subscriptions: Subscription[] = [];
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;

  public modalVisibility: boolean = false;
  public modalInputText: string = '';
  public modalStore: any = {};

  public itemPerPage = 10;
  public totalRecords = 0;
  public isExpand = false;
  public orgId: string;
  public programId: string;
  public dataLoading = true;
  public createRole = "hidden";
  public usersAssigned = "hidden";
  public roleName: string = "";
  public roleId: string = "";
  public list_or_create: boolean = true;
  public vmsData: any;
  public vmsUserAssigned: any;
  public tableLoaded = false;
  public users: any;
  public title = 'Add User Role';
  public pageNo: any;
  public readOnly = false;
  public searchTerm = '';
  public userType: string = null;
  public advancedFilterQuery: any = null;
  public onClose = new EventEmitter();

  org_catgrs = [
    { name: 'Client', value: 'CLIENT' },
    { name: 'Vendor', value: 'VENDOR' },
    { name: 'MSP', value: 'MSP' }
  ];

  types = [
    {name: 'Custom', value: 'CUSTOM'},
    {name: 'System', value: 'SYSTEM'}
  ];


  private searchRoleSub: Subject<any> = new Subject<any>();
  @ViewChild('statusTemplate',{static:true}) statusTemplate: TemplateRef<void>;
  @ViewChild('showData',{static:true}) showData: TemplateRef<void>;
  @ViewChild('activeBadge',{static:true}) activeBadge: TemplateRef<void>;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig:ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        type: FilterType.TEXT,
        placeholder: 'Filter by User Role'
      },
      {
        name: 'source',
        title: 'source',
        placeholder: 'Select Type',
        type: FilterType.SELECT,
        options: this.types
      },
      {
        name: 'organization_category',
        title: 'organization_category',
        placeholder: 'Select Organization Category',
        type: FilterType.MULTISELECT,
        options: this.org_catgrs
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
      }
    ];

    this.tableHeaderConfig = {
      title: 'User Roles',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('user_role_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
      clearFilters: this.reshreshTable
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView , linkIcon: 'visibility', hide: !this.authService.authorize('user_role_view') },
      { linkName: 'Clone', method: this.onCloneClicked, linkIcon: 'content_copy', hide: !this.authService.authorize('user_role_manage') },
      { linkName: 'Edit', method: this.onEditClick ,linkIcon: 'edit', hide: !this.authService.authorize('user_role_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked ,linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('user_role_manage') },
      // { linkName: 'Delete', method: this.onDeleteClick, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('user_role_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination:this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage:10,
      recordsPerPageSetting:[10,25,50,100]
    }

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 30, primary: true,order:1, sortable: true, onClick: this.onClickView },
      // { field: 'source', header: 'Type',templateRef: this.showData,  width: 30,order:3, sortable: true },    ---> commented due to ticket - V2M-25905
      { field: 'organization_category', header: 'Organization Category', templateRef: this.showData, width: 20,order:4, sortable: true },
      { field: 'total_users', header: 'Users Assigned', templateRef: this.activeBadge, width: 20,order:5, sortable: true },
      { field: 'is_enabled', header: 'Status', width: 15,order:2,templateRef: this.statusTemplate, sortable: false },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination:true,
      paginationConfig:this.tablePaginationConfig,
      linksValidatorFn: this.roleListValidator,
      noDataMessage:"No Records Found",
      actionLinks:actionLinks,
      enableColumnFilter: true,
    };
  };



  constructor(
    private _alert: AlertService,
    public userService: UserService,
    private localStorage: StorageService,
    private _loader: LoaderService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.userType = this.localStorage.get("user_type");
    switch(this.userType.toLowerCase()) {
      case 'msp': this.org_catgrs = [
                    { name: 'MSP', value: 'MSP' },
                    { name: 'Client', value: 'CLIENT' },
                    { name: 'Vendor', value: 'VENDOR' }
                  ];
                  break;
      case 'client': this.org_catgrs = [
                      { name: 'Client', value: 'CLIENT' }
                    ];
                    break;
      case 'vendor': this.org_catgrs = [
                      { name: 'Vendor', value: 'VENDOR' }
                    ];
                    break;
      default: this.org_catgrs = [
                  { name: 'MSP', value: 'MSP' },
                  { name: 'Client', value: 'CLIENT' },
                  { name: 'Vendor', value: 'VENDOR' }
                ];

    }
    this.initalizeTableConfigs();
    this.tableOptions.headerConfig.advanceFilterConfig[2].options = this.org_catgrs;
    this.orgId = this.localStorage.get("ORG_ID");
    this.getRoleList();
    this.subscriptions.push(this.eventStream.on(Events.ROLE_LIST_REFRESH)
    .subscribe((data) => {
      if(data) {
        this.getRoleList();
      }
    }))
    this.subscriptions.push(this.eventStream.on(Events.ROLE_SEARCH)
    .subscribe((data) => {
      if(data == 'clear') {
        this.searchTerm = '';
        this.getRoleList();
      }
    }))
    this.searchRoleSub
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.getRoleList();
      })
  }

  roleListValidator = (actionLinks: Array<IActionLinks>, rowData: any) => {
    const editIndex = actionLinks?.findIndex(x => x?.linkName == 'Edit');
    const enableDisableIndex = actionLinks?.findIndex(x => x?.linkName == 'Enable/Disable');
    if (rowData?.only_permissions_editable) {
      actionLinks[editIndex].hide = false;
      actionLinks[editIndex].disable = false;
      actionLinks[enableDisableIndex].hide = true;
    } else if (!rowData?.is_editable) {
      actionLinks[editIndex].hide = false;
      actionLinks[editIndex].disable = true;
      actionLinks[enableDisableIndex].hide = true;
    } else if (rowData?.organization_category.toLowerCase() == 'worker' || rowData?.organization_category.toLowerCase() == 'candidate') {
      actionLinks[editIndex].hide = true;
      actionLinks[editIndex].disable = false;
      actionLinks[enableDisableIndex].hide = true;
    } else {
      if (this.authService.authorize('user_role_manage')) {
        actionLinks[editIndex].hide = false;
        actionLinks[editIndex].disable = false;
        actionLinks[enableDisableIndex].hide = false;
      }
    }
  }

  getRoleList = (pageNo = 1) => {
    if (this.advancedFilterQuery) {
      this.getAdvancedFilterUsers(pageNo);
      return;
    }
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.pageNo = pageNo;
    this.userService.getAllRoleList(this.programId, pageNo, this.itemPerPage, this.searchTerm)
      .subscribe({
        next: (data: any) => {
          this.vmsData = data.roles.map(roles => roles.organization_category == "CANDIDATE" ? { ...roles, organization_category: "WORKER" } : roles);
          this.totalRecords = data.total_records;
          this.itemPerPage = data?.items_per_page;
          this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
          this.tableOptions.totalRecords = this.totalRecords;
          this.tableLoaded = true;
          this._loader.hide();
        }, error: (error: Error | any) => {
          this._alert.error(errorHandler(error), {});
          this._loader.hide();
        }, complete: () => {
          this.dataLoading = false;
          this._loader.hide();
        }
      }
    );
  }

  onPaginationClick = (event: any) => {
    this.getRoleList(event);
  }

  onClickView = (event: any) => {
    if (event) {
      this.programService.get(`/configurator/programs/${this.programId}/roles/${event.id}`)
        .subscribe({
          next: (res: any) => {
            if (res && res.role) {
              this.eventStream.emit(new EmitEvent(Events.VIEW_USER_ROLE, { ...event, ...res.role }));
            }
          }, error: (err: Error | any) => {
            this._alert.error(errorHandler(err));
          }
        }
      )
    }
  }

  onDeleteClick = (event: any) => {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ROLE_DELETE, event));
    }
  }

  reshreshTable = () => {
    this.getRoleList();
  }

  onDisableClicked = (event: any) => {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ROLE_DISABLE, event));
    }
  }

  onCreateClick = (event: any) => {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ROLE_CREATE, true));
    }
  }

  onCloneClicked = (event: any) => {
    this.modalInputText = 'Clone of ' + event?.name;
    this.modalVisibility = true;
    this.modalStore = event;    
  }

  cloneUserRole() {

    let id: string = this.modalStore?.id;
    let name: string = this.modalInputText;

    this._loader.show();

    const url: string = `/configurator/programs/${this.programId}/roles/${id}/clone`;
    const payload: any = { name };
  
    this.programService.post(url, payload).subscribe({
      next: (data: any) => {
        this._loader.hide();
        this.resetModal();
        this._alert.success('User Role has been cloned successfully');
        this.getRoleList(1);
        if(this.vmsTable) {
          this.vmsTable.currentPage = 1;
        }
      }, error: (err: any) => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      }
    });
  }

  resetModal() {
    this.modalInputText = '';
    this.modalVisibility = false;
    this.modalStore = {};
  }

  onEditClick = (data: any) => {
    if (data) {
      const url: string = `/configurator/programs/${this.programId}/roles/${data.id}`;
      this.programService.get(url)
        .subscribe({
          next: (res: any) => {
            if (res && res.role) {
              this.eventStream.emit(new EmitEvent(Events.ROLE_EDIT, { ...data, ...res.role }));
            }
          }, error: (err: Error | any) => {
            this._alert.error(errorHandler(err));
          }
        }
      )
    }
  }

  columnClicked = (event: any) => {
    if(event) {
      this.usersAssigned = 'visible';
      const { vmsData } = event;
      if(vmsData) {
        const { id, name } = vmsData;
        this.roleName = name;
        this.roleId = id;
      }
    }
  }

  sidebarClose = () => {
    this.usersAssigned = 'hidden';
    this.onClose.emit(true);
  }

  getAdvancedFilterUsers = (pageNo = 1) => {

    const filters = this.advancedFilterQuery;
    const id = this.programId;

    let url = `/configurator/programs/${id}/roles`;
    let query = `?limit=${this.itemPerPage}&page=${pageNo}`;

    if(filters?.name && filters?.name !== ""){
      query += `&k=${filters?.name}`;
    }
    if(filters?.source && filters?.source.length > 0){
      query += `&source=${filters?.source.toString()}`;
    }
    if(filters?.organization_category && filters?.organization_category.length > 0){
      query += `&org_category=${filters?.organization_category.toString()}`;
    }
    if(filters?.is_enabled === false || filters?.is_enabled === true){
      query += `&status=${filters?.is_enabled}`;
    }

    url = url + query;
    this._loader.show();
    this.userService.get(url)
      .subscribe({
        next: (data: any) => {
          this.vmsData = data.roles.map(roles => roles.organization_category == "CANDIDATE" ? { ...roles, organization_category: "WORKER" } : roles);
          this.totalRecords = data.total_records;
          this.itemPerPage = data?.items_per_page;
          this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
          this.tableOptions.totalRecords = this.totalRecords;
          this.tableLoaded = true;
          this._loader.hide();
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err), {});
          this._loader.hide();
        }
      }
    );
  }

  onListFilter = (event: any) => {
    if(event === undefined) {
      this.advancedFilterQuery = null;
      this.getRoleList();
      return;
    }
    this.advancedFilterQuery = event;
    this.getAdvancedFilterUsers();
  }
  onSearch = (event: any) => {
    this.vmsTable.currentPage = 1;
    this.searchTerm = event;
    this.searchRoleSub.next(event);
  }

  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    this.getRoleList();
  }

  ngOnDestroy(): void {
  this.searchRoleSub.unsubscribe();
  }

}
