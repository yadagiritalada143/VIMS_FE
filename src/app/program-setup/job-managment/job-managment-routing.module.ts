import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateJobTemplateComponent } from './create-job-template/create-job-template.component';
import { JobManagmentComponent } from './job-managment.component';
import { ViewJobTemplateComponent } from './view-job-template/view-job-template.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service'

const routes: Routes = [
  {
    path: '',
    component: JobManagmentComponent,
    children: [
      {
        path: 'create',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_job_management','job_template_manage'] },
        component: CreateJobTemplateComponent
      },
      {
        path: 'create/:id/:name',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_job_management','job_template_manage'] },
        component: CreateJobTemplateComponent
      },
      {
        path: 'list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_job_management','job_template_view'] },
        component: ViewJobTemplateComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobManagmentRoutingModule { }
