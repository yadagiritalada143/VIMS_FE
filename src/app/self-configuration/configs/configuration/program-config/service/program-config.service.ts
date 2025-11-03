import { Injectable } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ProgramConfigService {

  public formGroup: Array <UntypedFormGroup> = [];
  constructor() { }

  get getIsInValid(): boolean {
    if (this.formGroup?.length > 0) {
      return this.formGroup.some((grp: UntypedFormGroup) => !grp?.valid);
    }
    return false;
  }
}