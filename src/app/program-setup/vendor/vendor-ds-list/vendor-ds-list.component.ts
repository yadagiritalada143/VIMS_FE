import { Component, OnDestroy, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { VendorService } from '../vendor.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Subscription } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-vendor-ds-list',
  templateUrl: './vendor-ds-list.component.html',
  styleUrls: ['./vendor-ds-list.component.scss']
})
export class VendorDsListComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  distributionScheduleList: any = {};
  createManageVendorSchedule = 'hidden';
  public editData: any;
  public viewData: any;
  public viewclick: any;
  public searchTerm: any;
  public filter: any = {} ;
  tableConfig: VMSConfig = {
    title: 'Vendor Distribution Schedules',
    columnList: [
      { name: 'name', title: 'Vendor Distribution Schedule', width: 40, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'description', title: 'Description', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isDescription: true },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isCreate: true,
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreateButtonName: 'Schedule',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Name', placeholder: 'Vendor Distribution Schedule Name', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      { name: 'start_date', title: 'Effective Date', filterType: 'DATERANGE' }
    ]
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
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.CREATE_VENDOR_SCHEDULE).subscribe((data:any) => {
      if (!data) {
        this.getVendorScheduleListItems();
      }
    }));
    this.getVendorScheduleListItems();
  }
  getVendorScheduleListItems(pageNo = 1) {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.loaderService.show();
    const url = `/configurator/programs/${programId}/vendors/distribution-schedules?limit=${this.itemPerPage}&page=${pageNo}`;
    this.subscriptions.push(this.vendorService.get(url).subscribe(
      (data:any) => {
        if(data){
          //  data?.forEach(element => {
          //     if(element && element?.description && element.description?.length > 10) {

          //     }
          //  });
          this.distributionScheduleList = data;
          // const totalPages = Math.ceil(data.total_records / data.items_per_page);
          // this.totalPages = totalPages;
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

    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails['program_req_id'];
    const addDataTypeForm = event;
    const payLoad = {
      is_enabled: addDataTypeForm.is_enabled ? false : true,
    }

    this.loaderService.show();
    this.subscriptions.push(this.vendorService.put(`/configurator/programs/${programId}/vendors/distribution-schedules/${event.id}`, payLoad).subscribe(
      (data:any) => {
        if (data) {
          this.alertService.success('Vendor distribution schedule updated succesfully..');
          event.is_enabled = !event.is_enabled;
          this.loaderService.hide();
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
        this.loaderService.hide();
      }));
  }
  onCreateClick(e) {
    this.createManageVendorSchedule = 'visible';
    this.editData = "";
    this.viewclick = false;
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_SCHEDULE, true));
    }
  }
  onSearch(term) {
    if(term) {
      this.filter.name = term;
      this.onFilter();
    } else {
      this.getVendorScheduleListItems();
    }

  }
  onPaginationClick(event) { 
    this.getVendorScheduleListItems(event); 
  }
  onFilter() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    
    let payLoad: any = { 
      filters: this.filter
    };
  
    this.loaderService.show();
    this.subscriptions.push(this.vendorService.post(`/configurator/programs/${programId}/vendors/distribution-schedules/advanced-filters`, payLoad).subscribe(
        (data:any) => {
          if (data) {
            this.distributionScheduleList = data;
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
      this.getVendorScheduleListItems();
    }
  }
  onSortClick(event) {
  }

  onCloseCreateVendorDistribution(event) {
    this.createManageVendorSchedule = 'hidden';
    this.editData = "";
    this.viewclick = false;
    // let obj = { "event": true, "data": event };
    // if (event) {
    //   this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_SCHEDULE, obj));
    // }
  }

  onEditClick(event) {
    let obj = { "event": true, "data": event };
    this.createManageVendorSchedule = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR_SCHEDULE, obj))
  }

  onClickView(event) {
    let obj = { "event": true, "data": event };
    this.createManageVendorSchedule = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW_SCHEDULE, obj));

  }
  onDeleteClick(event) {
    this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
      'Yes', 'No').then((confirmed) => {
        if (confirmed) {
          const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
          const programId = programDetails['program_req_id'];
          this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendors/distribution-schedules/${event.id}`).subscribe(
            data => {
              if (data) {
                this.alertService.success(`You have deleted vendor schedule successfully.`);
                this.getVendorScheduleListItems();
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