import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';

@Component({
  selector: 'app-vendor-list',
  templateUrl: './vendor-list.component.html'
})
export class VendorListComponent implements OnInit {
  vmsData = []
  itemPerPage = 10
  totalRecords=10

  tableConfig: VMSConfig = {
    title: 'Jobs',
    columnList: [
      { name: 'title.title', title: 'Vendor Name', width: 7, isIcon: false, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false, isOptOut: true, isSubmitCandidate: true },
      { name: 'status', title: 'Status', width: 5, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false },
      { name: 'candidate', title: 'Candidate Submitted', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isRange: true, rangeNameList: ['start_date', 'end_date'] },
      { name: 'job', title: 'Job Filled', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'compliance', title: 'Compliance status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      { name: 'audit', title: 'Audit Completed', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
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
