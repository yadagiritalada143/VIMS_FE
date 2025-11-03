import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-no-listing-page',
  templateUrl: './no-listing-page.component.html',
  styleUrls: ['./no-listing-page.component.scss']
})
export class NoListingPageComponent implements OnInit {

  @Input() title: string;
  @Input() headingmsg: string;
  @Input() pmsg: string;
  @Input() clickHere: string;
  @Input() btnmsg: string;
  @Input() btnClickUrl: string;

  @Output() onCreateClick: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void { }

  createClick() {
    switch (this.btnClickUrl) {

      case 'FOUNDATION_DATA_TYPE_CREATE':
      case 'FOUNDATION_DATA_CREATE':
        this.onCreateClick.emit(true);
        break;

      default:
        console.log('Event not handled for the following case: ' + this.btnClickUrl);
        break;
    }
  }
}