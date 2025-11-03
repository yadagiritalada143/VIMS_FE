import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthguardService } from '../core/services/auth_guard.service';
import { LoginComponent } from './login/login.component';
import { AccountSetupIntroComponent } from './account-setup/account-setup-intro/account-setup-intro.component';
import { OnboardingSetupIntroComponent } from './vendor-onboarding/onboarding-setup-intro/onboarding-setup-intro.component';
import { SetPasswordComponent } from './account-setup/set-password/set-password.component';
import { UserProfileSetupComponent } from './vendor-onboarding/user-profile-setup/user-profile-setup.component';
import { AccountSetupComponent } from './account-setup/account-setup.component';
import { VendorOnboardingComponent } from './vendor-onboarding/vendor-onboarding.component';
import { SecretQuestionsComponent } from './account-setup/secret-questions/secret-questions.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { BasicDetailsComponent } from './account-setup/basic-details/basic-details.component';
import { VendorAccountSetupComponent } from './vendor-onboarding/vendor-account-setup/vendor-account-setup.component';
// import { PasswordStrengthComponent } from '../shared/components/password-strength/password-strength.component';
import { CustomizeAvatarComponent } from './account-setup/customize-avatar/customize-avatar.component';
import { ColorThemeComponent } from './account-setup/color-theme/color-theme.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { InviteUserComponent } from './invite-user/invite-user.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { UnauthorizedAccessComponent } from './account-setup/unauthorized-access/unauthorized-access.component';
import { PostLoginLandingComponent } from './post-login-landing/post-login-landing.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { WorkerLandingDashboardComponent } from './worker-landing-dashboard/worker-landing-dashboard.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { I18NextModule } from 'angular-i18next';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};



@NgModule({
  declarations: [LoginComponent, AccountSetupIntroComponent, OnboardingSetupIntroComponent,
    SetPasswordComponent, UserProfileSetupComponent, AccountSetupComponent, VendorOnboardingComponent, SecretQuestionsComponent, BasicDetailsComponent, VendorAccountSetupComponent,
    CustomizeAvatarComponent, ColorThemeComponent, InviteUserComponent,UnauthorizedAccessComponent, PostLoginLandingComponent, WorkerLandingDashboardComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    ImageCropperModule,
    SharedModule,
    NgSelectModule,
    NewSharedModule,
    NgxSkeletonLoaderModule,
    PerfectScrollbarModule,
    I18NextModule
  ],
  providers: [SortHelperPipe,AuthguardService,  {
    provide: PERFECT_SCROLLBAR_CONFIG,
    useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
  }],
  exports: []
})
export class AuthModule { }
