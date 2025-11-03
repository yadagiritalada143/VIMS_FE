import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterTalentProfilesComponent } from './master-talent-profiles.component';
import { MasterTalentProfilesListComponent } from './master-talent-profiles-list/master-talent-profiles-list.component';
import { AuthguardService } from '../core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: MasterTalentProfilesComponent,
    children: [
      {
        path: 'list',
        component: MasterTalentProfilesListComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_candidate'],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterTalentProfilesRoutingModule { }
