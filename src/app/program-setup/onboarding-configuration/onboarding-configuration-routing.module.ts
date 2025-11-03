import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskChecklistComponent } from './task-checklist/task-checklist.component';
import { TaskListComponent } from './task-list/task-list.component'
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: 'task-list',
    canActivate: [AuthguardService],
    data: { userRoles: ['menu_onboarding','task_view'] },
    component: TaskListComponent
  },
  {
    path: 'task-checklist',
    canActivate: [AuthguardService],
    data: { userRoles: ['menu_onboarding','checklist_view'] },
    component: TaskChecklistComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnboardingConfigurationRoutingModule { }
