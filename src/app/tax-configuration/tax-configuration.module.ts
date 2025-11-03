import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaxConfigurationRoutingModule } from './tax-configuration-routing.module';
import { TaxConfigurationComponent } from './tax-configuration.component';
import { TaxListingComponent } from './tax-listing/tax-listing.component';
import { TaxDetailsComponent } from './tax-details/tax-details.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { UniqueKeyPipe } from '../shared/pipe/unique-key.pipe';
import { TaxHistoryComponent } from './tax-history/tax-history.component';
import { TaxSystemListComponent } from './components/tax-system-list/tax-system-list.component';
import { TaxTableComponent } from './components/tax-table/tax-table.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { LogsModule } from '../library/logs/logs.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [TaxConfigurationComponent, TaxListingComponent, TaxDetailsComponent, TaxSystemListComponent, TaxTableComponent,TaxHistoryComponent],
  imports: [
    CommonModule,
    TaxConfigurationRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    NgSelectModule,
    NgbNavModule,
    PerfectScrollbarModule,
    LogsModule,
    I18NextModule,
  ],
  providers: [UniqueKeyPipe]
})
export class TaxConfigurationModule { }
