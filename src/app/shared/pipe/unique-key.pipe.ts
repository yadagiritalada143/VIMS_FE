import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'uniqueKey'
})
export class UniqueKeyPipe implements PipeTransform {

  transform(values: Array <any>, ...args: Array <string>): Array <any> {

    // Edge case for empty/invalid array
    if(!(Array.isArray(values) && values?.length)) {
      return [];
    }

    let set: Set <string> = new Set <string> ();
    let result: Array <any> = [];
    let key: string = args?.[0];
    
    if(!key) {
      // Check for primitives used in the codebase  
      let validTypes: Array <string> = ['boolean', 'bigint', 'string', 'number'];
      if(validTypes.includes(typeof(values[0]))) {
        return _.uniq(values);
      } else {
        console.error('ERR: Please supply a valid key for sorting data array');
        return [];
      }
    }

    if(typeof(values[0]) === 'object') {
      // Keep only unique entries with a key reference
      values.forEach((val: any) => {
        let attr_val: any = this.getAttr(val, key)
        if(!set.has(attr_val)) {
          result.push(val);
          set.add(attr_val);
        }
      });
    } else {
      console.error('ERR: Please supply valid data array');
    }

    return result;
  }

  private getAttr(obj: any, field: string): any {

    if (!field)
      field = "";

    let emptyValues: Array <any> = ['', null, undefined];
    let location: Array <string> = field.split(".");

    for (let it: number = 0; it < location?.length; it++) {
      const attr: string = location[it];
      obj = (obj || {})?.[attr];
      if (emptyValues.includes(obj)) {
        break;
      }
    }

    return obj;
  }
}