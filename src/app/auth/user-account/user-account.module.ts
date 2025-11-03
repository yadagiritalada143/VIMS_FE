import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAccountRoutingModule } from './user-account-routing.module'
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { TreeModule } from '../../library/tree/tree.module';
import { UserPreferenceHeaderComponent } from './user-preference-header/user-preference-header.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SecurityComponent } from './security/security.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { AuthModule } from '../auth.module';
import { DelegatesComponent } from './delegates/delegates.component';
import { AddDelegatesComponent } from './add-delegates/add-delegates.component';
import { VmsTableModule } from '../../library/smartTable//vms-table.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [AccountSettingsComponent, NotificationSettingsComponent, UserPreferenceHeaderComponent, EditProfileComponent, SecurityComponent, DelegatesComponent, AddDelegatesComponent],
  imports: [
    CommonModule,
    LogsModule,
    UserAccountRoutingModule,
    SharedModule,
    NgSelectModule,
    TreeModule,
    FormsModule,
    ImageCropperModule,
    FormsModule,
    ReactiveFormsModule,
    AuthModule,
    VmsTableModule,
    NewSharedModule,
    I18NextModule,
  ],
  providers: [
    SortHelperPipe
  ]
})
export class UserAccountModule { }
