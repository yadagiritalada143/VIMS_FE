import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListQualificationTypesComponent } from './list-qualification-types/list-qualification-types.component';
import { QualificationsComponent } from './qualifications.component';
import { ListQualificationsComponent } from './list-qualifications/list-qualifications.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    component: QualificationsComponent,
    children: [
      {
        path: 'list/:add',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['qualification_view'],
        },
        component: ListQualificationTypesComponent
      },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['qualification_view'],
        },
        component: ListQualificationTypesComponent
      },
      {
        path: 'list-qualifications',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['qualification_view'],
        },
        component: ListQualificationsComponent
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QualificationsRoutingModule { }
