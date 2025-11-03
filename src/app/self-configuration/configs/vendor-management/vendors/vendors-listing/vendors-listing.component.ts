import { Component, TemplateRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, Subject, debounceTime, switchMap, Observable } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-vendors-listing',
  templateUrl: './vendors-listing.component.html',
  styleUrls: ['./vendors-listing.component.scss']
})
export class VendorsListingComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('statusTemplate', { static: true }) statusTemplate: TemplateRef<void>;
  @ViewChild('showData', { static: true }) showData: TemplateRef<void>;
  @ViewChild('auditTemplate', { static: true }) auditTemplate: TemplateRef<void>;

  private subscriptions: Array<Subscription> = [];
  private vendorSubject: Subject<any> = new Subject<any>();
  private prevVendorConfig: any = { term: '', page: 1 };

  public vendorList: Array<any> = [];
  public createManageVendor: ('visible' | 'hidden') = 'hidden';

  public editData: any;
  public viewData: any;
  public viewclick: any;
  public filter: any = null;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {
    const userType = this.storageService.get(StorageKeys.USER_TYPE)

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Filter by Vendor Name',
        type: FilterType.TEXT,
        advanceFilter: false
      }, {
        name: 'status',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        advanceFilter: false,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false },
          { name: 'Pending Setup', value: 'pending_setup' }
        ]
      },
      {
        name: 'date_range',
        title: 'Effective Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Vendor(s)',
      createButtonTitle: 'Associate New Vendor to Program',
      searchAllowed: userType == 'VENDOR' ? false : true,
      showAddBtn: false,
      onSearch: this.onSearch,
      advanceFilter: userType == 'VENDOR' ? false : true,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('vendors_view')},
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('vendors_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendors_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendors_manage') },
      { linkName: 'Compliance', method: this.onOptionClicked, hide: !this.authService.authorize('view_compliance') }, //view_compliance added as part of V2M-28574
      { linkName: 'Complete Vendor Setup', method: this.onCompleteVendorSetupClick}
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: 10,
      recordsPerPageSetting: [10, 25, 50, 100]
    }

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 35, primary: true, order: 1, sortable: true, onClick: this.onClickView },
      { field: 'candidate', header: 'Candidate Submitted', templateRef: this.showData, width: 20, order: 3, sortable: true },
      { field: 'job', header: 'Job Filled', templateRef: this.showData, width: 20, order: 4, sortable: true },
      { field: 'compliance_status.is_compliant', header: 'Compliance Status', width: 15, order: 5, templateRef: this.showData, sortable: true },
      { field: 'compliance_status.is_audited', header: 'Audit Completed', width: 15, order: 6, templateRef: this.auditTemplate, sortable: false },
      { field: 'status', header: 'Status', width: 15, order: 2, templateRef: this.statusTemplate, sortable: false },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      actionLinks: actionLinks,
      enableColumnFilter: userType == 'VENDOR' ? false : true,
      linksValidatorFn: this.clickThreeDot,
    };
  };

  constructor(
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private loaderService: LoaderService,
    private storageService: StorageService,
    public vendorService: VendorService,
    private alertService: AlertService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.vendorSubject.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          this.loaderService.show();
          this.prevVendorConfig = query;
          if (this.vmsTable) {
            this.vmsTable.currentPage = query?.page ?? 1;
          }

          if (this.filter) {
            return this.filterObservable(query);
          }

          return this.searchObservable(query);
        })
      ).subscribe({
        next: (res: any) => {
          if (res) {

            this.loaderService.hide();
            this.totalRecords = res?.total_records ?? 1;

            if ('program_vendors' in res || 'program_vendor' in res) {
              res = res.program_vendors ?? res.program_vendor;
              if(!Array.isArray(res)){
                res = [res]
              }
              if(Array.isArray(res)) {
                this.vendorList = res.map((entry: any) => {

                  if(!entry?.compliance_status) {
                    entry['compliance_status'] = {
                      is_compliant: false,
                      is_audited: false
                    }
                  }
                  entry.status = entry?.is_setup == false ? "is_setup" : !!entry?.is_enabled;
                  entry.compliance_status.is_compliant = entry?.compliance_status?.is_compliant ? 'Compliant' : 'Non - Compliant';
                  if(entry?.vendor) {
                    entry.vendor['programModifiedOn'] = entry?.modified_on;
                    entry.vendor['is_enabled'] = entry?.is_setup == false ? "is_setup" : !!entry?.is_enabled;
                    entry.vendor['compliance_status'] = entry.compliance_status;
                    entry.vendor['candidate'] = entry?.candidate;
                    entry.vendor['job'] = entry?.job;
                    entry['vendors'] = [entry.vendor];
                  }

                  return {
                    ...entry,
                    name: entry?.vendor?.name
                  };
                });
              }
            }
          }
        }, error: (err: Error | any) => {
          this.loaderService.hide();
          this.alertService.error('Error encountered while fetching entries!');
          console.error(err);
        }, complete: () => {
          this.initalizeTableConfigs();
        }
      })
    );

    this.vendorSubject.next(this.prevVendorConfig);
  }

  showOprtions(event) : boolean {
    return true
  }

  filterObservable({ term, page }): Observable<any> {
    let payLoad: any = { filters: this.filter };
    let url: string = `/configurator/programs/${this.programId}/vendors/advanced-filters?limit=${this.itemPerPage}&page=${page}`;
    if(payLoad.filters.status == 'pending_setup') {
      payLoad.filters["active"] = "pending_setup"
    }else{
      payLoad.filters.is_enabled = payLoad.filters.status
    }

    return this.vendorService.post(url, payLoad);
  }

  searchObservable({ term, page }): Observable<any> {
    const userType = this.storageService.get(StorageKeys.USER_TYPE)
    const ordId = this.storageService.get(StorageKeys.ORGANIZATION_ID)
    let url = userType == 'VENDOR' ? `/configurator/programs/${this.programId}/vendors/${ordId}?limit=${this.itemPerPage}&page=${page}` : `/configurator/programs/${this.programId}/vendors?limit=${this.itemPerPage}&page=${page}`;
    if (term) {
      url += `&name=${term}`;
    }

    return this.vendorService.get(url);
  }

  onOptionClicked = (event: any) => {
    if (event?.vendor?.id) {
      this.router.navigate(['vendor', 'compliance-list', this.programId, event?.vendor?.id]);
      // this.router.navigate(['vendor-managment', 'compliance-list', this.programId, event.id]);
    }
  }

  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData.status == "is_setup"){
      let editIndex = actionLinks?.findIndex(x => x?.linkName == 'Edit')
      actionLinks[editIndex].hide = true
      let enableDisableIndex = actionLinks?.findIndex(x => x?.linkName == 'Enable/Disable')
      actionLinks[enableDisableIndex].hide = true;
      let deleteIndex = actionLinks?.findIndex(x => x?.linkName == 'Delete')
      actionLinks[deleteIndex].hide = true;
      let complianceIndex = actionLinks?.findIndex(x => x?.linkName == 'Compliance')
      actionLinks[complianceIndex].hide = true;
      let index = actionLinks?.findIndex(x => x?.linkName == 'Complete Vendor Setup')
      actionLinks[index].hide = false

    }
    else{
      let editIndex = actionLinks?.findIndex(x => x?.linkName == 'Edit')
      actionLinks[editIndex].hide = !this.authService.authorize('vendors_manage');
      let enableDisableIndex = actionLinks?.findIndex(x => x?.linkName == 'Enable/Disable')
      actionLinks[enableDisableIndex].hide = !this.authService.authorize('vendors_manage')
      let deleteIndex = actionLinks?.findIndex(x => x?.linkName == 'Delete')
      actionLinks[deleteIndex].hide = !this.authService.authorize('vendors_manage');
      let complianceIndex = actionLinks?.findIndex(x => x?.linkName == 'Compliance')
      actionLinks[complianceIndex].hide = !this.authService.authorize('view_compliance'); //view_compliance added as part of V2M-28574
      let index = actionLinks?.findIndex(x => x?.linkName == 'Complete Vendor Setup')
      actionLinks[index].hide = true
    }
    // if(!rowData?.is_enabled){
    //   if(actionLinks[5]) {
    //     delete actionLinks[5]
    //   }
    // }
  }

  onDisableClicked = (event: any) => {
    if (event?.vendor?.id) {

      let url: string = `/configurator/programs/${this.programId}/vendors/${event?.vendor?.id}`
      const payLoad = {
        is_enabled: event.is_enabled ? false : true,
      };

      this.loaderService.show();
      this.vendorService.put(url, payLoad).subscribe({
        next: (data: any) => {
          if (data) {
            this.alertService.success(`Vendor ${event?.is_enabled ? 'disabled' : 'enabled'} successfully`);
            this.vendorSubject.next(this.prevVendorConfig);
            this.loaderService.hide();
          }
        },
        error: (err: Error | any) => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        }
      });
    }
  }

  onSearch = (term: string) => {
    this.vendorSubject.next({ term, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.vendorSubject.next({ ...this.prevVendorConfig, page });
  }

  onListFilter = (event: any) => {
    if(event) {
      this.filter = event;
    } else {
      this.filter = null;
    }

    this.vendorSubject.next({
      ...this.prevVendorConfig,
      page: 1
    });
  }

  onSortClick = (event: any) => {
    // fire an API here for sort logic
    // event: {name: '', order: 'asc'/'desc'}
  }

  onCloseCreateVendor = (event: any) => {
    this.createManageVendor = 'hidden';
    this.editData = "";
    this.viewclick = false;
    this.vendorSubject.next(this.prevVendorConfig);
  }

  onEditClick = (event: any) => {
    if (event) {
      let obj: any = { "event": true, "data": event };
      this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR, obj));
    }
  }

  onCompleteVendorSetupClick = (event: any) => {
    if (event) {
      let obj: any = { "event": true, "data": event };
      this.eventStream.emit(new EmitEvent(Events.COMPLETE_VENDOR_SETUP, obj));
    }
  }

  onClickView = (event: any) => {
    if (event) {
      let obj: any = { "event": true, "data": event,"vendorSetup":true  };
      this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW, obj));
    }
  }

  onDeleteClick = (event: any) => {
    if (event?.vendor?.id) {

      this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`, 'Yes', 'No')
        .then((confirmed: any) => {
          if (confirmed) {

            this.loaderService.show();
            let url: string = `/configurator/programs/${this.programId}/vendors/${event?.vendor?.id}`;
            this.vendorService.delete(url).subscribe({
              next: (data: any) => {
                this.loaderService.hide();
                this.alertService.success(`You have deleted vendor successfully.`);
                this.vendorSubject.next({ ...this.prevVendorConfig, page: 1 });
              }, error: (err: Error | any) => {
                this.loaderService.hide();
                this.alertService.error(errorHandler(err));
              }
            });
          }
        }
      );
    }
  }

  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    this.vendorSubject.next({ ...this.prevVendorConfig, page: 1 });
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  get itemPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemPerPage(count: any) {
    if (this.tablePaginationConfig)
      this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions)
      this.tableOptions.totalRecords = count;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
