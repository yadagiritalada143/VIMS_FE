import { Component, OnInit, Output, EventEmitter, Renderer2, Input, ElementRef, ViewChild, OnChanges } from '@angular/core';

@Component({
  selector: 'app-timeline-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnInit, OnChanges {
  @Output() changePage = new EventEmitter<number>(true);
  @Output() changeRecords = new EventEmitter<number>(true);
  @Input() initialPage = 1;
  @Input() currentPage = 1;
  @Input() maxPages = 1;
  @Input() itemsPerPage: any;
  beforePages = [];
  afterPages = [];
  pageNumber = 0;
  pager: any = [];
  showMorePage = false;
  showMorePageFirst = false;
  firstpage: any;
  selectedRecords: any = { selected: 10 };
  message = false;
  @ViewChild('secondBox', { read: ElementRef, static: false }) secondBox: ElementRef;
  @ViewChild('firstBox', { read: ElementRef, static: false }) firstBox: ElementRef;
  @ViewChild('thirdBox', { read: ElementRef, static: false }) thirdBox: ElementRef;
  @ViewChild('fourthBox', { read: ElementRef, static: false }) fourthBox: ElementRef;
  // tslint:disable-next-line:variable-name
  @ViewChild('record_id', { read: ElementRef, static: false }) record_id: ElementRef;


  constructor(private render: Renderer2) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.secondBox && this.secondBox.nativeElement.contains(e.target))) {
        this.showMorePage = true;
      }
      else if ((this.showMorePage && this.thirdBox && this.thirdBox.nativeElement.contains(e.target))) {
        this.showMorePage = true;
      }
      else {
        this.showMorePage = false;
      }
      if ((this.firstBox && this.firstBox.nativeElement.contains(e.target))) {
        this.showMorePageFirst = true;
      }
      else if ((this.showMorePageFirst && this.fourthBox && this.fourthBox.nativeElement.contains(e.target))) {
        this.showMorePageFirst = true;
      }
      else {
        this.showMorePageFirst = false;
      }
    });
  }

  ngOnInit(): void {
    if (this.itemsPerPage) {
      this.selectedRecords.selected = this.itemsPerPage || 10;
    }
  }

  ngOnChanges() {
    this.pager = new Array(this.maxPages).fill(1, 0, this.maxPages).map((x, i) => i + 1)
    this.pager = new Array(this.maxPages).fill(1, 0, this.maxPages).map((x, i) => i + 1);
    this.firstpage = this.maxPages - (this.maxPages - 1);
    this.processPages();
  }

  onClick(event, page: string) {
    const p = +page;
    if (p > 0 && p <= this.maxPages) {
      this.showMorePage = false;
      this.showMorePageFirst = false;
      if (page === '-1') {
        if (this.currentPage === 1) {
          return;
        }
        this.currentPage = this.currentPage - 1;
      } else if (page === '+1') {
        if (this.currentPage === this.maxPages) {
          return;
        }
        this.currentPage = this.currentPage + 1;
      } else {
        this.currentPage = +page;
      }
      this.changePage.emit(this.currentPage);
      event.preventDefault();
      this.message = false;
    } else {
      this.message = true;
    }
    if (!this.message) {
      this.processPages();
    }
  }

  processPages() {
    this.beforePages = [];
    this.afterPages = [];
    if (this.pager && this.pager.length > 0) {
      if (this.pager.length < 7) {
        this.beforePages = this.pager;
      } else {
        this.afterPages = [this.maxPages - 2, this.maxPages - 1, this.maxPages];
        this.pager.forEach(page => {
          if (!this.paginationTabShowHideMiddle(page) && !this.afterPages.includes(page)) {
            this.beforePages.push(page);
          }
        });

        if (this.maxPages - this.currentPage < 1) {
          this.beforePages = [1, 2, 3];
        }
        if (this.beforePages.length > 3) {
          this.beforePages.shift();
        }
      }
    }

    if (this.beforePages.length === 1) {
      this.beforePages = [];
    }

  }
  paginationTabShowHideFirst(page: number) {

    if ((this.currentPage === 1) && ((page === 2) || (page === 3))) {
      return true;
    } else if (page === this.maxPages) {
      return true;
    } else if ((this.currentPage - page) > 1) {
      return false;
    } else if ((page - this.currentPage) > 1) {
      return true;
    }
    return true;
  }

  paginationTabShowHideMiddle(page: number) {
    if ((this.maxPages - this.currentPage) < 3) {
      if ((page >= (this.maxPages - 5)) && (page <= (this.maxPages - 3))) {
        return false;
      }
    } else {
      if ((this.currentPage === 1) && ((page === 2) || (page === 3))) {
        return false;
      } else if ((this.currentPage === this.maxPages) && (page === (this.maxPages - 2))) {
        return false;
      } else if ((this.currentPage - page) > 2) {
        return true;
      } else if ((page - this.currentPage) > 1) {
        return true;
      } else if (page === this.maxPages) {
        return true;
      } else if (page === this.maxPages || page === (this.maxPages - 2) || page === (this.maxPages - 1)) {
        return true;
      }
      return false;
    }
    return true;
  }

  showDropDown() {
    this.message = false;
    this.showMorePage = true;
    this.showMorePageFirst = false;
  }
  selectRecord(e) {
    this.selectedRecords.selected = undefined;
    this.selectedRecords.selected = e;
    this.changeRecords.emit(this.selectedRecords.selected);
  }
}

