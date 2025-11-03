import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomFieldsComponent } from './custom-fields.component';
import { CreateCustomFieldsComponent } from './create-custom-fields/create-custom-fields.component';
import { CustomFieldsListComponent } from './custom-fields-list/custom-fields-list.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: CustomFieldsComponent,
    children: [
      {
        path: 'list/:add',
        canActivate: [AuthguardService],
        data: { userRoles: ['custom_field_view','custom_field_manage'] },
        component: CreateCustomFieldsComponent
      },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['custom_field_view'] },
        component: CustomFieldsListComponent
      }

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomFieldsRoutingModule { }
