import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './../../../core/services/user.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class VendorUserListComponent implements OnInit {
  public clientId: string= undefined;
  public programId: string= undefined;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage: any;
  public tableLoaded = false;
  public editData: any;
  public viewData: any;
  public users: any;
  public viewclick: any;
  dataLoading = true;
  pathname = '';
  searchTerm:string= undefined;
  isCreateUser = 'hidden';

  constructor(public userService: UserService, private localStorage: StorageService, 
    private location: Location,
    private route: ActivatedRoute, private _loader: LoaderService) {
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.isCreateUser = 'visible';
        if (param.get('add') !== 'add' && param.get('add') !== 'view') {
          this.loadAndViewEdit(param.get('add'), 'edit');
        } else if (param.get('add') === 'view') {
          this.loadAndViewEdit(param.get('id'), 'view');
        }
      }
    });
  }

  loadAndViewEdit(userId, vieworEdit) {    
    let programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.clientId =  this.localStorage.get("ORG_ID");
    this.userService.get(`/profile-manager/users/${userId}`)
      .subscribe((res: any) => {
        const { user } = res;
        if (vieworEdit === 'edit') {
          this.onEditClick(user);
        } else {
          this.onClickView(user);
        }
      });
  }

  ngOnInit(): void {
    let programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.clientId =  this.localStorage.get("ORG_ID");
    this.tableConfig = {
      permission: 'menu_settings',
      title: 'Users List',
      columnList: [
        { name: 'name', title: 'Name', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'is_enabled', title: 'Status', width: 13,  isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'role.name', title: 'User Role', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'id', title: 'ID', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        {name: 'supervisor.full_name', title: 'Supervisor', width:18, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'modified_on', title: 'Updated Date', width: 27, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'assignment_id', title: 'Assignment ID', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        
        // { name: 'assignment_code', title: 'Assignment Code', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
       ],
      showTabs: true,
      isExpand: false,
      isFilter: false,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: true,
      density: 'COMFORTABLE',
      tableWidth: "100%",
      isSort: true
      // tableWidth: "100%"
    };
    this.getUsers();
  }

  getUsers(pageNo = 1) {
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }

    if (this.searchTerm) {
      this.searchTerm = this.searchTerm.split('+').join('%2B');
    }

    this.userService.get(`/configurator/organizations/${this.clientId}/members?limit=10&page=${pageNo}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`)
      .subscribe({
        next: (data: any) => {

          data?.members?.forEach(member => {
            if (member) {
              member.name = `${member?.first_name} ${member?.last_name}`,
                member.supervisor_name = member?.supervisor?.first_name ? `${member?.supervisor?.first_name} ${member?.supervisor?.last_name}` : '-'
            }
          });
          this.totalRecords = data?.total_records;
          this.itemsPerPage = data?.items_per_page;
          this.tableLoaded = true;
          this.vmsData = data?.members;
          this._loader.hide();
        }, error: (error: Error) => {
          console.error(error);
        }, complete: () => {
          this.dataLoading = false;
          this._loader.hide();
        }
      }
    );
  }

  onCreateClick(e) {
    this.location.replaceState(`/vendor-managment/users/list/add`);
    this.isCreateUser = 'visible';
    this.editData = "";
    this.viewclick = false;    
  }

  onSearch(term){
    if (term != this.searchTerm) {
      this.searchTerm = term;
      this.getUsers();
    }
  }

  onCloseCreateUser(event) {    
    this.location.replaceState(`/vendor-managment/users/list`);
    this.getUsers();
    this.isCreateUser = 'hidden';
    this.editData = "";
    this.viewclick = false;
  }

  onEditClick(eve) {
    this.isCreateUser = 'visible';
    this.viewclick = false;
    this.editData = eve;
  }

  onClickView(event) {
    this.location.replaceState(`/vendor-managment/users/list`);
    this.isCreateUser = 'visible';
    // this.viewclick = true;
    this.viewclick = false;
    this.editData = event;
  }

  onExpandClick(event) { }
  onPaginationClick(event) {
    this.getUsers(event)
  }
  onViewClick() { }
}
