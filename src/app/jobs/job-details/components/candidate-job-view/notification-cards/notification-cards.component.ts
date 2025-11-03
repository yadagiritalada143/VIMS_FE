import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import {
  EmitEvent,
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobDetailsService } from '../../../job-details.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LOG_TYPE , Log } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-notification-cards',
  templateUrl: './notification-cards.component.html',
  styleUrls: ['./notification-cards.component.scss'],
})
export class NotificationCardsComponent implements OnInit, OnChanges, OnDestroy {
  private subscriptions = [];
  svgValue = `0, 100`;
  svgValueInt = `20, 100`;
  svgValueOffer = `40, 100`;
  svgAcceptOffer = `60, 100`;
  candidateid:string=undefined;
  offerRes;
  submissionManager: any;
  isInterviewCompleted: boolean = false;
  count = 1;
  noAssignmentId;
  interval;
  userDetails: any;
  jobDetails: any;
  isuserInterviewer: boolean;
  @Input() set candidateId(candidateid:string){
    this.candidateid=candidateid;
  }
  jobid:string=undefined;
  @Input() jobStatus;
  @Input() set jobId(jobid:string){
    this.jobid=jobid;
  }
  submitedCandidateDetails:any=undefined;
  @Input() set submitedCandidateDetail(submitedCandidateDetails){
    this.submitedCandidateDetails=submitedCandidateDetails;
    if(this.submitedCandidateDetails?.assignment_id){
      this.getAssignmentDetails(this.submitedCandidateDetails?.assignment_id);
    }
  };
  @Input() interviews: any[] = [];
  offerDetails: any;
  offer: any;
  @Input() set offers(offerdtl: any) {
    this.offerDetails = [...offerdtl];
    if(this.offerDetails[0]?.job?.id &&  this.offerDetails[0]?.candidate?.id && this.offerDetails && this.offerDetails[0]?.id){
      this.jobService.getOfferDetails(this.offerDetails[0]?.job?.id, this.offerDetails[0]?.candidate?.id, this.offerDetails && this.offerDetails[0]?.id)
      .subscribe(res => {
        this.offer = res;
        if(this.offer?.offer?.assignment_id){
          this.getAssignmentDetails(this.offer?.offer?.assignment_id);
        }
        if((this.offer?.offer?.id) && this.offer?.offer?.status.toLowerCase() === 'accepted' && !this.offer?.offer?.assignment_id && !this.offer?.offer?.assignment_failed_msg){
          this.gettingOfferres();
        }
      })
    }
  }
  @Input() assignments: any = {};
  userType: string = '';
  public showDropdownOffer: boolean = false;
  @ViewChild('optionButton')
  optionButton: ElementRef;
  @ViewChild('optionButtonCounteroffer', { read: ElementRef, static: false })
  optionButtonCounteroffer: ElementRef;
  showOption = false;
  private accountDetails = this.storageService.get('account');
  public showSidePanel = "hidden";
  public sidePanelViewMode = false;
  showCreatedBy: boolean;
  currentProgram:any;
  loading:boolean = false;
  logs: Log= undefined;
  triggerAssignmentId;
  candId;
  constructor(
    private userPermissionService: UserPermissionService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private eventStreamService: EventStreamService,
    private jobService: JobDetailsService,
    private localDatePipe: LocalDateFormatPipe,
  ) { }

  getDate(d) {
    let t = new Date(d * 1000).toISOString().substr(0, 10);
    return this.localDatePipe.transform(`${t}`);
  }

  ngOnInit(): void {
    this.submissionManager = '/submission-manager';
    this.userType = this.storageService.get('user_type');
    this.jobid = this.route.snapshot.params['id'];
    this.candId = this.route.snapshot.params['candidateId'];
    this.jobDetails = this.storageService.get('viewd_job');
    this.userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.subscriptions.push(this.eventStreamService.on(Events.RELOAD_OFFERS).subscribe((data) => {
      if (typeof data === 'object' && data['isAcceptReject'] ) {
        this.router.navigate([
          `jobs/details/job-details/${this.jobid}/candidate/${this.offerDetails[0]?.candidate?.id || this.candId}/offers`,
        ])
      }
    }));

    this.subscriptions.push(this.eventStreamService.on(Events.MARK_INTERVIEW_COMPLETE).subscribe((data) => {
      this.markComplete(data);
    }));
    this.jobService.offer_details_tab_clicked$.subscribe(val => {
      if(val == "reload" && this.jobService.needToReloadNotificationComponent) {
        this.jobService.needToReloadNotificationComponent = false;
        this.ngOnInit();
      }
    });
    this.showCreatedBy = this.checkVendorOrMsp();
  }

  getAssignmentDetails(assignment_id){
    this.loading = true;
    this.subscriptions.push(this.jobService.fetchAssignments(assignment_id)
      .subscribe({
        next: (data: any) => {
        this.assignments= {...data};
        this.loading = false;
      },
      error: (err)=>{
        this.showError(err);
        this.loading = false;
      }}));
  }
  get userTypes() {
    return UserType;
  }

  get hasInternviews() {
    return Array.isArray(this.interviews) && Boolean(this.interviews.length);
  }

  ngOnChanges(changes: SimpleChanges) {

  }

  markComplete(data) {
    const program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `${this.submissionManager}/programs/${program.id}/jobs/${this.jobid}/interviews/${this.interviews[0].id}`;
    let payLoad: any= {
      status: 'COMPLETED'
    }
    if(data?.reason && data?.reason?.reason) {
      payLoad.status_reason = data.reason.reason
    };
    if(data?.reason && data?.reason?.notes) {
      payLoad.status_note = data.reason.notes
    }
    if(data?.reason && data?.reason?.rating) {
      payLoad.interview_rating = data.reason.rating
    }
    this.subscriptions.push(this.jobService.put(url,payLoad)
      // this.jobService.candidateAction({
      //   'status': 'COMPLETED'
      // }, data.jobid, data.interviewId, data.candidateid)
      .subscribe(data => this.eventStreamService.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true))));
  }
  gettingOfferDetails(){
    this.jobService.getOfferDetails(this.offerDetails[0]?.job?.id, this.offerDetails[0]?.candidate?.id, this.offerDetails && this.offerDetails[0]?.id).subscribe({
      next: (res: any) =>{
      this.offer = res;
    },
    error: error=>{
      this.showError(error);
      this.loading = false;
    }});
  }
  gettingOfferres(){
       this.loading = true;
       this.jobService.getOfferDetails(this.offerDetails[0]?.job?.id, this.offerDetails[0]?.candidate?.id, this.offerDetails && this.offerDetails[0]?.id).subscribe({
        next: (res: any) =>{
        this.offer = res;
        this.offerRes = res?.offer;
        this.count ++;
         if(this.offerRes?.assignment_id){
          this.getAssignmentDetails(this.offerRes?.assignment_id);
          }
          else if(!this.offerRes?.assignment_id) {

              this.interval = setInterval(() => {
                if(this.count <=3){
                  this.gettingOfferres();
                }
              }, 10000);

            if(this.count > 3){
              clearInterval(this.interval);
              this.noAssignmentId = true;
              this.loading = false;
              return false;
            }
          }
       },
       error: error=>{
            this.showError(error);
            this.loading = false;
      }});

  }
  initAssignment(){
   this.loading = true;
   this.jobService.retriggerAssignment(this.jobid, this.offerDetails[0].id, null).subscribe((data: any) =>{
    if(data?.assignment){
      this.triggerAssignmentId = data?.assignment?.id;
      this.subscriptions.push(this.jobService.fetchAssignments(this.triggerAssignmentId)
      .subscribe({
        next: (data: any) => {
        this.assignments= {...data};
        if(this.assignments){
          this.loading = false;
        }
      },
      error: error=>{
        this.showError(error);
        this.loading = false;
      }}));
    }
  }, error=>{
    this.gettingOfferDetails();
    this.showError(error);
    this.loading = false;

  });

  }
  get waitingForInterviewAcceptance() {
    return (
      Array.isArray(this.interviews) &&
      this.interviews.some((intr) => intr.status === 'PENDING_ACCEPTANCE')
    );
  }

  get newTimeProposed() {
    return (
      Array.isArray(this.interviews) &&
      this.interviews.some((intr) => intr.status === 'PENDING_CONFIRMATION')
    );
  }

  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading:err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  // reachedInterviewStartTime = false;
  get CurrentInterview() {
    // Need to check with BA, which interview to be onsidered for card display if there are more thanone
    // Righnow picking the first one
    this.interviews?.forEach(element => {
      if(element.status == 'SCHEDULED') {
        this.isInterviewCompleted = true;
      }
    })
    return this.interviews && this.interviews[0];
  }

  get AcceptedSchdule() {
    // Need to check with BA, which interview to be onsidered for card display if there are more thanone
    // Righnow picking the first one
    return (
      this.CurrentInterview &&
      this.CurrentInterview.schedules &&
      this.CurrentInterview.schedules.find((s) => s.is_accepted)
    );
  }

  get hasInterviewCancelled() {
    return (
      Array.isArray(this.interviews) &&
      this.interviews.every((intr) => intr.status === 'CANCELLED')
    );
  }

  get hasAllAccpetedInterview() {
    return (
      Array.isArray(this.interviews) &&
      this.interviews.every((intr) => intr.status === 'ACCEPTED')
    );
  }

  get rejectedAllInterview() {
    return (
      Array.isArray(this.interviews) &&
      this.interviews.every((intr) => intr.status === 'REJECTED')
    );
  }

  get InterviewCompleted() {
    return (
      this.CurrentInterview && this.CurrentInterview.status === 'COMPLETED'
    );
  }

  get InterviewStartTIme() {
    const slot = this.CurrentInterview && this.CurrentInterview.schedules.find(s => s.is_accepted);
    if (slot) {
      let slotDateTime = new Date(slot.date + ' ' + slot.start_time);
      return slotDateTime;
    }

    return null;
  }

  get ReachedInterviewStartTime() {
    const slot = this.CurrentInterview && this.CurrentInterview.schedules.find(s => s.is_accepted);
    if (slot) {
      let slotDateTime = new Date(slot.date + ' ' + slot.start_time);
      var timeleft = slotDateTime.getTime() - new Date().getTime();
      return timeleft > 0;
    }

    return false;
  }



  get ScheduledInternvew() {
    return this.interviews.find((intr) => intr.status === 'SCHEDULED');
  }

  get hasOffers() {
    return (
      Array.isArray(this.offerDetails) && Boolean(this.offerDetails.length)
    );
  }

  get hasOfferReleasedAndCreated() {
    return (
      this.hasOffers &&
      this.offerDetails[0].status === 'RELEASED'
    );
  }

  get hasOfferReleasedAndCountered() {
    return (
      this.hasOffers &&
      this.offerDetails[0].status === 'COUNTERED'
    );
  }

  get hasOfferReleasedAndRejected() {
    return this.hasOffers && this.offerDetails[0].status === 'REJECTED';
  }

  get hasOfferReleasedAndWithdrawn() {
    return this.hasOffers && this.offerDetails[0].status === 'WITHDRAWN';
  }

  get hasOfferCancelled() {
    return this.hasOffers && this.offerDetails[0].status === 'CANCELLED';
  }

  get hasCounterOfferCancelled() {
    return this.hasOffers && this.offerDetails[0].status === 'COUNTERED_CANCELLED';
  }

  get hasOfferReleasedAndAccepted() {
    return this.hasOffers && this.offerDetails[0].status === 'ACCEPTED';
  }

  public isUserRole(role: UserType | string) {
    const currentUserRole = this.userPermissionService.currentUserRole();
    return currentUserRole === role;
  }

  get CanWithdrawOffer() {
    return this.isUserRole(UserType.Client) || this.isUserRole(UserType.MSP) || this.isUserRole(UserType.Super_org) || this.isUserRole(UserType.Vendor);
  }

  get hasAdminAccess() {
    return this.isUserRole(UserType.Client) || this.isUserRole(UserType.MSP) || this.isUserRole(UserType.Super_org);
  }

  get hasVendorOrWorkerAccess() {
    return this.isUserRole(UserType.Vendor) || this.isUserRole(UserType.Worker)
  }


  showDropdown() {
    this.showDropdownOffer = true;
    const itemPosition = this.optionButton.nativeElement.getBoundingClientRect();
    const pageBody = document.getElementById('pagecontainer');
    const windowHeight = pageBody.offsetHeight;
    const targetItem = document.getElementById('rowDropdownWorkflow1');
    const targetHeight = targetItem.offsetHeight;

    targetItem.style.top = `${itemPosition.top + window.scrollY + 5}px`;
    targetItem.style.left = `${itemPosition.left - 250}px`;

    targetItem.classList.add('active');

    if (itemPosition.top + window.scrollY + 45 + targetHeight > windowHeight) {
      targetItem.classList.add('flip');
    } else {
      targetItem.classList.remove('flip');
    }
  }

  hideDropdownBox() {
    const targetItem = document.getElementById('rowDropdownWorkflow1');
    targetItem.classList.remove('active');
    targetItem.classList.remove('flip');
    targetItem.style.top = '';
    targetItem.style.left = '';
  }
  clickToCounterOffer() {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobid}/candidate/${this.offerDetails[0].candidate.id}/offers?offerId=${this.offerDetails[0].id}&counterOffer=true`
    );
  }

  clickToAcceptOffer() {
    this.eventStreamService.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER, {
        id: this.offerDetails[0].id,
        isopen: true,
        jobId: this.jobid,
      })
    );
  }

  clickToRejectOffer() {
    this.eventStreamService.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER, {
        id: this.offerDetails[0].id,
        isopen: true,
        jobid: this.jobid,
      })
    );
  }

  openOptions() {
    this.showDropdownOffer = true;
    const itemPosition = this.optionButton.nativeElement.getBoundingClientRect();
    const pageBody = document.getElementById('pagecontainer');
    const windowHeight = pageBody.offsetHeight;
    const targetItem = document.getElementById('rowDropdownWorkflow1');
    if (targetItem) {
      const targetHeight = targetItem.offsetHeight;

      targetItem.style.top = `${itemPosition.top + window.scrollY + 5}px`;
      targetItem.style.left = `${itemPosition.left - 250}px`;

      targetItem.classList.add('active');

      if (
        itemPosition.top + window.scrollY + 45 + targetHeight >
        windowHeight
      ) {
        targetItem.classList.add('flip');
      } else {
        targetItem.classList.remove('flip');
      }
    }
  }
  get interviewId() {
    return this.CurrentInterview && this.CurrentInterview.id;
  }

  goToAction(event) {
    switch (event) {
      case 'submission':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobid}/candidate/${this.candidateid}/submissions`
        );
        break;
      case 'view-interview':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobid}/candidate/${this.candidateid}/interviews`
        );
        break;
      case 'schedule-interview':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobid}/candidate/${this.candidateid}/interviews/create`
        );
        break;
      case 'cancel-interview':
        this.eventStreamService.emit(
          new EmitEvent(Events.CANCEL_INTERVIEW, {
            value: {
              value: true,
              candidateid: this.candidateid,
              jobid: this.jobid,
              interviewId: this.interviewId,
            },
          })
        );
        break;
      case 're-schedule-interview':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobid}/candidate/${this.candidateid}/interviews/re-schedule/${this.interviewId}`,
          {
            state: { isReschedule: true },
          }
        );
        break;
      case 'withdraw-candidate':
        this.eventStreamService.emit(
          new EmitEvent(Events.WITHDRAW_CANDIDATE, {
            value: true,
            candidateId: this.candidateid,
            jobId: this.jobid,
          })
        );
        break;
      case 'withdraw-offer':
        this.eventStreamService.emit(
          new EmitEvent(Events.WITHDRAW_OFFER, {
            value: true,
            offerId: this.offerDetails[0]?.id,
            jobId: this.jobid,
          })
        );
        break;
      case 'mark-interview-complete':
        this.showSidePanel = "visible";
        break;
      case 'reject-candidate':
        this.eventStreamService.emit(
          new EmitEvent(Events.REJECT_CANDIDATE, {
            value: true,
            candidateid: this.candidateid,
            jobid: this.jobid,
          })
        );
        break;
      case 'create-offer':
        this.router.navigateByUrl(
          `/jobs/details/job-details/${this.jobid}/candidate/${this.candidateid}/offers?createOffer=true`
        );
        break;
      case 'propose-new-time':
        if(!this.router?.url?.includes('interviews/details')){  
          this.router?.navigateByUrl(
            `jobs/details/job-details/${this.jobid}/candidate/${this?.candidateid}/interviews/details?id=${this.CurrentInterview?.id}&proposeTime=true`
          )}
        else this.eventStreamService.emit(new EmitEvent(Events.PROPOSE_NEW_TIME,true))  
      default:
        break;
    }
  }

  get hasAssignments() {
    return !!this.offer?.offer?.assignment_id || !!this.submitedCandidateDetails?.assignment_id || !!this.triggerAssignmentId || !!this.offerRes?.assignment_id;
  }

  onSidePanelClose() {
    this.showSidePanel = "hidden";
  }

  onSubmit(event) {
    this.eventStreamService.emit(
          new EmitEvent(Events.MARK_INTERVIEW_COMPLETE, {
            value: true,
            candidateid: this.candidateid,
            jobid: this.jobid,
            interviewId: this.CurrentInterview?.id,
            reason: event
          })
        );
    this.showSidePanel = "hidden";
  }

  clickToViewAssignment(assignment_uuid) {
    this.router.navigateByUrl(
      `/assignment/details/${assignment_uuid}/final?tab=assignment`
    );
  }

  checkVendorOrMsp() {
      var usertype =this.storageService.get('user_type');

      if(usertype == "VENDOR"){
        return true;
      }
      else if(usertype == "MSP"){
        return true;
      }else if (usertype == "CLIENT" && this.currentProgram.config.is_vendor_neutral && this.submitedCandidateDetails.created_by.user_type == "MSP") {
        return true;
      }
      else{
        return false;
      }

    }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }


  get visibleCreateButton() {
    return (!this.isUserRole(UserType.Vendor) && !this.isUserRole(UserType.Worker)) || (this.accountDetails?.organization?.category == 'SUPER_ORG');
  }
  get isVendorUser(){
    return (this.accountDetails?.organization?.category=='VENDOR')
  }
}
