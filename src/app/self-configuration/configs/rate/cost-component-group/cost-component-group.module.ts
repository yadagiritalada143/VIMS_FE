import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { I18NextModule } from 'angular-i18next';
import { LogsModule } from 'src/app/library/logs/logs.module';

import { CostComponentGroupRoutingModule } from './cost-component-group-routing.module';
import { CostComponentGroupComponent } from './cost-component-group.component';
import { CostComponentGroupListComponent } from './cost-component-group-list/cost-component-group-list.component';
import { CreateCostComponentGroupComponent } from './create-cost-component-group/create-cost-component-group.component';
import { SelfConfigurationComponentModule } from 'src/app/self-configuration/components/self-configuration-component.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { CalculateCostComponentGroupComponent } from './calculate-cost-component-group/calculate-cost-component-group.component';
import { CostComponentGroupDetailsComponent } from './cost-component-group-details/cost-component-group-details.component';


@NgModule({
  declarations: [
    CostComponentGroupComponent,
    CostComponentGroupListComponent,
    CostComponentGroupDetailsComponent,
    CreateCostComponentGroupComponent,
    CalculateCostComponentGroupComponent
  ],
  imports: [
    CommonModule,
    CostComponentGroupRoutingModule,
    FormsModule,
    SharedModule,
    SvmsTableModule,
    I18NextModule,
    LogsModule,
    SelfConfigurationComponentModule,
    NgSelectModule,
    NewSharedModule,
  ],
  exports: [
    CostComponentGroupListComponent,
  ]
})
export class CostComponentGroupModule { }
