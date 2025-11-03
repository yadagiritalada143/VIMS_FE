import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-cost-component-details',
  templateUrl: './cost-component-details.component.html',
  styleUrls: ['./cost-component-details.component.scss']
})
export class CostComponentDetailsComponent implements OnInit {
  costComponentData: any = {};
  costComponentId: any;
  programId: any;

  constructor(
    private router: SvmsRouterService,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private activatedRoute: ActivatedRoute,
    public commonViewService: CommonViewRuleFlowService,
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.costComponentId = this.activatedRoute.snapshot.params.id;

    if (this.costComponentId) {
      this.getCostComponent();
    } else {
      this.router.navigate(['rate', 'cost-component', 'list']);
      this.alertService.error('Cost Component id not supplied.');
    }
  }

  onBackClick(event) {
    if (event) {
      this.router.navigate(['rate', 'cost-component', 'list']);
    }
  }

  onEditClick(event) {
    if (event) {
      this.router.navigate(['rate', 'cost-component', 'edit', this.costComponentId]);
    }
  }

  getCostComponent() {
    this.loader.show();

    this.programService.get(`/core-money/programs/${this.programId}/cost-component/component/${this.costComponentId}`).subscribe({
      next: (data: any) => {
        this.loader.hide();
        this.costComponentData = data?.cost_componet_data;
      },
      error: (err) => {
        this.loader.hide();
        this.router.navigate(['rate', 'cost-component', 'list']);
        this.alertService.error(errorHandler(err));
      }
    });
  }

}
