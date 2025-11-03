import { Injectable } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(
    private fb: UntypedFormBuilder
  ) { }

  emailValidator(input: string): boolean {
    if(!input) {
      return true;
    }

    let control: AbstractControl = this.fb.control('', [Validators.email]);
    control.setValue(input);
    return control.valid;
  }
};
