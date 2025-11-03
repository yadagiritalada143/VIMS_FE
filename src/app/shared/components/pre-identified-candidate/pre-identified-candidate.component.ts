import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { JobStatus} from '../../enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';

@Component({
  selector: 'app-pre-identified-candidate',
  templateUrl: './pre-identified-candidate.component.html',
  styleUrls: ['./pre-identified-candidate.component.scss']
})
export class PreIdentifiedCandidateComponent implements OnInit {
  isCreateCandidate = 'hidden';
  createJobObject: any = {};
  candidates = [];
  jobData: any;
  isCreateEstimate: boolean = false;
  addCandidate = false;
  isPreDefinedCan: boolean = false;
  preidntified = false;
  userType;
  loggedInUserId;
  showCreateBtn = false;
  isPreIdCalled = false;

  @Input() set preIdCandidates(val) {
    if (val?.length > 0) {
      this.isPreDefinedCan = true;
      this.candidates = val;
      this.getCandidates();
    }
  };
  @Input() isCreateEdit = false;
  @Input() set jobDetails(val) {
    this.jobData = val;
    this.getCandidates();
  }  
  @Output() candidatedata = new EventEmitter();
  constructor(private storageS: StorageService,
    private confirmService: ConfirmationDialogService,
    private router: Router,
    private alertService: AlertService,
    private JobsService: JobDetailsService,
  ) { }

  ngOnInit(): void {
    this.userType = this.storageS.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.loggedInUserId = this.storageS.get(StorageKeys.CURRENT_ACCOUNT)?.organization?.id;
  }

  openPreIdCandidateCreation() {
    this.createJobObject.editedCandidate = {};
    this.isCreateCandidate = 'visible';
  }

  candidate(e) {
    if (
      this.createJobObject.editedCandidate &&
      this.createJobObject.editedCandidate.hasOwnProperty('index') &&
      this.createJobObject?.editedCandidate?.index !== -1
    ) {
      this.isPreDefinedCan = true
      this.candidates[this.createJobObject.editedCandidate.index] = e;
      this.createJobObject.editedCandidate = {};
    } else {
      this.isPreDefinedCan = true
      this.candidates.push(e);
    }
  }

  onCreateClose() {
    this.isCreateCandidate = 'hidden';
    this.isCreateEstimate = false;
    this.createJobObject.editedCandidate = null;
    this.candidatedata.emit(this.candidates)
  }

  onClickToggle() {
    this.addCandidate = !this.preidntified;
    this.preidntified = !this.preidntified;
  }

  removeCandidate(i) {
    this.confirmService.confirm('', `Are you sure you want to delete the candidate?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.candidates.splice(i, 1);
        }
      })
      .catch(() => { });
  }

  editPreIdCandidate(index, isViewMode?) {
    const editedData = this.candidates[index];
    editedData.index = index;
    editedData.disableFields = !!isViewMode;
    this.createJobObject.editedCandidate = editedData;
    this.isCreateCandidate = 'visible';
  }

  openCandidateCreationScreen(index) {
    const candidateData = this.candidates[index];
    candidateData.index = index;
    candidateData.is_create_candidate = true;
    this.createJobObject.editedCandidate = candidateData;
    this.isCreateCandidate = 'visible';

  }

  getDetail() {
    this.isCreateCandidate = 'hidden';
  }

  editAndSubmitCandidate(event): void {
    if (
      !(this.jobData?.status?.toLowerCase()?.status?.toLowerCase() === JobStatus.HALTED) ||
      this.jobData?.status?.toLowerCase() === JobStatus.HOLD ||
      this.jobData?.status?.toLowerCase() === JobStatus.FILLED ||
      this.jobData?.status?.toLowerCase() === JobStatus.CLOSED
    ) {
      window.scrollTo(0, 0);
      this.router.navigate([`/candidates/edit/${event.candidate_id}`], {
        queryParams: { job: this.jobData?.id, submit: true, returnUrl: encodeURIComponent(this.router.url) },
      });
    } else {
      this.alertService.warn(`Submissions are not allowed for the job!`);
    }
  }

  getCandidates() {
    if (this.jobData && this.candidates && !this.isPreIdCalled) {
      this.isPreIdCalled = true;
      const programId = this.storageS.get(StorageKeys.CURRENT_PROGRAM)?.id;
      const url = `/submission-manager/programs/${programId}/candidates`;
      this.JobsService.post(url, {
        candidate_ids: this.candidates?.filter((res) => res?.candidate_id)?.map((res) => res?.candidate_id),
        job_id: this.jobData?.id
      }).subscribe({
        next: (data: any) => {
          this.candidates.forEach((res, i) => {
            // createdCandidate is the candidate which is created, i.e. it is not pre id candidate now.
            const createdCandidate = data?.candidates?.find((candidate) => candidate?.id == res?.candidate_id);
            if (createdCandidate) {
              createdCandidate['id'] = res?.id;
              createdCandidate['phone_number'] = createdCandidate?.phone;
              this.candidates[i] = { ...res, ...createdCandidate };
            }
          });
        },
        error: () => {
          this.alertService.error('Unable to load the list of pre-identified candidates');
          this.candidates = [];
        }
      })
    }
  }

}
