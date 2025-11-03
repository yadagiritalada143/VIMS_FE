import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlowsListComponent } from './flows-list/flows-list.component';
import { NewFlowComponent } from './new-flow/new-flow.component';
import { FlowsViewComponent } from './flows-view/flows-view.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['menu_flow_config','workflow_view'],
    },
    component:FlowsListComponent
  },
  {
    path: 'create',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['workflow_manage'],
    },
    component: NewFlowComponent
  },
  {
    path: 'view/:id',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['workflow_manage'],
    },
    component: FlowsViewComponent
  },
  {
    path: 'edit/:id',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['workflow_manage'],
    },
    component: NewFlowComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlowsManagementRoutingModule { }
