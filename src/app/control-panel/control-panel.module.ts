import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ControlPanelRoutingModule } from './control-panel-routing.module';
import { ControlPanelComponent } from './control-panel.component';
import { ControlPanelHeaderComponent } from './components/control-panel-header/control-panel-header.component';
import { ControlPanelSidebarComponent } from './components/control-panel-sidebar/control-panel-sidebar.component';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { SharedModule } from '../shared/shared.module';
import { ProgramListingComponent } from './configs/program-listing/program-listing.component';
import { SvmsTableModule } from '../library/svms-table/svms-table.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SelfConfigurationModule } from '../self-configuration/self-configuration.module';
import { CategoryListingComponent } from './configs/category-listing/category-listing.component';
import { OrganizationsModule } from '../organizations/organizations.module';
import { I18NextModule } from 'angular-i18next';
import { GlobalLaunchesComponent } from './configs/global-launches/global-launches.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  declarations: [
    ControlPanelComponent,
    ControlPanelHeaderComponent,
    ControlPanelSidebarComponent,
    ProgramListingComponent,
    CategoryListingComponent,
    GlobalLaunchesComponent
  ],
  imports: [
    CommonModule,
    ControlPanelRoutingModule,
    PerfectScrollbarModule,
    SharedModule,
    SvmsTableModule,
    NewSharedModule,
    SelfConfigurationModule,
    OrganizationsModule,
    I18NextModule,
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class ControlPanelModule { }
