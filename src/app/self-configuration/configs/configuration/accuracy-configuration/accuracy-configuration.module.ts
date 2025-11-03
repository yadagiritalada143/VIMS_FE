import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccuracyConfigurationRoutingModule } from './accuracy-configuration-routing.module';
import { AccuracyConfigurationComponent } from './accuracy-configuration.component';
import { SharedModule } from '../../../../shared/shared.module';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { I18NextModule } from 'angular-i18next';
import { ViewAccuracyComponent } from './view-accuracy/view-accuracy.component';
import { LogsModule } from '../../../../library/logs/logs.module';
import { NewSharedModule } from '../../../../new-shared/new-shared.module';
import { EditAccuracyComponent } from './edit-accuracy/edit-accuracy.component';
import { TryOutComponent } from './try-out/try-out.component';

@NgModule({
  declarations: [AccuracyConfigurationComponent, ViewAccuracyComponent, EditAccuracyComponent, TryOutComponent],
  imports: [
    CommonModule,
    AccuracyConfigurationRoutingModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsTableModule,
    SharedModule,
    I18NextModule,
    LogsModule,
    NewSharedModule,
  ],
})
export class AccuracyConfigurationModule {}
