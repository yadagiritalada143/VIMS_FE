import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnInit {

  @Output() onChangePage = new EventEmitter<number>(true);
  @Output() onChangeItemsPerPage = new EventEmitter<number>(true);
  @Input() public initialPage = 1;
  @Input() public currentPage = 1;
  @Input() public maxPages = 1;
  @Input() public itemsPerPage: number;
  public selectedRecords = { selected: 5 };

  constructor() {}

  ngOnInit(): void {
    if (this.itemsPerPage)
      this.selectedRecords.selected = this.itemsPerPage || 5;
  }

  onClick(event, page: string) {
    let p = parseInt(page);
    if (p <= this.maxPages) {
      if (page === '-1') {
        if (this.currentPage === 1) {
          return
        }
        this.currentPage = this.currentPage - 1;
      } else if (page === '+1') {
        if (this.currentPage === this.maxPages) {
          return
        }
        this.currentPage = this.currentPage + 1;
      } else {
        this.currentPage = parseInt(page);
      }
      this.onChangePage.emit(this.currentPage);
      event.preventDefault();
    }
  }

  selectRecord(value: number) {
    this.selectedRecords.selected = value;
    this.onChangeItemsPerPage.emit(this.selectedRecords.selected);
  }

  public isLeftNavigate() {
    return this.currentPage > 1;
  }

  public isRightNavigate() {
    return this.currentPage < this.maxPages;
  }

}
