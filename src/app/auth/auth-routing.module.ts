import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthguardService } from '../core/services/auth_guard.service';
import { AccountSetupComponent } from './account-setup/account-setup.component';
import { VendorOnboardingComponent } from './vendor-onboarding/vendor-onboarding.component';
import { InviteUserComponent } from '../auth/invite-user/invite-user.component';
import {UnauthorizedAccessComponent} from '../auth/account-setup/unauthorized-access/unauthorized-access.component';
import { PostLoginLandingComponent } from './post-login-landing/post-login-landing.component';
import { WorkerLandingDashboardComponent } from './worker-landing-dashboard/worker-landing-dashboard.component';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'worker-dashboard', component: WorkerLandingDashboardComponent },
  {
    path: '',

    children: [
      { path: 'unauthorized', component: UnauthorizedAccessComponent },
      { path: 'invite', component: AccountSetupComponent },
      { path: 'setup-password', component: AccountSetupComponent },
      { path: 'vendor-onboarding/invite', component: VendorOnboardingComponent },
      { path: 'vendor-onboarding/setup-password', component: VendorOnboardingComponent },
      { path: 'basic-details', component: AccountSetupComponent },
      { path: 'security-questions', component: AccountSetupComponent },
      { path: 'avatar', component: AccountSetupComponent },
      { path: 'theme-color', component: AccountSetupComponent },
      { path: 'accept', component: InviteUserComponent },
      { path: '', component: LoginComponent },

    ],
  },
  { path: 'program-selection',
    canActivate: [AuthguardService],
    component: PostLoginLandingComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  // providers:[AuthguardService]
})
export class AuthRoutingModule { }
