import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'svms-email-viewer',
  templateUrl: './email-viewer.component.html',
  styleUrls: ['./email-viewer.component.scss']
})
export class EmailViewerComponent implements OnInit {

  @Input() visibility: boolean = false;
  @Output() visibilityChange: EventEmitter <boolean> = new EventEmitter <boolean> ();

  @Input() subject: string = null;
  @Output() subjectChange: EventEmitter <string> = new EventEmitter <string> ();

  public email: any = null
  @Output() emailChange: EventEmitter <any> = new EventEmitter <any> ();
  @Input('email') set setEmail(data: any) {
    if(data) {
      let htmlParser: DOMParser = new DOMParser();
      let document: Document = htmlParser.parseFromString(data, 'text/html');
      this.email = document.querySelector('body').innerHTML;
    } else {
      this.email = null;
    }
  };

  toggleVisibility(flag?: boolean) {
    this.subjectChange.emit(null);
    this.emailChange.emit(null);
    this.visibilityChange.emit(flag);
  }

  constructor() { }

  ngOnInit(): void { }

}
