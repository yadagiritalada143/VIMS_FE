import { Component, EventEmitter, Injector, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged, forkJoin, interval, map, of, switchMap, takeUntil } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service'
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { TitleCasePipe } from '@angular/common';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UsersType } from 'src/app/shared/enums';
import { GlobalLaunchService } from 'src/app/control-panel/configs/global-launches/global-launch.service';
import { IRolePermissionResp, Widget } from 'src/app/shared/credentialing-iframe/credentialing-iframe.model';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

type Query = { term: string, page: number };

@Component({
  selector: 'app-create-role',
  templateUrl: './create-role.component.html',
  styleUrls: ['./create-role.component.scss']
})
export class CreateRoleComponent implements OnInit, OnDestroy {

  private id: string = '';
  private subscriptions: Subscription[] = [];
  private permissionMap: Map<string, string> = new Map<string, string>();

  @Input() createRole: ('visible' | 'hidden') = "visible";
  public title: string = "Add User Roles";
  public buttonTitle: string = "Continue";
  public visibleModuleIndex: number = 0;
  public initial: boolean = true;

  public _role: any = {
    name: '',
    is_enabled: true,
    organization_category: null,
    additional_delegation_roles: [],
  };
  initialSelectedPermissions = []
  public permissionData: any = {};
  public isViewMode: boolean = false;
  public moduleGroup: Array<any> = [];
  public permissions: Array<any> = [];
  public enabledModules: Array<any> = [];
  public userRoles: Array<any> = [];
  public generalData:any;
  public tabIndex: number = 0;
  public toggle: any = {
    title: 'on',
    value: true
  };

  public defaultAccessValue: string;
  public isViewClicked: boolean = false;

  public prevDelegateQuery: Query = null;
  public delegatesLoading: boolean = false;
  public delegatesCount: number = Number.POSITIVE_INFINITY;
  public delegationSub: Subject <Query> = new Subject <Query> ();

  public disableRoleEditExceptPermissions = false; // only_permissions_editable
  public widgetType: string = Widget.CONFIGURE_ROLE_PERMISSIONS
  public showWidget: boolean = false;

  @Input() public client_or_admin: boolean = false;
  @Input() public list_or_create: boolean = false;
  @Output() public onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  roleParam = { roleName: ""};
  isRoleSynced: boolean = false;
  credRoleId: string;
  credRoleName: string;

  iframeStyle: any = {
    border: 'none',
    height: '100vh',
    width: '100%'
  }

  constructor(
    private programService: ProgramService,
    private _storageService: StorageService,
    private _alertService: AlertService,
    private eventStream: EventStreamService,
    private _loader: LoaderService,
    private router: Router,
    private titlecase: TitleCasePipe,
    private sortPipe: SortHelperPipe,
    private injector: Injector,
    private credentialingService: CredentialingService,
  ) { }

  ngOnInit(): void {

    this.getProgramModuleList();
   // this.searchRoles({ term: '' })
    // Create User Role
    this.subscriptions.push(
      this.eventStream.on(Events.ROLE_CREATE)
      .subscribe((flag: boolean = true) => {
        if(flag) {
          this.tabIndex = 0;
          this.isViewMode = false;
          this.createRole = "visible";
          this.title = 'Add User Role';
          this.visibleModuleIndex = 0;
          this.permissionData = {};
          this.disableRoleEditExceptPermissions = false;
          this.roleParam = {roleName: ""} // trick to force child reload
          this.processGroupData()
          this.onClickModule(this.moduleGroup);
        }
      })
    );

    this.subscriptions.push(this.eventStream.on(Events.ROLE_EDIT)
    .subscribe((data) => {
      this.isViewMode = false;
      this.title = 'Edit User Role';
      this.updateSidePanel(data);
    }));

    this.subscriptions.push(this.eventStream.on(Events.EDIT_ROLE)
    .subscribe((data) => {
      this.isViewMode = false;
      this.title = 'Edit User Role';
      this.updateSidePanel(data);
    }));

    this.subscriptions.push(this.eventStream.on(Events.VIEW_USER_ROLE)
    .subscribe((data: any) => {
      this.isViewMode = true;
      this.title = 'View User Role';
      this.updateSidePanel(data);
    }));

    this.subscriptions.push(this.eventStream.on(Events.ROLE_VIEW_USER)
    .subscribe((data: any) => {
      this.isViewMode = true;
      this.title = 'View User Role';
      this.updateSidePanel(data);
    }));

    // Disable User Role
    this.subscriptions.push(
      this.eventStream.on(Events.ROLE_DISABLE).subscribe((data: any) => {
        if (data?.id) {

          const url: string = `/configurator/programs/${this.programId}/roles/${data.id}`;
          const payload: any = {
            'is_enabled': !data?.is_enabled
          };

          this.programService.put(url, payload).subscribe({
            next: (res: any) => {
              if (res) {
                this._loader.hide();
                this._alertService.success(`User Role ${!data.is_enabled ? 'enabled' : 'disabled'} successfully`);
                data.is_enabled = !data.is_enabled;
                this.sidebarClose();
              }
            }, error: (err: Error | any) => {
              this._alertService.error(errorHandler(err));
              this._loader.hide();
            }
          });
        }
      })
    );

    // Delete User Role
    this.subscriptions.push(
      this.eventStream.on(Events.ROLE_DELETE).subscribe((data: any) => {
        if (data?.id) {
          this._loader.show();
          this.programService.delete(`/configurator/programs/${this.programId}/roles/${data.id}`)
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this._loader.hide();
                  this._alertService.success(`User role deleted successfully`);
                  this.eventStream.emit(new EmitEvent(Events.ROLE_LIST_REFRESH, true));
                }
              }, error: (error: Error | any) => {
                this._loader.hide();
                this._alertService.error(errorHandler(error));
              }
            }
          )
        }
      })
    );

    // User Role delegation search
    this.subscriptions.push(
      this.delegationSub.pipe(
        debounceTime(500),
        distinctUntilChanged((prev: Query, next: Query) => {
          return (
            (prev?.page === next?.page) &&
            (prev?.term === next?.term)
          )
        }),
        switchMap(({ term = "", page = 1 }) => {

          let programId: string = this._storageService.get(StorageKeys.PROGRAM_ID);
          let url: string = `/configurator/programs/${programId}/roles?status=true&page=${page}&org_category=CLIENT,MSP&limit=10`;
          if(term) {
            url += `&k=${term}`;
          }

          this.delegatesLoading = true;
          this.prevDelegateQuery = { term, page };
          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (res: any) => {
          const data: any = res?.[0] || {};
          const page: number = res?.[1] || 1;

          let result: Array <any> =  data?.roles || [];
          this.delegatesCount = data?.total_records || 0;
          if (page === 1) {
            this.userRoles = result;
          } else {
            this.userRoles = [ ...result, ...this.userRoles ];
          }

          this.delegatesLoading = false;
        }, error: (err: any | Error) => {
          console.error(err);
          this.delegatesLoading = false;
          this._alertService.error(errorHandler(err));
        }
      })
    );
    // show credentialing widget
    this.showWidget = this.credentialingService.canViewCredentialing()
  }

  updateSidePanel(data: any) {

    this.id = data?.id;
    this.createRole = "visible";
    this.initialSelectedPermissions = data.permissions.map(x => x.id)
    this.defaultAccessValue = data?.access;
    this._role.access = this.defaultAccessValue;
    this.disableRoleEditExceptPermissions =  data?.only_permissions_editable || false;

    if (!data?.is_enabled) {
      this.toggle.value = false;
      this.toggle.title = 'off';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'on';
    }

    this.tabIndex = 0;
    this._role.name = data?.name;
    this.roleParam = {roleName: data?.name} // trick to force child reload
    this.isRoleSynced = !!data?.credentialing_sync_status
    this._role.is_enabled = this.toggle.value;
    this._role.organization_category = data?.organization_category;
    this.userRoles = [ ...this.userRoles, ...data?.additional_user_role_list ];
    this._role.additional_delegation_roles = data?.additional_user_role_list?.map((role:any) => {return role?.id} );
    this.initializeDelegationEntries(data?.additional_user_role_list);
    this.visibleModuleIndex = 0;

    // Modules
    if(Array.isArray(data?.module_groups)) {
      let active_modules: Array <string> = data.module_groups.map((group: any) => group?.id);
      this.moduleGroup.forEach((entry: any) => {
        if(active_modules.includes(entry?.id)) {
          entry.is_enabled = true;
        }
      });
      this.processGroupData()
      this.onClickModule(this.moduleGroup);
    }

    // Permissions
    this.permissionData = {};
    this.permissions = this.validDataPermissions(data?.permissions ?? []);
    this.setPermissionData(_.cloneDeep(this.permissions));
  }

  // Add only valid permissions (present in module groups)
  validDataPermissions(permissions: Array <any>): Array <any> {
    let allModules: Array <any> = this.moduleGroup.reduce((acc: Array <any>, curr: any) => [...acc, ...(curr?.modules ?? [])], []);
    let allPermissions: Array <any> = allModules.reduce((acc: Array <any>, curr: any) => [...acc, ...(curr?.permissions ?? [])], [])?.map((perm => perm?.id));
    if(this.generalData){
      allPermissions =[...allPermissions,...this.generalData?.permissions?.map(m=>m.id)]
    }

    return permissions.filter((perm: any) => allPermissions.includes(perm?.id));
  }

  setAccessValue(e) {
    if (!!e && e.target.checked) {
      this.defaultAccessValue = e.target.value;
      this._role.access = this.defaultAccessValue;
    }
    if (e == null) {
      this.defaultAccessValue = null;
      this._role.access = '';
    }
  }

  is_valid(str) {
    this._role.name = this._role.name?.replace(/[^a-zA-Z0-9 ]/g, "");
    return str === null || str?.match(/^\s*$/) !== null ;
  }

  orgCategoryChange(){
    if(this._role?.organization_category == 'CLIENT'){
      this._role.additional_delegation_roles = [];
    }
  }

  processGroupData() {
    this.moduleGroup.forEach((entry: any) => {
      if (entry.name === "Credentialing"){
        entry.overrideEmptyPermission = true // since credentialing dont have permission
        entry.is_enabled = this.credentialingService.isEnable() && entry.is_hidden
      }else if(entry.is_hidden){
        entry.is_enabled = true
      }
    });
  }

  onSave() {
    const module_groups = this.moduleGroup.map(fg => ({ id: fg.id, is_enabled: fg.is_enabled }));
    let allPrermission = this.moduleGroup.filter(x => x.is_enabled == false).map(m => m.modules).filter((p) =>p.length > 0)
    let allfalsepermission = []
    for(var i=0;i<allPrermission.length;i++){
      for(var x in allPrermission[i]){
        allfalsepermission = [...allfalsepermission, ...allPrermission[i][x].permissions]
      }
    }
    allfalsepermission = allfalsepermission.map(x => x.id)
    // let newConfigModule:any = this.enabledModules.filter(e=>e.name == "Configuration")
    // if(newConfigModule.length > 0){
    //   let viewManageModule = newConfigModule[0].modules.filter(f=>f.code == "CONFIGURATOR_VIEW_MANAGE")
    //   let viewPermissions = this.permissionData[viewManageModule[0].id].permissions.filter(f=>f.is_enabled && f.permission_group != 'OTHER PERMISSIONS')
    //   if(viewPermissions.length > 0){
    //     let configuratorModule = newConfigModule[0].modules.filter(f=>f.code == "CONFIGURATOR")
    //     let menuSelfConfigId = configuratorModule[0].permissions.filter(f=>f.label == "Menu Self Configuration")
    //     if(configuratorModule.length > 0 && menuSelfConfigId.length > 0){
    //       let permissionModule = this.permissionData[configuratorModule[0]?.id];
    //       if(permissionModule){
    //         let index = this.permissionData[configuratorModule[0].id].permissions.findIndex((p: any) => (p?.id == menuSelfConfigId[0].id));
    //         if(index != -1){
    //           this.permissionData[configuratorModule[0].id].permissions[index].is_enabled = true
    //         }
    //       }

    //     }

    //   }

    // }


    let permission = this.getPermisions(this.permissionData);
    permission = [...new Set(permission)];
    let removedPermissions =
    [...this.initialSelectedPermissions.filter(d => !permission.includes(d)), ...permission.filter(d => allfalsepermission.includes(d))]
    let newPermissions = [];
    permission = permission.filter(d => !removedPermissions.includes(d));

    permission.forEach((item: string) => {
      const p = new Object();
      p[item] = true;
      newPermissions.push(p);
    });

    removedPermissions.forEach((item: string) => {
      const p = new Object();
      p[item] = false;
      newPermissions.push(p);
    });

    const payload = {
      name: this._role.name,
      organization_category: this._role.organization_category,
      access: this._role.access,
      is_enabled: this._role.is_enabled,
      additional_user_role_list: (this._role?.organization_category?.toLowerCase() == UsersType?.CLIENT?.toLowerCase() || this._role?.organization_category?.toLowerCase() == UsersType?.MSP?.toLowerCase() ) ? this._role.additional_delegation_roles : null,
      module_groups,
      permissions: [...new Set(newPermissions)]
    };
    this.roleSave(payload);
    this.permissions = [];
  }

  roleSave(payload) {

    if(!this.isPermissionSelected(payload?.permissions)) {
      this._alertService.error('Please select atleast one permission to create user role');
      return;
    }

    this._loader.show();
    const url = this.id ? `/configurator/programs/${this.programId}/roles/${this.id}` : `/configurator/programs/${this.programId}/roles`;
    this.id ?
      this.subscriptions.push(this.programService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.upsertCredentialingRole(this.id, this.roleParam?.roleName, payload.name)
              this.sidebarClose();
              this._alertService.success(`User Role has been updated successfully`, {
                color: 'white',
                bgColor: 'lightgreen',
              });
              this.eventStream.emit(new EmitEvent(Events.ROLE_LIST_REFRESH, true));
              this._loader.hide();
            }
          }, error: (err: any) => {
            this._loader.hide();
            this._alertService.error(errorHandler(err));
          }
        }
        )
      ) : this.subscriptions.push(this.programService.post(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.createCredentialingRole(data.id, payload.name)
              this.sidebarClose();
              this._alertService.success(`User Role has been created successfully`, {
                color: 'white',
                bgColor: 'lightgreen',
              });
              this.eventStream.emit(new EmitEvent(Events.ROLE_LIST_REFRESH, true));
            }
            this._loader.hide();
          }, error: (err: Error | any) => {
            this._loader.hide()
            this._alertService.error(errorHandler(err));
          }
        })
      );
  }

  createCredentialingRole(id: string, name: string){
    this.credRoleId = id
    this.credRoleName = name
    if(this.showWidget){
      this.credentialingService.notifyRoleCreation(name)
    }
  }

  upsertCredentialingRole(id: string, name: string, newName: string){
    this.credRoleId = id
    this.credRoleName = newName || name
    if(this.showWidget){
      if (this.isRoleSynced)
        this.credentialingService.notifyRoleUpdate(name, newName)
      else
        this.credentialingService.notifyRoleCreation(newName)

    }
  }

  onRoleChanged = (resp: IRolePermissionResp, context: any) => {
    // we always update credRoleId, credRoleName before saved
    const {credProgramId} = context
    const roleId = this.credRoleId
    const roleName = this.credRoleName
    // it may have duplicate call with empty payload, here is a deduplication
    if(roleId !== "" && roleName !== "" && this.credentialingService.isEnable()) {
      this.credentialingService.sendRoleSyncResult(credProgramId, roleId, roleName, resp.status === "success" ? "COMPLETED" : "FAILED")
      .subscribe({error: (err)=>{
            this._alertService.error(errorHandler(err));
      }})
    }
    // reset the field so we dun have polluted state
    this.isRoleSynced = false
    this.credRoleId = ''
    this.credRoleName = ''
  }

  onContinue() {
    this.tabIndex ? this.onSave() : (this.tabIndex++, !!this.id ? this.buttonTitle = "Update" : this.buttonTitle = "Save");
  }

  onIndexChange(index: number) {
    this.tabIndex = index;
    if(!index) {
      this.buttonTitle = "Continue";
    } else if(this.id) {
      this.buttonTitle = 'Update';
    } else {
      this.buttonTitle = 'Save';
    }
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'off';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'on';
    }
    this._role.is_enabled = this.toggle.value;
  }

  onCancel(event = null) {
    event ? event.preventDefault() : null;
    this._role.access = '';
    this.setAccessValue(null);
    this._role.name = '';
    this.toggle.value = true;
    this.toggle.title = 'on';
    this.id = '';
    this._role.organization_category = null;
    this.buttonTitle = "Continue";
    this.isViewMode = false;
    this.moduleGroup.forEach(module => module.is_enabled = false);
    this.tabIndex = 0;
    // if(!this.client_or_admin && !this.list_or_create) {
    this.createRole = "hidden";
    this.title = 'Add User Roles';
    // } // else if(this.client_or_admin) {
    //   this.router.navigateByUrl('/program-setup');
    // } else {
    //   this.router.navigateByUrl('/user-management');
    // }
  }

  sidebarClose() {
    this.createRole = "hidden";
    this.generalData?.permissions?.forEach(element => {
      element.is_enabled = false
    });
    let generalIndex = this.configViewGroup.findIndex((group: any) => (group?.name == 'General'));
    if(generalIndex == -1 && this.generalData){
      this.configViewGroup.push(this.generalData)
    }

    let index = this.enabledModules.findIndex((group: any) => (group?.name == 'General'));
    if(index > -1){this.enabledModules.splice(index, 1)};
    // this.isViewMode = false;
    this.onClose.emit(true);
    this.onCancel();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  getProgramModuleList() {
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${this.programId}/module-groups`)
      .pipe(
        map((data:any)=>{
          data.module_groups = data.module_groups.filter(grp => !this.modulesToHide.includes(grp.name))
          return data;
        })
      )
        .subscribe({
          next: (data: any) => {
            if (Array.isArray(data?.module_groups)) {
              this.moduleGroup = data.module_groups.map((group: any) => {
                return { ...group, is_enabled: false, hide: false }
              });

              const configuratorIndex: number = this.moduleGroup.findIndex((group: any) => (group?.name?.toUpperCase() === 'CONFIGURATION'));
              if (configuratorIndex >= 0) {
                let modules: any = this.moduleGroup[configuratorIndex].modules || [];
                const configViewManageIndex: number = modules.findIndex((module: any) => (module.code === 'CONFIGURATOR_VIEW_MANAGE'));
                if (configViewManageIndex >= 0) {
                  let permissions: any = modules[configViewManageIndex]?.permissions || [];
                  permissions = permissions.map((perm: any, it: number) => {
                    return {
                      ...perm, it: it
                    };
                  })

                  this.constructConfigViewPermissions(permissions);
                }
              }
            }
          }, error: (error: Error | any) => {
            this._alertService.error(errorHandler(error));
          }
      })
    );
  }

  onClickActiveModule(i) {
    this.visibleModuleIndex = i;
  }

  onClickModule(e) {
    this.enabledModules = this.moduleGroup.map(entry=> {
      const received_module = e.find(ele=> ele.id == entry.id)
      if (received_module) {
        entry.is_enabled = received_module?.is_enabled
      }
      return entry
    }).filter(m=>m?.is_enabled)
    let configModule:any = this.enabledModules.filter(f=>f.name == "Configuration")
    if(configModule.length > 0){
      let index = this.configViewGroup.findIndex((group: any) => (group?.name == 'General'));
      if(index > -1){
        this.generalData = this.generalData || this.configViewGroup[index]
        this.generalData.permissions.forEach((element, index) => {
          element.it = index;
        });
        this.enabledModules.unshift({name: "General",modules:[{
          id:'general',
          name: "General",
          permissions : this.generalData.permissions
        }]})
        this.configViewGroup.splice(index, 1);
      }else if(this.generalData)
      {
        this.enabledModules.unshift({name: "General",modules:[{
          id:'general',
          name: "General",
          permissions : this.generalData.permissions
        }]})
      }


    }else{
      this.generalData?.permissions?.forEach(element => {
        element.is_enabled = false
      });
      let generalIndex = this.configViewGroup.findIndex((group: any) => (group?.name == 'General'));
      if(generalIndex == -1 && this.generalData){
        this.configViewGroup.push(this.generalData)
      }

      let index = this.enabledModules.findIndex((group: any) => (group?.name == 'General'));
      if(index > -1){this.enabledModules.splice(index, 1)};
    }
  }

  getPermisions(data: object) {
    let permissionSet: Array <any> = Object.values(data ?? {}).reduce((pv: any, cv: any) => [...pv, ...(cv?.permissions ?? [])], []);
    this.generatePermissionMap(permissionSet);
    return permissionSet.reduce((pv: any, cv: any) => (cv?.is_enabled ? [...pv, cv?.id] : pv), []);
  }

  generatePermissionMap(data: any) {
    this.permissionMap.clear();
    if(Array.isArray(data)) {
      data.forEach((perm: any) => {
        if(perm?.id && perm?.slug) {
          this.permissionMap.set(perm?.id, perm?.slug);
        }
      })
    }
  }

  setPermissionData(permissionArr = []) {
    const temp_permissionData = {};
    let moduleArr = this.enabledModules.reduce((prev, curr) => [...prev, ...curr.modules], []);
    permissionArr = permissionArr.reduce((prev, currV) => [...prev, currV.id], []);
    let generalModule = moduleArr.filter(f=>f.name == "General");
    let generalPermissions:[] = generalModule[0]?.permissions?.map(m=>m.id) || [];
    let configviewManageIndex = moduleArr.findIndex((m: any) => (m?.code === 'CONFIGURATOR_VIEW_MANAGE'));
    for(let i=0;i<generalPermissions.length;i++){
      let findIndex =  moduleArr[configviewManageIndex].permissions.findIndex((p: any) => (p.id == generalPermissions[i]));
      if(findIndex > -1){
        moduleArr[configviewManageIndex].permissions.splice(findIndex,1)
      }

    }

    moduleArr.forEach(element => {
      if (element.permissions && element.permissions.length) {
        let _id = element.id;
        let selectedCount = 0;
        let data = {
          isActive: false,
          is_enabled: element.is_enabled || false,
          selectedAll: false,
          permissions: []
        }

        element.permissions.forEach(permission => {
          let _id = permission.id;
          if (permissionArr.includes(_id)) {
            selectedCount++;
            data.isActive = true;
            permission.is_enabled = true
          }
          else {
            permission.is_enabled = false
          }
        });

        data.permissions = element.permissions;
        data.selectedAll = data.permissions.length === selectedCount;
        temp_permissionData[_id] = data;
      }
      return temp_permissionData;
    });
    this.permissionData = temp_permissionData;
  }

  preventParentCleck(event) {
    event.stopPropagation();
  }

  togglePermission(id: string, flag: boolean) {
    this.permissionData[id].is_enabled = flag;
  }

  selectAllPermissions(id: string, event) {
    event.stopPropagation();
    event.preventDefault();

    let permissionData: any = this.permissionData[id] ?? {};
    (permissionData?.permissions ?? []).forEach((perm: any) => {
        perm['is_enabled'] = !permissionData.selectedAll;
    });

    if(permissionData) {
      permissionData.selectedAll = !permissionData.selectedAll;
    }
  }
  checkPermissionSelected(id: string, permissionId: string) {
    let module = this.permissionData[id];
    let permission = module?.permissions?.filter(f=>f.id == permissionId)[0];
    return permission?.is_enabled || false
  }
  permissionCheckBoxHandler(id: string, permissionId: string) {
    let module = this.permissionData[id];
    let permission = module.permissions.filter(f=>f.id == permissionId)[0];
    permission.is_enabled = !permission.is_enabled;
    let newSlug = permission.slug;
    if(newSlug.includes('manage')){
      newSlug = newSlug.replace('manage','view');
      let permissionIndex = -1;
      module.permissions.forEach((permission: any, index: any) => {if(permission.slug==newSlug) {permissionIndex=index;} });
      if(permissionIndex != -1)
        this.permissionData[id].permissions[permissionIndex].is_enabled = true;
    }

    else if(newSlug.includes('_view')) {
      if(!permission?.is_enabled) {
        newSlug = newSlug.replace('view','manage');
        let permissionIndex = -1;
        module.permissions.forEach((permission: any, index: any) => {if(permission.slug==newSlug) {permissionIndex=index;} });
        if(permissionIndex != -1)
          this.permissionData[id].permissions[permissionIndex].is_enabled = false;
      }
    }

    //Select All
    let f = module.permissions.find(elm => !elm.is_enabled);
    module.selectedAll = f ? false : true;
  }

  setPermissionModule(module: any) {
    let { id, permissions = [] } = module;
    let permissionData = this.permissionData;
    let existModule = permissionData[id];

    if (existModule) {
      existModule.isActive = !existModule.isActive
    }
    else {
      if (permissions.length) {
        permissions = permissions.map(permission => ({ ...permission, 'is_enabled': false }));
      }
      const data = {
        isActive: true,
        is_enabled: false,
        selectedAll: false,
        permissions
      }
      permissionData[id] = data
    }
  }

  get customRolePage() {
    return this.router.url.includes('/users/roles');
  }

  showModuleGroup(group: any) {
    let present: boolean = false;
    if(Array.isArray(group?.modules)) {
      group.modules.forEach((module: any) => {
        present = present || Boolean(module?.permissions?.length) || group.overrideEmptyPermission;
      });
    }

    return present; 
  }

  get isBasicInfoInvalid() {
    return (
      !this.enabledModules?.length ||
      this.is_valid(this._role.name) ||
      !this._role?.organization_category ||
      !this.defaultAccessValue
    );
  }

  isPermissionSelected(permissions: any) {
    if(!permissions)
      return;

    let values: Array <any> = [...Object.values(permissions)];
    return values.reduce((result: any, flag: boolean) => (result || flag), false);
  }

  get programId() {
    return this._storageService.get(StorageKeys.PROGRAM_ID);
  }

  get orgId() {
    return this._storageService.get(StorageKeys.ORGANIZATION_ID);
  }



  public configViewGroup: Array <any> = [];
  constructConfigViewPermissions(permissions: Array <any>) {

    let groupMap: Map <string, Array <any>> = new Map <string, Array <any>> ();
    if(Array.isArray(permissions)) {
      permissions.forEach((permission: any) => {

        let {
          permission_group,
          label, slug, it,id
        } = permission;

        if(!permission_group) {
          permission_group = 'OTHER PERMISSIONS';
        }

        if(permission_group && slug && label) {
          if(!groupMap.has(permission_group)) {
            groupMap.set(permission_group, []);
          }

          let groupVal: Array <any> = groupMap.get(permission_group);
          groupVal.push({ label, slug, it,id });
          groupMap.set(permission_group, groupVal);
        }
      });
    }

    for(let [key, value] of groupMap.entries()) {

      const isGrouped: boolean = (key !== 'OTHER PERMISSIONS');
      const hasPermissions: boolean = !!value?.length;

      if(isGrouped && hasPermissions) {
        let name: string = this.titlecase.transform(key);
        this.configViewGroup.push({
          name, permissions: value || []
        });
      }
    }

    this.configViewGroup = this.sortPipe.transform(this.configViewGroup, 'name');

    const otherPerms: Array <any> = groupMap.get('OTHER PERMISSIONS') || [];
    if(otherPerms?.length) {
      this.configViewGroup.push({
        name: 'Other Permissions',
        permissions: otherPerms
      });
    }
  }

  searchRoles({term}) {
    this.delegationSub.next({ term, page: 1 });
  }

  loadMoreRoles() {
    if(!this.delegatesLoading && (this.userRoles?.length < this.delegatesCount)) {
      this.delegationSub.next({
        term: this.prevDelegateQuery?.term,
        page: (this.prevDelegateQuery?.page || 0) + 1
      })
    }
  }

  get modulesToHide() {
    let globalLaunchService: GlobalLaunchService = this.injector.get(GlobalLaunchService);
    let modulesToHide: Array<string> = [];
    if (!globalLaunchService.isglobalLaunchSlugFlagEnabled('master_talent_module_enablement'))
      modulesToHide.push('Master Talent Profile');
    return modulesToHide;
  }

  private initializeDelegationEntries(list: Array <string>) {

    if(!(Array.isArray(list) && list.length)) {
      return;
    }

    if(this._role.organization_category === 'CLIENT') {
      let destroyer$: Subject <void> = new Subject <void> ();
      interval(400).pipe(takeUntil(destroyer$)).subscribe(() => {
        if(this.delegatesLoading === false) {
          let length: number = list.length;
          this.userRoles = [...list, ...this.userRoles];
          setTimeout(() => {
            this.userRoles = this.userRoles.slice(length);
          }, 0);

          destroyer$.next();
        }
      });
    }
  }
}
