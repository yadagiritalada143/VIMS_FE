import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentConfigurationCreateComponent } from './assignment-configuration-create/assignment-configuration-create.component';
import { AssignmentConfigurationRoutingModule } from './assignment-configuration-routing.module';
import { VmsTableModule } from '.././../library/table/vms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { FormsModule } from '@angular/forms';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [AssignmentConfigurationCreateComponent],
  imports: [
    CommonModule,
    FormsModule,
    AssignmentConfigurationRoutingModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    NewSharedModule,
    I18NextModule,

  ],
})
export class AssignmentConfigurationModule { }
