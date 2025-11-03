import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { map } from 'rxjs/operators';
import { Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ApprovalsService {
  constructor(private _http: HttpService, private storageService: StorageService) { }
  get(url) {
    return this._http.get(url);
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
  getApprovalsData(approvalUrl: string,) {
    return this.get(approvalUrl).pipe(map(
      data => {
        return data;
      }
    ));
  }

  updateApprover(
    programId: string,
    entityRef: any,
    entityId: string,
    replaceApproverId: string,
    memberId?: string,
    level?: number,
    notes?: any,
    workflow_action?: any,
    approval_chain_id?: any
    ) {
    let url = `/approval/programs/${programId}/${entityRef}/${entityId}/replace-approver?`;
    if (memberId) {
      url = url + `member_id=${memberId}`;
    } else if (level != null) {
      url = url + `level=${level}`;
    }
    const data = {
      replace_approver_id: replaceApproverId,
      workflow_action,
      replace_approver_notes: notes,
    }
    if(approval_chain_id) {
      data['approval_chain_id'] = approval_chain_id;
    }
    return this.put(url, data);
  }
  getListOfUsersByIds(user_ids,isDisabledUsersReq?): Observable<any> {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM)
    let query = '?user_ids=' + user_ids;
    if(isDisabledUsersReq){
    query+="&is_all_users_required=true";
    }
    return this.get(`/configurator/programs/${currentProgram?.id}/members` + query);
  }
}