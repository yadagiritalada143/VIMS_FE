import {Pipe, PipeTransform} from '@angular/core';

/**
 * Convert Object to array of keys.
 */
@Pipe({
  name: 'transformToArr'
})
export class TransformToArrPipe implements PipeTransform {

  transform(value: {}): string[] {

    if (!value) {
      return [];
    }

    return Object.values(value);
  }
}
