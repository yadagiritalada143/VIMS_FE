import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { createConditionHtmlString, createRecipientChain } from './flows-view.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-flows-view',
  templateUrl: './flows-view.component.html',
  styleUrls: ['./flows-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FlowsViewComponent implements OnInit {

  flowData: any;
  programId: any;
  flowId: any;
  details : any = [];
  programDetails:any;
  dateFormat:any;

  constructor (
    private router: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private alert: AlertService,
    private programService: ProgramService,
    private localDataTime: LocalDateTimeFormatPipe,
    private loader: LoaderService,
    private localStorage: StorageService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.programDetails = this.localStorage.get(StorageKeys?.CURRENT_PROGRAM);
    this.dateFormat = this.programDetails?.defaultDateFormat.toUpperCase();
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.flowId = this.activatedRoute.snapshot.paramMap.get('id');
    this.getFlowDetails();
  }

  backtoList() {
    this.location.back();
  }

  editFlow() {
    this.router.navigate(['flows-management', 'edit', this.flowId]);
  }

  getFlowDetails() {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/flow-configs/${this.flowId}`)
      .subscribe(
        {
          next: (flow: any) => {
            this.flowData = flow?.flow_config;
            this.flowData.modified_on = this.localDataTime.transform(flow?.flow_config?.modified_on, this.dateFormat+' hh:mm a',);
            this.flowData.created_on = this.localDataTime.transform(flow?.flow_config?.created_on, this.dateFormat+ ' hh:mm a',);
            this.flowData['default_conditions'] = flow?.flow_config?.levels[0]?.conditions.length > 0 ? createConditionHtmlString(flow?.flow_config?.levels[0]?.conditions) : [];
            this.flowData['each_level'] = flow?.flow_config?.levels?.length > 0 ? flow?.flow_config?.levels.slice(1).map((level: any) => { return { conditions: createConditionHtmlString(level?.conditions), recipients: createRecipientChain(level?.recipient_types[0], this.flowData.module.code) } }) : [];
            this.loader.hide();
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }
        })
  }
}
