import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AssignmentComponent } from './assignment.component';
import { AssignmentListComponent } from './assignment-list/assignment-list.component';
import { CreateAssignmentComponent } from './create-assignment/create-assignment.component';
import { AssignmentViewComponent } from './assignment-view/assignment-view.component';
import { AllAssignmentsComponent } from './all-assignments/all-assignments.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { MassAssignmentComponent } from './mass-assignment/mass-assignment.component';
import { AssignmentCreateComponent } from './assignment-create/assignment-create.component';
import { ActivityBasedPricingComponent } from './activity-based-pricing/activity-based-pricing.component';
import { CreateQuickAssignmentComponent } from './create-quick-assignment/create-quick-assignment.component';
const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },

  {
    path: '',
    component: AssignmentComponent,
    children: [
      {
        path: 'list', component: AssignmentListComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_assignment']
        }
      },
      {
        path: 'all-list/:id', component: AllAssignmentsComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_assignment']
        }
      },
      {
        path: 'all-list', component: AllAssignmentsComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_assignment']
        }
      },
      {
        path: 'create', component: CreateAssignmentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_quick_assignment']
        }
      },
      {
        path: 'create-assignment', component: AssignmentCreateComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_quick_assignment']
        }
      },
      {
        path: 'create-quick-assignment', component: CreateQuickAssignmentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['create_quick_assignment']
        }
      },
      {
        path: 'edit-assignment/:id', component: AssignmentCreateComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['update_assignment' , 'quick_tax_update']
        }
      },
      {
        path: 'mass/update', component: MassAssignmentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['bulk_update_assignment' , 'bulk_assignment_close']
        }
      },
      {
        path: 'mass/update:id', component: MassAssignmentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['bulk_update_assignment', 'bulk_assignment_close']
        }
      },
      {
        path: 'activity', component: ActivityBasedPricingComponent, canActivateChild: [AuthguardService]
      },


      // { path: 'details', component: AssignmentViewComponent },
      // { path: 'details/:id', component: AssignmentViewComponent },
      { path: 'details/:id/:page', component: AssignmentViewComponent , canActivateChild: [AuthguardService], data: {
        userRoles: ['view_assignment']
      }},
      { path: 'activity', component: ActivityBasedPricingComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthguardService]
})
export class AssignmentRoutingModule { }
