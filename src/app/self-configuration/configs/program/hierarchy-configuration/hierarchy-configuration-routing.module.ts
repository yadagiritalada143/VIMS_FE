import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { CreateHierarchyComponent } from './create-hierarchy/create-hierarchy.component';
import { HierarchyConfigurationListingComponent } from './hierarchy-configuration-listing/hierarchy-configuration-listing.component';
import { ViewHierarchyComponent } from './view-hierarchy/view-hierarchy.component';

const routes: Routes = [
    {
        path: 'list',
        component: HierarchyConfigurationListingComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['hierarchy_view']
        }
      },
      {
        path: 'create',
        component: CreateHierarchyComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['hierarchy_manage']
        }
      },
      {
        path: 'edit',
        component: CreateHierarchyComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['hierarchy_manage']
        }
      },
      {
        path: 'view',
        component: ViewHierarchyComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['hierarchy_view']
        }
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HierarchyConfigurationRoutingModule { }
