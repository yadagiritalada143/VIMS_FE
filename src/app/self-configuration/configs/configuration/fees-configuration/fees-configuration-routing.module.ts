import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateNewComponent } from './create-new/create-new.component';
import { ListComponent } from './list/list.component';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthguardService],
    data: { userRoles: ['fee_configuration_view'] },
    component: ListComponent
  },
  {
    path: 'create', 
    component: CreateNewComponent,
    canActivate: [AuthguardService],
    data: { userRoles: ['fee_configuration_manage'] },
  },
  {
    path: 'detail-page', 
    component: DetailPageComponent,
    canActivate: [AuthguardService],
    data: { userRoles: ['fee_configuration_view'] },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeesConfigurationRoutingModule { }
