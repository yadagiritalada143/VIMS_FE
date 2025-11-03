import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { AssignmentService } from '../../assignment.service';

@Component({
  selector: 'app-mass-update-assignment',
  templateUrl: './mass-update-assignment.component.html',
  styleUrls: ['./mass-update-assignment.component.scss']
})
export class MassUpdateAssignmentComponent implements OnInit, OnDestroy {
  @Input() fieldsList: any[] = [];
  updateForm: UntypedFormGroup = this.fb.group({
    module: [{ value: null, disabled: true }],
    field_name: [],
    field_value: [],
    effective_date: [],
    reason: [],
    request_notes: []
  });
  private subscrptions: Subscription[] = [];
  massUpdateAssignment = "hidden";
  constructor(private eventStream: EventStreamService, private fb: UntypedFormBuilder, assignmentService: AssignmentService) {

  }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.MASS_UPDATE_ASSIGNMENT).subscribe((data) => {
      if (data) {
        this.massUpdateAssignment = "visible";
      }
      else {
        this.massUpdateAssignment = "hidden"
      }
    }));

  }
  sidebarClose() {
    this.massUpdateAssignment = "hidden";
  }

  reviewSummary($event) {
    this.massUpdateAssignment = "hidden";
    this.eventStream.emit(new EmitEvent(Events.SUMMARY_PAGE_INFO, { value: $event }));
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
