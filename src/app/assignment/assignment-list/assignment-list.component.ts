import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { errorHandler } from '../../shared/util/error-handler';
import { UserService } from './../../core/services/user.service';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
@Component({
  selector: 'app-assignment-list',
  templateUrl: './assignment-list.component.html',
  styleUrls: ['./assignment-list.component.scss']
})
export class AssignmentListComponent implements OnInit {
  public programId: string;
  public clientId: string;
  pathname = '';
  dataLoading = false;
  isCreateRole = 'hidden';
  isViewUserRole = 'hidden';
  public vmsData: any;
  public expandList = [];
  public tableConfig: VMSConfig;
  public isExpand = false;
  public itemPerPage = 10;
  public totalRecords = 0;
  public itemsPerPage: any;
  public assignmentList: any = [];
  public tableLoaded = false;
  public searchTerm: any;
  public status: any;
  expandId: any;
  searchKey = '';
  accuracyConfig = AccuracyConfigEnum;
  // private pageNo = 0;
  // private limit = 10;

  constructor(
    public userService: UserService,
    private loaderService: LoaderService,
    public assignmentService: VendorService,
    private alertService: AlertService,
    private router: Router,
    private storageService: StorageService,) {
  }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.tableConfig = {
      title: 'Quick Assignments',
      columnList: [
        { name: 'assignment_title.name', title: 'Assignment Title', width: 23, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'status', title: 'Status', width: 12, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'code', title: 'ID', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'worker.candidate.name', title: 'Worker', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'work_location.name', title: 'Location', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },

      ],
      tabsList: ['All', 'Approved', 'Pending', 'Rejected'],
      showTabs: true,
      isExpand: true,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      isIdDifferent: true,
      differentId: 'assignment_uuid',
      tableWidth: "100%",

    };
    this.getAssignmentList();
    this.assinmentListGetCount();
  }
  onListFilter(e) {
  }
  onSortClick(event) {
  }
  onSearch(e) {
    this.searchKey = e
    this.getAssignmentList()
  }
  onClickView(e) {
    this.router.navigate([`assignment/details/${e?.assignment_uuid}/quick`]);
  }
  onTabClick(e) {
    if (typeof (e) === 'object') {
      return
    } else {
      this.status = e;
      this.getAssignmentList();
    }
  }
  getAssignmentList(pageNo = 1) {
    this.loaderService.show();
    let url
    if (this.status && this.status !== undefined && this.status?.length > 0 && this.status != 'All') {
      this.status = this.status.toLowerCase();
      url = `/assignment/programs/${this.programId}/assignment?${this.status ? ('status=' + this.status) : ''}&page=${pageNo}&limit=${this.itemPerPage}&search=${this.searchKey}`;
    } else {
      url = `/assignment/programs/${this.programId}/assignment?page=${pageNo}&limit=${this.itemPerPage}&search=${this.searchKey}`;
    }
    this.assignmentService.get(url).subscribe({next:(data: any) => {
        if (data) {
          this.assignmentList = data.data.assignment;
          this.totalRecords = data.data.total_records ? data.data.total_records : 0;
          this.tableLoaded = true;
          this.loaderService.hide();
        }
      },
      error: (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }});
  }
  assinmentListGetCount() {
    this.assignmentService.get(`/assignment/programs/${this.programId}/statuscount`).subscribe(data => {
      
    })
  }
  onExpandClick(e) {
    if (e !== null) {
      this.isExpand = true;
      this.expandId = e;
    } else {
      this.isExpand = false;
      this.expandId = undefined;
    }
  }

  onPaginationClick(e) {
    this.getAssignmentList(e);
  }

  onEditClick(data) {
    // this.selectedRole = data;
    // this.title = `Edit User Role ${data.name}`;
    // this.isCreateRole = 'visible';
  }
  onCreateClick(e) {
    this.router.navigate(['/assignment/create-assignment']);
    // this.title = 'Add User Role';
    // this.isCreateRole = 'visible';
  }

  columnClicked(columnData) {
    // if (columnData.name === 'total_users') {
    //   this.selectedRole = columnData.vmsData; 
    // }
  }
  onCloseCreateRole(event) {
    // this.isCreateRole = 'hidden';
    // this.selectedRole = {}; 
  }

  onClickCloseUserRole(event) {
    // this.isViewUserRole = 'hidden';
  }
}
