import { Injectable } from '@angular/core';
import { HttpService } from '../../core/services/http.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { environment } from '../../../environments/environment';
import { IProgram } from '../../expense/interfaces/expense.interfaces';
import { Observable } from 'rxjs';
import { IReportResponse, ReportItemModel, ReportSubItemModel } from '../models/report.model';
import { map } from 'rxjs/internal/operators/map';
import { IChartDataPayload, ICustomReportPayload, IReportDataPayload, IReportFilterPayload } from '../pages/reports-details/reports-details.interfaces';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private currentProgram: IProgram;
  public programId: string;
  public reportApi;
  constructor(private http: HttpService,
    private storageService: StorageService, private ConfigurationLoader: ConfigurationLoader ) {
      this.reportApi = this.ConfigurationLoader?.getConfiguration()?.REPORT_API_ENDPOINT || environment.REPORT_API_ENDPOINT;
      this.updateCurrentProgram();

  }

  updateCurrentProgram() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentProgram.id;
  }

  get(url) {
    return this.http.get(url, this.reportApi);
  }

  post(url, payload?) {
    return this.http.post(url, payload, this.reportApi);
  }

  put(url, payload) {
    return this.http.put(url, payload, this.reportApi);
  }

  delete(url, payload?) {
    return this.http.delete(url, payload || '', this.reportApi);
  }

  postBlob(url, payload?) {
    return this.http.downloadPostBlob(url, payload, this.reportApi);
  }

  public getReports(): Observable<ReportItemModel[]> {
    return this.http
      .get(`/report/programs/${this.programId}/report-navigation`, this.reportApi)
      .pipe(map((res: IReportResponse) => res.data));
  }

  public getScheduledReports(params?: object): Observable<any> {
    return this.http
      .get(`/report/programs/${this.programId}/get-schedule-report`, this.reportApi, params)
      .pipe(map((res: any) => res.data));
  }

  public getDetailedScheduledReport(scheduleId: string): Observable<any> {
    return this.http
      .get(`/report/programs/${this.programId}/get-schedule-report/${scheduleId}`, this.reportApi)
      .pipe(map((res: any) => res.data));
  }

  public getFavoriteReports(): Observable<Array<string>> {
    return this.http.get(`/report/programs/${this.programId}/report-favourite`,this.reportApi)
      .pipe(map((res: any) => res.data));
  }
  public addReportToFavorite(reportItem: ReportSubItemModel) {
    const payload = {
      report_id: reportItem.key,
      action: 'add',
    };
    return this.http.post(`/report/programs/${this.programId}/report-favourite`, payload, this.reportApi);
  }
  public removeReportFromFavorite(reportItem: ReportSubItemModel) {
    const payload = {
      report_id: reportItem.key,
      action: 'remove',
    };
    return this.http.post(`/report/programs/${this.programId}/report-favourite`, payload, this.reportApi);
  }
  public updateReport(id, payload) {
    return this.http.put(`/report/programs/${this.programId}/schedule-report/${id}`, payload, this.reportApi);
  }

  ////////////////// REPORT DETAILS API ///////////////////////

  public getReportConfigById(reportKey: string): Observable<any> {
    return this.get(`/report/programs/${this.programId}/report-config/${reportKey}`).pipe(map((res: any) => res.data));
  }
  public getReportColumn(programId: string): Observable<any> {
    return this.get(`/report/programs/${this.programId}/get-column-type`).pipe(map((res: any) => res.data));
  }

  public getReportData(payload: IReportDataPayload): Observable<any> {
    return this.post(`/report/programs/${this.programId}/list-by-params`, payload).pipe(map((res: any) => res.data));
  }

  public getReportFilter(payload: IReportFilterPayload): Observable<any> {
    return this.post(`/report/programs/${this.programId}/get-report-filters`, payload).pipe(map((res: any) => res.data));
  }

  public getChartData(payload: IChartDataPayload): Observable<any> {
    return this.post(`/report/programs/${this.programId}/chart-by-params`, payload).pipe(map((res: any) => res.data));
  }

  ////////////////// SCHEDULE REPORT API ///////////////////////

  public scheduleCustomReport(payload: any): Observable<any> {
    return this.post(`/report/programs/${this.programId}/schedule-report`, payload);
  }

  ////////////////// SAVED REPORT API ///////////////////////

  public saveCustomReport(payload: ICustomReportPayload): Observable<any> {
    return this.post(`/report/programs/${this.programId}/saved-report`, payload).pipe(map((res: any) => res.data));
  }

  public getSavedReports(params?: object): Observable<any> {
    return this.post(`/report/programs/${this.programId}/get-saved-report`, params).pipe(map((res: any) => res.data));
  }

  public getSavedReportById(reportId: string): Observable<any> {
    return this.http
      .get(`/report/programs/${this.programId}/get-saved-report/${reportId}`, this.reportApi)
      .pipe(map((res: any) => res.data));
  }

  public updateCustomReport(payload: ICustomReportPayload, reportId: string): Observable<any> {
    return this.put(`/report/programs/${this.programId}/saved-report/${reportId}`, payload).pipe(map((res: any) => res.data));
  }

  public deleteSavedReport(reportId: string): Observable<any> {
    return this.delete(`/report/programs/${this.programId}/saved-report/${reportId}`).pipe(map((res: any) => res.data));
  }

  getRole() {
    return this.http.get(`/configurator/programs/${this.programId}/roles`);
  }

  getMembers(searchItem? : string, userIds? : string) {
    const userType = this.storageService.get(StorageKeys.USER_TYPE);
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    let url = `/configurator/programs/${this.programId}/members`;
    if (userType?.toLowerCase() === 'vendor' || userType?.toLowerCase() === 'client') {
      url += `?org_ids=${user?.organization_id}&org_category=${userType?.toLowerCase()}`;
    } else {
      url += `?org_category=CLIENT,MSP,VENDOR`;
    }
    if (searchItem) url += `&name=${searchItem}`;
    if (userIds) url += `&user_ids=${userIds}`;
    return this.http.get(url);
  }
}
