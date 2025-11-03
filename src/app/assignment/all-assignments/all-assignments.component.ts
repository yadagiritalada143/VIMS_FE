import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { errorHandler } from '../../shared/util/error-handler';
import { AssignmentService } from '../assignment.service';
import { UserService } from './../../core/services/user.service';
import { PendingItemTypes, SubStatusTypes } from '../enums/pending-item-types';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { UsersType } from 'src/app/shared/enums';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { MassUpdateService } from '../mass-update.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

export const assimentTabPerStauts: { tab: string; status: string }[] = [
  { status: 'approved', tab: 'Open' },
  { status: 'pending', tab: 'All Pending' },
  { status: 'rejected', tab: 'Rejected' },
  { status: 'closed', tab: 'Closed' },
  { status: 'all', tab: 'All' },
  { status: 'assignment-revision-pending', tab: 'Assignment Revision Pending' },
  { status: 'additional-budget-pending', tab: 'Pending Additional Budget' },
  { status: 'evaluate-pending', tab: 'Pending Evaluation' },
  { status: 'upcoming-closure', tab: 'Ending In Next 30 Days' },
  { status: 'pending-onboarding', tab: 'Pending Onboarding' },
  { status: 'pending-update-request', tab: 'Pending Update Request' },
  { status: 'pending-termination', tab: 'Pending Termination' },
  { status: 'pending-review', tab: 'Pending Review' },
  { status : 'onboard-pending-review' , tab : 'Pending Onboarding Review'},
  { status : 'bulk-update-in-progress' , tab : 'In Progress'}
];

@Component({
  selector: 'app-all-assignments',
  templateUrl: './all-assignments.component.html',
})
export class AllAssignmentsComponent implements OnInit {
  public programId: string;
  public clientId: string;
  pathname = '';
  // dataLoading = false;
  isCreateRole = 'hidden';
  isViewUserRole = 'hidden';
  private assignmentListSubscription: any;
  public vmsData: any;
  public expandList = [];
  public tableConfig: VMSConfig;
  public isExpand = false;
  public itemPerPage: number = 10;
  public totalRecords = 0;
  public itemsPerPage: any;
  public assignmentList: any[] = [];
  public tableLoaded = false;
  public searchTerm: any;
  public status: any;
  public clickedTab : any;
  accuracyConfig = AccuracyConfigEnum;
  expandId: any;
  searchKey = '';
  selectedTab: string = undefined;
  countData: number[];
  selectedIds: string[] = [];
  dataLoader: boolean = true;
  headerActionButtons = [{ title: 'Bulk Update', class: 'color-light' }];
  fields = [];
  isFilterApplied: boolean = false;
  filterData: any;
  isAllRecordsSelected: boolean= false;
  excludeAssignmentIds: string[] = [];
  statusList = [
    'All',
    'Open',
    'Pending Update Request',
    'Pending Additional Budget',
    'Pending Termination',
    'Ending In Next 30 Days',
    'Pending Evaluation',
    'Closed',
    'Pending Review'
  ];
  user_type:string;
  public assignmentManagerInput$ = new Subject<string | null>();
  public candidateInput$ = new Subject<string | null>();
  public vendorInput$ = new Subject<string | null>();
  public input$ = new Subject<string | null>();
  sortObj: any;
  baseURL:any;
  isEffectiveDateSetting = {"key" : "allow_list" , "is_enabled" : false};
  public selectedAssignmentCount: number = 0;
  public availableCountForSelect: number = 0;
  inProgressCount: number = 0;
  pageNo: any = 1;
  assignmentConfig: any;
  constructor(
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    public userService: UserService,
    public assignmentService: VendorService,
    public _assignmentService: AssignmentService,
    private alertService: AlertService,
    private router: Router,
    private location: Location,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private vendorService: VendorService,
    private localDateFormat: LocalDateFormatPipe,
    private massUpdateService: MassUpdateService,
    private authorizationService: AuthorizationService
  ) { }

  ngOnInit(): void {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    let recordsPerPageSetting= [10, 20, 30];
    if(this.user_type === UsersType.Super_org.toLowerCase()){
      recordsPerPageSetting= [10, 25, 50, 75, 100];
    }
    this.isAllRecordsSelected = false;
    this.excludeAssignmentIds = [];
    this.selectedAssignmentCount = 0 ;
    this.availableCountForSelect = 0 ;
    this.programId = programDetails['id'];
    this.baseURL = '/submission-manager';
    this.tableLoaded = true;
    let status_filters = [
      { value: 'approved', name: 'Open' },
      { value: 'closed', name: 'Closed' }
    ];
    if (!programDetails?.config?.is_onboading_disabled) {
      this.statusList.push('Pending Onboarding');
      // status_filters.push({ value: 'pending-onboarding', name: 'Pending Onboarding' });
    }
    if (programDetails.config?.is_onboarding_review_required) {
      this.statusList.push('Pending Onboarding Review');
    }
    this.statusList.push('In Progress');
    this.statusList.push('All Pending');
    this.tableConfig = {
      title: 'Assignments',
      isCreateButtonName: 'Create Quick Assignment',
      permission: 'create_quick_assignment',
      recordsPerPageSetting: recordsPerPageSetting,
      selectAllRecordsFromBar: true,
      columnList: [
        {
          name: 'assignment_title',
          title: 'Assignment Title',
          width: 16,
          isIcon: false,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isNoOption: true,
          isNavigation: true,
          isPending: true,
          isDoNotRehire: true, isSort: true
        },
        { name: 'status', title: 'Status', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true , isTooltip : {isShow : true , message : 'Assignment has been closed from pending state. Please check assignment history for details.' , match : 'pending closed' , secoundMatch : 'cancelled'}},
        { name: 'code', title: 'ID', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        {
          name: 'worker_name',
          title: 'Worker',
          width: 15,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isOpenView: true,
        },
        {
          name: 'official_worker_id',
          title: 'Worker ID',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isOpenView: true,
        },
        {
          name: 'assignment_manager',
          title: 'Assignment Manager',
          width: 15,
          isIcon: true,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isNoOption: true
        },
        { name: 'work_location.name', title: 'Location', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 9, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'sourcing_model', isSort: true, title: 'Sourcing Model', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'start_date', isSort: true, title: 'Start Date', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'end_date', isSort: true, title: 'End Date', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor.name', isSort: false, title: 'Vendor', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },

      ],
      tabsList: this.statusList,
      showTabs: true,
      isExpand: true,
      isFilter: true,
      isSort: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      isIdDifferent: true,
      differentId: 'assignment_uuid',
      tableWidth: '2000px',
      allowMultiselect: false,
      headerActionButtons: [],
      subHeaderActionButtons: [],
      advanceFilter: [
        { name: 'assignment_title', title: 'Assignment Title', placeholder: 'Assignment Title', filterType: 'TEXT' },
        {
          name: 'assignment_manager',
          title: 'Assignment Manager',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.assignmentManagerInput$,
          changeHandler: this.getAssignmentManager,
          loading : false
        },
        {
          name: 'sourcing_model',
          title: 'Sourcing Model',
          filterType: 'MULTISELECT',
          multiSelectData: [],
        },
        {
          name: 'candidate_id',
          title: 'Worker',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.candidateInput$,
          changeHandler: this.getCandidateList,
        },
        {
          name: 'work_location',
          title: 'Work Location',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.input$,
          changeHandler: this.getLocation,
        },
        {
          name: 'vendor_id',
          title: 'Vendor',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.vendorInput$,
          changeHandler: this.getVendorList,
        },
        {
          name: 'status',
          title: 'Status',
          filterType: 'MULTISELECT',
          multiSelectData: status_filters,
        },
        { name: 'start_date', title: 'Start Date', filterType: 'DATERANGE' },
        { name: 'end_date', title: 'End Date', filterType: 'DATERANGE' },
      ],
    };
    this.getSourcingModel();
    this.getAssignmentManager(),
    this.getProgramDetail().then(() => {
    this.getAssignmentConfig().then(() => {
      this.route.paramMap.subscribe(param => {
        let status = param.get('id') || 'All';
        this.getAllCount().then(() => {
          if (param.get('id')?.toLowerCase() === 'in progress' && !this.inProgressCount) {
            this.location.replaceState(`assignment/all-list/all`);
            status = 'All';
          }
          switch (status.toLowerCase()) {
            case 'upcoming':
              this.showTab('Ending in next 30 days');
              break;
            case 'pending-evalution':
              this.showTab('Pending Evaluation');
              break;
            case 'pending-onboarding':
              this.showTab('Pending Onboarding');
              break;
            case 'pending-termination':
              this.showTab('Pending Termination');
              break;
            case 'pending-update-request':
              this.showTab('Pending Update Request');
              break;
            case 'additional-budget-pending':
              this.showTab('Pending Additional Budget');
              break;
            case 'pending':
              this.showTab('All Pending');
              break;
            case 'pending-review':
              this.showTab('Pending Review');
              break;
            case 'pending-onboarding-review':
              this.showTab('Pending Onboarding Review');
              break;
            case 'bulk-update-in-progress':
              this.showTab('In Progress');
              break;
            default: {
              const index = this.tableConfig?.tabsList?.findIndex(item => status?.toLowerCase() === item.toLowerCase());
              if (index === -1) {
                status = 'All';
              }
              this.showTab(status);
              break;
            }
          }
        });
      });
    })
  })
  }

  getAssignmentConfig() {
    return new Promise<void> ((resolve) => {
      this.vendorService.get(`/configurator/programs/${this.programId}/config?entity_code=approval_assignment`)
      .subscribe({next : (res: any) => {
        const { config } = res;
        if (config && config?.events) {
          const { close, update, additional_budget } = config?.events;
          if (!close?.trigger) {
            const tabIndex = this.tableConfig.tabsList.findIndex(tn => tn === 'Pending Termination');
            if (tabIndex > -1) 
              this.tableConfig.tabsList.splice(tabIndex, 1);
          }
          if (!update?.trigger) {
            const tabIndex = this.tableConfig.tabsList.findIndex(tn => tn === 'Pending Update Request');
            if (tabIndex > -1)
            this.tableConfig.tabsList.splice(tabIndex, 1);
          }
          if (!additional_budget?.trigger) {
            const tabIndex = this.tableConfig.tabsList.findIndex(tn => tn === 'Pending Additional Budget');
            if (tabIndex > -1)
            this.tableConfig.tabsList.splice(tabIndex, 1);
          }
          this.tableConfig = { ...this.tableConfig };
          resolve();
        }
      },error: (err) => {
        resolve();
      }})
    })
    }

  allowMassUpdate = false;
  getProgramDetail() {
    return new Promise <void>((resolve) => {
    this.userService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`).subscribe((res: any) => {
      if(res) {
      const { config } = res;
      this.assignmentConfig = config;
      this.changeActionButton();
      if(!config?.pending_review?.is_allow) {
        let index = this.statusList.findIndex(res => res?.toLowerCase() === 'pending review');
        if(index  >-1) {this.statusList?.splice(index, 1);}
      }
      if(config?.hasOwnProperty('effective_date_wise') && config?.effective_date_wise?.is_allow){
        this.isEffectiveDateSetting = config?.effective_date_wise?.options?.find(res => res?.key?.toLowerCase() === this.isEffectiveDateSetting?.key?.toLowerCase());
       }
       resolve();
      }});
  })
  }

  showTab(tabName: string) {
    this.status = tabName;
    this.tableLoaded = true;
    this.selectedTab = tabName;
    this.getAssignmentList(1, true);
    this.changeActionButton();
  }

  getLocation = (term = '') => {
    let url = `/configurator/programs/${this.programId}/work-locations?status=true&limit=25`;
    if (term) {
      url += `&k=${term}`;
    }
    this.userService
      .get(url)
      .pipe(
        map((res: any) =>
          res.work_locations.map(location => {
            return { value: location.id, name: location.name };
          }),
        ),
      )
      .subscribe((res: any) => {
        const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'work_location');
        this.tableConfig.advanceFilter[index].multiSelectData = res;
        this.eventStream.filterMultiSelect.next(true);
      });
  };

  getCandidateList = (term = '') => {
    let url = `${this.baseURL}/candidates?program_id=${this.programId}`;
    if (term) {
      url += `&k=${term}`;
    }
    return this.userService
      .get(url)
      .pipe(
        map((res: any) => {
          const mem = res.candidates.map(({ id, first_name, last_name }) => {
            return {
              value: id,
              name: first_name + ' ' + (last_name || ''),
            };
          });
          return mem;
        }),
      )
      .subscribe((data: any) => {
        const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'candidate_id');
        this.tableConfig.advanceFilter[index].multiSelectData = data;
        this.eventStream.filterMultiSelect.next(true);
      });
  };
  getAssignmentManager = (term = '') => {
    let url =`/configurator/programs/${this.programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&self_at_top=true&limit=25`;
    const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'assignment_manager');
    if (term) {
      url += `&k=${term}`;
    }
    this.tableConfig.advanceFilter[index].loading = true;
    if(this.user_type?.toLowerCase() === 'client' && !this.assignmentConfig?.show_managers?.create?.is_enabled) { 
      let user = this.storageService.get('user');
      this.tableConfig.advanceFilter[index].loading = false;
      this.tableConfig.advanceFilter[index].multiSelectData = [{
        value: user?.id,
        name: user?.first_name + ' ' + (user?.last_name || '')
      }];
     return;
    }
    return this.userService
      .get(url)
      .pipe(
        map((res: any) => {
          const mem = res.members.map(({ id, first_name, last_name }) => {
            return {
              value: id,
              name: first_name + ' ' + (last_name || ''),
            };
          });
          return mem;
        }),
      )
      .subscribe((data: any) => {
        this.tableConfig.advanceFilter[index].loading = false;
        this.tableConfig.advanceFilter[index].multiSelectData = data;
      });
  };
  getSourcingModel() {
    let url = `/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=assignment_sourcing_model&is_enabled=true&order_by=asc&limit=25`;
    const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'sourcing_model');
    if (this.user_type?.toUpperCase() === UserType.Vendor || this.user_type?.toUpperCase() === UserType.MSP || this.user_type?.toUpperCase() === UserType.Client) {
      url = `${url}&org_type=${this.user_type?.toUpperCase()}`;
    }
    return this.userService
      .get(url)
      .pipe(
        map((res: any) => {
          const mem = res.picklist_items.map(({ value, label }) => {
            return {
              value,
              name: label
            };
          });
          return mem;
        }),
      )
      .subscribe((data: any) => {
        this.tableConfig.advanceFilter[index].multiSelectData = data;
      });
  };
  
  getVendorList = (term = '') => {
    let url = `/configurator/programs/${this.programId}/vendors?ordering=organization__name&active=true&exclude_dsaas_vendor=true`;
    if (term) {
      url += `&k=${term}`;
    }
    return this.userService
      .get(url)
      
      .pipe(
        map((res: any) => {
          const mem = res?.program_vendors.map((ven) => {

              return {
                value: ven?.vendor?.id,
                name: ven?.vendor?.name,
              };
            
          });

// to filter duplicates on search
const filteredArr = mem.reduce((allData, current) => {
  const dupItem = allData.find(item => item?.value === current?.value);
  if (!dupItem) {
    return allData.concat([current]);
  } else {
    return allData;
  }
}, []);          
          return filteredArr;
        }),
      )
      .subscribe((data: any) => {
        const index = this.tableConfig.advanceFilter.findIndex(filt => filt.name === 'vendor_id');
        this.tableConfig.advanceFilter[index].multiSelectData = data;
        this.eventStream.filterMultiSelect.next(true);
      });
  };

  formatDate(date) {
    let d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [year, month, day].join('-');
  }
  
  onListFilter(e, pageNo = 1) {
    if (e) {
      this.selectedTab = 'none';
      this.isFilterApplied = true;
      if(!pageNo) {
      this.isAllRecordsSelected = false;
      this.selectedIds= new Array();
      this.excludeAssignmentIds = new Array();
      pageNo= 1
      }
      this.filterData = e;
      if (e?.start_date && e.start_date?.length > 0) {
        for (let i = 0; i < e?.start_date?.length; i++) {
          if (e?.start_date[i]) {
            e.start_date[i] = this.formatDate(e?.start_date[i]);;
          }
        }
      }
      if (e?.end_date && e?.end_date?.length > 0) {
        for (let i = 0; i < e?.end_date?.length; i++) {
          if (e?.end_date[i]) {
            e.end_date[i] = this.formatDate(e?.end_date[i]);
          }
        }
      }
      if(e?.candidate_id && e?.candidate_id?.length === 0) {
        delete e?.candidate_id;
      }
      if((e?.work_location && e?.work_location?.length === 0 ) || e?.work_location === '') {
        delete e?.work_location;
      }
      if((e?.vendor_id && e?.vendor_id?.length === 0 ) || e?.vendor_id === '') {
        delete e?.vendor_id;
      }
      if((e?.sourcing_model && e?.sourcing_model?.length === 0 ) || e?.sourcing_model === '') {
        delete e?.sourcing_model;
      }
      if((e?.status && e?.status?.length === 0 ) ||  e?.status === '') {
        delete e?.status;
      }
      this.dataLoader = true;
      let payload = {
        "request_type" : Object.keys(this.filterData).length && this.status?.toLowerCase() !== 'all' ? this.clickedTab : 'basic',
        "is_effective_date_wise" : this.isEffectiveDateSetting?.is_enabled,
        "page" : pageNo,
        "limit" : this.itemPerPage,
        "filters" : e
      }
      if(this.searchKey) {
        payload['search'] = this.searchKey;
      }
      const url = `/assignment/programs/${this.programId}/assignment/advanced-filters`;
      this.userService.post(url, payload).subscribe(res => {
        if (res) {
          this.handleAssignmentRes(res);
        }
      });
    } else {
      this.selectedTab = this.status;
      this.isFilterApplied = false;
      this.getAssignmentList();
    }
    this.getAllCount();
  }

  handleAssignmentRes(data) {
    if (data) {
      const assignments = [];
      this.assignmentList = [];
      this.allowMassUpdate =  !!data.data?.can_bulk_update;
      this.changeActionButton();
      data?.data?.assignment?.forEach(data => {
        const { request_sub_type, request_type, is_available } = data?.pending_request || {};
        let showPendingIcon = is_available && data?.display_status?.toLowerCase() !== 'pending-closed' && data?.display_status?.toLowerCase() !== 'cancel-closed';
         if (data?.sub_status?.toLowerCase() === 'pending-closed') {
           data.status = `Pending Closed`;
         } else if (data?.sub_status?.toLowerCase() === 'cancel-closed') {
          data.status = `Cancelled`;
        }
        const assignment = {
          ...data,
          // assignment_uuid: data?.id,
          assignment_title: {
            name: data?.assignment_title?.name,
            hasNotification: showPendingIcon,
            do_not_re_hire: data?.do_not_re_hire,
            pendingRequestType: this.snakeCaseToTitle(request_type === PendingItemTypes.AdditionalBudget ? 'pending_additional_budget' : (request_sub_type || 'pending_request')),
          },
          start_date: this.localDateFormat.transform(getDateFromString(data?.start_date), '' , '' ,'', true ),
          end_date: this.localDateFormat.transform(getDateFromString(data?.end_date),  '' , '' ,'', true),
          code: (data?.code),
          official_worker_id: `${data?.worker?.official_worker_id}`,
          worker_name: `${data?.worker?.candidate?.name_prefix ? data?.worker?.candidate?.name_prefix : ''}  ${this.toTitleCase(data?.worker?.candidate?.name)}  ${data?.worker?.candidate?.name_suffix? data?.worker?.candidate?.name_suffix : ''}`,
          assignment_manager: data?.assignment_manager?.name
            ? this.removeUnwanted(data?.assignment_manager?.name)
            : data?.assignment_manager?.name,
            disableCheckbox : !data?.bulk_update_allowed,
            // disableCheckbox : data.bulk_update_allowed ,
            isChecked: data?.bulk_update_allowed && this.isAllRecordsSelected ? true :  this.selectedIds?.includes(data?.assignment_uuid)
         };
        assignments.push(assignment);
      });

      this.totalRecords = data.data.total_records ? data.data.total_records : 0;
      this.tableLoaded = true;
      this.assignmentList = [...assignments];
      this.addSelectedStatus();
      //  this.loaderService.hide();
      this.dataLoader = false;
    }
  }

  toTitleCase(str) {
    if (!str) {
      return;
    }
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt?.charAt(0)?.toUpperCase() + txt?.substr(1)?.toLowerCase();
      }
    );
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }
    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }
    return snakeCaseString.join(' ');
  }

  onSortClick(event) {
    if (!!event) {
      this.sortObj = event;
      this.getAssignmentList(1);
    }
  }

  removedPlus(searchTerm) {
    //  return searchTerm?.replace('+', '%2B');
    return searchTerm.split('+').join('%2B'); // this can replace multiple occurances
  }
  onSearch(e) {
    const str = this.removedPlus(e);
    this.searchKey = str;
    this.selectedIds = new Array();
    this.isAllRecordsSelected = false;
    this.getAllCount('isSeached');
    this.getAssignmentList();
  }
  onClickView(e) {
    let queryParams;
    switch (this.status) {
      case 'Pending Additional Budget': {
        queryParams = { tab: 'budget', openPanel: true };
        break;
      }
      case 'Pending Update Request': case 'Pending Review' : {
        queryParams = { tab: 'approval' };
        break;
      }
      default: {
        queryParams = { tab: 'assignment' };
        break;
      }
    }
    this.router.navigate([`assignment/details/${e?.assignment_uuid}/final`], { queryParams });
  }
  onTabClick(e) {
    this.selectedIds = new Array();
    this.isAllRecordsSelected = false;
    if (typeof e !== 'object') {
      let route = e?.toLowerCase();
      if (e === 'Ending in next 30 days') {
        route = 'upcoming';
      } else if (e === 'Pending Evaluation') {
        route = 'pending-evalution';
      } else if (e === 'Pending Onboarding') {
        route = 'pending-onboarding';
      } else if (e === 'Pending Additional Budget') {
        route = 'additional-budget-pending';
      } else if (e === 'Pending Termination') {
        route = 'pending-termination';
      } else if (e === 'Pending Update Request') {
        route = 'pending-update-request';
      } else if (e === 'Pending Review') {
        route = 'pending-review';
      } else if (e === 'Pending Onboarding Review') {
        route = 'pending-onboarding-review';
      }
      this.clickedTab = route;
      this.status = e;
      this.location.replaceState(`assignment/all-list/${route}`);
      this.getAssignmentList(1, true);
      this.getAllCount();
    }
  }
  onClickRecords(event) {
    this.itemPerPage = event;
    // this.selectedIds = new Array();
    // this.selectedAssignmentCount = null;
    // this.changeActionButton();
    this.getAssignmentList();
  }
  capitalizeFirstLetter(str) {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1);
  }
  getAssignmentList(pageNo = 1, resetSelection = false) {
    // this.loaderService.show();
    if (this.isFilterApplied) {
      this.onListFilter(this.filterData);
      return;
    }
    if (resetSelection) {
      this.selectedIds = [];
    }
    this.dataLoader = true;
    let url;
    this.changeActionButton();
    if (this.status && this.status !== undefined && this.status?.length > 0 && this.status.toLowerCase() !== 'all') {
      if (this.status.toLowerCase() === 'closed') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=closed&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending onboarding' ) {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=pending-onboarding&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending evaluation') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=evaluate&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending additional budget') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&status=pending&type=additional_budget&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'open') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=active&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'ending in next 30 days') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=upcoming_closure&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending termination') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&status=pending&type=termination&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending update request') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&status=pending&type=update&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'all pending') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=pending&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'pending review') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&status=pending&type=pending_review&page=${pageNo}&limit=${this.itemPerPage}`;
      }  else if (this.status.toLowerCase() === 'pending onboarding review') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&status=pending&type=onboard-pending-review&page=${pageNo}&limit=${this.itemPerPage}`;
      } else if (this.status.toLowerCase() === 'in progress') {
        url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=false&status=pending&type=bulk-update-in-progress&page=${pageNo}&limit=${this.itemPerPage}`;
      }
    } else {
      url = `/assignment/programs/${this.programId}/assignment?request_type=basic&is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled}&type=all&page=${pageNo}&limit=${this.itemPerPage}`;
    }

    url += this.searchKey ? `&search=${this.searchKey}` : '';
    if (this.sortObj) {
      url += `${(this.sortObj.order) ? this.sortObj.order === 'DESC' ? '&order_by=desc' : '&order_by=asc' : ""}`;
      url += this.sortObj.name ? `&key=${this.sortObj.name}` : "";
    }
    if (this.assignmentListSubscription) {
      this.assignmentListSubscription.unsubscribe();
    }
    this.assignmentListSubscription = this.assignmentService.get(url).subscribe({next:(data: any) => {
        this.handleAssignmentRes(data);
      },
      error: (err) => {
        this.dataLoader = false;
        // this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      },
    });
  }

  changeActionButton() {
    // this.tableConfig.allowMultiselect = (this.status?.toLowerCase() === 'open' || this.status?.toLowerCase() === 'closed' || this.status?.toLowerCase() === 'all' ) && this.allowMassUpdate;
    this.tableConfig.isCheckboxOption = (this.status?.toLowerCase() === 'open' || this.status?.toLowerCase() === 'closed' || this.status?.toLowerCase() === 'all' ) && this.allowMassUpdate ? true :false;
    this.tableConfig.headerActionButtons = this.tableConfig.allowMultiselect && this.selectedIds.length > 0 ? this.headerActionButtons : [];
    this.tableConfig.subHeaderActionButtons = [
      { title: 'Bulk Update', class: '', disabled: true },
      // { title: 'Bulk Close', class: '', disabled: true }
    ];
    if(this.checkAuthorization('bulk_assignment_close')) {
      this.tableConfig.subHeaderActionButtons.push({ title: 'Bulk Close', class: '', disabled: true });
    }
    this.tableConfig.isActionDropdown = true;
    this.tableConfig = { ...this.tableConfig };
  }
  onAllRecordsSelected(event){
    if(!event) {
      this.selectedIds = new Array();
      this.selectedAssignmentCount = 0;
      this.isAllRecordsSelected = false;
      this.changeActionButton();
    }
    // this.isAllRecordsSelected = event;    
  }  

  removeUnwanted(str) {
    return str?.replace(/MR |Mrs |Miss |Dr |Prof |MX. |IND |Misc /gi, '');
  }

  onExpandClick(e) {
    if (e !== null) {
      this.isExpand = true;
      this.expandId = e;
    } else {
      this.isExpand = false;
      this.expandId = undefined;
    }
  }

  onPaginationClick(e) {
    this.pageNo = e ;
    if(this.isFilterApplied) {
      this.onListFilter(this.filterData, e)
    } else {
      this.getAssignmentList(e);
    }
  }

  onEditClick(data) { }
  onCreateClick(e) {
    this.router.navigate(['/assignment/create-assignment']);
  }
  columnClicked(columnData) { }

  getAllCount(event ? ) {
    let payload  : Object= {
      type : this.status?.toLowerCase(),
      search_text : this.searchKey,
      filters : !(event === 'isSearched') && this.isFilterApplied ? this.filterData : null
    }
    payload = Object.keys(payload)?.filter((key) => payload[key])?.reduce((a, k) => ({ ...a, [k]: payload[k] }), {});
    return new Promise<void>((resolve) => {
      this.assignmentService.post(`/assignment/programs/${this.programId}/assignment/counts?request_type=basic` , payload).subscribe((data: any) => {
        const statusCount: { status: string; count: number }[] = data?.data || [];
        if (statusCount.find(res => res?.status?.toLowerCase() === 'bulk-update-in-progress' && !res?.count)) {
          if(this.statusList.findIndex(res => res?.toLowerCase()=== 'in progress') !== -1) {
            this.statusList.splice(this.statusList.findIndex(res => res?.toLowerCase()=== 'in progress'), 1);
          }
        }
        let rejectedCount: number = statusCount.find(entry => entry?.status?.toLowerCase() === 'rejected')?.count || 0;
        let allRef: any = statusCount.find(entry => entry?.status?.toLowerCase() === 'all');
        let closeRef: any = statusCount.find(entry => entry?.status?.toLowerCase() === 'closed');
        closeRef.count +=rejectedCount;
        allRef.count += rejectedCount;
        this.availableCountForSelect = statusCount?.find(entry => entry?.status?.toLowerCase() === 'total-bulk-update')?.count || 0;
        this.inProgressCount = statusCount?.find(entry => entry?.status?.toLowerCase() === 'bulk-update-in-progress')?.count || 0;
        this.countData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.countData = this.tableConfig.tabsList.map(
          tab => statusCount.find(status => status?.status === assimentTabPerStauts.find(tabStatus => tabStatus?.tab === tab)?.status)?.count || 0,
        );
        resolve();
      });
    });
  }
  // open worker details flyout on click
  viewSidePanel(event) {
    this.loaderService.show();
    let url = `/assignment/programs/${this.programId}/assignment/${event?.assignment_uuid}`;
    this.vendorService.get(url).subscribe(
      (data: any) => {
        if (data?.data) {
          const assignmentListData = data?.data?.assignments;
          this.eventStream.emit(
            new EmitEvent(Events.ASSIGNMENT_SIDEBAR_VIEW, {
              value: assignmentListData,
              candidateId: assignmentListData?.worker?.candidate?.id,
              assignmentId : assignmentListData?.assignment?.assignment_uuid
            }),
          );
        }
        this.loaderService.hide();
      },
      err => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      },
    );
  }

  actionButtonClicked(event) {
    let selectedIds:any =  this.selectedIds?.map(ids =>  {
      return { id: ids }
    } );
     if(this.isAllRecordsSelected) {
      selectedIds = new Array();
      if((this.status?.toLowerCase() === 'open'   || this.status?.toLowerCase() === 'closed') && (!this.filterData || !Object.keys(this.filterData)?.length) ) {
        this.filterData = {
          "status": [
              this.status
          ]
      }
      }
       selectedIds.push({allRecordSelected:true, filter: this.filterData ,  search: this.searchKey, exclude_assignment_uuids:this.excludeAssignmentIds })
     }
    this.massUpdateService.setAssignmetIds(selectedIds);
    let queryParams;
    queryParams = { actions: event?.title };
    this.router.navigate(['/assignment/mass/update'], { queryParams });
  }

  onRowChecked(event) {
     const { selected } = event;
      if (selected && selected?.isChecked) {
      if (!this.selectedIds?.includes(selected?.assignment_uuid)) {
        this.selectedIds.push(selected?.assignment_uuid);
      }
    } else if (selected && !selected?.isChecked) {
      this.selectedIds.splice(this.selectedIds?.indexOf(selected?.assignment_uuid), 1);
      if(this.isAllRecordsSelected) {
        if (!this.excludeAssignmentIds?.includes(selected?.assignment_uuid)) {
        this.excludeAssignmentIds.push(selected?.assignment_uuid);
        }
      }
    }
    this.selectedAssignmentCount = this.selectedIds?.length;
    this.changeActionButton();
    this.addSelectedStatus();
    // console.log('event is nowowww', event);
    // const { row } = event;
    // if (event && event.value) {
    //   if (!this.selectedIds.includes(row.assignment_uuid)) {
    //     this.selectedIds.push(row.assignment_uuid);
    //   }
    // } else if (event && !event.value) {
    //   this.selectedIds.splice(this.selectedIds.indexOf(row.assignment_uuid), 1);
    // }
    // this.changeActionButton();
    // this.addSelectedStatus();
  }
  removedIds = new Array();
  onselectAllClick(event) {
    if(event && event?.selected && event?.selected?.length > 0) {
      let selectedIds=  new Array();
      selectedIds = event?.selected?.filter(row=> row.isChecked)?.map(assignments=> assignments?.assignment_uuid);
      let unselected_ids = event?.selected?.filter(row=> !row.isChecked)?.map(assignments=> assignments?.assignment_uuid);
      if(unselected_ids && unselected_ids?.length ) {
        selectedIds = selectedIds?.filter(function(value, index) {
        return unselected_ids?.indexOf(index) == -1;
     })
     }
      if(selectedIds && selectedIds?.length > 0) {
        this.removedIds[this.pageNo - 1] = [...selectedIds];
        this.selectedIds=  [...this.selectedIds, ...selectedIds];
        this.selectedIds = [...new Set(this.selectedIds)];
        this.selectedAssignmentCount = this.selectedIds?.length;
      } else {
        this.removedIds[this.pageNo - 1]?.forEach((res) => {
          const index = this.selectedIds?.indexOf(res);
          if (index > -1) {
            this.selectedIds?.splice(index, 1);
          }
        });
      }
      this.selectedAssignmentCount =  this.selectedIds?.length;
      this.changeActionButton();
    }

  }
  selectedRecord(event) {
    if(event) {
      this.isAllRecordsSelected = true;
    }
  }

  addSelectedStatus() {
    this.assignmentList = this.assignmentList?.map(assign => {
      assign.selected = this.selectedIds?.includes(assign?.assignment_uuid);
      return assign;
    });
  }

  navigateToApproval(e) {
    const { request_sub_type, request_type } = e.pending_request || {};
    let queryParams = { tab: 'assignment' };
    if (request_type === PendingItemTypes.AdditionalBudget) {
      queryParams.tab = 'budget';
    } else if (request_sub_type === SubStatusTypes.PendingOnboarding) {
      queryParams.tab = 'onboarding';
    } else if (request_sub_type === SubStatusTypes.PendingReview || request_sub_type === SubStatusTypes.PendingApproval) {
      queryParams.tab = 'approval';
    }
    this.router.navigate([`assignment/details/${e?.assignment_uuid}/final`], { queryParams });
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }
}
