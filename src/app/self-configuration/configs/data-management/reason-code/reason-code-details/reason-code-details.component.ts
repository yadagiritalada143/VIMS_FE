import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-reason-code-details',
  templateUrl: './reason-code-details.component.html',
  styleUrls: ['./reason-code-details.component.scss'],
})
export class ReasonCodeDetailsComponent implements OnInit, OnDestroy {

  private programId: string;
  public reasonCodesLoading: boolean = true;
  public name: string;
  public itemId: string;
  public module: string;
  public code: string;
  public lastUpdated: number;
  reasonCodeList: any;
  currentReasons: any = [];
  subscribtions = new Subscription();
  currentProgram:any;

  constructor(
    private storageService: StorageService,
    public route: ActivatedRoute,
    private programService: ProgramService,
    private router: SvmsRouterService,
    private eventStream: EventStreamService,
    public commonViewService: CommonViewRuleFlowService
  ) {}

  ngOnInit(): void {
    // this.getCodeList(this.storageService.get('PROGRAM_ID'));
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.route.queryParams.subscribe((params: any) => {
      this.name = params?.['name'];
      this.itemId = params?.['id'];
      this.module = params?.['module'];
      this.code = params?.['code'];
      this.getReasonsList(this.programId, this.itemId);
    });

    this.subscribtions.add(
      this.eventStream.on(Events.REASON_CODE_VIEW).subscribe((data: any) => {
        this.name = data.name;
        this.itemId = data.id;
        this.module = data.module;
        this.code = data.code;
        this.getReasonsList(this.programId, this.itemId);
      }),
    );
  }

  backClicked() {
    this.router.navigate(['data-management', 'reason-codes']);
  }

  onEditReason() {

    this.router.navigate(['data-management', 'reason-codes', 'edit-reason'], {
      queryParams: {
        name: this.name,
        id: this.itemId,
        module: this.module,
        code: this.code
      },
    });
  }

  getCodeList(programID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions?limit=50`).subscribe((reason: any) => {
      this.reasonCodeList = reason.reason_code_actions.filter(item => {
        return item.entity_ref == this.module;
      });
    });
  }

  getReasonsList(programID, reasonID) {
    this.programService
      .get(`/configurator/programs/${programID}/pages/reason-code-actions/${reasonID}/reason-codes?status=all`)
      .subscribe((reasons: any) => {
        this.currentReasons = reasons?.reason_codes;
        this.lastUpdated = Number.parseInt('' + (reasons?.modified_on*1000));
        this.reasonCodesLoading = false;
      });
  }

  getCategoryLabel(data: string) {
    if (data === 'FAVORABLE') {
      return 'Positive';
    }
    if (data === 'UNFAVORABLE') {
      return 'Negative';
    }
    return 'Neutral';
  }

  ngOnDestroy() {
    this.subscribtions.unsubscribe();
  }

  get isAutoClosedAssignment() {
    return this.code === 'AUTO_CLOSED_ASSIGNMENT';
  }
}
