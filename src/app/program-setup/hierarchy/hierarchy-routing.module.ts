import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HierarchyComponent } from './hierarchy.component';
import { ListFoundationalDataTypeComponent } from './list-foundational-data-type/list-foundational-data-type.component';
import { ListFoundationalDataComponent } from './list-foundational-data/list-foundational-data.component';
import { HierarchyConfigurationComponent } from './hierarchy-configuration/hierarchy-configuration.component';
import { ListWorkLocationComponent } from './list-work-location/list-work-location.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: HierarchyComponent,
    children: [
      {
        path: 'list/:add',
        component: ListFoundationalDataTypeComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['create_foundational_data_type']
          // Multiple Allowed User
        }
      }, {
        path: 'list',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['menu_hierarchy']
        },
        component: ListFoundationalDataTypeComponent
      }, {
        path: 'list-foundational-data',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['menu_hierarchy']
        },
        component: ListFoundationalDataComponent
      }, {
        path: 'hierarchy-configuraton',
        component: HierarchyConfigurationComponent,
        canActivateChild: [AuthguardService],
        data: {
          userRoles: ['view_hierarchy','hierarchy_view']
          // Multiple Allowed User
        }
      }, {
        path: 'work-location/list',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['work_location_view']
        },
        component: ListWorkLocationComponent
      }, {
        path: 'work-location/list/:add',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['work_location_manage']
        },
        component: ListWorkLocationComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HierarchyRoutingModule { }
