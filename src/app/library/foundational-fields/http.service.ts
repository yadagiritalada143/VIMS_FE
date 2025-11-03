import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root',
})
export class FoundationalFieldsHttpService {
  baseUrl: string;

  constructor(private http: HttpClient, private ConfigurationLoader: ConfigurationLoader) {
    if (environment.demoMode) {
      this.baseUrl = environment.MOCK_ENDPOINT;
    } else {
      this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
    }
  }

  get(endPoint): Observable<any> {
    return this.http.get(this.baseUrl + endPoint);
  }

  getFoundationalType(program_req_Id: string, params: any): Observable<any> {
    let url = `/configurator/programs/${program_req_Id}/foundational-data-types?active=true`;
    if(params) {
      const keys: Array <any> = Object.keys(params);
      keys.forEach((key: string) => {
        url += `&${key}=${params[key]}`;
      });
    }
    return this.get(url);
  }

  getFoundationalData(program_req_Id, data_id): Observable<any> {
    return this.get(
      `/configurator/programs/${program_req_Id}/foundational-data-types/${data_id}/foundational-data?cf_detail=true&info_level=basic&ordering=name&active=true&page=1&limit=25`,
    );
  }

  getFoundationalDataDetails(program_req_Id: string, data_type_id: string, ids: Array<string>): Observable<any> {
    return this.get(
      `/configurator/programs/${program_req_Id}/foundational-data-types/${data_type_id}/foundational-data?cf_detail=true&fd_ids=${ids?.join(
        ',',
      )}`,
    );
  }

  getFoundationalDataDetail(program_req_Id: string, data_type_id: string, data_id:string): Observable<any> {
    return this.get(
      `/configurator/programs/${program_req_Id}/foundational-data-types/${data_type_id}/foundational-data/${data_id}`)
  }


  getFoundationalDataFilterByCode(program_req_Id: string, data_type_id: string, code: string) {
    return this.get(
      `/configurator/programs/${program_req_Id}/foundational-data-types/${data_type_id}/foundational-data?code=${code}&cf_detail=true&info_level=full`,
    );
  }
}
