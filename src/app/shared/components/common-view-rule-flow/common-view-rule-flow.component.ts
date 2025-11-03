import { Component, Input, OnDestroy, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-common-view-rule-flow',
  templateUrl: './common-view-rule-flow.component.html',
  styleUrls: ['./common-view-rule-flow.component.scss'],
})
export class CommonViewRuleFlowComponent implements OnDestroy {
  private subscriptions: Array<Subscription> = [];

  public details: Array<CommonViewDetail> = [];
  public commmonViewPropertyMap: Map<number, any> = new Map<number, any>();

  @Input('details') set viewDetails(data: Array<CommonViewDetail>) {
    this.details = data;
    this.commmonViewPropertyMap.clear();
    this.computeDimensions();
  }

  constructor(private eventStream: EventStreamService) {
    this.subscriptions.push(
      this.eventStream.on(Events.SELF_CONFIG_SIDEBAR_TOGGLE).subscribe((open: boolean) => {
        this.computeDimensions(true);
      }),
    );
  }

  computeDimensions(reset?: boolean) {
    if (Array.isArray(this.details)) {
      this.details.forEach((entry: CommonViewDetail, it: number) => {
        if (entry.displayType === CommonViewConfig.DESCRIPTION) {
          if (reset) {
            this.commmonViewPropertyMap.set(it, null);
          }
          this.showReadMore(it);
        }
      });
    }
  }

  showReadMore(it: number) {
    setTimeout(() => {
      let elRef: HTMLElement = document.getElementById('description-' + it);
      if (elRef) {
        this.commmonViewPropertyMap.set(it, {
          height: elRef.getClientRects()?.[0]?.height,
          showMore: elRef.getClientRects()?.[0]?.height > 32,
        });
      }
    }, 0);
  }

  toggleShowMore(it: number, flag: boolean) {
    if (this.commmonViewPropertyMap.has(it)) {
      let value: any = this.commmonViewPropertyMap.get(it);
      this.commmonViewPropertyMap.set(it, {
        ...value,
        showMore: flag,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  get CommonViewConfig() {
    return CommonViewConfig;
  }
}

export enum CommonViewConfig {
  TEXT = 'text',
  MULTI_TEXT = 'multi-text',
  STATUS = 'status',
  CUSTOMSTATUS='custom-status',
  SUB_HEADING = 'sub-heading',
  HEADER = 'header',
  BOX_VIEW = 'box-view',
  TEMPLATE = 'template',
  DESCRIPTION = 'description',
  INITIAL_CONDITION = 'initial-condition',
  TEMPLATE_REF = 'template-ref',
  HYPERLINK = 'hyperlink',
  ATTACHMENT = 'attachment',
}

export interface CommonViewDetail {
  label: string;
  value: any;
  displayType: CommonViewTypeOptions;
  enabled?: boolean;
  template?: TemplateRef<any>;
  headerTemplate?: TemplateRef<any>;
  headerValue?: any;
}

export type CommonViewTypeOptions =
  | CommonViewConfig.TEXT
  | CommonViewConfig.STATUS
  | CommonViewConfig.SUB_HEADING
  | CommonViewConfig.HEADER
  | CommonViewConfig.BOX_VIEW
  | CommonViewConfig.TEMPLATE
  | CommonViewConfig.DESCRIPTION
  | CommonViewConfig.INITIAL_CONDITION
  | CommonViewConfig.TEMPLATE_REF
  | CommonViewConfig.HYPERLINK
  | CommonViewConfig.ATTACHMENT;
