import { Injectable } from '@angular/core';
import { HttpService } from '../../core/services/http.service';
@Injectable({
  providedIn: 'root'
})
export class VendorService {
  mockApi: string;
  constructor(private _http: HttpService) {
  }

  get(url) {
    return this._http.get(url);
  }
  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }

  delete(url) {
      return this._http.delete(url, null);
  }

  getMock(url){
    return this._http.getMock(url);
  }
  serachClient(url) {
    let finalApi = url;
    return this._http.get(finalApi);
  }

}
