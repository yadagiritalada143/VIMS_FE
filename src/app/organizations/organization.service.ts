import { Injectable } from '@angular/core';
import { HttpService } from '../core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  mockApi: string;
  constructor(private _http: HttpService) {
  }

  get(url) {
    return this._http.get(url);
  }

  post(url, payload) {
    return this._http.post(url, payload);
  }

  serachClient(url) {
    let finalApi = url;
    return this._http.get(finalApi);
  }

}
