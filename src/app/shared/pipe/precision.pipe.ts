import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'precision'
})
export class PrecisionPipe implements PipeTransform {

  transform(value: number | string, ...args: any[]): any {
    
    let num: any = Number.parseFloat(value + '');
    if((typeof(num) === 'number') && !Number.isNaN(num)) {

      let precision: number = Number.parseInt(args?.[0] + '');
      if((typeof(precision) === 'number') && !Number.isNaN(precision)) {
        num = num.toFixed(precision);
      }

      return num;
    }

    return value;
  }
}
