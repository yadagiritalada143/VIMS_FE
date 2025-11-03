import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
@Injectable({
  providedIn: 'root'
})
export class EditRulesService {
  mockApi: string;
  constructor(private _http: HttpService,
    private _alert: AlertService,
    private storageService: StorageService) {
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
  
  fetcheditRuleSet(limit = 10, page = 1, k = null) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/configurator/programs/${currentProgram?.id}/edit-rules/edit-rule-sets?limit=${limit}&page=${page}`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  changeEditRuleSetStatus(param: any) {
    const editRuleItem_id = param?.id;
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const payload = {
      is_enabled: param.is_enabled ? false : true
    }
    const _url = `/configurator/programs/${currentProgram?.id}/edit-rules/edit-rule-sets/${editRuleItem_id}`;

    return this.put(_url, payload).pipe(map(data => {
      if (data) {
        return data;
      }
    }, (err) => {
      throw new Error(err);
    }));
  }

}