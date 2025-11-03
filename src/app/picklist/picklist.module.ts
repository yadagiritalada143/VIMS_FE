import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PicklistRoutingModule } from './picklist-routing.module';
import { PicklistComponent } from './picklist.component';
import { ListPicklistComponent } from './list-picklist/list-picklist.component';
import { PicklistFlyoutComponent } from './picklist-flyout/picklist-flyout.component';
import { SharedModule } from '../shared/shared.module';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PicklistTableComponent } from './components/picklist-table/picklist-table.component';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [
    PicklistComponent,
    ListPicklistComponent,
    PicklistFlyoutComponent,
    PicklistTableComponent
  ],
  imports: [
    CommonModule,
    PicklistRoutingModule,
    SharedModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [
    PicklistFlyoutComponent
  ]
})
export class PicklistModule { }
