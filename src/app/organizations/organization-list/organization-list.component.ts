import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';

import { ActivatedRoute } from "@angular/router";
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { OrganizationService } from '../organization.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { map, mergeMap } from 'rxjs/operators';
import { AlertService } from '../../core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
import { ProgramConfig } from 'src/app/shared/enums';
import { StorageService } from 'src/app/core/services/storage.service';
import { OrgFilter } from '../organization.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-organization-list',
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss'],
})
export class OrganizationListComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  @Input() organizations: any;
  orgType = 'TYPE_MSP';
  orgTitle: string = 'Create New MSP';
  orgIcon: string = 'domain';
  showCreate = false;
  fixedHeader = false;
  subheaderToggle = false;
  lastScrollTop: number = 0;
  limit = 10;
  direction: string = "";
  expandRow: number;
  isExpand = false;
  tableConfig: VMSConfig;
  pathname: string;
  dataLoading = true;
  public seachTerms: any;
  public vmsData: any;
  public orgListData: any
  public organizeMem: any;
  tableLoaded: boolean = false;
  itemsPerPage: any;
  organizationType: string;
  advanceFilterData: any;
  advanceOrder: any;
  isFilterApplied = false


  constructor(
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    private organizationService: OrganizationService,
    private _loader: LoaderService,
    private router: SvmsRouterService,
    private _alert: AlertService,
    private localStorage: StorageService,
    private changeDetection: ChangeDetectorRef,
    private accessControl: AccessControlService
  ) {

  }

  public totalPages = 0;
  public totalRecords = 0;
  public organizeMembers: any;
  public logo: any;

  ngOnInit(): void {
    this.subscriptions.push(this.route.params.subscribe(params => {
      this.pathname = params['term'];
      this.seachTerms = '';
      this.organizationsList();
    }));
    this.subscriptions.push(this.eventStream.on(Events.ORG_CREATE).subscribe((data) => {
      if (!data) {
        this.seachTerms = '';
        this.organizationsList();
      }

    }));

  }


  organizationsList(pageNo = 1, search = '') {
    this.dataLoading = true;

    if (this.pathname === 'client') {
      this.orgType = 'TYPE_CLIENT';
      this.orgIcon = 'supervised_user_circle';
      this.orgTitle = 'Create New Client';
      this.tableConfig = {
        title: 'Clients',
        columnList: [
          { name: 'ref_id', title: 'ID', width: 15, isIcon: true, icon: 'expand_more', isImage: false, isContact: false, isNumberBadge: false },
          { name: 'name', title: 'Client Name', width: 30, isIcon: true, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false },
          { name: 'total_programs', title: 'No. of Programs', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'contacts', title: 'Contacts', width: 15, isIcon: false, isImage: true,isMultiUser:true, isContact: false, isNumberBadge: false },
          { name: 'modified_on', title: 'Created Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: this.accessControl.accessControl(), 
            isDisableorDelete: false, isDelete: false, isNumberBadge: false 
          }
        ],
        isExpand: true,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        isCreate: true,
        density: 'COMFORTABLE',
        advanceFilter: [
          { name: 'name', title: 'Client Name', filterType: 'TEXT' },
          {
            name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
              { name: 'Active', value: true },
              { name: 'Inactive', value: false },
            ]
          },
          { name: 'date_range', title: 'Date Updated Range', filterType: 'DATERANGE' },

        ]
      }
    } else if (this.pathname === 'msp') {
      this.orgType = 'TYPE_MSP';
      this.orgTitle = 'Create New MSP';
      this.orgIcon = 'domain';
      this.tableConfig = {
        title: 'MSP (Managed Services Providers)',
        columnList: [
          // { name: 'id', title: 'ID', width: 30, isIcon: true, icon: 'expand_more', isImage: false, isContact: false, isNumberBadge: false },
          { name: 'name', title: 'MSP Name', width: 30, isIcon: true, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false },
          { name: 'total_programs', title: 'No. of Programs', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'contacts', title: 'Contacts', width: 15, isIcon: false, isImage: true, isContact: false, isMultiUser:true, isNumberBadge: false },
          { name: 'modified_on', title: 'Created Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: this.accessControl.accessControl(), 
            isDisableorDelete: false, isDelete: false, isNumberBadge: false }
        ],
        isExpand: true,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        isCreate: true,
        density: 'COMFORTABLE',
        advanceFilter: [
          { name: 'name', title: 'MSP Name', filterType: 'TEXT' },
          {
            name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
              { name: 'Active', value: true },
              { name: 'Inactive', value: false },
            ]
          },
          { name: 'date_range', title: 'Date Updated Range', filterType: 'DATERANGE' },

        ]
      }
    } else if (this.pathname === 'vendor') {
      this.orgType = 'TYPE_VENDOR';
      this.orgTitle = 'Create New Vendor';
      this.orgIcon = 'storefront';
      this.tableConfig = {
        title: 'Vendors',
        columnList: [
          { name: 'ref_id', title: 'ID', width: 18, isIcon: true, icon: 'expand_more', isImage: false, isContact: false, isNumberBadge: false },
          { name: 'name', title: 'Vendor Name', width: 30, isIcon: true, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false },
          { name: 'total_programs', title: 'No. of Programs', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'contacts', title: 'Contacts', width: 14, isIcon: false, isImage: true, isContact: false, isMultiUser:true, isNumberBadge: false },
          { name: 'modified_on', title: 'Created Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
          { name: 'status', title: 'Status', width: 13, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: this.accessControl.accessControl(), 
            isDisableorDelete: false, isDelete: false, isNumberBadge: false }
        ],
        isExpand: true,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        isCreate: true,
        density: 'COMFORTABLE',
        advanceFilter: [
          { name: 'name', title: 'Vendor Name', filterType: 'TEXT' },
          {
            name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
              { name: 'Active', value: true },
              { name: 'Inactive', value: false },
            ]
          },
          { name: 'date_range', title: 'Date Updated Range', filterType: 'DATERANGE' },

        ]
      }
    }

    let url = `/configurator/organizations?category=${this.pathname}&limit=${this.limit}&page=${pageNo}`

    if (search !== '') {
      url = url + `&name=${search}`
    }

    this.subscriptions.push(this.organizationService.get(url).subscribe((data:any) => {
      this.vmsData = [];
      data?.organizations?.forEach(data => {
      data.status = data?.status ? "Active" : "Inactive" ;
      });
      this.vmsData = data.organizations;
      this.totalRecords = data.total_records;
      this.itemsPerPage = data.items_per_page;
      this.tableLoaded = true;
      this.changeDetection.detectChanges();
      // this.change
      //this._loader.hide();
      this.dataLoading = false;
    }, error => {
      //this._loader.hide();
      this.dataLoading = false;
    },
      () => {
        this.dataLoading = false;
        //this._loader.hide();
      }));

  }

  getAdvanceFilterData(data = null, pageNo = 1) {
    let filter: OrgFilter;
    this.dataLoading = true;
    if (data !== null) {
      filter = {
        filters: {
          categories: data['categories'],
          date_range: data['date_range'],
          labor_categories: data['industries'],
          name: data['name'],
          is_enabled: data['is_enabled']
        },
        pagination: {
          limit: 10,
          page: pageNo
        }
      }
    } else {
      filter = {
        pagination: {
          limit: 10,
          page: pageNo
        }
      }
      if (this.advanceFilterData) {
        filter['filters'] = {
          categories: this.advanceFilterData['categories'],
          date_range: this.advanceFilterData['date_range'],
          labor_categories: this.advanceFilterData['labor_categories'],
          name: this.advanceFilterData['name'],
          is_enabled: this.advanceFilterData['is_enabled']
        }
      }
    }

    if (this.advanceOrder) {
      filter['sort_order'] = [{
        field: this.advanceOrder['name'],
        order: this.advanceOrder['order']
      }]
    }

    if (pageNo == 1) {
      //this._loader.show();
    }

    this.subscriptions.push(this.organizationService.post('/configurator/organizations/advanced-filters', filter).subscribe((data:any) => {
      this.vmsData = data.organizations;
      this.totalRecords = data.total_records;
      this.itemsPerPage = data.items_per_page;
      this.tableLoaded = true;
      //this._loader.hide();
      this.dataLoading = false;
    }, error => {
      //this._loader.hide();
      this.dataLoading = false;
    },
      () => {
        this.dataLoading = false;
        //this._loader.hide();
      }));
  }

  programClick(data) {
    this._loader.show();
    this.subscriptions.push(this.organizationService.get(`/configurator/programs/${data.id}`)
      .pipe(
        map((res: any) => res.program),
        mergeMap((program: any) => this.organizationService.get(`/configurator/programs?unique_id=${program.unique_id}&limit=1`))
      )
      .subscribe((results: any) => {
        const { programs } = results;
        const program = programs[0];
        this.localStorage.set(ProgramConfig[5], program, true);
        this.router.navigate(['program-setup'],
          {
            queryParams: {
              programId: program.unique_id,
              clientId: program.client.id,
              program_req_id: program.id,
              clientName: program.client.name
            }
          }
        ).then(val => {
          this._loader.hide();
        });
      }, (errr) => {
        this._alert.error(errorHandler(errr));
      })
    );
  }

  trackByName(i, org) {
    return org.name;
  }
  onclickexpand(id) {
    if (this.expandRow === id) {
      this.expandRow = undefined;
    }
    else {
      this.expandRow = id;
    }
  }
  onClickRecords(event) {
    if(event) {
      this.limit = event;
      this.organizationsList();
    }

  }

  onClikcView(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ORG_VIEW, obj));
    }
  }

  onExpandClick(event) {
    this.vmsData.forEach(element => {
      if (element.id == event) {
        this.organizeMembers = element.programs;
        this.logo = element.logo;
      }
    });
    if (event !== null) {
      this.isExpand = true
    } else {
      this.isExpand = false
    }
  }

  onEditClick(event) {
    let obj = { "event": true, "data": event };
    if (event && event.viewOnly) {
      this.eventStream.emit(new EmitEvent(Events.ORG_VIEW, obj));
    }else{
      this.eventStream.emit(new EmitEvent(Events.ORG_EDIT, obj));
    }
  }

  onPaginationClick(event) {
    if (this.isFilterApplied) {
      this.getAdvanceFilterData(null, event)
    } else {
      this.organizationsList(event, encodeURIComponent(this.seachTerms));
    }

  }

  onSearchClick(event) {
    this.seachTerms = decodeURIComponent(event);
    this.organizationsList(1, event);
  }

  onCreateClick(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, true,));
    }
  }

  onListFielter(data) {
    if (!data) {
      this.isFilterApplied = false
      this.organizationsList(1);
    } else {
      this.isFilterApplied = true
      switch (this.pathname) {
        case 'msp':
          data['categories'] = ['MSP']
          break;
        case 'client':
          data['categories'] = ['CLIENT']
          break;
        case 'vendor':
          data['categories'] = ['VENDOR']
          break;
      }
      this.advanceFilterData = data
      this.getAdvanceFilterData(data)
    }
  }

  onSortClick(event) {
    if (!event) {
      this.isFilterApplied = false
      this.organizationsList(1);
    } else {
      this.advanceOrder = event
      this.isFilterApplied = true
      this.getAdvanceFilterData()
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}


