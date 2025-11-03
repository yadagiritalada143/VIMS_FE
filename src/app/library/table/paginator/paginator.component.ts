import { Component, OnInit, Output, EventEmitter, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'vms-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
})
export class VMSPaginatorComponent implements OnInit, OnChanges {
  @Input() initialPage = 1;
  @Input() currentPage = 1;
  @Input() maxPages = 1;
  @Input() itemsPerPage: any;
  @Input() showRecordSelect = false;

  @Output() changePage = new EventEmitter<number>(true);
  @Output() changeRecords = new EventEmitter<number>(true);

  pager: any = [];
  selectedRecords: any = { selected: 10 };

  constructor() {}

  ngOnInit(): void {
    if (this.itemsPerPage) {
      this.selectedRecords.selected = this.itemsPerPage || 10;
    }
  }

  ngOnChanges() {
    this.pager = new Array(this.maxPages).fill(1, 0, this.maxPages).map((x, i) => i + 1);
  }

  onClick(event, page: string) {
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
      this.currentPage = parseInt(page);
    }
    this.changePage.emit(this.currentPage);
    event.preventDefault();
  }

  paginationTabShowHide(page: number) {
    if (this.currentPage === 1 && (page === 2 || page === 3)) {
      return false;
    } else if (this.currentPage === this.maxPages && page === this.maxPages - 2) {
      return false;
    } else if (this.currentPage - page > 1) {
      return true;
    } else if (page - this.currentPage > 1) {
      return true;
    }
    return false;
  }

  selectRecord(e) {
    this.selectedRecords.selected = undefined;
    this.selectedRecords.selected = e;
    this.changeRecords.emit(this.selectedRecords.selected);
  }
}
