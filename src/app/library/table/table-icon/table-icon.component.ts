import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'table-icon',
  templateUrl: './table-icon.component.html',
  styleUrls: ['./table-icon.component.scss']
})
export class TableIconComponent implements OnInit {

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
