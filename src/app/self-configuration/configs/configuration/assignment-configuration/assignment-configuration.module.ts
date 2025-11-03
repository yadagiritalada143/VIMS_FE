import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignmentConfigurationRoutingModule } from './assignment-configuration-routing.module';
import { AssignmentConfigurationComponent } from './assignment-configuration.component';
import { CreateNewComponent } from './create-new/create-new.component';
import { SharedModule } from '../../../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [
    AssignmentConfigurationComponent,
    CreateNewComponent
  ],
  imports: [
    CommonModule,
    AssignmentConfigurationRoutingModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsTableModule,
    SharedModule,
    I18NextModule,
  ],
})
export class AssignmentConfigurationModule { }
