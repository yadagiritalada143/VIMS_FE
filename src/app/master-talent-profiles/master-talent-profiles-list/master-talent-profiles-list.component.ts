import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  ITableHeaderConfig,
  IColoumnDefinition,
  ITableOptions,
  ITablePaginationConfig,
  IAdvanceFilterConfig,
  FilterType,
  ColumnType,
} from 'src/app/library/svms-table/svms-table.model';
import { MasterTalentProfileService } from '../master-talent-profile.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Subject, Subscription} from 'rxjs';
import { Router } from '@angular/router';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { MasterTalentProfileListRequestParam } from '../model/mtp.model';

@Component({
  selector: 'app-master-talent-profiles-list',
  templateUrl: './master-talent-profiles-list.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    './master-talent-profiles-list.component.scss',
  ],
})
export class MasterTalentProfilesListComponent implements OnInit {
  private masterTalentProfiles$: Subject<any> = new Subject<any>();
  private masterTalentProfileSubscription: Subscription;
  private prevMasterProfileListRequestParam: MasterTalentProfileListRequestParam;

  @ViewChild('talent_name', { static: true }) talentNameTemplate: TemplateRef<any>;
  @ViewChild('do_not_rehire', { static: true }) doNotRehireTemplate: TemplateRef<any>;
  @ViewChild('mtpid', { static: true }) mtpidTemplate: TemplateRef<any>;

  public svmsData: Array<any>;
  public itemPerPage = 10;
  public totalRecords = 250;
  profileId:string;
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array<IAdvanceFilterConfig>;
  currentProgramId: string;
  currentPage: number = 1;
  public mtpDetails: any = null;

  constructor(
    private masterTalentProfileService: MasterTalentProfileService,
    private storageService: StorageService,
    public router: Router,
    private authorizationService: AuthorizationService
  ) {}

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'unique_id',
        title: 'id',
        placeholder: 'Search Id',
        type: FilterType.TEXT,
        advanceFilter: false,
      },
      {
        name: 'talent_name',
        title: 'Talent Name',
        placeholder: 'Talent Name',
        type: FilterType.TEXT,
        advanceFilter: false,
      },
      {
        name: 'modified_on',
        title: 'modified_on',
        placeholder: 'Select Date',
        type: FilterType.DATEPICKER,
        advanceFilter: false,
      },
      {
        name: 'job_count',
        title: 'Job Count',
        placeholder: 'Enter Number',
        type: FilterType.NORANGENUMBER,
        advanceFilter: false,
      },
      {
        name: 'profile_count',
        title: 'Profile Count',
        placeholder: 'Enter Number',
        type: FilterType.NORANGENUMBER,
        advanceFilter: false,
      },
      {
        name: 'do_not_rehire',
        title: 'Do Not Rehire',
        placeholder: 'All',
        type: FilterType.SELECT,
        options: [
          { name: 'Yes', value: true },
          { name: 'No', value: false }
        ],
        advanceFilter: false,
      }
    ];

    this.tableHeaderConfig = {
      title: 'Master Talent Profiles',
      searchAllowed: true,
      showAddBtn: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      reorder: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onApplyFilter,
    };

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged,
    };

    this.svmstableColomnDefn = [
      {
        field: 'unique_id',
        header: 'Master Profile ID',
        width: 27,
        primary: true,
        templateRef: this.mtpidTemplate,
        order: 1,
        sortable: true,
      },
      { field: 'talent_name', header: 'Talent Name', templateRef: this.talentNameTemplate, width: 20, sortable: true, order: 2 },
      { field: 'do_not_rehire', header: 'Do Not Rehire', templateRef: this.doNotRehireTemplate, width: 20, sortable: true, order: 3 },
      { field: 'profile_count', header: '# Linked Profiles', width: 20, sortable: true, order: 4 },
      { field: 'job_count', header: '# Jobs', width: 20, sortable: true, order: 5 },
      { field: 'assignment_count', header: '# Assignments', width: 20, sortable: true, order: 6 },
      { field: 'modified_on', header: 'Last Updated', width: 15, order: 7, type: ColumnType.DATETIME, sortable: true },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: 'No Master data type found for the selected program.',
      enableColumnFilter: true,
    };
  };

  ngOnInit(): void {
    this.currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.subscribeMasterTalentProfileSubscription();
    this.initalizeTableConfigs();
    this.masterTalentProfiles$.next({page: this.currentPage,programId: this.currentProgramId,limit: this.itemPerPage});
  }

  subscribeMasterTalentProfileSubscription = () => {
    this.masterTalentProfileSubscription = this.masterTalentProfiles$.subscribe((filterData: MasterTalentProfileListRequestParam) => {
      // save filterData to prev
      this.prevMasterProfileListRequestParam = filterData
      this.getMasterTalentProfiles(filterData);
    });
  }

  ngOnDestroy(): void {
    this.masterTalentProfileSubscription.unsubscribe();
  }

  onApplyFilter = (event: any) => {
    let masterTalentProfileListRequestParam = new MasterTalentProfileListRequestParam();
    masterTalentProfileListRequestParam.page = 1;
    masterTalentProfileListRequestParam.programId = this.currentProgramId;
    masterTalentProfileListRequestParam.limit = this.itemPerPage;
    if (event) {
      masterTalentProfileListRequestParam.talent_name = event['talent_name'];
      masterTalentProfileListRequestParam.unique_id = event['unique_id'];
      masterTalentProfileListRequestParam.modified_on = event['modified_on'];
      masterTalentProfileListRequestParam.linked_profiles = event['profile_count'];
      masterTalentProfileListRequestParam.jobs_count = event['job_count'];
      masterTalentProfileListRequestParam.assignment_count = event['assignment_count'];
      masterTalentProfileListRequestParam.do_not_rehire = event['do_not_rehire'];

      this.masterTalentProfiles$.next(masterTalentProfileListRequestParam);
    } else {
      this.masterTalentProfiles$.next(masterTalentProfileListRequestParam);
    }
  };

  onItemCountChanged = (count: number) => {
    let config = this.getConfig(1,count);
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterTalentProfiles$.next(config);
  };

  onPaginationClick = (page: number) => {
    let config = this.getConfig(page,this.itemPerPage);
    this.masterTalentProfiles$.next(config);
  };

  getConfig = (page:number,limit:number) => {
    this.itemPerPage = limit;
    this.currentPage = page;
    let config = this.prevMasterProfileListRequestParam ?? new MasterTalentProfileListRequestParam();
    config.programId = this.currentProgramId;
    config.page = this.currentPage;
    config.limit = this.itemPerPage;
    return config;
  }

  navigateToMTProfile = (rowData: any) => {
    if (this.authorizationService.authorize(MasterProfilePermissions.VIEW_MTP_SCREEN)) {
      this.mtpDetails = true;
      this.profileId = rowData?.id;
     // this.router.navigate([`master-talent-profile/details/${rowData.id}`]);
    }
  };

  closemtpModal(){
    // this.masterTalentProfiles$.next({page: this.currentPage,programId: this.currentProgramId,limit: this.itemPerPage});
    this.masterTalentProfiles$.next(this.prevMasterProfileListRequestParam);
    this.mtpDetails = false;
  }

  getMasterTalentProfiles = (masterTalentProfileListRequestParam :MasterTalentProfileListRequestParam) => {
    this.masterTalentProfileService
      .getMasterTalentProfiles(masterTalentProfileListRequestParam)
      .subscribe((result: any) => {
        if (result) {
          this.svmsData = result.master_talent_profiles ?? [];
          this.totalRecords = result.total_records;
          this.tableOptions.totalRecords = this.totalRecords;
          this.itemPerPage = result.items_per_page;
        } else {
          this.svmsData = [];
        }
      });
  };
}
