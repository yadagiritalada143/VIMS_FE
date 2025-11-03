import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NotificationConfigRoutingModule} from './notification-config-routing.module';
import {EventListComponent} from './event-list/event-list.component';
import {TemplateEditorComponent} from './template-editor/template-editor.component';
import {PreviewComponent} from './template-editor/preview/preview.component';
import {EditorComponent} from './template-editor/editor/editor.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PreferencesComponent} from './preferences/preferences.component';
import {RoleBasedSettingsComponent} from './preferences/role-based-settings/role-based-settings.component';
import {DomainBasedSettingsComponent} from './preferences/domain-based-settings/domain-based-settings.component';
import {EmailBasedSettingsComponent} from './preferences/email-based-settings/email-based-settings.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {SharedModule} from 'src/app/shared/shared.module';
import {QuillModule} from 'ngx-quill';
import {LogsModule} from 'src/app/library/logs/logs.module';
import {UserBasedSettingsComponent} from './preferences/user-based-settings/user-based-settings.component';
import {NewSharedModule} from '../../new-shared/new-shared.module';
import {CommonNotificationSettingsComponent} from './preferences/common-notification-settings/common-notification-settings.component';
import {QuillEditorComponent} from './template-editor/quill-editor/quill-editor.component';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {PERFECT_SCROLLBAR_CONFIG} from 'ngx-perfect-scrollbar';
import {PerfectScrollbarConfigInterface} from 'ngx-perfect-scrollbar';
import {EditorToolsComponent} from './template-editor/editor-tools/editor-tools.component';
import {DynamicHtmlTemplateBuilderModule} from '../dynamic-html-template-builder/dynamic-html-template-builder.module';
import { EmailDesignerComponent } from './preferences/email-designer/email-designer.component';
import { TemplateKeysComponent } from './template-keys/template-keys.component';
import { TemplateKeyDetailsComponent } from './template-key-details/template-key-details.component';
import { PushNotificationTemplateComponent } from './template-editor/push-notification-template/push-notification-template.component';
import { I18NextModule } from 'angular-i18next';
import { NotificationListComponent } from './notification-list/notification-list.component';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  declarations: [EventListComponent, TemplateEditorComponent, PreviewComponent, EditorComponent, PreferencesComponent, RoleBasedSettingsComponent,
    DomainBasedSettingsComponent, EmailBasedSettingsComponent, UserBasedSettingsComponent, CommonNotificationSettingsComponent, QuillEditorComponent, EditorToolsComponent, EmailDesignerComponent, TemplateKeysComponent, TemplateKeyDetailsComponent, PushNotificationTemplateComponent, NotificationListComponent],
  imports: [
    CommonModule,
    QuillModule.forRoot(),
    NotificationConfigRoutingModule,
    FormsModule, SharedModule,
    ReactiveFormsModule,
    NgSelectModule,
    LogsModule,
    NewSharedModule,
    PerfectScrollbarModule,
    DynamicHtmlTemplateBuilderModule, I18NextModule,
    SvmsTableModule
  ],
  exports: [
    QuillEditorComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class NotificationConfigModule {
}
