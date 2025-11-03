
import { NgModule } from '@angular/core';
import { SelectorModalComponent } from './selector-modal/selector-modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { I18NextModule } from 'angular-i18next';
import { LogsModule } from 'src/app/library/logs/logs.module';
import { SvmsTableModule } from 'src/app/library/svms-table/svms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';

@NgModule({
  declarations: [SelectorModalComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    PerfectScrollbarModule,
    SvmsTableModule,
    NewSharedModule,
    I18NextModule,
    LogsModule,
    NgxSkeletonLoaderModule,
  ],
  exports: [SelectorModalComponent]
})
export class SelfConfigurationComponentModule { }
