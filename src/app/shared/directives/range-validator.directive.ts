import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[aria-range]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: RangeValidatorDirective,
    multi: true
  }]
})
export class RangeValidatorDirective implements Validator {

  @Input() min: any;
  @Input() max: any;

  validate(control: AbstractControl): ValidationErrors | null {

    let value: any = (control?.value);
    if(value === null || value === undefined || value === "") {
      return null;
    } else {
      value = Number.parseFloat(value);
    }

    let errObject: any = {
      'invalid_range': control?.value
    };

    if (Number.isNaN(value)) {
      return errObject;
    }

    if (this.min) {
      if (value < this.min)
        return errObject;
    }

    if (this.max) {
      if (value > this.max)
        return errObject;
    }

    return null;
  }
}