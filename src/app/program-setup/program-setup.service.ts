import { Injectable } from '@angular/core';
import { HttpService } from '../core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class ProgramSetupService {

  constructor(private _http: HttpService) { }

  get(url) {
    return this._http.get(url)
  }

  post(url, data) {
    return this._http.post(url, data);
  }

  put(url, data) {
    return this._http.put(url, data);
  }
}
