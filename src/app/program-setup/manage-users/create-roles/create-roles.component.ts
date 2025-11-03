import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService } from '../../../core/services/storage.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { UserService } from './../../../core/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-roles',
  templateUrl: './create-roles.component.html',
  styleUrls: ['./create-roles.component.scss']
})
export class CreateRolesComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  _role: any = {};
  public programId: string;
  basicInfoForm: UntypedFormGroup;
  submitted = false;
  moduleGroup = [];
  selectedModuleGroups: any = [];
  public totalRecords = 0;
  public itemsPerPage: any;
  isSaveLoader:boolean = false;

  // tslint:disable-next-line: no-output-on-prefix
  @Output() onClose = new EventEmitter();
  @Input() createRoleUser = 'hidden';
  @Input() isViewClicked;
  @Input() readOnly;
  @Input() set role(data) {
    this.reset();
    this.tabIndex = 0;
    if (data && Object.keys(data).length > 0) {
      this._role = data;
      this.toggle = {
        value: data.is_enabled,
        title: data.is_enabled ? 'active' : 'inactive'
      };
      if (data.id) {
        this.getRoleInfo(data.id);
      }
    }
  }

  get role() {
    return this._role;
  }
  public get title() {
    return this.label;
  }

  @Input() public set title(title: string) {
    this.label = title;
  }
  @Input() public set type(type: string) {
    this.roleType = type;
  }

  @Input() public set icon(icon: string) {
    this.roleIcon = icon;
  }

  tabIndex = 0;
  basicInfo = true;
  public is_enabled = true;
  label: string;
  roleType: string;
  roleIcon: string;
  public toggle = {
    title: 'active',
    value: true
  };



  constructor(
    private eventStream: EventStreamService,
    public userService: UserService,
    private _storageService: StorageService,
    private _programService: ProgramService,
    private _alertService: AlertService,
    private fb: UntypedFormBuilder,
    private _loader: LoaderService
  ) { }

  ngOnInit(): void {
    let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
    }

    this.basicInfoForm = this.fb.group({
      name: ['', Validators.required],
      is_enabled: [false]
    });

    this.getModuleList();
    this.subscriptions.push(this.eventStream.on(Events.ROLE_CREATE)
    .subscribe((data: any) => {
      if (data) {
        this.createRoleUser = 'visible';
      } else {
        this.createRoleUser = 'hidden';
      }
    }));

  }

  get confirmationMessage() {
    return `Are you sure you want to leave this page? ${ this._role?.id ? ('Role ' + this._role.name) : 'New Role' } is not ${ this._role?.id ? 'saved' : 'created' } yet.`;
  }

  reset() {
    this.toggle = {
      title: 'active',
      value: true
    };
    this._role = {};
    this.moduleGroup.forEach(mg => {
      mg.is_enabled = false;
      mg.modules.forEach(permission => {
        permission = {
          ...permission,
          is_read_allowed: true,
          is_create_allowed: false,
          is_edit_allowed: false,
          is_delete_allowed: false
        };
      });
    });
    this.moduleGroup = [...this.moduleGroup];
  }

  getRoleInfo(id) {
    const url = `/configurator/programs/${this.programId}/roles/${this.role.id}`;
    this.subscriptions.push(this.userService.get(url)
    .subscribe((data: any) => {
      const { roles } = data;
      const { module_groups, permissions } = roles;
      this.moduleGroup = this.moduleGroup.map(group => {
        group.is_enabled = module_groups.some(grp => grp.id === group.id && grp.is_enabled);
        group.modules = group.modules.map(module => {
          const permissionModule = permissions.find(mod => mod.module_id === module.module_id);
          if (permissionModule) {
            module = permissionModule;
          }
          return module;
        });
        return group;
      });
      this.moduleGroup = [...this.moduleGroup];
    }));
  }

  onClickModule(e) { }


  onContinue() {
    this.submitted = true;
    if (!this.role.name) {
      this._alertService.error('Role name is required!');
    } else {
      this.onIndexChange(1);
    }
  }


  getModuleList(pageNo = 1) {
    this._loader.show();
    this.subscriptions.push(
      this.userService.getAllModuleList(this.programId)
        .subscribe({
          next: (data: any) => {
            if (data && data.module_groups) {
              data?.module_groups?.forEach((mGroup: any) => {
                mGroup.is_enabled = false;
                mGroup.modules = mGroup?.modules?.map(module => {
                  return {
                    name: module.name,
                    code: module.code,
                    module_id: module.id,
                    is_enabled: false,
                    is_read_allowed: true,
                    is_create_allowed: false,
                    is_edit_allowed: false,
                    is_delete_allowed: false
                  };
                });
              });
              this.moduleGroup = data.module_groups;
              this.totalRecords = data.total_records;
              this.itemsPerPage = data.items_per_page;
            }
          }, error: (error: Error | any) => {
            this._loader.hide();
            this._alertService.error(errorHandler(error));
          }, complete: () => {
            this._loader.hide();
          }
        }
        )
      );

    //TODO enable/disable module in edit mode from "role.module_groups"
  }

  get continueDisbled(): boolean {
    const hasSelected = !this.moduleGroup.some(mg => mg.is_enabled);
    return !this.role.name || hasSelected;
  }

  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      this.basicInfo = true;
    }
    else if (this.tabIndex === 1) {
      this.basicInfo = false;
    }
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.ROLE_CREATE, false));
    this.onClose.emit(true);
  }

  onClickToggle() {
    if (this.readOnly) {
      return;
    }
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this._role.is_enabled = this.toggle.value;
  }


  onSave() {
    const moduleGroup = JSON.parse(JSON.stringify(this.moduleGroup));
    const permissions = moduleGroup
      .map(p => p.modules)
      .reduce((prev, next) => {
        return prev.concat(next);
      })
      .map(module => {
        delete module.code;
        delete module.name;
        return module;
      });

    // tslint:disable-next-line: variable-name
    const module_groups = this.moduleGroup.map(fg => {
      return { id: fg.id, is_enabled: fg.is_enabled };
    });
    const payload = {
      name: this.role.name,
      is_enabled: this.role.is_enabled,
      module_groups,
      permissions
    };

    if (this.role.id) {
      this.roleUpdate(payload);
    } else {
      this.roleSave(payload);
    }

  }

  roleSave(payload) {
    this.isSaveLoader = true;
    this.subscriptions.push(
      this._programService.post(`/configurator/programs/${this.programId}/roles`, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.sidebarClose();
              this._alertService.success(`New Role Created Successfully`);
            }
            this.isSaveLoader = false;
          }, error: (err: Error | any) => {
            this.isSaveLoader = false;
            this._alertService.error(errorHandler(err));
          }
        }
      )
    );
  }

  roleUpdate(payload) {
    
    this.isSaveLoader = true;
    this.subscriptions.push(
      this._programService.put(`/configurator/programs/${this.programId}/roles/${this.role.id}`, payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.sidebarClose();
              this._alertService.success(`Role Updated Successfully`);
            }
            this.isSaveLoader = false;
          }, error: (err: Error | any) => {
            this.isSaveLoader = false;
            this._alertService.error(errorHandler(err));
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
