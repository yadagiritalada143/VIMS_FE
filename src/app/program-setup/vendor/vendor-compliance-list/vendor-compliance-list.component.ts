import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { VendorDocumentGroupListComponent } from '../vendor-document-group-list/vendor-document-group-list.component';
import { VendorService } from '../vendor.service';
import has = Reflect.has;

@Component({
  selector: 'app-vendor-compliance-list',
  templateUrl: './vendor-compliance-list.component.html',
  styleUrls: ['./vendor-compliance-list.component.scss']
})
export class VendorComplianceListComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  vendorComplianceList: any = [];
  createManageVendorCompliance = 'hidden';
  newDocumentVisibility = 'hidden';
  public editData: any;
  public viewData: any;
  public viewclick: any;
  public searchTerm: any;
  public filter: any = {};
  documentGroupListComponent = VendorDocumentGroupListComponent;


  tableConfig: VMSConfig = {
    title: 'Vendor Compliance',
    columnList: [
      {name: 'name', title: 'Document Title', width: 40, isIcon: false, isImage: true, isContact: false, isNumberBadge: false},
      {name: 'description', title: 'Description', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      {name: 'frequency', title: 'Frequency', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      {
        name: 'is_enabled',
        title: 'Status',
        width: 15,
        isIcon: false,
        isImage: false,
        isContact: false,
        isVieworEdit: true,
        isDisableorDelete: this.accessControlService.accessControl(),
        isDelete: this.accessControlService.accessControl(),
        isNumberBadge: false
      }
    ],
    tabsList: ['Document List', 'Document Group'],
    showTabs: true,
    isCreate: true,
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreateButtonName: 'Add New Document',
    density: 'COMFORTABLE',
    advanceFilter: [
      {name: 'name', title: 'Name', placeholder: 'Vendor Compliance Name', filterType: 'TEXT'},
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          {name: 'Active', value: true},
          {name: 'Inactive', value: false}
        ]
      }
    ]
  };

  public tableLoaded = false;
  isExpand = false;
  public status: any;
  public totalPages = 1;
  public totalRecords = 30;
  public itemPerPage = 20;
  public programId: string;

  constructor(private eventStream: EventStreamService,
              private router: SvmsRouterService,
              private vendorService: VendorService,
              private loaderService: LoaderService,
              private storageService: StorageService,
              private accessControlService: AccessControlService,
              private location: Location,
              public confirmService: ConfirmationDialogService,
              private alertService: AlertService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_COMPLIANCE).subscribe((data:any) => {
      if (!data) {
        this.getVendorComplianceListItems();
      }
    }));
    this.getVendorComplianceListItems();
  }

  getVendorComplianceListItems(pageNo = 1) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails?.program_req_id;
    this.loaderService.show();
    const url = `/configurator/programs/${programId}/vendor-compliance/required-documents?limit=${this.itemPerPage}&page=${pageNo}`;
    this.subscriptions.push(this.vendorService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.vendorComplianceList = data.required_documents;
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

    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails?.program_req_id;
    const payload = {
      name: event?.name,
      document_number: event?.document_number,
      frequency: event?.frequency,
      days_to_upload: event?.days_to_upload,
      days_to_regain_compliance: event?.days_to_regain_compliance,
      is_required_for_onboarding: event?.is_required_for_onboarding,
      is_enabled: !event.is_enabled
    };

    this.loaderService.show();
    this.vendorService.put(`/configurator/programs/${programId}/vendor-compliance/required-documents/${event.id}`, payload)
      .subscribe(
        (data:any) => {
          if (data) {
            this.alertService.success(`You have updated Document successfully.`);
            this.loaderService.hide();
            event.is_enabled = !event.is_enabled;
          }
        },
        (err) => {
          this.alertService.error(errorHandler(err));
          this.loaderService.hide();
        });
  }

  onTabClick(e) {
    if (typeof (e) === 'object') {
      return;
    } else {
      let route = e?.toLowerCase();
      if (e === 'Document List') {
        this.router.navigate(['vendor', 'vendor-compliance-list']);
      } else if (e === 'Document Group') {
        this.router.navigate(['vendor', 'vendor-document-group-list']);
      }
      this.status = e;
      this.location.replaceState(`/vendor/${route}`);
    }
  }

  onCreateClick(e) {
    this.newDocumentVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_COMPLIANCE, true));
  }

  onSearch(term) {
    if (term) {
      this.loaderService.show();
      this.searchTerm = term;
      const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
      const programId = programDetails?.program_req_id;
      this.subscriptions.push(this.vendorService.get(`/configurator/programs/${programId}/vendor-compliance/required-documents?k=${this.searchTerm}`)
        .subscribe((data:any) => {
          this.vendorComplianceList = data.required_documents;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this.loaderService.hide();
        }, error => {
          this.alertService.error(errorHandler(error));
        }));
    } else {
      this.getVendorComplianceListItems();
    }

  }

  onPaginationClick(event) {
    this.getVendorComplianceListItems(event);
  }


  onListFilter(event) {
    if (event) {
      this.loaderService.show();
      const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
      const programId = programDetails?.program_req_id;
      this.subscriptions.push(this.vendorService.get(`/configurator/programs/${programId}/vendor-compliance/required-documents?limit=${this.itemPerPage}${event.name ? '&name=' + event.name : ''}${has(event, 'is_enabled') ? '&is_enabled=' + event.is_enabled : ''}`)
        .subscribe((data:any) => {
          this.vendorComplianceList = data.required_documents;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this.loaderService.hide();
        }, err => {
          this.alertService.error(errorHandler(err));
          this.loaderService.hide();
        }));
    } else {
      this.getVendorComplianceListItems();
      this.loaderService.hide();
    }
  }

  onSortClick(event) {
  }

  onCloseCreateVendorCompliance(event) {
    this.createManageVendorCompliance = 'hidden';
    this.editData = '';
    this.viewclick = false;
  }

  onEditClick(event) {
    let obj = {'event': true, 'data': event};
    this.newDocumentVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_COMPLIANCE, obj));
  }

  onClickView(event) {
    let obj = {'event': true, 'data': event};
    this.newDocumentVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW_COMPLIANCE, obj));

  }

  onDeleteClick(event) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails?.program_req_id;

    this.loaderService.show();
    this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendor-compliance/required-documents/${event.id}`).subscribe(data => {
        if (data) {
          this.loaderService.hide();
          this.alertService.success(`You have successfully deleted a document`);
          this.vendorComplianceList = this.vendorComplianceList.filter(item => {
            return item.id !== event.id;
          });
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
        this.loaderService.hide();
      }));
  }

  onCloseCreateVendorGroup(event) {
    this.newDocumentVisibility = 'hidden';
  }

  onNewDocumentClose(event) {
    this.newDocumentVisibility = 'hidden';
    this.getVendorComplianceListItems();
  }

  onVendorDocumentCreated(event) {
    this.vendorComplianceList.push(event.required_document);
    // this reload needs to be removed, after receiving full data from BE
    this.getVendorComplianceListItems();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
