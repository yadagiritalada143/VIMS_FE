import { Component, OnInit, Input, forwardRef, Injector, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { ControlType, EnableNotificationType } from './program-config-control.model';

@Component({
  selector: 'app-program-config-control',
  templateUrl: './program-config-control.component.html',
  styleUrls: ['./program-config-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => ProgramConfigControlComponent),
    },
  ],
})
export class ProgramConfigControlComponent implements OnInit, ControlValueAccessor, AfterViewInit {

  public _value: any;

  @Input() timerType: ('hour' | 'minute') = 'hour';
  @Input() timerMin: number = 0;
  public firstTimer: any = null;
  public secondTimer: any = null;
  public firstTimerOptions: Array <string> = [];
  public secondTimerOptions: Array <string> = [];
  public EnableNotificationType = EnableNotificationType;
  @Input() programDetails;

  //Placeholders for the callbacks which are later providesd
  //by the Control Value Accessor
  private onTouchedCallback = () => {};
  private onChangeCallback = (value: any) => {};
  
  @Input() title: string;
  @Input() subtitle: string;
  @Input() loading: boolean;
  @Input() isRequired: boolean;
  @Input() description: string;
  @Input() directoryIcon: string;
  @Input() subDirectoryIcon: string;
  @Input() placeholderText: string;
  @Input() nonEditable: Array <string> = [];
  @Input() mandatePattern: RegExp | string = '';

  @Input() type: ControlType;
  @Input() dropdownItems:any = [];
  @Input() radioItems:Array<any>= [];
  @Input() disabled: boolean = false;
  @Input() hidden:boolean = false;
  @Input() showEnableNotificationSection: boolean = false;
  @Input() sortNotRequired: boolean = false;

  @Input() errorText: string = '';
  @Input() precision: number = null;
  @Input() min: any = null;
  @Input() max: any = null;
  @Input() formControlName: string;

  @Input() selectedValue : string;
  @Output() emitOptionChanged = new EventEmitter();
  @Output() saveProgramDetails = new EventEmitter();
  @Output() hideModulesSection = new EventEmitter();
  get Value() {
    return this._value;
  }

  set Value(value: any) {
    if(this.type === this.controlType.TIMER) {
      this.firstTimer = (value || '').split(":")?.[0] || '00';
      this.secondTimer = (value || '').split(":")?.[1] || '00';
    }

    this._value = value;
    if (this.onChangeCallback) {
      this.onChangeCallback(this.Value);
    }
  }

  constructor(private inject: Injector) {}

  ngAfterViewInit(): void {
    if(this.type === this.controlType.TIMER) {
      setTimeout(() => {
        if(this.timerType === 'hour') {
          this.firstTimerOptions = this.generateTimerOptions(24);
          this.secondTimerOptions = this.generateTimerOptions(60);
        } else if (this.timerType === 'minute') {
          this.firstTimerOptions = this.generateTimerOptions(60);
          this.secondTimerOptions = this.generateTimerOptions(60);
        }

        // Trigger Read
        this.Value = this.Value;
      }, 0);
    }
  }

  get control() {
    return this.inject.get(NgControl);
  }

  get controlType () {
    return ControlType;
  }
  //From ControlValueAccessor interface
  writeValue(value: any) {
    this._value = value;
  }
  cancel(){
    this.hideModulesSection.emit();
  }
  //From ControlValueAccessor interface
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  //From ControlValueAccessor interface
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  onClear = (value: any) => {
    if (this.onChangeCallback) {
      this.onChangeCallback(undefined);
    }
  };

  optionChanged(fn,calculateTotal?) {
    if(calculateTotal){
      const total =  this.dropdownItems.inputData.reduce((acc, item) => acc + item.inputval, 0);
      this.dropdownItems.total = total
    }
    this.emitOptionChanged.emit(fn);
  }

  setDisabledState?(isDisabled: boolean): void {}

  ngOnInit(): void {}

  firstTimerChanged(val: string) {
    if(this.type === this.controlType.TIMER) {
      this.Value = val + ":" + (this.secondTimer || '00');
    }
  }

  secondTimerChanged(val: string) {
    if(this.type === this.controlType.TIMER) {
      this.Value = (this.firstTimer || '00') + ":" + val;
    }
  }

  generateTimerOptions(count: number) {
    let result: Array <string> = [];
    for(let it: number = 0; it < count; it++) {
      let val: string = "" + it;
      if(val.length < 2) {
        val = '0' + val;
      }

      result.push(val);
    }

    return result;
  }

  updateSecondTimer(result: any) {
    let hourTimer: number = Number.parseInt(result);
    let secondTimer: number = Number.parseInt(this.secondTimer);
    if (hourTimer === 0) {
      if (!([null, undefined, ''] as Array <any>).includes(this.timerMin)) {
        if (secondTimer < this.timerMin) {
          this.secondTimerChanged((this.timerMin < 10) ? '0' + this.timerMin : '' + this.timerMin)
        }
      }
    }
  }

  renderSecondTimer(val: string) {
    const firstTimerNotSelected: Array <any> = [0, null, undefined, '', '0', '00'];
    if(firstTimerNotSelected.includes(this.firstTimer)) {
      if(Number.parseInt(val) < this.timerMin) {
        return false;
      }
    }

    return true;
  }

  changeModuleToggle(toggle) {
    toggle.is_enabled = !toggle?.is_enabled
    this.saveProgramDetails.emit();
  }
}
