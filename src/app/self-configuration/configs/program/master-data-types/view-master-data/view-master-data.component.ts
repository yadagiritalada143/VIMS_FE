import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { MasterDataItemsService } from '../../master-data-items/master-data-items.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-view-master-data',
  templateUrl: './view-master-data.component.html',
  styleUrls: ['./view-master-data.component.scss']
})
export class ViewMasterDataComponent implements OnInit {

  private masterId: string = null;
  private masterDetails: any = null;

  @ViewChild('toggle', { static: true }) toggleTemplate: TemplateRef <any>;
  @ViewChild('module', { static: true }) moduleTemplate: TemplateRef <any>;

  public viewConfig: Array <CommonViewDetail> = [];

  constructor (
    private alert: AlertService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private svmsRouter: SvmsRouterService,
    private dataService: MasterDataItemsService,
    private commonView: CommonViewRuleFlowService,
    private titlecase: TitleCasePipe
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((param: Params) => {
      this.masterId = param?.id;
      this.fetchMasterDetails();
    })
  }

  private fetchMasterDetails() {
    this.loader.show();
    this.dataService.masterFieldDetail(this.masterId).subscribe({
      next: (res: any) => {

        if ('foundational_data_type' in res) {
          res = res?.foundational_data_type;
        }

        this.masterDetails = res;
        this.initializeViewColumns();
        this.loader.hide();

      }, error: (err: any) => {
        this.loader.hide();
        console.error(err);
        this.alert.error((errorHandler(err)));
      }
    })
  }

  private initializeViewColumns() {

    let result: Array <CommonViewDetail> = [
      {
        label: 'Master Data Type Name',
        value: this.masterDetails?.name || '--',
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Status',
        value: this.masterDetails?.is_enabled?'Active':'Inactive',
        displayType: CommonViewConfig.STATUS,
        enabled: this.masterDetails?.is_enabled || false
      }, {
        label: 'Description',
        value: this.masterDetails?.description || '--',
        displayType: CommonViewConfig.DESCRIPTION,
      }, {
        label: '# Values',
        value: this.masterDetails?.fd_count || 0,
        displayType: CommonViewConfig.TEXT
      }, {
        label: 'Settings',
        value: 'settings',
        displayType: CommonViewConfig.HEADER
      }, {
        label: 'Allow Multiple Values',
        value: (this.masterDetails?.configuration?.allow_multiple_default_values === 'true'),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'View Only',
        value: (this.masterDetails?.configuration?.view_only === 'true'),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'Exclude From User Association',
        value: (this.masterDetails?.user_association_exclude),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'Track Owner',
        value: (this.masterDetails?.configuration?.track_owner === 'true'),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'Require Owner',
        value: (this.masterDetails?.configuration?.require_owner === 'true'),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'Financial Master Data Type',
        value: (this.masterDetails?.configuration?.financial_master_data_type === 'true'),
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.toggleTemplate
      }, {
        label: 'Module Grouping',
        value: 'modules',
        displayType: CommonViewConfig.HEADER
      }, {
        label: 'Contingent',
        value: {
          value: this.titlecase.transform(this.masterDetails?.configuration?.module_jobs || '--'),
          multiple: (this.masterDetails?.configuration?.allow_multiple_jobs === 'true')
        },
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.moduleTemplate
      }, {
        label: 'Services Procurement',
        value: {
          value: this.titlecase.transform(this.masterDetails?.configuration?.module_sow || '--'),
          multiple: (this.masterDetails?.configuration?.allow_multiple_sows === 'true')
        },
        displayType: CommonViewConfig.TEMPLATE_REF,
        template: this.moduleTemplate
      }
    ];

    const isMasterDataPresent: Array <any> = (this.masterDetails?.dependent_foundational_data_types || [])?.length;
    if(isMasterDataPresent) {

      result.push({
        label: 'Associations',
        value: 'associations',
        displayType: CommonViewConfig.HEADER
      });

      if(isMasterDataPresent) {
        result.push({
          label: 'Master Data Types',
          value: (this.masterDetails?.dependent_foundational_data_types || []),
          displayType: CommonViewConfig.BOX_VIEW
        });
      }
    }

    this.viewConfig = result;
  }

  backClicked() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list']);
  }

  switchToEditMode() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'edit', this.masterId]);
  }

  openMasterItemListing = () => {
    if(this.masterId) {
      this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.masterId, 'list' ]);
    }
  }

  get pageTitle() {
    if(!this.masterDetails) {
      return '--';
    }

    return this.masterDetails?.name;
  }

  get headerDescription() {
    if(!this.masterDetails) {
      return '--';
    }

    return this.commonView.getTimeStamp(this.masterDetails?.created_on, this.masterDetails?.modified_on);
  }

  get masterTitle(): string {
    if(!this.masterDetails?.fd_count) {
      return 'No Values Added'
    }

    return `${this.masterDetails.fd_count} Values Added`;
  }

  get masterMessage(): string {
    if(!this.masterDetails?.fd_count) {
      return 'No values added for this master data type';
    }

    return `You can manage the ${this.masterDetails?.name || 'Master Data Type'} Values from here`;
  }

  get masterItemButtonTitle(): string {
    if(!this.masterDetails?.fd_count) {
      return 'Add Values';
    }

    return 'Manage Values';
  }
}
