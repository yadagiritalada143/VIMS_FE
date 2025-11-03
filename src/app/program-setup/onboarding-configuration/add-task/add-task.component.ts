import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent implements OnInit, OnDestroy {
  @Input() addTask = 'hidden';
  private subscriptions: Subscription[] = [];
  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.CREATE_TASK)
    .subscribe((data) => {
      this.addTask = 'visible';
    }));
  }

  sidebarClose() {
    this.addTask = 'hidden'
  }
  
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
