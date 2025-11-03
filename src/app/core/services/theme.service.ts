import { Injectable } from '@angular/core';
import * as t from '../../../assets/css/themes.json';
import { LoggerService } from '../../core/services/logger.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserDataObj } from '../../shared/enums';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  theme = (t as any).default;
  currentTheme = "light";
  userTheme = UserDataObj;
  constructor(private loggerService: LoggerService, private _storageservice: StorageService,
    public _http: HttpService
    ) { }

  getThemes() {
    let themes = [];
    Object.keys(this.theme).forEach(function (key) {
      themes.push(key);
    });
    return themes;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  changeTheme(name: string) {
    this.loggerService.warn('Changing theme ' + name);
    let thiss = this;
    if (this.theme[name]) {
      Object.keys(this.theme[name]).forEach(function (key) {
        var value = thiss.theme[name][key];
        // thiss.loggerService.info('Next Prop ' +key + ' - ' +  value )
        document.documentElement.style.setProperty(key, value);
      });
    }
    this._storageservice.set(this.userTheme[2], name, true);
    this.currentTheme = name;
  }

  get(url) {
    return this._http.get(url);
  }
  put(url, payload) {
    return this._http.put(url, payload);
  }

}
