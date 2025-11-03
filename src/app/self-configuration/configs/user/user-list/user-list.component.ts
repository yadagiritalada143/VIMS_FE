import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged, groupBy, mergeMap, switchMap, throttleTime } from 'rxjs/operators';
import { forkJoin, Observable, of, Subject, Subscription, lastValueFrom } from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { IAdvanceFilterConfig, ITableHeaderConfig, ITablePaginationConfig, IColoumnDefinition, FilterType, IActionLinks, ITableOptions } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  public request: any = {};
  public vmsData: any = [];
  public editData: any;
  public viewData: any;
  public viewclick: any;
  public editClick: any;
  public list_or_create: boolean = true;
  public createUser = "hidden";
  public showremoveDoNotRehire = 'hidden';
  public rehireData: any;
  public userType: string = null;
  // public reassignUserStatus: string = '';
  public status : string = ''
  public do_not_rehire: boolean = false
  public doNotRehireValue: any = "Do Not Rehire"

  searchTerm: any;
  createRole = "hidden";
  org_catgrs = [
    { name: 'SimplifyVMS', value: 'SUPER_ORG' },
    { name: 'Client', value: 'CLIENT' },
    { name: 'Vendor', value: 'VENDOR' },
    { name: 'Worker', value: 'CANDIDATE' },
    { name: 'MSP', value: 'MSP' }
  ];


  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  public tableOptions: ITableOptions;

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', { static: true }) statusTemplate: TemplateRef<any>;
  @ViewChild('reassignTemplate', { static: true }) reassignTemplate: TemplateRef<any>;
  @ViewChild('showData', { static: true }) showData: TemplateRef<void>;

  private subscriptions: Array<Subscription> = [];
  private editClickSubject: Subject<any> = new Subject<any>();
  private filterSubject: Subject<any> = new Subject<any>();

  public filterUserList: Array<any> = [];
  public filterManagerList: Array<any> = [];
  public filterUserRoleList: Array<any> = [];
  public advancedFilterQuery: any = null;
  public reassignUser: any = null;
  public userInfo: any = {}
  public permission : boolean = false
  public progress ='Reassigning of items is in Progress';
  public failed = 'Reassigned items are Failed'

  initTableConfig() {
    this.tableFilterConfig = [
      {
        name: 'full_name',
        title: 'full_name',
        placeholder: 'Filter Program User',
        type: FilterType.MULTISELECT,
        options: this.filterUserList,
        onSearch: this.updateFilterList,
        advanceFilter: false,
        loading: true,
      }, {
        name: 'supervisor.full_name',
        title: 'supervisor.full_name',
        placeholder: 'Filter by Reporting Manager',
        type: FilterType.MULTISELECT,
        options: this.filterManagerList,
        advanceFilter: false,
        loading: true,
        onSearch: this.updateManagerList
      }, {
        name: 'role.organization_category',
        title: 'role.organization_category',
        placeholder: 'Select Organization Category',
        advanceFilter: false,
        type: FilterType.MULTISELECT,
        options: this.org_catgrs
      }, {
        name: 'role.name',
        title: 'role.name',
        placeholder: 'Select User Role',
        type: FilterType.MULTISELECT,
        options: this.filterUserRoleList,
        advanceFilter: false,
        loading: true,
        onSearch: this.searchUserRole
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        advanceFilter: false,
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }, {
        name: 'do_not_rehire',
        title: 'Do Not Rehire',
        placeholder: 'Do Not Rehire',
        type: FilterType.SELECT,
        advanceFilter: true,
        options: [
          { name: 'Yes', value: true },
          { name: 'No', value: false }
        ]
      },
    ];

    this.tableHeaderConfig = {
      title: 'Program Users',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('user_manage'),
      advanceFilter: true,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onListFilter,
      clearFilters: this.refreshTable,
      createButtonTitle: 'Create New'
    };

    // Action Links
    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, linkIcon: 'visibility', hide: !this.authService.authorize('user_view') },
      { linkName: 'Edit', method: this.onEditClick, linkIcon: 'edit', hide: !this.authService.authorize('user_manage')  },
      { linkName: 'Enable/Disable', method: this.disableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('user_manage') },
      { linkName: 'Reassign Items', method: this.reassignClicked, linkIcon: 'label_off', hide: true },
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords
    };


    this.tableColumnConfig = [
      { field: 'full_name', header: 'Name', width: 15, primary: true, order: 1, sortable: true, templateRef: this.reassignTemplate,secondaryIconUrl: 'more_horiz',secondaryIconField: 'true' ,showActionLinkForTemplate: true},
      { field: 'role.name', header: 'User Role', width: 15, order: 3, sortable: false },
      { field: 'role.organization_category', header: 'Organization Category', templateRef: this.showData, width: 15, order: 4, sortable: false },
      { field: 'supervisor.full_name', header: 'Reporting manager', width: 15, order: 5, sortable: false },
      { field: 'is_enabled', header: 'Status', width: 15, templateRef: this.statusTemplate, order: 2, sortable: false },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Program User Found",
      actionLinks: actionLinks,
      enableColumnFilter: true,
      linksValidatorFn: this.validateDropdown
    };
  }

  constructor(
    public userService: UserService,
    private _alert: AlertService,
    private eventStream: EventStreamService,
    private localStorage: StorageService,
    private route: ActivatedRoute,
    private _loader: LoaderService,
    private router: SvmsRouterService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) {
    this.permission = !this.authService.authorize('reassign_items')
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        if (param.get('add') !== 'add' && param.get('add') !== 'view') {
          this.loadAndViewEdit(param.get('add'), 'edit');
        } else if (param.get('add') === 'view') {
          this.loadAndViewEdit(param.get('id'), 'view');
        }
      }
    });

    this.initTableConfig();
    setTimeout(() => {
      this.tableOptions.headerConfig.searchAllowed = true;
    }, 0);

    this.getAttachedUserRoleList();
  }

  validateDropdown = (links: Array <IActionLinks>, data: any) => {
    const permission = !this.authService.authorize('reassign_items') 
    const userType = this.localStorage.get('user_type')
    if((data?.organization?.category.toLowerCase() == 'client' ||data?.organization?.category.toLowerCase() == 'msp' ) && !permission && (userType.toLowerCase() == 'msp' || userType.toLowerCase() =='client' || userType.toLowerCase() == 'super_org')) {
      links[3].hide = false;
    } else {
      links[3].hide = true
    }
  }

  loadAndViewEdit(userId, vieworEdit) {
    this.userService.get(`/profile-manager/users/${userId}`)
      .subscribe((res: any) => {
        const { user } = res;
        if (vieworEdit === 'edit') {
          this.onEditClick(user);
        } else {
          this.onClickView(user);
        }
      });
  }

  ngOnInit(): void {

    this.userType = this.localStorage.get(StorageKeys.USER_TYPE);

    switch (this.userType.toLowerCase()) {
      case 'msp': this.org_catgrs = [
        { name: 'MSP', value: 'MSP' },
        { name: 'Client', value: 'CLIENT' },
        { name: 'Vendor', value: 'VENDOR' },
        { name: 'Worker', value: 'CANDIDATE' }
      ];
        break;
      case 'client': this.org_catgrs = [
        { name: 'MSP', value: 'MSP' },
        { name: 'Client', value: 'CLIENT' },
        { name: 'Vendor', value: 'VENDOR' },
        { name: 'Worker', value: 'CANDIDATE' }
      ];
        break;
      case 'vendor': this.org_catgrs = [
        { name: 'Vendor', value: 'VENDOR' },
        { name: 'Worker', value: 'CANDIDATE' }
      ];
        break;
      case 'candidate': this.org_catgrs = [
        { name: 'Worker', value: 'CANDIDATE' }
      ];
        break;
      default: this.org_catgrs = [
        { name: 'SimplifyVMS', value: 'SUPER_ORG' },
        { name: 'MSP', value: 'MSP' },
        { name: 'Client', value: 'CLIENT' },
        { name: 'Vendor', value: 'VENDOR' },
        { name: 'Worker', value: 'CANDIDATE' }
      ];
    }

    // Filter functionality for program user
    this.eventStream.on(Events.FILTER_PROGRAM_USER)
      .subscribe((res: any) => {
        const { term, name } = res;
        this.filterSubject.next({
          term, user: name
        });
      });



    this.getUsers();
    

    this.subscriptions.push(
      this.editClickSubject
        .pipe(
          throttleTime(4800),
          switchMap((event: any) => {
            const url = `/configurator/programs/${this.programId}/members/${event.id}?show_candidate_as_worker=true`;
            return this.userService.get(url);
          })
        ).subscribe((data: any) => {
          if (data?.member) {
            this.createUserToggle('visible');
            this.editData = data.member;
          }
        }
        )
    );

    // Advance filter processing
    this.subscriptions.push(
      this.filterSubject.pipe(
        distinctUntilChanged((prev: any, curr: any) => {
          return (prev?.user === curr?.user) && (prev?.term === curr?.term);
        }),
        groupBy((evt: any) => evt?.user),
        mergeMap((group$) => group$.pipe(
          debounceTime(400),
          switchMap((query: any) => {

            let { term, user } = query;
            if (!user)
              user = '';

            if (user === 'supervisor_id') {
              return forkJoin([this.supervisorObservable(term), of(user)]);
            }

            if (user === 'name')
              this.tableFilterConfig[0].loading = false;

            return forkJoin([this.programUserObservable(term), of(user)]);
          })
        ))
      ).subscribe({
        next: (res: any) => {
          if (res && (res.length > 1)) {

            let result: any = res[0];
            let type: string = res[1];

            // Supervisors
            if (type === 'supervisor_id') {
              if (result?.members) {

                result = result.members.map(res => {
                  return {
                    name: res.full_name,
                    value: res.id
                  }
                });

                this.tableFilterConfig[1].options = result;
                this.tableFilterConfig[1].loading = false;
              }
            }

            // Others
            if (result?.members) {
              this.filterUserList = result.members.map(node => {
                return {
                  name: node.full_name,
                  value: node.id
                };
              });

              this.tableFilterConfig[0].options = this.filterUserList;
              if (type === 'name')
                this.tableFilterConfig[0].loading = false;
            }
          }
        }, error: (err: any) => {
          console.error(err);
          this._alert.error('Error encountered while fetching entries!');
          this.tableFilterConfig[0].loading = false;
          this.tableFilterConfig[1].loading = false;
        }
      })
    );

    this.filterSubject.next({ term: '', user: 'supervisor_id' });
    this.filterSubject.next({ term: '', user: 'name' });
  }

  getAttachedUserRoleList = async () => {


    let url: string = `/configurator/programs/${this.programId}/roles`;
    let role: string = this.localStorage.get(StorageKeys.USER_TYPE);

    // User role filter
    if (role) {

      if (role.toLowerCase().includes('super'))
        url += `?org_category=SVMS,MSP,CLIENT,VENDOR`;

      else if (role.toLowerCase().includes('msp'))
        url += `?org_category=MSP,CLIENT,VENDOR`;

      else if (role.toLowerCase().includes('client'))
        url += `?org_category=MSP,CLIENT,VENDOR`;

      else if (role.toLowerCase().includes('vendor'))
        url += '?org_category=VENDOR';

    }

    this.userService.get(url).subscribe({
      next: (res: any) => {
        if(Array.isArray(res?.roles)) {
          this.filterUserRoleList = res.roles
            .filter((role: any) => parseInt(role.total_users) > 0)
            .map((role: any) => {
              return {
                name: role.name,
                value: role.id
              };
            })

        }

        this.tableFilterConfig[3].options = this.filterUserRoleList;
        this.tableFilterConfig[3].loading = false;

      }, error: (err: any) => {
        this._alert.error(errorHandler(err));
        this.tableFilterConfig[3].loading = false;
      }
    })
  }

  onListFilter = (evt) => {
    let advanced = false;
    let keys = [];
    if (!evt) {
      this.advancedFilterQuery = null;
      this.getUsers();
      return;
    }

    else{
      keys = Object.keys(evt);
      keys.forEach((key: any) => {
        if(key!='is_enabled'){
          if(evt[key].length>0){
            advanced=true;
          }else{
            if(keys.includes('do_not_rehire')){
              advanced = true;
            }
          }
        }
      })
    }
    if(advanced || keys.includes('is_enabled')){
      this.advancedFilterQuery = evt;
      this.getAdvancedFilterUsers();
    }
    else{
      this.vmsTable.onClearColumnFilter();
      this.advancedFilterQuery = null;
      this.getUsers();
    }

  }

  refreshTable = () => {
    this.getUsers();
  }

  disableClicked = (event) => {
    this.do_not_rehire = false;
    if (!event)
      return;

    if (event?.organization === null) {
      this._alert.error("Member Not Attached To Any Organization");
      return;
    }

    let orgId = event?.organization?.id;
    let memId = event.id;

    this._loader.show()
    this.userService.updateUser(`/configurator/organizations/${orgId}/members/${memId}`, {
      "first_name": event['first_name'],
      "last_name": event['last_name'],
      "is_enabled": !event.is_enabled,
    })
      .subscribe({
        next: (data: any) => {
          this._loader.hide();
          event.is_enabled = !event.is_enabled;
          this._alert.success(`User ${event.is_enabled ? 'enabled' : 'disabled'} successfully`);
        }, error: (error: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(error));
        }
      }
      );
  }

  reassignClicked = (event) => {
    // if(event?.reassign_status?.length > 0){
     this.userInfo['memberId'] =event?.id
    //  this.reassignUserDetails(event)
     this.userInfo['fullName'] =event?.full_name
     this.userInfo['inProgress']=''
     this.reassignUser = true
    this.userInfo['org_category']=event?.organization?.category

  }
  reasignUserStatus(data: any){
    this.userInfo['memberId']=data?.id
    this.userInfo['fullName'] =data?.full_name
    this.userInfo['inProgress']='inprogress'
    // this.reassignUserDetails(data)
    this.reassignUser = true
  }

  getAdvancedFilterUsers(pageNo = 1) {
    this.do_not_rehire = false;

    const url = `/configurator/programs/${this.programId}/members/advanced-filters?show_candidate_as_worker=true`;
    const filter = this.advancedFilterQuery;
    const payload: any = {
      pagination: {
        "limit": this.itemsPerPage,
        "page": pageNo
      }, filters: {}
    };

    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      payload['filters']['org_id'] = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    }

    if(typeof(filter?.is_enabled) === 'boolean') {
      payload['filters']['is_enabled'] = filter?.is_enabled;
    }

    if (Array.isArray(filter?.['role.name'])) {
      payload.filters.role_id = filter['role.name'];
    }
  
    if(Array.isArray(filter?.['role.organization_category'])) {
      payload.filters.org_category = filter['role.organization_category'];
    }

    if(Array.isArray(filter?.['full_name'])) {
      payload.filters.name = filter['full_name'];
    }
    
    if(Array.isArray(filter?.['supervisor.full_name'])) {
      payload.filters.supervisor_id = filter?.['supervisor.full_name'];
    }

    if(typeof(filter?.do_not_rehire) === 'boolean') {
      payload.filters.is_do_not_rehire = filter.do_not_rehire;
      payload.filters.org_category = ["CANDIDATE"]
      if(payload.filters.is_do_not_rehire){
        this.do_not_rehire = true
      }
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if (Array.isArray(hierarchies)) {
        let hierarchy_ids: Array<string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        payload['filters'] = {
          ...payload['filters'],
          hierarchy_ids,
          h_children: true
        }
      }
    }

    this._loader.show();
    this.userService.post(url, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            data?.members.forEach(element => {

              // User name
              element.full_name = '';
              if (element.first_name) {
                element.full_name += element.first_name;
              }
              if (element.last_name) {
                element.full_name += (" " + element.last_name);
              }

              // Supervisor Name
              if (element.supervisor === null) {
                element.supervisor = {
                  full_name: '-'
                }
              } else if (!element.supervisor.full_name) {
                element.supervisor.full_name = '-';
              }

            });
            data?.members.forEach((status) => {
              if(status?.reassign_status?.filter(n => n?.status.toLowerCase() == 'inprogress').length > 0){
                status['status'] = 'inprogress'
              }else if(status?.reassign_status?.filter(n => n?.status.toLowerCase() == 'failure').length > 0){
                status['status']= 'failed'
              }else{
                status['status']='completed'
              }
            })
            this.vmsData = data?.members;
            this.totalRecords = data?.total_records;
            this.itemsPerPage = data?.items_per_page;
            this._loader.hide();

          }
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
          this._loader.hide();
        }
      }
      );
  }

  getUsers(pageNo = 1) {
    this.do_not_rehire = false;
    // Advanced filter active
    if (this.advancedFilterQuery) {
      this.getAdvancedFilterUsers(pageNo);
      return;
    }

    if (pageNo === 1) {
      this._loader.show();
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=10&show_candidate_as_worker=true&page=${pageNo}`;

    if (this.searchTerm)
      url += `&k=${this.searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }

    this.userService.get(url).subscribe({
      next: (data: any) => {
        data?.members?.forEach(element => {
          if(element?.reassign_status?.filter(n => n.status?.toLowerCase() == 'inprogress').length > 0){
            element['status'] = 'inprogress'
          }else if(element?.reassign_status?.filter(n => n.status?.toLowerCase() == 'failure').length > 0){
            element['status']= 'failed'
          }else{
            element['status']='completed'
          }
          if (element.supervisor === null) {
            element.supervisor = {
              full_name: '-'
            }
          } else if (!element.supervisor.full_name) {
            element.supervisor.full_name = '-';
          }
        });
        this.vmsData = data?.members;


        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this._loader.hide();

      }, error: (error: Error) => {
        console.error(error);
      }, complete: () => {
        this._loader.hide();
      }
    });
  }

  removeDoNotRehire = (event) => {
    this.rehireData = event;
    this.showremoveDoNotRehire = 'visible';
    this.rehireToggle('visible');
  }

  rehireToggle = (event: any) => {
    if (event === 'hidden') {
      this.rehireData = null;
      this.showremoveDoNotRehire = 'hidden';
    }
    this.showremoveDoNotRehire = event;
  }

  onChangeRecords = (records: any) => {
    this.itemsPerPage = records;
    this.getUsers();
  }

  onCreateClick = (event) => {
    this.viewData = event;
    this.createUserToggle('visible');
    this.editClick = false;
    this.editData = null;
  }

  createUserToggle = (event: any) => {
    if (event === 'hidden') {
      this.editData = null;
    }
    this.createUser = event;
  }

  updateFilterList = ({term}) => {
    this.do_not_rehire = false;
    let searchTerm = ''
    if (term) {
      searchTerm = (term || '')?.split('+')?.join('%2B');
    } else {
      searchTerm = "";
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=20&page=1&show_candidate_as_worker=true`;
    if (searchTerm || searchTerm == "")
      url += `&k=${searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }
    this.tableFilterConfig[0].loading = true;
    this.userService.get(url).subscribe({
      next: (data: any) => {
        if (data?.members) {
          this.filterUserList = data.members.map(node => {
            return {
              name: node.full_name,
              value: node.id
            };
          });
          this.tableFilterConfig[0].options = []
          this.tableFilterConfig[0].options = this.filterUserList;
        }
        this.tableFilterConfig[0].loading = false;
      }, error: (error: any) => {
        console.error(error);
        this._alert.error(errorHandler(error));
        this.tableFilterConfig[0].loading = false;
      }, complete: () => {
        this.tableFilterConfig[0].loading = false;
      }
    });
  }

  updateManagerList = ({term}) => {
    this.do_not_rehire = false;
    let searchTerm = '';
    if (term) {
      searchTerm = (term || '')?.split('+')?.join('%2B');
    } else {
      searchTerm = "";
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=20&page=1&show_candidate_as_worker=true`;
    if (searchTerm || searchTerm == "")
      url += `&k=${searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }

    this.tableFilterConfig[1].loading = true;
    this.userService.get(url).subscribe({
      next: (data: any) => {
        if (data?.members) {
          this.filterManagerList = data.members.map(node => {
            return {
              name: node.full_name,
              value: node.id
            };
          });
          this.tableFilterConfig[1].options = []
          this.tableFilterConfig[1].options = this.filterManagerList;
        }
        this.tableFilterConfig[1].loading = false;
      }, error: (error: any) => {
        console.error(error);
        this._alert.error(errorHandler(error));
        this.tableFilterConfig[1].loading = false;
      }, complete: () => {
        this.tableFilterConfig[1].loading = false;
      }
    });
  }

  searchUserRole = ({term}) => {
    let searchTerm = ''
    if (term) {
      searchTerm = (term || '')?.split('+')?.join('%2B');
    } else {
      searchTerm = "";
    }

    let url = `/configurator/programs/${this.programId}/roles?page=1&k=${term}`;

    this.tableFilterConfig[3].loading = true;
    this.userService.get(url).subscribe({
      next: (data: any) => {
        if (data?.roles) {
          this.filterUserRoleList = data.roles.map(node => {
            return {
              name: node.name,
              value: node.id
            };
          });
          this.tableFilterConfig[3].options = [];
          this.tableFilterConfig[3].options = this.filterUserRoleList;
        }
        this.tableFilterConfig[3].loading = false;
      }, error: (error: any) => {
        console.error(error);
        this._alert.error(errorHandler(error));
        this.tableFilterConfig[3].loading = false;
      }, complete: () => {
        this.tableFilterConfig[3].loading = false;
      }
    });
  }

  onSearch = (event: string) => {
    this.do_not_rehire = false;
    if (event) {
      this.searchTerm = event?.split('+')?.join('%2B');
    } else {
      this.searchTerm = "";
    }

    let pageNo = 1;
    if (pageNo) {
      this._loader.show();
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=10&page=${pageNo}&show_candidate_as_worker=true`;
    if (this.searchTerm)
      url += `&k=${this.searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }

    this.userService.get(url).subscribe({
      next: (data: any) => {
        data?.members?.forEach(element => {
          if(element?.reassign_status?.filter(n => n.status?.toLowerCase() == 'inprogress').length > 0){
            element['status'] = 'inprogress'
          }else if(element?.reassign_status?.filter(n => n?.status?.toLowerCase() == 'failure').length > 0){
            element['status']= 'failed'
          }else{
            element['status']='completed'
          }
        })
        this.vmsData = data?.members;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this._loader.hide();
      }, error: (error: any) => {
        console.error(error);
        this._alert.error(errorHandler(error));
        this._loader.hide();
      }
    });
  }

  private supervisorObservable(term: string): Observable<any> {
    this.do_not_rehire = false;
    let payload: any = {
      "filters": {
        is_supervisor: true,
        name_search: term
      },
      "pagination": {
        "limit": 10,
        "page": 1
      }
    };

    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      payload['filters']['org_id'] = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if (Array.isArray(hierarchies)) {
        let hierarchy_ids: Array<string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        payload['filters'] = {
          ...payload['filters'],
          hierarchy_ids,
          h_children: true
        }
      }
    }

    let url: string = `/configurator/programs/${this.programId}/members/advanced-filters`;
    this.tableFilterConfig[1].loading = false;
    return this.userService.post(url, payload);
  }

  private programUserObservable(term: string): Observable<any> {
    this.do_not_rehire = false;
    let url: string = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=20&show_candidate_as_worker=true&page=1${term ? '&name=' + term : ''}`;
    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if (this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }

    return this.userService.get(url);
  }

  onCloseCreateUser(event) {
    this.viewclick = false;
    this.getUsers();
    this.editData = "";
    this.viewData = event;
  }

  onEditClick = (event) => {
    if (event)
      this.editClickSubject.next(event);
    event.id ? this.editClick = true : this.editClick = false;
  }

  onClickView = (event) => {
        if ("organization_id" in event)
      return;
    if (event?.organization === null) {
      this._alert.error("Member Not Attached To Any Organization Cannot View Profile");
      return;
    }
    this.onCreateClick(event);
    event.id ? this.viewclick = true : this.viewclick = false;

    this.localStorage.set("PROFILE_PROGRAM_ID", this.programId, true);
    this.localStorage.set("PROFILE_ORG_ID", event?.organization?.id, true);
    this.localStorage.set("PROFILE_ORG_CATEGORY", event?.role?.organization_category, true);
    this.router.navigate(['users', 'profile-view', event.id]);

  }

  // toggleValue(value:any) {
  //   this.request = value;
  // }

  // onClickOpenReassignModal(event) {
  //   if(event) {
  //     this.eventStream.emit(new EmitEvent(Events.REASSIGN_TASK, this.request));
  //   }
  // }

  handleUpdate() {
    this.getUsers();
  }

  onPaginationClick = (event) => {
    this.getUsers(event)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if(this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if(this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  closeReassignModel(){
    this.reassignUser = false;
    this.getUsers(1)
  }
  // onHoverEnter(data){
  //  this.reassignUserDetails(data)
  // }
  //  reassignUserDetails(data){
  //   let inProgress = data?.reassign_status?.filter(n => n.status.toLowerCase() == "inprogress")
  //   let failed = data?.reassign_status?.filter(n => n.status.toLowerCase() == "failure")
  //   let status = ''
  //   if(inProgress.length > 0){
  //     status = 'Progress'
  //     this.reassignUserStatus = `Reassigning of items is in ${status}`
  //   }else if(failed.length > 0){
  //     status = 'Failed'
  //     this.reassignUserStatus = `Reassigned items are ${status}`
  //   }else{
  //     status = 'Completed'
  //   }
  // }

  get programId(): string {
    return this.localStorage.get(StorageKeys.PROGRAM_ID);
  }
}
