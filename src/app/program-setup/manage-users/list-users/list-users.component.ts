import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { UserService } from './../../../core/services/user.service';
import { ProgramConfig } from '../../../shared/enums';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged, groupBy, mergeMap, switchMap, throttleTime } from 'rxjs/operators';
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit, OnDestroy {

  public clientId: string;
  public programId: string
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage: any;
  public editData: any;
  public viewData: any;
  public roleData: any;
  public users: any;
  public viewclick: any;
  public editClick: any;
  public formTitle: string;
  public list_or_create: boolean = true;
  public createUser = "hidden";
  public reloadPage: boolean = true;
  public showremoveDoNotRehire = 'hidden';
  public rehireData: any;
  public userType: string = null;

  dataLoading = true;
  pathname = '';
  isCreateUser = 'hidden';
  searchTerm: any;
  isSearchedFlag: boolean = false;
  createRole = "hidden";
  org_catgrs = [
    { name: 'SimplifyVMS', value: 'SUPER_ORG' },
    { name: 'Client', value: 'CLIENT' },
    { name: 'Vendor', value: 'VENDOR' },
    { name: 'Worker', value: 'CANDIDATE' },
    { name: 'MSP', value: 'MSP' }
  ];

  private subscriptions: Array <Subscription> = [];
  private editClickSubject: Subject <any> = new Subject <any> ();
  private filterSubject: Subject <any> = new Subject <any> ();

  public filterUserList: Array <any> = [];
  public advancedFilterQuery: any = null;
  public defaultSupervisorList: Array <any> = null;

  constructor (
    public userService: UserService,
    private _alert: AlertService,
    private eventStream: EventStreamService,
    private localStorage: StorageService,
    private route: ActivatedRoute,
    private _loader: LoaderService,
    private router: SvmsRouterService,
    private accessControlService: AccessControlService,
    private uniqueKeyPipe: UniqueKeyPipe
  ) {
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.isCreateUser = 'visible';
        if (param.get('add') !== 'add' && param.get('add') !== 'view') {
          this.loadAndViewEdit(param.get('add'), 'edit');
        } else if (param.get('add') === 'view') {
          this.loadAndViewEdit(param.get('id'), 'view');
        }
      }
    });
  }

  loadAndViewEdit(userId, vieworEdit) {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }
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
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }

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
        const {term, name} = res;
        this.filterSubject.next({
          term, user: name
        });
      });

    // table Configuration
    this.tableConfig = {
      title: 'Program Users',
      isCreateButtonName: 'Add User',
      columnList: [
        { name: 'full_name', title: 'Full Name', width: 15, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'role.name', title: 'User Role', width: 15, isIcon: false, isImage: false, enableClick: true, isContact: false, isNumberBadge: false },
        { name: 'role.organization_category', title: 'Organization Category', width: 15, isIcon: false, isImage: false, enableClick: true, isContact: false, isNumberBadge: false },
        { name: 'supervisor.full_name', title: 'Reporting manager', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        {
          name: 'is_enabled', title: 'Status', width: 15, isIcon: false, isImage: false,
          isContact: false, isNoOption: false, isVieworEdit: true,
          isDisableorDelete: this.accessControlService.accessControl(), isNumberBadge: false,
          isDelete: false
        }
      ],
      isDownload: false,
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        {
          name: 'name',
          title: 'Program User',
          placeholder: 'Select Program User',
          filterType: 'MULTICHIP',
          searchEvent: 'FILTER_PROGRAM_USER',
          multiSelectData: this.filterUserList,
          fieldLoading: false
        },
        {
          name: 'supervisor_id',
          title: 'Reporting Manager',
          placeholder: 'Select Reporting Manager',
          filterType: 'MULTICHIP',
          searchEvent: 'FILTER_PROGRAM_USER',
          multiSelectData: this.filterUserList,
          fieldLoading: false
        },
        {
          name: 'org_category',
          title: 'Organization Category',
          placeholder: 'Select Organization Category',
          filterType: 'MULTICHIP',
          multiSelectData: this.org_catgrs
        },
        {
          name: 'role_id',
          title: 'User Role',
          placeholder: 'Select User Role',
          filterType: 'MULTICHIP',
          multiSelectData: this.getAttachedUserRoleList()
        },
        {
          name: 'is_enabled',
          title: 'Status',
          placeholder: 'Select Status',
          filterType: "MULTISELECT",
          multiSelectData: [
            { name: 'Active', value: true },
            { name: 'Inactive', value: false }
          ]
        },
        {
          name: 'do_not_rehire',
          title: '',
          filterType: 'CHECKBOX',
        }
      ]
    };

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

            if(user === 'supervisor_id') {
              return forkJoin([this.supervisorObservable(term), of(user)]);
            }

            if (user === 'name')
              this.tableConfig.advanceFilter[0].fieldLoading = true;

            return forkJoin([this.programUserObservable(term), of(user)]);
          })
        ))
      ).subscribe({
        next: (res: any) => {
          if(res && (res.length > 1)) {

            let result: any = res[0];
            let type: string = res[1];

            // Supervisors
            if(type === 'supervisor_id') {
              if (result?.members) {

                result = result.members.map(res => {
                  return {
                    name: res.full_name,
                    value: res.id
                  }
                });

                if (this.defaultSupervisorList === null) {
                  this.defaultSupervisorList = result;
                }

                this.tableConfig.advanceFilter[1].multiSelectData = result;
                this.tableConfig.advanceFilter[1].fieldLoading = false;
              }
            }

            // Others
            if(result?.members) {
              this.filterUserList = result.members.map(node => {
                return {
                  name: node.full_name,
                  value: node.id
                };
              });

              this.tableConfig.advanceFilter[0].multiSelectData = this.filterUserList;
              if (type === 'name')
                this.tableConfig.advanceFilter[0].fieldLoading = false;
            }
          }
        }, error: (err: any) => {
          console.error(err);
          this._alert.error('Error encountered while fetching entries!');
          this.tableConfig.advanceFilter[0].fieldLoading = false;
          this.tableConfig.advanceFilter[1].fieldLoading = false;
        }
      })
    );

    this.filterSubject.next({ term: '', user: 'supervisor_id' });
    this.filterSubject.next({ term: '', user: 'name' });
  }

  getAttachedUserRoleList() {

    let result = [];
    let url: string = `/configurator/programs/${this.programId}/roles`;
    let role: string = this.localStorage.get(StorageKeys.USER_TYPE);

    // User role filter
    if(role) {

      if(role.toLowerCase().includes('super'))
        url += `?org_category=SVMS,MSP,CLIENT,VENDOR`;

      else if(role.toLowerCase().includes('msp'))
        url += `?org_category=MSP,CLIENT,VENDOR`;

      else if(role.toLowerCase().includes('client'))
        url += `?org_category=MSP,CLIENT,VENDOR`;

      else if(role.toLowerCase().includes('vendor'))
        url += '?org_category=VENDOR';

    }


    this.userService.get(url)
      .subscribe({
        next: (res: any) => {
          const { roles } = res;
          roles.forEach(role => {
            if (parseInt(role.total_users) > 0) {
              result.push({
                name: role.name,
                value: role.id
              });
            }
          })
        }, error: (err: Error | any) => {
          this._alert.error(errorHandler(err));
        }
      }
    );

    return result;
  }

  onListFilter(evt) {

    if(evt === undefined) {
      this.advancedFilterQuery = null;
      this.getUsers();
      return;
    }

    this.advancedFilterQuery = evt;
    this.getAdvancedFilterUsers();

  }

  disableClicked(event) {

    if (!event)
      return;

    if(event?.organization === null){
      this._alert.error("Member Not Attached To Any Organization");
      return;
    }

    let orgId = event?.organization?.id;
    let memId = event.id;

    this._loader.show();
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

  getAdvancedFilterUsers(pageNo = 1) {

    const url = `/configurator/programs/${this.programId}/members/advanced-filters?show_candidate_as_worker=true`;
    const filter = this.advancedFilterQuery;
    const payload: any = {
      filters: {}
    };

    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      payload['filters']['org_id'] = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    }

    if (filter.is_enabled && filter.is_enabled.length) {
      if (filter.is_enabled.length === 1) {
        payload.filters.is_enabled = filter.is_enabled[0];
      }
    }
    if (filter.role_id && filter.role_id.length) {
      payload.filters.role_id = filter.role_id;
    }
    if (filter.org_category && filter.org_category.length) {
      payload.filters.org_category = filter.org_category;
    }
    if (filter.name && filter.name.length) {
      payload.filters.name = filter.name;
    }
    if (filter.supervisor_id && filter.supervisor_id.length) {
      payload.filters.supervisor_id = filter.supervisor_id;
    }

    payload.filters.is_do_not_rehire = filter?.do_not_rehire;
    if (!payload.filters.is_do_not_rehire)
      delete payload.filters.is_do_not_rehire;

    payload['pagination'] = {
      "limit": 10,
      "page": pageNo
    };

    if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if (Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
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

    // Advanced filter active
    if (this.advancedFilterQuery) {
      this.getAdvancedFilterUsers(pageNo);
      return;
    }

    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=10&show_candidate_as_worker=true&page=${pageNo}`;

    if (this.searchTerm)
      url += `&name=${this.searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if(this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array <any> = account?.hierarchies;
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
        this.dataLoading = false;
        this._loader.hide();
      }
    });
  }

  removeDoNotRehire(event){
    this.rehireData = event;
    this.showremoveDoNotRehire = 'visible';
    this.rehireToggle('visible');
  }

  rehireToggle(event: any) {
    if(event === 'hidden'){
      this.rehireData = null;
      this.showremoveDoNotRehire = 'hidden';
    }
    this.showremoveDoNotRehire = event;
  }

  onCreateClick(event) {
    this.isCreateUser = 'visible';
    this.viewData = event;
    this.createUserToggle('visible');
    this.editClick = false;
    this.editData = null;
  }

  createUserToggle(event: any) {
    if(event === 'hidden') {
      this.editData = null;
    }
    this.createUser = event;
  }

  onSearch(event: string) {

    if (event) {
      this.searchTerm = event?.split('+')?.join('%2B');
    } else {
      this.searchTerm = "";
    }

    this.dataLoading = true;
    if (this.searchTerm && this.searchTerm.length > 0) {
      this.isSearchedFlag = true
    } else {
      this.isSearchedFlag = false
    }

    let pageNo = 1;
    if (pageNo) {
      this._loader.show();
    }

    let url = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=10&page=${pageNo}&show_candidate_as_worker=true`;
    if (this.searchTerm)
      url += `&k=${this.searchTerm}`;

    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if(this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array <any> = account?.hierarchies;
      if(Array.isArray(hierarchies)) {
        let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
          url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }

    this.userService.get(url).subscribe({
      next: (data: any) => {
        this.vmsData = data?.members;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this._loader.hide();
      }, error: (error: any) => {
        console.error(error);
        this._alert.error(errorHandler(error));
        this._loader.hide();
      }, complete: () => {
        this.dataLoading = false;
      }
    });
  }

  supervisorObservable(term: string): Observable <any> {

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
    this.tableConfig.advanceFilter[1].fieldLoading = true;
    return this.userService.post(url, payload);
  }

  programUserObservable(term: string): Observable <any> {

    let url: string = `/configurator/programs/${this.programId}/members?is_all_users_required=true&limit=20&show_candidate_as_worker=true&page=1${term ? '&name=' + term : ''}`;
    const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      url += `&org_ids=${org_id}`;
    }

    if(this.userType === 'MSP' || this.userType === 'CLIENT') {
      const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array <any> = account?.hierarchies;
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
    this.isCreateUser = 'hidden';
    this.editData = "";
    this.viewData = event;
  }

  onEditClick(event) {
    if (event)
      this.editClickSubject.next(event);
    event.id ? this.editClick = true : this.editClick = false;
  }

  onClickView(event) {
    if("organization_id" in event)
      return ;
    if(event?.organization === null){
      this._alert.error("Member Not Attached To Any Organization Cannot View Profile");
      return;
    }
    this.onCreateClick(event);
    event.id ? this.viewclick = true : this.viewclick = false;

    this.localStorage.set("PROFILE_PROGRAM_ID", this.programId, true);
    this.localStorage.set("PROFILE_ORG_ID", event?.organization?.id, true);
    this.localStorage.set("PROFILE_ORG_CATEGORY", event?.role?.organization_category, true);
    this.router.navigate(['users','profile-view', event.id]);

  }

  columnClick(event) {
    this.editData = false;
    this.viewData = false;
    this.roleData = event;
    if (event.Name === "full_name") {
      this.eventStream.emit(new EmitEvent(Events.VIEW_USER_ROLE, event.vmsData.role));
    }
  }

  handleUpdate(){
    this.ngOnInit();
  }

  onExpandClick(event) { }

  onPaginationClick(event) {
    this.getUsers(event)
  }

  onViewClick() { }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }
}
