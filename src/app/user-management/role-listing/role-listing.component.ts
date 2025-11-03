import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subscription } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';

@Component({
  selector: 'app-role-listing',
  templateUrl: './role-listing.component.html',
  styleUrls: ['./role-listing.component.scss']
})
export class RoleListingComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Subscription[] = [];
  public tableConfig: VMSConfig;
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

  public modalVisibility: boolean = false;
  public modalInputText: string = '';
  public modalStore: any = {};

  org_catgrs = [
    { name: 'SimplifyVMS', value: 'SUPER_ORG' },
    { name: 'Client', value: 'CLIENT' },
    { name: 'Vendor', value: 'VENDOR' },
    { name: 'MSP', value: 'MSP' }
  ];

  types = [
    {name: 'Custom', value: 'CUSTOM'},
    {name: 'System', value: 'SYSTEM'}
  ];

  constructor(
    private _alert: AlertService,
    public userService: UserService,
    private accessControlService: AccessControlService,
    private localStorage: StorageService,
    private _loader: LoaderService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
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
                  { name: 'SimplifyVMS', value: 'SUPER_ORG' },
                  { name: 'MSP', value: 'MSP' },
                  { name: 'Client', value: 'CLIENT' },
                  { name: 'Vendor', value: 'VENDOR' }
                ];

    }
    this.tableConfig = {
      title: 'Program User Roles',
      isCreateButtonName: 'Add User Roles',
      columnList: [
        { name: 'name', title: 'User Role', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'source', title: 'Type', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'organization_category', title: 'Organization Category', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
        { name: 'total_users', title: 'Users Assigned', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'is_enabled', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: false,
        isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: false, isVieworClone: this.accessControlService.accessControl()},
      ],
      showTabs: true,
      isExpand: true,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'User Role', filterType: 'TEXT'},
        {
          name: 'source',
          title: 'Type',
          placeholder: 'Select Type',
          filterType: 'SELECT',
          multiSelectData: this.types
        },
        {
          name: 'organization_category',
          title: 'Organization Category',
          placeholder: 'Select Organization Category',
          filterType: 'MULTICHIP',
          multiSelectData: this.org_catgrs
        },
        {
          name: 'is_enabled',
          title: 'Status',
          placeholder: 'Select Status',
          filterType: "SELECT",
          multiSelectData: [
            { name: 'Active', value: true },
            { name: 'Inactive', value: false }
          ]
        }
      ]
    };
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
  }

  getRoleList(pageNo = 1) {
    if (this.advancedFilterQuery) {
      this.getAdvancedFilterUsers(pageNo);
      return;
    }
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.pageNo = pageNo;
    this.userService.getAllRoleList(this.programId, pageNo, 10, this.searchTerm)
      .subscribe({
        next: (data: any) => {
          this.vmsData = data.roles.map(roles => roles.organization_category == "CANDIDATE" ? { ...roles, organization_category: "WORKER" } : roles);
          this.totalRecords = data.total_records;
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

  onPaginationClick(event){
    this.getRoleList(event);
  }

  onClickView(event) {
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

  onDeleteClick(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ROLE_DELETE, event));
    }
  }

  onDisableClicked(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ROLE_DISABLE, event));
    }
  }

  onCreateClick(event){
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
        if(this.vmsTable?.currentPage) {
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

  onEditClick(data) {
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

  columnClicked(event) {
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

  sidebarClose() {
    this.usersAssigned = 'hidden';
    this.onClose.emit(true);
  }

  getAdvancedFilterUsers(pageNo = 1) {

    const filters = this.advancedFilterQuery;
    const id = this.programId;

    let url = `/configurator/programs/${id}/roles`;
    let query = `?limit=10&page=${pageNo}`;

    if(filters.name && filters.name !== ""){
      query += `&k=${filters.name}`;
    }
    if(filters.source && filters.source.length > 0){
      query += `&source=${filters.source.toString()}`;
    }
    if(filters.organization_category && filters.organization_category.length > 0){
      query += `&org_category=${filters.organization_category.toString()}`;
    }
    if(filters.is_enabled === false || filters.is_enabled === true){
      query += `&status=${filters.is_enabled}`;
    }

    url = url + query;
    this._loader.show();
    this.userService.get(url)
      .subscribe({
        next: (data: any) => {
          this.vmsData = data.roles.map(roles => roles.organization_category == "CANDIDATE" ? { ...roles, organization_category: "WORKER" } : roles);
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this._loader.hide();
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err), {});
          this._loader.hide();
        }
      }
    );
  }

  onListFilter(event: any){
    if(event === undefined) {
      this.advancedFilterQuery = null;
      this.getRoleList();
      return;
    }
    this.advancedFilterQuery = event;
    this.getAdvancedFilterUsers();
  }
  onSearch(event){
    this.searchTerm = event;
    this.getRoleList();
  }
}
