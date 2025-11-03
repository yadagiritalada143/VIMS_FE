import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { JobService } from 'src/app/jobs/job.service';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-job-template-list',
  templateUrl: './job-template-list.component.html',
  styleUrls: ['./job-template-list.component.scss']
})
export class JobTemplateListComponent implements OnInit, OnDestroy {

  public tableOptions: ITableOptions;
  public vmsData: Array<any> = [];
  public tableFilterConfig: Array<IAdvanceFilterConfig>;
  public tableHeaderConfig: ITableHeaderConfig;
  public tablePaginationConfig: ITablePaginationConfig;
  public tableColumnConfig: Array<IColoumnDefinition>;
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  @ViewChild('options', { static: true }) optionsTemplate: TemplateRef<any>;
  @ViewChild('jobTemplateStatus', { static: true }) jobTemplateStatus: TemplateRef<any>;
  @ViewChild('activeJobCount', { static: true }) activeJobCount: TemplateRef<any>;
  @ViewChild('jobTemplateTitle', { static: true }) jobTemplateTitle: TemplateRef<any>;


  currentProgramId: String;
  public totalRecords: number = 0;
  public jobTemplateSub: Subject<any> = new Subject<any>();
  page: any = { size: 10, number: 1 };
  subscriptions: Array <Subscription> = [];
  filter: any = {};

  constructor(
    private alertService:AlertService,
    private jobService:JobService,
    private storageService:StorageService,
    private router:SvmsRouterService,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.currentProgramId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initTableConfig();
    //job template search
    this.subscriptions.push(
      this.jobTemplateSub.pipe(
        debounceTime(400),
       ).subscribe((term:any)=>{
        this.filter.searchTerm = term;
        this.getJobTemplates();
       })
    )
    this.getJobTemplates();
  }

  initTableConfig() {
    this.tableFilterConfig = [
      {
        name: 'job_id',
        title: 'job_id',
        placeholder: 'Filter by Job ID',
        type: FilterType.TEXT,
      },
      {
        name: 'category_name',
        title: 'category_name',
        placeholder: 'Filter by Job Category',
        type: FilterType.TEXT
      },
      {
        name: 'template_name',
        title: 'template_name',
        placeholder: 'Filter by Name',
        type: FilterType.TEXT
      },
      {
        name: 'is_enabled',
        title: 'is_enabled',
        placeholder: 'Select Status',
        type: FilterType.SELECT,
        options: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      },
    ];

    this.tableHeaderConfig = {
      title: 'Job Templates',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('job_template_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      onSearch: this.onSearch,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.tablePaginationConfig = {
      itemsPerPage: this.page.size,
      recordsPerPageSetting: [10, 25, 50, 100],
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onItemCountChanged
    };

    this.tableColumnConfig = [
      { field: 'job_id', header: 'ID', width: 6, primary: true, order: 1, sortable: true, onClick: this.onClickView },
      { field: 'is_enabled', header: 'Status', width: 6, order: 2, templateRef: this.jobTemplateStatus },
      { field: 'template_name', header: 'Name', width: 25, order: 3, sortable: true },
      { field: 'program_industry.name', header: 'Labor Category', width: 6, order: 4 },
      { field: 'category_name', header: 'Job Category - Title', width: 25, order: 5, sortable: true },
      { field: 'active_job', header: 'Active Jobs', width: 6, order: 6, templateRef: this.activeJobCount },
    ];

    const actionLinks: Array<IActionLinks> = [
      { linkName: 'View', method: this.onClickView, hide: !this.authService.authorize('job_template_view') },
      { linkName: 'Edit', method: this.onEditClick, hide: !this.authService.authorize('job_template_manage') },
      { linkName: 'Enable/Disable', method: this.onDisableClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('job_template_manage') },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Job Template found for the selected program.",
      actionLinks,
      linksValidatorFn:this.dropdownItemsValidate,
      enableColumnFilter: true
    };
  }

  //job template listing
  getJobTemplates = () => {
    let query = `?limit=${this.page.size}&page=${this.page.number}`;
    if (this.filter.searchTerm) {
      query = query + '&q=' + this.filter?.searchTerm;
    } else {
      delete this.filter?.searchTerm;
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      query = `${query}&is_enabled=${this.filter?.is_enabled}`;
    }
    if (this.filter.hasOwnProperty('category_name')) {
      query = `${query}&category__category_name__icontains=${this.filter['category_name']}`;
    }
    if (this.filter.hasOwnProperty('job_id')) {
      query = `${query}&job_id__icontains=${this.filter?.job_id}`;
    }
    if (this.filter.hasOwnProperty('template_name')) {
      query = `${query}&template_name=${this.filter?.template_name}`;
    }
    if (this.filter.hasOwnProperty('order')) {
      query = `${query}&order_by=${this.filter?.order}`;
    } else {
      query = `${query}&order_by=desc`;
    }
    if (this.filter.hasOwnProperty('key')) {
      query = `${query}&key=${this.filter?.key}`;
    } else {
      query = `${query}&key=modified_on`;
    }

    const url = `/job-manager/programs/${this.currentProgramId}/job-templates` + query;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          this.vmsData = data?.job_templates;
          this.vmsData?.forEach(element => {
            element.category.category_name = element?.category?.category_name?.concat(' - ', element?.ref_title?.title)
            element.category_name = element?.category?.category_name?.concat(' - ', element?.ref_title?.title)
            element.program_industry.name = element?.program_industry[0]?.name || '-'
          });
          if (data.total_records) {
            this.totalRecords = data.total_records;
            this.tableOptions.totalRecords = this.totalRecords;
          }
          if(this.vmsTable){
            this.vmsTable.currentPage=this.page.number; 
          }
        } else {
          this.vmsData = new Array();
        }
      },
      error: (err) => {
        this.alertService.error(errorHandler(err));
        this.vmsData = new Array();
      }
    })
  }

  onSearch = (term) => {
    this.page.number = 1;
    this.jobTemplateSub.next(term);
  }

  onListFilter = (event) => {
    this.page.number = 1;
    this.filter = event ?? {};
    
    if(typeof(event?.['is_enabled']) === 'boolean') {
      this.filter.is_enabled = (event?.is_enabled)?'True':'False';
    }
    
    if (event?.['category_name']) {
      this.filter.searchTerm = event['category_name'];
    } else {
      this.filter.searchTerm = '';
    }

    this.jobTemplateSub.next(this.filter.searchTerm);
  }

  onPaginationClick = (event) => {
    this.page.number = event;
    this.getJobTemplates();
  }

  onItemCountChanged = (count: number) => {
    this.page.number = 1;
    this.page.size = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.getJobTemplates();
  }

  onClickView = (e) => {
    this.router.navigate(['job', 'job-template', 'view', e?.id, 'isview']);
  }

  onCreateClick = (e) => {
    this.router.navigate(['job', 'job-template', 'create']);
  }

  onEditClick = (e) => {
    this.router.navigate(['job', 'job-template', 'create', e?.id, 'isedit']);
  }

  onDisableClick = (event) => {
    const PayLoad: any = {
      "is_enabled": !event?.is_enabled ? !event?.is_enabled : false
    }
    const url = `/job-manager/programs/${this.currentProgramId}/jobs/${event?.id}`;
    this.jobService.put(url, PayLoad).subscribe({
      next: (data: any) => {
        if (PayLoad?.is_enabled) {
          this.alertService.success('Job Template status is updated as Active');
        } else {
          this.alertService.success('Job Template status is updated as Inactive');
        }
        this.getJobTemplates();
      },
      error: error => {
        this.alertService.error(errorHandler(error), {});
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub)=>{sub?.unsubscribe()});
  }

  dropdownItemsValidate = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData?.is_enabled) {
      actionLinks[1].disable = false;
    } else {
      actionLinks[1].disable = true;
    }
  }
  
}
