import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import {
  ColumnType,
  FilterType,
  IActionLinks,
  IAdvanceFilterConfig,
  IColoumnDefinition,
  ITableHeaderConfig,
  ITableOptions,
  ITablePaginationConfig
} from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendor-compliance-document-groups',
  templateUrl: './vendor-compliance-document-groups.component.html',
  styleUrls: ['./vendor-compliance-document-groups.component.scss']
})
export class VendorComplianceDocumentGroupsComponent implements OnInit {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;
  @ViewChild('count', {static: true}) countTemplate: TemplateRef <any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private groupSubject: Subject<any> = new Subject<any>();
  private prevGroupConfig: any = {term: '', page: 1};
  private filterData: any = null;

  public panelVisibility: ('visible' | 'hidden') = 'hidden';
  public viewMode: boolean = false;
  public editData: any = null;
  public viewData: any = null;

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private storageService: StorageService,
    private programService: ProgramService,
    private accessControlService: AccessControlService,
    private route: SvmsRouterService,
    private datePipe: LocalDateFormatPipe,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    // Initialization
    this.initTableConfig();
    this.initGroupSubject();

    // Rendering
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.groupSubject.next(this.prevGroupConfig);
  }

  initTableConfig() {

    this.tableFilterConfig = [{
        name: 'name',
        title: 'name',
        placeholder: 'Filter by Document Group',
        type: FilterType.TEXT
      }, {
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
      title: 'Vendor Compliance Document Groups',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_compliance_manage'),
      advanceFilter: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onAdvanceFilter,
      createButtonTitle: 'Add New Document Group'
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
      { field: 'description', header: 'Description', width: 8, order: 3, sortable: false },
      { field: 'required_documents.length', header: 'Number of Documents', width: 6, order: 4, sortable: true, templateRef: this.countTemplate },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'modified_on', header: 'Last Updated', width: 6, order: 5, sortable: false, type: ColumnType.DATETIME },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Document Groups Found",
      enableColumnFilter: true,
      actionLinks
    };
  }

  initGroupSubject() {
    this.subscriptions.push(
      this.groupSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevGroupConfig = { term, page };
            if(this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            };

            if(this.filterData) {
              return this.fetchAdvanceFilterObservable(page);
            }

            this.loader.show();
            return this.fetchListingObservable(term, page);
          })
        )
        .subscribe({
          next: (data: any) => {
            if(data) {
              this.loader.hide();
              data?.required_document_groups.forEach(data => {
                data.modified_on = this.datePipe.transform(data?.modified_on *1000)
              })
              this.vmsData = data?.required_document_groups;
              this.totalRecords = data?.total_records;
            }
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          }
        })
    );
  }

  fetchListingObservable(term: string, page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups?limit=${this.itemsPerPage}&page=${page}`;

    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }



  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups?limit=${this.itemsPerPage}&page=${page}`;
    if(this.filterData?.name) {
      url += `&name=${this.filterData?.name}`;
    }
    if(typeof(this.filterData?.is_enabled) === 'boolean') {
      url += `&is_enabled=${this.filterData?.is_enabled}`;
    }

    if(this.filterData?.modified_on) {
      url += `&date_range=${(this.filterData?.modified_on || []).join(',')}`;
    }

    return this.programService.get(url);
  }




  onAddClicked = (evt: any) => {
  this.route.navigate(['vendor', 'vendor-document-group-create']);
  }

  onViewClicked = (evt: any) => {
    if (evt?.id) {
      this.route.navigate(['vendor', 'vendor-document-group-view'], { queryParams: { id: evt?.id }});
    }
  }

  onEditClicked = (evt: any) => {
    if (evt?.id) {
      this.editData = evt;
      this.route.navigate(['vendor', 'vendor-document-group-create'], { queryParams: { id: evt?.id }});
    }
  }

  onDisableClicked = (evt: any) => {
    if (evt?.id) {
      const documentIds: Array<string> = [];
      evt?.required_documents?.forEach((document: any) => {
        documentIds.push(document?.id);
      });

      let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups/${evt?.id}`;
      let payload: any = {
        name: evt?.name,
        description: evt?.description,
        documents: documentIds,
        is_enabled: !evt?.is_enabled,
      };

      this.loader.show();
      this.programService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.alert.success('You have updated Document group successfully.');
              this.groupSubject.next(this.prevGroupConfig);
            }
          }, error: (err: any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          }
        }
      );
    }
  }

  onDeleteClicked = (evt: any) => {
    if (evt?.id) {
      this.loader.show();
      let url: string = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups/${evt?.id}`;
      this.programService.delete(url).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success('Compliance Document Group deleted successfully');
            this.groupSubject.next({ ...this.prevGroupConfig, page: 1 });
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    }
  }

  sidebarClose(evt: any) {

    if(this.editData) {
      this.groupSubject.next(this.prevGroupConfig);
    } else if(!this.viewMode) {
      this.groupSubject.next({...this.prevGroupConfig, page: 1});
    }

    this.panelVisibility = 'hidden';
    this.viewMode = false;
    this.editData = null;
    this.viewData = null;
  }

  onSearch = (term: any) => {
    this.groupSubject.next({term, page: 1});
  }

  onAdvanceFilter = (evt: any) => {
    if(!!evt) {
      this.filterData = evt;
    } else {
      this.filterData = null;
    }

    this.groupSubject.next({term: '', page: 1});
  }

  onPaginationClick = (page: number) => {
    this.groupSubject.next({ ...this.prevGroupConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.groupSubject.next({ ...this.prevGroupConfig, page: 1 });
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
