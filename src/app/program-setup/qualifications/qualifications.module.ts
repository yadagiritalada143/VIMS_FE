import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { QualificationsRoutingModule } from './qualifications-routing.module';
import { QualificationsComponent } from './qualifications.component';
import { CreateQualificationTypeComponent } from './create-qualification-type/create-qualification-type.component';
import { CreateQualificationComponent } from './create-qualification/create-qualification.component';
import { ListQualificationsComponent } from './list-qualifications/list-qualifications.component';
import { ListQualificationTypesComponent } from './list-qualification-types/list-qualification-types.component';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from 'src/app/library/tree/tree.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [QualificationsComponent, CreateQualificationTypeComponent, CreateQualificationComponent, ListQualificationsComponent, ListQualificationTypesComponent],
  imports: [
    CommonModule,
    QualificationsRoutingModule,
    SharedModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    TreeModule,
    NewSharedModule,
    I18NextModule,
  ], exports: [
    CreateQualificationTypeComponent,
    CreateQualificationComponent
  ]
})
export class QualificationsModule { }
