import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserManagementComponent } from './user-management.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UserListingComponent } from './user-listing/user-listing.component';
import { RoleListingComponent } from './role-listing/role-listing.component';
import { SharedModule } from '../shared/shared.module';
import { VmsTableModule } from '../library/table/vms-table.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { UserAssignedComponent } from './components/user-assigned/user-assigned.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { ProfileViewComponent } from './profile-view/profile-view.component';
import { BasicInfoProfileComponent } from './profile-view/basic-info-profile/basic-info-profile.component';
import { ProgramAttachedttoComponent } from './profile-view/program-attachedtto/program-attachedtto.component';
import { AddUserToProgramComponent } from './add-user-to-program/add-user-to-program.component';
import { CreateNewUserComponent } from './create-new-user/create-new-user.component';
import { TreeviewModule } from 'ngx-treeview';
import { UniqueKeyPipe } from '../shared/pipe/unique-key.pipe';
import { SortHelperPipe } from '../shared/pipe/sort-helper.pipe';
import { CreateRoleComponent } from './create-role/create-role.component';
import { I18NextModule } from 'angular-i18next';
import { CustomFieldsModule } from '../library/custom-fields/custom-fields.module';

@NgModule({
  declarations: [
    UserManagementComponent,
    CreateUserComponent,
    UserListingComponent,
    RoleListingComponent,
    UserAssignedComponent,
    ProfileViewComponent,
    BasicInfoProfileComponent,
    ProgramAttachedttoComponent,
    AddUserToProgramComponent,
    CreateNewUserComponent
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    VmsTableModule,
    NgSelectModule,
    NewSharedModule,
    TreeviewModule.forRoot(),
    I18NextModule,
    CustomFieldsModule
  ],
  exports: [
    AddUserToProgramComponent,
    CreateRoleComponent
  ],
  providers: [
    UniqueKeyPipe,
    SortHelperPipe,
    TitleCasePipe
  ]
})
export class UserManagementModule {}
