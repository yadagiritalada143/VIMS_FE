import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType,FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
@Component({
  selector: 'app-vendor-invites',
  templateUrl: './vendor-invites.component.html',
  styleUrls: ['./vendor-invites.component.scss']
})
export class VendorInvitesComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('primaryContact', {static: true}) primaryContact: TemplateRef <any>;
  @ViewChild('primaryContactEmail', {static: true}) primaryContactEmail: TemplateRef <any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private vendorSubject: Subject<any> = new Subject<any>();
  private prevVendorInviteConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private router: SvmsRouterService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initVendorinviteSub();

    // API Calls
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.vendorSubject.next(this.prevVendorInviteConfig);
  }

  initTableConfig = () => {

    this.tableFilterConfig = [{
      name: 'code',
      title: 'Invite ID',
      placeholder: 'Search Invite ID',
      type: FilterType.TEXT
    },{
      name: 'status',
      title: 'Status',
      type: FilterType.SELECT,
      options: [{name:"Expired",value:"EXPIRED"},{name:"Pending Registration",value:"PENDING"},{name:"Registration Completed",value:"ACCEPTED"}]
    },{
      name: 'vendor.name',
      title: 'Vendor',
      placeholder: 'Search Vendor',
      type: FilterType.TEXT
    },{
      name: 'vendor.primary_contact',
      title: 'Primary Contact',
      placeholder: 'Search Primary Contact',
      type: FilterType.TEXT
    },{
      name: 'vendor.primary_contact.email',
      title: 'Primary Contact Email',
      placeholder: 'Search Email',
      type: FilterType.TEXT
    },{
      name: 'invited_on',
      title: 'Invited On',
      placeholder: 'Select Date Range',
      type: FilterType.DATEPICKER
    }];

    this.tableHeaderConfig = {
      title: 'Vendor Invites',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_invite_manage'),
      advanceFilter: true,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onListFilter,
      createButtonTitle: 'New Invite'
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Resend Invitation', method: this.onResendClicked, linkIcon: 'edit',hide: !this.authService.authorize('vendor_invite_manage') },
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'code', header: 'Invite ID', width: 6, primary: true, order: 1, sortable: true,onClick:this.onClickView },
      { field: 'status', header: 'Status', width: 6, order: 2, sortable: true,templateRef: this.statusTemplate },
      { field: 'vendor.name', header: 'Vendor', width: 6, order: 3, sortable: true },
      { field: 'vendor.primary_contact', header: 'Primary Contact', width: 6, order: 4, sortable: true, templateRef: this.primaryContact },
      { field: 'vendor.primary_contact.email', header: 'Primary Contact Email', width: 6, order: 4, sortable: true, templateRef: this.primaryContactEmail },
      { field: 'invited_on', header: 'Invited On', width: 6, order: 5, sortable: true, type:ColumnType.DATETIME},
      // { field: 'invited_on', header: ' Created on date', width: 6, order: 5, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Vendors Found",
      enableColumnFilter: true,
      actionLinks:actionLinks,
      linksValidatorFn: this.clickThreeDot,
    };
  };
  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData.status == "ACCEPTED"){
      actionLinks[0].disable = true
    }else{
      actionLinks[0].disable = false
    }

  }
  initVendorinviteSub = () => {
    this.subscriptions.push(
      this.vendorSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {
            this.prevVendorInviteConfig = query;
            this.loader.show();
            if(this.filterPayload) {
              return this.fetchListingObservable(query);
            }
            return this.fetchListingObservable(query);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              this.vmsData = data?.vendor_invites;
              // this.vmsData.forEach((el: any) => {
              //   el.invited_on = this.localDateFormat.transform(el?.invited_on, null, null, null, true,);
              // });
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

  fetchListingObservable({ page }): Observable <any> {
    let filter: any = {};
    if (this.filterPayload) {
      filter = {};
      if(this.filterPayload['code']) {
        filter.code = this.filterPayload['code']
      }
      if(this.filterPayload['status']) {
        filter.status = this.filterPayload['status']
      }
      if(this.filterPayload['vendor.name']) {
        filter.org_name = this.filterPayload['vendor.name']
      }
      if(this.filterPayload['vendor.primary_contact']) {
        filter.primary_contact =  this.filterPayload['vendor.primary_contact']
      }
      if(this.filterPayload['vendor.primary_contact.email']) {
        filter.email =  this.filterPayload['vendor.primary_contact.email']
      }
      if(this.filterPayload['invited_on']) {
        filter["invited_on_after"] = this.filterPayload['invited_on'][0],
        filter["invited_on_before"]=  this.filterPayload['invited_on'][1]
        }
    }
    let url: string = `/configurator/programs/${this.programId}/vendors/invite`;

    filter["page"] = page ? page : 1
    filter["limit"] = this.itemsPerPage ? this.itemsPerPage : 10
    let queryParams:any = [];

    for (const key in filter) {
      if (filter.hasOwnProperty(key)) {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(filter[key])}`);
      }
    }
    queryParams = queryParams.join('&');
    if(queryParams){
      url = url+"?" + queryParams
    }
    return this.programService.get(url);
  }

  onSearch = (term: string) => {
    this.vendorSubject.next({
      term, page: 1
    });
  }

  onListFilter = (evt) => {
    if (evt) {
      this.filterPayload = evt;
      this.vendorSubject.next(evt);
    } else {
      this.filterPayload = evt;
      this.vendorSubject.next({ page: 1, term: '' });
    }
  }

  onAddClicked = () => {
    this.router.navigate(['vendor','vendor-invites','create']);
  }

  onClickView =(evt: any) => {
    if (evt) {
      this.router.navigate(['vendor','vendor-invites','view',evt?.id]);
    }
  }

  onResendClicked = (evt: any) => {
    this.router.navigate(['vendor','vendor-invites','resend',evt?.id]);
  }


  onPaginationClick = (page: number) => {
    this.vendorSubject.next({ ...this.prevVendorInviteConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.vendorSubject.next({ ...this.prevVendorInviteConfig, page: 1 });
  }

    ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
