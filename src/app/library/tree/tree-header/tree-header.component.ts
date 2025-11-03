import { Component, ElementRef, Input, OnInit, ViewChild, Renderer2, EventEmitter, Output } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { VMSConfig } from '../../table/table/table.model';


@Component({
  selector: 'app-tree-header',
  templateUrl: './tree-header.component.html',
  styleUrls: ['./tree-header.component.scss']
})
export class TreeHeaderComponent implements OnInit {

  @Input() treeConfig: VMSConfig;
  @Input() initialPage = 1;
  @Input() currentPage = 1;
  @Input() maxPages = 1;
  @Input() flattednedHierarchy: any;
  @Output() changePages = new EventEmitter<number>(true);
  @Output() onSetting = new EventEmitter<any>();
  @Output() onSearch = new EventEmitter<any>();
  @Output() onListFilter = new EventEmitter();
  searchValue = '';
  isSearchOpen = false;
  showSettings = false;
  showFilter = false;
  density = 'COMFORTABLE';
  private dragStartIndex: number;
  

  @ViewChild('setting', { read: ElementRef, static: false }) setting: ElementRef;
  @ViewChild('settingMenu', { read: ElementRef, static: false }) settingMenu: ElementRef;
  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;
  @ViewChild('filter', { read: ElementRef, static: false }) filter: ElementRef;
  @ViewChild('filterMenu', { read: ElementRef, static: false }) filterMenu: ElementRef;

  classList = ['ng-option-label', 'ng-option-marked', 'ng-option', 'ng-value-icon', 'datepicker--cell'];
  constructor(private render: Renderer2) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.setting && this.setting.nativeElement.contains(e.target) && !this.showSettings) ||
        (this.settingMenu && this.settingMenu.nativeElement.contains(e.target))) {
        this.showSettings = true;
      } else {
        this.showSettings = false;
      }
      if ((this.search && this.search.nativeElement.contains(e.target)) ||
        (this.searchInput && this.searchInput.nativeElement.contains(e.target))) {
        this.isSearchOpen = true;
      } else {
        this.isSearchOpen = false;
      }
      // if ((this.filter && this.filter.nativeElement.contains(e.target)) ||
      //   (this.filterMenu && this.filterMenu.nativeElement.contains(e.target)) ||
      //   (this.classList.some(className => e.target['classList'].contains(className)))) {
      //   this.showFilter = true;
      // } else {
      //   this.showFilter = false;
      // }
    });
  }
  filterList = {};
  columnCust = [];

  ngOnInit(): void {
    if (this.treeConfig && this.treeConfig.density) {
      this.density = this.treeConfig.density;
    }
    if (this.treeConfig && this.treeConfig.columnList) {

      this.treeConfig.columnList.forEach(col => {
        this.filterList[col.name] = true;
        this.columnCust.push({ name: col.name, value: true });
      });
    }
  }

  activateFilter() {
    this.showFilter = true;
  }

  toggleFilter(event: any) {
    if(event)
    this.showFilter = false;
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
  }

  onSearchClick() {
    this.onSearch.emit(this.searchValue);
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
          this.treeConfig.columnList.splice(this.dragStartIndex, 1);
          this.treeConfig.columnList.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dragStartIndex = null;
  }

  treeFilter(eve){
    this.onListFilter.emit(eve);
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
}
