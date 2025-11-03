import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditRulesComponent } from './edit-rules.component';
import { EditRulesRoutingModule } from './edit-rules-routing.module';
import { ConfigureEditRulesComponent } from './components/configure-edit-rules/configure-edit-rules.component';
import { SharedModule } from '../shared/shared.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import {FormsModule} from '@angular/forms';
import { ListEditRulesComponent } from './components/list-edit-rules/list-edit-rules.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [EditRulesComponent, ConfigureEditRulesComponent, ListEditRulesComponent],
  imports: [
    CommonModule,
    EditRulesRoutingModule,
    VmsTableModule,
    SharedModule,
    NewSharedModule,
    NgSelectModule,
    FormsModule,
    I18NextModule,
  ],
  providers: [

  ]
})
export class EditRulesModule { }
