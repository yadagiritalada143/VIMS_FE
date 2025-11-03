import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { ProgramService } from 'src/app/programs/program.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private sideBarPrompt = new BehaviorSubject('close');
  currentSideBarPrompt = this.sideBarPrompt.asObservable();

  constructor(private httpService: HttpService, private storageService: StorageService, private programService: ProgramService) { }

  public password: any;

  /* validateUserInvitationToken(orgId: string, token: string): Observable<any> {
    return this.httpService.get(`${environment.API_ENDPOINT}/public/organizations/${orgId}/members/invitation/${token}`)
  } */
  setPasswordViaInvitaionToken(orgId: string, token: string, password: string): Observable<any> {
    let data = { "password": password }
    this.password = data.password;
    return this.httpService.put(`/public/organizations/${orgId}/members/invitation/${token}/password-setup/`, data)
  }

  getMembershipDetails(programId, memberId) {
    return this.httpService.get(`/configurator/programs/${programId}/members/${memberId}`);
  }

  sendWelcomeEmail(userId, program_id) {
    let data = {program_id: program_id};
    return this.httpService.post(`/configurator/resend-invite/${userId}`, data);
  }

  sendWelcomeEmailCheck(userId) {
    return this.httpService.get(`/profile-manager/users/${userId}`);
  }

  updateUserDetails(userId: string, userData): Observable<any> {
    return this.httpService.put(`/vms-profile-manager/users/${userId}/`, userData)
  }

  Questions(url): Observable<any> {
    return this.httpService.get(`/public/resources/security-questions`);
  }

  updateQuestion(orgId: string, token: string, userData): Observable<any> {
    return this.httpService.put(`/account-setup/profile-setup?orgId=${orgId}&token=${token}`, userData)
  }


  getAvatar(uuid: any): Observable<any> {
    return this.httpService.get(`/vms-profile-manager/users/avatar/${uuid}`)
  }

  updateAvatar(orgId: string, token: string, userData: any): Observable<any> {
    return this.httpService.put(`/public/organizations/${orgId}/members/invitation/${token}/avatar`, userData)
  }

  uploadMembers(orgId: string, token: string, userData: any): Observable<any> {
    return this.httpService.put(`/public/organizations/${orgId}/members/invitation/${token}/profile-setup`, userData)
  }

  getThemeColor(themeColor: any, orgId: any): Observable<any> {
    return this.httpService.get(`/account-setup/resources/themes`)
  }

  login(data: any): Observable<any> {
    return this.httpService.post(`/authenticate`, data)
  }

  getUser(email: any): Observable<any> {
    return this.httpService.get(`/profile-manager/users?email=${email}`);
  }

  getAllMembers(orgId, pageNo, limit): Observable<any> {
    const id = orgId ? orgId : environment.SIMPLIFY_ORG_ID
    return this.httpService.get(`/profile-manager/organizations/${id}/members?limit=3`);
  }

  getAllPrograms(): Observable<any> {
    return this.httpService.get(`/configurator/programs?source_user=SELF&limit=10`);
  }

  get(url) {
    return this.httpService.get(url);
  }

  put(url, payload) {
    return this.httpService.put(url, payload);
  }
  post(url, data: any): Observable<any> {
    return this.httpService.post(url, data);
  }
  delete(url, payload) {
    return this.httpService.delete(url, payload);
  }

  saveUser(url, data) {
    return this.httpService.post(url, data);
  }

  updateUser(url, data) {
    return this.httpService.put(url, data)
  }

  getAllRoleList(program_req_Id, pageNo, limit, term = null): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID;
    const query = `?ordering=-modified_on&limit=${limit}&page=${pageNo}${term ? ('&k=' + term) : ''}`;
    return this.httpService.get(`/configurator/programs/${id}/roles${query}`);
  }

  getAllOrganizationRoles(orgId, pageNo, limit, term = null): Observable<any> {
    const id = orgId ? orgId : environment.SIMPLIFY_ORG_ID;
    const query = `?limit=${limit}&page=${pageNo}${term ? ('&k=' + term) : ''}`;
    return this.httpService.get(`/configurator/organizations/${id}/roles${query}`);
  }
  getAllCustomFieldsList(program_req_Id, pageNo, limit, entityRef: string,qry?): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID;
    const query = `?limit=${limit}&page=${pageNo}${qry?qry:""}` + (entityRef ? `&entity_ref=${entityRef}` : '');
    return this.httpService.get(`/configurator/programs/${id}/custom-fields${query}`);
  }

  reOrderCustomFieldsList(program_req_Id,payload): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID;
    return this.httpService.put(`/configurator/programs/${id}/custom-fields/meta-data`,payload);
  }

  getAllpicksList(program_req_Id, pageNo, limit): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID;
    const query = `?limit=${limit}&page=${pageNo}`;
    return this.httpService.get(`/configurator/programs/${id}/picklists${query}`);
  }

  getpicksListItems(program_req_Id, picklist_Id, pageNo, limit): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID;
    const query = `?limit=${limit}&page=${pageNo}`;
    return this.httpService.get(`/configurator/programs/${id}/picklists/${picklist_Id}/items${query}`);
  }

  getAllModuleList(program_req_Id): Observable<any> {
    const id = program_req_Id ? program_req_Id : environment.SIMPLIFY_ORG_ID
    return this.httpService.get(`/configurator/programs/${id}/module-groups `);
  }

  getUserByRoleId(programId, roleId, pageNo, limit): Observable<any> {
    const qry = '?limit=' + limit + '&page=' + pageNo + '&role_ids=' + roleId;
    return this.httpService.get(`/configurator/programs/${programId}/members` + qry);
  }

  getAllRecentJobs(program_req_Id, limit, hierarchyIds, jobType): Observable<any> {
    const id = program_req_Id ?? this.storageService.get('PROGRAM_ID');
    const qry = '&job_count=' + limit + (hierarchyIds.length ? '&hierarchies_ids=' + hierarchyIds : '') + 
      (jobType ? `&job_type=${jobType}` : '');
    return this.httpService.get(`/job-manager/programs/${id}/recent-templates?entity_type=template` + qry);
  }

  getAllPopularJobs(program_req_Id, limit, hierarchyIds, jobType): Observable<any> {
    const id = program_req_Id ?? this.storageService.get('PROGRAM_ID');
    const qry = '&job_count=' + limit + (hierarchyIds.length ? '&hierarchies_ids=' + hierarchyIds : '') + 
    (jobType ? `&job_type=${jobType}` : ''); 
    return this.httpService.get(`/job-manager/programs/${id}/popular-templates?entity_type=template` + qry);
  }

  searchTemplate(url): Observable<any> {
    return this.httpService.get(`/job-manager/12345_program/job_template` + url);
  }
  getProgram(url): Observable<any> {
    return this.httpService.get('/configurator/programs' + url);
  }

  getFoundantionalType(program_req_Id): Observable<any> {
    return this.httpService.get(`/configurator/programs/${program_req_Id}/foundational-data-types`);
  }

  setSideBarPrompt(val) {
    this.sideBarPrompt.next(val);
  }

  async checkProgramModification() {
    this.getAllPrograms().subscribe(res => {
      const { programs } = res;
      const programList = this.storageService.get('ProgramList');
      const newPrograms = programs.map(prog => prog.id) || [];
      const oldPrograms = programList.map(prog => prog.id) || [];
      const programsmodified = newPrograms.some(prog => !oldPrograms.includes(prog)) || oldPrograms.some(prog => !newPrograms.includes(prog));
      if (programsmodified) {
        const PROGRAM_ID = this.storageService.get('PROGRAM_ID');
        const hasSelectedProgram = newPrograms.includes(PROGRAM_ID);
        const defaultProgramId = this.storageService.get('DEFAULT_PROGRAM_ID');
        var preferenceList = this.storageService.get('PREFERENCE_LIST');
        if (preferenceList) {
          var defaultProgram = preferenceList.find(p => p.program_id === defaultProgramId);
        }
        if (!hasSelectedProgram && !PROGRAM_ID) {
          if(defaultProgram){
            this.programService.setProgram(defaultProgram.program_id,true);
          }else{
          this.programService.setProgram(programs[0], true);
          }
        }
        this.storageService.set('ProgramList', programs, true);
      }
    })
  }

  getListOfUsersByIds(user_ids, program_id, isDisabledUsersReq?): Observable<any> {
    let query = '?user_ids=' + user_ids;
    if (isDisabledUsersReq) {
      query += '&is_all_users_required=true';
    }
    return this.get(`/configurator/programs/${program_id}/members` + query);
  }





}
