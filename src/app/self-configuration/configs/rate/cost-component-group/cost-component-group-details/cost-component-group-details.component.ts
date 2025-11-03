import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { CostComponentGroupDetailData } from '../models/model';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-cost-component-group-details',
  templateUrl: './cost-component-group-details.component.html',
  styleUrls: ['./cost-component-group-details.component.scss']
})
export class CostComponentGroupDetailsComponent implements OnInit {
  name: string = '';
  code: string = '';
  costComponentGroupId: any;
  programId: any;
  detailData: CostComponentGroupDetailData;

  constructor(
    public commonViewService: CommonViewRuleFlowService,
    private router: SvmsRouterService,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.costComponentGroupId = this.activatedRoute.snapshot.params.id;

    if (this.costComponentGroupId) {
      this.getCostComponentGroup();
    } else {
      this.router.navigate(['rate', 'cost-component-group', 'list']);
      this.alertService.error('Cost Component id not supplied.');
    }
  }

  onBackClick(event) {
    if (event) {
      this.router.navigate(['rate', 'cost-component-group', 'list']);
    }
  }

  onEditClick(event) {
    if (event) {
      this.router.navigate(['rate', 'cost-component-group', 'edit', this.costComponentGroupId]);
    }
  }

  getCostComponentGroup() {
    this.loader.show();

    this.programService.get(`/core-money/programs/${this.programId}/cost-component/component_groups/${this.costComponentGroupId}`).subscribe({
      next: (data: any) => {
        this.loader.hide();
        this.detailData = data?.cost_component_group_data;
      },
      error: (err) => {
        this.loader.hide();
        this.router.navigate(['rate', 'cost-component', 'list']);
        this.alertService.error(errorHandler(err));
      }
    });
  }

}
