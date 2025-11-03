import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rate-card-header',
  templateUrl: './rate-card-header.component.html',
  styleUrls: ['./rate-card-header.component.scss']
})
export class RateCardHeaderComponent implements OnInit, OnDestroy {

  @Input() isCreate: boolean;
  @Input() mainmenuName = 'Rate Card';
  @Input() submenuName: string;
  @Input() isSearch: boolean;
  @Input() isFilter: boolean;
  @Input() isTheme: boolean;
  @Input() isCreateButtonName: string;

  @Output() onCreate = new EventEmitter();
  @Output() onSearch = new EventEmitter<any>();
  @Output() clearFilterList = new EventEmitter();
  @Output() filtersAppliedList = new EventEmitter();

  showBackButton: boolean = true;
  ratecardFilter: any = "hidden";
  isSearchOpen: boolean;
  searchValue = '';
  showFilter = false;
  totalFilterApplied = 0;
  classList = [
    'ng-option-label', 
    'ng-option-marked', 
    'ng-option', 
    'ng-value-icon', 
    'datepicker--cell'
  ];

  advanceFilter: [
    {
      name: 'unit_of_measure', title: 'Unit of Measure', filterType: 'MULTISELECT', multiSelectData: [
        { name: 'Hourly', value: 'Hourly' },
        { name: 'Daily', value: 'Daily' },
        { name: 'Weekly', value: 'Weekly' },
        { name: 'Monthly', value: 'Monthly' },
        { name: 'Yearly', value: 'Yearly' },
        { name: 'All', value: 'All' },
      ]
    },
  ];

  @ViewChild('setting', { read: ElementRef, static: false }) setting: ElementRef;
  @ViewChild('settingMenu', { read: ElementRef, static: false }) settingMenu: ElementRef;
  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;
  @ViewChild('filter', { read: ElementRef, static: false }) filter: ElementRef;
  @ViewChild('filterMenu', { read: ElementRef, static: false }) filterMenu: ElementRef;
  @ViewChild('filterCount', { read: ElementRef, static: false }) filterCount: ElementRef;

  constructor (
    private render: Renderer2,
    private changeDetectorRef: ChangeDetectorRef,
    private localStorage: StorageService,
    private router: SvmsRouterService,
    private route: Router
  ) {

    this.render.listen('window', 'click', (e: Event) => {

      let searchValid: boolean = (this.search && this.search.nativeElement.contains(e.target));
      let searchInputValid: boolean = (this.searchInput && this.searchInput.nativeElement.contains(e.target));

      if (searchValid || searchInputValid) {
        this.isSearchOpen = true;
      } else {
        if (this.searchValue.length > 0) {
          this.isSearchOpen = true;
        } else {
          this.isSearchOpen = false;
        }
      }

      let filterValid: boolean = this.filter && this.filter.nativeElement.contains(e.target);
      let filterMenuValid: boolean = this.filterMenu && this.filterMenu.nativeElement.contains(e.target);
      let filterCountValid: boolean = this.filterCount && this.filterCount.nativeElement.contains(e.target);
      let classListValid: boolean = this.classList.some(className => e.target['classList'].contains(className));

      if (filterValid || filterMenuValid || filterCountValid || classListValid) {
        this.showFilter = true;
      } else {
        this.showFilter = false;
      }

      this.changeDetectorRef.detectChanges();
      
    });
  }

  ngOnInit(): void {
    this.localStorage.remove("UOMSelected");
  }

  onCreateClick() {
    this.onCreate.emit(true);
  }

  onSearchClick(event = null) {
    if (event.keyCode === 13) {
      this.onSearch.emit(this.searchValue);
    } else if (this.searchValue.length === 0) {
      this.onSearch.emit(this.searchValue);
    }
  }

  clearFilters() {
    this.totalFilterApplied = 0;
    this.clearFilterList.emit();
    if(this.localStorage.get("UOMSelected")){
      this.localStorage.remove("UOMSelected");
    }
  }

  filtersApplied(event: any) {
    this.totalFilterApplied = 1;
    this.filtersAppliedList.emit(event);
  }

  onshowFilterFlyout(ratecardFilter: any ){
    switch(ratecardFilter) {
      case 'hidden': this.ratecardFilter = 'hidden'; this.showFilter = false; break;
      case 'visible': this.ratecardFilter = 'visible'; this.showFilter = true; break;
      default: this.ratecardFilter = 'hidden'; this.showFilter = false;
    }
  }

  redirectToRateCardListing() {
    if(this.route.url.includes('self-configuration')) {
      this.router.navigate(['rate', 'rate-card', 'list']);
    } else {
      this.router.navigate(['rate-card', 'list']);
    }
  }

  ngOnDestroy() {
    this.localStorage.remove("UOMSelected");
  }
}
