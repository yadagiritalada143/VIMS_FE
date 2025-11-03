import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NotificationsComponent} from './notifications.component';
import {NotificationsRoutingModule} from './notifications-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormBuilderModule} from 'src/app/library/form-builder/form-builder.module';
import {VmsTableModule} from 'src/app/library/table/vms-table.module';
import {SharedModule} from 'src/app/shared/shared.module';
import {NotificationCategoryComponent} from './notification-category/notification-category.component';
import {NotificationLayoutComponent} from './notification-layout/notification-layout.component';
import {NewSharedModule} from 'src/app/new-shared/new-shared.module';
import {NotificationViewComponent} from './notification-view/notification-view.component';
import {QuillModule} from 'ngx-quill';
import {EmailTemplateHeaderComponent} from './email-template-header/email-template-header.component';
import { NotificationsEmailFooterComponent } from './notifications-email-footer/notifications-email-footer.component';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [NotificationsComponent, NotificationCategoryComponent, NotificationLayoutComponent, NotificationViewComponent, EmailTemplateHeaderComponent, NotificationsEmailFooterComponent],
  imports: [
    CommonModule,
    NotificationsRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    VmsTableModule,
    ReactiveFormsModule,
    FormBuilderModule,
    QuillModule.forRoot(),
    NewSharedModule,
    I18NextModule,
  ],
})
export class NotificationsModule {
}
