import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';

// Charts
import { SvmsPieChartModule } from 'src/app/library/charts/svms-pie-chart/svms-pie-chart.module';
import { SvmsLineChartModule } from 'src/app/library/charts/svms-line-chart/svms-line-chart.module';
import { SvmsColumnChartModule } from 'src/app/library/charts/svms-column-chart/svms-column-chart.module';
import { SvmsBubbleChartModule } from 'src/app/library/charts/svms-bubble-chart/svms-bubble-chart.module';
import { SvmsStackedBarChartModule, } from 'src/app/library/charts/svms-stacked-bar-chart/svms-stacked-bar-chart.module';
import { SvmsBarChartModule, } from 'src/app/library/charts/svms-bar-chart/svms-bar-chart.module';
import { ClickOutsideModule } from 'ng-click-outside';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SvmsHorisontalColumnChartModule } from '../library/charts/svms-horisontal-column-chart/svms-horisontal-column-chart.module';
import { SvmsAreaChartModule } from 'src/app/library/charts/svms-area-chart/svms-area-chart.module';
import { ReportsRoutingModule } from './reports-routing.module';

// components
import { ReportsDetailsComponent } from './pages/reports-details/reports-details.component';
import { AsidePanelComponent } from './components/aside-panel/aside-panel.component';
import { ReportsGraphComponent } from './components/reports-graph/reports-graph.component';
import { FilterFieldsSidepanelComponent } from './components/filter-fields-sidepanel/filter-fields-sidepanel.component';
import { FavoritesReportComponent } from './components/favorites-report/favorites-report.component';
import { ReportsSavedComponent } from './pages/reports-saved/reports-saved.component';
import { ReportsListComponent } from './pages/reports-list/reports-list.component';
import { ReportsComponent } from './reports.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';

// services
import { ReportsScheduledComponent } from './pages/reports-scheduled/reports-scheduled.component';
import { ReportService } from './services/report.service';
import { SchedulePanelComponent } from './components/schedule-panel/schedule-panel.component';
import { ReportsDetailsService } from './pages/reports-details/reports-details.service';

// pipes
import { ActiveColumnFilterPipe } from './pipes/active-column-filter.pipe';
import { ActiveColumnOrderPipe } from './pipes/active-column-order.pipe';
import { ReportsScoreConfigurationComponent } from './pages/reports-score-configuration/reports-score-configuration.component';
import { LogsModule } from '../library/logs/logs.module';
import { ReportsInviteDialogComponent } from './pages/reports-invite-dialog/reports-invite-dialog.component';
import { SortHelperPipe } from '../shared/pipe/sort-helper.pipe';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    ReportsComponent,
    ReportsListComponent,
    ReportsDetailsComponent,
    ReportsSavedComponent,
    AsidePanelComponent,
    ReportsGraphComponent,
    FilterFieldsSidepanelComponent,
    FavoritesReportComponent,
    DownloadReportComponent,
    ReportsScheduledComponent,
    SchedulePanelComponent,
    ActiveColumnFilterPipe,
    ActiveColumnOrderPipe,
    ReportsScoreConfigurationComponent,
    ReportsInviteDialogComponent
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    SharedModule,
    VmsTableModule,
    NgSelectModule,
    ClickOutsideModule,
    SvmsPieChartModule,
    SvmsLineChartModule,
    SvmsColumnChartModule,
    SvmsHorisontalColumnChartModule,
    SvmsAreaChartModule,
    SvmsBubbleChartModule,
    SvmsStackedBarChartModule,
    SvmsBarChartModule,
    SvmsSidebarNgModule,
    NgSelectModule,
    NewSharedModule,
    FormsModule,
    ReactiveFormsModule,
    DndModule,
    LogsModule,
    I18NextModule,
  ],
  exports: [
    FavoritesReportComponent,
    DndModule
  ],
  providers: [
    ReportService,
    ReportsDetailsService,
    SortHelperPipe
  ]
})
export class ReportsModule { }
