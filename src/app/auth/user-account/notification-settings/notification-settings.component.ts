import { Component, OnInit } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserService } from 'src/app/core/services/user.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from '../../../core/components/alert/alert.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss']
})
export class NotificationSettingsComponent implements OnInit {
  profileUser: any;
  programMember: any;
  currentProgram: any;
  user: any;
  userType = "ADMIN";
  jobs = true;
  timeAndExp = false;
  invoice = false;
  email = true;
  text = false;
  mobile = false;
  web = false;
  public toggleJobs: any = {};


  dataLoading: boolean = false
  public moduleData: any = [];
  public totalPages = 0;
  public totalRecords = 0;
  public tableLoaded = false
  public searchTerm = '';
  public infoList: any = [];
  public actionList: any = [];
  public selectedCategories: any = {};
  public index = 0;
  public isSaveLoader: boolean = false;
  public programId: string;
  public user_Id: any;

  constructor(
    private userService: UserService,
    private loader: LoaderService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private router: SvmsRouterService,
   ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.currentProgram?.config?.notifications?.hide_old_notification_tab) {
      this.router.navigate(['auth', 'unauthorized']);
      return;
    }
    this.programId = this.currentProgram.id;
    let roleName = this.storageService.get('account').role.name;
    if(roleName.toLowerCase().includes("hiring manager")){
      this.userType = "HM";
    }else if(roleName.toLowerCase().includes("client administrator")){
      this.userType = "CLIENT";
    }
    this.user = this.storageService.get('user');
    this.user_Id = this.user.id || this.user._id;

    this.init()
    this.getCategoriesList();
  }

  init() {
    this.getUser();
  }

  onClickToggleJob() {
    if (this.toggleJobs.value) {
      this.toggleJobs.value = false;
    } else {
      this.toggleJobs.value = true;
    }
  }

  getUser() {
    this.loader.show();
    this.userService.get(`/profile-manager/users/${this.user.id}`)
      .subscribe({
        next: (res: any) => {
          const { user } = res;
          this.profileUser = user;
          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
        }
      })

    this.userService.getMembershipDetails(this.currentProgram?.id, this.user.id).subscribe((res: any) => {
      const { member } = res;
      this.programMember = member;
    })
  }


  onSubmit() {
    let payload;
    this.actionList?.forEach(a => {
      a.category_status = this.toggleJobs.value
    });
    payload = {
      program_id: this.programId,
      user_id: this.user_Id,
      info_type: 1,
      module: this.selectedCategories?.id,
      category_status: this.toggleJobs.value,
      category: this.selectedCategories?.id,
      category_list: this.actionList
    }
    if (payload) {
      this.isSaveLoader = true;
      this.userService.post(`/notification/api/notification/user-prefrence`, payload).subscribe(
        data => {
          if (data) {
            this._alertService.success(`Data saved successfully.`);
          }
          this.isSaveLoader = false;
        },
        (err) => {
          this.isSaveLoader = false;
          this._alertService.error(errorHandler(err));
        });
    } else {
      this._alertService.error('Invalid data');
    }
  }

  selectedModule(module, i) {
    this.index = i;
    this.selectedCategories = module || this.moduleData[0]?.id;
    this.getActionList();
  }
  getCategoriesList(pageNo = 1) {
    this.dataLoading = true;
    // /notification/api/notification/categories
    this.userService.get(`/notification/api/notification/module`).subscribe({
      next: (data: any) => {
        this.moduleData = data.results;
         if (data.next && data.next != null) {
          this.getNextCategoriesList();
        }
        this.selectedCategories = '';
        this.selectedCategories = this.moduleData[0];
        this.totalPages = data.total_records;
        this.totalRecords = data.items_per_page;
        this.tableLoaded = true;
        this.dataLoading = false;
        this.getInfoList();
        setTimeout(() => {
          this.getActionList();
        }, 2000)
      },
      error: err => { },
      complete: () => {
        this.dataLoading = false;
      }
    });
  }
  getNextCategoriesList() {
    // /notification/api/notification/categories?limit=10&offset=10
    this.userService.get(`/notification/api/notification/categories?limit=10&offset=10`).subscribe({
      next: (data: any) => {
        this.moduleData = [... this.moduleData, ...data.results];
      },
      error: err => {}
    });
  }
  getInfoList(pageNo = 1) {
    this.dataLoading = true;
    this.userService.get(`/notification/api/notification/info-type`).subscribe({
      next: (data: any) => {
        this.infoList = data.results;
        this.totalPages = data.total_records;
        this.totalRecords = data.items_per_page;
        this.tableLoaded = true;
        this.dataLoading = false;
      },
      error: err => { },
      complete: () => {
        this.dataLoading = false;
      }
    });
  }
  getActionList(pageNo = 1) {
    this.loader.show();
    this.dataLoading = true;
    this.userService.get(`/notification/api/notification/user-prefrence?program_id=${this.programId}&module_id=${this.selectedCategories?.id}&user_id=${this.user_Id}&info_type=${this.infoList[0]?.id}`).subscribe({
      next: (data: any) => {
        // this.actionList = data.results[0].event_list;
        this.actionList = data.results[0].category_list;
        this.toggleJobs.value = data.results[0]?.category_list[0]?.category_status
        this.loader.hide();
        this.totalPages = data.total_records;
        this.totalRecords = data.items_per_page;
        this.tableLoaded = true;
        this.dataLoading = false;
      },
      error: err => {
        this.loader.hide();
      },
      complete: () => {
        this.dataLoading = false;
        this.loader.hide();
      }
    });
  }
}
