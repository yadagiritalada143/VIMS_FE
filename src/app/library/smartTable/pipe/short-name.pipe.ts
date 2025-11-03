import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortName'
})
export class ShortNamePipe implements PipeTransform {
  prefixSuffixList: string[] = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'MX', 'IND', 'Misc', 'Jr', 'Sr', 'III', 'IV', 'V']

  transform(fullName: string, arg: string = ''): any {
    if (typeof fullName === 'string' && fullName)  {
      const nameList = fullName.split(' ').map(n => {
        if (!this.prefixSuffixList.includes(n.toLowerCase()) && n[0]) {
          return n[0].toUpperCase();
        }
      }).filter(n => n);

      if (nameList.length > 1) {
        if (arg === 'last') {
          return nameList[0] + '' + nameList[nameList.length - 1];
        } else if (arg === 'first') {
          return nameList[0] + '' + (nameList[1] ? nameList[1] : '');
        }
        return nameList.join('');
      }

      return fullName[0].toUpperCase() + '' + (fullName[1] ? fullName[1].toUpperCase() : '');
    } else {
      return '';
    }

  }

}
