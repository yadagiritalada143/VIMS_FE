import { Component, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-email-designer',
  templateUrl: './email-designer.component.html',
  styleUrls: ['./email-designer.component.scss']
})
export class EmailDesignerComponent implements OnInit {
  headerFooterEditor = "hidden";
  formTitle = "Configure Header";
  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.eventStream.on(Events.EDIT_HEADER_FOOTER).subscribe((data:any) => {
      if (data) {
        this.headerFooterEditor = "visible";
        this.formTitle = "Configure " + data.widgetType;
      }
      else {
        this.headerFooterEditor = "hidden";
      }
    });
  }
  sidebarClose() {
    this.headerFooterEditor = 'hidden';
  }
}
