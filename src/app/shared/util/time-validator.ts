import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function timeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

        let value: string = control?.value;
        if (!value)
            return null;

        let hour: number = Number.parseInt(value?.split(':')?.[0]);
        let minute: number = Number.parseInt(value?.split(':')?.[1]);

        setTimeout(() => {
            control?.updateValueAndValidity();
        }, 100);

        return ((hour >= 0) && (hour <= 23) && (minute >= 0) && (minute <= 59)) ? null : {
            'invalid_time': value
        };
    }
}
