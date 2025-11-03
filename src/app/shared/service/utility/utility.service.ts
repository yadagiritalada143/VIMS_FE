import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  constructor() {}

  removeHtmlTags(list: any[], key: string) {
    if (list && list.length > 0 && key) {
      list.forEach((element: any) => {
        // to remove html tags
        element[key] = element[key]?.replace(/<[^>]*>/g, '') ?? '';
        // to remove &nbsp; with space
        element[key] = element[key]?.replace(/&nbsp;/g, ' ') ?? '';
      });
      return list;
    }
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
  }
}
