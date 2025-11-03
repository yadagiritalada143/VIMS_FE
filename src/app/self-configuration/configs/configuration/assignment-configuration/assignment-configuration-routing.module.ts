import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateNewComponent } from './create-new/create-new.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';


const routes: Routes = [
  {
    path: 'create',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['assignment_configuration_manage']
    },
    component: CreateNewComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssignmentConfigurationRoutingModule { }
