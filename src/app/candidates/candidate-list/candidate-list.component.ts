import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import {
  EmitEvent,
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobsService } from 'src/app/jobs/jobs.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { UsersType } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { CandidateService } from '../service/candidate.service';
@Component({
  selector: 'app-candidate-list',
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.scss'],
})
export class CandidateListComponent implements OnInit {
  public tableConfig: VMSConfig;
  public itemPerPage = 0;
  candidateId: any;
  filter: any = {};
  user_type: any;
  public tableLoaded = false;
  public vmsData: any;
  public totalPages;
  public totalRecords;
  public itemsPerPage: any;
  public programId:any;
  dataLoading = true;
  public columnData;
  public searchTerm;
  public searchLocation;
  public isAdvanceFilter: boolean = false;
  public limit = 10;
  public pageNo = 1;
  candidateDetails: any;
  public street_1 = [];
  public street_2 = [];
  public selected_socail_apps = [];
  public city = [];
  public state = [];
  public zipcode = [];
  public country = [];
  public filterCandidate : boolean = false;
  public candidateFilterInput$ = new Subject<string | null>();

  public jobtitleFilterInput$ = new Subject<string | null>();
  public  baseUrl : string;
  maskCandidate = this.authService.authorize('mask_unique_id');
  constructor(
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private _candidateService: CandidateService,
    private _eventStream: EventStreamService,
    private _loader: LoaderService,
    public jobService: JobsService,
    private _alert: AlertService,
    private datePipe: LocalDateFormatPipe,
    private accessControlService: AccessControlService,
    private authService: AuthorizationService
    ) { }

  ngOnInit(): void {
    // pre loading the candidate data.
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.baseUrl = '/submission-manager';
    this.programId = programDetails['id'];
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    this.maskCandidate = this.maskCandidate && this.user_type?.toUpperCase() !== UsersType.Super_org;
    this.candidateId = this.route.snapshot.queryParams['candidateId'];
    const candidate_list_refdata = this.storageService.get('candidateListRefData');
    if (candidate_list_refdata) {
      if (candidate_list_refdata.limit) {
        this.limit = candidate_list_refdata.limit;
      }
      if (candidate_list_refdata.pageNo) {
        this.pageNo = candidate_list_refdata.pageNo;
      }
      if (candidate_list_refdata.searchTerm) {
        this.searchTerm = candidate_list_refdata.searchTerm;
      }
    }

    this.storageService.set('candidateListRefData', null, true);
    this.tableConfig = {
      title: 'Candidates',
      columnList: [
        { name: 'candidate_name', title: 'Candidate Name', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEditCandidate: true, isDisableorDelete: (this.accessControlService.accessControl() && this.authService.authorize('update_candidate')), showPreviewIcon: true},
        { name: 'is_enabled', title: 'status', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'candidate_id', title: 'Unique ID', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false ,isMasked: this.maskCandidate},
        { name: 'location', title: 'Location', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'title', title: 'Title', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor_name', title: 'Vendor Name', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'current_assignments', title: 'Current Assignments', width: 14, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'previous_assignments', title: 'Previous Assignments', width: 14, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'submitted_jobs', title: 'Submitted Jobs', width: 14, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'modified_on', title: 'Last updated', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      isDownload: false,
      isCreate: true,
      permission: 'create_candidate',
      density: 'COMFORTABLE',
      tableWidth: '1500px',
      filterCandidateBy: this.user_type === 'vendor' ? [
        {
          title: programDetails.name,
          value: this.programId
        },
        {
          title: 'ALL',
          value: '"All"'
        }
      ] : [],
      advanceFilter: [
        { name: 'name', title: 'Search By Title or  ID', filterType: 'TEXT' },
        {
          name: 'candidate_id',
          title: 'Unique ID',
          filterType: 'TEXT',
          multiSelectData: [],
          eventEmiiter: this.candidateFilterInput$,
          changeHandler: this.searchCandidateFilter
        },
        {
          name: 'location',
          title: 'Location',
          filterType: 'TEXT',

        },
        {
          name: 'date_range',
          title: 'Last updated on',
          filterType: 'DATERANGE',

        },
        {
          name: 'is_enabled',
          title: 'Status',
          filterType: 'SELECT',
          multiSelectData: [
            { name: 'Active', value: true },
            { name: 'In-Active', value: false },
          ],
        },
        {
          name: 'job_title',
          title: 'Job Title',
          filterType: 'SELECT',
          multiSelectData: [],
          eventEmiiter: this.jobtitleFilterInput$,
          changeHandler: this.searchJobTitleFilter
        },
      ],
    };
    this.searchJobTitleFilter();
    this.candidatesList();
    if(programDetails?.config?.generic_list_pages?.['candidate']){
      this.getGlobalFlagsList();
    }
  }

  getGlobalFlagsList() {
    this._candidateService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
           this.tableConfig.enableGenricListViewButton =  data.global_launch_data.find(config => config.slug === 'candidate_list_view_\'try_new_view\'')?.is_enabled;
            if(this.tableConfig.enableGenricListViewButton){
              this.tableConfig.genericListConfig = {'URL':'jobs/genericlist/CandidateModule/Candidate','oldURL':'candidates/list'};
            }
        }
      },
    });
  }

  searchCandidateFilter = (term = '') => {
    let url = `/configurator/candidates?limit=25&page=1&program_id=${this.programId}`;

    if (term) {
      url += `&k=${term}`;
    }
    this._candidateService.get(url)
      .pipe(map((res: any) => res.candidates.map(can => {
        return { value: can.unique_id, name: can.unique_id };
      }))
      )
      .subscribe(data => {
        this.tableConfig.advanceFilter[1].multiSelectData = data;
      });

  }

  searchJobTitleFilter(term = '') {
    let url = `/job-manager/job-catalog/job_title`;

    if (term) {
      url += `?q=${term}`;
    }

    this.jobService.get(url).subscribe(
      data => {
        const titleData = data?.results;

        const ftitleData = [];
        titleData?.forEach(d => {

          ftitleData.push({ value: d?.title, name: d?.title });
        });

        this.tableConfig.advanceFilter[5].multiSelectData = ftitleData;
      });
  }

  changeStatus(event) {
    this._candidateService.chnageCandidateStatus(event).subscribe({
        next: (res: any) => {
        this.dataLoading = true;
        this._alert.success(`Candidate updated successfully `);
        this.candidatesList();
      },
      error: err => {
        this._alert.error(errorHandler(err));
      }});
  }
  onSortClick(event) {
  }
  onFliterCandidate(event){
    this.candidatesList()
  }
  onClickRecords(event) {
    this.limit = event;
    this.pageNo = 1;
    this.candidatesList();
  }
  candidatesList() {
    const search = this.searchTerm ? ('&k=' + this.searchTerm) : ''
    this.dataLoading = true;

    this._candidateService.fetchCandidates(this.limit, this.pageNo, search).subscribe((data: any) => {
      const noOfPages = Math.ceil(data.total_records / data.items_per_page);
      const cand_arr = [];
      const filtercandidate=[];
      data?.candidates.forEach(element => {
        let location = '';

        element.addresses.forEach(element => {
          if (element.type === 'PRIMARY') {
            location = `${element?.state ? element?.state + ',' : ''} ${element?.country ? element?.country : ''}`

          }
        });
        filtercandidate.push({ value: element.unique_id, name: element.unique_id })
        const candidate_name1 = (element?.middle_name) ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}` : `${element?.first_name} ${element?.last_name}`;

        const candidate_list_data = {
          'candidate_name': candidate_name1,
          'id': element.id,
          'candidate_id': element.unique_id,
          'candidate_real_id': element.id,
          'location': location,
          'title': element?.title,
          'current_assignments': element?.current_assignment > 0 ? element?.current_assignment?.toString() : '--',
          'previous_assignments': element?.previous_assignment > 0 ? element?.previous_assignment?.toString() : '--',
          'submitted_jobs': element?.submitted_job > 0 ? element?.submitted_job?.toString() : '--',
          'is_enabled': element.is_enabled,
          'avatar': element.avatar,
          'vendor_name': element.vendor?.name,
          'modified_on':this.datePipe.transform(element?.modified_on)+' '+this.datePipe.transform(element?.modified_on,'hh:mm:ss a z')
        }
        cand_arr.push(candidate_list_data);
      });
      this.tableConfig.advanceFilter[1].multiSelectData = filtercandidate;
      this.vmsData = { candidate: cand_arr };
      // this.vmsData = data?.candidates;
      this.dataLoading = false;
      this.totalPages = noOfPages;
      this.totalRecords = data?.total_records;
      this.itemsPerPage = data?.items_per_page;
      this.tableLoaded = true;
    });

  }

  onClickView(event) {
    if (event?.column === 'current_assignments' || event?.column === 'submitted_jobs' || event?.column === 'previous_assignments') {
      this.columnData = event;
      this._eventStream.emit((new EmitEvent(Events.VIEW_CANDIDATE_ASSIGNMENT_AND_JOBS, this.columnData)));
      return;
    }
    if(event){
      this.router.navigate([`candidates/candidate/${event.candidate_real_id}/profile`]);
    }
  }

  previewClicked(event){
    if (event) {
      this._eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, { candidateId: event.id, showOnlyCandidateProfile: true, selectedIndex: 0, })
      );
    }
  }
  onSearch(event) {
      this.searchTerm = event ? event : '';
      this.pageNo = 1;
      this.candidatesList();
  }

  onCreateClick($event) {
    if ($event) {
      this.router.navigate(['/candidates/create']);
    }
  }

  getCandidateDetails(id) {
    this._loader.show();
    this._candidateService.getCandidateDetail(id).subscribe(
      (data: any) => {
        if (data) {
          this.candidateDetails = data.candidate;
        }
      })
  }

  onPaginationClick(event) {
    this.pageNo = event;
    if (!this.isAdvanceFilter) {
      this.candidatesList();
    } else {
      this.getCandidateListFilter();
    }
  }
  onEditClick(eve) {
    this.storageService.set('candidateListRefData', { pageNo: this.pageNo, limit: this.limit, searchTerm: this.searchTerm }, true);
    this.router.navigate([`candidates/edit/${eve.candidate_real_id}`]);
  }

  onListFilter(event) {
    if (event) {
      this.isAdvanceFilter = true;
      if (event.hasOwnProperty('is_enabled')) {
        if (event.is_enabled) {
          this.filter.is_enabled = true;
        } else {
          this.filter.is_enabled = false;
        }
      }
      if (event.name) {
        this.filter.name = event.name;
      } else {

        delete this.filter.name;
      }
      if (event.hasOwnProperty('location')) {
        this.filter.location = event.location;
      }

      if (event.hasOwnProperty('date_range')) {
        this.filter.date_range = event.date_range;
      }

      if (event.hasOwnProperty('candidate_id')) {
        this.filter.candidate_id = event.candidate_id;
      }
      if (event.hasOwnProperty('job_title')) {
        this.filter.job_title = event.job_title;
      }

      this.pageNo=1;
      this.getCandidateListFilter();
    } else {
      this.filter = {};
      this.isAdvanceFilter = false;
      this.pageNo=1;
      this.candidatesList();
    }
  }

  getCandidateListFilter() {
    this.dataLoading = true;
    let url = `${this.baseUrl}/candidates/advanced-filters?program_id=${this.programId}`;
    let pagination = {
      limit: this.limit,
      page: this.pageNo,
    };
    this._candidateService.post(url, { filters: this.filter,pagination:pagination }).subscribe({
      next: (data:any) => {
        const noOfPages = Math.ceil(data.total_records / data.items_per_page);
        var cand_arr = [];

        data?.candidates.map((element) => {
          let location = '';

          element.addresses.forEach(element => {
            if (element.type === 'PRIMARY') {
              location = `${element?.state ? element?.state + ',' : ''} ${element?.country ? element?.country : ''}`

            }
          });

          const candidate_name1 = (element?.middle_name) ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}` : `${element?.first_name} ${element?.last_name}`;

          const candidate_list_data = {
            'candidate_name': candidate_name1,
            'id': element.id,
            'candidate_id': element.unique_id,
            'candidate_real_id': element.id,
            'location': location,
            'title': element?.title,
            'current_assignments': element?.current_assignment > 0 ? element?.current_assignment?.toString() : '--',
            'previous_assignments': element?.previous_assignment > 0 ? element?.previous_assignment?.toString() : '--',
            'submitted_jobs': element?.submitted_job > 0 ? element?.submitted_job?.toString() : '--',
            'is_enabled': element.is_enabled,
            'avatar': element.avatar,
            'vendor_name': element?.vendor?.name,
            'modified_on':this.datePipe.transform(element?.modified_on)+' '+this.datePipe.transform(element?.modified_on,'hh:mm:ss a z')
          }
          cand_arr.push(candidate_list_data);

        });
        this.vmsData = { 'candidate': cand_arr };
        this.dataLoading = false;
        this.totalPages = noOfPages;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this.tableLoaded = true;
      },
      error: (err) => {
        this.dataLoading = false;
        this._alert.error(errorHandler(err));
      }
    },
    );
  }

}
