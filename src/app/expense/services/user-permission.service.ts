import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { HttpService } from '../../core/services/http.service';
import { ExpenseStatusType } from '../interfaces/expense.interfaces';
import { ExpenseStatusMessage, ExpenseType, UserType } from '../enums/expense.enums';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Injectable({
  providedIn: 'root',
})
export class UserPermissionService {
  private editableStatuses: ExpenseStatusType[] = [
    ExpenseStatusMessage.draft,
    ExpenseStatusMessage.rejected,
    ExpenseStatusMessage.withdrawn,
  ];

  constructor(private storageService: StorageService, public http: HttpService, private authorizationService: AuthorizationService) {
  }

  public currentUserRole(): string {
    return this.storageService.get('user_type');
  }

  public isUserSuperAdmin(): boolean {
    return this.storageService.get('user_type') === 'SUPER_ORG';
  }

  public isUserRole(role: UserType) {
    const currentUserRole = this.currentUserRole();
    if (
      (currentUserRole === UserType.Vendor || currentUserRole === UserType.MSP || currentUserRole === UserType.Super_org) &&
      (role === UserType.Super_org || role === UserType.MSP || role === UserType.Vendor)
    ) {
      return true;
    } else {
      return currentUserRole === role;
    }
  }

  public isExpenseStatusMessagePermited(expenseStatus: ExpenseStatusType, expenseType: ExpenseType) {
    const currentRoleStatuses = [];
    this.editableStatuses.forEach(status => {
      if (
        (status === ExpenseStatusMessage.draft && this.authorizationService.authorize('create_' + expenseType)) ||
        ((status === ExpenseStatusMessage.rejected || status === ExpenseStatusMessage.withdrawn) &&
          this.authorizationService.authorize('update_' + expenseType))
      ) {
        currentRoleStatuses.push(status);
      }
    });
    return currentRoleStatuses.indexOf(expenseStatus) !== -1 ? true : false;
  }

  public userCanModify(expenseStatus: ExpenseStatusType, expenseType: ExpenseType) {
    return expenseStatus === ExpenseStatusMessage.draft && this.authorizationService.authorize('modify_' + expenseType);
  }

  public getUserRoleList() {
    const currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    return this.http.get(`/expense/programs/${currentProgramId}/user-roles`).toPromise();
  }

  public hasPermission(permissionKey:string) {
   return this.authorizationService.authorize(permissionKey);
  }
}
