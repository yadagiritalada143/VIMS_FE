import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomFieldListComponent } from './custom-field-list/custom-field-list.component';
import { NewCustomFieldComponent } from './new-custom-field/new-custom-field.component';
import { CustomFieldViewComponent } from './custom-field-view/custom-field-view.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: 'list',
    component:CustomFieldListComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['custom_field_view']
    }
  },
  { path: 'create',
    component: NewCustomFieldComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['custom_field_view','custom_field_manage']
    }
  },
  {
    path: 'view/:id',
    component: CustomFieldViewComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['custom_field_view','custom_field_manage']
    }
  },
  {
    path: 'edit/:id',
    component: NewCustomFieldComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['custom_field_view','custom_field_manage']
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomFieldManagementRoutingModule { }
