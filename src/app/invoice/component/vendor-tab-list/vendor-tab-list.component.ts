import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';

@Component({
  selector: 'app-vendor-tab-list',
  templateUrl: './vendor-tab-list.component.html'
})
export class VendorTabListComponent implements OnInit {
  public tableConfig: VMSConfig;
 public vendorTabList ;
  constructor() { }

  ngOnInit(): void {

    this.tableConfig = {
      title: "",
      columnList: [
        { name: 'invoice_number', title: 'Invoice Number', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isOpenView: true,isNavigation: true },
        { name: 'worker_number', title: 'Worker Number', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'duration', title: 'Invoice Duration', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'type', title: 'Type', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'hours', title: 'Hours', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false }, 
        { name: 'invoice_type', title: 'Invoice Type', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'invoice_line_item', title: 'Invoice line item', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'msp_amount', title: 'MSP amount', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'msp_tax', title: 'MSP tax', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'vendor_amount', title: 'Vendor amount', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'vendor_tax', title: 'Vendor Tax amount', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
        { name: 'total_amount', title: 'total vendor amount inc. tax + fee', width: 16, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,isNoOption: true },
      ],
      showTabs: false,
      isExpand: false,
    //  isFilter: true,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      hideResultCount: false,
      isCreate: false,
      isTopHeader: true,
      density: 'COMFORTABLE',
      hideBottomPagination: false,
      tableWidth: '2000px',
      isCheckboxOption: false
    };
  }

}
