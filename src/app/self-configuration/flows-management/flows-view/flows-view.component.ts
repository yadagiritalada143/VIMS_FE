import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { createConditionHtmlString, createRecipientChain } from './flows-view.model';
import { Location } from '@angular/common';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

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
 showSkipLevelInModules=["JOBS","OFFERS","ASSIGNMENTS"]

  constructor (
    private router: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private alert: AlertService,
    private programService: ProgramService,
    private loader: LoaderService,
    private localStorage: StorageService,
    private location: Location,
    public commonViewService: CommonViewRuleFlowService
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.flowId = this.activatedRoute.snapshot.paramMap.get('id');
    this.getFlowDetails();
  }

  backtoList() {
    this.location.back();
  }

  editFlow() {
    this.router.navigate(['program', 'workflow', 'edit', this.flowId]);
  }

  getFlowDetails() {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/flow-configs/${this.flowId}`)
      .subscribe(
        {
          next: (flow: any) => {
            this.flowData = flow?.flow_config;
            this.flowData['default_conditions'] = flow?.flow_config?.levels[0]?.conditions.length > 0 ? createConditionHtmlString(flow?.flow_config?.levels[0]?.conditions) : [];
            this.flowData['each_level'] = flow?.flow_config?.levels?.length > 0 ? flow?.flow_config?.levels.slice(1).map((level: any) => { return { conditions: createConditionHtmlString(level?.conditions), recipients: createRecipientChain(level?.recipient_types[0],this.flowData.module.code) } }) : [];
            this.details = [{
              label : "ID",
              value : this.flowData?.code,
              displayType : 'text',
            },
            {
              label : "Status",
              value : this.flowData?.is_enabled ? 'Active' : 'Inactive',
              displayType : 'status',
              type:"flow",
              enabled : this.flowData?.is_enabled
            },
            {
              label : "Module",
              value : this.flowData?.module?.name,
              displayType : 'text'
            },
            {
              label : "Event",
              value : this.flowData?.event?.name,
              displayType : 'text'
            },
            {
              label : "Method",
              value : this.flowData?.flow_type,
              displayType : 'text'
            },
            {
              label : "Hierarchy",
              value : this.flowData?.hierarchies,
              displayType : 'box-view'
            }
            ]
            if(this.showSkipLevelInModules.includes(this.flowData?.module?.code))
            {
              this.details.push({
                label : "Skip Level If Reviewer/Approver Equals the Creator",
                value : this.flowData?.config?.skip_level_if_actor_is_only_approver_in_level ? 'Enabled' : 'Disabled',
                icon: this.flowData?.config?.skip_level_if_actor_is_only_approver_in_level ? 'check_circle' : 'cancel',
                displayType : 'text'
              })
            }
            this.details.push({
              label : "Bypass Duplicate Reviewer/Approver",
              value : this.flowData?.config?.bypass_duplicate_approver ? 'Enabled' : 'Disabled',
              icon: this.flowData?.config?.bypass_duplicate_approver ? 'check_circle' : 'cancel',
              displayType : 'text'
            })
            this.loader.hide();
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.loader.hide();
          }
        })
  }
}
