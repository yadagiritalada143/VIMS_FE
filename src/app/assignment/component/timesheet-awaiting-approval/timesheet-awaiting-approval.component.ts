import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { AssignmentService } from '../../assignment.service';
import { AccuracyConfigEnum } from '../../enums/accuracy-config';
import { ITimesheetItem } from './timesheet.model';

@Component({
  selector: 'app-timesheet-awaiting-approval',
  templateUrl: './timesheet-awaiting-approval.component.html',
  styleUrls: ['./timesheet-awaiting-approval.component.scss']
})
export class TimesheetAwaitingApprovalComponent implements OnInit, OnDestroy {
  @Input() currency: string;
  @Output() closeTimesheetAwait = new EventEmitter();
  title = 'Timesheet Awaiting Approval';

  public timesheetAwaiting = 'hidden';
  public programId: string;
  public timesheetData$: Observable<ITimesheetItem[]>;
  public hasOTHours = false;
  public hasDTHours = false;
  public showTotalAmount = false;
  accuracyConfig = AccuracyConfigEnum;

  private assignmentId: string;
  private subscrptions: Subscription[] = [];

  constructor(
    private eventStream: EventStreamService,
    private assignmentService: AssignmentService,
    private sessionStorage: StorageService,
    private timesheetService: TimesheetService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.TIMESHEET_AWAITING_APPROVAL).subscribe((status: string) => {
      if (status) {
        this.title = status === 'approved' ? 'Timesheet Approved' : 'Timesheet Awaiting Approval';
        this.timesheetAwaiting = 'visible';
        let programID = this.sessionStorage.get(StorageKeys.CURRENT_PROGRAM);
        this.programId = programID['id'];
        this.timesheetData$ = this.assignmentService.getTimesheetAwaitingApproval(1, 20, this.programId, this.assignmentId, status)
          .pipe(tap(data => {
            if (data) {
              this.hasOTHours = data.some(item => item.hours_breakup?.overtime);
              this.hasDTHours = data.some(item => item.hours_breakup?.doubletime);
            }
          }));
      } else {
        this.closeTimesheetAwait.emit();
        this.timesheetAwaiting = 'hidden';
      }
    }));
    this.assignmentId = this.route.snapshot.params.id;
    this.subscrptions.push(this.timesheetService.getConfigDetails(this.assignmentId).subscribe((res: any) => {
      this.showTotalAmount = res.data.is_enable_amount_visibility;
    }));
  }

  public sidebarClose(event: boolean): void {
    this.closeTimesheetAwait.emit();
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.TIMESHEET_AWAITING_APPROVAL, false));
    }
  }
  showToolTip(amount : any, accuracyType = this.accuracyConfig.amount)
  {
    return this.assignmentService?.showAmount(amount, this.currency, accuracyType);
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  viewTimesheet(item: any){
    const route = this.timesheetService.getTimesheetNavigationRoute(undefined, item);
    this.router.navigate([route], {
      queryParams:{
        timesheetId: item.timesheet_uuid,
        title: this.title
      }
    });
  }

}
