import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { MasterDataItemsService } from '../master-data-items.service';
import { CommonService } from 'src/app/library/custom-fields/common.service';

@Component({
  selector: 'app-view-master-data-item',
  templateUrl: './view-master-data-item.component.html',
  styleUrls: ['./view-master-data-item.component.scss']
})
export class ViewMasterDataItemComponent implements OnInit {

  @ViewChild('masterDataHeader', { static: true }) dependedHeaderTemplate: TemplateRef <any>;
  @ViewChild('depended', { static: true }) dependedTemplate: TemplateRef <any>;

  private masterName: string = null;
  private masterId: string = null;
  private itemId: string = null;

  public masterDetails: any = null;
  public viewConfig: Array <CommonViewDetail> = [];
  public customFields: Array <CommonViewDetail> = [];

  constructor (
    private alert: AlertService,
    private loader: LoaderService,
    private route: ActivatedRoute,
    private storage: StorageService,
    private svmsRouter: SvmsRouterService,
    private programService: ProgramService,
    public commonViewService: CommonViewRuleFlowService,
    private masterDataService: MasterDataItemsService,
    private cfService: CommonService
  ) { }

  ngOnInit(): void {

    this.route.params.subscribe((param: Params) => {
      this.masterId = param?.id;
      this.itemId = param?.item;
      this.fetchItemDetails();
    });

    this.route.queryParams.subscribe((param: Params) => {
      this.masterName = param?.name;
    });

  }

  fetchItemDetails() {
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.masterId}/foundational-data/${this.itemId}`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.loader.hide();
        if('foundational_data' in data) {
          data = data?.foundational_data;
        }

        this.masterDetails = data;
        this.initializeViewConfig();
        if(this.allowedCFuserType) {
          this.cfService.amendCFViewData(data?.['custom_fields_value_mapping'] || {}, this.programID, 'MASTER_DATA_TYPE')
          .then((res: any) => { this.customFields = res; });
        }
      }, error: (err: any) => {
        console.error(err);
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    })
  }

  initializeViewConfig() {
    this.viewConfig = [{
      label: 'Name',
      value: this.masterDetails?.name || '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Status',
      value: this.masterDetails?.is_enabled ? 'Active' : 'Inactive',
      displayType: CommonViewConfig.STATUS,
      enabled: this.masterDetails?.is_enabled || false
    }, {
      label: 'Code',
      value: this.masterDetails?.code || '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Owner',
      value: (this.masterDetails?.manager ?? []).map((entry: any) => (entry?.first_name + ' ' + entry?.last_name)).join(', ') || '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Description',
      value: (this.masterDetails?.description || '--'),
      displayType: CommonViewConfig.DESCRIPTION
    }];
  }

  backClicked() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.masterId, 'list']);
  }

  switchToEditMode() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.masterId, 'edit', this.itemId], {
      queryParams: {
        name: this.masterName
      }
    });
  }

  get dependedFields(): Array <CommonViewDetail> {

    if(!this.masterDetails) {
      return [];
    }

    let result: Array <CommonViewDetail> = [{
      label: 'Depended Fields',
      value: 'depended_fields',
      displayType: CommonViewConfig.HEADER
    }];

    let depended_fields: Array <any> = this.masterDetails?.foundational_data_mapping;
    if(Array.isArray(depended_fields)) {
      depended_fields.forEach((entry: any) => {

        let item: CommonViewDetail = {
          label: this.masterDataService.getDependedFieldName(entry?.foundational_data_type_id) || 'Loading...',
          value: (entry?.values || []).map((data: any) => {
            return {
              ...data,
              name: this.showMasterCodesOnly?data?.code:(`${data?.name} (${data?.code})`) || '--',
              is_default: (entry?.defaults || []).includes(data?.id)
            }
          }),
          displayType: CommonViewConfig.TEMPLATE_REF,
          headerTemplate: this.dependedHeaderTemplate,
          headerValue: entry?.restrict_values || false,
          template: this.dependedTemplate
        };

        if(item?.value?.length) {
          result.push(item);
        }
      })
    }

    if(result.length > 1) {
      return result;
    }

    return [];
  }

  get showMasterCodesOnly() {
    let config: any = this.storage.get(StorageKeys.CURRENT_PROGRAM)?.config;
    return !!config?.show_only_master_codes;
  }

  get pageTitle() {
    return this.masterDetails?.name || '--';
  }

  get programID() {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  get userType() {
    return (this.storage.get(StorageKeys.USER_TYPE) || '')?.toUpperCase();
  }

  get allowedCFuserType() {
    return true;
  }

  get programId() {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }
}
