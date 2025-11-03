import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AdvanceFiltter, VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AccessControlService } from 'src/app/core/services/access-control.service';
type Visibility = ('visible' | 'hidden');

@Component({
  selector: 'app-list-picklist',
  templateUrl: './list-picklist.component.html',
  styleUrls: ['./list-picklist.component.scss']
})
export class ListPicklistComponent implements OnInit, OnDestroy {

  private subscriptions: Array<Subscription> = [];
  private listSubject: Subject<any> = new Subject<any>();

  public prevListConfig: any = { page: null, term: null };
  public advanceFilterConfig: any = null;

  public currentPage: number = 0;
  public totalRecords: number = 0;
  public recordCount: number = 10;
  public vmsData: Array<any> = [];
  public tableLoading: boolean = false;
  public sidebarVisibility: Visibility = 'hidden';
  public tableConfig: VMSConfig = {
    title: 'Picklists',
    searchPlaceHolder: 'Search',
    columnList: [
      {
        name: 'picklist_id',
        title: 'Picklist ID',
        width: 20,
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
        isVieworEdit: true,
        isDisableorDelete: this.accessControlService.accessControl()
      }, {
        name: 'name',
        title: 'Picklist Name',
        width: 15,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
        isClickable: true
      }, {
        name: 'count',
        title: 'No. of Picklist Values',
        width: 10,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: true,
        isSort: false
      }, {
        name: 'defined_by',
        title: 'Defined By',
        width: 10,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true
      }, {
        name: 'is_enabled',
        title: 'Status',
        width: 10,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
      }, {
        name: 'last_updated',
        title: 'Last Updated',
        width: 10,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
        isSort: true,
      }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    hideBottomPagination: false,
    isCreate: this.isAdmin,
    density: 'COMFORTABLE',
    allowReordering: false,
    isCreateButtonName: 'Add New PickList Template',
    advanceFilter: [
      {
        name: 'picklist_name',
        title: 'Picklist Name',
        loading: false,
        filterType: 'MULTISELECT',
        eventListener: 'FILTER_PICKLIST',
        multiSelectData: [],
        mandatory: false
      }, {
        name: 'defined_by',
        title: 'Defined By',
        filterType: 'SELECT',
        multiSelectData: [
          { name: 'Predefined', value: 'PREDEFINED' },
          { name: 'Program', value: 'PROGRAM' }
        ],
      },
    ],
  };

  constructor(
    private alert: AlertService,
    private programService: ProgramService,
    private storageService: StorageService,
    private accessControlService: AccessControlService,
    private localDatePipe: LocalDateFormatPipe,
    private sortPipe: SortHelperPipe,
    private eventStream: EventStreamService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {

    // Loading page entry
    this.subscriptions.push(
      this.listSubject.pipe(
        debounceTime(400),
        switchMap(({ term, page }) => {
          this.tableLoading = true;
          this.currentPage = page;
          this.prevListConfig = { term, page };
          return this.getPicklistObservable(term, page);
        })
      ).subscribe((data: any) => {
        if (data) {

          this.tableLoading = false;
          this.totalRecords = data.total_records;
          if ('pick_lists' in data) {
            let result = data.pick_lists;
            result.forEach((entry: any, it: number) => {

              // item count
              result[it].count = (entry?.picklist_item?.length || 0);

              // date format
              let last_updated: Date = new Date(Number.parseInt(result[it].modified_on) * 1000);
              result[it].last_updated_num = last_updated?.getTime(); 
              result[it].last_updated = this.localDatePipe.transform(last_updated);

            });

            this.vmsData = result;
          }
        }
      }, (err) => {
        this.tableLoading = false;
        this.alert.error(errorHandler(err));
      })
    );

    // Picklist filter
    const filterObject: AdvanceFiltter = this.tableConfig.advanceFilter[0];
    this.subscriptions.push(
      this.eventStream.on(Events.FILTER_PICKLIST)
        .pipe(
          debounceTime(600),
          distinctUntilChanged((prev: any, curr: any) => (prev?.term === curr?.term)),
          switchMap(({ term }) => {
            this.tableConfig.advanceFilter[0].loading = true;
            return this.getPicklistObservable(term, 1);
          })
        ).subscribe((data: any) => {
          if (data) {

            this.tableConfig.advanceFilter[0].loading = false;
            if ('pick_lists' in data) {
              let result = data.pick_lists;
              result = result.map((entry: any) => {
                return {
                  name: entry?.name,
                  value: entry?.name
                }
              });

              filterObject.multiSelectData = result;
            }
          }
        }, (err) => {
          this.alert.error(errorHandler(err));
          this.tableConfig.advanceFilter[0].loading = false;
        })
    )

    this.eventStream.emit(new EmitEvent(Events.FILTER_PICKLIST, { term: '' }));
    this.listSubject.next({ term: '', page: 1 });

  }

  onCreateClick(evt: any): void {
    this.sidebarVisibility = 'visible';
  }

  onEditClick(evt: any): void {
    if (evt) {
      this.sidebarVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.EDIT_PICKLIST, evt));
    }
  }

  onDisableClick(evt: any): void {
    if (evt?.id) {

      if(evt?.defined_by?.toUpperCase() === 'PREDEFINED') {
        this.alert.error('Updating status for a predefined picklist is not allowed!');
        return;
      }

      const id: string = evt.id;
      let url: string = `/configurator/programs/${this.programId}/pick-lists/${id}`;
      let payload = {
        is_enabled: Boolean(!evt?.is_enabled)
      };

      this.loader.show();
      this.programService.put(url, payload).subscribe((data: any) => {
        if (data) {
          this.loader.hide();
          this.listSubject.next(this.prevListConfig);
          this.alert.success(`Picklist entry ${evt?.is_enabled?'disabled':'enabled'} successfully`);
        }
      }, err => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
      })

    }
  }

  onSortClick(evt: any): void {
    if (evt) {
      let { name, order } = evt;
      order = (order === 'ASC') ? 1 : -1;
      if(name === 'last_updated') {
        this.vmsData = this.sortPipe.transform(this.vmsData, 'last_updated_num', order);  
        return;
      }

      this.vmsData = this.sortPipe.transform(this.vmsData, name, order);
    }
  }

  onViewClick(evt: any): void {
    if (evt) {
      const { vmsData, column } = evt;
      if (vmsData && (column?.name === 'name')) {
        this.sidebarVisibility = 'visible';
        this.eventStream.emit(new EmitEvent(Events.VIEW_PICKLIST, evt?.vmsData));
      }
    }
  }

  onSearch(term: string): void {
    this.listSubject.next({
      page: 1, term: term
    });
  }

  onFilter(evt: any): void {
    if (evt) {
      this.tableConfig.isSearch = false;
      this.advanceFilterConfig = {
        picklist_name: evt?.picklist_name?.join(','),
        defined_by: evt?.defined_by
      };

      if(!this.advanceFilterConfig?.picklist_name)
        delete this.advanceFilterConfig['picklist_name'];

      if(!this.advanceFilterConfig?.defined_by)
        delete this.advanceFilterConfig['defined_by'];

    } else {
      this.tableConfig.isSearch = true;
      this.advanceFilterConfig = null;
    }

    this.listSubject.next({ term: '', page: 1 });

  }

  changeCurrentPage(page: number): void {
    this.listSubject.next({ ...this.prevListConfig, page });
  }

  changeItemsPerPage(count: number): void {
    this.recordCount = count;
    this.listSubject.next({ ...this.prevListConfig, page: 1 });
  }

  refreshList(flag: boolean) {
    if (flag) {
      this.listSubject.next(this.prevListConfig);
    }
  }

  getPicklistObservable(term: string = '', page: number = 1): Observable<any> {

    let url = `/configurator/programs/${this.programId}/pick-lists?limit=${this.recordCount}&page=${page}`;

    if (!this.advanceFilterConfig) {
      if (term) {
        url += `&picklist_name=${term}`;
      }
    } else {
      const { picklist_name, defined_by } = this.advanceFilterConfig;
      if(picklist_name) {
      url += `&picklist_name=${picklist_name}`;
      }
      if (defined_by) {
        url += `&defined_by=${defined_by}`;
      }
    }

    return this.programService.get(url);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  get isAdmin() {
    return Boolean(this.storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }
}
