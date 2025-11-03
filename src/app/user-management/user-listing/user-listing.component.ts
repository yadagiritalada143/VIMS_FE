import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Subscription, Subject, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import * as _ from 'lodash';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { Router } from '@angular/router';

interface APICallEvent {
  page: number;
  term: string;
  category?: string
};

@Component({
  selector: 'app-user-listing',
  templateUrl: './user-listing.component.html',
  styleUrls: ['./user-listing.component.scss'],
})
export class UserListingComponent implements OnInit, OnDestroy {

  @ViewChild(VMSTableComponent) vmsTable;
  private subscriptions: Array <Subscription> = [];
  private userSubject: Subject <any> = new Subject <any> ();
  private orgSubject: Subject <APICallEvent> = new Subject <APICallEvent> ();

  public vmsData: any = [];
  public tableConfig: VMSConfig;
  public searchTerm: string;
  public orgId: string;
  public createUser = 'hidden';
  public createRole = 'hidden';
  public list_or_create: boolean = true;
  public totalRecords = 10;
  public itemPerPage = 10;
  public show_org: boolean = false;
  public org_catgs = ['CLIENT', 'MSP', 'VENDOR'];
  public selectedcatgs: string = '';
  public orgLists: any = [];
  public selectedorg: string = null;
  public currAccount: any = {};
  public orgLoading: boolean = false;
  public prevOrgEvent: APICallEvent = null;
  public orgRecordLength: number = 0;
  public isControl: boolean = this.routeAc?.url?.includes('control-panel');
  constructor(
    private programService: ProgramService,
    private localStorage: StorageService,
    private eventStream: EventStreamService,
    private _loader: LoaderService,
    private _alert: AlertService,
    private accessControlService: AccessControlService,
    private router: SvmsRouterService,
    private routeAc: Router,
    private uniqueKeyPipe: UniqueKeyPipe
  ) {}

  ngOnInit(): void {

    this.orgId = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    this.tableConfig = {
      title: 'Organization Users',
      isCreateButtonName: 'Add User',
      columnList: [
        {
          name: 'full_name',
          title: 'Full Name',
          width: 15,
          isIcon: false,
          isImage: true,
          enableClick: true,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'role.organization_category',
          title: 'Organization Category',
          width: 15,
          isIcon: false,
          isImage: false,
          enableClick: true,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'supervisor.full_name',
          title: 'Supervisor',
          width: 15,
          isIcon: false,
          enableClick: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'is_enabled',
          title: 'Status',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isNoOption: false,
          isVieworEdit: true,
          isDisableorDelete: this.accessControlService.accessControl(),
          isDelete: false,
        },
      ],
      showTabs: true,
      isExpand: true,
      isFilter: false,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
    };

    this.initOrgListingSubject();
    this.initUserListingSubject();
    this.userSubject.next(null);

    this.subscriptions.push(
      this.eventStream.on(Events.USER_UPDATED)
      .subscribe(data => {
        if (data) {
          this.userSubject.next({
            term: this.searchTerm,
            page: 1
          });
        }
      }),
    );

    let userType = this.localStorage.get(StorageKeys.USER_TYPE);
    if (userType === 'SUPER_ORG' || userType === 'MSP' || this.hasCreateUserPermission) {

      if (userType === 'SUPER_ORG') {
        const { organization } = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT) || {};
        this.currAccount = organization;
        if(this.routeAc?.url?.includes('self-configuration')) {
          this.selectedcatgs = this.org_catgs[0];
        } else {
          this.org_catgs = [organization.name, ...this.org_catgs];
          this.selectedcatgs = organization.name;
        }
      } else if (userType === 'MSP') {
        this.selectedcatgs = 'MSP';
      } else if(this.hasCreateUserPermission) {
        this.selectedcatgs = this.localStorage.get(StorageKeys.USER_TYPE);
      }

      this.show_org = true;
      this.orgSubject.next({
        page: 1, term: '', category: this.selectedcatgs
      });
    }

    this.eventStream.on(Events.LIST_USER)
    .subscribe((res: any) => {
      this.userSubject.next(null);
      return;
    });
  }

  initOrgListingSubject() {

    this.subscriptions.push(
      this.orgSubject.pipe(
        debounceTime(600),
        switchMap(({ category, term, page }) => {

          let _account = this.currAccount;
          if (_account && (category === _account.name)) {
            this.orgLists = [_account];
            this.defaultSetter();
            return of(null);
          }

          let url: string = `/configurator/organizations?limit=${this.itemPerPage}&program_id=${this.programId}&category=${category}`;
          if (category && (category.toUpperCase() === 'VENDOR'))
            url = `/configurator/programs/${this.programId}/vendors?limit=${this.itemPerPage}`;
          if (this.isControl) {
            url = `/configurator/organizations?limit=${this.itemPerPage}&category=${category}`;
          }
          if (term)
            url += `&name=${term}`;
          if (page)
            url += `&page=${page}`;

          this.orgLoading = true;
          this.prevOrgEvent = { category, term, page };
          return this.programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          if (data) {

            this.orgLoading = false;
            this.orgRecordLength = (data.total_records || 0);
            let category: string = this.prevOrgEvent.category;
            let page: number = this.prevOrgEvent.page;

            if (category && (category.toUpperCase() === 'VENDOR') && !this.isControl) {
              data.program_vendors = data.program_vendors.map((node: any) => node.vendor);

              if (page === 1)
                this.orgLists = data.program_vendors;
              else
                this.orgLists = this.uniqueKeyPipe.transform([...this.orgLists, ...data.program_vendors], 'id');
            }
            else {
              if (page === 1)
                this.orgLists = data.organizations;
              else
                this.orgLists = this.uniqueKeyPipe.transform([...this.orgLists, ...data.organizations], 'id');
            }
            this.defaultSetter();
          }
        }, error: (err: Error | any) => {
          this.orgLoading = false;
          this._alert.error(errorHandler(err));
        }
      })
    );
  }

  initUserListingSubject() {
    this.subscriptions.push(
      this.userSubject
        .pipe(
          debounceTime(600),
          switchMap((evt: any) => {

            let url: string = `/configurator/organizations/${this.orgId}/members?is_all_users_required=true&limit=${this.itemPerPage}&exclude_candidates=true`;
            if (evt) {
              const { page, term } = evt;
              if (page)
                url += `&page=${page}`;
              if (term)
                url += `&k=${this.searchTerm}`;
            }
            if (!this.isControl) {
              url += `&program_id=${this.programId}`;
            }

            if (!evt || (evt?.page === 1)) {
              this.vmsTable.currentPage = 1;
            }

            let category: string = this.selectedcatgs;
            if(!category) {
              category = this.localStorage.get(StorageKeys.USER_TYPE);
            }
            if(!this.isControl && !this.isSuperUser){
              if(category?.toUpperCase() === 'MSP' || category?.toUpperCase() === 'CLIENT') {
                const account: any = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
                const hierarchies: Array <any> = account?.hierarchies;
                if(Array.isArray(hierarchies)) {
                  let hierarchy_ids: Array <string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
                  hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
                  if(Array.isArray(hierarchy_ids) && hierarchy_ids.length)
                    url += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
                }
              }
            }

            if(category?.toUpperCase() === 'VENDOR') {
              const org_id = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
              if(!this.isSuperUser) {
                url += `&org_ids=${org_id}`;
              }
            }

            this._loader.show();
            return this.programService.get(url);
          })
        ).subscribe({
          next: (data: any) => {
            if (data) {
              this._loader.hide();
              this.vmsData = data;
              this.itemPerPage = 10;
              this.totalRecords = data.total_records;
            }
          }, error: (err: Error | any) => {
            this._alert.error(errorHandler(err));
            this._loader.hide();
          }
        }
      )
    );
  }

  onPaginationClick(page: number) {
    this.userSubject.next({
      page, term: this.searchTerm
    });
  }

  onCreateClick(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_USER, {
        "organization": this.selectedorg,
        "category": this.selectedcatgs,
        "orgId": this.orgId
      }));
    }
  }

  onSubmittedCandidateClick() {}
  onTabClick() {}
  onListFilter() {}

  onSearch(event: string) {
    if(event) {
      this.searchTerm = event?.split('+')?.join('%2B');
    } else {
      this.searchTerm = '';
    }

    this.userSubject.next({
      term: this.searchTerm,
      page: 1
    });
  }

  onEditClick(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.EDIT_USER, { orgId: this.orgId, ...event }));
    }
  }

  onDisableClicked(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.DISABLE_USER, { orgId: this.orgId, ...event }));
    }
  }

  onDeleteClick(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.DELETE_USER, { orgId: this.orgId, ...event }));
    }
    this.ngOnInit();
  }

  getSupervisor(id: string) {
    // this.programService.get(`/configurator/organizations/${this.orgId}/members/${id}`).subscribe(data => {
    //   this.eventStream.emit(new EmitEvent(Events.VIEW_USER, data));
    // });
  }

  onClickView(event) {
    this.onColumnClick(event);
    this.eventStream.emit(new EmitEvent(Events.VIEW_USER, event));
    this.localStorage.set('PROFILE_ORG_ID', this.orgId, true);
    this.localStorage.set('PROFILE_ORG_NAME', this.selectedorg, true);
    this.localStorage.set("PROFILE_ORG_CATEGORY", this.selectedcatgs, true);
    if(this.routeAc.url.includes('self-configuration')) {
      this.router.navigate(['users', 'organization-users', 'profile-view', event.id]);
    } else {
      this.router.navigate(['user-management', 'profile-view', event.id]);
    }

  }

  onColumnClick(event) {
    if (!!event.name) {
      if (event.name === 'supervisor.full_name') {
        this.eventStream.emit(new EmitEvent(Events.SIDEBAR_CLOSE, true));
        if (event?.vmsData?.supervisor) {
          this.getSupervisor(event.vmsData.supervisor.id);
        }
      }
    }
  }

  defaultSetter() {
    // Select as default if only one option provided
    if (this.orgLists?.length) {
      this.orgId = this.orgLists[0]?.id;
      this.selectedorg = (this.orgLists[0]?.name || null);
      this.userSubject.next({
        term: this.searchTerm,
        page: 1
      });
    }
  }

  selectCategory() {
    this.orgId = this.selectedorg = null;
    this.orgSubject.next({
      page: 1,
      term: '',
      category: this.selectedcatgs
    });
  }

  selectOrganization() {
    this.orgId = this.selectedorg;
    this.userSubject.next({
      page: 1,
      term: this.searchTerm
    });
  }

  searchOrg({ term }) {
    this.orgSubject.next({
      term, page: 1,
      category: this.selectedcatgs
    })
  }

  showMoreOrg() {
    const { term, page } = this.prevOrgEvent;
    if(this.orgRecordLength > this.orgLists.length) {
      this.orgSubject.next({
        term: (term) ? term : '',
        page: page ? (page + 1) : 1,
        category: this.selectedcatgs
      })
    }
  }

  handleUpdate() {
    this.userSubject.next({
      term: this.searchTerm,
      page: 1
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }

  get hasCreateUserPermission(): boolean {
    let permissions: Array <any> = this.localStorage.get(StorageKeys.USER_PERMISSION);
    return !!(permissions?.includes('create_organization_user'));
  }

  get userType() {
    return this.localStorage.get(StorageKeys.USER_TYPE);
  }

  get isSuperUser() {
    return (this.userType === 'SUPER_ORG');
  }

  get programId() {
    return this.localStorage.get(StorageKeys.PROGRAM_ID);
  }
}
