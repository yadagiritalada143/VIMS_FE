import { Component, OnInit, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ActivatedRoute } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-documents-files-list',
  templateUrl: './documents-files-list.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    './documents-files-list.component.scss'
  ]
})
export class DocumentsFilesListComponent implements OnInit {
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  @ViewChild('uploadFileInput') uploadFileInput: any;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  fileId:any;
  folderId:any;
  folderName:any;
  accessPermissionName:any;
  public formData = new FormData()
  libraryModal: boolean = false;
  fileObj : any = {};
  UploadButtonText : string = 'Upload File'
  renameFile : any = false
  fileUploadedByOptions : any = [];

  public vmsData: any;
  public itemPerPage = 10;
  public totalRecords = 0;
  public expand: boolean = true;
  public description: string = '';
  public svmsData: Array<any>;
  public filterpayLoad: any;
  public isAdvanceSearch: boolean = false;
  public reorderFlyoutVisibility: string = 'hidden';
  public masterFlyoutVisibility: 'visible' | 'hidden' = 'hidden';
  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  public programId: any;


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
        type: FilterType.TEXT
      },
      {
        name: 'createdBy',
        title: 'Uploaded By',
        placeholder: 'Search Uploaded By',
        type: FilterType.SELECT,
        options: this.fileUploadedByOptions
      },
      {
        name: 'modifiedOn',
        title: 'Last Updated',
        placeholder: 'Last Updated',
        type: FilterType.DATEPICKER
      },
    ];


    this.tableHeaderConfig = {
      title: '',
      subTitle: '',
      customTitleForNoDataListing: 'File',
      searchAllowed: true,
      createButtonTitle: 'Upload',
      showAddBtn: this.authService.authorize('reference_library_manage'),
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      onSearch: this.onSearch,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter,
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Download', method: this.onClickDownload, linkIcon: 'visibility' },
      { linkName: 'Rename File', method: this.onClickRenameFile, linkIcon: 'visibility', disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('reference_library_manage') },
      { linkName: 'Add To Favorite/Remove From Favorite', method: this.onClickAddToFavorite, linkIcon: 'visibility' },
      { linkName: 'Delete', method: this.onDeleteClick, disable: !this.accessControlService.accessControl(), hide: !this.authService.authorize('reference_library_manage') }
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [1,10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };
    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', width: 5, order:1, primary:true , sortable:true, onClick:this.onClickDownload, primaryIconUrl:"description",primaryIconField:"primaryIconField",secondaryIconUrl:"grade",secondaryIconField:"isFavorite"},
      { field: 'size', header: 'Size', width: 15, sortable:true,  order:2 },
      { field: 'createdBy', header: 'Uploaded By', width: 15, sortable:true, order:3 },
      { field: 'modifiedOn', header: 'Modified on', width: 15, sortable:true, order:4 }
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Files found for the selected program.",
      actionLinks:actionLinks,
      enableColumnFilter: true,
      linksValidatorFn: this.clickThreeDot
    };
  };
  uploadedFileName: any;
  uploadedFileExt: any;
  fileSize: number;
  mbKbFileSize: any;

  constructor (
    private loader: LoaderService,
    private accessControlService: AccessControlService,
    private activatedRoute: ActivatedRoute,
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
    this.initalizeTableConfigs();
    this.activatedRoute.params.subscribe(params => {
      this.folderId = params['id'];
    });
    this.uploadedBySearchOption();
    this.getFolderDetail()
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
                el.whoCanAccess = el.organizationTypes.map(x => x.name).join(', ');
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
      filter = {};
      if(this.filterpayLoad['name']) {
        filter.name = this.filterpayLoad['name']
      }
      if(this.filterpayLoad['size']) {
        filter.size = this.filterpayLoad['size']
      }
      if(this.filterpayLoad['createdBy']) {
        filter.modifiedBy = this.filterpayLoad['createdBy']
      }
      if(this.filterpayLoad['modifiedOn']) {
        filter.searchModifiedOn = {
          "startDate" : this.localDateFormat.transform(new Date(this.filterpayLoad['modifiedOn'][0]), DATE_FORMAT.FORMATYMD ,null ,null , true,),
          "endDate" : this.localDateFormat.transform(this.filterpayLoad['modifiedOn'][1], DATE_FORMAT.FORMATYMD ,null ,null , true,)
        }
      }
    }
    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url: string = `/ref-library/programs/${this.programId}/listing/search?limit=${this.itemPerPage}&rootId=${this.folderId}&type=FILE`;
    page = page ? page : 1;
    if (page) {
      url += `&page=${page}`;
    }

    return this.programService.post(url, filter);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;

    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url = `/ref-library/programs/${this.programId}/storage-item/listing?limit=${this.itemPerPage}&type=FILE&root=${this.folderId}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  getFolderDetail() {
    if (this.folderId) {
      let url = `/ref-library/programs/${this.programId}/storage-item/${this.folderId}?type=FOLDER`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          this.folderName = data?.name
          this.accessPermissionName = data?.organizationTypes?.filter(x => x.enabled)?.map(org => org.name).join(", ")
          this.tableHeaderConfig.title = this.folderName
          this.tableHeaderConfig.subTitle = this.accessPermissionName
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    }
  }

  uploadedBySearchOption() {
    this.programService.get(`/ref-library/programs/${this.programId}/search-options?type=FILE&rootId=${this.folderId}`).subscribe({
      next: (data: any) => {
        this.fileUploadedByOptions = data.map(x => {return {name : x.createdByName, value: x.createdById}})
        this.tableFilterConfig.filter(config => config.name == 'createdBy')[0].options = this.fileUploadedByOptions
      },
      error: err => {
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData?.isFavorite){
      actionLinks[2].linkName = 'Remove From Favorite'
    }else {
      actionLinks[2].linkName = 'Add To Favorite'
    }
  }

  clickRenameFile() {
    let url = `/ref-library/programs/${this.programId}/rename/${this.fileId}?type=FILE&level=2&rename=${this.fileObj.fileName}`
    this.programService.post(url,{}).subscribe({
      next: (data: any) => {
        if(data?.id) {
          this.alert.success('File Renamed successfully')
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

  uploadDocument(event) {

    this.fileSize = Number((event.target?.files[0].size / (1024 * 1024)).toFixed(2))
    this.mbKbFileSize = this.fileSize < 1000000 ? 'KB' : 'MB'
    if(this.fileSize <= 10){
      this.uploadedFileName = event.target?.files[0].name
      this.uploadedFileExt = this.uploadedFileName.split('.').pop()
      this.formData.append('file', event.target?.files[0])
    }

  }

  onClickRenameFile =(evt: any) => {
    if (evt) {
      this.fileId = evt.id
      this.renameFile = true
      let url = `/ref-library/programs/${this.programId}/storage-item/${evt.id}?type=${evt.type}`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          this.fileObj.fileName = data?.name
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
      this.openLibraryModal();
    }
  }

  openLibraryModal() {
    this.libraryModal = true;
  }

  onCloseModal() {
    this.fileObj = {}
    this.uploadedFileName = "";
    this.formData = new FormData()
    this.libraryModal = false;
    this.renameFile = false;
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
      this.openLibraryModal();
    }
  }

  onClickDownload =(evt: any) => {
    if (evt) {
      let url = `/ref-library/programs/${this.programId}/storage-item/${evt.id}?type=${evt.type}`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          if(data?.preSignedUrl) {
            const link = document.createElement('a');
            if (data?.preSignedUrl) {
              link.target = "_blank";
              link.href = data?.preSignedUrl;
            }
            else {
              this.alert.error('File Not Found.', {});
            }
            link.dispatchEvent(new MouseEvent('click'));
            this.alert.success(evt.type + ' Downloaded successfully')
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
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
    } else if (evt && evt?.isFavorite) {
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

  createFile() {
    if(!this.formData.get('file')) {
      this.alert.error('Please select any file.')
      return true;
    }
    this.formData.append('fileName', this.fileObj.fileName)
    this.programService.post(`/ref-library/programs/${this.programId}/folder/${this.folderId}/upload/storage-item`,this.formData).subscribe({
      next: (fileData: any) => {
        if(fileData && fileData?.folderFileMetadataDTO) {
          this.alert.success('File has been uploaded successfully');
          this.uploadFileInput.nativeElement.value = ''
          this.onCloseModal();
          this.masterSub.next({ page: 1, term: '' });
          this.UploadButtonText = 'Upload File'
        }
      },
      error: (err: any) => {
        this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        this.UploadButtonText = 'Upload File'
      }
    })
  }
}
