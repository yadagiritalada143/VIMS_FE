import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormRendererService {
  private hierarchyName = new Subject<string>()
  private currency = new Subject<string>();
  private currencySymbol = new Subject<string>();
  baseUrl = ''
  constructor(private _http: HttpClient, private ConfigurationLoader: ConfigurationLoader) {
    this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
  }

  get(endPoint): Observable<any> {
    return this._http.get(this.baseUrl + endPoint)
  }  
  getHierarchyName() {
    return this.hierarchyName.asObservable()
  }

  setHierarchyName(hierarchyName: string) {
    this.hierarchyName.next(hierarchyName)
  }

  getCurrency() {
    return this.currency.asObservable()
  }

  setCurrency(currency: string) {
    this.currency.next(currency)
  }

  getCurrencySymbol() {
    return this.currencySymbol.asObservable()
  }

  setCurrencySymbol(currency: string) {
    this.currencySymbol.next(currency)
  }

  getConfigJson(url) {
    return this._http.get(this.baseUrl + url);
  }

  // getReasonCodeAction(programID) {
  //   return this._http.get(`${this.baseUrl}/configurator/programs/${programID}/pages/reason-code-actions`);
  // }

  // getReasonCodeData(programId, picklistId) {
  //   return this._http.get(`${this.baseUrl}/configurator/programs/${programId}/pages/reason-code-actions/${picklistId}/reason-codes`);
  // }
  post(url, data) {
    return this._http.post(`${this.baseUrl}${url}`, data);
  }

  encodeToBase64(filedata) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  }
  put(url, payload) {
    return this._http.put(this.baseUrl + url, payload);
  }
}
