import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { I18NextModule } from 'angular-i18next';

import { CostComponentRoutingModule } from './cost-component-routing.module';
import { CostComponentComponent } from './cost-component.component';
import { CostComponentListComponent } from './cost-component-list/cost-component-list.component';
import { CreateCostComponentComponent } from './create-cost-component/create-cost-component.component';
import { CostComponentDetailsComponent } from './cost-component-details/cost-component-details.component';


@NgModule({
  declarations: [
    CostComponentComponent,
    CostComponentListComponent,
    CreateCostComponentComponent,
    CostComponentDetailsComponent
  ],
  imports: [
    CommonModule,
    CostComponentRoutingModule,
    FormsModule,
    SharedModule,
    SvmsTableModule,
    I18NextModule,
    LogsModule
  ],
  exports: [
    CostComponentListComponent,
    CreateCostComponentComponent,
    CostComponentDetailsComponent
  ]
})
export class CostComponentModule { }
