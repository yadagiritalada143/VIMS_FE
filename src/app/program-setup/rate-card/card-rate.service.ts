import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardRateService {

  constructor() { }

  deleteNullKeys(obj: any) {

    if(!obj)
      return obj;

    for(let key in obj) {
      if(obj[key] === null)
        delete obj[key];
      else if(typeof obj[key] === 'object')
        obj[key] = this.deleteNullKeys(obj[key]);
    }

    return obj;
  }

  doubleDecimal(value: string | number) {
    if (value) {

      let initial = value.toString();
      if (!initial.includes('.'))
        return initial + '.00';

      let decimal_split = initial.split('.');
      const prefix = decimal_split[0];
      let suffix = decimal_split[1].slice(0, 2);
      while (suffix.length < 2)
        suffix += '0';

      return [prefix, suffix].join('.');
    }

    return '0.00';
  }

}