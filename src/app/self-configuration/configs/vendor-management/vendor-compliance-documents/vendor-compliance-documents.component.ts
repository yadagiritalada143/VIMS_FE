import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-vendor-compliance-documents',
  templateUrl: './vendor-compliance-documents.component.html',
  styleUrls: ['./vendor-compliance-documents.component.scss']
})
export class VendorComplianceDocumentsComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;

  public panelVisibility: ('visible' | 'hidden') = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private docSubject: Subject<any> = new Subject<any>();
  private prevDocConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private router: SvmsRouterService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initDocumentSub();

    // API Calls
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.docSubject.next(this.prevDocConfig);
  }

  initTableConfig = () => {
    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        placeholder: 'Document Title',
        type: FilterType.TEXT
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
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }
    ];

    this.tableHeaderConfig = {
      title: 'Vendor Compliance Documents',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_compliance_manage'),
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onListFilter,
      createButtonTitle: 'Add New Document'
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('vendor_compliance_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('vendor_compliance_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_compliance_manage') },
      { linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_compliance_manage') }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'description', header: 'Document Details', width: 6, order: 3, sortable: true },
      { field: 'frequency', header: 'Frequency', width: 6, order: 4, sortable: true },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'modified_on', header: 'Last updated', width: 6, order: 6, sortable: true, type: ColumnType.DATETIME },
      // { field: 'created_on', header: ' Created on date', width: 6, order: 5, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Documents Found",
      enableColumnFilter: true,
      actionLinks
    };
  };

  initDocumentSub = () => {
    this.subscriptions.push(
      this.docSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevDocConfig = { term, page };
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
              this.vmsData = data?.required_documents;
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

  fetchListingObservable(term: string, page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-documents?limit=${this.itemsPerPage}&page=${page}`;
    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-documents?limit=${this.itemsPerPage}&page=${page}`;
    if(this.filterPayload?.name) {
      url += `&name=${this.filterPayload?.name}`;
    }
    if(typeof(this.filterPayload?.is_enabled) === 'boolean') {
      url += `&is_enabled=${this.filterPayload?.is_enabled}`;
    }

    if (this.filterPayload?.modified_on) {
      url += `&date_range=${(this.filterPayload?.modified_on || []).join(',')}`;
    }

    return this.programService.get(url);
  }

  onSearch = (term: string) => {
    this.docSubject.next({
      term, page: 1
    });
  }

  onListFilter = (evt) => {
    if(!!evt) {
      this.filterPayload = evt;
    } else {
      this.filterPayload = null;
    }

    this.docSubject.next({ term: '', page: 1 });
  }

  onAddClicked = () => {
    this.router.navigate(['vendor', 'vendor-compliance-create']);
  }

  onViewClicked = (evt: any) => {
    if(evt?.id) {
      this.router.navigate(['vendor', 'vendor-compliance-view', evt?.id]);
    }
  }

  onEditClicked = (evt: any) => {
    if(evt?.id) {
      this.router.navigate(['vendor', 'vendor-compliance-create'], { queryParams: { id: evt?.id }});
      // let obj = {'event': true, 'data': evt};
      // this.panelVisibility = 'visible';
      // this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_COMPLIANCE, obj));
    }
  }

  onDisableClicked = (evt: any) => {
    if(evt?.id) {

    const payload = {
      act: evt?.act,
      allowed_to_edit: evt?.allowed_to_edit,
      name: evt?.name,
      document_number: evt?.document_number,
      frequency: evt?.frequency,
      days_to_upload: evt?.days_to_upload,
      days_to_regain_compliance: evt?.days_to_regain_compliance,
      is_required_for_onboarding: evt?.is_required_for_onboarding,
      description: evt?.description,
      is_enabled: !evt.is_enabled,
      work_locations: evt?.work_locations?.map((loc: any) => loc?.id) || []
    };

    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-documents/${evt?.id}`;
    this.programService.put(url, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`Compliance document updated successfully`);
            this.docSubject.next(this.prevDocConfig);
          }
        }, error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        }
      });
    }
  }

  onDeleteClicked = (evt: any) => {
    if(evt?.id) {
      this.confirmService.confirm('', `Are you sure to delete the ${evt.name}?`,
      'Yes', 'No').then((confirmed) => {
        if (confirmed) {
      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-documents/${evt?.id}`;
      this.programService.delete(url).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`Compliance document deleted successfully`);
            this.docSubject.next({ ...this.prevDocConfig, page: 1 });
          }
        }, error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        }
      });
    }
    })
    }
  }

  onPaginationClick = (page: number) => {
    this.docSubject.next({ ...this.prevDocConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.docSubject.next({ ...this.prevDocConfig, page: 1 });
  }

  sidebarClose(evt: any, refresh: boolean = false) {
    this.panelVisibility = 'hidden';
    if(refresh) {
      this.docSubject.next({ ...this.prevDocConfig, page: 1 });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
