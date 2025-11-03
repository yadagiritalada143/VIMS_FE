import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProgramsComponent } from './programs.component';
import { ProgramListComponent } from './program-list/program-list.component';
import { ProgramCreateComponent } from './program-create/program-create.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '', component: ProgramsComponent,
    children: [
      { path: 'list', component: ProgramListComponent ,canActivateChild: [AuthguardService],data: {
        userRoles: ['view_program'] 
      } },
      { path: 'create', component: ProgramCreateComponent ,canActivateChild: [AuthguardService],data: {
        userRoles: ['create_program'] 
      } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramsRoutingModule { }
