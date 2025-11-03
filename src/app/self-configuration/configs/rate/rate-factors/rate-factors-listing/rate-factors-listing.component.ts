import { Component, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Observable, Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RateFactorService } from 'src/app/program-setup/rate-factor/rate-factor.service';
import { ColumnType, FilterType, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig, IActionLinks, IAdvanceFilterConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


@Component({
  selector: 'app-rate-factors-listing',
  templateUrl: './rate-factors-listing.component.html',
  styleUrls: ['./rate-factors-listing.component.scss']
})
export class RateFactorsListingComponent implements OnInit, OnDestroy {

  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;

  private subscriptions: Array <Subscription> = [];
  private rateFactorSub: Subject <any> = new Subject <any> ();

  public vmsData: any;
  public title: string;
  public buttonTitle = 'Save';

  public isEditMode: boolean = false;
  public isViewMode: boolean = false;
  public createMode: boolean = false;
  public isListingMode: boolean = true;

  private prevRateConfig: any = null;
  private filterConfig: any = null;

  public showOrderChangeFlyout: boolean = false
  public rateFactors: any = []

  @ViewChild('statusTemplate',{static:true}) statusTemplate: TemplateRef<void>;
  @ViewChild('showData',{static:true}) showData: TemplateRef<void>;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig:ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'name',
        type: FilterType.TEXT,
        placeholder: 'Filter by Name'
      }, {
        name: 'abbreviation',
        title: 'abbreviation',
        type: FilterType.TEXT,
        placeholder: 'Filter by Abbreviation'
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER
      }, {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: 'True' },
          { name: 'Inactive', value: 'False' }
        ]
      }
    ];

    this.tableHeaderConfig = {
      title: 'Rate Type',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('rate_factor_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      reorder: true,
      onReorder: this.onReorder,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onViewClick, hide: !this.authService.authorize('rate_factor_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('rate_factor_manage') },
      { linkName: 'Enable/Disable', method: this.onDisabledClicked, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('rate_factor_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100]
    };

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Rate Type Name', width: 35, primary: true, order: 1, sortable: true, onClick: this.onViewClick },
      { field: 'abbreviation', header: 'Abbreviation', templateRef: this.showData, width: 20, order: 3, sortable: true },
      // { field: 'hierarchies_data', header: 'Hierarchies Data', width: 20, order: 4, sortable: true },
      { field: 'modified_on', header: 'Last Updated', width: 15, order: 5, type: ColumnType.DATETIME, sortable: true },
      { field: 'is_enabled', header: 'Status', width: 15, order: 2, templateRef: this.statusTemplate, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      actionLinks: actionLinks,
      enableColumnFilter: true
    };
  };


  constructor (
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private rateFactorService: RateFactorService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) {
    this.subscriptions.push(
      this.route.paramMap.subscribe((param: ParamMap) => {
        if (param.get('add')) {
          this.title = 'Create New Rate Type';
        }
      }
    ));
  }

  ngOnInit(): void {

    this.initalizeTableConfigs();

    // Rate factor listener
    this.subscriptions.push(
      this.rateFactorSub.pipe(
          switchMap((query: any) => {

            this.prevRateConfig = query;
            if(this.vmsTable) {
              this.vmsTable.currentPage = query?.page ?? 1;
            }

            if(this.filterConfig) {
              return this.filterObservable(query);
            }

            return this.searchObservable(query);
          }),
      ).subscribe({
        next: (data: any) => {
          if (data) {

            this.loader.hide();
            if(Array.isArray(data?.rate_factors)) {
              data['rate_factors'] = data.rate_factors.map((entry: any) => {
                return {
                  ...entry,
                  modified_on: this.parseTimestamp(entry?.modified_on)
                }
              })
            };

            this.vmsData = data;
            this.addHierarchyColumn(data);
            this.totalRecords = data.total_records;
          }
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
    );

    // Refresh listener
    this.subscriptions.push(
      this.eventStream.on(Events.REFRESH)
        .subscribe((data) => {
          this.createMode = data.create;
          this.isViewMode = data.view;
          this.isEditMode = data.edit;
          this.isListingMode = data.list;
          this.rateFactorSub.next(this.prevRateConfig);
        }
      )
    );

    this.rateFactorSub.next({ term: '', page: 1 });
  }

  addHierarchyColumn = (data: any) => {

    const rateList: Array <any> = data?.rate_factors;
    if (Array.isArray(rateList)) {
      rateList.forEach((rate: any) => {
        let hierarchies: Array <string> = rate?.hierarchies;
        if (Array.isArray(hierarchies)) {
          let list: Array <string> = hierarchies.map((id: string) => (this.rateFactorService.hierarchyMap.get(id)));
          if (list.includes(null) || list.includes(undefined)) {
            setTimeout(() => {
              this.addHierarchyColumn(data);
            }, 1200);
          }

          list = list.filter((entry: string) => entry);
          rate['hierarchies_data'] = list.join(', ');
          if (!list.length) {
            rate['hierarchies_data'] = '—';
          }
        }
      });
    }
  }

  searchObservable({ term, page }): Observable <any> {
    let url = `/configurator/programs/${this.programId}/rate-factors?limit=${this.itemPerPage}&page=${page}`;
    if(term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  filterObservable({ term, page }): Observable <any> {
    let url = `/configurator/programs/${this.programId}/rate-factors?limit=${this.itemPerPage}&page=${page}`;
    const { name, abbreviation, modified_on, is_enabled } = this.filterConfig;
    if(name) {
      url += `&name=${name}`;
    }

    if(abbreviation) {
      url += `&abbreviation=${abbreviation}`;
    }

    if (modified_on) {
      url += `&date_range=${(modified_on || []).join(',')}`;
    }

    if(is_enabled) {
      url += `&is_enabled=${is_enabled}`;
    }

    return this.programService.get(url);
  }

  onCreateClick = () => {
    this.eventStream.emit(new EmitEvent(Events.CREATE_RATE_FACTOR, true));
    this.title = 'Create New Rate Type';
    this.buttonTitle = "Save"
    this.createMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.isListingMode = false;
  }

  onViewClick = (event: any) => {
    if(event) {

      const obj: any = { event: true, data: event };
      this.eventStream.emit(new EmitEvent(Events.VIEW_RATE_FACTOR, obj))

      this.title = `View Rate Type`;
      this.buttonTitle = "Save"

      this.isViewMode = true;
      this.createMode = false;
      this.isEditMode = false;
      this.isListingMode = false;
    }
  }

  onEditClick = (event: any) => {
    if(event) {

      const obj: any = { event: true, data: event };
      this.eventStream.emit(new EmitEvent(Events.EDIT_RATE_FACTOR, obj));

      this.title = `Edit Rate Type`;
      this.buttonTitle = "Save"

      this.isEditMode = true;
      this.createMode = false;
      this.isViewMode = false;
      this.isListingMode = false;
    }
  }

  onDisabledClicked = (event: any) => {
    if(event?.id) {

      const url: string = `/configurator/programs/${this.programId}/rate-factors/${event.id}`;
      let payload = {
        ...event,
        is_enabled: !event.is_enabled
      };

      if('hierarchies' in payload)
        delete payload.hierarchies;

      if ('job_template' in payload)
        delete payload.job_template;

      this.loader.show();
      this.programService.put(url, payload)
        .subscribe({
          next: (res: any) => {
            this.loader.hide();
            this.rateFactorSub.next(this.prevRateConfig);
            this.alert.success(`Rate Factor ${!event.is_enabled ? 'Enabled' : 'Disabled'} Successfully`);
          }, error: (err: Error | any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          }
        }
      );
    }
  }

  onSearch = (term: string) => {
    this.rateFactorSub.next({ term , page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.rateFactorSub.next({
      ...this.prevRateConfig, page
    });
  }

  onListFilter = (event: any) => {
    if(event) {
      this.filterConfig = event;
    } else {
      this.filterConfig = null;
    }

    this.rateFactorSub.next({
      ...this.prevRateConfig,
      page: 1
    });
  }

  onSortClick = (event: any) => {
    if (event?.order) {
      switch (event.name) {
        case 'name':
        case 'jobs':
        case 'abbreviation':
          this.vmsData.rate_factors = this.vmsData.rate_factors.sort(function (a, b) {
            const nameA = a[event.name].toUpperCase(); // ignore upper and lowercase
            const nameB = b[event.name].toUpperCase(); // ignore upper and lowercase
            if (event.order === 'ASC') {
              return nameA < nameB ? -1 : 1;
            } else {
              return nameA < nameB ? 1 : -1;
            }
          });
          break;
        case 'is_enabled':
          this.vmsData.rate_factors = this.vmsData.rate_factors.sort(function (a, b) {
            const codeA = a.is_enabled;
            const codeB = b.is_enabled;
            if (event.order === 'ASC') {
              return codeA < codeB ? -1 : 1;
            } else {
              return codeA < codeB ? 1 : -1;
            }
          });
          break;
        case 'modified_on':
          event.order === 'ASC'
            ? this.vmsData.rate_factors.sort((a, b) => new Date(a.modified_on).getTime() > new Date(b.modified_on).getTime() ? -1 : 1)
            : this.vmsData.rate_factors.sort((a, b) => new Date(a.modified_on).getTime() > new Date(b.modified_on).getTime() ? 1 : -1);
          break;
      }
    }
  }

  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    this.rateFactorSub.next({
      ...this.prevRateConfig,
      page: 1
    });
  }

  parseTimestamp(stamp: number) {
    let str_data: string = '' + stamp;
    if(str_data.includes('.')) {
      let time_data: Array <string> = str_data.split('.');
      return Number.parseInt(time_data[0] + time_data[1].slice(0, 3));
    }
    // Change timestamp format from BE (if needed)
    return stamp;
  }

  getAllRateFactors() {
    this.loader.show()
    this.subscriptions.push(
      this.rateFactorService.getAllRateFactors().subscribe(
        (data: any) => {
          if (data) {
            this.rateFactors = data?.result;
            this.showOrderChangeFlyout = true
          }
        },
        err => {
          this.alert.error(
            err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {}
          )
          console.error(err);
        },
        () => {
          this.loader.hide();
        }
      )
    );
  }

  onReorder = () => {
    this.getAllRateFactors()
  }

  onCloseReorderModel(event) {
    if(event) {
      this.showOrderChangeFlyout = false;
    }
  }

  onSaveReorderModal(event) {
    if(event) {
      let payload = {}
      event.forEach((item: any, index: number) => {
        payload[item.id] = index + 1
      })
      this.subscriptions.push(
        this.rateFactorService.reOrderRateFactor(payload).subscribe(
          (data: any) => {
            this.showOrderChangeFlyout = false
            this.alert.success('Rate Factor Reordered Successfully')
          },
          err => {
            this.alert.error(
              err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {}
            )
            console.error(err);
          },
          () => {
            this.loader.hide();
          }
        )
      )
    }
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  get itemPerPage() {
    return this.tablePaginationConfig?.itemsPerPage ?? 10;
  }

  set itemPerPage(count: any) {
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
