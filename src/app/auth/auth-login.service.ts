import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ConfigurationLoader } from '../configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root',
})
export class AuthLoginService {
  baseUrl: string;
  constructor(private http: HttpClient, private ConfigurationLoader: ConfigurationLoader) {
    this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT; //+'/vms-profile-manager'
  }

  post(url, data) {
    let finalUrl = this.baseUrl + url;
    return this.http.post(finalUrl, data);
  }

  get(url) {
    return this.http.get(this.baseUrl + url);
  }

  put(url, data?) {
    return this.http.put(this.baseUrl + url, data);
  }
}
