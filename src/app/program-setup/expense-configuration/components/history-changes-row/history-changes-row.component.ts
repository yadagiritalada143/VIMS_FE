import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-history-changes-row',
  templateUrl: './history-changes-row.component.html',
  styleUrls: ['./history-changes-row.component.scss']
})
export class HistoryChangesRowComponent implements OnInit {
  @Input() label: string;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() isDate: boolean;
  @Input() daysFromEnd: boolean;
  @Input() longLabel: boolean;

  constructor() { }

  ngOnInit(): void {
  }

  public makeValueReadable(value) {
    if (typeof value === 'object' && value.hasOwnProperty('type') && value.hasOwnProperty('value')) {
      value = `${value.value} ${value.type}`;
    } else {
      if (value === '1') {
        value = 'true';
      } else if (value === '0') {
        value = 'false';
      }
    }
    return value;
  }

}
