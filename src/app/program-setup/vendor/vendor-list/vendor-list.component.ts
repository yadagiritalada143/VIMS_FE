import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { VendorService } from '../vendor.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-vendor-list',
  templateUrl: './vendor-list.component.html',
  styleUrls: ['./vendor-list.component.scss']
})
export class VendorListComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  public editData: any;
  public viewData: any;
  public viewclick: any;
  public searchTerm: any;
  public filter: any = {};
  public tableLoaded = false;
  public totalPages = 1;
  public totalRecords = 30;
  public itemPerPage = 20;
  
  isExpand = false;
  programId: any;
  vendorList: any = {};
  createManageVendor = 'hidden';
  userType = this.storageService.get(StorageKeys.USER_TYPE)
  tableConfig: VMSConfig = {
    title: 'Vendor(s)',
    columnList: [
      {
        name: 'name', title: 'Vendor(s)', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false
      },
      { name: 'candidate', title: 'Candidate Submitted', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'job', title: 'Jobs Filled', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      // { name: 'programModifiedOn', title: 'Updated Date',  width: 10,isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      // { name: 'location', title: 'Locations', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'compliance_status.is_compliant', width: 15, title: 'Compliance status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'compliance_status.is_audited', width: 10, title: 'Audit Completed', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isShowCheckBox: true, isCheckBoxReadonly: true }, //isCheckBoxReadonly: true
      {
        name: 'is_enabled', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isNumberBadge: false, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(),
        //view_compliance added as part of V2M-28574
        ...(this.authService.authorize('view_compliance') ? {
          options: [{
            name: 'Compliance', icon: 'assignment_turned_in'
          }]
        } : {})
      },
    ],
    isExpand: false,
    isFilter: this.userType == 'VENDOR' ? false : true,
    isSearch: this.userType == 'VENDOR' ? false : true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Associate New Vendor to Program',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Vendor Name', placeholder: 'Vendor Name', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
      { name: 'start_date', title: 'Effective Date', filterType: 'DATERANGE' }
    ]

  }

  constructor (
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private loaderService: LoaderService,
    private storageService: StorageService,
    public vendorService: VendorService,
    private alertService: AlertService,
    private accessControlService: AccessControlService,
    private confirmService: ConfirmationDialogService,
    private authService : AuthorizationService,
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.getVendorListItems();
    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_VENDOR)
        .subscribe((data:any) => {
          if (!data) {
            this.getVendorListItems();
          }
        }
      )
    );
  }

  onOptionClicked(event) {
    const { option, data } = event;
    if (option.name === 'Compliance') {
      this.router.navigate(['vendor-managment', 'compliance-list', this.programId, data.id]);
    }
  }

  getVendorListItems(pageNo = 1, name?: string) {
    const ordId = this.storageService.get(StorageKeys.ORGANIZATION_ID)
    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = this.userType == 'VENDOR' ? `/configurator/programs/${programId}/vendors/${ordId}?limit=${this.itemPerPage}&page=${pageNo}`: `/configurator/programs/${programId}/vendors?limit=${this.itemPerPage}&page=${pageNo}`;
    if (name) {
      url += `&name=${name}`;
    }

    this.loaderService.show();
    this.subscriptions.push(this.vendorService.get(url)
      .subscribe((data:any) => {
        if (data) {
          if(data?.program_vendor){
            data['program_vendors'] = [data?.program_vendor] 
          }
          this.vendorList = data;
          if ((this.vendorList?.program_vendors  && this.vendorList?.program_vendors.length > 0 )) {
            this.vendorList?.program_vendors.forEach(programList => {
              if (!programList.compliance_status) {
                programList.compliance_status = {
                  is_compliant: false,
                  is_audited: false
                }
              }
              programList.compliance_status.is_compliant = programList.compliance_status.is_compliant ? 'Compliant' : 'Non - Compliant';
              if (programList && programList.vendor) {
                if (!this.vendorList.vendors) {
                  this.vendorList.vendors = new Array();
                }
                programList.vendor.programModifiedOn = programList.modified_on;
                if (programList.is_enabled) {
                  programList.vendor.is_enabled = true;
                } else {
                  programList.vendor.is_enabled = false;
                }
                programList.vendor.compliance_status = programList.compliance_status;
                programList.vendor.candidate = programList.candidate;
                programList.vendor.job = programList.job;
                this.vendorList.vendors.push(programList.vendor);
              }
            });
          }
          this.totalRecords = data?.total_records ?? 1;
          this.tableLoaded = true;
          this.loaderService.hide();
        }
      },
        (err) => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        }
      )
    );
  }

  onDisableClicked(event) {
    this.loaderService.show();
    let updateIteamId;
    const program_vendors = this.vendorList?.program_vendors.filter(program => program.vendor.id === event.id);
    if (program_vendors && program_vendors.length > 0) {
      updateIteamId = program_vendors[0].id;
    }
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const payLoad = {
      is_enabled: event.is_enabled ? false : true,
    }
    this.subscriptions.push(this.vendorService.put(`/configurator/programs/${programId}/vendors/${event.id}`, payLoad).subscribe(
      (data:any) => {
        if (data) {
          event.is_enabled ? this.alertService.success('Vendor disabled successfully.') : this.alertService.success('Vendor enabled successfully.');
          event.is_enabled = !event.is_enabled;
          this.loaderService.hide();
        }
      },
      (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }));
  }

  onCreateClick(e) {
    this.createManageVendor = 'visible';
    this.editData = "";
    this.viewclick = false;
  }

  onSearch(term: string) {
    this.getVendorListItems(1, term);
  }

  onPaginationClick(event) {
    this.getVendorListItems(event);
  }

  onFilter() {

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let payLoad: any = { filters: this.filter };

    this.loaderService.show();
    const url: string = `/configurator/programs/${programId}/vendors/advanced-filters`;
    this.subscriptions.push(
      this.vendorService.post(url, payLoad)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.vendorList = data;
              if (!!this.vendorList?.program_vendors?.length) {
                this.vendorList.program_vendors.forEach((programList: any) => {
                  if (programList?.vendor) {

                    if (!this.vendorList.vendors) {
                      this.vendorList.vendors = new Array();
                    }
                    if (programList.is_enabled) {
                      programList.vendor.is_enabled = true;
                    } else {
                      programList.vendor.is_enabled = false;
                    }
                    if (!programList.compliance_status) {
                      programList.compliance_status = {
                        is_compliant: false,
                        is_audited: false
                      }
                    }

                    programList.compliance_status.is_compliant = programList.compliance_status.is_compliant ? 'Compliant' : 'Non - Compliant';      
                    programList.vendor.compliance_status = programList.compliance_status;
                    programList.vendor.candidate = programList.candidate;
                    programList.vendor.job = programList.job;
                    this.vendorList.vendors.push(programList.vendor);
                  }
                });
              }
              const totalPages = Math.ceil(data.total_records / data.items_per_page);
              this.totalPages = totalPages;
              this.totalRecords = data.total_records;
              this.tableLoaded = true;
              this.loaderService.hide();
            }
          }, error: (err: any) => {
            this.alertService.error(errorHandler(err));
          }
        }
      )
    );
  }

  onListFilter(event) {
    if (event) {
      if (event.name) {
        this.filter.name = event.name;
      }
      if (event.hasOwnProperty('is_enabled')) {
        this.filter.is_enabled = event.is_enabled;
      }
      if (event.start_date) {
        this.filter.date_range = event.start_date;
      }
      this.onFilter();
    } else {
      this.getVendorListItems();
    }
  }

  onSortClick(event) {
    // fire an API here for sort logic
    // event: {name: '', order: 'asc'/'desc'}
  }

  onCloseCreateVendor(event) {
    // this.getUsers();
    this.createManageVendor = 'hidden';
    this.editData = "";
    this.viewclick = false;
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR, obj));
    }
  }
  onLoadGetVendorList() {
    this.getVendorListItems();
  }

  onEditClick(event) {
    const program_vendors = this.vendorList?.program_vendors.filter(program => program.vendor.id === event.id);
    if (program_vendors && program_vendors.length > 0) {
      let obj = { "event": true, "data": program_vendors[0] };
      this.eventStream.emit(new EmitEvent(Events.EDIT_VENDOR, obj));
    } else {
    }
  }

  onClickView(event) {
    const program_vendors = this.vendorList?.program_vendors.filter(program => program.vendor.id === event.id);
    if (program_vendors && program_vendors?.length > 0) {
      let obj = { "event": true, "data": program_vendors[0] };
      this.eventStream.emit(new EmitEvent(Events.VENDOR_VIEW, obj));
    } else {
    }
  }

  onDeleteClick(event) {
    this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
      'Yes', 'No').then((confirmed) => {
        if (confirmed) {
          const program_vendors = this.vendorList?.program_vendors.filter(program => program.vendor.id === event.id);
          if (program_vendors && program_vendors?.length > 0) {
            this.loaderService.show();
            const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
            this.subscriptions.push(this.vendorService.delete(`/configurator/programs/${programId}/vendors/${event.id}`).subscribe(
              (data:any) => {
                this.loaderService.hide();
                if (data) {
                  this.alertService.success(`You have deleted vendor  successfully.`);
                  this.getVendorListItems();
                }
              },
              (err) => {
                this.loaderService.hide();
                this.alertService.error(errorHandler(err));
              }
            ));
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}