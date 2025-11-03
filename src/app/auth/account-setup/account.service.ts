import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from 'src/app/core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private httpService: HttpService) { }

  public password: any;

  validateUserInvitationToken(orgId: string, token: string): Observable<any> {
    return this.httpService.get(`/public/organizations/${orgId}/members/invitation/${token}`)
  }
  getGuestUser(userMail) {
    return this.httpService.get(`/public/users/basic-info?k=${userMail}`);
  }
  requestNewInvitationToken(orgId: string, token: string): Observable<any> {
    return this.httpService.post(`/public/organizations/${orgId}/members/invitation/${token}/resend`, {});
  }

  setPasswordViaInvitaionToken(orgId: string, token: string, password: string): Observable<any> {
    let data = { "password": password }
    this.password = data.password;
    return this.httpService.put(`/public/organizations/${orgId}/members/invitation/${token}/password-setup/`, data)
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

  loginViaSSO(data: any): Observable<any> {
    return this.httpService.post(`/authenticate?target=SSO`, data)
  }

  getUser(id: any): Observable<any> {
    return this.httpService.get(`/profile-manager/users/${id}`);
  }

  getProgramMembers(programId, token = undefined) {
    return this.httpService.get(`/configurator/programs/${programId}/members?member_token=${token}`);
  }

  get(url) {
    return this.httpService.get(url);
  }

  updateUser(programId, payLoad) {
    return this.httpService.put(`/configurator/programs/${programId}/invitations/accept`, payLoad);
  }

  resenInvitation(programId, payLoad) {
    return this.httpService.put(`/configurator/programs/${programId}/invitations/regenerate`, payLoad);
  }
}
