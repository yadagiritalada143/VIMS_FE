import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'toggle-panel',
  templateUrl: './toggle-panel.component.html',
  styleUrls: ['./toggle-panel.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TogglePanelComponent
    }
  ]
})
export class TogglePanelComponent implements OnInit, ControlValueAccessor {

  #value: boolean = false;

  @Input() name: string;
  @Input() description: string;

  @Output() changed: EventEmitter <boolean> = new EventEmitter <boolean> ();

  public onChange: Function = () => {};
  
  constructor() { }

  ngOnInit(): void { }

  writeValue(flag: boolean): void {
    this.#value = flag;
    this.onChange?.(this.#value);
  }

  toggleValue() {
    this.changed.emit(!this.#value);
    this.writeValue(!this.#value);
  }

  registerOnChange(fn: any): void {
      this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  get value() {
    return this.#value;
  }
}
