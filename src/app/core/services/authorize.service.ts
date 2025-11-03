import { Injectable } from '@angular/core';
import { StorageService, StorageKeys } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  hideToAdmin = ['view_org_program', 'view_compliance', 'view_vendor_program', 'view_vendor_setup'];
  constructor(private storageService: StorageService) {}

  authorize(permission: string) {
    const user_permission = this.storageService.get(StorageKeys.USER_PERMISSION);
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    if (user?.is_superuser) {
      return this.hideToAdmin.some(p => p === permission) ? false : true;
    }
    if (user_permission !== null && user_permission !== undefined && permission !== undefined) {
      return user_permission.some(p => p === permission);
    }
  }
}
