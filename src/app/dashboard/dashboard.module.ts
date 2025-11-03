import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//modules
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';

//components
import { DashboardComponent } from './dashboard.component';
import { DashboardHeaderComponent } from './Component/dashboard-header/dashboard-header.component';
import { DashboardGridComponent } from './Component/dashboard-grid/dashboard-grid.component';
import { ParentDynamicComponent } from './Component/dashboard-grid/parent-dynamic/parent-dynamic.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ContactSupportComponent } from './Component/contact-support/contact-support.component';
import { QuillModule } from 'ngx-quill';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { GridsterModule } from 'angular-gridster2';
import { DynamicModule } from 'ng-dynamic-component';
import { WidgetModule } from '../library/widget/widget.module';
import { DashboardWidgetSettingsComponent } from './Component/dashboard-widget-settings/dashboard-widget-settings.component';

//services
import { DashboardService } from './dashboard.service';
import { DashboardDataService } from './services/dashboard.data.service';
import { DashboardPermissionService } from './services/dashboard.permission.service';
import {TransformToArrPipe} from './Component/dashboard-widget-settings/const/widget-array.pipe';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { LogsModule } from '../library/logs/logs.module';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [
    DashboardComponent,
    DashboardHeaderComponent,
    DashboardGridComponent,
    ParentDynamicComponent,
    ContactSupportComponent,
    DashboardWidgetSettingsComponent,
    TransformToArrPipe,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    QuillModule.forRoot(),
    NgxSkeletonLoaderModule,
    GridsterModule,
    DynamicModule,
    WidgetModule,
    NewSharedModule,
    LogsModule,
    I18NextModule,
  ],
  providers: [DashboardService,
    DashboardDataService,
    DashboardPermissionService
  ],
  exports: []
})
export class DashboardModule { }
