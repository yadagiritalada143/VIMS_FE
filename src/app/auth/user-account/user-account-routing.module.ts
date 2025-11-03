import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { SecurityComponent } from './security/security.component';
import { DelegatesComponent } from './delegates/delegates.component'

const routes: Routes = [
  { path: 'account-settings', component: AccountSettingsComponent },
  { path: 'security', component: SecurityComponent },
  { path: 'notification-settings', component: NotificationSettingsComponent },
  { path: 'delegates', component: DelegatesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserAccountRoutingModule { }