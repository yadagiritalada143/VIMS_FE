import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { GraphCallbackComponent } from './component/graph-callback/graph-callback.component';
import { FormBuilderModule } from 'src/app/library/form-builder/form-builder.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [MainComponent,GraphCallbackComponent],
  imports: [CommonModule, MainRoutingModule, SharedModule,
    FormBuilderModule, InvoiceModule, NgbModule, I18NextModule],
  exports: []
})
export class MainModule { }
