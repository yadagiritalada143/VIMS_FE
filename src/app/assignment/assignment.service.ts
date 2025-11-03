import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { HttpService } from '../core/services/http.service';
import { map } from 'rxjs/operators';
import { ITimesheetItem } from './component/timesheet-awaiting-approval/timesheet.model';
import { AssignmentWorkflowActions } from './enums/workflow-actions';
import { PendingItemTypes } from './enums/pending-item-types';
import { StorageKeys, StorageService } from '../../../src/app/core/services/storage.service';
import { takeUntil } from 'rxjs/operators';
import { AccuracyPipe } from '../shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from './enums/accuracy-config';
import { ExpenseRoutes,ExpenseType } from '../expense/enums/expense.enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { environment } from 'src/environments/environment';
import { ConfigurationLoader } from '../configuration/configuration-loader.service';
@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  public destroy$: Subject<boolean> = new Subject<boolean>();
  // viewCurrencyStrict: string = '0.4-4' ;
  private currency = new Subject<string>();
  accuracyConfig = AccuracyConfigEnum;
  baseUrl: any;
  // currentProgram: any;
  constructor(private storageService: StorageService, private _httpService: HttpService,
    private accuracyPipe: AccuracyPipe,
    private ConfigurationLoader: ConfigurationLoader,
    private datePipe: LocalDateFormatPipe,) { 
      if (environment.demoMode) {
        this.baseUrl = environment.MOCK_ENDPOINT;
      } else {
        this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
      }
    // this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = this.currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy && +edit_accuracy > 2 ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
  }

  put(url, payload) {
    return this._httpService
      .put(url, payload)
      .pipe(takeUntil(this.destroy$));
  }

  post(url, data) {
    if (url) {
      return this._httpService.post(url, data);
    } else {
      return of(null);
    }
  }

  delete(url, data) {
    if (url) {
      return this._httpService.delete(url, data);
    } else {
      return of(null);
    }
  }

  createAssignment(programId, data): Observable<any> {
    return this._httpService.post(`/assignment/programs/${programId}/assignment`, data);
  }

  getAssignments(programId: string,expenseType:string,workerId: string): Observable<any> {
    if(expenseType.toLowerCase() == ExpenseRoutes.General){
      return this._httpService.get(`/expense/programs/${programId}/worker/${workerId}/assignment?expense_type=${ExpenseType.Expense}`);
    }else{
      return this._httpService.get(`/expense/programs/${programId}/worker/${workerId}/assignment?expense_type=${ExpenseType.MiscExpense}`);
    }
  }
  getApproversData(programId,assignmentId,versionId)
  {
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${assignmentId}/version/${versionId}/approvallist`);
  }

  getHierarchyDetails(programId, id): Observable<any> {
    return this._httpService.get(`/configurator/programs/${programId}/hierarchy/${id}`);
  }

  getAssignmentDetails(programId, id) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${id}`);
  }

  createCandidate(baseUrl, data) {
    return this._httpService.post(`${baseUrl}/candidates`, data);
  }

  updateAssignmentDetails(programId, assignmentId, data) {
    return this._httpService.put(`/assignment/programs/${programId}/assignment/${assignmentId}/update`, data);
  }
  updateWorkerDetails(programId, workerId, workerData) {
    return this._httpService.put(`/assignment/programs/${programId}/worker/${workerId}`, workerData);
  }
  addAdditionalBudget(programId, assignmentId, data) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/additionalBudget`, data)
  }

  getConfigJson(url) {
    return this._httpService.get(url)
  }

  getTerminationListItems(programId, picklistId) {
    return this._httpService.get(`/configurator/programs/${programId}/pages/reason-code-actions/${picklistId}/reason-codes`)
  }

  terminateAssignment(programId, assignmentId, data) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/close`, data)
  }
  cancelAssignment(programId, assignmentId, data) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/cancel`, data)
  }

  getEvaluationListItems(programId, picklistId) {
    return this._httpService.get(`/configurator/programs/${programId}/pages/reason-code-actions/${picklistId}/reason-codes`)
  }

  evaluate(programId, assignmentId, data) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/evaluate`, data)
  }

  approveAssignment(programId, assignmentId, data) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/approval`, data)
  }

  getPickListData(programId) {
    return this._httpService.get(`/configurator/programs/${programId}/picklists`);
  }

  getReasonCodeAction(programID) {
    return this._httpService.get(`/configurator/programs/${programID}/pages/reason-code-actions?page=1&limit=100`);
  }

  getBudgetDetails(programId, AssignmentId) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${AssignmentId}/budget?status=pending`);
  }

  getCurrency() {
    return this.currency.asObservable()
  }

  setCurrency(currency: string) {
    this.currency.next(currency)
  }

  getJobTemplateDetails(programId,jobTemplateId){
    return this._httpService.get(`/job-manager/programs/${programId}/job-templates/${jobTemplateId}`);
  }

  /*getOnBoardingDetails(programId,checkListId,searchKey, pagination){
    return this._httpService.get(`/configurator/programs/${programId}/onboarding/checklists/${checkListId}?search=${searchKey}`);
  }
*/
   getOnBoardingDetails(programId, assignmentId, candidateId, pagination){
    // return this._httpService.get(`/configurator/programs/e0ed0ed7-7423-4ae2-8439-ae71c54b5090/assignments/c5aec14d-e115-45e5-b2e6-4e51346cc355/candidates/87fd36f2-e6c1-41da-9944-6e9d434cda49/onboarding/tasks`);
    return this._httpService.get(`/onboarding-manager/programs/${programId}/assignments/${assignmentId}/candidates/${candidateId}/onboarding/tasks?${pagination}`);
  }

  getQualificationTypes(programId){
    return this._httpService.get(`/configurator/programs/${programId}/qualification-types?code=CREDENTIAL&type_all=true`);
  }

  getCredentialsQualification(programId, qualificationTypeId){
    return this._httpService.get(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications`);
  }

  getTaskDetails(programId,assignmentId,candidateId,taskId){
    // return this._httpService.get(`/configurator/programs/e0ed0ed7-7423-4ae2-8439-ae71c54b5090/assignments/c5aec14d-e115-45e5-b2e6-4e51346cc355/candidates/87fd36f2-e6c1-41da-9944-6e9d434cda49/onboarding/tasks/0058694c-d5df-4ff7-94c9-439d8a2cc737`);
    return this._httpService.get(`/onboarding-manager/programs/${programId}/assignments/${assignmentId}/candidates/${candidateId}/onboarding/tasks/${taskId}`);
  }

  updateTaskDetails(programId,assignmentId,candidateId,taskId,data){
    return this._httpService.put(`/onboarding-manager/programs/${programId}/assignments/${assignmentId}/candidates/${candidateId}/onboarding/tasks/${taskId}`, data);
    // return this._httpService.put(`/configurator/programs/${programId}/assignments/c5aec14d-e115-45e5-b2e6-4e51346cc355/candidates/87fd36f2-e6c1-41da-9944-6e9d434cda49/onboarding/tasks/0058694c-d5df-4ff7-94c9-439d8a2cc737`, data);
  }

  getHistoryRevDetails(programId,assignmentId,revision){
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${assignmentId}/history/view?revision=${revision}`);

  }
  encodeToBase64(filedata) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  }

  getTerminationHistory(programId,assignmentId){
    return this._httpService.get(`/assignment/programs/${programId}/assignment/history/${assignmentId}/terminate`);
  }

  downloadAttachment(programID,payload){
    return this._httpService.post(`/assignment/programs/${programID}/assignments/download`, payload);
  }


  getAssignmentsByJobId(page = 1, limit ,programId, job_id) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment?request_type=basic&page=${page}&limit=${limit}&job_id=${job_id}&type=all`)
  }
  assignmentSearchList(programId,searchKey,pageNo,itemPerPage) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment?request_type=basic&type=all&page=${pageNo}&limit=${itemPerPage}&search=${searchKey}`)
  }

  getAssignmentsByJobAndCandidate(page = 1,programId, job_id,candidate_id) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment?request_type=basic&page=${page}&job_id=${job_id}&candidate_id=${candidate_id}&type=all`)
  }

  getTimesheetAwaitingApproval(page = 1, limit: number, programId: string, assignmentId: string, status: string): Observable<ITimesheetItem[]> {
    return this._httpService.get(`/timesheet/programs/${programId}/timesheet?assignments=${assignmentId}&status=${status}&page=${page}&limit=${limit}`).pipe(
      map((res: any) => res.data.timesheet)
    );
  }

  getExpenseAwaitingApproval(programId: string, assignmentId: string, status: string) {
    return this._httpService.get(
      `/expense/programs/${programId}/assignment-expense/${assignmentId}?status=${status}`
    ).pipe(
      map((res: any) => res.data.length ? res.data : null)
    );
  }

  addBudgetForAssignment(programId: string, assignmentId: string, payload) {
    return this._httpService.post(`/assignment/programs/${programId}/assignment/${assignmentId}/budget`, payload);
  } 

  get(url , options?) {
    if (options) {
      return this._httpService.get(url, this.baseUrl, options);
    }
    else {
      return this._httpService.get(url);
    }
  }
  getSsoIdConfig(vendor_id) {
    return this._httpService.get(`/global-tms/ssoproviders/check-worker-sso/${vendor_id}`)
  }
  checkSsoIdValid(sso_id) {
    return this._httpService.get(`/profile-manager/users?k=${sso_id}&sso=true&is_sso_exists=true`)
  }

  getWorkflowAction(requestType: PendingItemTypes): AssignmentWorkflowActions {
    let action: AssignmentWorkflowActions;
    switch (requestType) {
      case PendingItemTypes.AdditionalBudget: {
        action = AssignmentWorkflowActions.BudgetExtension;
        break;
      }
      case PendingItemTypes.CreateAssignment: {
        action = AssignmentWorkflowActions.Default;
        break;
      }
      case PendingItemTypes.Terminate: {
        action = AssignmentWorkflowActions.Termination;
        break;
      }
      case PendingItemTypes.UpdateAssignment: {
        action = AssignmentWorkflowActions.AssignmentAmendment;
        break;
      }
      default: {
        action = AssignmentWorkflowActions.AssignmentAmendment;
        break;
      }
    }
    return action;
  }

  getApproversList(programId: string, assignmentId: string, requestType: PendingItemTypes) {
    const action = this.getWorkflowAction(requestType);
    return this._httpService.get(
      `/approval/programs/${programId}/assignments/${assignmentId}/approval-instances?workflow_action=${action}`
    );
  }
  populateCustomFields(programID , hierarchy_ids) {
    if(!hierarchy_ids) {
      return;
    }
    return new Promise<any> ((resolve) => {
    const customFieldHttp1 = `/configurator/programs/${programID}/custom-fields?entity_ref=ASSIGNMENTS&hierarchy_ids=${hierarchy_ids}`;
    const http1 = this._httpService.get(customFieldHttp1);
    const customFieldHttp2 = `/configurator/programs/${programID}/custom-fields?entity_ref=ASSIGNMENT_REVISION&hierarchy_ids=${hierarchy_ids}`;
    const http2 = this._httpService.get(customFieldHttp2);
      forkJoin([http1,http2]).subscribe({next  : (res: any) => {
         resolve([res[0]?.custom_fields , res[1]?.custom_fields]);
      }, error:any => (err => {
        resolve(null);
      })
    })
    })
  }

  getAdditionalBudgetList(programId: string, assignmentId: string) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${assignmentId}/additional-budget?status=pending`)
      .pipe(map((res: any) => res.data.assignment));
  }

  changeBudgetStatus(programId: string, assignmentId: string, payload) {
    return this._httpService.put(
      `/approval/programs/${programId}/assignments/${assignmentId}/approval-request`,
      payload
    );
  }

  approveAssignmentRequest(programId: string, assignmentId: string, requestType: PendingItemTypes, adminApproval: Boolean, approval_chain_id: string, is_reassigned_user: boolean = false) {
    const payload = {
      status: 'APPROVED',
      is_forced_approval: adminApproval,
      approval_chain_id: approval_chain_id,
      workflow_action: this.getWorkflowAction(requestType),
      is_reassigned_user: is_reassigned_user
    };
    return this.changeBudgetStatus(programId, assignmentId, payload);
  }

  rejectAssignmentRequest(programId: string, assignmentId: string, rejectionForm, requestType: PendingItemTypes,is_reassigned_user: boolean = false) {
    const payload = {
      status: 'REJECTED',
      ...rejectionForm,
      is_forced_approval: false,
      workflow_action: this.getWorkflowAction(requestType),
      is_reassigned_user: is_reassigned_user
    };
    return this.changeBudgetStatus(programId, assignmentId, payload);
  }

  getAssignmentHistory(programId: string, assignmentId: string, pageNumber: Number, limit: Number) {
    return this._httpService.get(`/assignment/programs/${programId}/assignment/${assignmentId}/history?page=${pageNumber}&limit=${limit}`);
  }

  resendEmail(programId: string, candidateId: string, payload: any, id: string, taskid:string) {
    return this._httpService.post(`/onboarding-manager/programs/${programId}/assignments/${id}/candidates/${candidateId}/onboarding/resend-hellosign/${taskid}`, payload)
  }
  public getAssignmentLockStatus(assignmentId:any , program_id){
    return this._httpService.get(`/assignment/programs/${program_id}/assignment/${assignmentId}/assignment_lock_status`)
      .pipe(takeUntil(this.destroy$));
  }

  showAmount(amount : any, currencyCode?: string, accuracyType = this.accuracyConfig.amount){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    let viewCurrencyStrict = edit_accuracy && +edit_accuracy > 2 ? `0.${edit_accuracy}-${edit_accuracy}` : '0.4-4';
    if(amount && amount !== 0){
      if(currentProgram?.config?.accuracy_config){
        return this.accuracyPipe?.transform(amount, accuracyType, { currencyCode });
      } else{
        return this.accuracyPipe?.transform(amount, accuracyType, { currencyCode, digitInfo: viewCurrencyStrict});
      }  
    } else {
      return '0.0000';
    }
    // return this.accuracyPipe?.transform(amount, accuracyType, { currencyCode }); 
    
  }
  getDefaultDateFormat(){
    return  this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
 }
 convertDateFormat(dateString: string) {
  if (!dateString) {
    return;
  }
  return this.datePipe.transform(dateString, "YYYY-MM-DD", null, null, true, this.getDefaultDateFormat());
}
addDays(dateString: string, noOfDays: number = 0) {
  const date = dateString?.split("-");
  if (date?.length === 3) {
    const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
    new_Date?.setDate(new_Date?.getDate() + noOfDays);
    return new_Date;
  }
  return null;
}
convertToNormalDate(dateString: string) {
  if (!dateString) {
    return;
  }
  let date, month, year, dateArray, formatArray;
  let dateFormat = this.getDefaultDateFormat();
  if (dateString.includes('-')) {
    dateArray = dateString.split('-');
    formatArray = dateFormat.split('-');

  } else if (dateString.includes('/')) {
    dateArray = dateString.split('/');
    formatArray = dateFormat.split('/');
  }

  if (dateFormat.includes('-')) {
    formatArray = dateFormat.split('-');

  } else if (dateFormat.includes('/')) {
    formatArray = dateFormat.split('/');
  }

  for (let index = 0; index < formatArray?.length; index++) {
    const abb = formatArray[index];
    if (abb.toLowerCase().includes('mm')) {
      month = dateArray[index];
    } else if (abb.toLowerCase().includes('yy')) {
      year = dateArray[index];
    } else if (abb.toLowerCase().includes('dd')) {
      date = dateArray[index];
    }
  }
  return `${month}-${date}-${year}`
}
}
