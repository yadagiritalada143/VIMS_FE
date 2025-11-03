import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ReasonCode } from '../../assignment.model';
import { AssignmentService } from '../../assignment.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {
  @Input() isEvalution = 'hidden';
  @Input() set showEvaluationSidebar(showEvaluationSidebar) {
    if (this.authorizationService.authorize("evaluate_assignment") && showEvaluationSidebar === false) {
      this.isEvalution = 'visible';
    }
  }
  @Input() picklistId = '';
  @Input() evaluationItems: ReasonCode[] = [];
  @Output() onClose = new EventEmitter();
  programId: any;
  // evaluationItems: ReasonCode[];
  value = [
    { "value": 1, "name": "E" },
    { "value": 2, "name": "D" },
    { "value": 3, "name": "C" },
    { "value": 4, "name": "B" },
    { "value": 5, "name": "A" }
  ]
  evaluationResult = [];
  assignmentid: any;
  evaluationVisualData = []
  isViewMode = false;
  logs: Log= undefined;
  private subscrptions: Subscription[] = [];
  constructor(
    private assignmentService: AssignmentService,
    private storageService: StorageService,
    private alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private authorizationService: AuthorizationService

  ) { }

  ngOnInit(): void {
    this.assignmentid = this.activatedRoute.snapshot.params.id;
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails.id;
    this.evaluationItems?.forEach(element => {
      this.evaluationVisualData[element.id] = -1;
    });
    this.subscrptions.push(this.eventStream.on(Events.VIEW_HISTORY_OF_ASSIGNMENT_EVALUATION).subscribe( (data: any) => {
      if (data) {
        this.loadAssingmentEvaluation(data.history);
      }
    }));
    /* if(this.route.snapshot.queryParams['evaluation'] && this.assignmentListData?.assignment?.evaluation === null){
      this.isEvalution = 'visible';
    }else{
      this.isEvalution = 'hidden';
    } */
    // this.getEvaluationList(this.programId);
  }

  loadAssingmentEvaluation(history) {

    this.subscrptions.push(this.assignmentService.get(`/assignment/programs/${this.programId}/assignment/${this.assignmentid}/evaluate/revision/${history.sub_module_revision}`)
      .subscribe((res: any) => {
        this.isEvalution = 'visible';
        this.isViewMode = true;
        const { data } = res;
        const { evaluation } = data;
        this.evaluationResult = evaluation.score_list;
        this.evaluationResult.forEach(element => {
          this.evaluationVisualData[element.evaluation_type] = element?.evaluation_score;
        });
      }));
  }

  sidebarClose() {
    this.isEvalution = 'hidden';
    this.isViewMode = false;
    this.evaluationResult = [];
    this.evaluationVisualData = [];
    this.logs = undefined;
    this.onClose.emit(false);
  }
  // list of evaluation item

  // getEvaluationList(programID) {
  //   let reasonArray = [];
  //   let reasoncode;
  //   this.assignmentService.getReasonCodeAction(programID).subscribe(reason => {
  //     if (reason) {
  //       reasonArray = reason.reason_code_actions;
  //       reasonArray.forEach(item => {
  //         if (item.code === 'REQUEST_EVALUATION') {
  //           reasoncode = item.id;
  //           this.getEvaluationCode(programID, reasoncode);
  //         }
  //       })
  //     }
  //   })
  // }

  // getEvaluationCode(programID, reasoncode) {
  //   this.assignmentService.getEvaluationListItems(programID, reasoncode).subscribe((data: ReasonCodeResponce) => {
  //     if (data) {
  //       this.evaluationItems = data.reason_codes;
  //       this.evaluationItems.forEach(element => {
  //         this.evaluationVisualData[element.id] = -1;
  //       });
  //     }
  //   }, (error) => {
  //     // this.alert.error(errorHandler(error));
  //   })
  // }


  getGrade(id, gradeValue) {
    const obj = { evaluation_type: id, evaluation_score: gradeValue };
    this.evaluationVisualData[id] = gradeValue;
    const index = this.evaluationResult.findIndex((e) => e.evaluation_type === obj.evaluation_type);
    if (index === -1) {
      this.evaluationResult.push(obj);
    } else {
      this.evaluationResult[index] = obj;
    }
    console.log(this.evaluationResult);

  }

  evaluateAssignment() {
    const payload = {
      evaluate: this.evaluationResult,
    };
    this.loader.show();
    this.subscrptions.push(this.assignmentService.evaluate(this.programId, this.assignmentid, payload).subscribe({next:data => {
      if (data) {
        this.loader.hide();
        this.alert.success('Assignment Evaluated Successfully..');
        this.isEvalution = 'hidden';
        this.evaluationResult = [];
        this.evaluationVisualData = [];
        this.onClose.emit(this.isEvalution);
      }
    }, error: (err) => {
      this.loader.hide();
      // this.alert.error(errorHandler(err));
      this.showError(err);
    }}));
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

}
