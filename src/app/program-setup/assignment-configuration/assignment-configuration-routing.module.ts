import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AssignmentConfigurationCreateComponent } from './assignment-configuration-create/assignment-configuration-create.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'config',
    pathMatch: 'full'
  },
  {
    path: 'config',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['assignment_configuration_manage'],
    },
    component: AssignmentConfigurationCreateComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssignmentConfigurationRoutingModule { }
