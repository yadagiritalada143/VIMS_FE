import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keysort'
})
export class SortHelperPipe implements PipeTransform {

  transform(value: Array <any>, ...args: Array <string>): Array <any> | any {

    if(!Array.isArray(value))
      return [];

    if(!value.length)
      return value;

    const type: string = (typeof value[0]);
    const field: string = args[0];
    const order: (1 | -1) = (!args[1] || (Number.parseInt(args[1]) >= 0)) ? 1 : -1;

    switch (type) {

      case 'number':
      case 'boolean':
        value.sort((a: number, b: number) => order*(a-b));
        break;
    
      case 'string':
        value.sort((a: string, b: string) => {
          a = a.toUpperCase();
          b = b.toUpperCase();
          return order*a.localeCompare(b);
        });
        break;

      case 'object':
        if(field) {

          const fieldType: string = (typeof this.getAttr(value[0], field));
          if(fieldType === 'string') {
            value.sort((a: any, b: any) => {
              const prev: string = (this.getAttr(a, field) || '')?.toUpperCase();
              const next: string = (this.getAttr(b, field) || '')?.toUpperCase();
              return order*prev.localeCompare(next);
            });
          } else if(fieldType === 'number' || fieldType === 'boolean') {
            value.sort((a: any, b: any) => {
              const prev: number = this.getAttr(a, field) ?? 0;
              const next: number = this.getAttr(b, field) ?? 0;
              return order*(prev - next);
            });
          } else {
            console.error('sort-helper.pipe: Case not handled following field type');
          }
        } else {
          console.error('sort-helper.pipe: Please supply field parameter for sorting the object');
        }
        break;

      default:
        console.log('sort-helper.pipe: Default case for entry type');
        value.sort();
        break;
    }
    
    return value;
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