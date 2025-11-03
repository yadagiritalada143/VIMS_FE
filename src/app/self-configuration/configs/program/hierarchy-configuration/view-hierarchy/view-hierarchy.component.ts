import { Component, OnDestroy, OnInit } from '@angular/core';
import { getCurrencySymbol } from '@angular/common';
import { Subscription } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import * as _ from 'lodash';
import {  CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';

@Component({
  selector: 'app-view-hierarchy',
  templateUrl: './view-hierarchy.component.html',
  styleUrls: ['./view-hierarchy.component.scss']
})
export class ViewHierarchyComponent implements OnInit, OnDestroy {

  public customFields: Array <CommonViewDetail> = [];
  public hierarchyData: any;
  public programId: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private alert: AlertService,
    private storageService: StorageService,
    private programService: ProgramService,
    private loader: LoaderService,
    public commonViewService: CommonViewRuleFlowService,
    private cfService: CommonService
  ) {
    this.hierarchyData = this.storageService.get("hierarchyData");
  }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.getHierarchyData(this.hierarchyData?.id);
  }

  getSymbol(code: any) {
    return getCurrencySymbol(code, 'narrow');
  }

  getHierarchyData(current_level_id: any) {
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}/hierarchy/${current_level_id}?return_custom_fields=true`;
    this.programService.get(url).subscribe({
      next: (response: any) => {
        this.loader.hide();
        this.hierarchyData = _.mergeWith(this.hierarchyData, (response?.hierarchy || {}), (oldValue: any, newValue: any) => {
          if(_.isArray(oldValue)) {
            return newValue;
          }
        });

        this.cfService.amendCFViewData(this.hierarchyData?.custom_fields || {}, this.programId, 'HIERARCHY')
        .then((data: any) => { this.customFields = data; });

        this.hierarchyData['foundational_data_types'] = response.hierarchy?.foundational_data_types;
        this.hierarchyData.contact_info = response.hierarchy?.contact_info?.filter((contact: any) => (contact?.member_type == 'PRIMARY' || contact?.member_type == 'SECONDARY'));
        if (this.hierarchyData?.contact_info?.length > 1) {
          this.hierarchyData?.contact_info?.sort(function (a: any, b: any) {
            if (a.member_type < b.member_type)
              return -1;
            if (a.member_type > b.member_type)
              return 1;
            return 0;
          });
        }

        if (this.hierarchyData?.addresses?.length > 1) {
          this.hierarchyData?.addresses?.sort(function (a: any, b: any) {
            if (a.address_type < b.address_type)
              return -1;
            if (a.address_type > b.address_type)
              return 1;
            return 0;
          });
        }
      },
      error: (err: any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }

    })
  }

  getLanguageEnglish(locale: any): any {
    let languages = [
      { key: 'en-US', value: 'English (United States)' },
      { key: 'en-UK', value: 'English (United Kingdom)' },
      { key: 'en-CA', value: 'English (Canada)' },
      { key: 'SPA', value: 'Spanish' },
      { key: 'Fr', value: 'French' }
    ];
    for (let i = 0; i < languages?.length; i++) {
      if (languages[i]?.key == locale) {
        return languages[i]?.value;
      }
    }
  }

  backClicked() {
    this.router.navigate(['program', 'hierarchy', 'list']);
  }

  onEdit() {
    this.storageService.set("hierarchyDataEdit",this.hierarchyData,true);
    this.router.navigate(['program', 'hierarchy', 'edit'])
    .then(()=>{
      setTimeout(()=> {
        this.eventStream.emit(new EmitEvent(Events.EDIT_HIERARCHY, this.hierarchyData));
      }, 800);
    });
  }

  getRateModelValue(rate_model: any) {
    switch (rate_model) {
      case 'MARKUP': return ' Bill Rate (Markup)'; break;
      case 'BILL_RATE': return 'Bill Rate (No Markup)'; break;
      case 'PAY_RATE': return 'Pay Rate (Markup)'; break;
      default: break;
    }
  }

  hide() {
    return true;
  }

  ngOnDestroy(): void {
    this.storageService.remove("hierarchyData");
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
