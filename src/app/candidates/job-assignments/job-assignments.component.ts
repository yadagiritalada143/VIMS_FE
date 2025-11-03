import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { CandidateService } from '../service/candidate.service';
import { Router } from '@angular/router';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-job-assignments',
  templateUrl: './job-assignments.component.html',
  styleUrls: ['./job-assignments.component.scss']
})
export class JobAssignmentsComponent implements OnInit, OnDestroy {
  private subscrptions: Subscription[] = [];
  public currentAssignments;
  @Input() currentColumnData;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public tableConfigAssignment: VMSConfig
  public isExpand = false;
  public totalPages = 1;
  public totalRecords = 0;
  public tableLoaded = false;
  dataLoading = true;
  currentAssignmet = true;
  closedAssignmet = false;
  submittedJob = false;
  pageNo = 1;
  itemPerPage = 10;

  currentAssignmetCount = 0;
  closedAssignmetCount = 0;
  submittedJobCount = 0;
  sidebarTitle = "Job Assignments";
  candidateDetails: any;
  loaded = false;
  programId;
  jobStatus;
  assignmentData;
  prevAssignments;
  assignmentStatus;
  constructor(private _eventStream: EventStreamService,
    private storageService: StorageService,
    private _candidateService: CandidateService, 
    public router: Router,
  ) { }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.tableConfig = {
      title: 'Candidate Submission List ',
      columnList: [
        { name: 'title', title: 'Job', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isDisableorDelete: false, isNavigation: true, isNoOption: true },
        { name: 'status', title: 'Candidate Status', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'ref_id', title: 'Job Id', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'job_location_name', title: 'Location', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'rate', title: 'Rate', width: 14, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, enableClick: false }
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      isDownload: false,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: "1500px",
      sortOptions: [
        { title: 'Created On', key: 'created_on' }
      ],
      isSort: false,

    };

    this.tableConfigAssignment = {
      title: 'Current Assignment List ',

      columnList: [
        { name: 'assignment_title.name', title: 'Assignment', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isDisableorDelete: false, isNavigation: true, isNoOption: true },
        { name: 'candidate_status', title: 'Candidate Status', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'Id', title: 'Assignment Id', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'work_location.name', title: 'Location', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'rate', title: 'Rate', width: 14, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, enableClick: false }
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      isDownload: false,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: "1500px",
      sortOptions: [
        { title: 'Created On', key: 'created_on' }
      ],
      isSort: false,

    };

    this.subscrptions.push(this._eventStream.on(Events.VIEW_CANDIDATE_ASSIGNMENT_AND_JOBS).subscribe((data) => {
      if (data) {
        if (data?.column == "previous_assignments") {
          this.currentAssignmet = false;
          this.closedAssignmet = true;
          this.submittedJob = false;
          this.sidebarTitle = "Previous Assignments";
          this.prevAssignments = this.sidebarTitle

        } else if (data?.column == "submitted_jobs") {
          this.currentAssignmet = false;
          this.closedAssignmet = false;
          this.submittedJob = true;
          this.sidebarTitle = "Submitted Jobs";
        } else if (data?.column == "current_assignments") {
          this.currentAssignmet = true;
          this.closedAssignmet = false;
          this.submittedJob = false;
          this.sidebarTitle = "Current Assignments";
        }
        this.candidateDetails = data;
        this.currentAssignmetCount = isNaN(data?.current_assignments) ? 0 : data?.current_assignments;
        this.closedAssignmetCount = isNaN(data?.previous_assignments) ? 0 : data?.previous_assignments;
        this.submittedJobCount = isNaN(data?.submitted_jobs) ? 0 : data?.submitted_jobs;

        this.listOfjobs(1);
        this.currentAssignments = 'visible';
      } else {
        this.currentAssignments = 'hidden';
      }
    }));

  }
  getDisplayStatus(offer_status: string) {
    let offerStatus = offer_status;
    switch (offer_status) {
      case 'OFFER_RELEASED':
        offerStatus = 'offer released';
        break;
      case 'OFFER_ACCEPTED':
        offerStatus = 'offer accepted';
        break;
      case 'RELEASED':
        offerStatus = 'released';
        break;
      case 'ACCEPTED':
        offerStatus = 'accepted';
        break;
      case 'REJECTED':
        offerStatus = 'rejected';
        break;
      case 'COUNTERED':
        offerStatus = 'countered';
        break;
      case 'WITHDRAWN':
        offerStatus = 'withdrawn';
        break;
      case 'SUBMITTED':
        offerStatus = 'submitted';
        break;
      case 'OFFER_REJECTED':
        offerStatus = 'offer rejected';
        break;
      case 'OFFER_COUNTERED':
        offerStatus = 'offer countered';
        break;
      case 'PENDING_SHORTLIST':
        offerStatus = 'pending shortlist';
        break;
      case 'PENDING_SHORTLIST_REVIEW':
        offerStatus = 'pending shortlist review';
      break;
      case 'SHORTLIST_REVIEW_REJECTED':
        offerStatus = 'shortlist review rejected';
      break;
      case 'OFFER_PENDING_APPROVAL':
        offerStatus = 'Pending Offer Approval';
        break;
      case 'REHIRE_CHECK_PENDING':
        offerStatus = 'Re-Hire Check Pending';
        break;
      case 'REHIRE_REJECTED':
        offerStatus = 'Re-Hire Rejected';
        break;
      case "OFFER_WITHDRAWN":
       offerStatus='offer withdrawn';
      break;
      case "INTERVIEW_PENDING_INTERVIEW_REVIEW":
      offerStatus = 'Pending Review';
      break;
      case "INTERVIEW_SCHEDULED":
      offerStatus = 'Scheduled';
      break;
      case "INTERVIEW_REJECTED":
      offerStatus = 'Rejected';
      break;
      case "INTERVIEW_CANCELLED":
      offerStatus = 'Cancelled';
      break;
      case "INTERVIEW_ACCEPTED":
      offerStatus = 'Accepted';
      break;
      case 'INTERVIEW_COMPLETED':
        offerStatus = 'Interview Completed';
      break;
      case "PENDING_OFFER_REVIEW":
      offerStatus = 'Pending Offer Review';
      break;
      case "COUNTERED_PENDING_REVIEW":
      offerStatus = 'Countered Pending Review';
      break;
      case "COUNTERED_CANCELLED":
      offerStatus = 'Countered Review Cancelled';
      break;
      case "OFFER_CANCELLED":
      offerStatus = 'Offer Cancelled';
      break;
      case "COUNTERED_OFFER_REVIEW_CANCELLED":
      offerStatus = 'Countered Offer Review Cancelled';
      break;
      case "COUNTERED_OFFER_PENDING_REVIEW":
      offerStatus = 'Countered Offer Pending Review';
      break;
      case "PENDING_INTERVIEW_REVIEW":
      offerStatus = 'Pending Review';
      break;
      case "INTERVIEW_SCHEDULED":
      offerStatus = 'Scheduled';
      break;
      case "INTERVIEW_REJECTED":
      offerStatus = 'Rejected';
      break;
      case "INTERVIEW_CANCELLED":
      offerStatus = 'Cancelled';
      break;
      case "INTERVIEW_ACCEPTED":
      offerStatus = 'Accepted';
      break;
    }
    return offerStatus;
  }
  sidebarClose() {
    this._eventStream.emit((new EmitEvent(Events.VIEW_CANDIDATE_ASSIGNMENT_AND_JOBS, false)));
    this.currentAssignments = "hidden";
  }
  onClickView(e, type) {
    if (type == 'assign') {
      this.router.navigate([`assignment/details/${e?.assignment_uuid}/final`], { queryParams: { tab: 'assignment' } });
    } else if (type == 'job') {
      this.router.navigate([`jobs/details/job-details/${e?.id}/submitted-candidate`]);
    }
  }

  listOfjobs(pageNo) {
    this.dataLoading = true
    let status = '';
    if (this.currentAssignmet) {
      status = "hired";

    } else if (this.closedAssignmet) {
      status = "closed";

    } else if (this.submittedJob) {
      status = "submitted";

    }
    this.subscrptions.push(this._candidateService.fetchCandidatesJobs(this.itemPerPage, pageNo, this.candidateDetails?.candidate_real_id, status, this.programId).subscribe((rec: any) => {
      const noOfPages = Math.ceil(rec.total_records / rec.items_per_page);
      this.vmsData = rec?.submission;
      this.assignmentData = rec?.submission?.data?.data;
      if(this.vmsData){
        this.vmsData = Array.isArray(this.vmsData) ? this.vmsData?.filter((element:any) => element.status = this.getDisplayStatus(element.status)) : [];
      }
      this.assignmentStatus = (rec?.submission?.candidate_status == true) ? 'Active' : 'Inactive'
      this.assignmentData = Array.isArray(this.assignmentData) ? this.assignmentData.filter(item => item.candidate_status = this.assignmentStatus) : [];
      this.dataLoading = false;
      this.totalPages = noOfPages;
      this.totalRecords = rec?.total_records;
      this.itemPerPage = rec?.items_per_page;
      this.tableLoaded = true;
    }));

  }

  onPaginationClick(e) {
    this.pageNo = e;
    this.listOfjobs(e)
  }

  submittedJobsList() {
    this.submittedJob = true;
    this.currentAssignmet = false;
    this.closedAssignmet = false;
    this.sidebarTitle = "Submitted Jobs"
    this.listOfjobs(1)
  }

  currentAssignmentList(data) {
    this.currentAssignmet = true;
    this.submittedJob = false;
    this.closedAssignmet = false;
    this.sidebarTitle = "Job Assignments"
    this.listOfjobs(1);
    this.tableConfigAssignment.title = data

  }

  closedAssignmentList(data) {
    this.closedAssignmet = true;
    this.submittedJob = false;
    this.currentAssignmet = false;
    this.sidebarTitle = "Previous Assignments"
    this.listOfjobs(1);
    this.tableConfigAssignment.title = data

  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

}
