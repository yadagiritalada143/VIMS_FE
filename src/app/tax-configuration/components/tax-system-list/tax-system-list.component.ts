import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaxDetail } from '../../tax-configuration.interfaces';

@Component({
  selector: 'tax-system-list',
  templateUrl: './tax-system-list.component.html',
  styleUrls: ['./tax-system-list.component.scss']
})
export class TaxSystemListComponent implements OnInit {

  @Input('list') taxDetailsList: Array <TaxDetail> = [];
  @Output() edit: EventEmitter <any> = new EventEmitter <any> ();
  @Output() remove: EventEmitter <any> = new EventEmitter <any> ();
  @Input() disabled: boolean = false;

  constructor() { }

  ngOnInit(): void { }

  editEntry(it: number) {
    this.edit.emit(it);
  }

  removeEntry(it: number) {
    this.remove.emit(it);
  }

}
