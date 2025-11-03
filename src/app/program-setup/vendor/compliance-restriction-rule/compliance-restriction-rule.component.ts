import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { VendorService } from '../vendor.service';

@Component({
  selector: 'app-compliance-restriction-rule',
  templateUrl: './compliance-restriction-rule.component.html',
  styleUrls: ['./compliance-restriction-rule.component.scss']
})
export class ComplianceRestrictionRuleComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  complianceRuleList: any = {};
  createComplianceRule = 'hidden';
  public editData: any;
  public viewData: any;
  public viewclick: any;
  public searchTerm: any;
  public filter: any = {} ;
  currentProgram:any;
  tableConfig: VMSConfig = {
    title: 'Compliance Restriction Rules',
    columnList: [
      { name: 'name', title: 'Title', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: this.authService.authorize('vendor_compliance_restriction_rule_manage'), isDelete: this.authService.authorize('vendor_compliance_restriction_rule_manage')},
      { name: 'status.status_list', title: 'Doc Status', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'start_date', title: 'Restricted From', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'end_date', title: 'Restricted To', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'vendor.length', title: 'Vendors', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'month', title: 'Month & Year', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'created_on', title: 'Created On', width: 15, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isCreate: this.authService.authorize('vendor_compliance_restriction_rule_manage'),
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreateButtonName: 'Rule',
    density: 'COMFORTABLE',
    // advanceFilter: [
    //   { name: 'name', title: 'Name', placeholder: 'Vendor Distribution Schedule Name', filterType: 'TEXT' },
    //   {
    //     name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
    //       { name: 'Active', value: true },
    //       { name: 'Inactive', value: false }
    //     ]
    //   },
    //   { name: 'start_date', title: 'Effective Date', filterType: 'DATERANGE' }
    // ]
  }
  public tableLoaded = false;
  isExpand = false;
  public totalPages = 1;
  public totalRecords = 30;
  public itemPerPage = 20;
  constructor(private eventStream: EventStreamService,
    private vendorService: VendorService,
    private loaderService: LoaderService,
    private storageService: StorageService,
    public confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private datePipe: LocalDateFormatPipe,
    private alertService: AlertService,
    private authService: AuthorizationService) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.subscriptions.push(this.eventStream.on(Events.CREATE_COMPLIANCE_RULE).subscribe((data) => {
      if (!data) {
        this.getComplianceRuleList();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_COMPLIANCE_RULE).subscribe((data) => {
      if (!data) {
        this.getComplianceRuleList();
      }
    }));
    this.getComplianceRuleList();
  }
  getComplianceRuleList(pageNo = 1) {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];
    this.loaderService.show();
    const url = `/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule?limit=${this.itemPerPage}&page=${pageNo}`;
    this.subscriptions.push(this.vendorService.get(url).subscribe(
      (data: any) => {
        if(data){
          this.complianceRuleList = data;
          data.vendor_compliance_rules.forEach(comp => {
            comp.start_date = this.datePipe.transform(comp.start_date, this.currentProgram?.defaultDateFormat, undefined, undefined, true, DATE_FORMAT.FORMATDDMMYY);
            comp.end_date = this.datePipe.transform(comp.end_date, this.currentProgram?.defaultDateFormat, undefined, undefined, true, DATE_FORMAT.FORMATDDMMYY);
            comp.created_on = this.datePipe.transform(comp.created_on, this.currentProgram?.defaultDateFormat, undefined, undefined, true, DATE_FORMAT.FORMATDDMMYY);
          })
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this.loaderService.hide();
        }
      },
      (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }));
  }

  onDisableClicked(event) {
    // const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    // const programId = programDetails['program_req_id'];
    // const addDataTypeForm = event;
    // const payLoad = {
    //   is_enabled: addDataTypeForm.is_enabled ? false : true,
    // }
    // this.loaderService.show();
    // this.subscriptions.push(this.vendorService.put(`/configurator/programs/${programId}/vendors/distribution-schedules/${event.id}`, payLoad).subscribe(
    //   data => {
    //     if (data) {
    //       this.alertService.success('Vendor distribution schedule updated succesfully..');
    //       event.is_enabled = !event.is_enabled;
    //       this.loaderService.hide();
    //     }
    //   },
    //   (err) => {
    //     this.alertService.error(errorHandler(err));
    //     this.loaderService.hide();
    //   }));
  }
  onCreateClick(e) {
    this.createComplianceRule = 'visible';
    this.editData = "";
    this.viewclick = false;
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_COMPLIANCE_RULE, true));
    }
  }
  onSearch(term) {
    if(term) {
      this.filter.name = term;
      this.onFilter();
    } else {
      this.getComplianceRuleList();
    }

  }
  onPaginationClick(event) {
    this.getComplianceRuleList(event);
  }
  onFilter() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];



    this.loaderService.show();
    // this.subscriptions.push(this.vendorService.post(`/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule/advanced-filters`, payLoad).subscribe(
    this.subscriptions.push(this.vendorService.get(`/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule?name=${this.filter?.name}`).subscribe(
        (data: any) => {
          if (data) {
            this.complianceRuleList = data;
            const totalPages = Math.ceil(data.total_records / data.items_per_page);
            this.totalPages = totalPages;
            this.totalRecords = data.total_records;
            this.tableLoaded = true;
            this.loaderService.hide();
          }
        },
        (err) => {
          this.alertService.error(errorHandler(err));
          this.loaderService.hide();
        }));
  }

  onListFilter(event) {
    if (event) {
      if (event.name) {
        this.filter.name = event.name;
      }
      if (event.hasOwnProperty('is_enabled')) {
        this.filter.is_enabled = event.is_enabled;
      }
      if (event?.start_date) {
        this.filter.date_range = event?.start_date;
      }
      this.onFilter();
    } else {
      this.getComplianceRuleList();
    }
  }
  onSortClick(event) {
  }

  onCloseCreateComplianceRule(event) {
    this.createComplianceRule = 'hidden';
    this.editData = "";
    this.viewclick = false;
  }

  onEditClick(event) {
    let obj = { "event": true, "data": event };
    this.createComplianceRule = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_COMPLIANCE_RULE, obj))
  }

  onClickView(event) {
    let obj = { "event": true, "data": event };
    this.createComplianceRule = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VIEW_COMPLIANCE_RULE, obj));

  }
  onDeleteClick(event) {
    this.confirmService.confirm('', `Are you sure to delete the Compliance Rule?`,
    // this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
      'Yes', 'No').then((confirmed) => {
        if (confirmed) {
          const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
          const programId = programDetails['program_req_id'];
          this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule/${event.id}`).subscribe(
            data => {
              if (data) {
                this.alertService.success(`You have deleted compliance rule successfully.`);
                this.getComplianceRuleList();
              }
            },
            (err) => {
              this.alertService.error(errorHandler(err));
            }
          ));
        }
      });
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
