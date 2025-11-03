import { Component, EventEmitter, OnInit } from '@angular/core';
import { Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { PendingCandidate } from './pending-action-content.model'
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

type MTPEvent = { name: string; page: number, limit?: number };

interface Dummy { dummy: any }

@Component({
  selector: 'app-pending-action-content',
  templateUrl: './pending-action-content.component.html',
  styleUrls: [
    './pending-action-content.component.scss',
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
  ],
})
export class PendingActionContentComponent implements OnInit {
  private subscriptions: Array<Subscription> = [];
  private mtpSubject: Subject<MTPEvent> = new Subject<MTPEvent>();
  selectedMasterProfileID: string;
  currentPage = 1;
  showMTPLinking:boolean = false;
  recordsPerPageSetting = [1, 10, 25, 50, 100];
  itemsPerPage = this.recordsPerPageSetting[1];
  showPageSettingData = true;
  searchInput = '';
  showLoader = true;
  query:any;
  totalRecords = 0;
  mtpMatches:any;
  candidateData: any;
  baseURL = '/submission-manager';
  showPendingLinkError:boolean = false;
  programId: string;
  candidates: PendingCandidate[] | Dummy[] = Array(this.itemsPerPage).fill({dummy: true})
  logs: Log = undefined;
  updateCountEvent: EventEmitter<number> = new EventEmitter()

  constructor(public userService: UserService, 
    private localStorage: StorageService, 
    private candidateService: CandidateService,
    private _loader: LoaderService
    ) {}

  ngOnInit(): void {
    this.programId = this.localStorage.get(StorageKeys?.PROGRAM_ID);
    this.initMtpSubject()
    this.mtpSubject.next({ name: "", page: 1, limit: this.itemsPerPage });
  }

  get pageCount() {
    const itemsPerPage: number = this.itemsPerPage || 10;
    return Math.ceil(this.totalRecords / itemsPerPage);
  }


  initMtpSubject() {
    this.subscriptions.push(
      this.mtpSubject.pipe(
        debounceTime(600),
        switchMap((query) => {
          this.showLoader = true;
          const { page, name, limit } = (query ?? {});
          this.query = query
          this.itemsPerPage = limit ?? this.itemsPerPage;
          this.currentPage = page;
          return this.getPendingCandidateList(this.programId, name, page, this.itemsPerPage)
        })
      ).subscribe({
        next: (res: any) => {
          if (res) {
            const { candidates } = res;
            this.totalRecords = res.total_records
            this.candidates = candidates.map(candidate => ({
              id: candidate.id,
              uniqueId: candidate.unique_id,
              firstName: candidate.first_name,
              lastName: candidate.last_name,
              fullName: `${candidate.first_name} ${candidate.last_name}`,
              date: candidate.created_on,
            }));
            this.showLoader = false;
          }
        }, error: (err: any) => {
          this.showLoader = false;
          this.showError(errorHandler(err));
          this.showPendingLinkError = true;
        }
      })
    );
  }
  openMTPLinking(rowData){
    this.getCandidateData(rowData.id);
  }
  searchMember(event: KeyboardEvent) {
    let target: any = event.target;
    let value: string = target?.value;
    this.searchInput = value
    this.mtpSubject.next({ name: this.searchInput, page: 1 });
  }

  onClickRecords(event) {
    this.mtpSubject.next({ name: this.searchInput, page: 1, limit: event });
  }

  onPaginationClick(event) {
    this.mtpSubject.next({ name: this.searchInput, page: event });
  }

  getPendingCandidateList = (programId, name, page, limit) => {
    let url = `${this.baseURL}/candidates?page=${page}&limit=${limit}&program_id=${programId}&pending_profile_linking=true`;
    if (name!=="") url += `&k=${name}`
    return this.userService.get(url)
  };

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.message ? err?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  onCloseModal = (event?) => {
    if(event){
      this.mtpSubject.next({ name: this.query.name, page: this.query.page, limit: this.itemsPerPage });
      this.decreaseCount()
    }
    this.selectedMasterProfileID = '';
    this.showMTPLinking = false;
  }

  getCandidateData (id) {
    this._loader.show();
    this.candidateService.getCandidateDetailWthMtpMatches(id).subscribe({
      next: (data: any) => {
        if (data) {
          this.mtpMatches = data.master_profile_matches;
          this.candidateData = data.candidate;
          this.showMTPLinking = true;
          this._loader.hide();
        }
      },error:()=>{
        this._loader.hide();
      }
      })
  }

  decreaseCount(){
    this.updateCountEvent.emit(-1)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => (sub?.unsubscribe()));
  }
}
