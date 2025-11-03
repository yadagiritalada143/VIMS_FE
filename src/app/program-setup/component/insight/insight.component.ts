import { Component, OnInit } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-insight',
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.scss']
})
export class InsightComponent implements OnInit {

  constructor(private eventStream: EventStreamService,private router: Router) { }

  ngOnInit(): void {
  }

  onInsightClick() {
    this.eventStream.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, false));
  }

  createUser(){
    this.router.navigateByUrl('/users/list/add');
  }

  createHierarchy(){
    this.router.navigateByUrl('/hierarchy/hierarchy-configuraton');
  }
}
