import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute } from '@angular/router';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { debounceTime, switchMap } from 'rxjs/operators';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-list-foundational-data',
  templateUrl: './list-foundational-data.component.html',
  styleUrls: ['./list-foundational-data.component.scss']
})
export class ListFoundationalDataComponent implements OnInit, OnDestroy {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();

  public filterPayload: any = {};
  public prevMasterSub: any = null;
  public isAdvanceSearch: boolean = false;

  public vmsData: any;
  public description: any;
  public totalRecords = 0;
  public itemsPerPage = 10;
  public fdTypeId: string = null;
  public isExpand: boolean = true;
  public masterDataDetails: any = null;
  public tableConfig: VMSConfig = {
    title: '',
    columnList: [
      { name: 'name', title: 'Data Type', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'code', title: 'Code', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'managers', title: 'Manager', width: 20, isIcon: false, isImage: false, isContact: false, isMultiUser: true, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 13, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isExpand: true,
    hideHeaderExpand: true,
    isBack: true,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Add Data',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Data Type', filterType: 'TEXT' },
      // { name: 'code', title: 'Code', filterType: 'TEXT'},
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'ACTIVE', value: true },
          { name: 'INACTIVE', value: false }
        ]
      },
      { name: 'modified_on', title: 'Date Updated range', filterType: 'DATERANGE' },
    ]
  };


  constructor(
    private eventStream: EventStreamService,
    private accessControlService: AccessControlService,
    private router: SvmsRouterService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private confirmService: ConfirmationDialogService,
    private localDatePipe: LocalDateFormatPipe
  ) { }


  ngOnInit(): void {

    // Master data listing
    this.subscriptions.push(
      this.masterSub.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          this.loader.show();
          this.prevMasterSub = query;
          const { page } = query;
          if (this.vmsTable) {
            this.vmsTable.currentPage = (page || 1);
          }

          if (this.isAdvanceSearch) {
            this.tableConfig.isSearch = false;
            return this.filterMasterDataObservable(query)
          }

          this.tableConfig.isSearch = true;
          return this.searchMasterDataObservable(query);

        })
      ).subscribe((data: any) => {
        if (data) {
          this.loader.hide();
          if (Array.isArray(data?.foundational_data)) {
            data.foundational_data.forEach((el: any) => {
              if (el.modified_on) {
                el.modified_on = this.localDatePipe.transform(el.modified_on, 'D MMMM y');
              }
            });
          }

          data.foundational_data.forEach((el: any) => {
            el.managers = ((el['manager']?.length) ? `${el['manager'][0].first_name}` + ` ${el['manager'][0].last_name}` : '--')
          });

          this.vmsData = data
          this.totalRecords = data?.total_records;

        }
      }, err => {
        console.error(err);
        this.alert.error('Error encountered while fetching entries');
        this.loader.hide();
      })
    );

    // Fetch Master data type (detail)
    this.subscriptions.push(
      this.route.queryParams
        .subscribe((map: any) => {

          const { name, id } = map;
          this.tableConfig.title = (name || 'Undefined');
          this.fdTypeId = id;

          this.fetchMasterDataDetails();
          this.masterSub.next({ page: 1 });

        })
    );

    // Master data (refresh)
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATION_DATA_LIST)
        .subscribe((data:any) => {
          if (data) {
            this.masterSub.next({ ...this.prevMasterSub });
          }
        }
        )
    );

  }

  onExpandClick(id: string) {
    if (id && this.vmsData) {
      const fdEntry: Array<any> = this.vmsData.foundational_data;
      if (Array.isArray(fdEntry)) {
        let entry: any = fdEntry.find((entry: any) => (entry?.id === id));
        this.description = entry?.description;
      }
    }
  }

  onCreateClick(event: any) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_CREATE, true));
    }
  }

  onBackClicked(event: any) {
    if (event) {
      this.router.navigate(['hierarchy', 'list']);
    }
  }

  onEditClick(event: any) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.FOUNDATIONAL_DATA_EDIT, obj));
    }
  }

  onViewClick(event: any) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.FOUNDATIONAL_DATA_VIEW, obj));
    }
  }

  onDisableClicked(event) {
    if (event) {

      let action: string = event?.is_enabled ? 'disable' : 'enable';
      let title: string = `Are you sure to ${action} the ${event?.name}?`;

      this.confirmService.confirm('', title, 'Yes', 'No')
        .then((confirmed: any) => {
          if (confirmed) {

            let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${this.fdTypeId}/foundational-data/${event?.id}`;
            const payload = {
              is_enabled: !event?.is_enabled
            };

            this.loader.show();
            this.programService.put(url, payload)
              .subscribe((data: any) => {
                if (data) {
                  this.loader.hide();
                  this.alert.success(`Master data item updated successfully.`);
                  event.is_enabled = !event.is_enabled;
                }
              }, (err) => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              }
              );
          }
        }
        );
    }
  }

  onDeleteClick(event) {
    if (event) {

      let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
      let title: string = `Are you sure to Delete the ${event?.name}?`;

      this.confirmService.confirm('', title, 'Yes', 'No')
        .then((confirmed: any) => {
          if (confirmed) {

            this.loader.show();
            const url: string = `/configurator/programs/${programId}/foundational-data-types/${this.fdTypeId}/foundational-data/${event?.id}`;
            this.programService.delete(url)
              .subscribe((data: any) => {
                if (data) {
                  this.loader.hide();
                  this.alert.success(`Master data item removed successfully.`);
                  this.masterSub.next({ ...this.prevMasterSub });
                }
              }, (err) => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              });

          }
        });

    }
  }

  onPaginationClick(page: number) {
    this.masterSub.next({ ...this.prevMasterSub, page });
  }

  onListFilter(event: any) {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterPayload = event;
    } else {
      this.isAdvanceSearch = false;
      this.filterPayload = {};
    }

    this.masterSub.next({ page: 1 });
  }

  onSearch(term: string) {
    this.masterSub.next({ page: 1, term });
  }

  fetchMasterDataDetails() {

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/foundational-data-types/${this.fdTypeId}`;

    this.programService.get(url).toPromise()
      .then((res: any) => {
        if (res) {
          if (res.foundational_data_type)
            this.masterDataDetails = res.foundational_data_type;
          else
            this.masterDataDetails = res;
        }
      }, err => {
        this.alert.error(errorHandler(err));
      });

  }

  searchMasterDataObservable(query: any): Observable<any> {

    const { term, page } = query;
    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/foundational-data-types/${this.fdTypeId}/foundational-data?info_level=full&limit=${this.itemsPerPage}`;

    if (page)
      url += `&page=${page}`;
    if (term)
      url += `&k=${term}`;

    return this.programService.get(url);

  }

  filterMasterDataObservable(query: any): Observable<any> {

    const { page } = query;
    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);

    let url: string = `/configurator/programs/${programId}/foundational-data-types/${this.fdTypeId}/foundational-data/advanced-filters?limit=${this.itemsPerPage}`;
    let payload = {
      "filters": {
        "name": this.filterPayload['name'],
        "is_enabled": this.filterPayload['is_enabled'],
        "date_range": this.filterPayload['modified_on'],
        // "code":payload['code'],
      }
    };

    if(page) {
      url += `&page=${page}`;
    }

    return this.programService.post(url, payload);
  }

  get showTable() {
    return (this.totalRecords || this.isAdvanceSearch);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
