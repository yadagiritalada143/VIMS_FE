import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { ColumnType, FilterType, IAdvanceFilterConfig, IColoumnDefinition, ITableHeaderConfig, ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { SvmsTableComponent } from 'src/app/library/svms-table/svms-table.component';
import { AuthorizationService } from 'src/app/core/services/authorize.service';


@Component({
  selector: 'app-vendor-compliance-list',
  templateUrl: './vendor-compliance-list.component.html',
  styleUrls: ['./vendor-compliance-list.component.scss']
})
export class VendorComplianceListComponent implements OnInit {

  vmsData = []
  tableOptions: ITableOptions;
  tableFilterConfig: Array<IAdvanceFilterConfig>;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tablePaginationConfig: ITablePaginationConfig;
  tableHeaderConfig: ITableHeaderConfig;
  private subscriptions: Array<Subscription> = [];
  private searchCompliance: Subject<any> = new Subject<any>();
  @ViewChild(SvmsTableComponent) vmsTable: SvmsTableComponent;
  public filter: any = {};
  public searchTerm: any;
  itemPerPage = 10;
  currentPage = 1;
  totalRecords = 0;
  filterLocationIds: any[] = [];
  filterStatus: any[] = [];
  documentList: any[] = [];
  public input$ = new Subject<string | null>();
  initalizeTableConfigs = () => {

    this.tableFilterConfig = [
      {
        name: 'work_location_ids',
        title: 'Work Location',
        placeholder: 'Work Location',
        type: FilterType.MULTISELECT, options: []
      },
      {
        name: 'compliant_status',
        title: 'Compliant Status',
        placeholder: 'Compliance Status',
        type: FilterType.MULTISELECT, options: [
          {  value: 'PENDING', name: 'PENDING'  },
          {  value: 'COMPLIANT', name: 'COMPLIANT'  },
          {  value: 'NON-COMPLIANT', name: 'NON-COMPLIANT'  },
          {  value: 'NOT-APPLICABLE', name: 'NOT-APPLICABLE'  }
        ] 
      }
    ]

    this.tableHeaderConfig = {
      title: 'Compliance',
      createButtonTitle: 'Create',
      searchAllowed: true,
      showAddBtn: this.authService.authorize('vendor_compliance_manage'),
      onAdd: this.onCreateClick,
      onSearch: this.onSearch,
      advanceFilter: true,
      importData: false,
      exportData: false,
      columnSetting: false,
      advanceFilterConfig: this.tableFilterConfig,
      onAdvanceFilter: this.onListFilter
    };

    this.tablePaginationConfig = {
      onPagination: this.onPaginationClick,
      onChangeItemRecords: this.onChangeRecords,
      itemsPerPage: 10,
      recordsPerPageSetting: [10, 25, 50, 100]
    }

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Document', width: 20, primary: true, order: 1,sortable:false,onClick:this.onClickView },
      { field: 'work_locations', header: 'Location', width: 20, order: 2,sortable:false,onClick:this.onClickView },
      { field: 'frequency', header: 'Frequency', width: 20, order: 3,sortable:false,onClick:this.onClickView },
      { field: 'uploaded_document.modified_on', header: 'Last Updated', width: 15, type: ColumnType.DATE,  order: 4,sortable:false,onClick:this.onClickView },
      { field: 'uploaded_document.expiry_on', header: 'Expiration Date', width: 15, type: ColumnType.DATE,  order: 5,sortable:false,onClick:this.onClickView },
      { field: 'uploaded_document.next_expiry_on', header: 'Next update due', width: 15, type: ColumnType.DATE, order: 6,sortable:false,onClick:this.onClickView },
      { field: 'status', header: 'Compliance status', width: 20, order: 7,sortable:false,onClick:this.onClickView },
      { field: 'uploaded_document.complied_by.first_name', header: 'Compliance verified', width: 20, order: 8,sortable:false,onClick:this.onClickView },

    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
      totalRecords: this.totalRecords,
      pagination: true,
      paginationConfig: this.tablePaginationConfig,
      noDataMessage: "No Records Found",
      // actionLinks: actionLinks
    };
  };
  tableConfig: VMSConfig = {
    title: 'Program Compliance',
    columnList: [
    ],
    sortOptions: [
      { title: 'Last Updated', key: 'update' }
    ],
    tabsList: [],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSort: false,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Create new',
    density: 'COMFORTABLE',
    tableWidth: '100%',
    permission: 'upload_compliance_doc'
  };

  uploadedStatus = true;
  orgId: any;
  programId: any;
  program: any;
  userType: any;
  hasUploadStatus = false;
  complianceGroupId;
  searchString;

  constructor(
    private alertService: AlertService, 
    private loader: LoaderService, 
    public storageService: StorageService, 
    private programService: ProgramService, 
    private route: ActivatedRoute, 
    private eventStream: EventStreamService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.userType = this.storageService.get('user_type');
    this.route.queryParamMap.subscribe(res => {
      this.programId = this.route.snapshot.params['progId'];
      this.orgId = this.route.snapshot.params['orgId'];
      const queryParamMap: any = this.route.snapshot['queryParams'];
      this.hasUploadStatus = queryParamMap.hasOwnProperty('is_uploaded');
      this.uploadedStatus = queryParamMap['is_uploaded'] === 'true';
      this.tableConfig.isCreate = this.userType !== 'VENDOR';
      this.tableConfig = { ...this.tableConfig };
      this.initalizeTableConfigs();
      this.loadVendorDetail();
      this.loadProgramDetail();
    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_VENDOR)
        .subscribe((data: any) => {
          if (!data) {
            this.loadVendorDetail();
      this.loadProgramDetail();
          }
        }
        )
    );

    this.searchCompliance
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.loadVendorDetail();
      this.loadProgramDetail();
      })
     
      this.getLocation();
    })

  }

  onClose() {
    this.loadComplianceDocs();
  }

  onOptionClicked(event) {
    if (event.name === 'name') {
      this.eventStream.emit(new EmitEvent(Events.SHOW_COMPLIANCE, event.vmsData));
    }
  }

  loadProgramDetail() {
    this.programService.get(`/configurator/programs/${this.programId}`)
      .subscribe((res: any) => {
        const { program } = res;
        this.program = program;
        if (this.userType === 'VENDOR') {
          this.tableConfig.title = program?.name + ' Compliance Documents';
          this.tableHeaderConfig.title = program?.name?.vendor?.name + ' Compliance Documents';

        }
        this.tableConfig = { ...this.tableConfig };

      })
  }

  loadVendorDetail() {
    let url = `/configurator/programs/${this.programId}/vendors/${this.orgId}`;
    this.programService.get(url)
      .subscribe((res: any) => {
        const { program_vendor } = res;
        if (this.userType !== 'VENDOR') {
          this.tableConfig.title = program_vendor?.vendor?.name + ' Compliance Documents';
          this.tableHeaderConfig.title =program_vendor?.vendor?.name + ' Compliance Documents';
        }
        this.complianceGroupId = program_vendor?.compliance_document_group?.id;
        this.loadComplianceDocs(1,this.searchTerm);
      })
  }

  loadComplianceDocs= (pageNo = 1, name?: string) => {
    if (!this.complianceGroupId) {
      this.vmsData = [];
      return;
    }
    this.loader.show();
    let url = `/configurator/programs/${this.programId}/vendor-compliance/required-documents?vendor_id=${this.orgId}` +
      `&limit=${this.itemPerPage}&page=${pageNo}&added_to_group=true&required_document_group_id=${this.complianceGroupId}`;
      if (name) {
        url += `&name=${name}`;
      }
    if (this.hasUploadStatus) {
      url += `&is_uploaded=${this.uploadedStatus}`;
    }

    if (this.filterLocationIds && this.filterLocationIds.length > 0) {
      url += `&work_location_ids=${this.filterLocationIds.join(',')}`;
    }

    if (this.filterStatus && this.filterStatus.length > 0) {
      url += `&compliant_status=${this.filterStatus.join(',')}`;
    }

    if (this.searchString) {
      url += `&k=${this.searchString}`;
    }

    if (this.sortByModified) {
      url += `&ordering=-modified_on`;
    } else {
      url += `&ordering=modified_on`;
    }

    this.programService.get(url)
      .subscribe({
        next: (data: any) => {
          let { required_documents, items_per_page, total_records } = data;
          required_documents = required_documents.map(doc => {
            doc.status = doc?.uploaded_document ? doc?.uploaded_document?.status : 'PENDING';
            doc.work_locations = (doc.work_locations && doc.work_locations.length > 0) ? doc.work_locations.map(wLoc => wLoc.name).join(',') : null
            return doc;
          });


          required_documents.forEach(doc => {
            if (doc?.uploaded_document?.complied_by?.first_name) {
              doc.uploaded_document.complied_by.first_name = doc?.uploaded_document?.complied_by?.first_name + ' ' + (doc?.uploaded_document?.complied_by?.last_name ? doc?.uploaded_document?.complied_by?.last_name : '')
            }
          });
          this.totalRecords = total_records;
          this.itemPerPage = items_per_page;
          this.vmsData = required_documents;
          this.totalRecords = data.total_records;
          this.itemPerPage = data?.items_per_page;
          this.tableOptions.paginationConfig.itemsPerPage = data?.items_per_page;
          this.tableOptions.totalRecords = data.total_records;
          this.loader.hide();
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
          this.loader.hide();
        }
      }
    );
  }

  onUpdateClicked(event) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_COMPLIANCE, event))
  }

  onCreateClick = (e: any) => {
    this.eventStream.emit(new EmitEvent(Events.UPLOAD_NEW_COMPLIANCE));
  }
  onClickView(event) {

  }

  onListFilter = (event: any) => {
    this.currentPage = 1;
    this.filterLocationIds = (event && event.hasOwnProperty('work_location_ids')) ? event['work_location_ids'] : [];
    this.filterStatus = (event && event.hasOwnProperty('compliant_status')) ? event['compliant_status'] : [];
    this.loadComplianceDocs();
  }

  // onSearch(event) {
  //   this.searchString = event;
  //   this.currentPage = 1;
  //   this.loadComplianceDocs();
  // }
  onSearch = (term: string) => {
    this.vmsTable.currentPage = 1;
    this.searchCompliance.next(term);
  }

  sortByModified = false;
  onSortClick(event) {
    this.sortByModified = event.name == 'update';
    this.loadComplianceDocs();
  }

  onPaginationClick= (event: any) => {
    this.currentPage = event;
    this.loadComplianceDocs();
  }
  // onPaginationClick = (event: any) => {
  //   if(!(JSON.stringify(this.filter) === JSON.stringify({}))){
  //     // this.onFilter(event); // not understand
  //   }
  //   else if(this.searchTerm)
  //     this.loadComplianceDocs(event,this.searchTerm);
  //   else
  //     this.loadComplianceDocs(event);

  // }

  getLocation = (term = '') => {
    let url = `/configurator/programs/${this.programId}/work-locations`;
    if (term) {
      url += `?k=${term}`;
    }
    this.programService.get(url)
      .pipe(
        map((res: any) => {
          return res?.work_locations?.map((location: any) => {
            return { value: location?.id, name: location?.name };
          })
        })
      )
      .subscribe((res: any) => { 
        this.tableOptions.headerConfig.advanceFilterConfig[0].options = res; 
      }
    )
  }
  onChangeRecords = (records: any) => {
    this.itemPerPage = records;
    if(!(JSON.stringify(this.filter) === JSON.stringify({}))){
      // this.onFilter();
    }
    else if(this.searchTerm)
      this.loadComplianceDocs(1,this.searchTerm);
    else
      this.loadComplianceDocs();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
  
  
}
