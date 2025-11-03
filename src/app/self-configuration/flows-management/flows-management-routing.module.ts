import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FlowsListComponent } from 'src/app/self-configuration/flows-management/flows-list/flows-list.component';
import { FlowDetailedListingComponent } from 'src/app/self-configuration/flows-management/flow-detailed-listing/flow-detailed-listing.component';
import { NewFlowComponent } from './new-flow/new-flow.component';
import { FlowsViewComponent } from './flows-view/flows-view.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: 'list', 
    component:FlowsListComponent, 
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_view']
    } },
  {
    path: 'flow-list/:eventId/:module/:flow_type', 
    component:FlowDetailedListingComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_view']
    }
  },
  { 
    path: 'create', 
    component: NewFlowComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_manage']
    }
  },
  {
    path: 'create/:eventId/:moduleId/:flow_type', 
    component: NewFlowComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_manage']
    }
  },
  {
    path: 'view/:id', 
    component: FlowsViewComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_view']
    }
  },
  {
    path: 'edit/:id', 
    component: NewFlowComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['workflow_manage']
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlowsManagementRoutingModule { }
