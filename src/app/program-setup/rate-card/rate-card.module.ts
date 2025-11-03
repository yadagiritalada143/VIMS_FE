import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { RateCardRoutingModule } from './rate-card-routing.module';
import { RateCardComponent } from './rate-card.component';
import { RateCardListComponent } from './rate-card-list/rate-card-list.component';
import { CreateRateCardComponent } from './create-rate-card/create-rate-card.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditRateCardComponent } from "./edit-rate-card/edit-rate-card.component";
import { ViewRateCardComponent } from "./view-rate-card/view-rate-card.component";
import { RateCardHeaderComponent } from './components/rate-card-header/rate-card-header.component';
import { RateCardDetailsComponent } from './rate-card-details/rate-card-details.component';
import { HeaderIconComponent } from './components/rate-card-header/header-icon/header-icon.component';
import { RateCardUomComponent } from './components/rate-card-uom/rate-card-uom.component';
import { RateCardDetailsDataComponent } from './components/rate-card-details-data/rate-card-details-data.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { TabComponent } from './components/tabs/tab/tab.component';
import { AddRateComponent } from "./components/add-rate/add-rate.component";
import { EditRateComponent } from "./components/edit-rate/edit-rate.component";
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { RateCardUomFilterComponent } from './components/rate-card-uom-filter/rate-card-uom-filter.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    RateCardComponent,
    RateCardListComponent,
    CreateRateCardComponent,
    RateCardHeaderComponent,
    EditRateCardComponent,
    ViewRateCardComponent,
    AddRateComponent,
    RateCardDetailsComponent,
    HeaderIconComponent,
    RateCardUomComponent,
    RateCardDetailsDataComponent,
    TabsComponent,
    TabComponent,
    EditRateComponent,
    RateCardUomFilterComponent
  ],
  imports: [
    CommonModule,
    RateCardRoutingModule,
    SharedModule,
    VmsTableModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [
    RateCardDetailsComponent,
    ViewRateCardComponent,
    EditRateCardComponent,
    CreateRateCardComponent
  ]
})
export class RateCardModule { }
