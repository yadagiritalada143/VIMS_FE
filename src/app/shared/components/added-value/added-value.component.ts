import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-added-value',
  templateUrl: './added-value.component.html',
  styleUrls: ['./added-value.component.scss']
})
export class AddedValueComponent implements OnInit {
  @Input() addValueLabel: string;
  @Output() removeSelected = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  removeCurrent() {
    this.removeSelected.emit();
  }

}
