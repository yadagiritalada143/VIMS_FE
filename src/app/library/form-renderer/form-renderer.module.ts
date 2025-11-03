import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthInterceptor } from 'src/app/core/interceptors/auth.interceptor';
import { SvmsHierarchyModule } from 'src/app/library/hierarchy/hierarchy.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { SharedModule } from '../../shared/shared.module';
import { VmsTableModule } from '../smartTable/vms-table.module';
import { FieldGroupHandlerComponent } from './components/field-group-handler/field-group-handler.component';
import { FieldHandlerComponent } from './components/field-handler/field-handler.component';
import { NavTabsHandlerComponent } from './components/nav-tabs-handler/nav-tabs-handler.component';
import { FormRendererComponent } from './form-renderer.component';
import { FormRendererService } from './form-renderer.service';
import { ImpactedExpensesTableComponent } from './impacted-expenses-table/impacted-timesheet-table/impacted-expenses-table.component';
import { ImpactedTimesheetTableComponent } from './impacted-timesheet/impacted-timesheet-table/impacted-timesheet-table.component';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [FormRendererComponent, NavTabsHandlerComponent, FieldGroupHandlerComponent, FieldHandlerComponent, ImpactedTimesheetTableComponent,ImpactedExpensesTableComponent],
  imports: [
    CommonModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SvmsHierarchyModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [FormRendererComponent, FieldHandlerComponent, ImpactedTimesheetTableComponent, ImpactedExpensesTableComponent],
  providers: [FormRendererService, {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }]
})
export class FormRendererModule { }
