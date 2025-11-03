import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from '../timesheet.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TimesheetConstants } from '../timesheet.enums';
import { Subscription, Subject, } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';


@Component({
  selector: 'app-enter-timesheet',
  templateUrl: './enter-timesheet.component.html',
  styleUrls: ['./enter-timesheet.component.scss']
})
export class EnterTimesheetComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() enterTimesheet = 'hidden';
  @Input() config;
  workers = [];
  duration = [];
  public enterTimesheetForm: UntypedFormGroup;
  public isTimesheetEnabled: boolean = true;
  currentWorkerId;
  isWorker: boolean = false;
  assignment: any;
  public workerTypeAhead$: Subject<any> = new Subject<any>();
  public workerLoading: boolean = false;
  logs: Log = undefined;
  
  @Output() hasTimesheetAccess = new EventEmitter();
  page: number;
  limit: number;
  totalWorkers: number;
  constructor(
    private eventStream: EventStreamService,
    private timesheetService: TimesheetService,
    private alert: AlertService,
    private fb: UntypedFormBuilder,
    private router: Router,
    public storage: StorageService
  ) { }

  get timesheet() { return this.enterTimesheetForm.controls; }

  ngOnInit(): void {
    const user = this.storage.get(StorageKeys.CURRENT_USER);
    this.isWorker = user?.is_candidate;
    this.enterTimesheetForm = this.fb.group({
      worker: [null, Validators.required],
      assignment: [null, Validators.required],
      month: [null, Validators.required],
      workerId: [null, '']
    });
    this.workerSetup(user);
    this.subscriptions.push(this.eventStream.on(Events.ENTER_TIMESHEET).subscribe((data) => {
      if (data) {
        this.enterTimesheet = 'visible';
        this.workerSetup(user);
      } else {
        this.enterTimesheet = 'hidden';
      }
    }));
    this.getWorkersList(undefined);
    this.workerTypeAhead$.pipe(debounceTime(100), distinctUntilChanged(), tap(() => {
      this.workerLoading = true;
      this.workers = [];
    }),filter(value => { 
      this.workerLoading = false;
      return value !== null
    }),switchMap((value: any) =>
      this.timesheetService.get(`/assignment/programs/${this.storage.get(StorageKeys.CURRENT_PROGRAM)?.id}/worker?limit=25&page=1&search=${value}`)
    )).subscribe((newData: any) => {
      this.workerLoading = false;
      this.page = 1;
      if (newData?.data) {
        this.workers = newData.data?.worker;
        this.totalWorkers = newData.data?.total_records;
        this.assignment = undefined;
        if (this.isWorker && this.workers?.length > 0) {
          this.enterTimesheetForm.patchValue({ worker: this.workers[0] });
          this.getAssignment(this.workers[0]);
        }
      }
    });
  }

  workerSetup(user) {
    if (this.isWorker) {
      let workerControl = this.enterTimesheetForm.get('worker');
      workerControl.setValidators(null);
      workerControl.updateValueAndValidity();
      this.enterTimesheetForm.patchValue({
        worker: { user: user },
        workerId: user?.id
      });
      if (this.assignment?.length == 1) {
        this.enterTimesheetForm.patchValue({
          assignment: this.assignment?.[0]?.assignment_uuid
        });
        if (this.duration?.length > 0) {
          this.enterTimesheetForm.patchValue({
            month: this.duration[0]
          });
        }
      }


    }
  }

  loadMoreWorkerData(searchTerm) {
    searchTerm = !!searchTerm ? searchTerm : '';
    if((this.page *  this.limit) < this.totalWorkers) {
      this.getWorkersList(searchTerm, this.page+1)
    }
  }

  sidebarClose() {
    this.enterTimesheet = 'hidden';
    this.enterTimesheetForm.reset();
    this.router.navigate(['/timesheet/list/all']);
  }

  getWorkersList(searchText, page = 1, limit = 25) {
    this.logs = undefined;
    this.workerLoading = true;
    this.page = page;
    this.limit = limit;
    this.subscriptions.push(this.timesheetService.getWorkersList(searchText, page, limit).subscribe(
      {
        next: (data: any) => {
          this.workerLoading = false;
          if (data?.data) {
            this.workers = [...this.workers, ...data.data?.worker];
            this.totalWorkers = data.data?.total_records;
            this.assignment = undefined;
            if (this.isWorker && this.workers?.length > 0) {
              this.enterTimesheetForm.patchValue({ worker: this.workers[0] });
              this.getAssignment(this.workers[0]);
            }
          }
        }, error: (err) => {
          this.workerLoading = false;
          // this.alert.error(errorHandler(err));
          this.showError(err);
        }
      }
    ));
  }

  searchWorker(search) {
    this.getWorkersList(search?.term);
  }

  checkIfTimesheetEnabled(assignmentId, userId) {
    this.assignment?.forEach(assignment => {
      if (assignment.assignment_uuid === assignmentId) {
        this.isTimesheetEnabled = assignment.is_timesheet_enabled;
        if (this.isTimesheetEnabled) {
          this.getTimeDuration(assignmentId, userId);
        }
      }
    });
  }

  getTimeDuration(assignmentId, userId) {
    this.logs = undefined;
    this.subscriptions.push(this.timesheetService.getDuration(assignmentId, userId).subscribe(
      {
        next: (data: any) => {
          if (data?.data) {
            let duration = data?.data?.duration || [];
            duration.forEach(duration => {
              duration.display_value = this.timesheetService.getFormattedDate(duration?.start_date, duration?.end_date, duration?.meta_data?.layout?.duration);
            });
            this.duration = duration;
            this.enterTimesheetForm.patchValue({
              month: this.duration[0]
            });
          }
        }, error: (err) => {
          this.showError(err);
          /* if(err?.error?.error?.errors?.length>0 && err?.error?.error?.errors[0]?.message){
             // this.alert.error(err?.error?.error?.errors[0]?.message);
            this.showError(err);
            } else {
              //this.alert.error(errorHandler(err));
            this.showError(err);
            }; */
        }
      }
    ));
  }

  goToEntryPage() {
    if (this.enterTimesheetForm.valid) {
      const data = { ...this.enterTimesheetForm.value };
      const values = { ...data.month };
      values['assignment_id'] = this.enterTimesheetForm.get('assignment').value;
      values['timesheet_uuid'] = data?.month['timesheet_id'];
      values['user_id'] = data?.worker?.user?.id;
      this.storage.set(TimesheetConstants.TIMESHEET, values, true);
      // this.config.hour_type_calculation= TimesheetWeeklyType.AUTOMATIC;
      const route = this.timesheetService.getTimesheetNavigationRoute(this.config, values);
      this.router.navigate([route]);
    } else {
      this.alert.error('Please fill the required fields!')
    }
  }

  getAssignment(e) {
    this.logs = undefined;
    this.hasTimesheetAccess.emit(false);
    const programDetails = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails['id'];
    let _url = `/assignment/programs/${programId}/worker/${e?.worker_id}/assignment?is_timesheet_enabled=true`;
    this.subscriptions.push(this.timesheetService.get(_url).subscribe(
      {
        next: (data: any) => {
          if (data) {
            this.assignment = data?.data;
            if (this.assignment && this.assignment?.length == 1) {
              this.enterTimesheetForm.patchValue({
                assignment: this.assignment[0]?.assignment_uuid
              });
              this.checkIfTimesheetEnabled(this.assignment[0]?.assignment_uuid, e?.user?.id);
            } else {      
              if(!this.assignment || this.assignment?.length == 0) {
                if(this.isWorker) {
                  this.hasTimesheetAccess.emit(true);
                }
                this.logs = { type: LOG_TYPE.WARNING, heading: "User doesn’t have access to the Timesheet module.",  isShown: true, hideClose: false };
              }
              this.enterTimesheetForm.patchValue({
                assignment: null,
                month: null
              });
              // If Worker login need to show selected assignment selected in dropdown // V2M-11255
              if( this.isWorker && this.storage.get(StorageKeys?.ASSIGNMENT_UUID)) {
                this.enterTimesheetForm.patchValue({
                  assignment: this.storage.get(StorageKeys?.ASSIGNMENT_UUID),
                });
                this.checkIfTimesheetEnabled(this.storage.get(StorageKeys?.ASSIGNMENT_UUID),this.timesheet?.worker?.value?.user?.id);
              }
            }
          }
        }, error: err => {
          this.showError(err);
        }
      }
    ));
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
