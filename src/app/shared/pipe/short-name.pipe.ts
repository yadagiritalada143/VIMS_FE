import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortName'
})
export class ShortNamePipe implements PipeTransform {
  prefixSuffixList: string[] = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'MX', 'IND', 'Misc', 'Jr', 'Sr', 'III', 'IV', 'V']

  transform(fullName: string, arg: string = '', arg1: number = 0): any {
    let nameList = [];
    if (typeof fullName === 'string' && fullName) {
      nameList = fullName.split(' ').map(n => {
        if (!this.prefixSuffixList.includes(n.toLowerCase()) && n[0]) {
          return n[0].toUpperCase()
        }
      }).filter(n => n)
    }
    let returnName = '';
    if (nameList.length > 0) {
      if (nameList.length > 1) {
        if (arg === 'last') {
          returnName = nameList[0] + '' + nameList[nameList.length - 1]
        } else if (arg === 'first') {
          returnName = nameList[0] + '' + nameList[1]
        } else {
          returnName = nameList.join("");
        }
      } else {
        returnName = fullName[0].toUpperCase() + '' + fullName[1].toUpperCase();
      }
    }

    if (arg1 === 1) {
      return returnName[0]
    } else if (arg1 === 2) {
      return returnName[0] + returnName[1]
    }

    return returnName.slice(0,2);
  }

}
