import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProgramSetupService } from '../../program-setup.service';
import { VendorService } from '../vendor.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Subscription } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-vendor-group-list',
  templateUrl: './vendor-group-list.component.html',
  styleUrls: ['./vendor-group-list.component.scss']
})
export class VendorGroupListComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public programData: any;
  public vendorGroupData: any;
  public totalRecords = 30;
  public itemPerPage = 20;
  public isExpand = false;
  public title: any;
  public isCreateVendorGroup = 'hidden';
  public filter: any = {} ;
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  tableConfig: VMSConfig = {
    title: 'Vendor Group List',
    columnList: [
      { name: 'name', title: 'Group Title', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'description', title: 'Description', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 25, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'New Vendor Group',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Name', placeholder: 'Vendor Group Name', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ]
  }
  constructor(public programSetupService: ProgramSetupService, public storageService: StorageService,
    private eventStream: EventStreamService, private vendorService: VendorService,
    private alertService: AlertService, private accessControlService: AccessControlService, private confirmService: ConfirmationDialogService,
    private loaderService: LoaderService,) { }

  ngOnInit(): void {
    this.programData = JSON.parse(this.storageService.get(ProgramConfig[0]));
    this.getVendorGroupList();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_GROUP).subscribe((data:any) => {
      if (!data) {
        this.getVendorGroupList();
      }
    }));

  }

  getVendorGroupList(pageNo= 1) {
    this.loaderService.show();
    const url = `/configurator/programs/${this.programData?.program_req_id}/vendor-groups?limit=${this.itemPerPage}&page=${pageNo}`;
    this.subscriptions.push(this.programSetupService.get(url).subscribe((data:any) => {
      if (data) {
        this.vendorGroupData = data;
        this.totalRecords = data.total_records;
        this.loaderService.hide();
      }
    }, error => {
      this.loaderService.hide();
      this.alertService.error(errorHandler(error));
    }));

  }
  onCreateClick(e) {
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_GROUP, true));
    }
  }
  onViewClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.VENDOR_GROUP_VIEW, obj));
    }
  }
  onEditClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      // this.isCreateVendorGroup = 'visible';
      this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_GROUP, obj));
    }
  }
  onCloseCreateVendorGroup(event) {
    this.isCreateVendorGroup = 'hidden';
  }
  onPaginationClick(event) { 
    this.getVendorGroupList(event); 
  }
  onListFilter(event) {
    if(event) {
    if (event.name) {
      this.filter.name = event.name;
    }
    if (event.hasOwnProperty('is_enabled')) {
      this.filter.is_enabled = event.is_enabled;
    }
     this.onFilter();
  } else {
    this.getVendorGroupList();
  }
  }
  onDisableClicked(event) {

    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails['program_req_id'];
    
    const payLoad = {
      is_enabled: event.is_enabled ? false : true,
      name: event?.name,
      description: event?.description,
    }

    this.loaderService.show();
    this.subscriptions.push(this.vendorService.put(`/configurator/programs/${programId}/vendor-groups/${event.id}`, payLoad).subscribe(
      (data):any => {
        if (data) {
          this.alertService.success('Vendor Group updated succesfully..');
          event.is_enabled = !event.is_enabled;
          this.loaderService.hide();
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
        this.loaderService.hide();
      }));

  }
  onDeleteClick(event) {
    this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
      'Yes', 'No').then((confirmed) => {
        if (confirmed) {
          const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
          const programId = programDetails['program_req_id'];
          this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendor-groups/${event.id}`).subscribe(
            (data):any => {
              if (data) {
                this.alertService.success(`You have deleted vendor group successfully.`);
                this.getVendorGroupList();
              }
            },
            (err) => {
              this.alertService.error(errorHandler(err));
            }
          ));
        }
      });
  }
  onSearch(term) {
    if(term) {
      this.filter.name = term;
      this.onFilter();
    } else {
      this.getVendorGroupList();
    }
 
  }
  onFilter() {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails['program_req_id'];
    let payLoad: any = { filters: this.filter };
    this.loaderService.show();
    this.subscriptions.push(this.vendorService.post(`/configurator/programs/${programId}/vendor-groups/advanced-filters`, payLoad).subscribe(
        (data:any) => {
          if (data) {
            this.vendorGroupData = data;
            this.totalRecords = data.total_records;
            this.loaderService.hide();
          }
        },
        (err) => {
          this.alertService.error(errorHandler(err));
          this.loaderService.hide();
        }));
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
