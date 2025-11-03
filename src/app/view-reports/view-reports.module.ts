import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//modules
import { ViewReportsRoutingModule } from './view-reports-routing.module';
import { SharedModule } from '../shared/shared.module';

//components
import { ViewReportsComponent } from './view-reports.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

//services
import { NewSharedModule } from '../new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';

import { OAuthModule } from 'angular-oauth2-oidc';


@NgModule({
  declarations: [
    ViewReportsComponent
  ],
  imports: [
    CommonModule,
    ViewReportsRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    NewSharedModule,
    I18NextModule,
    OAuthModule.forRoot(),
  ],
  providers: [
  ],
  exports: []
})
export class ViewReportsModule { }
