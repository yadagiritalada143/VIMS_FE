import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { JobDetailsService } from '../../job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute } from '@angular/router';
import {
  StorageKeys,
  StorageService,
} from 'src/app/core/services/storage.service';
import { Subscription } from 'rxjs';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-withdraw-candidate',
  templateUrl: './withdraw-candidate.component.html',
  styleUrls: ['./withdraw-candidate.component.scss'],
})
export class WithdrawCandidateComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  withdrawSidebar = 'hidden';
  candidateId: '';
  jobId: '';
  public withdrawForm: UntypedFormGroup;
  public candidateWithdrwanReason = {};
  title: string = 'Withdrawal Reason';
  label: string = 'Withdrawal Reason';
  btnLabel: string = 'Withdraw';
  isRejectCandidate: boolean = false;
  cancelInterview: boolean = false;
  rejectInterview: boolean = false;
  interviewID: any;
  currentProgram: any;
  acceptOffer: boolean = false;
  rejectOffer: boolean = false;
  loading: boolean = false;
  @Output() onWithdrawnCandidate = new EventEmitter();
  @Output() onActionSuccess = new EventEmitter();
  picklistId: any;
  pickListsData: any = [];
  optPickListData: any = [];
  @Input() offerId?: any;
  cancelConsolidate: boolean = false;
  invoiceid: string = '';
  withdrawOffer;
  logs: Log= undefined;
  userType;
  private baseUrl: string = '';
  cancelOffer: boolean = false;
  isPendingInterviewReview: any;
  candId;
  uploadJD = {};
  onBoardingReview: any;
  newUploadfileArr = [];
  moduleType;
  moduleId;
  isValidFileSize: boolean = true;
  cancelCounteredOffer: boolean = false;
  isShortlistReviewRejected:boolean;
  taxData:any;
  isTaxValid:boolean;
  isShowTax: boolean = false;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private alert: AlertService,
    private ActivatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private reasonCodesService: ReasonCodesService,
  ) {
    this.baseUrl = '/submission-manager';
  }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.isPendingInterviewReview = this.currentProgram?.config?.interview?.pending_interview_review;
    this.jobId = this.route.snapshot.params['id'];
    this.candId = this.route.snapshot.params['candidateId'];
    this.userType = this.storageService.get(StorageKeys.USER_TYPE);
    this.withdrawForm = this.fb.group({
      reason: [null, Validators.required],
      notes: [null, ''],
    });
    this.subscriptions.push(this.eventStream.on(Events.WITHDRAW_CANDIDATE).subscribe((data) => {
      if (data.value) {
        this.title = 'Withdrawal Reason';
        this.label = 'Withdrawal Reason';
        this.btnLabel = 'Withdraw';
        this.withdrawSidebar = 'visible';
        this.candidateId = data.candidateId;
        this.jobId = data.jobId;
        this.reasonCodesService.getResoncodesFor('WITHDRAW_CANDIDATE').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.isShowTax = this.jobService.showTaxInComponents(this.currentProgram?.config, true);
    this.subscriptions.push(this.eventStream.on(Events.WITHDRAW_OFFER).subscribe((data) => {
      if (data.value) {
        this.title = 'Withdrawal Reason';
        this.label = 'Withdrawal Reason';
        this.btnLabel = 'Withdraw Offer';
        this.withdrawSidebar = 'visible';
        this.candidateId = data.candidateId;
        this.jobId = data.jobId;
        this.withdrawOffer = true;
        this.offerId = data.offerId;
        this.reasonCodesService.getResoncodesFor('WITHDRAW_OFFER').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.REJECT_CANDIDATE).subscribe((data) => {

      if (data.value) {
        this.title = 'Rejection Reason';
        this.label = 'Rejection Reason';
        this.btnLabel = 'Reject';
        this.isRejectCandidate = true;
        this.withdrawSidebar = 'visible';
        this.candidateId = data?.candidateid || data?.candidateId || data?.value?.candidateid || data?.value?.candidateId;
        this.jobId = data?.jobId || data?.jobid || data?.value?.jobId || data?.value?.jobid || this.ActivatedRoute.snapshot.params['id'];
        this.reasonCodesService.getResoncodesFor('REJECT_CANDIDATE','name').subscribe(a => {
          this.optPickListData = a.reason_codes;
        }, (err) => {
          this.loading = false;
        });
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.SHORTLIST_REVIEW_REJECT).subscribe((data) => {

      if (data.value) {
        this.title = 'Shortlist Review Reject';
        this.btnLabel = 'Shortlist Review Reject';
        this.isShortlistReviewRejected = true;
        this.withdrawSidebar = 'visible';
        this.withdrawForm.controls.reason.setValidators([]);
        this.withdrawForm.controls.reason.setErrors(null);
        this.candidateId = data?.candidateid || data?.candidateId || data?.value?.candidateid || data?.value?.candidateId;
        this.jobId = data?.jobId || data?.jobid || data?.value?.jobId || data?.value?.jobid || this.ActivatedRoute.snapshot.params['id'];
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.CANCEL_INTERVIEW).subscribe((data) => {
      if (data.value) {
        this.title = 'Cancellation Reason';
        this.label = 'Cancellation Reason';
        this.btnLabel = 'Cancel Interview';
        this.cancelInterview = true;
        this.withdrawSidebar = 'visible';
        this.candidateId = data?.value?.candidateId;
        this.interviewID = data?.value?.interviewId;
        this.jobId = data?.value?.jobId
          ? data?.value?.jobId
          : (this.ActivatedRoute?.snapshot?.params?.['id'] ? this.ActivatedRoute?.snapshot?.params?.['id'] : this.ActivatedRoute?.snapshot?.parent?.params?.['id']);
        this.reasonCodesService.getResoncodesFor('CANCEL_INTERVIEW').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });
        if (this.isPendingInterviewReview && this.userType === 'MSP') {
          this.withdrawForm.controls.reason.setValidators([]);
          this.withdrawForm.controls.reason.setErrors(null);
        }
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.REJECT_INTERVIEW).subscribe((data) => {
      if (data.value) {
        this.title = data?.value?.title;
        this.label = 'Rejection Reason';
        this.btnLabel = 'Reject';
        this.rejectInterview = true;
        this.withdrawSidebar = 'visible';
        this.candidateId = data?.value?.candidateId;
        this.interviewID = data?.value?.interviewId;
        this.jobId = data?.value?.jobId ? data?.value?.jobId : this.ActivatedRoute.snapshot.params['id'];
        this.reasonCodesService.getResoncodesFor('REJECT_INTERVIEW').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER).subscribe((data) => {
      if (data.isopen) {
        this.title = 'Offer Acceptance';
        this.label = 'Offer Acceptance';
        this.btnLabel = 'Accept Offer';
        this.withdrawSidebar = 'visible';
        this.offerId = data.id;
        this.taxData = data?.taxData;
        this.acceptOffer = true;
        this.jobId = data.jobId;
        this.withdrawForm.controls.reason.setValidators([]);
        this.withdrawForm.controls.reason.setErrors(null);
        this.getPickListData();
      } else {
        this.acceptOffer = false;
        this.withdrawSidebar = 'hidden';
        this.withdrawForm.controls.reason.setValidators([Validators.required]);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER).subscribe((data) => {
      if (data.isopen) {
        this.title = 'Offer Rejection Reason';
        this.label = 'Offer Rejection Reason';
        this.btnLabel = 'Reject Offer';
        this.withdrawSidebar = 'visible';
        this.offerId = data.id;
        this.jobId = data.jobId;
        this.rejectOffer = true;
        this.updateValidators(this.withdrawForm);

        this.reasonCodesService.getResoncodesFor('REJECT_OFFER').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });

        //this.getPickListData();
      } else {
        this.rejectOffer = false;
        this.withdrawSidebar = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_CANDIDATE_REJECTION).subscribe((data) => {
      if (data.isopen) {
        this.title = 'Candidate Rejection Reason';
        this.label = 'Candidate Rejection Reason';
        this.btnLabel = 'Reject Candidate';
        this.withdrawSidebar = 'visible';
        this.offerId = data.id;
        this.jobId = data.jobId;
        this.isRejectCandidate = true;
        this.updateValidators(this.withdrawForm);
        this.candidateId = data?.candidateId;
        this.reasonCodesService.getResoncodesFor('REJECT_CANDIDATE').subscribe(a => {
          this.optPickListData = a.reason_codes;
        });
      } else {
        this.isRejectCandidate = false;
        this.withdrawSidebar = 'hidden';
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.CANCEL_CONSOLIDATION).subscribe((data) => {
      if (data.isopen) {
        this.title = 'Cancel Consolidation';
        this.label = 'Cancel Consolidation';
        this.btnLabel = 'Cancel Consolidation';
        this.withdrawSidebar = 'visible';
        this.cancelConsolidate = true;
        this.invoiceid = data?.invoiceId;
        this.fetchReasonCodes();
      } else {
        this.cancelConsolidate = false;
        this.withdrawSidebar = 'hidden';
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_REJECT_REVIEW_OFFER).subscribe((data) => {
      if (data) {
        this.title = 'Cancel Offer Review';
        this.label = 'Cancel Offer Review';
        this.btnLabel = 'Cancel Offer';
        this.withdrawSidebar = 'visible';
        this.offerId = data?.id;
        this.cancelOffer = true;
        this.jobId = data?.jobId;
        this.withdrawForm.controls.reason.setValidators([]);
        this.withdrawForm.controls.reason.setErrors(null);
        //this.getPickListData();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.COUNTERED_REVIEW_OFFER).subscribe((data) => {
      if (data) {
        this.title = 'Cancel Countered Offer Review';
        this.label = 'Cancel Countered Offer Review';
        this.btnLabel = 'Cancel Countered Offer';
        this.withdrawSidebar = 'visible';
        this.cancelCounteredOffer = true;
        this.offerId = data?.id;
        this.jobId = data?.jobId;
        this.withdrawForm.controls.reason.setValidators([]);
        this.withdrawForm.controls.reason.setErrors(null);
        //this.getPickListData();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.REVIEW_ONBOARDING).subscribe((data) => {
      if (data.value) {
        let isOnboardingCompleted=data?.isCompletedStatus;
        this.title = 'Onboarding Review';
        this.label = isOnboardingCompleted ? 'Onboarding Review Reasons' : 'Onboarding Override Reasons';
        this.btnLabel = 'Submit';
        this.withdrawSidebar = 'visible';
        this.onBoardingReview = true;
        this.updateValidators(this.withdrawForm);
        this.candidateId=data?.candId;
        this.moduleType=data?.moduleType;
        this.moduleId=data?.moduleId;
        this.reasonCodesService.getResoncodesFor( isOnboardingCompleted ? 'ONBOARDING_REVIEW_REASON' : 'ONBOARDING_OVERRIDE_REASON').subscribe(a => {
          this.optPickListData = a?.reason_codes;
        });
      } else {
        this.withdrawSidebar = 'hidden';
      }
    }));

   // this.getPickListData();
  }

  uploadFiles(event) {
    let filedata = [];
    if (event) {
      event.forEach(element => {
        filedata.push({
          filename: element?.name,
          raw: element?.raw,
          ext: element?.ext,
          size: element?.size?.toString(),
          type: "ONBOARDING_REVIEW_DOCUMENT",
        })
      });
      if (filedata) {
        Object.assign(this.uploadJD, { files: filedata });
      }
    }
  }

  sidebarClose() {
    this.withdrawForm.reset();
    this.isRejectCandidate = false;
    this.isShortlistReviewRejected = false;
    this.cancelInterview = false;
    this.acceptOffer = false;
    this.rejectOffer = false;
    this.withdrawSidebar = 'hidden';
    this.cancelConsolidate = false;
    this.withdrawOffer = false;
    this.cancelOffer = false;
    this.cancelCounteredOffer = false;
    this.onBoardingReview=false;
    this.logs=undefined;
    this.newUploadfileArr=[];
    this.loading=false;
  }

  withdrawCandidate() {
    this.loading = true;
    this.logs=undefined;
    if (this.isRejectCandidate || this.isShortlistReviewRejected) {
      if (this.interviewID) {
        let rejectCandidate = this.withdrawForm.value;
        const payload = {
          action: 'REJECT',
          reason: rejectCandidate.reason,
          note: rejectCandidate.notes,
        };
        this.subscriptions.push(this.jobService
          .candidateAction(
            payload,
            this.jobId,
            this.interviewID,
            this.candidateId
          )
          .subscribe({
            next: (data: any) => {
              if (data?.interview) {
                this.withdrawForm.reset();
                this.sidebarClose();
                this.alert.success('Rejected successfully');
                this.onWithdrawnCandidate.emit(true);
                this.onActionSuccess.emit({ action: 'Reject_interview' });
                this.loading = false;
                this.eventStream.emit(
                  new EmitEvent(Events.UPDATED_CANDIDATE_STATUS, true)
                );
                this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
              }
            },
            error: (err) => {
              this.showError(err);
              this.loading = false;
            }
      }));
      } else {
        let rejectCandidate = this.withdrawForm.value;
        const payload = {
          candidates: [
            {
              candidate_id: this.candidateId || this.candId,
              status_reason: rejectCandidate.reason,
              status_note: rejectCandidate.notes,
              rejection_reason: rejectCandidate.reason,
              rejection_note: rejectCandidate.notes,
            },
          ],
        };
        let rejectedMsg =  this.isRejectCandidate ? 'Candidate rejected successfully' : 'Shortlist review rejected successfully';
        this.subscriptions.push(this.jobService.rejectCandidate(payload, this.jobId).subscribe({
          next: (data: any) => {
            if (data.ref) {
              this.withdrawForm.reset();
              this.sidebarClose();
              this.alert.success(rejectedMsg)
              this.loading = false;
              this.onWithdrawnCandidate.emit(true);
              this.onActionSuccess.emit({ action: 'Reject_candidate' });
              this.eventStream.emit(
                new EmitEvent(Events.UPDATED_CANDIDATE_STATUS, true)
              );
              this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
            }
          },
          error: (err) => {
            this.loading = false;
            this.showError(err);
          }
      }));
      }
    } else if (this.cancelInterview) {
      let cancelInterview = this.withdrawForm.value;
      const payload = {
        status: 'CANCELLED',
        status_reason: cancelInterview.reason,
        status_note: cancelInterview.notes,
      };
      const url = `${this.baseUrl}/programs/${this.currentProgram.id}/jobs/${this.jobId}/interviews/${this.interviewID}`;
      this.subscriptions.push(this.jobService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            if (data?.interview) {
              this.withdrawForm.reset();
              this.sidebarClose();
              this.alert.success('Interview Cancelled successfully');
              this.onActionSuccess.emit({ action: 'cancel_interview' });
              this.loading = false;
              this.eventStream.emit(
                new EmitEvent(Events.UPDATED_CANDIDATE_STATUS, true)
              );
              this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true))
            }
          },
          error: (err) => {
            this.showError(err);
            this.loading = false;
          }
    }));
    } else if (this.acceptOffer) {
        const payload = {
          action: 'ACCEPT',
          reason: '',
          note: this.withdrawForm.controls.notes.value,
        };
        payload['taxes'] = this.taxData;
        this.subscriptions.push(this.jobService.acceptOffer(this.currentProgram?.id, payload, this.jobId, this.offerId).subscribe({
          next: (data: any) => {
            if (data.offer.id) {
              this.withdrawForm.reset();
              this.sidebarClose();
              this.alert.success('Offer Accepted Successfully');
              this.onWithdrawnCandidate.emit(true);
              this.loading = false;
              this.eventStream.emit(
                new EmitEvent(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER, {
                  isopen: false,
                })
              );
              this.eventStream.emit(
                new EmitEvent(Events.RELOAD_OFFERS, { isAcceptReject: true })
              );
              this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
              window.location.reload();
            }
          },
          error: (err) => {
            this.loading = false;
            this.showError(err);
          }
      }));

    } else if (this.rejectOffer) {
      const payload = {
        action: 'REJECT',
        reason: this.withdrawForm.controls.reason.value,
        note: this.withdrawForm.controls.notes.value,
      };
      this.subscriptions.push(this.jobService.acceptOffer(this.currentProgram?.id, payload, this.jobId, this.offerId).subscribe({
        next: (data: any) => {
          if (data.offer.id) {
            this.withdrawForm.reset();
            this.sidebarClose();
            this.alert.success('Offer Rejected successfully');
            this.onWithdrawnCandidate.emit(true);
            this.loading = false;
            this.eventStream.emit(
              new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER, {
                isopen: false,
              })
            );
            this.eventStream.emit(
              new EmitEvent(Events.RELOAD_OFFERS, { isAcceptReject: true })
            );
            this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
          }
        },
        error: (err) => {
          this.showError(err);
          this.loading = false;
        }
    }));
    } else if (this.rejectInterview) {
      const payload = {
        action: 'REJECT',
        status_reason: this.withdrawForm.controls.reason.value,
        status_note: this.withdrawForm.controls.notes.value,
      };
      this.subscriptions.push(this.jobService
        .candidateAction(
          payload,
          this.jobId,
          this.interviewID,
          this.candidateId
        ).subscribe({
          next: (data) => {
            this.withdrawForm.reset();
            this.sidebarClose();
            this.alert.success('Interview Rejected successfully');
            this.onWithdrawnCandidate.emit(true);
            this.loading = false;
            this.onActionSuccess.emit({ action: 'Reject_interview' });
            this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
          },
          error: (err) => {
            this.showError(err);
            this.loading = false;
          }
    }));
    } else if (this.cancelConsolidate) {
      // let withdrawData = this.withdrawForm.value;
      // this.subscriptions.push(this.invoiceService.cancelConfirmConsolidation('cancel',this.invoiceid,withdrawData.notes, withdrawData.reason)
      //   .subscribe( res => {
      //      this.eventStream.emit(
      //         new EmitEvent(Events.CANCEL_CONSOLIDATION, {isopen: false, cancel: true})
      //       );
      //       this.sidebarClose();
      //   }, (err) => {
      //     this.loading = false;
      //     this.alert.error(errorHandler(err));
      //   }));

    } else if (this.withdrawOffer) {
      // Maker api calls once received
      this.subscriptions.push(
        this.jobService.withdrawOffer(this.jobId, this.offerId, this.withdrawForm.value.reason, this.withdrawForm.value.notes).subscribe({
          next: (res) => {
          this.withdrawForm.reset();
          this.sidebarClose();
          this.alert.success('Withdrawn successfully');
          this.onActionSuccess.emit({ action: 'WITHDRAW_OFFER' });
        },
        error: (err) => {
          this.showError(err);
          this.loading = false;
        }
      })
      )
    } else if (this.cancelOffer) {
      const payload = {
        action: 'CANCELLED',
        reason: '',
        note: this.withdrawForm.controls.notes.value,
      };
      this.subscriptions.push(this.jobService.acceptOffer(this.currentProgram?.id, payload, this.jobId, this.offerId).subscribe({
        next: (data: any) => {
          if (data.offer.id) {
            this.withdrawForm.reset();
            this.alert.success('Offer Review Cancel successfully');
            this.onWithdrawnCandidate.emit(true);
            this.loading = false;
            this.eventStream.emit(new EmitEvent(Events.RELOAD_OFFER_DETAILS, true));
            this.eventStream.emit(
              new EmitEvent(Events.RELOAD_OFFERS, true)
            );
            this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
            this.sidebarClose();
          }
        },
        error: (err) => {
          this.showError(err);
          this.loading=false;
        }
    }));
    }
    else if (this.cancelCounteredOffer) {
      const payload = {
        action: 'COUNTERED_CANCELLED',
        reason: '',
        note: this.withdrawForm.controls.notes.value,
      };
      this.subscriptions.push(this.jobService.acceptOffer(this.currentProgram?.id, payload, this.jobId, this.offerId).subscribe({
        next: (data: any) => {
          if (data.offer.id) {
            this.withdrawForm.reset();
            this.alert.success('Counter Offer Review Cancelled successfully');
            this.onWithdrawnCandidate.emit(true);
            this.loading = false;
            this.eventStream.emit(new EmitEvent(Events.RELOAD_OFFER_DETAILS, true));
            this.eventStream.emit(
              new EmitEvent(Events.RELOAD_OFFERS, true)
            );
            this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
            this.sidebarClose();
          }
        },
        error: (err) => {
          this.showError(err);
          this.loading=false;
        }
    }));
    } else if (this.onBoardingReview) {
      let withdrawData = this.withdrawForm.value;
      let dateTime = new Date();
      const payload = {
        status: "REVIEWED",
        status_reason: withdrawData.reason,
        status_note: withdrawData.notes,
        final_files_dict: this.uploadJD,
        time: dateTime.getTime(),
      }
      let url = `/submission-manager/programs/${this.currentProgram?.id}/${this.moduleType}/${this.moduleId}/candidates/${this.candidateId}/onboardingreview`;
      this.subscriptions.push(this.jobService.put(url, payload).subscribe({
        next: (res: any) => {
          this.sidebarClose();
          this.alert.success("Onboarding Reviewed Successfully.");
          this.eventStream.emit(new EmitEvent(Events.RELOAD_ONBOARDING, true));
        },
        error: (err) => {
          this.showError(err);
          this.loading = false;
        }
    }))
    } else {
      let withdrawData = this.withdrawForm.value;
      const payload = {
        candidates: [
          {
            candidate_id: this.candidateId,
            status_reason: withdrawData.reason,
            status_note: withdrawData.notes,
          },
        ],
      };
      this.subscriptions.push(this.jobService.withdrawCandidate(payload, this.jobId).subscribe({
        next:(data: any) => {
          if (data.ref) {
            this.withdrawForm.reset();
            this.sidebarClose();
            this.alert.success('Withdrawn successfully');
            this.eventStream.emit(
              new EmitEvent(Events.WITHDRAW_CANDIDATE_SUCCESS, true)
            );
            this.eventStream.emit(
              new EmitEvent(Events.UPDATE_COUNT, true)
            );
            this.onWithdrawnCandidate.emit(true);
            this.loading = false;
            this.onActionSuccess.emit({ action: 'withdraw_candidate' });
            this.eventStream.emit(
              new EmitEvent(Events.UPDATED_CANDIDATE_STATUS, true)
            );
          }
        },
        error: (err) => {
          this.showError(err);
          this.loading = false;
        }
    }));
    }
  }

  handleTaxFormValueChange(event){
    if(event){
      this.isTaxValid = event?.isTaxValid;
      this.taxData = event?.tax
    }
  }
  getPickListData() {
    const programID = this.currentProgram?.id;
    this.subscriptions.push(this.jobService.getPickListItems(programID, 'withdraw_candidate').subscribe({
      next: (data: any) => {
        if (data) {
          this.optPickListData = data.picklist_items;
        }
      },
      error: (err) => {
        // this.alert.error(errorHandler(err));
        this.showError(err);
      }
  }));
  }

  public updateValidators(form: UntypedFormGroup) {
    for (const key in form.controls) {
      if (key === 'reason') {
        form.get(key).setValidators([Validators.required]);
      }
      form.get(key).updateValueAndValidity();
    }
  }

  fetchReasonCodes() {
    // this.invoiceService.getReasonCodeActions().subscribe(res => {
    //  let code =  res?.reason_code_actions.find(x => x.code === 'CANCEL_CONSOLIDATE_INVOICE')?.id;
    //   this.invoiceService.getReasonCodes(code).subscribe(res => {
    //       this.optPickListData = res?.reason_codes?.map(x => {
    //         return {...x, label: x.name}
    //       })
    //   });
    // })
    this.reasonCodesService.getResoncodesFor('CANCEL_CONSOLIDATE_INVOICE').subscribe(res => {
      this.optPickListData = res?.reason_codes?.map(x => {
        return { ...x, label: x.name }
      })
    })
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }



  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ?? err?.error?.error?.message ?? (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  isValidFile(event){
    this.isValidFileSize=event;
  }
}
