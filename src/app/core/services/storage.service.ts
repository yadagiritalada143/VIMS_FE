import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage: any = {};

  constructor(private _cookie: CookieService) {}

  get(key) {
    let data = this.storage[key];
    if (!data) {
      let d = localStorage.getItem(key);
      if (d || d !== undefined) {
        if (d != 'undefined') {
          data = JSON.parse(d);
        }
      }
    }
    return data;
  }

  set(key: string, data: any, storeInLocalStorage?: boolean) {
    // TODO Mocked Test Data, need to remove in future
    // if(key === StorageKeys.CURRENT_PROGRAM) {
    //  data['defaultCurrency'] = 'EUR';
    //  data['defaultDateFormat'] = 'MM/dd/yyyy';
    // }
    this.storage[key] = data;
    if (storeInLocalStorage) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  getSession(key: string) {
    return sessionStorage.getItem(key);
  }

  setSession(key: string, data: any, storeInLocalStorage?: boolean) {
    sessionStorage.setItem(key, data);
  }

  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    return delete this.storage[key];
  }

  setWithExpiry(key, value, ttl) {
    let now = new Date();
    let item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }

  setCookie(key: string, data: any, storeInLocalStorage?: boolean) {
    if (storeInLocalStorage) {
      this._cookie.set(key, data);
    }
  }

  getCookie(key) {
    let data = this._cookie.check(key);
    if (data) {
      return this._cookie.get(key);
    } else return data;
  }

  clear() {
    localStorage.clear();
    sessionStorage.clear();
    this.set(StorageKeys.TOKEN, undefined);
  }
}

export enum StorageKeys {
  CURRENT_PROGRAM = 'CurrentProgram',
  ORGANIZATION_ID = 'ORG_ID',
  PROGRAM_ID = 'PROGRAM_ID',
  DEFAULT_PROGRAM_ID = 'DEFAULT_PROGRAM_ID',
  PREFERENCE_LIST = 'PREFERENCE_LIST',
  NEW_PROGRAM = 'NewProgramData',
  CURRENT_ACCOUNT = 'account',
  CURRENT_USER = 'user',
  USER_TYPE = 'user_type',
  USER_PERMISSION = 'user_permission',
  PROGRAM_MEMBER = 'programMember',
  ACCOUNT_CODE_CONFIG = 'account_code_config',
  USER_LANGUAGE = 'user_language',
  SUBMISSION_BASE_URL = 'Submission_base_URL',
  NAVIGATION_URL = 'NAVIGATION_URL',
  ACCURACY_CONFIG = 'ACCURACY_CONFIG',
  VERISON = 'Version',
  TOKEN = 'Token',
  CONTROL_PANEL_VISITED = 'CONTROL_PANEL_VISITED',
  ASSIGNMENT_UUID = 'assignment_uuid',
  IMPERSONATOR_TOKEN = 'IMPERSONATOR_TOKEN',
  PROGRAM_LIST = 'ProgramList',
  IMPERSONATOR_ID = 'IMPERSONATOR_ID',
  IMPERSONATION_START = 'IMPERSONATION_START',
  PROFILE_ORG_CATEGORY = 'PROFILE_ORG_CATEGORY',
  PROFILE_ORG_ID = 'PROFILE_ORG_ID',
  PROFILE_ORG_NAME = 'PROFILE_ORG_NAME',
  VIEWD_JOB = 'viewd_job',
  GLOBAL_LAUNCH_CONFIG = 'global_launch_config',
  LOGOUT_EVENT = 'logoutEvent',
  INACTIVITY_START_TIME = 'inactivity_start_time',
  GLV_PREFERENCE = 'GLV_PREFERENCE',
  FILTER_PRESERVE = 'FILTER_PRESERVE',
  ACCOUNT ='account'
}
