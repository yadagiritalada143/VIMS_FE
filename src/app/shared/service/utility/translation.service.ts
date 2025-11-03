import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TranslationService  {
  baseUrl:string;
  payLoadLanguages = {
    eventInfo: {
      mode: 'SYNC',
      eventType: 'get-supported-languages',
      eventDestination: 'mdm'
    },
    data: {
      payload: {
        appId: 'vms2'
      }
    }
  };

  payLoadTranslation = {
    eventInfo: {
        mode: "SYNC",
        eventType: "i18n-get-labels",
        eventDestination: "i18n-mdm"
    },
    data: {
        payload: {
            appId: "vms2",
            locale: "",
            groupId:null,

        }
    }
  };
  constructor(public storageService: StorageService,
    private httpService: HttpClient) {
      // this.baseUrl = 'https://platform.svmssandbox.net/event/public/api/requests'//environment.API_ENDPOINT;//configurationLoader?.getConfiguration()?.CMS_API_ENDPOINT ||
      this.baseUrl = environment.I18 + 'public/api/requests';
    }

  getTranslation(lang: string): Observable<any> {
    const translations = new BehaviorSubject(undefined);
    translations.next(this.storageService?.get('translations'));
    return translations;
  }

  loadTranslation(language) {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const programId = programDetails ? programDetails['id'] : '';
    this.payLoadTranslation.data.payload.locale = language;
    this.payLoadTranslation.data.payload.groupId = programId;
    return this.httpService.post(this.baseUrl,this.payLoadTranslation).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getLanguages() {
    return this.httpService.post(this.baseUrl,this.payLoadLanguages).pipe(map(
      data => {
        return data;
      }
    ));
  }
}
