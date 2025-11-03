import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root'
})
export class CustomFieldsHttpService {

  baseUrl: string;
 
  constructor(private http: HttpClient, private ConfigurationLoader: ConfigurationLoader) {
    if (environment.demoMode){
      this.baseUrl = environment.MOCK_ENDPOINT;
    }
    else{
      this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
    }
  }
 
  get(endPoint): Observable<any> {
    return this.http.get(this.baseUrl + endPoint)
  }
}
