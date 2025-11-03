import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeeSettingsRoutingModule } from './fee-settings-routing.module';
import { FeeSettingsComponent } from './fee-settings.component';


@NgModule({
  declarations: [
    FeeSettingsComponent
  ],
  imports: [
    CommonModule,
    FeeSettingsRoutingModule
  ]
})
export class FeeSettingsModule { }
