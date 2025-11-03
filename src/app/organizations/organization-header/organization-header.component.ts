import { Component, OnInit,Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-organization-header',
  templateUrl: './organization-header.component.html',
  styleUrls: ['./organization-header.component.scss'],
})
export class OrganizationHeaderComponent implements OnInit, OnDestroy {
  isNoOrg = false;
  subscription= new Subscription();
  @Input() mainmenuName: string = 'Clients';
  @Input() submenuName: string = 'Create New';
  @Input() isRightpanel: boolean = false;
  @Input() isButtonhide: boolean = false;


  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscription = this.eventStream.on(Events.IsNoOrg).subscribe((data) => {
      this.isNoOrg = data;
    });
  }

  onCreateClick() {
    this.eventStream.emit(new EmitEvent(Events.DO_SHOW_CLIENT_FORM, true));
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
