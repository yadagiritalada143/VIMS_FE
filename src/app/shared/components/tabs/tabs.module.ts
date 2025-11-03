import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VmsTabComponent } from './vms-tab/vms-tab.component';
import { VmsTabGroupComponent } from './vms-tab-group/vms-tab-group.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [
    VmsTabComponent,
    VmsTabGroupComponent
  ],
  imports: [
    CommonModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [
    VmsTabComponent,
    VmsTabGroupComponent
  ],
})
export class TabsModule { }
