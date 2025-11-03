import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { ImageCropperModule } from 'ngx-image-cropper';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { ManageUsersRoutingModule } from './manage-users-routing.module';
import { CreateRolesComponent } from './create-roles/create-roles.component';
import { CreateUsersComponent } from './create-users/create-users.component';
import { ListUsersComponent } from './list-users/list-users.component';
import { ManageUserComponent } from './manage-user.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { TreeModule } from 'src/app/library/tree/tree.module';
import { FormBuilderModule } from 'src/app/library/form-builder/form-builder.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { UserManagementModule } from 'src/app/user-management/user-management.module';
import { RemoveDoNotRehireSidepanelComponent } from './remove-do-not-rehire-sidepanel/remove-do-not-rehire-sidepanel.component';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [CreateRolesComponent, ManageUserComponent, CreateUsersComponent, ListUsersComponent, UserRoleComponent, RemoveDoNotRehireSidepanelComponent],
  imports: [
    CommonModule,
    ManageUsersRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    VmsTableModule,
    ImageCropperModule,
    ReactiveFormsModule,
    TreeModule,
    FormBuilderModule,
    NewSharedModule,
    UserManagementModule,
    I18NextModule,
  ],
  exports: [
      RemoveDoNotRehireSidepanelComponent,
      CreateRolesComponent
  ]
})
export class ManageUsersModule { }
