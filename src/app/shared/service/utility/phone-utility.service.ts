import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhoneUtilityService {
  constructor() { }

  phoneLengthValidation(iso2_code: string, countryList: Array<any>): string {
    const country = countryList?.find((country) => country?.iso_code_2 == iso2_code);
    const mobNumberPattern = `^((\\+1-?)|0)?[0-9]{${country?.min_phone_length ?? 10},${country?.max_phone_length ?? 10}}$`;
    return mobNumberPattern;
  }

}
