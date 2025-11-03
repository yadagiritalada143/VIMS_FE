import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { VMSConfig } from '../simple-table/simple-table.model';

@Component({
  selector: 'simple-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() mainmenuName;
  @Input() isCreateButtonName: string;
  @Input() tableConfig: VMSConfig;

  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onSearch = new EventEmitter<any>();
  @Output() onSortFilter = new EventEmitter();

  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;

  public tooltipName: any;
  public density = 'COMFORTABLE';
  public searchValue = '';
  public isSearchOpen = false;

  private filterList = {};
  private columnCust = [];

  constructor(private render: Renderer2, private changeDetectorRef: ChangeDetectorRef) {
    this.render.listen('window', 'click', (e: Event) => {
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
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
    this.tooltipName = this.mainmenuName?.replace(/ List/gi, ' ');
    if (this.tableConfig && this.tableConfig.density) {
      this.density = this.tableConfig.density;
    }
    if (this.tableConfig && this.tableConfig.columnList) {
      this.tableConfig.columnList.forEach(col => {
        this.filterList[col.name] = true;
        this.columnCust.push({ name: col.name, value: true });
      });
    }
  }

  public onCreateClick() {
    this.onCreate.emit(true);
  }

  public onSearchClick(event = null) {
    if (event === null) {
      this.onSearch.emit(this.searchValue);
    } else if (event.keyCode === 13) {
      this.onSearch.emit(this.searchValue);
    } else if (this.searchValue.length === 0) {
      this.onSearch.emit(this.searchValue);
    }
  }

  public onClickSort(eve) {
    this.onSortFilter.emit(eve);
  }
}
