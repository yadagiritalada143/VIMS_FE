
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ProgramSetupRoutingModule } from './program-setup-routing.module';
// import { HierarchyModule } from './hierarchy/hierarchy.module';
import { ProgramSetupComponent } from './program-setup.component';
import { ProgramSetupHeaderComponent } from './component/program-setup-header/program-setup-header.component';
import { ProgramSetupSidebarComponent } from './component//program-setup-sidebar/program-setup-sidebar.component';
import { InsightComponent } from './component/insight/insight.component';
import { ProgramSetupHomeComponent } from './program-setup-home/program-setup-home.component';
import { NgxStickySidebarModule } from '@smip/ngx-sticky-sidebar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { ProgramSetupDetailsComponent } from './program-setup-details/program-setup-details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProgramSetupDetailsComponent } from './program-setup-details/program-setup-details.component';
// import { ManageUsersModule } from './manage-users/manage-users.module';
import {ProgramsModule} from '../programs/programs.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { AccuracyConfigurationComponent } from './accuracy-configuration/accuracy-configuration.component';

import { LogsModule } from '../library/logs/logs.module';
import { TenureLimitComponent } from './tenure-limit/tenure-limit.component';
import { CreateNewUserComponent } from '../programs/create-new-user/create-new-user.component';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [ProgramSetupComponent, ProgramSetupHeaderComponent, ProgramSetupSidebarComponent, InsightComponent, ProgramSetupHomeComponent, ProgramSetupDetailsComponent, AccuracyConfigurationComponent, TenureLimitComponent ],
  imports: [
    CommonModule,
    ProgramSetupRoutingModule,
    SharedModule,
    NgxStickySidebarModule,
    NgSelectModule,
    FormsModule,
    ProgramsModule,
    ReactiveFormsModule,
    NewSharedModule,
    LogsModule,
    I18NextModule,
  ],
  exports: [ProgramSetupDetailsComponent, CreateNewUserComponent],
  providers: [],

})
export class ProgramSetupModule { }
