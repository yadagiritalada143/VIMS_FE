import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { CryptoService } from 'src/app/core/services/crypto.service';
@Component({
  selector: 'app-candidate-resume-view',
  templateUrl: './candidate-resume-view.component.html',
  styleUrls: ['./candidate-resume-view.component.scss']
})
export class CandidateResumeViewComponent implements OnInit {

  resumeURL: any;
  candidateData: any;
  CandidateId: any;
  isLoading:boolean = true;
  logs: Log= undefined;
  currentProgram: any = {}
  constructor(
    private candidateService: CandidateService,
    private _loader: LoaderService,
    public storageService: StorageService,
    private route: ActivatedRoute,
    private cryptoService: CryptoService  ) { }

  ngOnInit(): void {

    this.route.parent?.params.subscribe(params => {
      this.CandidateId = params['candidateId'];
    });
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.init();

  }
  init() {
    if (this.CandidateId) {
    this.getCandidateDetails(this.CandidateId);
    }
  }

  getCandidateDetails(id) {
    this._loader.show();
    this.candidateService.getCandidateDetail(id,true).subscribe({
      next: (data: any) => {
        if (data) {
          this.isLoading = false;
          this.candidateData = data.candidate;
          this.resumeURL = this.cryptoService?.decrypt(this.candidateData?.resume_url);
          this._loader.hide();
        }
      },
      error: (error) => {
        // this.alert.error(error);
        this.showError(error);
        this._loader.hide();
      }});
  }

  downloadAttachment(data) {
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    }
    else {
      // this.alert.error('Resume Not Found.', {});
      this.showError('Resume Not Found.');
    }
    link.dispatchEvent(new MouseEvent('click'));
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
}
