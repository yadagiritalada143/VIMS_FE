import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CostComponentComponent } from './cost-component.component';
import { CostComponentListComponent } from './cost-component-list/cost-component-list.component';
import { CreateCostComponentComponent } from './create-cost-component/create-cost-component.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { CostComponentDetailsComponent } from './cost-component-details/cost-component-details.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    component: CostComponentComponent,
    children: [
      {
        path: 'list',
        data: {},
        canActivate: [AuthguardService],
        component: CostComponentListComponent
      },
      {
        path: 'create',
        data: {},
        canActivate: [AuthguardService],
        component: CreateCostComponentComponent 
      },
      {
        path: 'details/:id',
        data: {},
        canActivate: [AuthguardService],
        component: CostComponentDetailsComponent
      },
      {
        path: 'edit/:id',
        data: {},
        canActivate: [AuthguardService],
        component: CreateCostComponentComponent 
      },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CostComponentRoutingModule { }
