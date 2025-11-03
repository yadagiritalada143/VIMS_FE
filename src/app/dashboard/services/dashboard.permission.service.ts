import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from '../dashboard.enums';

@Injectable({
  providedIn: 'root'
})

export class DashboardPermissionService {
  constructor(
    private storageService: StorageService
  ) { }

  public currentUserRole(): string {
    return this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.organization_category;
  }

  public isUserRole(role: UserType) {
    const currentUserRole = this.currentUserRole();
    if (currentUserRole) {
      if ((currentUserRole === UserType.Vendor || currentUserRole === UserType.MSP || currentUserRole === UserType.Super_org)
        && (role === UserType.Super_org || role === UserType.MSP || role === UserType.Vendor)) {
        return true;
      } else return currentUserRole === role;
    } else return false;
  }
}
