import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CostComponentGroupComponent } from './cost-component-group.component';
import { CostComponentGroupListComponent } from './cost-component-group-list/cost-component-group-list.component';
import { CreateCostComponentGroupComponent } from './create-cost-component-group/create-cost-component-group.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { CostComponentGroupDetailsComponent } from './cost-component-group-details/cost-component-group-details.component';

const routes: Routes = [
  {
    path: '',
    component: CostComponentGroupComponent,
    children: [
      {
        path: 'list',
        data: {},
        canActivate: [AuthguardService],
        component: CostComponentGroupListComponent
      },
      {
        path: 'create',
        data: {},
        canActivate: [AuthguardService],
        component: CreateCostComponentGroupComponent
      },
      {
        path: 'details/:id',
        data: {},
        canActivate: [AuthguardService],
        component: CostComponentGroupDetailsComponent
      },
      {
        path: 'edit/:id',
        data: {},
        canActivate: [AuthguardService],
        component: CreateCostComponentGroupComponent,
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CostComponentGroupRoutingModule { }
