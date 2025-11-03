import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';

@Component({
  selector: 'app-vendor-group',
  templateUrl: './vendor-group.component.html'
})
export class VendorGroupComponent implements OnInit {
  vmsData = []
  itemPerPage = 10
  totalRecords=10

  tableConfig: VMSConfig = {
    title: 'Jobs',
    columnList: [
      { name: 'title.title', title: 'Document', width: 7, isIcon: false, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false, isOptOut: true, isSubmitCandidate: true },
      { name: 'Frequency', title: 'Frequency', width: 5, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false },
      { name: 'update', title: 'Last Updated', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isRange: true, rangeNameList: ['start_date', 'end_date'] },
      { name: 'date', title: 'Expiration Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'next_date', title: 'Next Expiration Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      { name: 'status', title: 'Compliance status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      { name: 'name', title: 'Compliance Name', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: false,
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Job Title', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ]
  };



  constructor() { }

  ngOnInit(): void {
  }

  onCreateClick(event) {

  }
  onClickView(event) {

  }

  onListFilter(event){}

  onSearch(event) {}

  onSortClick(event){}

  onPaginationClick(event){}



}
