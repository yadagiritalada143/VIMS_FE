import { Component, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-view-job-template',
  templateUrl: './view-job-template.component.html',
  styleUrls: ['./view-job-template.component.scss']
})
export class ViewJobTemplateComponent implements OnInit {
  tableConfig: VMSConfig = {
    title: 'Job Templates',
    columnList: [
      { name: 'category.category_name', title: 'Job Category & Job Title', width: 25, isIcon: true, icon: 'expand_more', isImage: false, isContact: false, isNumberBadge: false },
      { name: 'job_id', title: 'Template ID', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, },
      { name: 'template_name', title: 'Job Template Title', isImage: true, width: 20, isIcon: true, isContact: false, isNumberBadge: false, enableClick: true },
      { name: 'program_industry.name', title: 'Program industry', isImage: false, width: 15, isIcon: false, isContact: false, isNumberBadge: false, enableClick: true },
      { name: 'active_job', title: 'Active Jobs', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      { name: 'is_enabled', title: 'Status', width: 15, isIcon: true, isImage: false, isContact: false, isNoOption: false, isVieworEdit: true, isCreateJob: false, isDisableorDelete: this.accessControlService.accessControl(), isNumberBadge: false, }
    ],

    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Add New Template',
    density: 'COMFORTABLE',

    advanceFilter: [
      { name: 'name', title: 'Job Title', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ]
  };

  vmsData = [];
  filter: any = {};
  totalRecords: number = 10;
  itemPerPage: number = 10;
  page: any = { size: 10, number: 1 };
  currentProgram: string = undefined;
  loading = true;
  constructor(public jobService: JobService,
    private localStorage: StorageService,
    private loaderService: LoaderService, public _alert: AlertService,
    private accessControlService: AccessControlService,
    private alertService: AlertService, private router: SvmsRouterService, private storageService: StorageService) { }

  ngOnInit(): void {
    // this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    this.currentProgram = this.storageService.get(StorageKeys.PROGRAM_ID);
    if (this.currentProgram) {
      this.getJobTemplates();
    } else {
      this.loading = false;
      // alert("No Program found..");
    }

  }

  onPaginationClick(event) {
    this.page.number = event;
    this.getJobTemplates();
  }

  onSortClick(event) {
    if (event) {
      if (event?.name === "category.category_name") {
        event.name = 'category__category_name';
      }
      this.filter.key = event?.name;
      this.filter.order = event?.order?.toLowerCase();
      this.getJobTemplates();
    }
  }


  onSearch(term) {
    this.page.number = 1;
    this.filter.searchTerm = term;
    this.getJobTemplates();
  }
  onListFilter(event) {
    this.page.number = 1;
    if (event?.hasOwnProperty('is_enabled')) {
      // this.filter.is_enabled = event.is_enabled
      if (event?.is_enabled) {
        this.filter.is_enabled = 'True';
      } else {
        this.filter.is_enabled = 'False';
      }
    } else {
      delete this.filter.is_enabled
    }
    if (event && event.name) {
      this.filter.searchTerm = event?.name;
    } else {
      this.filter.searchTerm = '';
    }

    if (event && event.name && !event?.hasOwnProperty('is_enabled')) {
      this.filter.searchTerm = event?.name;
    } else {
      // this.filter.searchTerm = '';
    }
    this.getJobTemplates();
  }

  getJobTemplates() {
    let payLoad;
    this.loaderService.show();
    this.totalRecords = 0;
    let query = `?limit=${this.page.size}&page=${this.page.number}`;
    if (this.filter.searchTerm) {
      query = query + '&q=' + this.filter?.searchTerm;
    } else {
      delete this.filter?.searchTerm;
      // query = query + '&q=' + "";
      payLoad = { template_name: "" };
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      query = `${query}&is_enabled=${this.filter?.is_enabled}`;
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

    const url = `/job-manager/programs/${this.currentProgram}/job-templates` + query;
    this.jobService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.vmsData = data?.job_templates;
          this.vmsData?.forEach(element => {
            element.category.category_name = element?.category?.category_name?.concat(' - ', element?.ref_title?.title)
            element.program_industry.name = element?.program_industry[0]?.name || '-'
            // element.id = 'PROGRAM-JT-'.concat(element.id);
          });
          if (data.total_records) {
            this.totalRecords = data.total_records;
          }
          this.loaderService.hide();
        } else {
          this.vmsData = new Array();
          this.loaderService.hide();
        }
        this.loading = false;
      },
      (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
        this.vmsData = new Array();
      });
  }
  columnClicked(event) {
    if (event?.name == 'template_name') {
      this.onClickView(event?.vmsData);
    }
  }

  onClickView(e) {
    this.router.navigate(['job-template','create',  e?.id , 'isview']);

  }
  onEditClick(e) {
    this.router.navigate(['job-template','create', e?.id , 'isedit']);
  }
  onCreateClick(e) {
    this.router.navigate(['job-template','create']);
  }
  onDisableClick(e) {
    let programDetails = (this.storageService.get(StorageKeys.CURRENT_PROGRAM));
    let programId = programDetails['id'];
    const PayLoad: any = {
      "is_enabled": !e?.is_enabled ? !e?.is_enabled : false
    }
    const url = `/job-manager/programs/${programId}/jobs/${e?.id}`;
    this.jobService.put(url, PayLoad).subscribe(data => {
      if (PayLoad?.is_enabled) {
        this._alert.success('Job Template status is updated as Active');
      } else {
        this._alert.success('Job Template status is updated as Inactive');
      }

      this.getJobTemplates();
    }, error => {
      this._alert.error(errorHandler(error), {});
    });
  }
  onCreateJobClick(event) {
    this.localStorage.set('template_Data', event , false);
    this.router.navigate(['jobs','create']);

  }

}
