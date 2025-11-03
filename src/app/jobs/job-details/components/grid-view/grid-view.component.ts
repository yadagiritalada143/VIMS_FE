import { Component, ElementRef, Input, OnInit, ViewChild, Renderer2, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-grid-view',
  templateUrl: './grid-view.component.html',
  styleUrls: ['./grid-view.component.scss']
})
export class GridViewComponent implements OnInit, OnChanges {
  searchValue = '';
  isSearchOpen = true;
  showSettings = false;
  showFilter = false;
  density = 'COMFORTABLE';
  showActionDropdown = false;
  @Input() gridData;
  @Input() gridContentType;
  vmsData;
  itemsPerPage: number;
  totalRecords: number;
  sortingCol = false;
  private jobId;

  @ViewChild('setting', { read: ElementRef, static: false }) setting: ElementRef;
  @ViewChild('settingMenu', { read: ElementRef, static: false }) settingMenu: ElementRef;
  @ViewChild('search', { read: ElementRef, static: false }) search: ElementRef;
  @ViewChild('searchInput', { read: ElementRef, static: false }) searchInput: ElementRef;
  @ViewChild('filter', { read: ElementRef, static: false }) filter: ElementRef;
  @ViewChild('filterMenu', { read: ElementRef, static: false }) filterMenu: ElementRef;

  classList = ['ng-option-label', 'ng-option-marked', 'ng-option', 'ng-value-icon', 'datepicker--cell', 'ng5-slider-pointer'];
  constructor(private render: Renderer2,private _eventStrem: EventStreamService,private route: ActivatedRoute,
    ) {
    this.jobId = this.route.snapshot.params['id'];
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
      if ((this.filter && this.filter.nativeElement.contains(e.target)) ||
        (this.filterMenu && this.filterMenu.nativeElement.contains(e.target)) ||
        (this.classList.some(className => e.target['classList'].contains(className)))) {
        this.showFilter = true;
      } else {
        this.showFilter = false;
      }
    });
  }

  ngOnInit(): void {
    // this.vmsData = this.gridData;
    // this.itemsPerPage = 12;
    // this.totalRecords = this.gridData.candidate.length;
   // this.changeDetectorRef.detectChanges()

    // this.vmsData = {
    //   "candidate": [
    //     {
    //       "candidate": "James Butt",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 60
    //     },
    //     {
    //       "candidate": "Josephine Darakjy",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 50
    //     },
    //     {
    //       "candidate": "Art Venere",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 90
    //     },
    //     {
    //       "candidate": "James Butt",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 60
    //     },
    //     {
    //       "candidate": "Josephine Darakjy",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 50
    //     },
    //     {
    //       "candidate": "Art Venere",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 90
    //     },
    //     {
    //       "candidate": "James Butt",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 60
    //     },
    //     {
    //       "candidate": "Josephine Darakjy",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 50
    //     },
    //     {
    //       "candidate": "Art Venere",
    //       "availability": "12/04/2020",
    //       "pay_rate": "$54.00",
    //       "est_hours": "55.0",
    //       "est_pay": "$2,970.00",
    //       "match": 90
    //     }
    //   ]
    // }
  }
 
  ngOnChanges(){
    this.vmsData = this.gridData;
    this.itemsPerPage = 12;
    if(this.gridContentType == 'candidate'){
      this.totalRecords = this.gridData?.candidate.length;
    }else if(this.gridContentType == 'interview'){
      this.totalRecords = this.gridData.interview.length;
    }
  }
  showActions(value) {
    value.active = true;
  }

  hideActionDropdown(value) {
    value.active = false;
  }

  matchValues(value) {
    return {
      "width": `${value}%`
    }
  }

  onSearchClick(event) {
     this._eventStrem.emit(new EmitEvent(Events.SEARCH_IN_SUB_CANDIDATE, { value: this.searchValue,  }));
   }

  onDensityClick(id) {
    this.density = id;
  }

  onClickColumn() {
    this.sortingCol = !this.sortingCol;
  }
  onListViewClicked(){
    this._eventStrem.emit(new EmitEvent(Events.SHOW_GRID_LAYOUT, false));
  }
  withdrawalClicked(event) {
    if (event) {
      this._eventStrem.emit(new EmitEvent(Events.WITHDRAW_CANDIDATE, { value: true, candidateId: event.id, jobId: this.jobId }));
    }
  }
}
