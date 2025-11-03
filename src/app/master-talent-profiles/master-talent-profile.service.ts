import { Injectable } from '@angular/core';
import { HttpService } from '../core/services/http.service';
import { MasterTalentProfileDetailsRequestParam, MasterTalentProfileListRequestParam, MasterTalentProfileUpdatePayload, UpdateLinkMasterProfilePayload, WorkerCandidateDetailsParam } from './model/mtp.model';
import { GlobalLaunchKeys, GlobalLaunchService } from '../control-panel/configs/global-launches/global-launch.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { UserPermissionService } from '../expense/services/user-permission.service';

@Injectable({
  providedIn: 'root',
})
export class MasterTalentProfileService {
  constructor(
    private httpService: HttpService,
    private globalLaunchService: GlobalLaunchService,
    private storageService: StorageService,
    private userPermissionService: UserPermissionService,
  ) {}

  getMasterTalentProfiles = (request: MasterTalentProfileListRequestParam) => {
    const URL = this.getMasterTalentPRofilesURL(request);
    return this.httpService.get(URL);
  };

  getMasterTalentProfileDetails = (request: MasterTalentProfileDetailsRequestParam) => {
    const URL = `/submission-manager/programs/${request.programId}/master-talent-profiles/${request.mtpId}`;
    return this.httpService.get(URL);
  };

  updateMasterTalentProfile = (request: MasterTalentProfileDetailsRequestParam, payload: MasterTalentProfileUpdatePayload) => {
    const URL =  `/submission-manager/programs/${request.programId}/master-talent-profiles/${request.mtpId}`
    return this.httpService.put(URL,payload)
  }

  getPendingMTPLinkingCandidates= (program_id:string,limit:number = 1) => {
    const URL =  `/submission-manager/candidates?program_id=${program_id}&pending_profile_linking=true&limit=${limit}`
    return this.httpService.get(URL)
  }

  deleteMasterProfile = (request: MasterTalentProfileDetailsRequestParam) => {
    const URL =  `/submission-manager/programs/${request.programId}/master-talent-profiles/${request.mtpId}`
    return this.httpService.delete(URL)
  }

  updateLinkMasterProfile = (candidateId : string , payload:UpdateLinkMasterProfilePayload) =>{
    const URL = `/submission-manager/candidates/${candidateId}/link_to_master_profile`
    return this.httpService.post(URL,payload)
  }

  getCandidateWorkerDetails = (request: WorkerCandidateDetailsParam) => {
    const URL = `/assignment/programs/${request.programId}/assignment/candidate/${request.candidateId}`;
    return this.httpService.get(URL);
  };
  private getMasterTalentPRofilesURL = (request: MasterTalentProfileListRequestParam) => {
    let url = `/submission-manager/programs/${request.programId}/master-talent-profiles`;
    url += '?page=' + (request.page && request.page > 0 ? request.page : 1);
    if (request.unique_id) url += '&unique_id=' + request.unique_id;
    if (request.talent_name) url += '&talent_name=' + request.talent_name;
    if (request.modified_on) url += '&modified_on=' + request.modified_on;
    if (request.linked_profiles >=0) url += '&profile_count=' + request.linked_profiles;
    if (request.jobs_count >=0) url += '&job_count=' + request.jobs_count;
    if (request.assignment_count >=0) url += '&assignment_count=' + request.assignment_count;
    if (request.do_not_rehire != undefined) url += '&do_not_rehire=' + request.do_not_rehire;
    url += '&limit=' + (request.limit > 0 ? request.limit : 10);
    return url;
  };

  hasPermission = (permissionkey: string): boolean => {
    return (
      this.moduleEnabled() &&
      this.featureEnabled() &&
      this.userPermissionService.hasPermission(permissionkey)
    );
  };

  moduleAndFeatureEnabled = () : boolean => {
    return this.featureEnabled() && this.moduleEnabled();
  }

  featureEnabled = (): boolean => {
    return this.globalLaunchService.isglobalLaunchSlugFlagEnabled(GlobalLaunchKeys.MASTER_TALENT_PROFILE_MODULE)
  }

  moduleEnabled = (): boolean => {
    const module_groups: Array<any> = this.storageService.get(StorageKeys?.CURRENT_PROGRAM)?.module_groups;
    if (module_groups?.length > 0) {
      return module_groups.find(
        module => module.name?.toLowerCase() === 'Master Talent Profile'.toLowerCase(),
      )?.is_enabled;
    }
    return false;
  };
}




