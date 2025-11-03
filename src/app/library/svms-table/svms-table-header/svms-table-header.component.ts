import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SvmsTableFilterComponent } from '../svms-table-filter/svms-table-filter.component';
import { IActionLinks, IColoumnDefinition, ITableHeaderConfig } from '../svms-table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-svms-table-header',
  templateUrl: './svms-table-header.component.html',
  styleUrls: ['./svms-table-header.component.scss'],
})
export class SvmsTableHeaderComponent implements OnInit {

  @ViewChild(SvmsTableFilterComponent) filterCmp: SvmsTableFilterComponent;

  @Input() headerConfig: ITableHeaderConfig;
  @Input() totalRecords: number;
  @Input() informativeBubbleText: any;
  @Input() showLoader:boolean = true;
  @Input() columnFilterEnabled : boolean;
  @Output() onClearFilter:EventEmitter<void> = new EventEmitter<void>();
  @Output() onLoading :EventEmitter<void> = new EventEmitter<void>();
  @Output() goToPreviousPage = new EventEmitter();
  @Input() colDefinition :Array<IColoumnDefinition>;
  @Output() onApplySetting = new EventEmitter<Array<IColoumnDefinition>>();
  @Output() showFilterPanel = new EventEmitter();

  filterApplied: boolean = false;
  showColoumnSetting:boolean = false;
  searchText: string;
  actionDropdownBox: boolean = false;
  searchApplied: boolean = false;
  hideActionButton: boolean = false;

  @ViewChild('actionTrigger', { read: ElementRef, static: false })
  actionTrigger: ElementRef | undefined;
  @ViewChild('actionDropdown', { read: ElementRef, static: false })
  actionDropdown: ElementRef | undefined;

  public filterVisible: 'visible' | 'hidden' = 'hidden';
  constructor(private renderer: Renderer2,private router:Router,private _storageService: StorageService) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        (this.actionTrigger && this.actionTrigger.nativeElement.contains(e.target) && !this.actionDropdownBox) ||
        (this.actionDropdown && this.actionDropdown.nativeElement.contains(e.target))
      ) {
        const triggerPos = this.actionTrigger?.nativeElement.getBoundingClientRect();
        this.actionDropdownBox = true;

        setTimeout(() => {
          const dropDownBox = document.getElementById('c-action-dropdown');
          dropDownBox?.setAttribute(
            'style',
            'top :  ' + (triggerPos.top + 50) + 'px; left: ' + (triggerPos.left - 155) + 'px; display : block',
          );
        }, 200);
      } else {
        this.actionDropdownBox = false;
      }
    });
  }

  ngOnInit(): void {
    if(window.location.href.includes('jobs/genericlist/')){
    this.filterApplied = (this._storageService.get(StorageKeys.FILTER_PRESERVE) && (Object.keys(this._storageService.get(StorageKeys.FILTER_PRESERVE)).length > 0)) ? true : false;
    }
  }

  get getShowActionLinks() {
    return (
      this.headerConfig?.advanceFilter || this.headerConfig?.columnSetting || this.headerConfig?.exportData || this.headerConfig?.importData || this.headerConfig?.reorder
    );
  }

  onApplyColumnSetting = (colDefin: Array<IColoumnDefinition>) => {
    this.onApplySetting.emit(colDefin);
  }

  onSelect = (actionLink: IActionLinks) => {
    if (actionLink && actionLink.method) {
      actionLink.method();
    }
  };

  private prevSearchTerm: string = null;
  onSearch = ($event: any) => {
    this.searchApplied = !!$event;
    if(!this.prevSearchTerm || (this.prevSearchTerm !== $event?.target.value)) {
      if (this.headerConfig && this.headerConfig.onSearch) {
        this.onLoading.emit();
        this.headerConfig.onSearch($event?.target.value);
      }
      this.prevSearchTerm = $event?.target.value;
    }
  };

  backtoPreviousPage() {
    if(this.headerConfig?.onBackArrowClick) {
      this.headerConfig.onBackArrowClick();
    } else {
      this.goToPreviousPage.emit(true);
    }
  }

  //Used only to notify the clear search event
  onChange = ($event: any) => {
    if (this.headerConfig && this.headerConfig.onSearch) {
      if (!$event) {
        this.searchApplied = false;
        this.headerConfig.onSearch(null);
      }
    }
  };

  onAdd = ($event: any) => {
    if (this.headerConfig && this.headerConfig.onAdd) {
      this.headerConfig.onAdd($event);
    }
  };

  onAdvanceFilterClick = () => {
    this.toggleFilter();
  };

  onColumnSettingClick = () => {
    this.showColoumnSetting = !this.showColoumnSetting;
  };

  onClose = (event:any) => {
      this.showColoumnSetting = false;
  }

  switchToOldUI = (url:string) => {
    const glv = this._storageService.get(StorageKeys.GLV_PREFERENCE);
    Object.keys(glv).forEach(ele => {
      if(window.location.href.includes(glv[ele]['newUrl'])){
        glv[ele].glv = glv[ele].newView  ? true : false
        url =glv[ele].oldUrl
      }
    })
    this._storageService.set(StorageKeys.GLV_PREFERENCE,glv,true);
    this._storageService.remove(StorageKeys.FILTER_PRESERVE)
    if(url){
      this.router.navigateByUrl(url);
    }
  }

  onImportDateClick = () => {};

  onExportDataClick = () => {};

  onReorderClick = () => {
    if(this.headerConfig?.onReorder) {
      this.headerConfig.onReorder();
    }
  }

  toggleFilter = () => {
    if (this.filterVisible === 'visible') {
      this.filterVisible = 'hidden';
    } else {
      this.filterVisible = 'visible';
    }
  };

  private panelConfig: any = null;
  private columnConfig: any = null;

  applyFilters = (evt: any, other?: boolean) => {

    if(other) {
      this.columnConfig = evt;
    } else {
      this.panelConfig = evt;
    }

    evt = {
      ...(this.columnConfig ?? {}),
      ...(this.panelConfig ?? {})
    };

    if (this.headerConfig?.advanceFilterConfig && this.headerConfig?.onAdvanceFilter) {
      if (!evt) {
        this.panelConfig = null;
        this.columnConfig = null;
        this.filterApplied = false;
        this.headerConfig.onAdvanceFilter(null);
        return;
      }

      let values: Array<string> = [...Object.values(evt || {})]
        .map((val: any) => val)
        .filter((val: any) => val || (typeof(val) === 'boolean'));

      this.onLoading.emit();
      if (values?.length) {
        this.filterApplied = true;
        this.headerConfig.onAdvanceFilter(evt);
      } else {
        this.panelConfig = null;
        this.columnConfig = null;
        this.filterApplied = false;
        this.headerConfig.onAdvanceFilter(null);
      }
    }
  };

  clearAllFilters = () => {
    this._storageService.remove(StorageKeys.FILTER_PRESERVE)
    this.filterApplied = false;
    this.panelConfig = null;
    this.columnConfig = null;
    if(this.headerConfig?.onAdvanceFilter) {
      this.onLoading.emit();
      this.headerConfig.onAdvanceFilter(null);
      this.filterCmp?.clearAllFilters();
      this.onClearFilter.emit();
    }
  }

  showFilterOnMobile() {
    this.showFilterPanel.emit(true);
    this.hideActionButton = true;
    this.actionDropdownBox = false;
  }

  hideFilterButton() {
    this.showFilterPanel.emit(false);
    this.hideActionButton = false;
  }
}
