import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import {
  StorageKeys,
  StorageService,
} from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../../../job-details.service';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Candidate } from 'src/app/shared/components/duplicate-candidates/duplicate-candidates.model';

@Component({
  selector: 'app-candidate-job-view-content',
  templateUrl: './candidate-job-view-content.component.html',
  styleUrls: ['./candidate-job-view-content.component.scss'],
})
export class CandidateJobViewContentComponent implements OnInit, OnDestroy {
  currentTab: string = 'profile';
  public createOffer: boolean = false;
  currentProgram: any;
  submitedCandidateDetail;
  isDsaasVendorInfo;
  public isfromAvlCandidate: string = '';
  @Input() set submitedCandidateDetailData(data){
    this.submitedCandidateDetail=data;
    let candidateStatus = this.submitedCandidateDetail?.status;
    this.showUserHistory(candidateStatus)
  }
  @Input() set isDsaasVendor(data) {
    this.isDsaasVendorInfo = data;
  };
  currentOfferId :any;
  noOffer :boolean =true;
  offerData:any;
  isSubmission = false;
  jobStatus:any;
  user_type;
  showHistory:boolean = false;
  showOnBoarding;
  canViewCredentialing = false
  constructor(
    private candidateService: CandidateService,
    private route: ActivatedRoute,
    private jobDetailService: JobDetailsService,
    private storageService: StorageService,
    private router: Router,
    private credentialingService: CredentialingService,
  ) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  }

  availableTabs: any = [
    'profile',
    'resume',
    'credentials',
    'submissions',
    'interviews',
    'offers',
    'onboarding',
  ];

  candidateId;
  jobId;
  subscriptions = [];
  setAvailableCd: boolean = false;
  offerInfo;
  candidateData;

  ngOnInit(): void {
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.subscriptions.push(
      this.route.paramMap.subscribe((param) => {
        this.route?.firstChild?.url.subscribe((data) => {
          this.currentTab = data[0].path;
        });
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            this.subscriptions.push(
              this.route?.firstChild?.url.subscribe((data) => {
                this.currentTab = data[0].path;
              })
            );
          }
        });
        // sync Candidate when Candidate Id provided
        this.candidateId = param.get('candidateId');
        if (this.credentialingService.isEnable() && this.candidateId) this.syncCandidate(this.candidateId)

        this.jobId = param.get('id');
        if(this.jobId){
          this.fetchOfferByCandidateJob();
          this.getJobDetails(this.jobId);
        }
      }),
      this.route.queryParamMap.subscribe((params) => {
        this.isfromAvlCandidate = params.get('isfromAvailableCandidate');
        if (this.isfromAvlCandidate) {
          this.setAvailableCd = true;
        }
      })
    );
    this.isSubmission = this.route.snapshot.queryParams['is_submission'];
    window.scrollTo(0,0);
  }

  
  syncCandidate(candidateId: string) {
    this.candidateService.getCandidateDetail(candidateId).subscribe({
      next: (data: {candidate: Candidate}) => {
        const candidate = data?.candidate
        if (!candidate?.linked_cred_candidate_id) {
          // sync candidate if not sync
          this.credentialingService.syncCandidate(candidate?.id).subscribe({
            next: (_: any) => {
              // sync success
              this.canViewCredentialing = this.credentialingService.canViewCredentialing()
            },
          })
        } else {
          // show tab when synced
          this.canViewCredentialing = this.credentialingService.canViewCredentialing()
        }
      }
    });
  }

  // submitedCandidateDetail: any;


  // checkPermission() {
  //   const user_permission = this.storageService.get('user_permission');
  //   return user_permission?.includes('schedule_interview');
  // }

  showUserHistory(status){
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    let isShortElabled = this.currentProgram?.config?.submission?.is_shortlisting_enabled;
    status = this.getDisplayStatus(status);
    const configMSP = currentConfig?.some(c => c?.short_actor?.toLowerCase() == 'msp');
    const configCLIENT = currentConfig?.some(c => c?.short_actor?.toLowerCase() == 'client')

      if(isShortElabled){
        if(configMSP && configCLIENT){
          this.showHistory = true;
        }
        else if(configCLIENT){
          this.showHistory = this.user_type == 'client' || (this.user_type =='msp' && (status != 'pending shortlist' && status !='Re-Hire Check Pending')) ? true : false;
        }
        else if(configMSP){
          this.showHistory = this.user_type == 'msp' || (this.user_type =='client' && (status != 'pending shortlist' && status !='Re-Hire Check Pending')) ? true : false;
        }
      }
      else{
        this.showHistory = true
      }
  }

  getDisplayStatus(candidate_status: string) {
    let candidateStatus = candidate_status;
    switch (candidate_status) {
      case 'OFFER_RELEASED':
        candidateStatus = 'offer released';
        break;
      case 'OFFER_ACCEPTED':
        candidateStatus = 'offer accepted';
        break;
      case 'RELEASED':
        candidateStatus = 'released';
        break;
      case 'ACCEPTED':
        candidateStatus = 'accepted';
        break;
      case 'REJECTED':
        candidateStatus = 'rejected';
        break;
      case 'COUNTERED':
        candidateStatus = 'countered';
        break;
      case 'WITHDRAWN':
        candidateStatus = 'withdrawn';
        break;
      case 'SUBMITTED':
        candidateStatus = 'submitted';
        break;
      case 'OFFER_REJECTED':
        candidateStatus = 'offer rejected';
        break;
      case 'OFFER_COUNTERED':
        candidateStatus = 'offer countered';
        break;
      case 'PENDING_SHORTLIST':
        candidateStatus = 'pending shortlist';
        break;
      case 'PENDING_SHORTLIST_REVIEW':
        candidateStatus = 'pending shortlist review';
        break;
      case 'SHORTLIST_REVIEW_REJECTED':
        candidateStatus = 'shortlist review rejected';
        break;
      case 'OFFER_PENDING_APPROVAL':
        candidateStatus = 'Pending Offer Approval';
        break;
      case 'REHIRE_CHECK_PENDING':
        candidateStatus = 'Re-Hire Check Pending';
        break;
      case 'REHIRE_REJECTED':
        candidateStatus = 'Re-Hire Rejected';
        break;
      case 'OFFER_WITHDRAWN':
        candidateStatus = 'offer withdrawn';
        break;
      case "PENDING_OFFER_REVIEW":
        candidateStatus = 'Pending Offer Review';
        break;
      case "COUNTERED_PENDING_REVIEW":
        candidateStatus = 'Countered Pending Review';
        break;
      case "COUNTERED_CANCELLED":
        candidateStatus = 'Countered Review Cancelled';
        break;
      case "OFFER_CANCELLED":
        candidateStatus = 'Offer Cancelled';
        break;
      case "COUNTERED_OFFER_REVIEW_CANCELLED":
        candidateStatus = 'Countered Offer Review Cancelled';
        break;
      case "COUNTERED_OFFER_PENDING_REVIEW":
        candidateStatus = 'Countered Offer Pending Review';
        break;
      case 'INTERVIEW_CANCELLED':
        candidateStatus = 'Interview Cancelled';
        break;
      case 'INTERVIEW_SCHEDULED':
        candidateStatus = 'Interview Scheduled';
        break;
      case 'INTERVIEW_ACCEPTED':
        candidateStatus = 'Interview Accepted';
        break;
      case 'INTERVIEW_REJECTED':
        candidateStatus = 'Interview Rejected';
        break;
      case 'INTERVIEW_COMPLETED':
        candidateStatus = 'Interview Completed';
        break;
      case 'PENDING_INTERVIEW_REVIEW':
        candidateStatus = 'Pending Interview Review';
        break;
    }
    return candidateStatus;
  }

  getJobDetails(id){
    this.jobDetailService.loadJob(id).subscribe((res: any) => {
      this.jobStatus = res?.job?.status;
    });
  }

  getSubmitCandidate() {
    this.submitedCandidateDetail = null;
    this.jobDetailService
      .getSubmissionDetails(
        this.currentProgram?.id,
        this.jobId,
        this.candidateId
      )
      .subscribe({
        next: (data: any) => {
          this.submitedCandidateDetail = data?.candidate;
        },
        error: (err) => {}
  });
  }

  fetchOfferByCandidateJob() {
    this.jobDetailService
      .fetchOfferForCandidate(this.currentProgram?.id, this.candidateId, this.jobId)
      .subscribe({
        next: (res: any) => {
          if(!!res?.offers?.length){
            this.currentOfferId = res.offers[0].id ;
          }
          if(this.currentOfferId){
            this.jobDetailService.getOfferDetails(this.jobId,this.candidateId,this.currentOfferId).subscribe((res: any) =>{
              this.offerInfo = res?.offer;
            });
          }
          if (!!this.currentOfferId) {
            this.noOffer = false;
            this.offerData = res.offers[0];
            if(this.isDsaasVendorInfo){
              this.showOnBoarding = this.user_type === 'vendor' && this.offerData?.status?.toUpperCase()==='ACCEPTED' ? true : false;
            }
          } else {
            this.noOffer = true;

          }
        },
        error: (err) => {}
  });
  }

  getofferDetails() {
    if (this.jobId) {
      return this.jobDetailService.getOfferDetails(
        this.jobId,
        this.candidateId,
        this.currentOfferId
      );
    }
  }


  tabClick(tabName) {
    if (
      (this.currentTab.includes('submissions') ||
        this.currentTab.includes('interviews')) &&
      !this.setAvailableCd &&
      tabName === 'offers'
    ) {
      this.createOffer = true;
    }
    this.currentTab = tabName;
    const queryParams = [
      ...(this.createOffer ? [`createOffer=${this.createOffer}`] : []),
      ...(this.isSubmission ? ['is_submission=true'] : [])
    ]

    if(this.jobId && this.candidateId){
      this.router.navigateByUrl(
        `jobs/details/job-details/${this.jobId}/candidate/${
          this.candidateId
        }/${tabName}${queryParams.length ? `?${queryParams.join('&')}` : ''}`
      );
    }
    else{
      this.router.navigateByUrl(
        `candidates/candidate/${
          this.candidateId
        }/${tabName}`
      );
    }

  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get disableOnboarding (){

    return this.currentProgram?.config?.is_onboading_disabled
  }
}
