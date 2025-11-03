import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { Candidate } from 'src/app/shared/components/duplicate-candidates/duplicate-candidates.model';
import { Widget } from 'src/app/shared/credentialing-iframe/credentialing-iframe.model';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

@Component({
  selector: 'app-candidate-job-credentials',
  templateUrl: './candidate-job-credentials.component.html',
  styleUrls: ['./candidate-job-credentials.component.scss'],
})
export class CandidateJobCredentialsComponent implements OnInit {
  widgetType: string = Widget.ORG_CANDIDATE_CREDENTIAL
  candidateData: Candidate
  logs: Log = undefined;
  iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    position: 'relative',
  }

  constructor(private _loader: LoaderService, private candidateService: CandidateService, private route: ActivatedRoute, private credentialingService: CredentialingService) {}

  ngOnInit(): void {
    if (this.credentialingService.canViewCredentialing())
      this.route?.parent?.params.subscribe(params => {
        this.getCandidateDetails(params['candidateId'])
      });
  }

  getCandidateDetails(id) {
    this._loader.show();
    this.candidateService.getCandidateDetail(id, true).subscribe({
      next: (data: {candidate: Candidate}) => {
        if (data) {
          this.candidateData = data.candidate;
          this._loader.hide();
        }
      },
      error: error => {
        this.showError(error);
        this._loader.hide();
      },
    });
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
  }
}
