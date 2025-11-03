import { Component, OnInit } from '@angular/core';
import sideBarOptions from './control-panel-sidebar.config';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-control-panel-sidebar',
  templateUrl: './control-panel-sidebar.component.html',
  styleUrls: ['./control-panel-sidebar.component.scss']
})
export class ControlPanelSidebarComponent implements OnInit {

  public navigationList: Array<any> = [];

  constructor(
    private authorization: AuthorizationService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    sideBarOptions?.forEach(option => {
      const submenuItems = [];
      option?.submenuItem?.forEach(submenu => {
        submenuItems?.push(submenu);
      });
      if (submenuItems?.length) {
        this.navigationList.push({
          name: option?.name,
          icon: option?.icon,
          submenuItem: submenuItems,
          active: true
        });
      }
    });
  }

  toggleSubmenu(navitem: any) {
    navitem.active = !navitem.active;
  }

  conditionalAuthorize(perm: string) {
    return (
      this.isSimplifyUser || 
      this.authorization.authorize(perm)
    );
  }

  get isSimplifyUser() {
    return (this.storage.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }
}
