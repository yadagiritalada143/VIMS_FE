import { TestBed } from '@angular/core/testing';

import { CredentialingService } from './credentialing.service';
import { HttpClientModule } from '@angular/common/http';
import { StorageKeys } from 'src/app/core/services/storage.service';
import { GlobalLaunchKeys } from 'src/app/control-panel/configs/global-launches/global-launch.service';
import { RoleEventType } from './credentialing.model';

describe('CredentialingService', () => {
  let service: CredentialingService;

  interface LocalStorageStub {
    current_program?: any;
    global_launch_config?: any;
    user_permission?: any;
    current_user?: any;
  }

  function setLocalStorage({
    current_program,
    global_launch_config,
    user_permission,
    current_user,
  }: LocalStorageStub = {}) {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      switch (key) {
        case StorageKeys.CURRENT_PROGRAM:
          return JSON.stringify(current_program || { config: { credentialing: true } });
        case StorageKeys.GLOBAL_LAUNCH_CONFIG:
          return JSON.stringify(global_launch_config || [{ slug: GlobalLaunchKeys.CREDENTIALING_MODULE, is_enabled: true }]);
        case StorageKeys.USER_PERMISSION:
          return JSON.stringify(user_permission || ['view_credentialing']);
        case StorageKeys.CURRENT_USER:
          return JSON.stringify(current_user || { is_superuser: false });
        default:
          return undefined;
      }
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientModule] });
    service = TestBed.inject(CredentialingService);
  });

  afterEach(() => {
    // Restore original localStorage behavior (optional)
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('featureEnable function', () => {
    it('should return true when feature is enabled', () => {
      setLocalStorage();
      expect(service.isEnable()).toBeTruthy();
    });

    it('should return false when credentialing is not enabled', () => {
      setLocalStorage({ current_program: { config: { credentialing: false } } });
      service = TestBed.inject(CredentialingService);
      expect(service.isEnable()).toBeFalsy();
    });

    it('should return false when no permission', () => {
      setLocalStorage({ current_program: null, global_launch_config: [] });
      expect(service.isEnable()).toBeFalsy();
    });

    it('should return false when program config is null', () => {
      setLocalStorage({ current_program: null, global_launch_config: [] });
      expect(service.isEnable()).toBeFalsy();
    });
  });

  describe('check global launch flag function', () => {
    it('should return true when GLF is enable', () => {
      setLocalStorage({ global_launch_config: [{ slug: GlobalLaunchKeys.CREDENTIALING_MODULE, is_enabled: true }] });
      expect(service.globalLaunchFlagEnable()).toBeTruthy();
    });

    it('should return false when GLF is disable', () => {
      setLocalStorage({ global_launch_config: [{ slug: GlobalLaunchKeys.CREDENTIALING_MODULE, is_enabled: false }] });
      expect(service.globalLaunchFlagEnable()).toBeFalsy();
    });
  });

  describe('canViewCredentialing function', () => {
    it('should return true when you have view permission and feature enabled', () => {
      setLocalStorage();
      expect(service.canViewCredentialing()).toBeTruthy();
    });

    it('should return false if you dun have view_permission', () => {
      setLocalStorage({ user_permission: [] });
      expect(service.canViewCredentialing()).toBeFalsy();
    });
  });

  describe('notifyRoleCreate function', () => {
    it('should not fire an event in the observable, if no permission', done => {
      setLocalStorage({ current_program: { '': '' } });
      service.rolePermissionEventObservable$.subscribe(result => {
        console.log(result);
        fail();
      });
      service.notifyRoleCreation('');
      setTimeout(() => {
        done();
      }, 1000);
    });

    it('should fire an event in the observable, if we have the permission', done => {
      setLocalStorage();
      service.rolePermissionEventObservable$.subscribe(result => {
        expect(result).toEqual({ name: '', type: RoleEventType.CREATE_ROLE });
        done();
      });
      service.notifyRoleCreation('');
    });
  });

  describe('notifyRoleUpdate function', () => {
    it('should fire an event in the observable, if we have the permission', done => {
      setLocalStorage();
      service.rolePermissionEventObservable$.subscribe(result => {
        expect(result).toEqual({ name: '', newName: '', type: RoleEventType.UPDATE_ROLE });
        done();
      });
      service.notifyRoleUpdate('', '');
    });
  });
});
