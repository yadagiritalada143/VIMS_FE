import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthguardService } from '../core/services/auth_guard.service';
import { ProgramDetailsComponent } from '../self-configuration/configs/program/program-details/program-details.component';
import { CategoryListingComponent } from './configs/category-listing/category-listing.component';
import { ProgramListingComponent } from './configs/program-listing/program-listing.component';
import { ControlPanelComponent } from './control-panel.component';
import { GlobalLaunchesComponent } from './configs/global-launches/global-launches.component';

const routes: Routes = [{
  path: '', component: ControlPanelComponent,
  children: [{
      path: 'programs/list',
      component: ProgramListingComponent
    },
    {
      path: 'global-launches',
      component: GlobalLaunchesComponent
      
    },
    {
      path: 'program-setup/program-detail',
      component : ProgramDetailsComponent
    }, {
      path: 'programs',
      canActivate: [AuthguardService],
      canActivateChild: [AuthguardService],
      loadChildren: () => import('../programs/programs.module').then(m => m.ProgramsModule)
    }, {
      path: 'org/list/:term',
      canActivate: [AuthguardService],
      canActivateChild: [AuthguardService],
      component: CategoryListingComponent  
    }, {
      path: 'user-management',
      canActivate: [AuthguardService],
      canActivateChild: [AuthguardService],
      loadChildren: () => import('../user-management/user-management.module').then(m => m.UserManagementModule),
    }, 
    {
      path: 'program-setup',
      canActivate: [AuthguardService],
      canActivateChild: [AuthguardService],
      loadChildren: () => import('../program-setup/program-setup.module').then(m => m.ProgramSetupModule),
    }, 
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ControlPanelRoutingModule { }
