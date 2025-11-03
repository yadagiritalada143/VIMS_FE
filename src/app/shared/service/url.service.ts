import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor() { }

  isURLValid(url: string, append: boolean = false, protocol: string = 'https') {

    if(append) {
      url = protocol + "://" + url;
    }

    try {
      new URL(url)
    } catch (err: any) {
      return false;
    }

    return true;
  }
}
