import { Pipe, PipeTransform } from '@angular/core';

  @Pipe({
    name: 'removePrefixSuffix'
  })
  export class RemovePrefixSuffixPipe implements PipeTransform {

    transform(string: any): any {
      const regex = /\bMR\b|\bMrs\b|\bMr\b|\bMiss\b|\bDr\b|\bProf\b|\bMX\b|\bIND\b|\bMisc\b|\bJr\b|\bSr\b|\bIII\b|\bIV\b|\bV\b/g;
      return string?.replace(regex,'');
    }
  }
