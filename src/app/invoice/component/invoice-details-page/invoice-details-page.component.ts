import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { InvoiceService } from '../../service/invoice.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AccuracyConfigEnum, UsersType } from 'src/app/shared/enums';
import { ActivatedRoute, Router } from '@angular/router';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { InvoiceType } from '../../enums/Individual-invoice.enum';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-invoice-details-page',
  templateUrl: './invoice-details-page.component.html',
  styleUrls: ['./invoice-details-page.component.scss']
})
export class InvoiceDetailsPageComponent implements OnInit {
  dataLoader: boolean = true;
  dataLoading: boolean = true;
  totalRecords: number = 0;
  itemPerPage: number = 10;
  countData: number = 0;
  detailedValue: string = "basicDetails";
  tableConfig: VMSConfig;
  public vmsData: any;
  isDetails = 'hidden';
  subscriptions = [];
  accuracyEnum = AccuracyConfigEnum;
  invoiceDetails: any;
  workerDetails: any;
  currency: string;
  invoiceId: string;
  navigation: any = {};
  public userType = this.storageService.get('user_type');
  constructor(
    private invoiceService: InvoiceService,
    private localDatePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    public storageService: StorageService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private timesheetService: TimesheetService,
    private loader: LoaderService,
  ) { }

  ngOnInit(): void {
    this.dataLoader = false;
    this.tableConfig = {
      title: '',
      columnList: [
        { name: 'invoice_number', title: 'Invoice ID', isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, toolTipVisibility: true },
        { name: 'invoice_status', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'invoice_type', title: 'Invoice Type', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ts_es_code', title: 'Invoice Type ID', isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true, isOpenView: true, isSort: true },
        { name: 'consolidate_invoice.invoice_number', title: 'Consolidate ID', isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, isNavigation: true, isOpenView: true, isSort: true },
        { name: 'consolidate_invoice.created_at', title: 'Consolidate Date', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'calculation.amount_with_tax', title: 'Total Amount', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      ],
      showTabs: false,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isSelectSubmitButton: false,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: "100%",
    };
    this.invoiceHistoryData();
    this.dataLoading = false;
    this.totalRecords = 0;
    this.countData = 0;
    this.invoiceId = this.activatedRoute.snapshot.params.id;
    this.invoiceDetails = [];
    this.getInvoiceDetails(this.invoiceId);
  }
  detailCollapse(value) {
    this.detailedValue = value;
  }
  onPaginationClick(event) {

  }

  invoiceHistoryData() {
    this.vmsData = {
      // "invoice": [
      //   {
      //     "invoiceid": "AMF-IN-008862",
      //     "status": "Approved",
      //     "invoice_type": "Timesheet",
      //     "invoice_type_id": "AMF-TS-6604",
      //     "consolidate_id": "AMF-CNV-3619",
      //     "consolidate_date": "06/06/2023",
      //     "total_amount": "811.6000",
      //   },
      //   {
      //     "invoiceid": "AMF-IN-008845",
      //     "status": "Draft",
      //     "invoice_type": "By Milestone",
      //     "invoice_type_id": "AMF-CNV-3595",
      //     "consolidate_id": "AMF-CNV-3619",
      //     "consolidate_date": "03/21/2023",
      //     "total_amount": "500.0000",
      //   },
      // {
      //   "invoiceid": "AMF-IN-008862",
      //   "status": "Approved",
      //   "invoice_type": "Timesheet",
      //   "invoice_type_id": "AMF-TS-6604",
      //   "consolidate_id": "AMF-CNV-3619",
      //   "consolidate_date": "06/06/2023",
      //   "total_amount": "811.6000",
      // }
      // ]
    }
  }

  getInvoiceDetails(invoice_uuid) {
    this.loader.show();
    this.invoiceService.getInvoiceDetailForFlyout(invoice_uuid).subscribe(
      (res: any) => {
        if (res?.data?.all_invoices && Array.isArray(res?.data?.all_invoices)) {
          res.data.all_invoices = res?.data?.all_invoices?.map(d => {
            d.type = d?.invoice_type?.toLowerCase() === InvoiceType?.ByMilestone?.toLowerCase() ? InvoiceType?.ProgressUpdate : this.capitalizeWords(d?.invoice_type);
            return d;
          })
        }
        this.invoiceDetails = res?.data;
        this.invoiceDetails.type = this.invoiceDetails?.invoice_type?.toLowerCase() === InvoiceType?.ByMilestone?.toLowerCase() ? InvoiceType?.ProgressUpdate : this.capitalizeWords(this.invoiceDetails?.invoice_type);

        let { worker, invoice_currency } = this.invoiceDetails;
        this.currency = invoice_currency;
        this.workerDetails = worker;
        this.loader.hide();
      }
    );
  }

  capitalizeWords(string) {
    return string?.replace(/(?:^|\s)\S/g, function (a) {
      return a?.toUpperCase();
    });
  }
  clearForm() {
    this.isDetails = 'hidden';
  }

  getDate(d, noDateConversion) {
    if (!d) {
      return '--';
    }
    return this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion);
  }

  getDateTime(d, noDateConversion) {
    if (!d) {
      return '--';
    }
    return `${this.localDatePipe.transform(d, undefined, undefined, undefined, noDateConversion)} ${this.localDatePipe.transform(d, 'h:mm a z', undefined, undefined, noDateConversion)}`;
  }

  navigateToAssignmentId() {
    this.router.navigate([`assignment/details/${this.invoiceDetails?.assignment_uuid}/final?tab=assignment`])
  }
  naigateOnInvoiceTypeId() {
    if (this.invoiceDetails.type.toLowerCase() == 'timesheet') {
      let timeSheetData: any = {};
      this.invoiceService.getTimesheetBasicInfo(this.invoiceDetails.invoice_type_uuid).subscribe(res => {
        if (res.data) {
          timeSheetData.assignment_code = res.data.assignment_code;
          timeSheetData.assignment_id = res.data.assignment_id;
          timeSheetData.assignment_title = res.data.assignment_title;
          timeSheetData.user_id = res?.data?.worker?.id,
            timeSheetData.parent_type = res?.data?.parent_type,
            timeSheetData.child_type = res.data.child_type;
          timeSheetData.currency = res.data.currency;
          timeSheetData.end_date = res.data.end_date;
          timeSheetData.start_date = res.data.start_date;
          timeSheetData.status = res.data.status;
          timeSheetData.timesheet_uuid = this.invoiceDetails.invoice_type_uuid;
          timeSheetData.meta_data = res.data.meta_data;
          this.navigation.meta_data = res.data.meta_data;
          this.storageService.set('timeSheetData', timeSheetData, true);
          this.router.navigate([this.timesheetService.getTimesheetNavigationRoute(undefined, this.navigation)]);
        }
      });
    } else if (this.invoiceDetails.type.toLowerCase() == 'expense' || this.invoiceDetails.type.toLowerCase() == 'misc expense') {
      this.router.navigate([`expense/${this.invoiceDetails.invoice_type_uuid}`]);
    } else if (this.invoiceDetails?.type?.toLowerCase() == 'sow' || this.invoiceDetails?.type?.toLowerCase() == 'progress update') {
      const user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
      if (user_type === UsersType.VENDOR?.toLowerCase()) {
        this.router.navigate([
          `/vendor_sow/${this.invoiceDetails.invoice_type_uuid}/vendor_milestones/${this.invoiceDetails.sow_progress_info.sow_progress_info.id}/invoicing/${this.invoiceDetails.invoice_type_uuid}/detail`,
        ]);
      } else {
        this.router.navigate([
          `/sow/${this.invoiceDetails.invoice_type_uuid}/milestones/${this.invoiceDetails?.sow_progress_info?.id}/invoicing/${this.invoiceDetails.invoice_uuid}/detail`,
        ]);
      }
    }
  }

  onClickView(event) {
    if (event.column && event.column == "invoice_number") {
      this.getInvoiceDetails(event?.invoice_uuid);
      document.body.scrollTop = document.documentElement.scrollTop = 0
    }
    else {
     if(event.column && event.column == 'consolidate_invoice.invoice_number') {
        this.router.navigate([`/invoice/consolidate-invoice-details/${event?.consolidate_invoice.invoice_uuid}/Client%20Bill`])
    } else {
      if (event && event.type) {
        if (event.type.toLowerCase() == 'timesheet') {
          let timeSheetData: any = {};
          this.invoiceService.getTimesheetBasicInfo(event.invoice_type_uuid).subscribe(res => {
            if (res.data) {
              timeSheetData.assignment_code = res.data.assignment_code;
              timeSheetData.assignment_id = res.data.assignment_id;
              timeSheetData.assignment_title = res.data.assignment_title;
              timeSheetData.user_id = res?.data?.worker?.id,
                timeSheetData.parent_type = res?.data?.parent_type,
                timeSheetData.child_type = res.data.child_type;
              timeSheetData.currency = res.data.currency;
              timeSheetData.end_date = res.data.end_date;
              timeSheetData.start_date = res.data.start_date;
              timeSheetData.status = res.data.status;
              timeSheetData.timesheet_uuid = event.invoice_type_uuid;
              timeSheetData.meta_data = res.data.meta_data;
              this.navigation.meta_data = res.data.meta_data;
              this.storageService.set('timeSheetData', timeSheetData, true);
              this.router.navigate([this.timesheetService.getTimesheetNavigationRoute(undefined, this.navigation)]);
            }
          });
        } else if (event.type.toLowerCase() == 'expense' || event.type.toLowerCase() == 'misc expense') {
          this.router.navigate([`expense/${event.invoice_type_uuid}`]);
        } else if (event?.type?.toLowerCase() == 'sow' || event?.type?.toLowerCase() == 'progress update') {
          const user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
          if (user_type === UsersType.VENDOR?.toLowerCase()) {
            this.router.navigate([
              `/vendor_sow/${event.invoice_type_uuid}/vendor_milestones/${event.sow_project_uuid}/invoicing/${event.invoice_uuid}/detail`,
            ]);
          } else {
            this.router.navigate([
              `/sow/${event.invoice_type_uuid}/milestones/${this.invoiceDetails?.sow_progress_info?.id}/invoicing/${event.invoice_uuid}/detail`,
            ]);
          }
        }
      }
    }
  }
    // if (event && event.type) {
    //   if (event.type.toLowerCase() == 'timesheet') {
    //     let timeSheetData: any = {};
    //     this.invoiceService.getTimesheetBasicInfo(event.invoice_type_uuid).subscribe(res => {
    //       if (res.data) {
    //         timeSheetData.assignment_code = res.data.assignment_code;
    //         timeSheetData.assignment_id = res.data.assignment_id;
    //         timeSheetData.assignment_title = res.data.assignment_title;
    //         timeSheetData.user_id = res?.data?.worker?.id,
    //         timeSheetData.parent_type = res?.data?.parent_type,
    //         timeSheetData.child_type = res.data.child_type;
    //         timeSheetData.currency = res.data.currency;
    //         timeSheetData.end_date = res.data.end_date;
    //         timeSheetData.start_date = res.data.start_date;
    //         timeSheetData.status = res.data.status;
    //         timeSheetData.timesheet_uuid = event.invoice_type_uuid;
    //         timeSheetData.meta_data = res.data.meta_data;
    //         this.navigation.meta_data = res.data.meta_data;
    //         this.storageService.set('timeSheetData', timeSheetData, true);
    //         this.router.navigate([this.timesheetService.getTimesheetNavigationRoute(undefined, this.navigation)]);
    //       }
    //     });
    //   } else if (event.type.toLowerCase() == 'expense' || event.type.toLowerCase() == 'misc expense') {
    //     this.router.navigate([`expense/${event.invoice_type_uuid}`]);
    //   } else if (event?.type?.toLowerCase() == 'sow' || event?.type?.toLowerCase() == 'progress update') {
    //     const user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    //     if (user_type === UsersType.VENDOR?.toLowerCase()) {
    //       this.router.navigate([
    //         `/vendor_sow/${event.invoice_type_uuid}/vendor_milestones/${event.sow_project_uuid}/invoicing/${event.invoice_uuid}/detail`,
    //       ]);
    //     } else {
    //       this.router.navigate([
    //         `/sow/${event.invoice_type_uuid}/milestones/${this.invoiceDetails?.sow_progress_info?.id}/invoicing/${event.invoice_uuid}/detail`,
    //       ]);
    //     }
    //   }
    // }
  }

  onRowChecked(event) {

  }
}
