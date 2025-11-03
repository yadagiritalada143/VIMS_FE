import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { ColumnType, FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-qualification-items',
  templateUrl: './qualification-items.component.html',
  styleUrls: ['./qualification-items.component.scss']
})
export class QualificationItemsComponent implements OnInit {

  private isView: boolean = false;
  private itemId: string = null;
  private programId: string = null;
  private name: string = 'Qualifications';

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', {static: true}) statusTemplate: TemplateRef <any>;

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  public panelVisibility: ('visible' | 'hidden') = 'hidden';  

  private subscriptions: Array<Subscription> = [];
  private qualSubject: Subject<any> = new Subject<any>();
  private prevQualConfig: any = {term: '', page: 1};
  private filterPayload: any = null;

  constructor(
    private alert: AlertService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private storageService: StorageService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private svmsRouter: SvmsRouterService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {

    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.route.queryParams.subscribe((params: Params) => {
      this.name = params?.['name'];
      this.itemId = params?.['id'];
    });

    // Initialization
    this.initTableConfig();
    this.initQualificationSub();
    this.qualSubject.next(this.prevQualConfig);

  }

  initTableConfig = () => {

    this.tableFilterConfig = [{
      name: 'name',
      title: 'name',
      placeholder: 'Filter Name',
      type: FilterType.TEXT
    }, {
      name: 'is_enabled',
      title: 'is_enabled',
      placeholder: 'Select Status',
      type: FilterType.SELECT,
      options: [
        {name: 'ACTIVE', value: true },
        {name: 'INACTIVE', value: false }
      ]
    }, {
      name: 'modified_on',
      title: 'modified_on',
      placeholder: 'Select Date Range',
      type: FilterType.DATEPICKER
    }];

    this.tableHeaderConfig = {
      title: this.name,
      searchAllowed: true,
      showAddBtn: this.authService.authorize('qualification_manage'),
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      onAdvanceFilter: this.onFilter,
      showBackArrow: true,
      onBackArrowClick: this.navigateToQualifications
    };

    // Action Links
    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('qualification_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit', hide: !this.authService.authorize('qualification_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClicked, linkIcon: 'label_off', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('qualification_manage') },
      { linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('qualification_manage') }
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'code', header: 'Code', width: 6, order: 3, sortable: true },
      { field: 'source', header: 'Type', width: 6, order: 4, sortable: true },
      { field: 'modified_on', header: 'Updated Date', width: 6, order: 5, sortable: true, type: ColumnType.DATE },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Qualifications Found",
      actionLinks,
      enableColumnFilter: true
    };
  };

  initQualificationSub = () => {
    this.subscriptions.push(
      this.qualSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {

            const term: string = query?.term;
            const page: number = query?.page;
            this.prevQualConfig = { term, page };
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
              this.vmsData = data?.qualifications;
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

  fetchListingObservable(term: string = '', page: number = 1): Observable <any> {
    let url: string = `/configurator/programs/${this.programId}/qualification-types/${this.itemId}/qualifications?limit=${this.itemsPerPage}&page=${page}`;
    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  fetchAdvanceFilterObservable(page: number = 1): Observable <any> {
    
    let url: string = `/configurator/programs/${this.programId}/qualification-types/${this.itemId}/qualifications/advanced-filters`;
    let payload: any = {
      pagination: {
        limit: this.itemsPerPage,
        page
      },
      filters: this.filterPayload
    };

    return this.programService.post(url, payload);
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

  onPaginationClick = (page: number) => {
    this.qualSubject.next({ ...this.prevQualConfig, page });
  }

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.qualSubject.next({ ...this.prevQualConfig, page: 1 });
  }

  onAddClicked = (evt: any) => {
    this.eventStream.emit(new EmitEvent(Events.CREATE_QUALIFICATION_ITEM, true));
  }

  onViewClicked = (evt: any) => {
    if(evt?.id) {
      this.isView = true;
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_ITEM_VIEW, obj));
    }
  }

  onEditClicked = (evt: any) => {
    if(evt?.id) {
      let obj = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.EDIT_QUALIFICATION_ITEM, obj));
    }
  }

  onDisableClicked = (evt: any) => {
    if(evt?.id) {

      let url: string = `/configurator/programs/${this.programId}/qualification-types/${this.itemId}/qualifications/${evt?.id}`;
      let payload: any = {
        is_enabled: (evt?.is_enabled) ? 'False': 'True'
      };

      this.loader.show();
      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if(data) {
            this.loader.hide();
            this.alert.success('You have updated qualification successfully');
            this.qualSubject.next(this.prevQualConfig);
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    }
  }

  onDeleteClicked = (evt: any) => {
    if (evt?.id) {
      this.confirmService.confirm('', `Are you sure to delete ${evt?.name || 'this entry'} from Qualifications?`, 'Yes', 'No')
        .then((confirmed: boolean) => {
          if (confirmed) {
            this.loader.show();
            let url: string = `/configurator/programs/${this.programId}/qualification-types/${this.itemId}/qualifications/${evt?.id}`;
            this.programService.delete(url).subscribe({
              next: (data: any) => {
                if (data) {
                  this.loader.hide();
                  this.alert.success(`Qualification entry removed successfully`);
                  this.qualSubject.next({ ...this.prevQualConfig, page: 1 });
                }
              }, error: (err: any) => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              }
            });
          }
        }
      );
    }
  }

  onSearch = (term: string) => {
    this.qualSubject.next({ term, page: 1 });
  }

  onFilter = (evt: any) => {
    if (!!evt) {
      this.filterPayload = {};
      if (evt?.name) {
        this.filterPayload['name'] = evt?.name;
      }
      if (typeof (evt?.is_enabled) === 'boolean') {
        this.filterPayload['is_enabled'] = evt?.is_enabled;
      }
      if (evt?.modified_on) {
        this.filterPayload['modified_on'] = evt?.modified_on;
      }
    } else {
      this.filterPayload = null;
    }

    this.qualSubject.next({ ...this.prevQualConfig, page: 1 });
  }

  navigateToQualifications = () => {
    this.svmsRouter.navigate(['job', 'qualificationsList', 'list']);
  }

  closeSidebar(evt: any) {
    this.panelVisibility = 'hidden';
    if(this.isView) {
      this.isView = false;
    } else {
      this.qualSubject.next(this.prevQualConfig);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}