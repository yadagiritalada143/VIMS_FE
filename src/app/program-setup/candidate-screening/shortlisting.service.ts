
import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ShortlistingService {
  mockApi: string;
  constructor(
    public storageService: StorageService,
    private _http: HttpService) { }


  get(url) {
    return this._http.get(url);
  }
  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }
  delete(url,payload) {
    return this._http.delete(url, payload);
  }
}
