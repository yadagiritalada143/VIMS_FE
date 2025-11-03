import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header-icon',
  templateUrl: './header-icon.component.html',
  styleUrls: ['./header-icon.component.scss']
})
export class HeaderIconComponent implements OnInit {

  @Input() size: string;
  @Input() color: string;
  @Input() name: string;
  @Input() type: string = 'material';
  @Input() cuClass: string;
  @Output() onClick = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  click(event) {
    this.onClick.emit(event)
  }

}
