import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProgramSetupComponent } from './program-setup.component';
import { ProgramSetupDetailsComponent } from './program-setup-details/program-setup-details.component';
import { ProgramSetupHomeComponent } from './program-setup-home/program-setup-home.component';
import { AccuracyConfigurationComponent } from './accuracy-configuration/accuracy-configuration.component';
import { AuthguardService } from '../core/services/auth_guard.service';



const routes: Routes = [
  {
    path: '',
    component: ProgramSetupComponent,
    children: [
      { path: '', component: ProgramSetupHomeComponent },
      {
        path: 'program-detail',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_program_details'] },
        component: ProgramSetupDetailsComponent
      },
      {
        path: 'configure-accuracy',
        canActivate: [AuthguardService],
	      canActivateChild: [AuthguardService],
        data: { userRoles: ['accuracy_configuration_view'] },
        component: AccuracyConfigurationComponent
      },
      {
        path: 'users',
        loadChildren: () => import('./manage-users/manage-users.module').then(m => m.ManageUsersModule)
      },
      {
        path: 'hierarchy',
        loadChildren: () => import('./hierarchy/hierarchy.module').then(m => m.HierarchyModule)
        // loadChildren:() => import('./hierarchy/hierarchy.module').then(m =>m.HierarchyModule),
      },
      {
        path: 'rate-card',
        // loadChildren: './rate-card/rate-card.module#RateCardModule'
        loadChildren: () => import('./rate-card/rate-card.module').then(m => m.RateCardModule)

      },
      {
        path: 'rate-factor',
        // loadChildren: './rate-factor/rate-factor.module#RateFactorModule'
        loadChildren: () => import('./rate-factor/rate-factor.module').then(m => m.RateFactorModule)

      },
      {
        path: 'qualifications',
        loadChildren: () => import('./qualifications/qualifications.module').then(m => m.QualificationsModule)
      },
      {
        path: '',
        loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'custom-fields',
        loadChildren: () => import('./custom-fields/custom-fields.module').then(m => m.CustomFieldsModule)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'vendor',
        // loadChildren: './vendor/vendor.module#VendorModule'
        loadChildren: () => import('./vendor/vendor.module').then(m => m.VendorModule)
      },
      {
        path: 'onboarding-configuration',
        loadChildren: () => import('./onboarding-configuration/onboarding-configuration.module').then(m => m.OnboardingConfigurationModule)
      },
      {
        path: 'job-template',
        // loadChildren: './vendor/vendor.module#VendorModule'
        loadChildren: () => import('./job-managment/job-managment.module').then(m => m.JobManagmentModule)
      }, {
        path: 'questionnaire',
        // loadChildren: './vendor/vendor.module#VendorModule'
        loadChildren: () => import('./questionnaire/questionnaire.module').then(m => m.QuestionnaireModule)
      },
      {
        path: 'expense',
        loadChildren: () => import('./expense-configuration/expense-configuration.module').then(m => m.ExpenseConfigurationModule)
      },
      {
        path: 'assignment',
        loadChildren: () => import('../program-setup/assignment-configuration/assignment-configuration.module').then(m => m.AssignmentConfigurationModule)
      },
      {
        path: 'timesheet',
        loadChildren: () => import('./timesheet-configuration/timesheet-configuration.module').then(m => m.TimesheetConfigurationModule)
      },
      {
        path: 'tenure-limit',
        loadChildren: () =>
          import('../program-setup/tenure-limit/tenure-limit.module').then(m => m.TenureLimitModule)
      },
      {
        path: 'invoice',
        loadChildren: () => import('./invoice-configuration/invoice-configuration.module').then(m => m.InvoiceConfigurationModule)
      },
      {
        path: 'hiring-process',
        canActivate: [AuthguardService],
        canActivateChild: [AuthguardService],
        data: {userRoles: ['menu_screening','hiring_process_manage']},
        loadChildren: () => import('./candidate-screening/candidate-screening.module').then(m => m.CandidateScreeningModule)
      }
    ],
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramSetupRoutingModule { }
