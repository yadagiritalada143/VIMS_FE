import { Injectable } from '@angular/core';
import { HttpService } from '../../../../src/app/core/services/http.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
import { map, takeUntil } from 'rxjs/operators';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { IApproverMember } from './interfaces/IUser';
import { EntityReferrences } from './enumerations/entityRef';
import { IReplaceApproverResponse } from './interfaces/IResponses';

export interface RateVal {
  factor: any;
  rate_type: any;
  adjustment: any;
  adjustment_type: any;
}
export interface RateFactors {
  abbreviation: string;
  billable: boolean;
  applicable:boolean;
  bill_rate: RateVal[];
  pay_rate: RateVal[];
}

interface RateObject {
  id: string;
  abbreviation: string;
  billable: boolean;
  applicable: boolean;
  bill_rate: RateDetail[];
  pay_rate: RateDetail[];
}

interface RateDetail {
  factor: number;
  rate_type: string;
  adjustment: number;
  adjustment_type: string;
  is_edit: boolean;
}
@Injectable({
  providedIn: 'root'
})



export class JobDetailsService{
  private currentProgram;
  private baseUrl: string = '';
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public updateJobDetails$ :Subject<boolean> = new Subject<boolean>();
  public countsUpdated$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public offer_details_tab_clicked$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public needToReloadNotificationComponent: boolean = false;
  constructor(
    private _http: HttpService,
    private _alert: AlertService,
    private storageService: StorageService,

  ) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.baseUrl = '/submission-manager';
  }

  get(url, params?: any) {
    return this._http.get(url, undefined, params).pipe();
    // takeUntil(this.destroy$)
  }
  post(url, payload) {
    return this._http
      .post(url, payload)
      .pipe(takeUntil(this.destroy$));
  }
  put(url, payload) {
    return this._http
      .put(url, payload)
      .pipe(takeUntil(this.destroy$));
  }
  updateStatus(id, payload) {
    // const _url = `/job-manager/PRG-ABJ-003/job/${id}`;
    const _url = `/approval/approval-id/${id}`;
    return this.put(_url, payload).pipe(
      map(
        (res) => {
          let data = res;
          if (data) {
            return data;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        (err) => {
          this._alert.error(errorHandler(err));
        }
      )
    );
  }

  checkConfig(rateModel,clientBillRateEnabledConfig,user_type){
    user_type = user_type?.toLowerCase();
    if(rateModel === 'BILL_RATE') {
       if(clientBillRateEnabledConfig){
         return true;
       }
       else{
        if(user_type != 'vendor' && user_type != 'super_org'){
          return true;
        }
        else{
          return false;
        }
       }
     }
     else {
        if(user_type === 'client' || user_type === 'msp'){
          return true;
        }
        else{
          return false;
         }
    }
  }

  getUnitOfMesaure(rateType) {
    const rateTypeMap = {
      'hourly': 'per_hour',
      'daily': 'per_day',
      'monthly': 'per_month',
      'weekly': 'per_week',
      'yearly': 'per_year',
    };

    return rateTypeMap[rateType.toLowerCase()] || null;
  }

  patch(url, payload) {
    return this._http.patch(url, payload);
  }
  jobDetail: any;
  getJobs(id, burstCache?) {
    let data = this.storageService.get('viewd_job');
    if (id && this.jobDetail && this.jobDetail.uid === id && this.jobDetail?.status === data?.status && !!!burstCache) {
      return of({ data: [this.jobDetail] });
    }
    return this.loadJob(id);
  }
  getApproversList(jobId) {
    const url = `/approval/programs/${this.currentProgram.id}/jobs/${jobId}/approval-instances?status=PENDING`;
    return this.get(url).pipe(map(
      data => {
        return data;
      }
    ));
  }
  retriggerAssignment(jobid,offerid,payload){
    const url = `${this.baseUrl}/programs/${this.currentProgram?.id}/jobs/${jobid}/offers/${offerid}/retrigger_assignment`;
    return this.post(url,payload).pipe(map(
      data => {
        return data;
      }
    ));
  }

  loadJob(id , showError?) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/job-manager/programs/${this.currentProgram?.id}/jobs/${id}`;
    return this.get(_url).pipe(
      map(
        (res: any) => {
          if (res && res.data && res.data.length > 0) {
            this.jobDetail = res.data[0];
            this.countsUpdated$.next(this.jobDetail.counts);
          }
          if (res) {
            return res;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        (err) => {
          if(showError){
            return err;
          }
          this._alert.error(errorHandler(err));
        }
      )
    );
  }
  getUpdatedJobData(id, showError?) {
    const _url = `/job-manager/programs/${this.currentProgram.id}/jobs/${id}`;
    return this.get(_url).pipe(
      map(
        (res: any) => {
          if (res && res.data && res.data.length > 0) {
            this.jobDetail = res.data[0];
          }
          if (res) {
            return res;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        (err) => {
          if(showError){
            return err;
          }
          this._alert.error(errorHandler(err));
        }
      )
    );
  }

  getJobHistory(jobId) {
    const url = `/job-manager/programs/${this.currentProgram.id}/job-history/${jobId}`;
    const payload = {
      filters: {
        program_ids: [],
        actions: [],
        entity_refs: [],
        entity_ids: [jobId],
      },
    };
    return this.post(url, payload).pipe(
      map(data => {
        return data;
      }),
    );
  }

  getCandidateHistory(limit, candidateId, jobId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/audit-history?limit=${limit}&candidate_id=${candidateId}&job_id=${jobId}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getListOfUsersByIds(user_ids,isDisabledUsersReq?): Observable<any> {
    let query = '?user_ids=' + user_ids;
    if(isDisabledUsersReq){
    query+="&is_all_users_required=true";
    }
    return this.get(`/configurator/programs/${this.currentProgram?.id}/members` + query);
  }
  getJobsBy(user_id, id) {
    const _url = `/approval/approver/${user_id}?status=pending&entity_id=${id}`;
    return this.get(_url).pipe(
      map(
        (res) => {
          let data = res;
          if (data) {
            return data;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        (err) => {
          this._alert.error(errorHandler(err));
        }
      )
    );
  }
  getByEntityID(entity_id) {
    const _url = `/approval/status/entity/job/${entity_id}?get_obj=False`;
    return this.get(_url).pipe(
      map(
        (res) => {
          let data = res;
          if (data) {
            return data;
          } else {
            this._alert.error(`No data found.`);
          }
        },
        (err) => {
          this._alert.error(errorHandler(err));
        }
      )
    );
  }

  saveSubmitCandidate(payload, jobId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/submit`;
    return this._http.post(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getCandidateComparison(payload){
    const _url = `${this.baseUrl}/candidates/compare_candidate_score`;
    return this._http.post(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getMspFee(hierarchy_id,industry_id,vendor_id){
    const _url = `/submission-manager/programs/${this.currentProgram.id}/msp-fee?hierarchy_id=${hierarchy_id}&industry_id=${industry_id}&vendor_id=${vendor_id}&sourcing_model=CONTINGENT`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  reSubmitCandidate(payload, jobId, candidateId, submissionId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/submission/${submissionId}`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  withdrawCandidate(payload, jobId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/withdraw`;
    return this.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  fetchCurrentSubmitCandidate(candidateId, jobId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram?.id}/jobs/${jobId}/candidates/${candidateId}`;
    return this.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getWorkerDetails(candidateId){
    this.currentProgram = this.currentProgram ?? this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `/assignment/programs/${this.currentProgram.id}/assignment/candidate/${candidateId}`;
    return this.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  updateSubmitCandidate(payload, jobId, candidateId, submissionId) {
    const _url = `/configurator/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/submission/${submissionId}`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getOfferDetails(jobId, candidateId, offerId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/offers/${offerId}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  releaseOffer(payload, jobId, candidateId) {
    //configurator/programs/<PROGRAM_ID>/jobs/<JOB_ID>/candidates/<CANDIDATE_ID>/offers
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/offers`;
    return this._http.post(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getInterviewList(jobId, search?, candidateId?, sort?) {
    let _url = `${this.baseUrl}/programs/${this.currentProgram?.id
      }/jobs/${jobId}/interviews?1=1`;
    if (search) {
      _url += `&k=${search}`
    }
    if (candidateId) {
      _url += `&candidate_id=${candidateId}`
    }
    if (sort) {
      _url += sort;
    }
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getAllInterviewList(status?, search?, pageNo?, limit?, sort?, currentProgramId?) {
    let qry = '?';
    if (status) {
      qry = `${qry}status=${status}`
    }
    qry = `${qry}&limit=${limit}&page=${pageNo}`
    /* if (sort && sort.order.toLocaleLowerCase() === 'desc') {
      sortParam = '-' + sort.name;
    } else {
      sortParam = '' + sort.name;
    } */
    qry = `${qry}${(sort && sort.order)  ? sort.order.toLocaleLowerCase() === 'desc' ? '&order_by=desc' : '&order_by=asc' : ""}&key=${sort.name}`;
    let _url = `${this.baseUrl}/programs/${currentProgramId}/interviews${qry}`;
    if (search) {
      _url += `&k=${search}`
    }
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getLatestTabCount(currentProgramId?) {
    const _url = `${this.baseUrl}/programs/${currentProgramId}/interviews/stats`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getTodaysInterview(jobId, scheduled_on) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id
      }/jobs/${jobId}/interviews${scheduled_on ? '?scheduled_on=' + scheduled_on : ''
      }`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getTodaysInterviewByProgramUsier(scheduled_on, currentProgramId) {
    const _url = `${this.baseUrl}/programs/${currentProgramId}/interviews${scheduled_on ? '?scheduled_on=' + scheduled_on : ''
      }`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  optInOutJob(payload, jobId, vendorId) {
    const _url = `/job-manager/programs/${this.currentProgram.id}/job_distribution/${vendorId}/${jobId}`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  counterOffer(payload, jobId, candidateId, offerId) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram?.id}/jobs/${jobId}/candidates/${candidateId}/offers/${offerId}`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getProgramConfig(type) {
    // once the config table updated with data, need to change the program id.
    const _url = `/configurator/programs/${this.currentProgram?.id}/config?entity_code=${type}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  //rate factor
  getRateFactors(){
    const _url = `/configurator/programs/${this.currentProgram?.id}/rate-factors`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getVendorMarkups(vendorId){
    const _url = `/configurator/programs/${this.currentProgram?.id}/vendors/${vendorId}/markups`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  rejectCandidate(payload, jobId) {
    //PUT /job-manager/programs/<PROGRAM_ID>/jobs/<JOB_ID>/candidates/reject
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/reject`;
    return this.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  candidateAction(payload, jobId, interviewId, candidateId) {
    //PUT /job-manager/programs/<PROGRAM_ID>/jobs/<JOB_ID>/candidates/reject
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/interviews/${interviewId}/acceptance?member_type=CANDIDATE&member_id=${candidateId}`;
    return this.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  jobStatusUpdate(payload, jobId) {
    const _url = `/job-manager/programs/${this.currentProgram.id}/jobs/${jobId}`;
    return this.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getInterviewDetails(programId, jobId, interviewId) {
    const _url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/interviews/${interviewId}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  updateInterviewReview(jobId, interviewId, payload) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/interviews/${interviewId}/status`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }

  scheduleInterview(jobId, candidateId, payload) {
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/interviews`;
    return this._http.post(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getTimezones() {
    const _url = `/configurator/resources/time_zones?program_id=${this.currentProgram.id}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getJobManagers(search?: string, hierarchy_id?: string) {
    return this._http
      .get(
        `/configurator/programs/${this.currentProgram.id
        }/members?org_category=CLIENT&order_by=asc&name=${!!search ? search : ''}&info_level=basic${ hierarchy_id ? '&hierarchy_ids='+hierarchy_id : ''}`
      )
      .pipe(
        map((data) => {
          return data;
        })
      );
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

  getHolidayCalenderList() {
    return this._http
      .get(`/configurator/programs/${this.currentProgram.id}/holiday-calendars`)
      .pipe(
        map((data) => {
          return data;
        })
      );
  }

  getPickLists(programId) {
    const _url = `/configurator/programs/${programId}/picklists?limit=50&page=1`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getPickListItems(programId, picklistSlug = null, picklistId = null, hierachyId?) {
    let _url = '';
    if(picklistSlug && hierachyId){
      _url = `/configurator/programs/${programId}/picklists/*/items?picklist_slug=${picklistSlug}&is_enabled=true&hierarchy_id=${hierachyId}`;
    }
    else if(picklistSlug) {
      _url = `/configurator/programs/${programId}/picklists/*/items?picklist_slug=${picklistSlug}`;
    } else {
      _url = `/configurator/programs/${programId}/picklists/${picklistId}/items`;
    }
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getTimeSheetTypes(programId,hierachyId,locationValue,rateType,remoteWorker?){
    const _url = `/timesheet/programs/${programId}/config/basic`;
    let queryParams : any = {
      hierarchy: hierachyId,
      status : 'active',
      is_pagination_included: 'false'
    }
    if(remoteWorker){
      queryParams={
        ...queryParams,
      remote_worker: true,
      remote_country:remoteWorker?.country?.id,
      remote_state:remoteWorker?.state?.id,
      remote_county:remoteWorker?.county?.id,
      remote_city:remoteWorker?.city?.id,
      }
    }
    else{
      queryParams={
        ...queryParams,
        location : locationValue,
        rate_type: rateType,
      }
    }
    return this._http.get(_url,null,queryParams).pipe(
      map((data) => {
        return data;
      })
    );
  }

  getTimeSheetRates(programId,value,hierachyId){
    const _url = `/timesheet/programs/${programId}/config/${value}/rate-factors?hierarchy_id=${hierachyId}`;
    return this._http.get(_url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  //   getOptOutReason(programId, actionId) {
  //      const _url = `/configurator/programs/${programId}/pages/reason-code-actions/${actionId}/reason-codes`;
  //     return this._http.get(_url).pipe(
  //       map((data) => {
  //         return data;
  //       })
  //     );
  //   }
  //   getOptoutAction(programId) {
  //     const _url = `/configurator/programs/${programId}/pages/reason-code-actions`;
  //    return this._http.get(_url).pipe(
  //      map((data) => {
  //        return data;
  //      })
  //    );
  //  }

  getOfferNotes(jobId, cId, offerId) {
    const url = `/job-manager/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${cId}/offers/${offerId}/notes`;
    return this._http.get(url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  acceptOffer(programId, payload, jobId, offerId) {
    // PUT /configurator/programs/<PROGRAM_ID>/jobs/<JOB_ID>/offers/<OFFER_ID>/acceptance
    const url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/offers/${offerId}/acceptance`;
    return this._http.put(url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  getSubmissionDetails(programId, jobId, candidateId) {
    //need work
    const url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/candidates/${candidateId}`;
    return this._http.get(url).pipe(
      map((data) => {
        return data;
      })
    );
  }
  fetchOfferForCandidate(programId,candidateId, jobId) {
    const url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/offers?candidate_id=${candidateId}`;
    return this._http.get(url).pipe(
      map((data) => {
        return data;
      })
    );
  }

  withdrawOffer(jobId, offerId, reason, note) {
    const url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/offers/${offerId}/acceptance`;
    return this._http.put(url, {
      "action": "WITHDRAW",
      "reason": reason,
      "note": note
    });
  }
  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  getOnBoardingDetails(programId, jobId, candidateId, job_template_id) {
    return this._http.get(`/onboarding-manager/programs/${programId}/jobs/${jobId}/candidates/${candidateId}/onboarding/tasks?job_template_id=${job_template_id}`);
    // return this._http.get(`/configurator/programs/e0ed0ed7-7423-4ae2-8439-ae71c54b5090/assignments/3e64e338-6f19-4747-b6de-6ec9d9254473/candidates/03663acb-a77e-4b1c-a406-b4a89c862b10/onboarding/tasks?job_template_id=0bc1fa33-dcb7-480a-a389-32da308ce53f&page=1&limit=0`);
  }

  getOnboardingCheckListData(programId, payload){
    const _url = `/onboarding-manager/programs/${programId}/onboarding/jobs/checklist-tasks`;
    return this._http.post(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }

  fetchAssignments(assignmentId): Observable<any> {
    const url = `/assignment/programs/${this.currentProgram.id}/assignment/${assignmentId}`;
    return this._http.get(url).pipe(
      map(res => res)
    )
  }

  // getReasonCodes(reasonsFor, programId) {
  //   return this._http.get(`/configurator/programs/${programId}/pages/reason-code-actions?code=${reasonsFor}`).pipe(
  //     mergeMap(res => {
  //       const reasonsForItemId = res.reason_code_actions[0];
  //       return this._http.get(`/configurator/programs/${programId}/pages/reason-code-actions/${reasonsForItemId?.id}/reason-codes`)
  //         .pipe(
  //           map(res2 => {
  //             return {
  //               ...res2,
  //               action_code: reasonsForItemId
  //             }
  //           })
  //         );
  //     })
  //   )
  // }
  getTaskDetails(programId, jobId, candidateId, taskId) {
    // return this._httpService.get(`/configurator/programs/e0ed0ed7-7423-4ae2-8439-ae71c54b5090/assignments/c5aec14d-e115-45e5-b2e6-4e51346cc355/candidates/87fd36f2-e6c1-41da-9944-6e9d434cda49/onboarding/tasks/0058694c-d5df-4ff7-94c9-439d8a2cc737`);
    return this._http.get(`/onboarding-manager/programs/${programId}/jobs/${jobId}/candidates/${candidateId}/onboarding/tasks/${taskId}`);
  }
  updateTaskDetails(programId, jobId, candidateId, taskId, data) {
    return this._http.put(`/onboarding-manager/programs/${programId}/jobs/${jobId}/candidates/${candidateId}/onboarding/tasks/${taskId}`, data);
    // return this._httpService.put(`/configurator/programs/${programId}/assignments/c5aec14d-e115-45e5-b2e6-4e51346cc355/candidates/87fd36f2-e6c1-41da-9944-6e9d434cda49/onboarding/tasks/0058694c-d5df-4ff7-94c9-439d8a2cc737`, data);
  }
  encodeToBase64(filedata) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }


  updateReleasedOffer(payload, jobId, candidateId, offerId) {
    ///configurator/programs/<PROGRAM_ID>/jobs/<JOB_ID>/candidates/<CANDIDATE_ID>/offers/<OFFER_ID>
    const _url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${jobId}/candidates/${candidateId}/offers/${offerId}`;
    return this._http.put(_url, payload).pipe(
      map((data) => {
        return data;
      })
    );
  }
  emitOfferDetailsClickEvent() {
    this.offer_details_tab_clicked$.next('reload');
    this.needToReloadNotificationComponent = true;
  }
  changeSubmissionLimit(program_id, job_id, data) {
    return this._http.put(`/job-manager/programs/${program_id}/job_distribution/job_id/${job_id}`, data)
  }

  getApproverMembers(programId: string, orgCategory?: any, term?: string, exculed_ids?: string[]): Observable<IApproverMember> | any {
    const url = `/configurator/programs/${programId}/members?info_level=basic${orgCategory? '&org_category=' + orgCategory : ''}${term? '&name=' + term : ''}${exculed_ids? '&exclude_user_ids=' + exculed_ids.join(',') : ''}`;
    return this._http.get(url);
  }

  updateApprover(
    programId: string,
    entityRef: EntityReferrences,
    entityId: string,
    replaceApproverId: string,
    memberId?: string,
    level?: number): Observable<IReplaceApproverResponse> | any {
    let url = `/approval/programs/${programId}/${entityRef}/${entityId}/replace-approver?`;
    if (memberId) {
      url = url + `member_id=${memberId}`;
    } else if (level != null) {
      url = url + `level=${level}`;
    }
    const data = {
      replace_approver_id: replaceApproverId,
      workflow_action: "DEFAULT"
    }
    return this._http.put(url, data);
  }

  public itemsPerPage = 100;

  async masterDataProgressiveLoader(pageNum: number = 1, map: Map <string, number> = null) {
    if(!map)
      map = new Map <string, number> ();
    return await this.loadMasterDataDetails(pageNum)
    .then(async (res) => {
      let fd_types: Array <any> = res.foundational_data_types;
      let count: number = res.total_records;

      fd_types = fd_types.map(node => {
        return {
          id: node.id,
          ref_order: node.ref_order,
          configuration: node.configuration
        }
      });

      fd_types.forEach(node => {
        map.set(node.id, pageNum*this.itemsPerPage + node.ref_order);
      });

      let totalPageCount = (count%this.itemsPerPage === 0) ? count/this.itemsPerPage: count/this.itemsPerPage + 1;
      pageNum += 1;

      if(totalPageCount < pageNum) {
        return { map, fd_types };
      }
      return await this.masterDataProgressiveLoader(pageNum, map);
    }).catch(err => {
      this._alert.error(errorHandler(err));
      return map;
    });
  }

  loadMasterDataDetails(page: number): Promise <any> {
    const progId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${progId}/foundational-data-types?limit=${this.itemsPerPage}&page=${page}&ordering=ref_order`;
    return this._http.get(url)
    .toPromise();
  }

  rateAuthority() {
    const userType = this.storageService.get('user_type');
    const user_permission = this.storageService.get('user_permission');
    if (user_permission?.includes('enforce_blind_submittal') && userType != "SUPER_ORG") {
      return true;
    }
    return false;
  }

  clientBillRateEnabled() {
    const program = this.storageService.get('CurrentProgram');
    return program?.config?.is_allow_vendor_to_enter_client_bill_rate;
  }

  remoteWorker(){
    const program = this.storageService.get('CurrentProgram');
    return program?.config?.manage_remote_workers;
  }

  getAdjustmentPayload(feeValue){
    if(!feeValue){
      return [{
        entity_name: 'ACA',
        amount_type: 'fixed_amount',
        amount_value: '0',
        applicable_on: this.currentProgram?.config?.adjustment_fee_applicable_on || 'client_bill_rate',
        calculated_on: this.currentProgram?.config?.adjustment_fee_calculated_on,
        entity_type: 'adjustment_fee'
      }]
    }
  }

  showTaxInComponents(config, acceptOffer?){
    const oldTaxEnabled = config?.is_old_tax_enabled;
    const taxCongAssignment =  config?.is_custom_tax_on_assignment;

    if(oldTaxEnabled && taxCongAssignment){
      return acceptOffer ? true : false;
    }
    else if(taxCongAssignment){
      return true;
    }
    else {
      return false;
    }

  }

  toTitleCase(str) {
    if (!str) {
      return;
    }
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt?.charAt(0)?.toUpperCase() + txt?.substr(1)?.toLowerCase();
      }
    );
  }

  getAllCountries() {
    const url = `/configurator/resources/countries?limit=300`;
    return this._http.get(url);
  }

  getUOMType(UOM) {
    if (UOM) {
      let rate_type = '';
      if (UOM?.toLowerCase() === 'hourly') {
        rate_type = 'per_hour'
      } else if (UOM?.toLowerCase() === 'daily') {
        rate_type = 'per_day'
      } else if (UOM?.toLowerCase() === 'monthly') {
        rate_type = 'per_month';
      } else if (UOM?.toLowerCase() === 'weekly') {
        rate_type = 'per_week'
      } else if (UOM?.toLowerCase() === 'yearly') {
        rate_type = 'per_year'
      } else if(UOM?.toLowerCase() === 'quarterly') {
        rate_type = 'per_quater'
      } else {
        rate_type = 'per_hour'
      }
      return rate_type;
  }
}

getRateFactorInfoForPayload(rates, configRates, ishybrid?){
  const hasStAbbreviation = rates?.some(rate => rate?.abbreviation?.toLowerCase() === 'st');
  const stRateFactor = configRates?.find(rate => rate?.abbreviation?.toLowerCase() === 'st');

  if (!hasStAbbreviation) {
      rates?.push(stRateFactor);
  }
  rates = rates?.map(rate => ({ ...rate, applicable: true }));
  const seenIds = new Set();
  rates = rates?.filter(rate => {
      if (!seenIds.has(rate.id)) {
          seenIds.add(rate.id);
          return true;
      }
      return false;
  });

  const configRateLookup = new Map(configRates?.map(configRate => [configRate?.id, configRate?.edit_rate_factors]));

  rates?.forEach(rate => {
      const editRateFactors = configRateLookup.get(rate.id);
      if (editRateFactors !== undefined) {
        rate.pay_rate.forEach((payRate) => {
          payRate.is_edit = editRateFactors;
        });
        rate.bill_rate.forEach((billRate) => {
            billRate.is_edit = editRateFactors;
        });
      }
  });

  const filteredRates = rates?.map(rate => {
    const filteredBillRate = rate?.bill_rate?.map(rateType => {
      const { rate, ...rest } = rateType;
      return rest;
    });
    const filteredPayRate = rate?.pay_rate?.map(rateType => {
      const { rate, ...rest } = rateType;
      return rest;
    });

    return {
      ...rate,
      bill_rate: filteredBillRate,
      pay_rate: filteredPayRate,
    };
  });

  rates = ishybrid ? filteredRates : filteredRates?.filter(item => item.billable);
  const filteredResponse = rates?.map((obj) => {
    const filteredObj: RateObject = {
      id: obj.id,
      abbreviation: obj.abbreviation,
      billable: obj.billable,
      applicable: obj.applicable,
      bill_rate: obj.bill_rate,
      pay_rate: obj.pay_rate,
    };
    return filteredObj;
  });

  return filteredResponse || [];
}

combineFactors(billObj,payObj){
  return (billObj !== undefined && payObj !== undefined) ? [billObj, payObj] : [];
}

createLocalRateFactorArrForUpdation(rateFactor: any[], ratesConfiguration: any[]) {
  let rate_factors_arr = [];
  let rate_factor = rateFactor ? JSON.parse(JSON.stringify(rateFactor)) : rateFactor;
  if (rateFactor?.length === 0 || rateFactor?.filter((x) => x?.abbreviation?.toLowerCase() === 'st').length === 0) {
    rate_factor?.push(ratesConfiguration?.find(element => element?.abbreviation?.toLowerCase() === 'st'))
  }
  rate_factor = rate_factor?.filter(function( element ) {
    return element !== undefined;
 });
  rate_factor?.forEach((rate) => {
    let rate_factors: RateFactors = {
      abbreviation: rate?.abbreviation?.toLowerCase(),
      billable:rate?.billable,
      applicable: rate?.billable ?? true,
      bill_rate: [],
      pay_rate: []
    };
    if (rate?.bill_rate?.length > 0) {
      for (var i = 0; i < rate?.bill_rate?.length; i++) {
        let rateVal: RateVal = {
          factor: 0, rate_type: "", adjustment: rate.bill_rate[i]?.adjustment || null, adjustment_type: rate.bill_rate[i]?.adjustment_type || null
        };
        rateVal.factor = rate?.bill_rate[i]?.factor;
        rateVal.rate_type = rate?.bill_rate[i]?.rate_type.toUpperCase();
        rate_factors?.bill_rate?.push(rateVal);
      }
    }

    if (rate?.pay_rate?.length > 0) {
      for (var i = 0; i < rate?.bill_rate?.length; i++) {
        let rateVal: RateVal = {
          factor: 0, rate_type: "" , adjustment: rate?.pay_rate[i]?.adjustment || null, adjustment_type: rate?.pay_rate[i]?.adjustment_type || null
        };
        rateVal.factor = rate?.pay_rate[i]?.factor;
        rateVal.rate_type = rate?.pay_rate[i]?.rate_type.toUpperCase();
        rate_factors?.pay_rate?.push(rateVal);
      }
    }
    rate_factors_arr?.push(rate_factors);
  });
  return rate_factors_arr;
}

removeDuplicateRateTypes(data) {
  const removeDuplicates = (rateArray) => {
      const uniqueRates = {};
      return rateArray?.reduce((result, rate) => {
          const key = rate?.rate_type;
          if (!uniqueRates[key]) {
              uniqueRates[key] = true;
              result.push(rate);
          }
          return result;
      }, []);
  };
  return data.map(entry => {
      entry.bill_rate = removeDuplicates(entry?.bill_rate);
      entry.pay_rate = removeDuplicates(entry?.pay_rate);
      return entry;
  });
}

rearrangeRates(rates) {
  let RateInfo = new Array();
  const regular = rates?.filter(function (e, index) {
    e.rate_factor = e.rate_factor ?? e.abbreviation;
    if (e.rate_factor?.toLowerCase() === 'regular' || e.rate_factor?.toLowerCase() === 'st') {
      e.index = index;
      e.name = e.name || 'Regular';
    }
    return e.rate_factor?.toLowerCase() === 'regular' || e.rate_factor?.toLowerCase() === 'st';
  });
  if (regular?.length > 0 && regular[0].index >= 0) {
    rates.splice(regular[0].index, 1);
    RateInfo = [...regular];
  }

  const ot = rates?.filter(function (e, index) {
    if (e.rate_factor?.toLowerCase() === 'ot') {
      e.index = index;
    }
    return e.rate_factor?.toLowerCase() === 'ot';
  });
  if (ot?.length > 0 && ot[0].index >= 0) {
    rates.splice(ot[0].index, 1);
    RateInfo = [...RateInfo, ...ot];
  }

  const dt = rates?.filter(function (e, index) {
    if (e.rate_factor?.toLowerCase() === 'dt') {
      e.index = index;
    }
    return e.rate_factor?.toLowerCase() === 'dt';
  });
  if (dt?.length > 0 && dt[0].index >= 0) {
    rates.splice(dt[0].index, 1);
    RateInfo = [...RateInfo, ...dt];
  }

  if (rates) {
    rates = [...RateInfo, ...rates];
  }

  return this.removeDuplicateIdObjects(rates);
}

removeDuplicateIdObjects(array = []) {
  const uniqueObjects = {};
  const resultArray = [];
  for (const obj of array) {
    if (!uniqueObjects[obj.id]) {
      resultArray.push(obj);
      uniqueObjects[obj.id] = true;
    }
  }
  return resultArray;
}

updateCostComponentValues(rates,form,ratesArr,rateFactors) {
  if (!rates) return;

  const updateRateFactor = (arr, cc, abbr) => {
    if (!arr) return;

    const updateObj = arr.find(o => o?.abbreviation?.toLowerCase() === abbr.toLowerCase());
    for (const key of Object.keys(updateObj?.cost_component || {})) {
      if (key === 'markup') {
        continue;
      }
      const obj = {
        value: cc?.[key]?.value,
        type: cc?.[key]?.type,
        level: cc?.[key]?.level
      };
      updateObj.cost_component[key] = obj;
    }
  }

  const getRateCC = (abbr: string) => {
    if (abbr === 'st' || abbr === 'regular') {
      return form.get('costComponent');
    } else {
      const ind = ratesArr.controls.findIndex(control => control.get('abbreviation')?.value?.toLowerCase() === abbr?.toLowerCase());
      if (ind > -1) {
        return ratesArr.get(ind.toString()).get('cost_component');
      }
    }
  };

  for (const [abbr, data] of Object.entries(rates)) {
    if (!data['billable']) continue;
    const abbrKey = (abbr === 'regular') ? 'st' : abbr;
    const costComponent = data['cost_component'];
    if (costComponent && Object.keys(costComponent).length > 0) {
      for (const [code, component] of Object.entries(costComponent)) {
        if (code === 'markup') {
          const markupControl = getRateCC(abbrKey)?.get('markup');
          if (markupControl) {
            markupControl.get('cost_amount')?.setValue(component?.['calculate_amount']);
            markupControl.get('total_amount')?.setValue(component?.['total_amount']);
          }
          continue;
        }
        const rateCC = getRateCC(abbrKey)?.get(code);
        if (rateCC) {
          rateCC.patchValue({
            value: component?.['value'],
            level: component?.['level'],
            type: component?.['type'],
            cost_amount: component?.['calculate_amount'],
            total_amount: component?.['total_amount'],
          });
        }
      }
      updateRateFactor(rateFactors, data['cost_component'], abbr);
    }
  }
}

  fetchOfferForCandidateAllStatus(programId,candidateId, jobId) {
    //This will fetch offer Id even if the user doesn't have permission to view this.(For true own access)
    const url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/offers/external-offer?candidate_id=${candidateId}&all_status=true`;
    return this._http.get(url).pipe(
      map((data) => {
        return data;
      })
    );
  }
}
