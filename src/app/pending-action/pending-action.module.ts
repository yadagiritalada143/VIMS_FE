import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingActionComponent } from './pending-action.component';
import { PendingActionRoutingModule } from './pending-action-routing.module';
import { PendingActionContentComponent } from './pending-action-content/pending-action-content.component';
import { SvmsTableModule } from '../library/svms-table/svms-table.module';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SharedModule } from '../shared/shared.module';
import { I18NextModule } from 'angular-i18next';
import { FormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PendingActionSidebarComponent } from './pending-action-sidebar/pending-action-sidebar.component';


@NgModule({
  declarations: [
    PendingActionComponent,
    PendingActionContentComponent,
    PendingActionSidebarComponent
  ],
  imports: [
    CommonModule,
    PendingActionRoutingModule,
    SvmsTableModule,
    VmsTableModule,
    NewSharedModule,
    SharedModule,
    I18NextModule,
    FormsModule,
    NgxSkeletonLoaderModule,
  ]
})
export class PendingActionModule { }
