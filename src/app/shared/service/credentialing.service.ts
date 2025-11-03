import { Injectable } from '@angular/core';
import { HttpService } from '../../core/services/http.service';
import { Observable, Subject, of } from 'rxjs';
import { UserPermissionService } from '../../expense/services/user-permission.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { Candidate } from '../components/duplicate-candidates/duplicate-candidates.model';
import { GlobalLaunchKeys, GlobalLaunchService } from 'src/app/control-panel/configs/global-launches/global-launch.service';
import { configureCredentialsDecoration, organizationCandidateCredentialsDecoration, rolePermissionsDecoration } from './credentialing.constant';
import { CredentialingPermissions, RoleEvent, RoleEventType } from './credentialing.model';


@Injectable({
  providedIn: 'root',
})
export class CredentialingService {
  // private featureEnabled: boolean;
  private programId: string;
  private rolePermissionEventSubject = new Subject<RoleEvent>();
  public rolePermissionEventObservable$ = this.rolePermissionEventSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private storageService: StorageService,
    private userPermissionService: UserPermissionService,
    private globalLaunchService: GlobalLaunchService,
  ) {
    this.programId = this.storageService.get(StorageKeys?.PROGRAM_ID);
  }

  canViewCredentialing = () => {
    return this.isEnable() && this.hasPermission(CredentialingPermissions.VIEW_CREDENTIALING);
  };

  isEnable = () => {
    return this.featureEnable() && this.globalLaunchFlagEnable();
  };

  private featureEnable = () => {
    return this.storageService.get(StorageKeys?.CURRENT_PROGRAM)?.config?.credentialing 
  }

  globalLaunchFlagEnable = () => {
    return this.globalLaunchService.isglobalLaunchSlugFlagEnabled(GlobalLaunchKeys.CREDENTIALING_MODULE);
  };

  hasPermission = (permissionkey: string): boolean => {
    return this.userPermissionService.hasPermission(permissionkey);
  };

  getClientToken(data: any): Observable<any> {
    const URL = `/configurator/programs/${this.programId}/credentialing/cred_token`;
    return this.httpService.post(URL, {});
  }

  syncCandidate(candidate_id: string): Observable<any> {
    const URL = `/submission-manager/programs/${this.programId}/credentialing/candidate/get-or-sync`;
    return this.httpService.post(URL, { candidate_id });
  }
  sendRoleSyncResult(cred_program_id: string, role_id: string, role_name: string, status: string) {
    const URL = `/configurator/programs/${this.programId}/credentialing/cred_role_status`;
    return this.httpService.post(URL, { cred_program_id, role_id, status, role_name });
  }

  createOrgCredentialDataFromCandidate(candidate: Candidate, token: string) {
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    return this.createOrgCandidateCredentialData(
      user.id,
      `${user.first_name} ${user.last_name}`,
      candidate.linked_cred_candidate_id,
      `${candidate.first_name} ${candidate.last_name}`,
      candidate.email,
      token,
      candidate.linked_cred_program_id,
    );
  }

  createOrgCandidateCredentialData(
    externalUserId: string,
    externalUserName: string,
    candidateId: string,
    name: string,
    email: string,
    token: string,
    groupId: string,
  ) {
    return {
      view: 'OrganizationCandidateCredentials',
      scale: false,
      organizationCandidateCredentialsDecoration,
      data: this.createOrgCandidateData(externalUserId, externalUserName, candidateId, name, email),
      auth: this.createAuth(token, groupId),
    };
  }

  createAddCredentialType(token: string, groupId: string) {
    return {
      view: 'ConfigureCredentials',
      scale: false,
      configureCredentialsDecoration,
      auth: this.createAuth(token, groupId),
    };
  }

  createRolePermissions(token: string, groupId: string, getRole?: string) {
    const data = getRole ? { getRole } : {};
    return {
      view: 'RolePermissions',
      scale: false,
      rolePermissionsDecoration,
      data,
      auth: this.createAuth(token, groupId),
    };
  }

  notifyRoleCreation(name: string) {
    if (this.canViewCredentialing()) this.rolePermissionEventSubject.next({ type: RoleEventType.CREATE_ROLE, name });
  }

  notifyRoleUpdate(name: string, newName: string) {
    if (this.canViewCredentialing()) this.rolePermissionEventSubject.next({ type: RoleEventType.UPDATE_ROLE, name, newName });
  }

  private createAuth(token: string, groupId: string) {
    return { token, groupId };
  }

  private createOrgCandidateData(externalUserId: string, externalUsername: string, candidateId: string, candidateName: string, candidateEmail: string) {
    return {
      externalUserId,
      externalUsername,
      candidateId,
      candidateName,
      candidateEmail,
    };
  }
}
