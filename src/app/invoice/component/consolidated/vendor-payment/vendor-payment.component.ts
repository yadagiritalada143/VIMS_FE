import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { InvoiceService } from '../../../service/invoice.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { Location } from '@angular/common';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-vendor-payment',
  templateUrl: './vendor-payment.component.html',
  styleUrls: ['./vendor-payment.component.scss']
})
export class VendorPaymentComponent implements OnInit {

  consolidatedInvoiceId;
  consolidatedInvoiceDetails;
  paymentAllocationID;
  paymentAllocationDetails;

  vendorInvoicesData;
  vendorInvoices;
  vendors;
  selectedVendor;
  invoiceTotal = 0;
  invGrandTotal = 0;
  voucherId = null;
  payNow = true;
  logs:Log = undefined;
  constructor(private route: ActivatedRoute, private service: InvoiceService, public location:Location, 
    private _alerts: AlertService, private router: Router, private authorizationService: AuthorizationService) {

  }

  ngOnInit(): void {
    this.payNow = this.authorizationService.authorize('view_pay_now');

    this.route.paramMap.subscribe((route: any) => {
      this.consolidatedInvoiceId = route.params.invoice_UUID;
      this.paymentAllocationID = route.params.payment_id;
      this.loadVendors();
      this.getPaymentAllowcationDetails();
      this.getConsolidatedInvoiceDetails();
      this.generateVoucherInfo();
    });

  }

  generateVoucherInfo() {
    this.service.getVoucherDetailes().subscribe(resp => {
      this.voucherId = resp?.data?.voucher_number;
    });

  }
  goBack() {
    this.router.navigateByUrl(`invoice/consolidate-invoice-details/${this.consolidatedInvoiceId}/Client%20Payment`);
  }
  getConsolidatedInvoiceDetails() {
    this.service.getConsolidatedInvoiceBasiDetail(this.consolidatedInvoiceId).subscribe(res => {
      this.consolidatedInvoiceDetails = res.data;
    }
    );
  }
  selectionChangedHandler() {
    this.invoiceTotal = 0;
    this.invGrandTotal = 0;
    this.vendorInvoices.forEach(invoice => {
      if (invoice.isSelected ) {
        this.invoiceTotal = Number((this.invoiceTotal + (+invoice.vendor_amount.vendor_amount)).toFixed(8));
      }
      this.invGrandTotal += (+invoice.vendor_amount.vendor_amount);

    });
  }

  loadVendors() {
    this.service.getVendors(this.consolidatedInvoiceId).subscribe(res => {
      this.vendors = res.data.map(vendors => vendors.vendor)
    }
    );
  }

  loadVendorInvoices(vendorId) {
    this.invoiceTotal = 0;
    if (vendorId) {
      this.selectedVendor = this.vendors.find(v => v.id === vendorId);
      this.service.getVendorInvoices(this.consolidatedInvoiceId, vendorId).subscribe(res => {
        this.vendorInvoicesData = res.data.vendor[vendorId];
        // this.vendorInvoices = this.vendorInvoicesData.data;
        this.vendorInvoices = this.vendorInvoicesData.data.filter(v => v.is_payment_done === false);
        this.buildGroups();

      });
    }
  }

  buildGroups() {
    let groups = {};
    let list = []
    this.vendorInvoices.forEach(invoice => {
      if(!groups[invoice.group_id]) {
        invoice.isParent = true;
        groups[invoice.group_id] = [invoice]
      } else {
        groups[invoice.group_id].push(invoice);
      }
    });
    Object.keys(groups).forEach(group_id => {
      list = list.concat(
        groups[group_id]
      );
    })
    this.vendorInvoices = list;
  }

  getPaymentAllowcationDetails() {
    this.service.getPaymentAllowcationDetails(this.paymentAllocationID).subscribe(details => {
      this.paymentAllocationDetails = details;
    })
  }

  createVendorAllocation(paymentDetails) {
    let req = {
      "invoice_uuids": [],
      "vendor_uuid": this.selectedVendor,
      "msp_total_amount": 0,
      "total_amount": this.invoiceTotal,
      "vendor_amount": 0,
      "voucher_number": this.voucherId,
      // TODO :: Need to use actual date
      "voucher_date": paymentDetails.voucherDateTime,
      "voucher_amount": this.invoiceTotal,
      "notes": paymentDetails.notes,
      "payment_reference": paymentDetails.referenceNumber
    };

    let totMspAmount = 0;
    let totVendorAmount = 0;

    this.vendorInvoices.forEach(invoice => {
      if (invoice.isSelected) {
        req.vendor_uuid = invoice.vendor.id;
        req.invoice_uuids.push(invoice.invoice_id);
        totMspAmount += (+invoice.msp_amount.msp_amount);
        totVendorAmount += (+invoice.vendor_amount.vendor_amount);

      }
    });
    req.msp_total_amount = totMspAmount;
    req.vendor_amount = totVendorAmount;

    this.service.createVendorAllocation(req, this.paymentAllocationID).subscribe(res => {
      this._alerts.success('Vendor Payment Successful.', { color: 'black', bgColor: 'lightgreen' });
      const consolidatedRouter = `/invoice/consolidate-invoice-details/${this.consolidatedInvoiceId}/Vendor Payment`;
      this.router.navigate([consolidatedRouter]);
    }, (error) => {
      this.showError(error);
    });
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ? err?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }

}
