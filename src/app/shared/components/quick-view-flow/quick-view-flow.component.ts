import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'quick-view-flow',
  templateUrl: './quick-view-flow.component.html',
  styleUrls: ['./quick-view-flow.component.scss']
})
export class QuickViewFlowComponent implements OnInit {
  @Input() flowData;
  @Output() onClose = new EventEmitter();
  @Output() onSave = new EventEmitter();
  columnOrderModal:boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  openColumnOrderScaner() {
    this.columnOrderModal = true;
  };

  closeColumnOrder () {
    this.columnOrderModal = false;
  };

  sidebarClose() {
    this.columnOrderModal = false;
    this.onClose.emit(true)
  }
}
