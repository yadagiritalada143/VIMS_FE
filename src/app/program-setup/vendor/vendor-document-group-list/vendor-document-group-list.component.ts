import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {VMSConfig} from 'src/app/library/table/table/table.model';
import {EventStreamService, Events, EmitEvent} from 'src/app/core/services/event-stream.service';
import {LoaderService} from 'src/app/core/components/loader/loader.service';
import {StorageService} from 'src/app/core/services/storage.service';
import {AlertService} from 'src/app/core/components/alert/alert.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {VendorService} from '../vendor.service';
import {ConfirmationDialogService} from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import has = Reflect.has;
import { Subscription } from 'rxjs/internal/Subscription';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-vendor-document-group-list',
  templateUrl: './vendor-document-group-list.component.html',
  styleUrls: ['./vendor-document-group-list.component.scss']
})
export class VendorDocumentGroupListComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  vendorDocumentGroupList: any = {};
  createManageVendorDocumentGroup = 'hidden';
  public editData: any;
  public viewData: any;
  public viewclick: any;
  public searchTerm: any;
  public filter: any = {};

  tableConfig: VMSConfig = {
    title: 'Document Group',
    columnList: [
      {name: 'name', title: 'Group Name', width: 40, isIcon: false, isImage: true, isContact: false, isNumberBadge: false},
      {name: 'description', title: 'Description', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      {
        name: 'required_documents.length',
        title: 'Number Of Documents',
        width: 30,
        isIcon: false,
        isImage: false,
        isContact: false,
        isNumberBadge: true
      },
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
    isCreateButtonName: 'Add New Document Group',
    density: 'COMFORTABLE',
    advanceFilter: [
      {name: 'name', title: 'Name', placeholder: 'Vendor Document Group Name', filterType: 'TEXT'},
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

  constructor(private eventStream: EventStreamService,
              private router: SvmsRouterService,
              private vendorService: VendorService,
              private loaderService: LoaderService,
              private storageService: StorageService,
              private location: Location,
              public confirmService: ConfirmationDialogService,
              private accessControlService: AccessControlService,
              private alertService: AlertService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_DOCUMENT_GROUP).subscribe((data:any) => {
      if (!data) {
        this.getVendorDocumentGroupListItems();
      }
    }));
    this.getVendorDocumentGroupListItems();
  }

  getVendorDocumentGroupListItems(pageNo = 1) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    this.loaderService.show();
    const url = `/configurator/programs/${programId}/vendor-compliance/required-document-groups?limit=${this.itemPerPage}&page=${pageNo}`;
    this.subscriptions.push(this.vendorService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.vendorDocumentGroupList = data;
          this.totalRecords = data.required_document_groups.length;
          this.tableLoaded = true;
          this.loaderService.hide();
        }
      },
      (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }));
  }

  onTabClick(e) {
    if (typeof (e) === 'object') {
      return;
    } else {
      const route = e?.toLowerCase();
      if (e === 'Document List') {
        this.router.navigate(['vendor', 'vendor-compliance-list']);
      } else if (e === 'Document Group') {
        this.router.navigate(['vendor', 'vendor-document-group-list']);
      }
      this.status = e;
      this.location.replaceState(`vendor/${route}`);
    }
  }

  onCreateClick(e) {
    this.createManageVendorDocumentGroup = 'visible';
    this.editData = '';
    this.viewclick = false;
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_DOCUMENT_GROUP, true));
    }
  }

  onSearch(term) {
    if (term) {
      this.filter.name = term;
      this.onListFilter(this.filter);
    } else {
      this.filter.name = '';
      this.filter.is_enabled = '';
      this.getVendorDocumentGroupListItems();
    }

  }

  onPaginationClick(event) {
    this.getVendorDocumentGroupListItems(event);
  }


  onListFilter(event) {
    if (event) {
      const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
      const programId = programDetails.program_req_id;
      this.loaderService.show();
      this.subscriptions.push(this.vendorService.get(`/configurator/programs/${programId}/vendor-compliance/required-document-groups?limit=${this.itemPerPage}${event.name ? '&name=' + event.name : ''}${has(event, 'is_enabled') ? '&is_enabled=' + event.is_enabled : ''}`)
        .subscribe((data:any) => {
          this.vendorDocumentGroupList = data;
          this.totalRecords = data.required_document_groups.length;
          this.tableLoaded = true;
          this.loaderService.hide();
        }, err => {
          this.alertService.error(errorHandler(err));
        }));
    } else {
      this.getVendorDocumentGroupListItems();
    }
  }

  onSortClick(event) {

  }

  onCloseCreateVendorCompliance(event) {
    this.createManageVendorDocumentGroup = 'hidden';
    this.editData = '';
    this.viewclick = false;
  }

  onEditClick(event) {
    const obj = {event: true, data: event};
    this.createManageVendorDocumentGroup = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_DOCUMENT_GROUP, obj));
  }

  onClickView(event) {
    const obj = {event: true, data: event};
    this.createManageVendorDocumentGroup = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW_DOCUMENT_GROUP, obj));

  }

  onDeleteClick(event) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendor-compliance/required-document-groups/${event.id}`)
      .subscribe(
        (data:any) => {
          this.alertService.success(`You have successfully deleted a group of documents`);
          this.vendorDocumentGroupList.required_document_groups = this.vendorDocumentGroupList.required_document_groups.filter(item => {
            return item.id !== event.id;
          });
        },
        (err) => {
          this.alertService.error(errorHandler(err));
        }));
  }

  onDisabledCLick(event) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    const documentIds = [];
    event.required_documents.forEach(document => {
      documentIds.push(document.id);
    });
    const payload = {
      name: event.name,
      description: event.description,
      documents: documentIds,
      is_enabled: !event.is_enabled,
    };
    event.is_enabled = !event.is_enabled;
    this.subscriptions.push(this.vendorService.put(`/configurator/programs/${programId}/vendor-compliance/required-document-groups/${event.id}`, payload)
      .subscribe(
        (data:any) => {
          if (data) {
            this.alertService.success(`You have updated Document group successfully.`);
          }
        },
        (err) => {
          this.alertService.error(errorHandler(err));
        }));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
