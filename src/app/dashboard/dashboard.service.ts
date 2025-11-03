import { Injectable } from '@angular/core';
import { HttpService } from '../core/services/http.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public reportApi;
  constructor(private http: HttpService, private _http: HttpClient, private ConfigurationLoader: ConfigurationLoader ) {
    this.reportApi = this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
  }

  get(url, baseurl?) {
    if (String(url) === 'undefined') return of();
    return this.http.get(url, url?.startsWith('/report/') ? this.reportApi : baseurl);
  }

  getSOW(endPoint): Observable<any> {
    return this._http.get(environment?.API_ENDPOINT + '/sow' + endPoint);
  }

  post(url, payload?, baseUrl?) {
    return this.http.post(url, payload, baseUrl);
  }

  getWidgetsConfigByUserAndRole(programId, userId, roleId) {
    return this.http.post(
      `/report/programs/${programId}/get-widgets`,
      {
        user_id: userId,
        role_id: roleId,
      },
      this.reportApi,
    );
  }

  getWidgetsConfigByRole(programId, roleId) {
    if(programId){
    return this.http.post(
      `/report/programs/${programId}/get-widgets-data`,
      {
        role_uuid: roleId,
      },
      this.reportApi,
    );
    }
  }

  saveWidgetConfigsByRole(programId, data) {
    const url = `/report/programs/${programId}/save-widgets-data`;
    return this.http.post(url, data, this.reportApi);
  }

  getmasterConfigJson(programId) {
    return this.http.get(`/configurator/programs/${programId}/config?entity_code=dashboard_master_data`);
  }

  getWorkersList(programId) {
    const url = `/assignment/programs/${programId}/worker`;
    return this.get(url).pipe(
      map(data => {
        return data;
      }),
    );
  }

  getAssignment(programId, workerId) {
    return this.http.get(`/assignment/programs/${programId}/worker/${workerId}/assignment?assignment_by_order=asc`);
  }

  getDefaultDashboardByRole(programId, data) {
    const url = `/report/programs/${programId}/get-default-dashboard`;
    return this.post(url, data, this.reportApi);
  }

  saveDefaultDashboardByRole(programId, data) {
    const url = `/report/programs/${programId}/save-default-dashboard`;
    return this.post(url, data, this.reportApi);
  }

  deleteDefaultDashboardByRole(programId, data) {
    const url = `/report/programs/${programId}/delete-default-dashboard`;
    return this.post(url, data, this.reportApi);
  }

  deleteDashboardByUserAndRole(programId, data) {
    const url = `/report/programs/${programId}/delete-widgets`;
    return this.post(url, data, this.reportApi);
  }

  saveDashboardByUserAndRole(programId, data) {
    const url = `/report/programs/${programId}/save-widgets`;
    return this.post(url, data, this.reportApi);
  }

  getChartData(programId, data) {
    const url = `/report/programs/${programId}/dashboard-chart`;
    return this.post(url, data, this.reportApi);
  }

  getClanederPlatformToken(programId) {
    return this.http.get(`/outlook/programs/${programId}/get-token`);
  }

  getClanederPlatformAuth(programId, data) {
    const url = `/outlook/programs/${programId}/auth`;
    return this.post(url, data);
  }

  registerCalenderToken(programId, code, state, userId) {
    return this.http.post(`/outlook/graph-callback`, {
      code,
      queryState: state,
      storageState: state,
      program_uuid: programId,
      user_uuid: userId,
    });
  }
}
