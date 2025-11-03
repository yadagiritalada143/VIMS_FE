import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DomainBasedSettingsComponent } from './preferences/domain-based-settings/domain-based-settings.component';
import { EmailBasedSettingsComponent } from './preferences/email-based-settings/email-based-settings.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { RoleBasedSettingsComponent } from './preferences/role-based-settings/role-based-settings.component';
import { TemplateEditorComponent } from './template-editor/template-editor.component';
import { UserBasedSettingsComponent } from './preferences/user-based-settings/user-based-settings.component';
import { NotificationResolver } from './notification-config.resolver';
import { TemplateKeysComponent } from './template-keys/template-keys.component';
import { TemplateKeyDetailsComponent } from './template-key-details/template-key-details.component';
import { NotificationListComponent } from './notification-list/notification-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    component: NotificationListComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'event/template/:id',
    component: TemplateEditorComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'preferences',
    component: PreferencesComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'role-based-settings',
    component: RoleBasedSettingsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'domain-based-settings/:listType',
    component: DomainBasedSettingsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'email-based-settings/:type',
    component: EmailBasedSettingsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'user-based-settings',
    component: UserBasedSettingsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'event/templatekey',
    component: TemplateKeyDetailsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'event/templatekey/:id',
    component: TemplateKeyDetailsComponent,
    resolve: {
      notification: NotificationResolver,
    },
  },
  {
    path: 'event/templatekeys/:id',
    component: TemplateKeysComponent,
    resolve: {
      notification: NotificationResolver,
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationConfigRoutingModule { }
