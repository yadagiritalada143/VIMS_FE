import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { ReportsModule } from '../reports/reports.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SharedModule } from '../shared/shared.module';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [SettingsComponent],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    ReportsModule,
    NewSharedModule,
    SharedModule,
    I18NextModule,
  ],
})
export class SettingsModule { }
