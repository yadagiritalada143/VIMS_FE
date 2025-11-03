import { Component, OnInit, OnDestroy } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TimesheetService } from '../timesheet.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
import { LoaderService } from '../../core/components/loader/loader.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-assignment-details-flyout',
  templateUrl: './assignment-details-flyout.component.html',
  styleUrls: ['./assignment-details-flyout.component.scss']
})
export class AssignmentDetailsFlyoutComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  assignmentDetails = "hidden";
  assignmentData: any;
  assignmentCode: string;
  showHideManagerListTimesheet: boolean = false;
  unitOfMeasureObj = {};

  constructor(
    public eventStream: EventStreamService,
    public timesheetService: TimesheetService,
    private alert: AlertService,
    private loader: LoaderService,
    private router: Router,
    private storageService: StorageService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.VIEW_ASSIGNMENT_TIMESHEET).subscribe((data: any) => {
      if (data?.value) {
        if (data?.assignment) {
          this.assignmentData = data.assignment;
        } else {
          let assignmentId = data?.data?.assignment_id;
          this.getAssignmentDetails(assignmentId);
        }
        this.assignmentDetails = 'visible';
        this.getUnitOfMeasure();
      }
    }));
  }

  showsidebar() {
    this.assignmentDetails = "visible";
  }

  sidebarClose() {
    this.assignmentDetails = "hidden";
  }

  getAssignmentDetails(assignmentId) {
    this.loader.show();
    this.subscriptions.push(this.timesheetService.getAssignmentDetails(assignmentId).subscribe({
      next: (data: any) => {
        if (data?.data) {
          this.assignmentData = data?.data?.assignments;
          this.assignmentCode = this.assignmentData?.assignment?.code;
          this.loader.hide();
        }
      }, error: (err) => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
      }
    }
    ));
  }
  goToAssignmentPage(id) {
    if (id) {
      this.router.navigate([`/assignment/details/${id}/final`], { queryParams: { tab: 'assignment' } });
    }
  }

  showManagerListTimesheet(){
    this.showHideManagerListTimesheet = true;
  }

  hideMoreNameListTimesheet(){
    this.showHideManagerListTimesheet = false;
  }

  getUnitOfMeasure() {
    const programDetails = this.storageService?.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails.id;
    this.timesheetService?.get(`/configurator/programs/${programId}/picklists/*/items?picklist_slug=unit_of_measure`)
      .subscribe((res: any) => {
        const { picklist_items } = res;
        picklist_items?.forEach(element => {
          this.unitOfMeasureObj[element?.value?.toLowerCase()] = element?.label;
        });
      })
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
