import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { ConsolidatedInvoiceListComponent } from './component/consolidated/consolidated-invoice-list/consolidated-invoice-list.component';
import { ConsolidateInvoiceDetailsComponent } from './component/consolidated/consolidate-invoice-details/consolidate-invoice-details.component';
import { IndividualInvoiceListComponent } from './component/individual/individual-invoice-list/individual-invoice-list.component';
import { VendorPaymentComponent } from './component/consolidated/vendor-payment/vendor-payment.component';
import { InvoiceClientPaymentComponent } from './component/invoice-client-payment/invoice-client-payment.component';
import { InvoiceDetailsPageComponent } from './component/invoice-details-page/invoice-details-page.component';


const routes: Routes = [
  {
    path: '',

    children: [

      // { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'individual-list', component: IndividualInvoiceListComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['menu_submenu_individual_invoices']
        }
      },
      {
        path: 'consolidate-invoice-details/:invoiceId/:invoiceTab', component: ConsolidateInvoiceDetailsComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['menu_consolidate_invoices']
        }
      },
      {
        path: 'consolidated-list', component: ConsolidatedInvoiceListComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['menu_consolidate_invoices']
        }
      },
      {
        path: 'consolidated-invoice-vendor-payment/:invoice_UUID/:payment_id', component: VendorPaymentComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['view_vendor_payments']
        }
      },
      {
        path: 'invoice-client-payment', component: InvoiceClientPaymentComponent , canActivateChild: [AuthguardService], data: {
          userRoles: ['view_client_payment']
        }
      },
      {
        path: 'invoice-details/:id', component: InvoiceDetailsPageComponent, canActivateChild: [AuthguardService], data: {
          userRoles: ['menu_submenu_individual_invoices']
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceRoutingModule { }
