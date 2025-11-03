export class SubItemModule {
  title: string;
  icon?: string;
  class?: string;
  path?: string;
  permission?: string;
  isNotification: boolean;
  numberOfNotification?: number;
  linkClass?: string;
  params?: string[];
  queryParam?: any = {};
}

export class SideBarSubModule {
  title?: string;
  subMenuItem: SubItemModule[];
}

export class SidebarModule {
  name: string;
  title: string;
  icon: string;
  class?: string;
  path?: string;
  permission: string;
  isSideMenu: boolean;
  closeSubMenu?: SubItemModule;
  isSearch: boolean;
  sideBarSubMenu?: SideBarSubModule[];
  imageUrl?: string;
}
