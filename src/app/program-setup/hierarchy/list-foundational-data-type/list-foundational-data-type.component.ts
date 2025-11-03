import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-list-foundational-data-type',
  templateUrl: './list-foundational-data-type.component.html',
  styleUrls: ['./list-foundational-data-type.component.scss']
})
export class ListFoundationalDataTypeComponent implements OnInit, OnDestroy {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';

  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';
  public masterFlyoutVisibility: ('visible' | 'hidden') = 'hidden';

  tableConfig: VMSConfig = {
    title: 'Master Data Types',
    columnList: [
      { name: 'name', title: 'Data Type', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'configuration', title: 'Modules', width: 20, isIcon: false, isIconList: true, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 13, isIcon: false, isImage: false, isContact: false, isDetails: true, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isExpand: true,
    hideHeaderExpand: true,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: true,
    isReorder: true,
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Data Type', filterType: 'TEXT' },
      { name: 'modified_on', title: 'Updated Date Range', filterType: 'DATERANGE' },
      {
        name: 'module_jobs', title: 'Contingent', filterType: 'SELECT', multiSelectData: [
          { name: 'OFF', value: 'OFF' },
          { name: 'OPTIONAL', value: 'OPTIONAL' },
          { name: 'REQUIRED', value: 'REQUIRED' },
        ]
      },
      {
        name: 'module_sow', title: 'Services Procurement', filterType: 'SELECT', multiSelectData: [
          { name: 'OFF', value: 'OFF' },
          { name: 'OPTIONAL', value: 'OPTIONAL' },
          { name: 'REQUIRED', value: 'REQUIRED' },
        ]
      },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'ACTIVE', value: true },
          { name: 'INACTIVE', value: false }
        ]
      },
    ]
  }

  constructor(
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private _confirmService: ConfirmationDialogService,
    private localDateFormat: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {

    // Listing API
    this.subscriptions.push(
      this.masterSub.pipe(
        debounceTime(600),
        switchMap((config: any) => {

          this._loader.show();
          this.prevMasterConfig = config;

          if (this.isAdvanceSearch) {
            this.tableConfig.isSearch = false;
            return this.fetchAdvanceSearchObservable(config);
          }

          this.tableConfig.isSearch = true;
          return this.fetchSearchObservable(config);
        })
      ).subscribe((data: any) => {
        if (data) {

          this.sortByRefColumn(data);
          this.vmsData = data;

          const fdTypes: Array<any> = this.vmsData?.foundational_data_types;
          fdTypes.forEach((el: any) => {
            el.modified_on = this.localDateFormat.transform(el?.modified_on, '', '', '', true)
          });

          this.itemPerPage = data?.items_per_page;
          this.totalRecords = data?.total_records;

          this._loader.hide();
          if (this.vmsTable && this.prevMasterConfig) {
            this.vmsTable.currentPage = (this.prevMasterConfig?.page || 1);
          }
        }
      },
        (err) => {
          this._loader.hide();
          console.error(err);
          this._alert.error('Error occured while loading Master data types');
        }
      )
    );

    // Refresh listing
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATION_DATA_TYPE_LIST)
        .subscribe((flag: boolean) => {
          if (flag) {
            this.masterSub.next({ page: 1, term: '' });
          }
        }
        )
    );

    // Trigger (Create)
    this.subscriptions.push(
      this.route.paramMap.
        subscribe((param: ParamMap) => {
          if (param.get('add')) {
            this.masterFlyoutVisibility = 'visible';
          }
        }
        )
    );

    this.masterSub.next({ page: 1, term: '' });

  }

  fetchSearchObservable(config: any): Observable<any> {

    const { page, term } = config;
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/foundational-data-types?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this._programService.get(url);

  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {

    let filter: any = {
      "pagination": {
        "limit": 10,
        "page": (page || 1),
      }
    }

    if (this.filterpayLoad) {
      filter['filters'] = {
        "name": this.filterpayLoad['name'],
        "is_enabled": this.filterpayLoad['is_enabled'],
        "date_range": this.filterpayLoad['modified_on'],
        "module_jobs": this.filterpayLoad['module_jobs'],
        "module_sow": this.filterpayLoad['module_sow'],
      }
    }

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url: string = `/configurator/programs/${programId}/foundational-data-types/advanced-filters`;

    return this._programService.post(url, filter);

  }

  onSearch(term: string) {
    this.masterSub.next({ term, page: 1 });
  }

  sortByRefColumn(vmsData: any) {
    if (vmsData) {
      const fdList: Array<any> = vmsData.foundational_data_types;
      if (Array.isArray(fdList)) {
        fdList.sort((x: any, y: any) => {
          return (x.ref_order - y.ref_order);
        })
      }
    }
  }

  onClickView(evt: any) {
    if (evt) {
      this.router.navigate(['hierarchy','list-foundational-data'], {
        queryParams: {
          name: evt?.name,
          id: evt?.id
        }
      });
    }
  }

  onCreateClick(event) {
    if (event) {
      this.masterFlyoutVisibility = 'visible';
    }
  }

  onReorderClicked() {
    this.reorderFlyoutVisibility = 'visible';
  }

  closeReorderFlyout() {
    this.reorderFlyoutVisibility = 'hidden';
  }

  onEditClick(event) {
    if (event) {
      this.masterFlyoutVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.FOUNDATIONAL_DATA_TYPE_EDIT, {
        event: true,
        data: event
      })
      );
    }
  }

  onDisableClicked(event) {
    if (event) {

      let state: string = event?.is_enabled ? 'disable' : 'enable';
      let message: string = `Are you sure to ${state} the ${event.name}?`;

      this._confirmService.confirm('', message, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {

            const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${event?.id}`;
            let payload: any = {
              ...event,
              is_enabled: !event?.is_enabled
            };

            if ('dependent_foundational_data_types' in payload) {
              delete payload.dependent_foundational_data_types;
            }

            if ('dependent_custom_fields' in payload) {
              delete payload.dependent_custom_fields;
            }

            this._loader.show();
            this._programService.put(url, payload)
              .subscribe((res: any) => {
                if (res) {
                  this._loader.hide();
                  this._alert.success(`Master Data Type ${state}d successfully`);
                  event.is_enabled = !event.is_enabled;
                }
              }, err => {
                this._loader.hide();
                this._alert.error(errorHandler(err));
              }
              )
          }
        })
        .catch(err => {
          console.error(err);
        });

    }
  }

  onExpandClick(id: string) {
    if (id) {
      const fd_types: Array<any> = this.vmsData?.foundational_data_types;
      if (Array.isArray(fd_types)) {
        let entry: any = fd_types.find((entry: any) => (entry?.id === id));
        this.description = entry?.description;
      }
    }
  }

  onDeleteClick(event) {
    if (event) {

      let title: string = `Are you sure to delete the ${event?.name}?`;
      this._confirmService.confirm('', title, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {

            const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${event?.id}`;

            this._loader.show();
            this._programService.delete(url)
              .subscribe((res: any) => {
                if (res) {
                  this._loader.hide();
                  this._alert.success('Master data type deleted successfully');
                  this.masterSub.next(this.prevMasterConfig);
                }
              }, err => {
                this._loader.hide();
                this._alert.error(errorHandler(err));
              })

          }
        })
        .catch(err => {
          console.error(err);
        }
        );
    }
  }

  onDetailClick(event) {
    if (event) {
      this.masterFlyoutVisibility = 'visible';
      this.eventStream.emit(new EmitEvent(Events.FOUNDATIONAL_DATA_TYPE_VIEW, {
        event: true,
        data: event
      }));
    }
  }

  onPaginationClick(page: number) {
    this.masterSub.next({
      ...this.prevMasterConfig,
      page: page
    });
  }

  onListFilter(event: any) {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next({ page: 1 });
    } else {
      this.isAdvanceSearch = false;
      this.masterSub.next({ page: 1, term: '' });
    }
  }

  toggleMasterFlyoutVisibility(evt: any) {
    this.masterFlyoutVisibility = evt;
  }

  get showTable() {
    return this.totalRecords || this.isAdvanceSearch;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
