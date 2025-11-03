import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateRoleComponent } from './create-role/create-role.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { ProfileViewComponent } from './profile-view/profile-view.component';
import { RoleListingComponent } from './role-listing/role-listing.component';
import { UserListingComponent } from './user-listing/user-listing.component';
import { UserManagementComponent } from './user-management.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    component: UserManagementComponent,
    children: [
      {
        path: 'create-user',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_manage'] },
        component: CreateUserComponent
      },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_users','user_view'] },
        component: UserListingComponent
      },
      {
        path: 'create-role',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_role_manage'] },
        component: CreateRoleComponent
      },
      {
        path: 'role-listing',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_role_view'] },
        component: RoleListingComponent
      },
      {
        path: 'profile-view/:id',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_manage'] },
        component: ProfileViewComponent
      },
      {
        path: 'profile-view/:id/:toProgram',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_manage'] },
        component: ProfileViewComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserManagementRoutingModule {}
