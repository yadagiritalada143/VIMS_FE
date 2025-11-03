import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { ViewAccuracyComponent } from './view-accuracy/view-accuracy.component';
import { EditAccuracyComponent } from './edit-accuracy/edit-accuracy.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['accuracy_configuration_manage'],
    },
    component: ViewAccuracyComponent,
  },
  {
    path: 'edit',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['accuracy_configuration_manage'],
    },
    component: EditAccuracyComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccuracyConfigurationRoutingModule {}
