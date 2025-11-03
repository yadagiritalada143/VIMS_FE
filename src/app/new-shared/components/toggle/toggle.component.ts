import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent implements OnInit {

  @Output() changed: EventEmitter<any> = new EventEmitter<boolean>();
  @Input() checked: boolean;
  @Input() disabled: boolean = false;
  constructor() { }

  ngOnInit(): void { }
  ngOnChanges() {
    this.checked = this.checked;
  }
  toggle() {
    if (this.disabled) {
      return;
    }
    this.checked = !this.checked;
    this.changed.emit(this.checked);
  }
}
