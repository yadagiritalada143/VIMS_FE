import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { environment } from 'src/environments/environment';
import { ConfigurationLoader } from '../configuration/configuration-loader.service';
import { StorageService } from '../core/services/storage.service';
@Injectable({
  providedIn: 'root',
})
export class JobService {
  mockApi: string;
  API_ENDPOINT: string = undefined;
  constructor(
    public storageService: StorageService,
    private http: HttpClient,
    private _alert: AlertService,
    private ConfigurationLoader: ConfigurationLoader,
  ) {
    this.API_ENDPOINT = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
  }

  get(endpoint) {
    if (endpoint) {
      return this.http.get(this.API_ENDPOINT + endpoint);
    } else {
      return of(null);
    }
  }

  post(endpoint, data) {
    if (endpoint) {
      return this.http.post(this.API_ENDPOINT + endpoint, data);
    } else {
      return of(null);
    }
  }

  put(endpoint, data) {
    if (endpoint) {
      return this.http.put(this.API_ENDPOINT + endpoint, data);
    } else {
      return of(null);
    }
  }

  delete(endpoint, data) {
    if (endpoint) {
      return this.http.delete(this.API_ENDPOINT + endpoint, data);
    } else {
      return of(null);
    }
  }

  getQualifications() {
    const _url = `/configurator/programs/*/qualification-types`;
    return this.get(_url).pipe(
      map(
        res => {
          let data = res;
          if (data) {
            return data;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        err => {
          this._alert.error(errorHandler(err));
        },
      ),
    );
  }

  getQualificationsByProgram(term?) {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let currentProgram = programDetails['program_req_id'];
    let _url = `/configurator/programs/${currentProgram}/qualification-types?limit=25&page=1&type_all=true`;
    if(term) {
      _url += `&name=${term}`;
    }
    return this.get(_url).pipe(
      map(
        res => {
          let data = res;
          if (data) {
            return data;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        err => {
          this._alert.error(errorHandler(err));
        },
      ),
    );
  }

  resendEmail(programId: string, candidateId: string, payload: any, id: string, taskId:any) {
    return this.post(`/onboarding-manager/programs/${programId}/jobs/${id}/candidates/${candidateId}/onboarding/resend-hellosign/${taskId}`, payload);
  }

  setFoundationFields(jobFoundationaData) {
    const fdData = [];
    jobFoundationaData?.forEach(element => {
      element?.foundation_data?.forEach(fd => {
        let fdObj = {
          foundational_data_type: fd?.foundational_data_type,
          id: fd?.id,
          name: fd?.name,
          code: fd?.code,
          custom_fields: fd?.custom_fields,
        }
        if('is_read_only' in element) {
          fdObj['is_read_only'] = element?.is_read_only
        }
        fdData.push(fdObj);
      });
    });
    return fdData;
  }
}
