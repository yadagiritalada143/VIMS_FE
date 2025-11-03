import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//modules
import { ViewDashboardRoutingModule } from './view-dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';

//components
import { ViewDashboardComponent } from './view-dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

//services
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [
    ViewDashboardComponent
  ],
  imports: [
    CommonModule,
    ViewDashboardRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    NewSharedModule,
    I18NextModule,
  ],
  providers: [
  ],
  exports: []
})
export class ViewDashboardModule { }
