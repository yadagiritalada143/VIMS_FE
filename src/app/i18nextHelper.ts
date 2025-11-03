import { I18NEXT_SERVICE, I18NextModule, ITranslationService, defaultInterpolationFormat } from 'angular-i18next';
import { APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { StorageKeys } from 'src/app/core/services/storage.service';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { InitOptions } from 'i18next';

let language = localStorage.getItem(StorageKeys.USER_LANGUAGE);

// Guard check
if (!language || language =='null') {
  language = 'en-US';
} else {
  try {
    language = JSON.parse(language);
  } catch(err) {}
}
// language ='en-US'

// const payload = {
//   eventInfo: {
//     mode: 'SYNC',
//     eventType: 'get-labels',
//     eventDestination: 'mdm',
//   },
//   data: {
//     payload: {
//       appId: 'vms2',
//       locale: language,
//     },
//   },
// };
// const backendOption: HttpBackendOptions = {
//   loadPath: environment.I18 +'public/api/requests',
//   requestOptions: {
//     body: JSON.stringify(payload),
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   },
//   request: (options, url, payload, callback) => {
//     let requestInit: RequestInit = options.requestOptions as RequestInit;
//     try {
//       fetch(url, requestInit).then(async result => {
//         let translations = await result?.json();
//         if (translations) {
//           localStorage.setItem(StorageKeys.USER_LANGUAGE,JSON.stringify(i18next?.language));
//           callback(null, {
//             data: translations[i18next.language]?.translation,
//             status: 200,
//           });
//         }
//       }, (error) => {
//         localStorage.setItem(StorageKeys.USER_LANGUAGE,JSON.stringify(i18next?.language));
//           callback(null, {
//             data: english,
//             status: 200,
//           });
//       callback(null, {
//         data: {},
//         status: 500,
//       });
//       });
//     } catch (e) {
//         localStorage.setItem(StorageKeys.USER_LANGUAGE,JSON.stringify(i18next?.language));
//           callback(null, {
//             data: english,
//             status: 200,
//           });
//       callback(null, {
//         data: {},
//         status: 500,
//       });
//     }
//   },
// };
const i18nextOptions: InitOptions = {
  debug: false,
  lng:language,
  partialBundledLanguages: true,
  load: 'currentOnly',
  fallbackLng: language,
  saveMissing: false,
  resources: null,
  // backend: backendOption,
  interpolation: {
    format: I18NextModule.interpolationFormat(defaultInterpolationFormat),
  },
  parseMissingKeyHandler(key, defaultValue) {
    try{
      if (key) {
        let value = key;
        if (key.indexOf('_') != -1) {
          let valueSplit = key.split('_');
          if (valueSplit && valueSplit.length > 1) {
             valueSplit =  valueSplit.map(value => {
              let firstChar = value.at(0)?.toUpperCase();
              return firstChar + value.slice(1, value.length);
            });
            return valueSplit.join(' ');
          } else {
            return  valueSplit.at(0)?.toUpperCase() + valueSplit.slice(1, valueSplit.length);
          }
        } else {
          return value.at(0)?.toUpperCase() + value.slice(1, value.length);
        }
      }
    }
    catch (e){
      console.log(e);
      return key;
    }
  },
  backend: {
    loadPath: `assets/i18n/${language}.json`
  },
};


export function appInit(i18next: ITranslationService) {
  return async () => {
    await i18next.use(HttpApi).use<any>(I18nextBrowserLanguageDetector).init(i18nextOptions);
  };
}

export function localeIdFactory(i18next: ITranslationService) {
  return i18next.language;
}

export function getTranslationFromMdm(languageLocale: string) {}

export const I18N_PROVIDERS = [
  {
    provide: APP_INITIALIZER,
    useFactory: appInit,
    deps: [I18NEXT_SERVICE],
    multi: true,
  },
  {
    provide: LOCALE_ID,
    deps: [I18NEXT_SERVICE],
    useFactory: localeIdFactory,
  },
];
