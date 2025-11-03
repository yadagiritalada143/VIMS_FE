import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { HttpService } from 'src/app/core/services/http.service';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { of } from 'rxjs/internal/observable/of';
import { StorageService } from 'src/app/core/services/storage.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationConfigService {
  baseurl = ''
  apiurl = ''
  headerTemplate = null;
  headerTemplateConfig = null;
  headerdefaulted = false;
  footerTemplate = null;
  footerTemplateConfig = null;
  footerdefaulted = false;
  notificationConfig = null;
  headerConfig$ = new BehaviorSubject<any>(null);
  footerConfig$ = new BehaviorSubject<any>(null);
  excludedEvents=[]

  constructor(private _http: HttpClient,private eventStream: EventStreamService, private ConfigurationLoader: ConfigurationLoader, private _httpService: HttpService,
    private storageService: StorageService) {
    this.apiurl  = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
    this.eventStream.on(Events.SET_PROGRAM).subscribe((data) => {
      this.headerConfig$.next(null);
      this.footerConfig$.next(null);
    })
  }

  get(url) {
    return this._http.get(this.baseurl + url );
  }

  post(url, payload) {
    return this._http.post(this.baseurl + url, payload);
  }

  put(url, payload) {
    return this._http.put(this.baseurl + url, payload);
  }

  gets(url) {
    return this._http.get(this.apiurl + url );
  }

  getHtmlResponse(url, responseType) {
    return this._http.get(this.apiurl + url, responseType);
  }

  puts(url, payload) {
    return this._http.put(this.apiurl + url, payload);
  }

  posts(url, payload) {
    return this._http.post(this.apiurl + url, payload);
  }


  delete(url) {
    // return this._http.delete(this.baseurl + url);
    return this._http.delete(this.apiurl + url);
  }

  getMock(url) {
      return this._http.get(this.baseurl + url);
  }

  getRoles(url) {
    return this._http.get(this.apiurl + url);
  }

  getTemplateKeys(eventCode, getOnlyRecipients) {
    let url;
    if(getOnlyRecipients){
      url = `/notification-config/template-fields?limit=10000&module_slug=${eventCode}&is_recipient=true`
    }else{
      url = `/notification-config/template-fields?limit=10000&module_slug=${eventCode}`
    }
    return this._http.get(this.apiurl + url);
  }

  deleteTemplateKeyDefinition(id:any){
    return this._http.delete(this.apiurl + `/notification-config/template-fields/${id}`);
  }

  getConfigNotification(url) {
    return this._httpService.get(url);
  }

  createConfigNotification(url, data) {
    return this._httpService.post(url, data);
  }

  updateConfigNotification(url, data) {
    return this._httpService.put(url, data);
  }

  loadNotificationAuthDetails(): Observable<any> {
    if (this.notificationConfig) {
      return of(this.notificationConfig);
    }
    return this._httpService.get('/notification-config/apptoken/1')
    .pipe(
      map((response:any) => {
      this.notificationConfig = response.app_token;
      this.storageService.set('notificationAuthDetails', this.notificationConfig);
      this.baseurl = this.notificationConfig.base_url;
      return of(response.app_token);
    }));
  }

  getTemplateConfig(type: string, programId: string): Observable<any> {
    if (type === 'header')
      this.headerConfig$.subscribe((res:any) => {
        if (res?.value?.payload?.config) {
          return of(res?.value?.payload?.config);
        }
      })
    if (type === 'footer')
      this.footerConfig$.subscribe((res:any) => {
        if (res?.value?.payload?.config) {
          return of(res?.value?.payload?.config);
        }
      })
    if(this.storageService.get("SYSTEM_DEFAULT") === true){
      programId = "SYSTEM_DEFAULT";
    }
      // return this._http.get(this.baseurl +`/tenant-config/search?key=${type === 'header' ? 'email_header' : 'email_footer'}&refId=${programId}`)
    return this._http.get(this.apiurl +`/notification-config/tenant-config/search?key=${type === 'header' ? 'email_header' : 'email_footer'}&refId=${programId}`)

      .pipe(
        map((response: any) => {
          type === 'header' ? this.headerConfig$.next(response?.payload) : this.footerConfig$.next(response?.payload);
          return response?.payload ? response?.payload : response;
        })
      );
  }

  getNotificationsData(userEmail, page, size) {
    return this._http.get(this.baseurl +`/notification-tracker/search?notificationDest=${userEmail}&page=${page}&size=${size}`)
    .pipe(
      map((response: any) => {
        return response.content;
      })
    );
  }

  postTemplate(url, payload) {
    return this._http.post(this.baseurl + url, payload);
  }

  putTemplate(url, payload) {
    return this._http.put(this.baseurl + url, payload);
  }

  postsTemplate(url, payload) {
    return this._http.post(this.apiurl + url, payload);
  }

  putsTemplate(url, payload) {
    return this._http.put(this.apiurl + url, payload);
  }
  getEmailNotificationLog(url: string, query: any) {
    
    let it: number = 0;
    let keys: Array <string> = [...Object.keys(query)];

    keys.forEach((key: string) => {
      if(!!query[key]) {
        if(it === 0) {
          url += `?${key}=${query[key]}`;
        } else {
          url += `&${key}=${query[key]}`;
        }

        it++;
      }
    });

    return this._http.get(this.apiurl + url);
  }

  //getFromJSONServer(url) {
  //  return this.http.get(this.baseurl + url );
  //}

  getExcludedEvents(){
    return this.excludedEvents;
  }

  setExcludedEvents(value){
    this.excludedEvents=value;
  }
  
}

