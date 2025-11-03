import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
// import { IconComponent } from '../shared/components/icon/icon.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { InvoiceRoutingModule } from './invoice-routing.module';
import { IndividualInvoiceListComponent } from './component/individual/individual-invoice-list/individual-invoice-list.component';
import { ConsolidatedInvoiceBasicDetailComponent } from './component/consolidated/consolidated-invoice-basic-details/consolidated-invoice-basic-details.component';
import { ConsolidateInvoiceDetailsComponent } from './component/consolidated/consolidate-invoice-details/consolidate-invoice-details.component';
import { PaymentAuthorizationSidebarComponent } from './component/consolidated/payment-authorization-sidebar/payment-authorization-sidebar.component';
import { SvmsSidebarNgModule } from '../library/svms-sidebar-ng/svms-sidebar-ng.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JobsModule } from '../jobs/jobs.module';
import { JobDetailsModule } from '../jobs/job-details/job-details.module';
import { CreditDebitComponent } from './component/credit-debit/credit-debit.component';
import { ConsolidatedInvoiceListComponent } from './component/consolidated/consolidated-invoice-list/consolidated-invoice-list.component';
import { VendorPaymentComponent } from './component/consolidated/vendor-payment/vendor-payment.component';
import { VendorPaymentAuthorizationComponent } from './component/consolidated/vendor-payment-authorization/vendor-payment-authorization.component';
import { VendorPaymentSummaryComponent } from './component/consolidated/vendor-payment-summary/vendor-payment-summary.component';
import { VendorTabListComponent } from './component/vendor-tab-list/vendor-tab-list.component';
import { SvmsPieMiniChartModule } from '../library/charts/svms-pie-mini-chart/svms-pie-mini-chart.module';
import { ClientPaymentRollbackComponent } from './component/consolidated/client-payment-rollback/client-payment-rollback.component';
import { InvoiceViewSidepanelComponent } from './component/invoice-view-sidepanel/invoice-view-sidepanel.component';
import { InvoiceTransactionCompleteComponent } from './component/consolidated/transaction-complete/transaction-complete.component';
import { CancelConsolidatedInvoiceComponent } from './component/consolidated/cancel-consolidated-invoice/cancel-consolidated-invoice.component';
import { VendorPaymentRollbackComponent } from './component/consolidated/vendor-payment-rollback/vendor-payment-rollback.component';
import { InvoiceClientPaymentComponent } from './component/invoice-client-payment/invoice-client-payment.component';
import { CreateNewPaymentSidebarComponent } from './component/consolidated/create-new-payment-sidebar/create-new-payment-sidebar.component';
import { LogsModule } from '../library/logs/logs.module';
import { InvoiceDetailsSidepanelComponent } from './component/invoice-details-sidepanel/invoice-details-sidepanel.component';
import { I18NextModule } from 'angular-i18next';
import { InvoiceDetailsPageComponent } from './component/invoice-details-page/invoice-details-page.component';

@NgModule({
  declarations: [IndividualInvoiceListComponent,InvoiceClientPaymentComponent, CreateNewPaymentSidebarComponent, ConsolidatedInvoiceBasicDetailComponent, ConsolidateInvoiceDetailsComponent,VendorPaymentRollbackComponent,
    PaymentAuthorizationSidebarComponent, InvoiceTransactionCompleteComponent, CreditDebitComponent, ConsolidatedInvoiceListComponent, VendorPaymentComponent, VendorPaymentAuthorizationComponent,
    VendorPaymentSummaryComponent, VendorTabListComponent, ClientPaymentRollbackComponent, InvoiceViewSidepanelComponent, CancelConsolidatedInvoiceComponent, InvoiceDetailsSidepanelComponent, InvoiceDetailsPageComponent],
  imports: [
    CommonModule,
    InvoiceRoutingModule,
    LogsModule,
    SharedModule,
    NgSelectModule,
    NgxSkeletonLoaderModule,
    SvmsSidebarNgModule,
    NewSharedModule,
    VmsTableModule,
    JobsModule,
    JobDetailsModule,
    ReactiveFormsModule,
    FormsModule,
    SvmsPieMiniChartModule,
    I18NextModule,
  ],
})
export class InvoiceModule { }
