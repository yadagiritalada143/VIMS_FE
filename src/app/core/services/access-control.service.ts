import { Injectable } from '@angular/core';
import { StorageService, StorageKeys } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  constructor(private storageService: StorageService) {}

  accessControl() {
    const user_type: string = this.storageService.get(StorageKeys.USER_TYPE);
    return user_type?.toUpperCase() !== 'SUPER_ORG_VIEW';
  }
}
