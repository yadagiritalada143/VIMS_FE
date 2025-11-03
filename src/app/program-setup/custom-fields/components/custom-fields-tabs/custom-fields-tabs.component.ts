import { AfterViewInit, Component, DoCheck, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CustomFieldsService } from '../../custom-fields.service';

export interface ICustomFieldsTab {
  name: string;
  entity: string;
  ref_order:number;
}

@Component({
  selector: 'app-custom-fields-tabs',
  templateUrl: './custom-fields-tabs.component.html',
  styleUrls: ['./custom-fields-tabs.component.scss'],
})
export class CustomFieldsTabsComponent implements OnInit, AfterViewInit, OnDestroy, DoCheck {
  @ViewChild('customFieldsTabs', { static: false }) tabsElement: ElementRef;

  modules: { tabs: ICustomFieldsTab[]; entity: string }[] = [];
  currentTab: ICustomFieldsTab;
  tabs: ICustomFieldsTab[] = [];
  visibleTabs: ICustomFieldsTab[] = [];
  hiddenTabs: ICustomFieldsTab[] = [];
  isActive = true;

  isAfterViewInit = false;
  isTabChange = false;

  isHiddenTabsActive = false;

  private subscriptions: Subscription[] = [];
  private prevUrlEntity: string;
  private isSelfConfig: boolean = false;

  constructor(
    private activateRoute: ActivatedRoute,
    private router: Router,
    private customFieldsService: CustomFieldsService,
  ) {
    this.isSelfConfig = this.router?.url?.startsWith('/self-configuration') || false;
    if (this.isSelfConfig) this.prevUrlEntity = this.activateRoute?.snapshot?.queryParams?.entity;
  }

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute=()=>false;
    this.subscriptions.push(
      this.customFieldsService.getAllModules(true).subscribe(
        (res: {
          items_per_page: number;
          total_records: number;
          module_groups: {
            id: string;
            modules: {
              code: string;
              id: string;
              name: string;
              permissions: any[];
              ref_order:number;
            }[];
            name: string;
          }[];
        }) => {
          this.modules = res.module_groups.map(el => {
            return {
              tabs: el.modules.map(tab => {
                return { entity: tab.code, name: tab.name, ref_order: tab.ref_order };
              }),
              entity: el.name || '',
            };
          });
          this.setTabs(this.activateRoute?.snapshot?.queryParams?.entity,this.activateRoute?.snapshot?.queryParams?.currentTab);
        },
      ),
    );
  }

  ngAfterViewInit(): void {
    this.isAfterViewInit = true;
  }

  ngDoCheck(): void {
    if (this.isSelfConfig && this.prevUrlEntity !== this.activateRoute?.snapshot?.queryParams?.entity) {
      this.prevUrlEntity = this.activateRoute?.snapshot?.queryParams?.entity;
      this.ngOnInit();
    }
    this.hiddenOverflowingTabs();
  }

  openTab(tab: ICustomFieldsTab) {
    this.currentTab = tab;
    this.router.navigate([], {
      relativeTo: this.activateRoute,
      queryParams: {
        currentTab: this.currentTab.entity.replace(' ', ''),
      },
      queryParamsHandling: 'merge',
    });
  }

  setTabs = (entityTerm: string,currentTabEnity:string): void => {
    const entity = entityTerm
      .split(/(?=[&A-Z])/)
      .join(' ')
      .replace('And', '&');
    const tabsPerEntity = this.modules.find(el => el.entity.toLowerCase() === entity.toLowerCase())?.tabs || [];

    if (tabsPerEntity) {
      this.tabs = tabsPerEntity;
      this.isActive = true;
    } else {
      this.tabs = [];
      this.isActive = false;
    }

    this.visibleTabs = this.tabs.sort(function (a, b) {
      return a.ref_order - b.ref_order;
    });
    this.hiddenTabs = [];
    this.isTabChange = true;
     if(currentTabEnity){
      this.currentTab = this.tabs?.find(tab => tab?.entity?.toLowerCase() == currentTabEnity?.toLocaleLowerCase());
     }
     if(!this.currentTab){
      this.currentTab = this.tabs[0] || { name: '', entity: '',ref_order:0 };
     }
    this.openTab(this.currentTab);
  }

  hiddenOverflowingTabs(): void {
    if (this.isAfterViewInit && this.tabsElement.nativeElement) {
      const elementsWidths = ([...(this.tabsElement.nativeElement.children as any)] as HTMLElement[]).map(el => el.offsetWidth + 20);

      const availableWidth = elementsWidths.shift();
      const widthOfElements = elementsWidths.length ? elementsWidths.reduce((acc, value) => acc + value) : 0;

      if (this.isTabChange && widthOfElements > availableWidth) {
        let indexOfLastVisibleElement: number;

        elementsWidths.reduce((acc, value, idx) => {
          if (acc + value > availableWidth && !indexOfLastVisibleElement) {
            indexOfLastVisibleElement = idx;
          }
          return acc + value;
        });

        this.visibleTabs = this.tabs.slice(0, indexOfLastVisibleElement - 1);
        this.hiddenTabs = this.tabs.slice(indexOfLastVisibleElement - 1, this.tabs.length);
        this.isTabChange = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(el => el.unsubscribe());
  }
}
