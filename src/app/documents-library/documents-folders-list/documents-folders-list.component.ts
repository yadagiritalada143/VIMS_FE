import { Component, OnInit, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Router } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-documents-folders-list',
  templateUrl: './documents-folders-list.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    './documents-folders-list.component.scss',
  ],
})
export class DocumentsFoldersListComponent implements OnInit {
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  libraryModal: boolean = false;
  msp: boolean = true;
  client: boolean = true;
  vendor: boolean = false;
  worker: boolean = false;
  mspList : any = [];
  clientList : any = [];
  folderObj : any = {};
  folderUploadedByOptions: any = [];

  folderId:any;
  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public currentPath: string = ''
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';
  public masterFlyoutVisibility: 'visible' | 'hidden' = 'hidden';

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  public programId: any;
  updatePermission: boolean = false;
  renameFolder: boolean = false;
  dataLoader: boolean = false;
  searchTerm: string = null;
  tablePaginationConfig: ITablePaginationConfig;
  tableFilterConfig: Array <IAdvanceFilterConfig>;

  initalizeTableConfigs = () => {
    this.tableFilterConfig = [
      {
        name: 'name',
        title: 'Search Name',
        placeholder: 'Search Name',
        type: FilterType.TEXT
      },
      {
        name: 'size',
        title: 'size',
        placeholder: 'Size',
        type: FilterType.TEXT,
        disabled:true
      },
      {
        name: 'createdBy',
        title: 'Uploaded By',
        placeholder: 'Search Uploaded By',
        type: FilterType.SELECT,
        options: this.folderUploadedByOptions
      },
      {
        name: 'modifiedOn',
        title: 'Last Updated',
        placeholder: 'Last Updated',
        type: FilterType.DATEPICKER
      },
      {
        name: 'whoCanAccess',
        title: 'Who can access',
        placeholder: 'Select',
        options : !this.authService.authorize('reference_library_manage') ? [] : [{name : 'MSP', value : 'MSP'}, {name : 'Client', value : 'Client'}, {name : 'Vendor', value : 'Vendor'}, {name : 'Worker', value : 'Worker'}],
        type: FilterType.MULTISELECT
      },
    ];


    this.tableHeaderConfig = {
      title: 'Folder',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('reference_library_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      onSearch: this.onSearch,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'View', method: this.onClickView, linkIcon: 'visibility' },
      { linkName: 'Add To Favorite/Remove From Favorite', method: this.onClickAddToFavorite, linkIcon: 'visibility' },
      { linkName: 'Rename Folder', method: this.onClickRenameFolder, linkIcon: 'visibility', hide: !this.authService.authorize('reference_library_manage') },
      { linkName: 'Update Permission', method: this.onClickUpdate, linkIcon: 'visibility', hide: !this.authService.authorize('reference_library_manage') },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('reference_library_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [1,10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };
    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 5, order:1, primary:true , sortable:true, onClick:this.onClickView,primaryIconUrl:"folder_open",secondaryIconUrl:"grade",primaryIconField:"primaryIconField",secondaryIconField:"isFavorite" },
      { field: 'size', header: 'Size', width: 15, sortable:true,  order:2 },
      { field: 'createdBy', header: 'Uploaded By', width: 15, sortable:true, order:3, onClick:this.onClickView },
      { field: 'modifiedOn', header: 'Modified on', width: 15, sortable:true, order:4 },
      { field: 'whoCanAccess', header: 'Who can access', width: 15, sortable:true, order:5,primaryIconUrl:"folder_open",primaryIconField:"primaryIconField" }
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Folder found",
      actionLinks:actionLinks,
      enableColumnFilter: true,
      linksValidatorFn: this.clickThreeDot,
    };
  };

  constructor (
    private route: SvmsRouterService,
    private loader: LoaderService,
    private accessControlService: AccessControlService,
    private router: Router,
    private alert: AlertService,
    private storeServ: StorageService,
    private programService: ProgramService,
    public userService: UserService,
    private localDateFormat: LocalDateFormatPipe,
    private authService: AuthorizationService
  ) { }

  onDeleteClick = (event) =>{
    if (event) {
         const { id } = event;
    if (id) {
      this.loader.show();
      this.programService.post(`/ref-library/programs/${this.programId}/delete/${id}?type=${event.type}`,null)
        .subscribe(
          {
            next: (message: any) => {
              if(message.deleteResponseMessage) {
                this.alert.success(event.type + " Deleted Successfully");
              }
              this.loader.hide();
              this.masterSub.next({});
            }, error: (err: any) => {
              this.loader.hide();
              this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
            }
          });
    }
    }
  }

  ngOnInit(): void {
    this.programId = this.storeServ.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.currentPath = this.router.url
    this.getRoleList('')
    this.uploadedBySearchOption()
    this.initalizeTableConfigs();
    this.subscriptions.push(
      this.masterSub
        .pipe(
          debounceTime(600),
          switchMap((config: any) => {
            this.loader.show();
            this.prevMasterConfig = config;

            if (this.isAdvanceSearch) {
              // Search for table: false
              return this.fetchAdvanceSearchObservable(config);
            }

            // Search for table: true
            return this.fetchSearchObservable(config);
          }),
        )
        .subscribe(
          (data: any) => {
            if (data) {
              this.vmsData = data;
              const folderConfig: Array<any> = this.vmsData?.filesAndFolders;
              folderConfig?.forEach((el: any) => {
                el.primaryIconField = true;
                el.modifiedOn = this.localDateFormat.transform(el?.modifiedOn, null, null, null, true,);
                el.organizationTypes = el?.organizationTypes.filter(x=>x.enabled)
                el.whoCanAccess = !this.authService.authorize('reference_library_manage') ? "-" : el?.organizationTypes?.map(x => x.name)?.join(', ')
                el.size = el?.size?.toString() ? el?.size?.toString() : '0'
                if(el?.folderFileSizeType) {
                  el.size += ' '+ el?.folderFileSizeType
                }
              });

              this.svmsData = folderConfig;
              this.tableOptions.paginationConfig.itemsPerPage = data?.itemsPerPage;
              this.itemPerPage = data?.itemsPerPage;
              this.totalRecords = data?.totalRecords;
              this.tableOptions.totalRecords = this.totalRecords;

              this.loader.hide();
              if (this.vmsTable && this.prevMasterConfig) {
                this.vmsTable.currentPage = this.prevMasterConfig?.page || 1;
              }
            }
          },
          err => {
            this.loader.hide();
            this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
            console.error(err);
          },
        ),
    );
    this.masterSub.next({ page: 1, term: '' });
  }

  fetchAdvanceSearchObservable({ page }): Observable<any> {
    let filter: any = {};
    if (this.filterpayLoad) {
      if(this.filterpayLoad['name']) {
        filter.name = this.filterpayLoad['name']
      }
      if(this.filterpayLoad['size']) {
        filter.size = this.filterpayLoad['size']
      }
      if(this.filterpayLoad['createdBy']) {
        filter.modifiedBy = this.filterpayLoad['createdBy']
      }
      if(this.filterpayLoad['whoCanAccess']) {
        filter.organizationTypes = this.filterpayLoad['whoCanAccess'].map(item => ({ name: item }))
      }
      if(this.filterpayLoad['modifiedOn']) {
        filter.searchModifiedOn = {
          "startDate" : this.localDateFormat.transform(new Date(this.filterpayLoad['modifiedOn'][0]), DATE_FORMAT.FORMATYMD ,null ,null , true,),
          "endDate" : this.localDateFormat.transform(this.filterpayLoad['modifiedOn'][1], DATE_FORMAT.FORMATYMD ,null ,null , true,)
        }
      }
    }
    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url: string = `/ref-library/programs/${this.programId}/listing/search?type=FOLDER&limit=${this.itemPerPage}`;
    page = page ? page : 1;
    if (page) {
      url += `&page=${page}`;
    }

    return this.programService.post(url, filter);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;

    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url = `/ref-library/programs/${this.programId}/storage-item/listing?limit=${this.itemPerPage}&type=FOLDER`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData?.isFavorite){
      actionLinks[1].linkName = 'Remove From Favorite'
    }else {
      actionLinks[1].linkName = 'Add To Favorite'
    }
  }

  uploadedBySearchOption() {
    this.programService.get(`/ref-library/programs/${this.programId}/search-options?type=FOLDER`).subscribe({
      next: (data: any) => {
        this.folderUploadedByOptions = data.map(x => {return {name : x.createdByName, value: x.createdById}})
        this.tableFilterConfig.filter(config => config.name == 'createdBy')[0].options = this.folderUploadedByOptions
      },
      error: err => {
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  getRoleList = (searchTerm, pageNo?, limit?) => {
    searchTerm = searchTerm ? searchTerm : '';
    limit = limit ? limit : 100
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/roles?limit=${limit}`).subscribe({
      next: (data: any) => {
        if(data.total_records > limit) {
          this.getRoleList('',1,data.total_records)
        } else {
          this.mspList = data.roles.filter(x => x.organization_category == 'MSP')
          this.clientList = data.roles.filter(x => x.organization_category == 'CLIENT')

        }
        this.loader.hide();
      },
      error: err => {
        this.loader.hide();
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  openLibraryModal() {
    this.libraryModal = true;
  }

  onCloseModal() {
    this.folderObj = {}
    this.folderId = null
    this.libraryModal = false;
    this.renameFolder = false;
    this.updatePermission = false;
    this.msp = true;
    this.client = true;
    this.vendor = false;
    this.worker = false;
  }

  showHideRole(toggleName) {
    if(toggleName == 'msp') {
      this.msp = !this.msp;
      this.folderObj.msp = []
    } else if(toggleName == 'client') {
      this.client = !this.client;
      this.folderObj.client = []
    } else if(toggleName == 'vendor') {
      this.vendor = !this.vendor;
    } else if(toggleName == 'worker') {
      this.worker = !this.worker;
    }
  }

  onListFilter = (event: any) => {
    if (event) {
      this.isAdvanceSearch = true;
      this.filterpayLoad = event;
      this.masterSub.next(event);
    } else {
      this.isAdvanceSearch = false;
      this.masterSub.next({ page: 1, term: '' });
    }
  }

  onCreateClick =(create: any) => {
    if (create) {
      this.updatePermission = false
      this.openLibraryModal();
    }
  }

  onClickView =(evt: any) => {
    if (evt) {
      const { id } = evt;
      this.route.navigate(['my-library', 'document-list', id]);
    }
  }

  onClickRenameFolder =(evt: any) => {
    if (evt) {
      this.updatePermission = false
      this.folderId = evt.id
      this.renameFolder = true
      let url = `/ref-library/programs/${this.programId}/storage-item/${evt.id}?type=${evt.type}`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          this.folderObj.name = data?.name
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
      this.openLibraryModal();
    }
  }

  onClickUpdate =(evt: any) => {
    if (evt) {
      this.updatePermission = true
      this.folderId = evt.id
      let url = `/ref-library/programs/${this.programId}/storage-item/${evt.id}?type=${evt.type}`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          this.msp = data.organizationTypes.filter(x => x.name == 'MSP')[0].enabled
          this.client = data.organizationTypes?.filter(x => x.name == 'Client')[0]?.enabled
          this.vendor = data.organizationTypes?.filter(x => x.name == 'Vendor')[0]?.enabled
          this.worker = data.organizationTypes?.filter(x => x.name == 'Worker')[0]?.enabled
          if(this.msp) {
            this.folderObj.msp = data.organizationTypes?.filter(x => x.name == 'MSP')[0]?.organizationTypeRoles.map(x => x.roleId)
          }
          if(this.client) {
            this.folderObj.client = data.organizationTypes?.filter(x => x.name == 'Client')[0]?.organizationTypeRoles.map(x => x.roleId)
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
      this.openLibraryModal();
    }
  }

  onClickAddToFavorite =(evt: any) => {
    if (evt && !evt?.isFavorite) {
      const { id } = evt;
      let url = `/ref-library/programs/${this.programId}/add/favorite/storage-item-id/${id}?type=${evt.type}`
      this.programService.post(url,null).subscribe({
        next: (data: any) => {
          if(data?.createdOn && data?.folderFileMetadataDTO) {
            this.svmsData.filter(x=>x.id == id)[0].isFavorite = true
            this.svmsData.filter(x=>x.id == id)[0].favoriteId = data?.id
            this.alert.success(evt.type + ' Added to favorite successfully')
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    } else if(evt && evt?.isFavorite) {
      const { id } = evt;
      let url = `/ref-library/programs/${this.programId}/remove-favorite/${evt?.favoriteId}`
      this.programService.post(url,null).subscribe({
        next: (data: any) => {
          if(data?.deleteResponseMessage) {
            this.svmsData.filter(x=>x.id == id)[0].isFavorite = false
            this.svmsData.filter(x=>x.id == id)[0].favoriteId = null
            this.alert.success(evt.type + ' Removed from favorite successfully')
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    }
  }

  onItemCountChanged = (count: number) => {
    this.itemPerPage = count;
    this.tablePaginationConfig.itemsPerPage = count;
    this.masterSub.next({ ...this.prevMasterConfig, page: 1 });
  }

  onPaginationClick = (page: number) => {
    this.masterSub.next({ ...this.prevMasterConfig, page: page });
  }

  onSearch = (term: string) => {
    this.masterSub.next({ term, page: 1 });
  }

  clickRenameFolder() {
    let url = `/ref-library/programs/${this.programId}/rename/${this.folderId}?type=FOLDER&level=1&rename=${this.folderObj.name}`
    this.programService.post(url,{}).subscribe({
      next: (data: any) => {
        if(data?.id) {
          this.alert.success('Folder Renamed successfully')
          this.onCloseModal();
          this.masterSub.next({ page: 1, term: '' });
        }
      },
      error: err => {
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  createFolder() {
    let organizationSelectedMSPRoles = this.folderObj?.msp?.map(x => {return { roleId : x }})
    let organizationSelectedClientRoles = this.folderObj?.client?.map(x => {return { roleId : x }})

    if(!this.updatePermission) {
      let payload = {
        name : this.folderObj.name,
        parentId:null,
        organizationTypes : [
          {
            name: "MSP",
            enabled: this.msp ? this.msp : false,
            organizationTypeRoles: organizationSelectedMSPRoles?.length > 0 ? organizationSelectedMSPRoles : []
          },
          {
            name: "Client",
            enabled: this.client ? this.client : false,
            organizationTypeRoles: organizationSelectedClientRoles?.length > 0 ? organizationSelectedClientRoles : []
          },
          {
            name: "Vendor",
            enabled: this.vendor ? this.vendor : false
          },
          {
            name: "Worker",
            enabled: this.worker ? this.worker : false
          }
        ]
      }

      payload.organizationTypes.forEach(org => {
        if(!org.organizationTypeRoles?.length) {
          delete org.organizationTypeRoles
        }
      })

      let url = `/ref-library/programs/${this.programId}/save/storage-item?type=FOLDER`
      this.programService.post(url,payload).subscribe({
        next: (data: any) => {
          if(data?.id) {
            this.alert.success('Folder created successfully')
            this.onCloseModal();
            this.masterSub.next({ page: 1, term: '' });
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    } else {
      let updatePayload = {organizationTypes : [
        {
          name: "MSP",
          enabled: this.msp ? this.msp : false,
          programId: this.programId,
          organizationTypeRoles: organizationSelectedMSPRoles?.length > 0 ? organizationSelectedMSPRoles : []
        },
        {
          name: "Client",
          enabled: this.client ? this.client : false,
          programId: this.programId,
          organizationTypeRoles: organizationSelectedClientRoles?.length > 0 ? organizationSelectedClientRoles : []
        },
        {
          name: "Vendor",
          enabled: this.vendor ? this.vendor : false,
          programId: this.programId
        },
        {
          name: "Worker",
          enabled: this.worker ? this.worker : false,
          programId: this.programId
        }
      ]}

      updatePayload?.organizationTypes?.forEach(org => {
        if(!org.organizationTypeRoles?.length) {
          delete org.organizationTypeRoles
        }
      })

      let url = `/ref-library/programs/${this.programId}/folder/${this.folderId}/update-permissions?type=FOLDER`
      this.programService.put(url,updatePayload).subscribe({
        next: (data: any) => {
          if(data?.id) {
            this.alert.success('Folder permissions updated successfully')
            this.onCloseModal();
            this.masterSub.next({ page: 1, term: '' });
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    }
  }

}
