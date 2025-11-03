import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { InterviewDetailsSidebarComponent } from '../components/interview-details-sidebar/interview-details-sidebar.component';

@Component({
  selector: 'app-job-details-sidebar-view',
  templateUrl: './job-details-sidebar-view.component.html',
  styleUrls: ['./job-details-sidebar-view.component.scss'],
})
export class JobDetailsSidebarViewComponent implements OnInit, OnDestroy {
  public isSidebarVisible = 'hidden';
  public profilevisible = true;
  public showSkelton = true;
  public selectedIndex: number;
  public sideBarReferenceData = '';
  public candidateData: any;
  public candidateId: any;
  public assignment_Id: any;
  interviewId;

  public tabMenu = '';
  public payloadData: any;
  public reference_page = '';
  tableNoDataObj: any;
  jobData: any;
  showOnlyCandidateProfile = false;
  showUseThisProfile = false;

  isOffer: boolean = false;
  showSidebarHeader = false;
  showSidebarFooter = false;
  clickOutside: boolean;
  private offerData: any;
  @ViewChild(InterviewDetailsSidebarComponent)
  interviewComponent: InterviewDetailsSidebarComponent;
  constructor(
    private eventStream: EventStreamService,
    private _loader: LoaderService,
    private alert: AlertService,
    private candidateService: CandidateService,
    private jobService: JobDetailsService,
    private storageService: StorageService
  ) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }
  currentProgram;
  job_id;
  subscriptions = [];
  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_VIEW).subscribe((data) => {
      this._loader.show();
      if (data) {
          this.showSkelton = true;
          this.candidateId = data?.candidateId;

          if (
            data['selectedIndex'] != undefined &&
            data['selectedIndex'] != null
          ) {
            this.selectedIndex = data['selectedIndex'];
          }
          this.sideBarReferenceData = data?.['details'];
          if(this.candidateId){
            this.getCandidateDetails(this.candidateId);
          }

          if (data.job_id) {
            this.job_id = data.job_id;
            this.getJobDetails(this.job_id);
          }

          if(data.job_id && data.reference_page !== 'available-candidate') {
            this.getInterviews();
          }

          if (data.assignment_Id) {
            this.assignment_Id = data.assignment_Id;
          }
          if (data.reference_page) {
            this.reference_page = data.reference_page;
          }

          if (data.interviewId) {
            this.interviewId = data.interviewId;
          }

          if (data?.showUseThisProfile) {
            this.showUseThisProfile = data.showUseThisProfile;
          }

          if (data?.showOnlyCandidateProfile) {
            this.showOnlyCandidateProfile = data?.showOnlyCandidateProfile;
          } else {
            if (data.selectedMenu === 'offers') {
              this.isOffer = true;
              this.showOnlyCandidateProfile = false;
              this.offerData = data?.details || {};
            }
          }
          this.clickOutside = true;
        } else {
          this.isSidebarVisible = 'hidden';
        }
      })
    );
  }

  sidebarClose() {
    this.isSidebarVisible = 'hidden';
    this.interviewId = null;
  }

  getJobDetails(jobid) {
    if (jobid) {
      this.jobService.getJobs(`${jobid}`).subscribe({
        next: (data: any) => {
          if (data.job) {
            this.jobData = data.job;
            this.populatePayloadData();
          }
        },
       error: (err) => {
          this.alert.error(errorHandler(err));
        }
    });
    }
  }

  handleTabChangeEvent(e) {
    if (!this.interviewId && this.interviews && this.interviews[0]) {
      this.interviewId = this.interviews[0].id;
      this.interviews[0].isActive = true;
    }
    this.handleTabChange(e);
  }

  handleTabChange(e) {

    switch (e) {
      case 0: {
        this.tabMenu = 'FETCH_CANDIDATE_PROFILE';
        this.payloadData = {
          candidate: this.candidateData,
          candidateId: this.candidateId,
          reference_page: this.reference_page,
          job_id: this.jobData?.uid,
          jobUrlId: this.jobData?.id,
        };
        break;
      }
      case 1: {
        this.tabMenu = 'FETCH_CANDIDATE_RESUME';
        this.payloadData = {
          candidate: this.candidateData,
          candidateId: this.candidateId,
        }
        break;
      }
      case 2: {
        this.tabMenu = 'FETCH_SUBMISSION_DETAIL';
        this.payloadData = {
          candidate: this.candidateData,
          job: this.jobData,
          candidateId: this.candidateId,
        };
        break;
      }
      case 3: {
        this.tabMenu = 'FETCH_INTERVIEW_DETAILS';
        this.payloadData = {
          candidate: this.candidateData,
          job: this.jobData,
          interviewId: this.interviewId,
          programId: this.currentProgram.id,
        };
        setTimeout(() => {
          if (
            this.interviewComponent &&
            this.currentProgram &&
            this.interviewId
          ) {
            this.interviews.forEach((i) => {
              i.isActive = i.id === this.interviewId;
            });
            this.interviewComponent.interviewDetails(
              this.currentProgram.id,
              this.jobData?.id,
              this.interviewId
            );
          }
        });
        break;
      }
      case 4: {
        this.tabMenu = 'FETCH_OFFER_DETAILS';
        this.payloadData = {
          candidate: this.candidateData,
          job: this.job_id,
          offer: this.offerData,
        };
        break;
      }
      case 5: {
        this.tabMenu = 'FETCH_CANDIDATE_PROFILE';
        this.payloadData = {
          candidate: this.candidateData,
          job: this.jobData,
          assignment_Id: this.assignment_Id,
        };
        break;
      }

    }
    this._loader.hide();
  }
  populatePayloadData() {
    this.handleTabChange(this.selectedIndex);
    this.isSidebarVisible = 'visible';
  }

  getCandidateDetails(id) {
    this.candidateService.getCandidateDetail(id).subscribe({
      next: (data: any) => {
        if (data) {

          this.candidateData = data.candidate;
          if(this.candidateData?.first_name) this.candidateData.first_name = this.jobService.toTitleCase(this.candidateData.first_name);
          if(this.candidateData?.last_name) this.candidateData.last_name = this.jobService.toTitleCase(this.candidateData.last_name);
          if(this.candidateData?.middle_name) this.candidateData.middle_name = this.jobService.toTitleCase(this.candidateData.middle_name);
          this.showSkelton = false;

          this.populatePayloadData();
        }
      },
      error: (error) => {
        this.alert.error(errorHandler(error));
        this._loader.hide();
      }
  });
  }
  // need to remove this while cleanup
  interviews = [];
  getInterviews() {
    this.jobService
      .getInterviewList(this.job_id, null, this.candidateId)
      .subscribe((data: any) => {
        this.interviews = data.interviews;
        if (this.interviewId) {
          this.interviews.forEach((i) => {
            i.isActive = i.id === this.interviewId;
          });
        }
      });
  }

  handleSubTabChange(event) {
    this.interviews && this.interviews.forEach((i) => (i.isActive = false));
    const currentInterview = this.interviews[event.subIndex];
    currentInterview.isActive = true;
    this.interviewId = currentInterview.id;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
