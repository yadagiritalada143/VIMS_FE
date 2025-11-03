import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'sidebar-icon',
  templateUrl: './sidebar-icon.component.html',
  styleUrls: ['./sidebar-icon.component.scss']
})
export class SidebarIconComponent implements OnInit {

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
