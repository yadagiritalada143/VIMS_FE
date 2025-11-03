import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import moment from 'moment';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
const DATE_FORMAT = "YYYY-MM-DD";


@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  mockApi: string;
  constructor(private _http: HttpService,
    private _alert: AlertService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe) {
  }
  baseUrl: string = '/submission-manager';

  get(url) {
    return this._http.get(url);
  }

  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }

  getQualifications(callfromCandidate?) {

    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    const _url = `/configurator/programs/${programId}/qualification-types?active=true&type_all=true`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      if(callfromCandidate){
        return err;
      }
      this._alert.error(errorHandler(err));
    }));
  }
  _getQualiFicationType(id,pageNo=1,name='') {

    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    let _url = `/configurator/programs/${programId}/qualification-types/${id}/qualifications?active=true&limit=25`;

    if (name) {
      _url += `&name=${name}`
    }

    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  getQualificationsDetails(id,qualification_type) {

    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    const _url = `/configurator/programs/${programId}/qualification-types/${qualification_type}/qualifications/${id}`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }
  saveCandidate(payload) {
    const _url = `${this.baseUrl}/candidates`;
    return this.post(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  parseCandidateResume(payload,programID) {
    const _url = `${this.baseUrl}/candidates/resumes/parse?program_id=${programID}`;
    return this.post(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      // this._alert.error(errorHandler(err));
      return err;
    }));
  }

  updateCandidate(id, payload) {
    const _url = `${this.baseUrl}/candidates/${id}`;
    return this.put(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  getCandidateDetail(id , showError?) {
     const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `${this.baseUrl}/candidates/${id}?program_id=${currentProgram?.id}`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      if(showError){
        return err;
      }
      this._alert.error(errorHandler(err));
    }));
  }

  getDuplicateCandidateProfile(vendor_id: string, first_name: string, last_name: string, middle_name: string, email: string, dateOfBirth: Date | undefined, phone_number_int: number){
    let program_id = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `${this.baseUrl}/candidates/duplicate_profiles`;
    const dob = dateOfBirth ? moment(dateOfBirth).format(DATE_FORMAT) : undefined
    const phone_number = phone_number_int.toString()
    return this.post(url, {program_id, vendor_id, first_name, last_name, middle_name, email, dob, phone_number})
    
  }
  
  getCandidateDetailWthMtpMatches(id , showError?) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
   const _url = `${this.baseUrl}/candidates/${id}?program_id=${currentProgram?.id}&master_profile_matches=true`;
   return this.get(_url).pipe(map(res => {
     let data = res;
     if (data) {
       return data;
     } else {
       this._alert.error(`No data found.`);
     }
   }, (err) => {
     if(showError){
       return err;
     }
     this._alert.error(errorHandler(err));
   }));
 }

  getPotenialDuplicateCandidate(jobId){
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    const url = `${this.baseUrl}/programs/${programId}/jobs/${jobId}/duplicate-candidates`;
    return this.get(url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }))
  }

  fetchCandidates(limit = 10, page = 1, k = null) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `${this.baseUrl}/candidates?limit=${limit}&program_id=${currentProgram?.id}&page=${page}${k}`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }
  fetchUniqueId() {
    const _url = `/configurator/candidates/unique-id`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  /**
   * Use this method to encode base64
   * and it returns the promiss.
   * @param filedata
   */

  encodeToBase64(filedata) {

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  }

  getParsedResumeData(fileData) {
    const payload = {
      filename: fileData['name'],
      raw: fileData['raw_without_base64'] ? fileData['raw_without_base64'] : null
    }
    const _url = `/configurator/candidates/resumes/parse`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      },
      err => {
        throw new Error(err);
      }
    ));
  }
  getCurrency() {
    const _url = `/configurator/resources/currencies`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }


  chnageCandidateStatus(param) {

    const candidate_id = param?.candidate_real_id;
    const payload = {
      is_enabled: param.is_enabled ? false : true
    }
    const _url = `${this.baseUrl}/candidates/${candidate_id}`;

    return this.put(_url, payload).pipe(map(data => {
      if (data) {
        return data;
      }
    }, (err) => {
      throw new Error(err);
      // this._alert.error(errorHandler(err));
    }));
  }


  advanceFilter(fileData, page = 1) {
    const payload = {
      "filters": {
        "name": fileData?.name,
        "email": fileData?.email,
        "designation": fileData?.designation,
        "vendor": [],
        "date_range": fileData?.start_date,
        "is_enabled": true,
        "location":fileData?.location,
      },
      pagination: {
        "limit": 10,
        "page": page
      }
    }
    const _url = `/configurator/candidates/advanced-filters`;
    return this.post(_url, payload).pipe(map(
      data => {
        return data;
      },
      err => {
        throw new Error(err);
      }
    ));
  }
  getSubmittedCandidate(limit = 10, page = 1, k = null, programID, jobID, isCandidateScoring?, scoringFactors?) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    programID = currentProgram?.id;
    let _url = `${this.baseUrl}/programs/${programID}/jobs/${jobID}/candidates?limit=${limit}&page=${page}${k}`;
    if(isCandidateScoring) {
      _url+='&'+scoringFactors;
    }
    return this._http.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }));
  }
  getAllCandidateCount(limit = 10, page = 1, k = null, programID, status) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    programID = currentProgram?.id; //'04f00cc1-67ef-435b-884a-654e20587a2a';
    let qry = '?';
    if(status){
     qry = `${qry}status=${status}`
    }
    qry = `${qry}&limit=${limit}&page=${page}`
    const _url = `${this.baseUrl}/programs/${programID}/submissions${qry}${k}`;
    return this._http.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }));
  }
  getLatestTabCount() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const _url = `${this.baseUrl}/programs/${currentProgram?.id}/submissions/stats`;
   return this._http.get(_url).pipe(
     map((data) => {
       return data;
     })
   );
 }

  getAllSubmittedCandidate(limit = 10, page = 1, k = null, programID) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    programID = currentProgram?.id; //'04f00cc1-67ef-435b-884a-654e20587a2a';
    const _url = `${this.baseUrl}/programs/${programID}/submissions?limit=${limit}&page=${page}${k}`;
    return this._http.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }));
  }


  fetchCandidatesJobs(limit = 10, page = 1,candidate_id,status='',programId){
    const _url = `${this.baseUrl}/candidates/${candidate_id}/submissions?limit=${limit}&page=${page}&status=${status}&program_id=${programId}`;
    return this._http.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }));

  }

  searchProgramByName(name, genericSearch: boolean = false) {
    let url = `/configurator/programs?source_user=SELF`;
    if(genericSearch) {
      url += `&k=${name}`;
    } else {
      url += `&name=${name}`;
    }

    return this._http.get(url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      }
    }));
  }
  getuser(user_id){
    const _url = `/profile-manager/users/${user_id}`;
    return this.get(_url).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  getStatus(programId,page){
    const _url = `${this.baseUrl}/programs/${programId}/submissions/status?check=${page}`;
    return this.get(_url).pipe(map(res =>{
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      this._alert.error(errorHandler(err));
    }));
  }

  getCountryShorNameAndCode(country,withflag? :boolean){

    let result:any={};
    let phoneFormat='';
    switch (country) {
    case 'Canada':
      phoneFormat="+12";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/English (Canada).png' width='20px' /> +12";
      }
      result={short_name:"CA",phoneFormat:phoneFormat,country:country}
      break;
    case 'United States':
      phoneFormat="+1";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/us.png' width='20px' /> +1";
      }
      result={short_name:"US",phoneFormat:phoneFormat,country:country}
      break;
    case 'USA':
        phoneFormat="+1";
        if(withflag){
          phoneFormat="<img src='../../../assets/images/flag/us.png' width='20px' /> +1";
        }
        result={short_name:"US",phoneFormat:phoneFormat,country:country}
        break;

    case 'India':
      phoneFormat="+91";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/हिन्दी.png' width='20px' /> +91";
      }
      result={short_name:"IN",phoneFormat:phoneFormat,country:country}
      break;
    }
    return result;
  }

  shortlistCandidate(payload,programID,jobID,showError?){
    const _url = `${this.baseUrl}/programs/${programID}/jobs/${jobID}/candidates/shortlisting`;
    return this.put(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      if(showError){
        return err;
      }
      this._alert.error(errorHandler(err));
    }));
  }

  shortlistReviewCandidate(payload,programID,jobID,showError?){
    const _url = `${this.baseUrl}/programs/${programID}/jobs/${jobID}/candidates/shortlist-review`;
    return this.put(_url, payload).pipe(map(res => {
      let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
    }, (err) => {
      if(showError){
        return err;
      }
      this._alert.error(errorHandler(err));
    }));
  }

  submitScores(url, payload) {
    return this._http.put(url,payload).pipe(
      map((res)=>{
        let data = res;
      if (data) {
        return data;
      } else {
        this._alert.error(`No data found.`);
      }
      })
    )
  }

  updateResume(payload,programId,candidateId){
    const _url = `${this.baseUrl}/candidates/resumes/parse/submission?program_id=${programId}&candidate_id=${candidateId}`;
    return this.post(_url, payload).pipe(map(data => {
      return data;
    }, (err) => {
      return err;
    }));
  }

  deleteResume(programId,candidateId){
    const url =`${this.baseUrl}/candidates/resumes/parse/submission?program_id=${programId}&candidate_id=${candidateId}`;
    return this._http.delete(url).pipe(map(data => {
      return data;
    }, (err) => {
      return err;
    }));
  }
  
  getAssignmentConfig(programId){
    const url = `/configurator/programs/${programId}/config?entity_code=assignment_setting`
    return this.get(url).pipe(
      map((data)=> { return data; })
    )
  }

  getOverlappingAssignment(programId,candidateId,startDate,endDate,existingDateFormat?){
    const url = `/assignment/programs/${programId}/overlapping_assignment/candidate`;
    const defaultDateFormat = existingDateFormat || this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
    startDate = this.datePipe.transform(startDate,DATE_FORMAT,null,null, true,defaultDateFormat);
    endDate = this.datePipe.transform(endDate,DATE_FORMAT,null,null, true,defaultDateFormat)
    const payload = {
      "is_multi_items": false,
      "overlapping_type":"overlapping_assignments",
      "request_action":"create",
      "candidates": [
        {
          "candidate_uuid": candidateId,
          "start_date": startDate,
          "end_date": endDate
        }
      ]
    }

    return new Promise((resolve)=>{
      this.post(url,payload).subscribe({
        next: (res: any) => {
          resolve(res?.data?.candidates?.[0]);
        }, 
        error:(err) => {
          resolve(err?.error?.data?.candidates?.[0]);
        }
      })
    });
  }

}
