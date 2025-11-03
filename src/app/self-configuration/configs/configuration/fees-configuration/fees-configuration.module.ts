import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

import { FeesConfigurationRoutingModule } from './fees-configuration-routing.module';
import { FeesConfigurationComponent } from './fees-configuration.component';
import { CreateNewComponent } from './create-new/create-new.component';
import { SharedModule } from '../../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';

import { ListComponent } from './list/list.component';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [
    FeesConfigurationComponent,
    CreateNewComponent,
    ListComponent,
    DetailPageComponent
  ],
  imports: [
    CommonModule,
    FeesConfigurationRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TreeviewModule.forRoot(),
    SvmsTableModule,
    I18NextModule
  ],
  providers: [TitleCasePipe]
})
export class FeesConfigurationModule { }
