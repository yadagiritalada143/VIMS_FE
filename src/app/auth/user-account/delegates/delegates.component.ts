import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { debounceTime, Subject, Subscription, switchMap } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
enum ModuleGroups {
  TimeAndExpense = 'time & expense',
  Job = 'job',
  StatementOfWork = 'statement of work',
  RFX = 'rfx'
};

@Component({
  selector: 'app-delegates',
  templateUrl: './delegates.component.html',
  styleUrls: ['./delegates.component.scss']
})
export class DelegatesComponent implements OnInit, OnDestroy {

  public vmsData: Array<any> = [];
  public tableConfig: VMSConfig;
  public delegateList: any;
  public tableLoaded: boolean = false;
  public totalRecords: number = 0;
  public programId: string;
  public activeStatus: string = 'active';
  public itemsPerPage: number = 25;
  public dataLoading: boolean = false;
  public prevQuery: any = null;

  public countData: Array<number> = [];
  public selectedTab: string = 'Active Delegates';
  public programMember: any;
  public profileUser: any = {};
  public logs: Log = undefined;

  private subscriptions: Array<Subscription> = [];
  private delegateSubject: Subject<any> = new Subject<any>();

  constructor(
    private eventStream: EventStreamService,
    private _alert: AlertService,
    private loader: LoaderService,
    public userService: UserService,
    private storageService: StorageService,
    private programService: ProgramService,
    private datePipe: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {

    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.profileUser = this.storageService.get(StorageKeys.CURRENT_USER);
    this.tableConfig = {
      title: 'Delegates',
      isCreateButtonName: 'Create Delegates',
      permission: 'create_delegate',
      columnList: this.delegateColumns(),
      tabsList: ['Active Delegates', 'Upcoming Delegates', 'Past Delegates'],
      showTabs: true,
      isExpand: false,
      isFilter: false,
      isSort: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isCreate: true,
      density: 'COMFORTABLE',
      hideBottomPagination: false,
      tableWidth: "100%"
    };

    this.initDelegateSubject();
    this.getProgramMember();
  }

  initDelegateSubject() {
    this.subscriptions.push(
      this.delegateSubject.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          this.dataLoading = true;
          if (!this.tableLoaded) {
            this.loader.show();
          }

          const { page, status } = (query ?? {});
          this.prevQuery = {
            page: (page ?? 1),
            status: (status ?? this.activeStatus)
          };

          let url = `/configurator/programs/${this.programId}/members/${this.programMember?.id}/delegations?limit=${this.itemsPerPage}`;
          if (page) {
            url += `&page=${page}`;
          }

          if (status) {
            url += `&status=${status}`;
          }

          return this.programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          if (data) {
            data?.delegations?.forEach(d => {
              d.new_start_date = d?.start_date_converted?.split(' ')?.[0] ?? this.datePipe.transform(this.formatDate(d?.start_date), null, null, null, true);
              d.new_end_date = d?.end_date_converted?.split(' ')?.[0] ?? this.datePipe.transform(this.formatDate(d?.end_date), null, null, null, true);
              d.new_delegate_end = d?.delegate_end_converted?.split(' ')?.[0] ?? this.datePipe.transform(this.formatDate(d?.delegate_end), null, null, null, true);
              d?.module_groups?.forEach((dModule: any) => {
                dModule.display_name = dModule?.name;
                if (dModule?.name?.toLowerCase() === ModuleGroups.Job) {
                  dModule.display_name = 'Job, Submission, Interview & Offer';
                }
                if (dModule?.name?.toLowerCase() === ModuleGroups?.StatementOfWork) {
                  dModule.display_name = 'Statement of Work (SOW), Progress Update';
                }
                if (dModule?.name?.toLowerCase() === ModuleGroups?.RFX) {
                  dModule.display_name = 'RFx, Bid';
                }
              })

              d.display_name = (d?.module_groups ?? [])?.map((dModule: any) => {
                return dModule.display_name;
              }).filter((term: string) => term).join(', ');
            });

            this.delegateList = data;
            this.totalRecords = data.total_records;
            this.countData = [data?.count?.active, data?.count?.pending, data?.count?.past]
            this.dataLoading = false;
            this.tableLoaded = true;
            this.loader.hide();
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.dataLoading = false;
          this.showError(errorHandler(err));
        }
      })
    );
  }

  getProgramMember() {
    this.loader.show();
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userService.getMembershipDetails(programDetails?.id, this.profileUser.id)
      .subscribe({
        next: (res: any) => {
        const { member } = (res ?? {});
        this.programMember = member;
        this.delegateSubject.next({
          page: 1, status: this.activeStatus
        });
      }, error: (err: any) => {
        this.loader.hide();
        this.showError(errorHandler(err));
      }
    });
  }

  formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [month, day, year].join('-');
  }

  addDelegates($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_DELEGATE, { value: true }));
    }
  }

  onOptionClick(event) {
    if (event?.option?.name === 'Delete') {
      this.deleteDelegate(event?.data);
    } else if (event?.option?.name === 'Edit') {
      this.onEditClick(event);
    } else {
      this.updateDelegate(event?.data);
    }
  }

  onCreateClick($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_DELEGATE, { value: true }));
    }
  }

  onEditClick(event) {
    let obj = { "event": true, "data": event, "type": this.activeStatus };
    this.eventStream.emit(new EmitEvent(Events.ADD_DELEGATE, { value: true }));
    this.eventStream.emit(new EmitEvent(Events.EDIT_DELEGATE, obj))
  }

  onClickView($event) {

  }

  delegateColumns() {
    return [
      {
        name: 'delegated_by.full_name', title: 'Delegate From', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false,isNoOption: false, isVieworEdit: false, isDelete: false, options: [
          { name: 'Edit', icon: 'person_remove'},
          {name: 'End Delegate', icon: 'person_remove'}]
      },
      {
        name: 'delegated_to.full_name', title: 'Delegate To', width: 20, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isNoOption: false, isVieworEdit: false, isDelete: false
      },
      { name: 'new_start_date', title: 'Start Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'new_end_date', title: 'End Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      // { name: 'delegate_end', title: 'Delegation End Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'display_name', title: 'Modules', width: 40, isArray: false, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true},
    ]
  }

  onTabClick(event) {

    event = event?.toLowerCase();
    if (event?.includes('upcoming')) {
      this.activeStatus = 'pending';
      this.tableConfig.columnList = this.delegateColumns();

    }
    else if (event?.includes('active')) {
      this.activeStatus = 'active';
      this.tableConfig.columnList = this.delegateColumns();

    }
    else if (event?.includes('past')) {
      this.activeStatus = 'past';
      this.tableConfig.columnList = this.delegateColumns();
      const index = this.tableConfig?.columnList?.findIndex((e) => e?.name === 'module_groups.name');
      this.tableConfig?.columnList?.splice(index, 0, { name: 'new_delegate_end', title: 'Delegation End Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false });
    }

    this.delegateSubject.next({
      page: 1, status: this.activeStatus
    });
  }

  onPageChange(page: number) {
    this.delegateSubject.next({
      page, status: this.activeStatus
    })
  }

  changeItemCount(count: number) {
    this.itemsPerPage = count;
    this.delegateSubject.next({
      page: 1, status: this.activeStatus
    });
  }

  onClose(event) {
    this.delegateSubject.next(this.prevQuery);
  }

  updateDelegate(data: any): void {
    if (data) {

      let userId: string = this.storageService.get(StorageKeys.CURRENT_USER)?.id;
      let url: string = `/configurator/programs/${this.programId}/members/${userId}/delegations/${data?.id}`;
      let display_name: string = "";

      if (Array.isArray(data?.module_groups)) {
        display_name = data.module_groups
          .filter((entry: any) => entry?.is_enabled)
          .map((entry: any) => entry?.display_name)
          .join(', ');
      }

      let payLoad = {
        is_enabled: false,
        tz_offset: new Date().toString().match(/[\+,\-](\d{4})\s/g)[0].trim(),
        display_name
      };

      this.loader.show();
      this.programService.put(url, payLoad)
        .subscribe({
          next: (data: any) => {
            this.loader.hide();
            this._alert.success(`You have ended delegate successfully`);
            this.delegateSubject.next({
              page: 1, status: this.activeStatus
            });
          }, error: (err: any) => {
            this.loader.hide();
            console.error(err);
            this.showError(err);
          }
        }
      );
    }
  }

  deleteDelegate(data) {

    this.loader.show();
    let userId = this.storageService.get('user')?.id;
    this.programService.delete(`/configurator/programs/${this.programId}/members/${userId}/delegations/${data?.id}`)
      .subscribe({
        next: (data: any) => {
          this.loader.hide();
          this._alert.success(`You have deleted delegate successfully.`);
          this.delegateSubject.next({
            page: 1, status: this.activeStatus
          });
        }, error: (err: any) => {
          // this._alert.error(errorHandler(err));
          this.loader.hide();
          this.showError(err);
        }
      }
      );
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ? err?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}