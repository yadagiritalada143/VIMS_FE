import { Component, OnInit, Input, Output, EventEmitter, Renderer2, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subscription } from 'rxjs';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from '../table/table.model';

@Component({
  selector: 'vms-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class VMSHeaderComponent implements OnInit {
  @Input() mainmenuName = 'Clients';
  @Input() submenuName: string;
  @Input() createBtnName = 'Create New';
  @Input() isCreateButtonName: string;
  @Input() tableConfig: VMSConfig;
  @Input() initialPage = 1;
  @Input() currentPage = 1;
  @Input() maxPages = 1;
  @Input() showOrg = false;

  @Output() changePages = new EventEmitter<number>(true);
  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onFilter = new EventEmitter<any>();
  @Output() onSearch = new EventEmitter<any>();
  @Output() onReorder = new EventEmitter<any>();
  @Output() onSetting = new EventEmitter<any>();
  @Output() onListFilter = new EventEmitter();
  @Output() onTabClick = new EventEmitter();
  @Output() onBackClick = new EventEmitter<boolean>();

  isSearchOpen = false;
  searchValue = '';
  density = 'COMFORTABLE';
  selectedTab: any;
  showSettings = false;
  showFilter = false;
  totalFilterApplied = 0;
  isFilterCleard = false;
  private dragStartIndex: number;

  @ViewChild('setting', { read: ElementRef, static: false }) setting: ElementRef;
  @ViewChild('settingMenu', { read: ElementRef, static: false }) settingMenu: ElementRef;
  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;
  @ViewChild('filter', { read: ElementRef, static: false }) filter: ElementRef;
  @ViewChild('filterMenu', { read: ElementRef, static: false }) filterMenu: ElementRef;
  @ViewChild('filterCount', { read: ElementRef, static: false }) filterCount: ElementRef;

  classList = ['ng-option-label', 'ng-option-marked', 'ng-option', 'ng-value-icon', 'datepicker--cell', 'datepicker-apply-btn'];
  private subscriptions: Subscription[] = [];
  constructor(private render: Renderer2, private changeDetectorRef: ChangeDetectorRef, private eventStream: EventStreamService) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.setting && this.setting.nativeElement.contains(e.target) && !this.showSettings) ||
        (this.settingMenu && this.settingMenu.nativeElement.contains(e.target))
      ) {
        this.showSettings = true;
      } else {
        this.showSettings = false;
      }
      if (
        (this.search && this.search.nativeElement.contains(e.target)) ||
        (this.searchInput && this.searchInput.nativeElement.contains(e.target))
      ) {
        this.isSearchOpen = true;
      } else {
        if (this.searchValue.length > 0) {
          this.isSearchOpen = true;
        } else {
          this.isSearchOpen = false;
        }
      }
      // if ((this.filter && this.filter.nativeElement.contains(e.target)) ||
      //   (this.filterMenu && this.filterMenu.nativeElement.contains(e.target)) ||
      //   (this.filterCount && this.filterCount.nativeElement.contains(e.target)) ||
      //   (this.classList.some(className => e.target['classList'].contains(className)))) {
      //   this.showFilter = true;
      // } else {
      //   this.showFilter = false;
      // }
      this.changeDetectorRef.detectChanges();
    });
  }

  filterList = {};
  columnCust = [];

  ngOnInit(): void {
    if (this.tableConfig && this.tableConfig.density) {
      this.density = this.tableConfig.density;
    }
    if (this.tableConfig && this.tableConfig.columnList) {
      this.tableConfig.columnList.forEach(col => {
        this.filterList[col.name] = true;
        this.columnCust.push({ name: col.name, value: true });
      });
    }
    this.onSetting.emit(this.columnCust);
    this.tabClick(this.tableConfig?.columnList[0]);
    this.subscriptions.push(
      this.eventStream.on(Events.FILTER_CLEAR).subscribe(data => {
        this.onAdFilterClear();
      }),
    );
  }

  onCreateClick() {
    this.onCreate.emit(true);
  }

  activateFilter() {
    this.showFilter = true;
  }

  onFilterDone(event) {
    this.isFilterCleard = false;
    if (event) {
      this.searchValue = '';
      this.isSearchOpen = false;
      this.totalFilterApplied = event.noOfFilter;
      this.onListFilter.emit(event.filterData);
    } else {
      this.totalFilterApplied = 0;
      this.onListFilter.emit();
    }
    this.changeDetectorRef.detectChanges();

    this.showFilter = false;
  }

  onCloseFilter($event) {
    if ($event) {
      this.showFilter = false;
    }
  }

  onClick(event, page: string) {
    if (page === '-1') {
      if (this.currentPage > 1) {
        this.currentPage = this.currentPage - 1;
      } else {
        event.preventDefault();
        return;
      }
    } else if (page === '+1') {
      if (this.currentPage < this.maxPages) {
        this.currentPage = this.currentPage + 1;
      } else {
        event.preventDefault();
        return;
      }
    }
    this.changePages.emit(this.currentPage);
    event.preventDefault();
  }

  tabClick(tab) {
    this.selectedTab = tab;
    this.onTabClick.emit(tab);
  }

  onSearchClick(event = null) {
    if (event === null) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    } else if (event.keyCode === 13) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    } else if (this.searchValue.length === 0) {
      this.onSearch.emit(encodeURIComponent(this.searchValue));
    }
  }

  onReorderClick() {
    this.onReorder.emit(true);
  }

  onClickColumn(name) {
    if (this.columnCust.indexOf(this.columnCust.find(n => n.name === name)) === 0) {
      this.columnCust.find(n => n.name === name).value = true;
    } else {
      this.columnCust.find(n => n.name === name).value = !this.columnCust.find(n => n.name === name).value;
    }
    this.filterList[name] = this.columnCust.find(n => n.name === name).value;
    this.onSetting.emit(this.columnCust);
  }

  onDensityClick(id) {
    this.density = id;
    this.eventStream.emit(new EmitEvent(Events.VIEW_TYPE, id));
  }

  onColumnCustomClick(name) {
    this.filterList[name] = !this.filterList[name];
  }

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex !== 0) {
          this.tableConfig.columnList.splice(this.dragStartIndex, 1);
          this.tableConfig.columnList.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dragStartIndex = null;
  }

  onAdFilterClear() {
    this.eventStream.emit(new EmitEvent(Events.FILTER_NOTIFICATIONS, 'clear'));
    this.eventStream.emit(new EmitEvent(Events.ROLE_SEARCH, 'clear'));
    this.isFilterCleard = true;
    this.totalFilterApplied = 0;
    this.onListFilter.emit();
  }

  showGridViewLayout(event) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_GRID_LAYOUT, event));
  }

  onBackClicked() {
    this.onBackClick.emit(true);
  }
}
