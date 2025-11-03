import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileViewComponent } from 'src/app/user-management/profile-view/profile-view.component';
import { RoleListingComponent } from 'src/app/user-management/role-listing/role-listing.component';
import { ListUsersComponent } from './list-users/list-users.component';
import { ManageUserComponent } from './manage-user.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: '', component: ManageUserComponent,
    children: [
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_users','user_view'] },
        component: ListUsersComponent
      },
      {
        path: 'list/:add',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_users','user_view'] },
        component: ListUsersComponent
      },
      {
        path: 'list/:add/:id',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_users','user_view'] },
        component: ListUsersComponent
      },
      {
        path: 'roles',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_program_roles','user_role_view'] },
        component: RoleListingComponent
      },
      {
        path: 'profile-view/:id',
        canActivate: [AuthguardService],
        data: { userRoles: ['user_view'] },
        component: ProfileViewComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageUsersRoutingModule { }
