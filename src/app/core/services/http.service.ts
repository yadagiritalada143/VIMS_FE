import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from './../../../environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  baseUrl: string;

  constructor(private http: HttpClient, private ConfigurationLoader: ConfigurationLoader) {
    if (environment.demoMode) {
      this.baseUrl = environment.MOCK_ENDPOINT;
    } else {
      this.baseUrl = ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
    }
  }

  get(endpoint, baseurl?, options?: object) {
    if (endpoint) {
      const params: any = {};
      if (options) {
        for (const key in options) {
          if (options.hasOwnProperty(key)) {
            if (options[key]) {
              params[key] = options[key];
            }
          }
        }
      }
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.get(this.baseUrl + endpoint, { params });
    } else {
      return of(null);
    }
  }

  downloadBlob(endpoint, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.get(this.baseUrl + endpoint, { responseType: 'blob', observe: 'response' });
    } else {
      return of(null);
    }
  }

  downloadPostBlob(endpoint, data, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.post(this.baseUrl + endpoint, data, { responseType: 'blob' });
    } else {
      return of(null);
    }
  }

  uploadPostBlob(endpoint, data) {
    if (endpoint) {
      return this.http.post(endpoint, data, { reportProgress: true, observe: 'events' });
    } else {
      return of(null);
    }
  }

  getMock(url) {
    return this.http.get(url);
  }

  post(endpoint, data, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.post(this.baseUrl + endpoint, data);
    } else {
      return of(null);
    }
  }

  patch(endpoint, data, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.patch(this.baseUrl + endpoint, data);
    } else {
      return of(null);
    }
  }

  put(endpoint, data?, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      return this.http.put(this.baseUrl + endpoint, data);
    } else {
      return of(null);
    }
  }

  delete(endpoint, options?, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
      const params: any = {};
      if (options && !options?.body) {
        for (const key in options) {
          if (options.hasOwnProperty(key)) {
            if (options[key]) {
              params[key] = options[key];
            }
          }
        }
      } else if (options?.body) {
        return this.http.delete(this.baseUrl + endpoint, { body: options?.body });
      }
      return this.http.delete(this.baseUrl + endpoint, { params });
    } else {
      return of(null);
    }
  }

  getLocal(endpoint) {
    if (endpoint) {
      return this.http.get(endpoint);
    } else {
      return of(null);
    }
  }
}
