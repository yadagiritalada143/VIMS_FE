import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  public dataLoader: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'candidate';
  tableLoaded = true;
  dataLoading = false;
  itemsPerPage = "";
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  constructor() {
    
   }

  ngOnInit(): void {

    this.tableConfig = {
      title: 'On Boarding',
      columnList: [
        { name: 'task_name', title: 'Task Name', width: 10, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'start_date', title: 'Start Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'due_date', title: 'Due Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'dependency', title: 'Dependency', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'dependency_task', title: 'Dependency Task', width: 18, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'actor', title: 'Actor', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCandidateStatus: false }
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: false,
      hideResultCount: true,
      isCreate: true,
      density: 'COMFORTABLE',
      isTheme: true,
      tableWidth: '100%',
      // advanceFilter: [
      //   { name: 'availability', title: 'Availability', filterType: 'DATERANGE'},
      //   { name: 'est_pay', title: 'Estimated Pay Rate', filterType: 'DATERANGE'},
      //   { name: 'modified_on', title: 'Date Updated range', filterType: 'DATERANGE'},
      //  ]
    };
  }


  onClickView(event){}
  onExpandClick(event){}
  onEditClick(event){}
  onPaginationClick(event){}
  onCreateClick(event){}
  disableClicked(event){}
  onDeleteClick(event){}
  columnClicked(event){}
  onSearch(event){}
  onListFilter(event){}



}
