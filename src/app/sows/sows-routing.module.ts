import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AllProgressUpdateComponent } from './all-progress-update/all-progress-update.component';
import { CreateSowsComponent } from './create-sow/sows.component';
import { ListSowsComponent } from './lists/sows.component';
import { ProjectListComponent } from './project-list/project-list.component';
const routes: Routes = [
  // { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: 'create_sow',
    component: CreateSowsComponent
  },
  {
    path: 'milestones_list',
    component: ProjectListComponent
  },
  {
    path: 'progress_list',
    component: AllProgressUpdateComponent
  },
  {
    path: '**',
    component: ListSowsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SowsRoutingModule { }
