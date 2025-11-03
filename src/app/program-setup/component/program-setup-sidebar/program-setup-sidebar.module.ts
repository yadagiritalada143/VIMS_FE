export class SubItemModule {
  title: string;
  icon?: string;
  class?: string;
  path?: string;
  isNotification: boolean;
  isSideMenu?: boolean;
  numberOfNotification?: number;
  queryParams?: {[key: string]: string };
}

export class SideBarSubModule {
  title?: string;
  subMenuItem: SubItemModule[];
}

export class ProgramSetupSidebarModule {
  name: string;
  title: string;
  icon: string;
  class?: string;
  path?: string;
  permission: string;
  isSideMenu: boolean;
  closeSubMenu?: SubItemModule;
  isSearch: boolean;
  sideBarSubMenu?: SideBarSubModule[]
}
