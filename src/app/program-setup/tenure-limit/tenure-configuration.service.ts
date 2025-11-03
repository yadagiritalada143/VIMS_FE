import { Injectable } from '@angular/core';
import { HttpService } from '../../../app/core/services/http.service';
import { StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TenureConfigurationService {

  constructor(
    public storageService: StorageService,
    public _http: HttpService
  ) { }

  get(url) {
    return this._http.get(url);
  }

  post(url, body) {
    return this._http.post(url, body)
  }
}
