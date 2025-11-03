import { Component, OnInit } from '@angular/core';
import { SettingsService } from './settings.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { Router } from '@angular/router';
import { ProgramConfig } from 'src/app/shared/enums';
import { Location } from '@angular/common';
import { UserService } from '../core/services/user.service';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from '../core/components/alert/alert.service';
import { errorHandler } from '../shared/util/error-handler';
import { AuthorizationService } from '../core/services/authorize.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {

  constructor(
    private storageService: StorageService,
    public _settingsService: SettingsService,
    private router: Router,
    private localStorage: StorageService,
    private location: Location,
    private userService: UserService,
    private dialogService: ConfirmationDialogService,
    private alertService: AlertService,
    private authorization: AuthorizationService
  ) {}

  ngOnInit(): void { }

  redirectProgramMenu(subMenu) {

    // Reset search service
    this._settingsService.setSearchParam('');

    if (subMenu.isNotProgram) {
      let url = subMenu.path;
      if (subMenu.params) {
        for (let param of subMenu?.params) {
          const localData = this.storageService.get(param) || '';
          url = url.replace(`{${param}}`, localData);
        }
      }

      if (subMenu?.queryParam) {
        url += '?' + this.serialize(subMenu?.queryParam);
      }
      this.router.navigateByUrl(url);
    } else {
      let vmsData = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      if (
        vmsData.unique_id &&
        !vmsData?.offer_id
      ) {
        this.localStorage.set(ProgramConfig[5], vmsData, true);
        if (subMenu?.path === 'program-setup') {
          this.router.navigate(['/program-setup'], {
            queryParams: {
              programId: vmsData?.unique_id,
              clientId: vmsData?.client?.id,
              program_req_id: vmsData?.id,
              clientName: vmsData.client?.name,
              redirectTo: subMenu?.path,
            },
          });
        } else {
          if (vmsData?.id) {
            let newProgramJson = {
              program_uniqId: vmsData?.unique_id,
              clientId: vmsData?.client?.id,
              program_req_id: vmsData?.id,
              clientName: vmsData.client?.name,
            };
            this.localStorage.set(
              ProgramConfig[0],
              JSON.stringify(newProgramJson),
              true
            );
            this.router.navigateByUrl(subMenu?.path);
          }
        }
      } else {
        this.router.navigateByUrl(subMenu?.path);
      }
    }
  }

  serialize = (obj) => {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

  setSearchParam(event) {
    this._settingsService.setSearchParam(event);
  }

  navigateToPreviousRoute() {
    const stack_num: any = this.location.getState();
    if(stack_num?.navigationId === 1)
      this.router.navigate(['dashboard']);
    else
      this.location.back(); 
  }

  isSuperAdmin() {
    const user_type = this.storageService.get(StorageKeys.USER_TYPE);
    return (user_type === "SUPER_ORG");
  }

  openPurgeDialog() {

    const url = `/configurator/purge-cache`;
    let statement = 'Please select the action for configurator cache';

    this.dialogService.confirm(
      'Configurator Cache', statement,
      'Purge', 'View', 'sm', {
        disableOkButton: false,
        disableCancelButton: true
      })
      .then(res => {
        if (res) {
          this.userService.get(url)
            .toPromise()
            .then(res => {
              this.alertService.success('Configurator cache purged successfully');
            }, err => {
              this.alertService.error(errorHandler(err));
            });
        }
      }).catch(err => {
        console.log(err);
      });

  }

  // Hide condition applied only if specified
  showNavItem(item: any) {
    if(!item.hide) {
      return true;
    }

    return !item?.hide?.();
  }

  showSettingsTitle(item: any) {
    let titlePermission: boolean = this.authorization.authorize(item?.permission);
    if(!titlePermission) {
      return false;
    }

    let count: number = 0;
    let children: Array <any> = item?.sideBarSubMenu || [];
    if(Array.isArray(children)) {
      children.forEach((child: any) => {
        const permission: string = child?.permission || '';
        if(!permission || this.authorization.authorize(permission)) {
          count++;
        }
      })
    }

    return !!count;
  }
}
