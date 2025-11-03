import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { RateFactorRoutingModule } from './rate-factor-routing.module';
import { RateFactorComponent } from './rate-factor.component';
import { RateFactorListComponent } from './rate-factor-list/rate-factor-list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from 'src/app/library/tree/tree.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { CreateRateFactorListComponent } from './create-rate-factor-list/create-rate-factor-list.component';
import { JobHierarchyCreateComponent } from './job-hierarchy-create/job-hierarchy-create.component';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [
    RateFactorComponent,
    RateFactorListComponent,
    CreateRateFactorListComponent,
    JobHierarchyCreateComponent
  ],
  imports: [
    CommonModule,
    RateFactorRoutingModule,
    SharedModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    TreeModule,
    NewSharedModule,
    I18NextModule,
  ],
  providers: [TitleCasePipe, UniqueKeyPipe],
  exports: [JobHierarchyCreateComponent]
})
export class RateFactorModule { }
