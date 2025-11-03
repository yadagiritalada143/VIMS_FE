import { Component, OnInit, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Observable, Subject, Subscription, debounceTime, switchMap } from 'rxjs';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import {  FilterType, IActionLinks, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { Router } from '@angular/router';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-documents-favourites-list',
  templateUrl: './documents-favourites-list.component.html',
  styleUrls: [
    '../../../assets/sass/self-config/config-main.scss',
    '../../../assets/sass/self-config/config-main-2.scss',
    './documents-favourites-list.component.scss']
})
export class DocumentsFavouritesListComponent implements OnInit {
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  private subscriptions: Array<Subscription> = [];
  private masterSub: Subject<any> = new Subject<any>();
  private prevMasterConfig: any = {};

  libraryModal: boolean = false;
  msp: boolean = true;
  client: boolean = true;
  vendor: boolean = true;
  worker: boolean = true;
  mspList : any = [];
  clientList : any = [];
  vendorList : any = [];
  workerList : any = [];
  folderObj : any = {};

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
      }
    ];


    this.tableHeaderConfig = {
      title: '',
      searchAllowed: false,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    let actionLinks: Array <IActionLinks> = [
      { linkName: 'Download/View', method: this.onClickView, linkIcon: 'visibility'},
      { linkName: 'Remove From Favorite', method: this.onClickRemoveFromFavorite, linkIcon: 'visibility'},
    ];

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      itemsPerPage: this.itemPerPage,
      recordsPerPageSetting: [1,10, 25, 50, 100],
      onChangeItemRecords: this.onItemCountChanged
    };
    this.svmstableColomnDefn = [
      { field: 'folderFileMetadataDTO.name', header: 'Name', width: 5, order:1, primary:true , onClick:this.onClickView, sortable:false,secondaryIconUrl:"grade",secondaryIconField:"isFavorite"},
      { field: 'folderFileMetadataDTO.size', header: 'Size', width: 15, sortable:false, order:2 },
      { field: 'createdBy', header: 'Uploaded By', width: 15, sortable:false, order:3 },
      { field: 'folderFileMetadataDTO.modifiedOn', header: 'Modified on', width: 15, sortable:false, order:4 }
    ];


    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      pagination: true,
      totalRecords: this.totalRecords,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Favourites found.",
      actionLinks:actionLinks,
      enableColumnFilter: false,
      linksValidatorFn: this.clickThreeDot,
    };
  };

  constructor (
    private loader: LoaderService,
    private router: Router,
    private alert: AlertService,
    private storeServ: StorageService,
    private programService: ProgramService,
    public userService: UserService,
    private localDateFormat: LocalDateFormatPipe
  ) { }



  ngOnInit(): void {
    this.programId = this.storeServ.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.currentPath = this.router.url
    this.initalizeTableConfigs();
    this.getRoleList('')
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
              const favoritesConfig: Array<any> = this.vmsData?.favorites;
              favoritesConfig?.forEach((el: any) => {
                el.isFavorite = true
                el.folderFileMetadataDTO.modifiedOn = this.localDateFormat.transform(el?.folderFileMetadataDTO.modifiedOn, null, null, null, true,);
                el.folderFileMetadataDTO.size = el?.folderFileMetadataDTO?.size?.toString() ? el?.folderFileMetadataDTO?.size?.toString() : '0'
                if(el?.folderFileMetadataDTO?.folderFileSizeType) {
                  el.folderFileMetadataDTO.size += ' '+ el?.folderFileMetadataDTO.folderFileSizeType
                }
              });

              this.svmsData = favoritesConfig;
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
      if(this.filterpayLoad['modified_on']) {
        filter.searchModifiedOn = {
          "startDate" : this.localDateFormat.transform(new Date(this.filterpayLoad['modified_on'][0]), DATE_FORMAT.FORMATYMD ,null ,null , true,),
          "endDate" : this.localDateFormat.transform(this.filterpayLoad['modified_on'][1], DATE_FORMAT.FORMATYMD ,null ,null , true,)
        }
      }
      if(this.filterpayLoad['statusMessage']) {
        filter.status = this.filterpayLoad['statusMessage']
      }
    }
    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url: string = `/ref-library/programs/${this.programId}/favorite-listing?limit=${this.itemPerPage}`;
    page = page ? page : 1;
    if (page) {
      url += `&page=${page}`;
    }

    return this.programService.post(url, filter);
  }

  fetchSearchObservable(config: any): Observable<any> {
    const { page, term } = config;

    this.itemPerPage = this.itemPerPage ? this.itemPerPage : 10
    let url = `/ref-library/programs/${this.programId}/favorite-listing?limit=${this.itemPerPage}`;

    if (page) {
      url += `&page=${page}`;
    }

    if (term) {
      url += `&k=${term}`;
    }

    return this.programService.get(url);
  }

  clickThreeDot = (actionLinks: Array<IActionLinks>, rowData: any) => {
    if(rowData?.folderFileMetadataDTO?.type == 'FILE'){
      actionLinks[0].linkName = 'Download'
    }else if(rowData?.folderFileMetadataDTO?.type == 'FOLDER'){
      actionLinks[0].linkName = 'View'
    }
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
          this.vendorList = data.roles.filter(x => x.organization_category == 'VENDOR')
          this.clientList = data.roles.filter(x => x.organization_category == 'CLIENT')
          this.workerList = data.roles.filter(x => x.organization_category == 'CANDIDATE')
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

  showHideRole(toggleName) {
    if(toggleName == 'msp') {
      this.msp = !this.msp;
    } else if(toggleName == 'client') {
      this.client = !this.client;
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

  onClickRemoveFromFavorite =(evt: any) => {
    if (evt) {
      const { id } = evt;
      let url = `/ref-library/programs/${this.programId}/remove-favorite/${id}`
      this.programService.post(url,null).subscribe({
        next: (data: any) => {
          if(data?.traceId) {
            this.masterSub.next({});
            this.alert.success(evt.folderFileMetadataDTO.type + ' Removed from favorites successfully');
          }
        },
        error: err => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    }
  }

  onClickView =(evt: any) => {
    if (evt && evt?.folderFileMetadataDTO?.type == "FOLDER") {
      this.router.navigate(['my-library', 'document-list', evt?.folderFileMetadataDTO?.id]);
    } else if(evt && evt?.folderFileMetadataDTO?.type == "FILE") {
      let url = `/ref-library/programs/${this.programId}/storage-item/${evt?.folderFileMetadataDTO?.id}?type=${evt?.folderFileMetadataDTO?.type}`
      this.programService.get(url).subscribe({
        next: (data: any) => {
          if(data?.preSignedUrl) {
            const link = document.createElement('a');
            if (data?.preSignedUrl) {
              link.target = "_blank";
              link.href = data?.preSignedUrl;
              // link.target = "_blank";
            }
            else {
              this.alert.error('File Not Found.', {});
            }
            link.dispatchEvent(new MouseEvent('click'));
            this.alert.success(evt?.folderFileMetadataDTO?.type + ' Downloaded successfully')
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


}
