import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemQualificationTypeListComponent } from './system-qualification-type-list/system-qualification-type-list.component';
import { VmsTableModule } from '../library/table/vms-table.module';
import { SystemQualificationListComponent } from './system-qualification-list/system-qualification-list.component';
import { QulificationRoutingModule } from './qualification-routing.module';
import { QualificationTypeDetailsComponent } from './qualification-type-details/qualification-type-details.component';
import { QualificationsDetailsComponent } from './qualifications-details/qualifications-details.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [SystemQualificationTypeListComponent, SystemQualificationListComponent, QualificationTypeDetailsComponent, QualificationsDetailsComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    VmsTableModule,
    QulificationRoutingModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [SystemQualificationTypeListComponent, SystemQualificationListComponent]
})
export class QualificationModule { }
