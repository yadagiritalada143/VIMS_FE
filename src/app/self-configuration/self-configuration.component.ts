import { Component, OnInit } from '@angular/core';
import { EmitEvent, EventStreamService, Events } from '../core/services/event-stream.service';

@Component({
  selector: 'app-self-configuration',
  templateUrl: './self-configuration.component.html',
  styleUrls: ['../../assets/sass/self-config/config-main.scss', '../../assets/sass/self-config/config-main-2.scss']
})
export class SelfConfigurationComponent implements OnInit {

  public showSidebarMenu: boolean = true;

  constructor(
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void { }

  toggleSidebarMenu() {
    this.showSidebarMenu = !this.showSidebarMenu;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.SELF_CONFIG_SIDEBAR_TOGGLE, this.showSidebarMenu));
    }, 600);
  }
}
