import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ReportsDetailsService } from '../reports-details/reports-details.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
  selector: 'app-reports-score-configuration',
  templateUrl: './reports-score-configuration.component.html',
  styleUrls: ['./reports-score-configuration.component.scss']
})
export class ReportsScoreConfigurationComponent implements OnInit {
  scoreConfiguration = "visible";
  public scoreConfigrationForm: UntypedFormGroup;
  @Output() onClose = new EventEmitter();
  @Output() onSaveConfigration=new EventEmitter();
  scoreConfigationData;
  logs:Log=undefined;
  constructor(private fb: UntypedFormBuilder,
    private reportDetailsService: ReportsDetailsService,
    private alert: AlertService,
    private _loader: LoaderService,
  ) { }

  ngOnInit(): void {
    this.scoreConfigrationForm = this.fb.group({
      response_rate_pct: [null, Validators.required],
      response_rate_pt: [null, Validators.required],
      shortlist_rate_pct: [null, Validators.required],
      shortlist_rate_pt: [null, ''],
      interview_rate_pct: [null, ''],
      interview_rate_pt: [null, ''],
      hit_rate_pct: [null, ''],
      hit_rate_pt: [null, ''],
      offer_rate_pct: [null, ''],
      offer_rate_pt: [null, ''],
      offer_accepted_rate_pct: [null, ''],
      offer_accepted_rate_pt: [null, ''],
      false_start_rate_pct: [null, ''],
      false_start_rate_pt: [null, ''],
      rate_competitiveness_pct: [null, ''],
      rate_competitiveness_pt: [null, ''],
      evaluation_performance_pct: [null, ''],
      evaluation_performance_pt: [null, ''],
      assignment_completion_pct: [null, ''],
      assignment_completion_pt: [null, '']
    });
    this.getScoreConfigrationDetails();
  }

  public onCloseSidebar() {
    this.onClose.emit();
  }

  public updateConfiguration(){
    let data = this.scoreConfigrationForm.value;
    if (this.scoreConfigrationForm.valid) {
      const payload = {
        response_rate_pct:data.response_rate_pct,
        response_rate_pt: data.response_rate_pt,
        shortlist_rate_pct: data.shortlist_rate_pct,
        shortlist_rate_pt: data.shortlist_rate_pt,
        interview_rate_pct: data.interview_rate_pct,
        interview_rate_pt: data.interview_rate_pt,
        hit_rate_pct: data.hit_rate_pct,
        hit_rate_pt: data.hit_rate_pt,
        offer_rate_pct: data.offer_rate_pct,
        offer_rate_pt: data.offer_rate_pt,
        offer_accepted_rate_pct: data.offer_accepted_rate_pct,
        offer_accepted_rate_pt: data.offer_accepted_rate_pt,
        false_start_rate_pct: data.false_start_rate_pct,
        false_start_rate_pt: data.false_start_rate_pt,
        rate_competitiveness_pct: data.rate_competitiveness_pct,
        rate_competitiveness_pt: data.rate_competitiveness_pt,
        evaluation_performance_pct: data.evaluation_performance_pct,
        evaluation_performance_pt:data.evaluation_performance_pt,
        assignment_completion_pct: data.assignment_completion_pct,  
        assignment_completion_pt: data.assignment_completion_pt,
      }
      

      this.reportDetailsService.saveScoreConfigration(payload).subscribe({next:(data:any) => {
        if (data) {
          this.alert.success('Socre Saved successfully..');
          this.onSaveConfigration.emit();

        }
      },error: (error) => {

        // this.alert.error(errorHandler(error));
        this.showError(error);
      }});


     
      
    } else {
      // this.alert.error('Please fill the required fields properly.');
      this.showError('Please fill the required fields properly.')
    }
  }
    
 
  public getScoreConfigrationDetails() {
    this._loader.show();
    this.reportDetailsService.getScoreConfigration().subscribe({next:
      (data:any) => {
        if (data) {
          let scoreConfigationData = data?.data;
          this.scoreConfigrationForm.patchValue({
              response_rate_pct:scoreConfigationData.response_rate_pct,
              response_rate_pt: scoreConfigationData.response_rate_pt,
              shortlist_rate_pct: scoreConfigationData.shortlist_rate_pct,
              shortlist_rate_pt: scoreConfigationData.shortlist_rate_pt,
              interview_rate_pct: scoreConfigationData.interview_rate_pct,
              interview_rate_pt: scoreConfigationData.interview_rate_pt,
              hit_rate_pct: scoreConfigationData.hit_rate_pct,
              hit_rate_pt: scoreConfigationData.hit_rate_pt,
              offer_rate_pct: scoreConfigationData.offer_rate_pct,
              offer_rate_pt: scoreConfigationData.offer_rate_pt,
              offer_accepted_rate_pct: scoreConfigationData.offer_accepted_rate_pct,
              offer_accepted_rate_pt: scoreConfigationData.offer_accepted_rate_pt,
              false_start_rate_pct: scoreConfigationData.false_start_rate_pct,
              false_start_rate_pt: scoreConfigationData.false_start_rate_pt,
              rate_competitiveness_pct: scoreConfigationData.rate_competitiveness_pct,
              rate_competitiveness_pt: scoreConfigationData.rate_competitiveness_pt,
              evaluation_performance_pct: scoreConfigationData.evaluation_performance_pct,
              evaluation_performance_pt:scoreConfigationData.evaluation_performance_pt,
              assignment_completion_pct: scoreConfigationData.assignment_completion_pct,  
              assignment_completion_pt: scoreConfigationData.assignment_completion_pt,
          });
        }
      },error: (error) => {
      this.showError(error);

      }});
    this._loader.hide();
  }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error ? err?.error?.error : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }
}
