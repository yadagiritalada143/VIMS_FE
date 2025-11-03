import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';

export type ORG_TYPE = 'TYPE_MSP' | 'TYPE_VENDOR' | 'TYPE_CLIENT';

@Component({
  selector: 'app-no-organization',
  templateUrl: './no-organization.component.html',
  styleUrls: ['./no-organization.component.scss']
})
export class NoOrganizationComponent implements OnInit, OnDestroy{
  @Input() orgType: ORG_TYPE;
  @Input() orgTitle: string;
  @Input() orgIcon: string;

  constructor(private eventStream: EventStreamService) {
  }

  ngOnInit(): void {
    this.eventStream.emit(new EmitEvent(Events.IsNoOrg, true))
  }

  ngOnDestroy() {
    this.eventStream.emit(new EmitEvent(Events.DO_SHOW_CLIENT_FORM, false))

  }

  createOrg() {
    this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, true));
  }

}
