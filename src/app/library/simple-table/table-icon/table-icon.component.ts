import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-icon',
  templateUrl: './table-icon.component.html',
  styleUrls: ['./table-icon.component.scss']
})
export class TableIconComponent implements OnInit {
  @Input() size: string;
  @Input() color: string;
  @Input() name: string;
  @Input() type = 'material';
  @Input() cuClass: string;

  constructor() { }

  ngOnInit(): void {
  }

}
