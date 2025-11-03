import { Injectable } from '@angular/core';
import { HttpService } from '../../../src/app/core/services/http.service';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StorageKeys, StorageService } from '../../../src/app/core/services/storage.service';
import { TimesheetConstants, TimesheetStatus, TimesheetType, TimesheetWeeklyType, Permissions } from './timesheet.enums';
import { MonthList } from './timesheet.utils';
import { AuthorizationService } from '../core/services/authorize.service';
import { DatePipe } from '@angular/common';
import { LocalDateFormatPipe } from '../shared/pipe/local-date-format.pipe';
import { ConfigurationLoader } from '../configuration/configuration-loader.service';
import { of, forkJoin} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LOG_TYPE } from '../library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from '../core/services/event-stream.service';
import { AccountCodeValidationParams, AccountCodeValidationPayload, AccoutCodeValidationRequest } from '../account-code-setup/models/account-code-setup-model';
import { AccountCodeService } from '../account-code-setup/services/account-code-setup.service';
import { CustomcurrencyPipe } from '../shared/pipe/customcurrency.pipe';
import { AccuracyPipe } from '../shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from '../shared/enums';
@Injectable({
  providedIn: 'any'
})
export class TimesheetService {
  timesheetEntryData: any;
  baseUrl: string;
  viewCurrencyStrict: string = '0.4-4' ;
  accuracyConfig = AccuracyConfigEnum;
  constructor(private eventStream: EventStreamService,private http: HttpClient,public accountCodeService: AccountCodeService,
    private _http: HttpService, private authorizationService: AuthorizationService,
    public datePipe: DatePipe,
    private accuracyPipe: AccuracyPipe,
    private ConfigurationLoader: ConfigurationLoader,
    private storageService: StorageService, private localdatePipe: LocalDateFormatPipe,public currencyPipe: CustomcurrencyPipe
    ) {
      if (environment.demoMode) {
        this.baseUrl = environment.MOCK_ENDPOINT;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
    // const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
  }

  get(url, options?) {
    if (options) {
      return this._http.get(url, this.baseUrl, options);
    }
    else {
      return this._http.get(url);
    }
  }

  post(url, payload?) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }

  delete(url) {
    return this._http.delete(url);
  }

  downloadPostBlob(endpoint, data, baseurl?) {
    if (endpoint) {
      if (baseurl) {
        this.baseUrl = baseurl;
      }
      return this.http.post(this.baseUrl + endpoint, data, { responseType: 'blob' });
    } else {
      return of(null);
    }
  }

  createDayTimesheet(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getSupportingList(oParams) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${currentProgram?.id}/support/support_text`
    return this.get(url, oParams).pipe(map(
      data => {
        return data;
      }
    ));
  }
  
  updateDayTimesheet(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet`;
    return this.put(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getHolidayList(location_id, timesheetData?) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // const _url = `/configurator/programs/${currentProgram?.id}/holiday-calendars?location_id=${location_id}${year}`;
    const _url = `/configurator/programs/${currentProgram?.id}/holiday-calendars?location_id=${location_id}${timesheetData?.hierarchy_id ? ('&hierarchy_id=' + timesheetData?.hierarchy_id) : ''}${timesheetData?.start_date ? ('&duration_from=' + timesheetData?.start_date) : ''}${timesheetData?.end_date ? ('&duration_to=' + timesheetData?.end_date) : ''}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  
  getTimesheetMasterData(currentTimesheetData:any) {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/config?assignment_uuid=${currentTimesheetData?.assignment_id}&timesheet_uuid=${currentTimesheetData?.timesheet_uuid}&start_date=${currentTimesheetData?.start_date}&end_date=${currentTimesheetData?.end_date}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getTimesheetMasterDataValues(currentTimesheetData:any) {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/header/information?assignment_uuid=${currentTimesheetData?.assignment_id}${currentTimesheetData?.timesheet_uuid ? '&timesheet_uuid='+ currentTimesheetData?.timesheet_uuid: ''}&start_date=${currentTimesheetData?.start_date}&end_date=${currentTimesheetData?.end_date}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }  
  
  modifyHourlyTimesheet(timesheetId, payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/modify/hour`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getTimesheetDetails(timesheetId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getAccountCodes(assignmentId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let currentTimesheetData = this.storageService.get(TimesheetConstants?.TIMESHEET); 
    const _url = `/timesheet/programs/${currentProgram?.id}/assignment/${assignmentId}/timesheet/project${currentTimesheetData?.start_date ? ('?start_date=' + currentTimesheetData?.start_date) : ''}${currentTimesheetData?.end_date ? ('&end_date=' + currentTimesheetData?.end_date) : ''}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getTimesheetRevisionHistory(timesheetId, pagination) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/history?${pagination}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  downloadAttachment(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/timesheet/programs/${currentProgram?.id}/timesheets/download`;
    return this.post(url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  deleteDayTimesheet(timesheetId, date, p_id) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/delete/date/${date}?parent_type=${p_id}`;
    return this.delete(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  deleteTimesheet(timesheetId, payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}`;
    return this.put(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  clearTimesheetLogs(timesheetId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/clear-log`;
    return this.put(_url, {}).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getWorkersList(searchText = '', page = 1, limit = 25) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${currentProgram?.id}/worker?limit=${limit}&page=${page}&search=${searchText}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  getDuration(assignmentId, userId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/duration?user_uuid=${userId}&assignment_uuid=${assignmentId}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  getTimesheetList() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getCountries(search?: string) {
    let url = `/configurator/resources/countries?limit=1000`;
    if(search){
      url = url+`&search_text=${!!search ? search : ''}`
    }
    return this._http
      .get(url)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }
  
  getStates(countryId:any, search?: string) {
    let url = `/configurator/resources/states?country_ids=${countryId}&limit=1000`;
    if(search){
      url = url+`&search_text=${!!search ? search : ''}`
    }
    return this._http
      .get(url)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }

  getCounties(stateId:any, search?: string) {
    let url = `/configurator/resources/counties?limit=1000&state_ids=${stateId}&limit=1000`;
    if(search){
      url = url+`&search_text=${!!search ? search : ''}`
    }
    return this._http
      .get(url)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }

  getCities(stateId:any, search?: string) {
    let url = `/configurator/resources/cities?limit=1000&state_ids=${stateId}&limit=1000`;
    if(search){
      url = url+`&search_text=${!!search ? search : ''}`
    }
    return this._http
      .get(url)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }

  getBasicInfo(assignmentId, timesheetId, start_date, end_date) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/basic/information?${assignmentId ? ('assignment_uuid=' + assignmentId) : ''}${timesheetId ? ('&timesheet_uuid=' + timesheetId) : ''}${start_date ? ('&start_date=' + start_date) : ''}${end_date ? ('&end_date=' + end_date) : ''}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getRuleConfiguration(assignmentId, start_date, end_date) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/rule-config?assignment_uuid=${assignmentId}&start_date=${start_date}&end_date=${end_date}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  updateTimesheetApprovalStatus(timesheetId, payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/approval-request`;
    // const _url = `/approval/programs/${currentProgram?.id}/timesheets/${timesheetId}/approval-request`; //Old URL
    return this.put(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  submitTimesheet(timesheetId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/submit`;
    return this.post(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  withdrawTimesheet(timesheetId, payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/${timesheetId}/withdraw`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }
  
  getUserRole() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    const _url = `/configurator/programs/${currentProgram?.id}/members/${userDetails.id}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getConfigDetails(assignmentId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config`;
    let currentTimesheetData = this.storageService.get(TimesheetConstants?.TIMESHEET);    
    if (assignmentId) {
      url += `?assignment_uuid=${assignmentId}${currentTimesheetData?.timesheet_uuid ? '&timesheet_uuid=' + currentTimesheetData?.timesheet_uuid : ''}${currentTimesheetData?.start_date ? ('&start_date=' + currentTimesheetData?.start_date) : ''}${currentTimesheetData?.end_date ? ('&end_date=' + currentTimesheetData?.end_date) : ''}`;
    }
    return this.get(url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  // getApproval(timesheetId, status) {
  //   const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  //   const _url = `/approval/programs/${currentProgram?.id}/timesheets/${timesheetId}/approval-instances?status=${status?.toUpperCase()}`;
  //   return this.get(_url).pipe(map(
  //     data => {
  //       return data;
  //     }
  //   ));
  // }

  getLogData(userId, assignmentId, start_date, end_date, require_working_days) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/user/${userId}/duration/${start_date}/${end_date}/log-data?assignment_id=${assignmentId}&require_working_days=${require_working_days}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  encodeToBase64(filedata) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  }

  getAssignmentDetails(assignmentId) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${currentProgram?.id}/assignment/${assignmentId}?is_assignment_show=timesheet`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  massApproval(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/approval/programs/${currentProgram?.id}/timesheets/mass-approval-request`;
    return this.put(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  bulkApproval(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/timesheet/programs/${currentProgram?.id}/timesheet/mass-approval-request`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getTimesheetNavigationRoute(configData, navigation){
    const layout= navigation?.meta_data?.layout;
    if(layout?.type?.toLowerCase() === TimesheetType.CICO.toLowerCase() && layout?.duration?.toLowerCase() == TimesheetType.WEEKLY?.toLowerCase()){
        return '/timesheet/tito/entry';
    } else if(layout?.type?.toLowerCase() === TimesheetType.HOURS.toLowerCase()){
      if(layout?.duration?.toLowerCase() === TimesheetType?.WEEKLY?.toLowerCase()){
        if(layout?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.MANUAL?.toLowerCase()){
          return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.MANUAL}`;
        } else if(layout?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.HYBRID?.toLowerCase()){
          return `/timesheet/${TimesheetWeeklyType?.HYBRID}`;
        } else if(layout?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.AUTOMATIC?.toLowerCase()){
          return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.AUTOMATIC}`;
        }
      }else{
        return `/timesheet/hourly-timesheet/month`;
      }      
    } else if(layout?.type?.toLowerCase() === TimesheetType.DAY.toLowerCase()){
         return `/timesheet/day-timesheet/${TimesheetWeeklyType?.AUTOMATIC}`;    
    } else if ( layout?.duration?.toLowerCase()  === TimesheetType.MONTHLY?.toLowerCase()){
      return '/timesheet/entry';
    } else {
      return '/timesheet/list';
    }
    /*
    if(navigation.parent_type?.toUpperCase() === 'CICO'){
      return '/timesheet/tito/entry';
    }else if(configData?.work_week_period?.toLowerCase() === TimesheetType?.WEEKLY?.toLowerCase()){
      if(configData?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.MANUAL?.toLowerCase()){
        return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.MANUAL}`;
      }else if(configData?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.AUTOMATIC?.toLowerCase()){
        return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.AUTOMATIC}`;
      }
    }else if (configData?.work_week_period?.toLowerCase() === TimesheetType.MONTHLY?.toLowerCase()){
      return '/timesheet/entry';
    }
    */
  }

  saveAccountCodes(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${currentProgram?.id}/worker/project_code`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  updateAccountCodes(payload) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${currentProgram?.id}/worker/project_code/${payload?.worker_code_id}`;
    return this.put(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getAccountCodesList(worker_id, status) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let _url = `/assignment/programs/${currentProgram?.id}/worker/project_code?`;
    _url = worker_id ? _url + `&worker_id=${worker_id}` : _url;
    _url = status ? _url + `&status=${status}` : _url;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getAccountCodeHistory(type, entity_id, worker_id) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let _url = `/assignment/programs/${currentProgram?.id}/history/type/${type}`;
    if (entity_id) {
      _url += `/entity/${entity_id}`;
    }
    _url = worker_id ? _url + `?worker_id=${worker_id}` : _url;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getTimesheetsForCopy(assignment_uuid, start_date, end_date) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let _url = `/timesheet/programs/${currentProgram?.id}/timesheet/copy/duration?assignment_uuid=${assignment_uuid}&start_date=${start_date}&end_date=${end_date}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  getFormattedDate(start_date, end_date, configData) {
    
    /* 
    const startdate = start_date?.split("-");
    let work_period = '';
    if (startdate?.length === 3) {
      const start_date = new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
      if (configData?.work_week_period?.toLowerCase() === TimesheetType.WEEKLY?.toLowerCase()) {
        const enddate = end_date?.split("-");
        end_date = new Date(parseInt(enddate[0]), parseInt(enddate[1]) - 1, parseInt(enddate[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
        work_period = parseInt(startdate[2]) + ' ' + MonthList[start_date.getMonth()] + ' ' + start_date.getFullYear() + ' - ' + parseInt(enddate[2]) + ' ' + MonthList[end_date.getMonth()] + ' ' + end_date.getFullYear();
      } else {
        work_period = MonthList[start_date.getMonth()] + ' ' + start_date.getFullYear();
      }
    } */
    let work_period = '';
    if (typeof configData == 'string' &&  configData.toLowerCase() === TimesheetType.WEEKLY?.toLowerCase()) {
      // const startdate = start_date?.split("-");
      // const enddate = end_date?.split("-");
      // work_period = this.localdatePipe.transform(new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0)) + ' - ' + this.localdatePipe.transform(new Date(parseInt(enddate[0]), parseInt(enddate[1]) - 1, parseInt(enddate[2]), 0, 0, 0, 0));
      work_period = this.localdatePipe.transform(start_date,'','','',true) + ' - ' + this.localdatePipe.transform(end_date,'','','',true);
    } else {
      const startdate = start_date?.split("-");
      if (startdate?.length === 3) {
        const start_date = new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
        work_period = MonthList[start_date?.getMonth()] + ' ' + start_date.getFullYear();
      }
    }
    return work_period;
  }
  
  getProjectType(data) {
    const types = new Array();
    data?.forEach(d => {
      if (d?.parent_type) {
        types.push(d?.parent_type);
      }
    });
    return types;
  }

  getProject(assignment_id, type, value) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let currentTimesheetData = this.storageService.get(TimesheetConstants?.TIMESHEET); 
    const _url = `/timesheet/programs/${currentProgram?.id}/assignment/${assignment_id}/timesheet/project?type=${type}&search=${value}${currentTimesheetData?.start_date ? ('&start_date=' + currentTimesheetData?.start_date) : ''}${currentTimesheetData?.end_date ? ('&end_date=' + currentTimesheetData?.end_date) : ''}`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }

  impactedTimesheetList(payload:any,configId: string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url =`/timesheet/programs/${currentProgram?.id}/config/basic/${configId}/timesheet/impacted?per_page=10`;
    return this.post(url,payload);
  }
   
  getImpactedAssignment(payload:any,configId: string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url =`/timesheet/programs/${currentProgram?.id}/config/basic/${configId}/assignment/impacted?`;
    return this.post(url,payload);
  }

  getImpactedTimesheet(payload:any,configId:string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config/basic/${configId}/timesheet/impacted`;
    return this.post(url,payload);
  }
   
  onTimesheetToggleStatusChanges(payload:any,configId: string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url =`/timesheet/programs/${currentProgram?.id}/config/basic/${configId}/status`;
    return this.put(url,payload);
  }

  projectCodeValidation(rowData,currentTimesheetData) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let payload = {
      "code": [...new Map(rowData?.map((m) => [(m?.projectInfo?.account_code || m?.projectInfo?.originalCode), (m?.projectInfo?.account_code || m?.projectInfo?.originalCode)])).values()],
      "worker_user_uuid": currentTimesheetData?.user_id,
      "assignment_uuid": currentTimesheetData?.assignment_id
    };
    const _url = `/assignment/programs/${currentProgram?.id}/assignment/worker/accountcode/status`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      }
    ));
  }
 
  isAuthorizedToCreate(is_need_create,can_save ) {
    const currentTimesheetData = this.storageService.get(TimesheetConstants.TIMESHEET);
    // return this.authorizationService.authorize("create_timesheet") && (!currentTimesheetData?.status || currentTimesheetData?.status == TimesheetStatus?.DRAFT || currentTimesheetData?.status == TimesheetStatus?.MISSING || (currentTimesheetData?.status == TimesheetStatus?.WITHDRAWN && is_need_create) || (currentTimesheetData?.status == TimesheetStatus?.REJECTED && is_need_create));  //old code
    return ((!currentTimesheetData?.status ||currentTimesheetData?.status == TimesheetStatus?.MISSING)  && this.authorizationService.authorize("create_timesheet") ) ||
    (can_save && (currentTimesheetData?.status == TimesheetStatus?.DRAFT || (currentTimesheetData?.status == TimesheetStatus?.WITHDRAWN && is_need_create) || (currentTimesheetData?.status == TimesheetStatus?.REJECTED && is_need_create)));
  }

  hasAdminOverridePermission() {
    return this.authorizationService.authorize(Permissions?.ADMIN_OVERRIDE_ON_APPROVAL);
  }

  formatDateInRequiredFormat(inputDate, format) {
    if (typeof (inputDate) === "object") {
      return this.localdatePipe?.transform((new Date(inputDate)), format,undefined, undefined, true);
      // return this.datePipe.transform((new Date(inputDate)), format);
    } else if (typeof (inputDate) === "string") {
      let date: any = inputDate?.split("-");
      if (date?.length === 3) {
        date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
      }
      return this.localdatePipe?.transform(date, format,undefined, undefined, true);
    }
    return inputDate;
  }

  // TimeZone issue(Hybrid)
  getDayNumber(item) {
    const inputDate = this.formatDateInRequiredFormat(item?.date, "yyyy-MM-dd");
    let date: any = inputDate?.split("-");
    if (date?.length === 3) {
      date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);// new Date( this.currentTimesheetData?.start_date); //fixed for safari
    }
    return date?.getDate();
  }
  // end

  showErrorLog(err, showReportButton){
    let logs= undefined;
    logs= {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: showReportButton, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          logs.messages.push(msg?.message);
        }
      });
      return logs;
    }
// verifyAccountCode
  isProjectCodeValid(projectCodes, user_id) {
    const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    return new Promise((resolve) => {
      const accountCode = new Array();
      let errors = '';
      const ProjectCodeData = projectCodes?.map(v => v?.projectInfo)
      ProjectCodeData?.forEach(p => {
        const accountCodeSelected = this.getVerifyAccountCodePayload(p, user_id);
        accountCode?.push(this.accountCodeService.verifyAccountCodeToken(currentProgram.id, accountCodeSelected));
      });
      forkJoin(accountCode).subscribe((res: any) => {
        res?.forEach(e => {
          if (!e?.response?.isValid) {
            errors = errors + '  ' +  e?.response?.message ;
          }
        },(error) =>{ resolve({ result, error })});
        let result = res?.every((i: any) => {
          return i?.response?.isValid === true;
        });
        resolve({ result, errors });
      });
    });
  }

  getVerifyAccountCodePayload = (p, workerId): AccoutCodeValidationRequest => {
    let verificationPayload: AccoutCodeValidationRequest = new AccoutCodeValidationRequest()
    verificationPayload.params = new AccountCodeValidationParams();
    verificationPayload.params.worker_id = workerId // workerId;
    verificationPayload.params.module_name = 'assignment';
    verificationPayload.params.action = 'validation';
    verificationPayload.params.unit_id = ''; //this.assignmentDetails?.assignment_id
    verificationPayload.payload = new AccountCodeValidationPayload();
    p?.payload?.fields?.forEach(foundational_data => {
      if (foundational_data) {
        verificationPayload.payload[foundational_data.key_slug] = foundational_data.value?.code ?? '';
      }
    });
    return verificationPayload;
  }

  emitLogs(logs){
    if(logs){
      window.scrollTo(0,0);
    }
    this.eventStream.emit(new EmitEvent(Events.SHOW_TIMESHEET_LOGS, logs));    
  }

  showTooltip(val, type?, currencyCode?) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(currentProgram?.config?.accuracy_config){
      return this.accuracyPipe?.transform(val, type, { currencyCode } );
    } else{
      return this.accuracyPipe?.transform(val, type, { currencyCode, digitInfo: this.viewCurrencyStrict});
    }  
  //  return this.accuracyPipe?.transform(val, type);
  //  return this.currencyPipe?.transform(val, undefined,undefined,this.viewCurrencyStrict,undefined,true);
  }

  showOnlyCodes() {
    const currentProgram = this.storageService?.get(StorageKeys?.CURRENT_PROGRAM);
    return currentProgram?.config?.show_only_codes || false;
  }

  populateCustomFields(assignment, timesheet) {
    if(assignment && timesheet){
    Object.keys(assignment)?.forEach(function (key) {
      Object.keys(timesheet)?.forEach(function (key1) {
        if ((key === key1) && !timesheet[key]) {
          timesheet[key] = assignment[key];
        }
      });
    });
  }
    if (JSON.stringify(timesheet) === "{}" || (Array?.isArray(timesheet) && timesheet?.length === 0)) {
      return assignment;
    }
    return timesheet
  }

  getAssignmentLockStatus(assignment_id: any) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${currentProgram?.id}/assignment/${assignment_id}/assignment_lock_status`;
    return this.get(_url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  
}
