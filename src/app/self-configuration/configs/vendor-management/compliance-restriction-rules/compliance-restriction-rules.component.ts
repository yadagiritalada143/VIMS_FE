import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { debounceTime, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-compliance-restriction-rules',
  templateUrl: './compliance-restriction-rules.component.html',
  styleUrls: ['./compliance-restriction-rules.component.scss'],
})
export class ComplianceRestrictionRulesComponent implements OnInit, OnDestroy {
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('status', { static: true }) statusTemplate: TemplateRef<any>;

  public panelVisibility: 'visible' | 'hidden' = 'hidden';
  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];

  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;

  private programId: string = null;
  private subscriptions: Array<Subscription> = [];
  private ruleSubject: Subject<any> = new Subject<any>();
  private prevRuleConfig: any = { term: '', page: 1 };

  constructor(
    private loader: LoaderService,
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private datePipe: LocalDateFormatPipe,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) {}

  ngOnInit(): void {
    // Initialization
    this.initTableConfig();
    this.initRulesSub();

    // API Calls
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.ruleSubject.next(this.prevRuleConfig);
  }

  initTableConfig = () => {
    this.tableFilterConfig = [];

    this.tableHeaderConfig = {
      title: 'Compliance Restriction Rule',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_compliance_restriction_rule_manage'),
      advanceFilter: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdd: this.onAddClicked,
      onSearch: this.onSearch,
      createButtonTitle: 'Rule',
    };

    // Action Links
    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onViewClicked, linkIcon: 'visibility', hide: !this.authService.authorize('vendor_compliance_restriction_rule_view') },
      { linkName: 'Edit', method: this.onEditClicked, linkIcon: 'edit',hide: !this.authService.authorize('vendor_compliance_restriction_rule_manage') },
      { linkName: 'Delete', method: this.onDeleteClicked, linkIcon: 'delete', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('vendor_compliance_restriction_rule_manage') },
    ];

    this.tablePaginationConfig = {
      itemsPerPage: this.itemsPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged,
    };

    this.tableColumnConfig = [
      { field: 'name', header: 'Name', width: 6, primary: true, order: 1, sortable: true, onClick: this.onViewClicked },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, sortable: true, templateRef: this.statusTemplate },
      { field: 'status_list_view', header: 'Doc Status', width: 6, order: 3, sortable: true },
      { field: 'start_date_view', header: 'Restricted From', width: 6, order: 4, sortable: true },
      { field: 'end_date_view', header: 'Restricted To', width: 6, order: 5, sortable: true },
      { field: 'vendor.length', header: 'Vendors', width: 6, order: 6, sortable: true },
      { field: 'month_view', header: 'Month & Year', width: 6, order: 7, sortable: true },
      { field: 'created_on_view', header: 'Created On', width: 6, order: 8, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: 'No Compliance Rule Found',
      actionLinks,
    };
  };

  initRulesSub = () => {
    this.subscriptions.push(
      this.ruleSubject
        .pipe(
          debounceTime(400),
          switchMap((query: any) => {
            const term: string = query?.term;
            const page: number = query?.page;
            this.prevRuleConfig = { term, page };
            if (this.vmsTable?.currentPage) {
              this.vmsTable.currentPage = page ?? 1;
            }

            this.loader.show();
            return this.fetchComplianceObservable(term, page);
          }),
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.loader.hide();
              this.totalRecords = data?.total_records;
              this.vmsData = data?.vendor_compliance_rules?.map((entry: any) => {
                return {
                  ...entry,
                  start_date_view: this.datePipe.transform(entry?.start_date, null, null, null, true, DATE_FORMAT.FORMATDDMMYY),
                  end_date_view: this.datePipe.transform(entry?.end_date, null, null, null, true, DATE_FORMAT.FORMATDDMMYY),
                  created_on_view: this.datePipe.transform(entry?.created_on, null, null, null, true, DATE_FORMAT.FORMATDDMMYY),
                  month_view: entry?.month ?? '--',
                  status_list_view: entry?.status?.status_list?.join(', ') ?? '--',
                };
              });
              console.log(this.vmsData);
            }
          },
          error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.alert.error('Error encountered while fetching entries!');
          },
        }),
    );
  };

  get itemsPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemsPerPage(count: any) {
    if (this.tablePaginationConfig) this.tablePaginationConfig.itemsPerPage = count;
  }

  get totalRecords() {
    return this.tableOptions?.totalRecords ?? 0;
  }

  set totalRecords(count: any) {
    if (this.tableOptions) this.tableOptions.totalRecords = count;
  }

  fetchComplianceObservable(term: string, page: number = 1): Observable<any> {
    let url: string = `/configurator/programs/${this.programId}/vendor-compliance/vendor-compliance-rule?limit=${this.itemsPerPage}&page=${page}`;
    if (term) {
      url += `&name=${term}`;
    }

    return this.programService.get(url);
  }

  sidebarClose(evt: any) {
    this.panelVisibility = 'hidden';
    this.ruleSubject.next(this.prevRuleConfig);
  }

  onAddClicked = (evt: any) => {
    this.panelVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.CREATE_COMPLIANCE_RULE, true));
  };

  onViewClicked = (evt: any) => {
    if (evt?.id) {
      let obj = { event: true, data: evt };
      this.panelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.VIEW_COMPLIANCE_RULE, obj));
    }
  };

  onEditClicked = (evt: any) => {
    if (evt?.id) {
      let obj = { event: true, data: evt };
      this.panelVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.EDIT_COMPLIANCE_RULE, obj));
    }
  };

  onDeleteClicked = (evt: any) => {
    if (evt?.id) {
      this.confirmService.confirm('', `Are you sure to delete the Compliance Rule?`, 'Yes', 'No').then((confirmed: boolean) => {
        if (confirmed) {
          this.loader.show();
          let url: string = `/configurator/programs/${this.programId}/vendor-compliance/vendor-compliance-rule/${evt?.id}`;
          this.programService.delete(url).subscribe({
            next: (data: any) => {
              if (data) {
                this.loader.hide();
                this.alert.success(`Compliance rule deleted successfully`);
                this.ruleSubject.next({ ...this.prevRuleConfig, page: 1 });
              }
            },
            error: (err: any) => {
              this.loader.hide();
              this.alert.error(errorHandler(err));
            },
          });
        }
      });
    }
  };

  onSearch = (term: string) => {
    this.ruleSubject.next({
      term,
      page: 1,
    });
  };

  onPaginationClick = (page: number) => {
    this.ruleSubject.next({ ...this.prevRuleConfig, page });
  };

  onItemCountChanged = (count: number) => {
    this.itemsPerPage = count;
    this.ruleSubject.next({ ...this.prevRuleConfig, page: 1 });
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
