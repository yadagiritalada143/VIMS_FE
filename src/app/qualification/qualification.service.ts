import { Injectable } from '@angular/core';
import { HttpService } from '../core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class QualificationService {

  constructor(private _http: HttpService) { }

  getSystemQualificationTypeList(programId, limit, pageNo) {
    return this._http.get(`/configurator/programs/${programId}/qualification-types?limit=${limit}&page=${pageNo}&type_all=true`)
  }

  getSystemQualificationList(programId, qualificationTypeId, limit, pageNo,searchTerm=null) {
    return this._http.get(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications?limit=${limit}&page=${pageNo}${searchTerm ? ('&k=' + searchTerm) : ''}`)
  }

  getAdvanceFilterData(programId,qualificationTypeId,payload){
    return this._http.post(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications/advanced-filters`,payload)
  }

}
