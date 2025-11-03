import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { TenureConfigurationService } from '../tenure-configuration.service';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { ColumnType, IColoumnDefinition, ITableHeaderConfig, ITableOptions } from 'src/app/library/svms-table/svms-table.model';

@Component({
  selector: 'app-tenure-limit-list',
  templateUrl: './tenure-limit-list.component.html',
  styleUrls: ['./tenure-limit-list.component.scss']
})
export class TenureLimitListComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  @ViewChild('optionalCol', { static: true }) optionalCol: TemplateRef<void>;
  @ViewChild('masterTypeStatus', { static: true }) masterTypeStatus: TemplateRef<void>;
  @ViewChild('moduleIcons', { static: true }) moduleIcons: TemplateRef<any>;

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
  public search: any;
  public searchTerm: string = '';
  public filter: any = {};
  public Page = 1;
  public loading = false;

  tableHeaderConfig: ITableHeaderConfig;
  svmstableColomnDefn: Array<IColoumnDefinition>;
  tableOptions: ITableOptions;

  onAddClickFilter = () => {
    alert('On Advanced Filter Click');
  };

  onCreateClick= () => {
    this.router.navigate(['self-configuration/tenure-limit/config'])
  };

  constructor(
    private router: Router,
    private storageService: StorageService,
    private spinner: LoaderService,
    private localDatePipe: LocalDateTimeFormatPipe,
    private tenureConfigurationService: TenureConfigurationService,
  ) { }

  initalizeTableConfigs = () => {
    this.tableHeaderConfig = {
      title: 'Tenure Configurations',
      searchAllowed: true,
      showAddBtn: true,
      onAdd: this.onCreateClick,
      advanceFilter: false,
      importData: false,
      exportData: false,
      columnSetting: false
    };

    this.svmstableColomnDefn = [
      { field: 'name', header: 'Name', primary: true, order: 1 },
      { field: 'is_enabled', header: 'Status', templateRef: this.masterTypeStatus, order: 2 },
      { field: 'modules', header: 'Module(s)', templateRef: this.moduleIcons, order: 3 },
      { field: 'hierarchy_levels', header: '# Hierarchy', order: 4 },
      { field: 'modified_on', header: 'Last Updated', order: 5, type: ColumnType.DATE },
    ];

    this.tableOptions = {
      headerConfig: this.tableHeaderConfig,
    };
  };

  tableConfig: VMSConfig = {
    title: 'Tenure Limits',
    columnList: [
      { name: 'name', title: 'Title', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      {
        name: 'is_enabled',
        title: 'Status',
        isIcon: false,
        isImage: false,
        isContact: false,
        isDetails: true,
        isVieworEdit: true,
        isDisableorDelete: true,
        isDelete: true,
        isNumberBadge: false,
      },
      {
        name: 'modules',
        title: 'Module(s)',
        isIcon: false,
        isIconList: true,
        isImage: false,
        isContact: false,
        isNumberBadge: false,
      },
      { name: 'hierarchy_levels',
        title: '# Hierarchies', 
        width: 15, 
        isIcon: false, 
        isImage: false, 
        isContact: false, 
        isNumberBadge: false 
      },
      {
        name: 'modified_on',
        title: 'Last Updated',
        isIcon: false,
        isImage: false,
        isContact: false,
        isDetails: true,
        isVieworEdit: true,
        isDisableorDelete: true,
        isDelete: true,
        isNumberBadge: false,
      },
    ],
    isExpand: true,
    hideHeaderExpand: true,
    isFilter: false,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: true,
    isReorder: true,
    density: 'COMFORTABLE',
  };

  ngOnInit(): void {
    this.initalizeTableConfigs();
    this.getTenureConfigurationList();
  }

  getTenureConfigurationList() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${currentprogram?.id}/tenures?`;
    url = url + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      url = url + '&k=' + this.search;
    }
    if (this.searchTerm) {
      url = url + '&name=' + this.searchTerm;
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      url = url + '&k=' + this.filter.is_enabled;
    }

    this.loading = true;
    this.spinner.show();
    this.tenureConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          this.loading = false;
          this.spinner.hide();
          if (data?.tenures) {
            this.vmsData = data?.tenures;
            this.vmsData?.forEach(element => {
              if (element?.created_by?.name) {
                const createdAtDate = this.localDatePipe.transform((element?.created_at), DATE_FORMAT.FORMATDMMY, null, null, false);
                let p = 'By '.concat(element?.created_by?.name, ' On ', createdAtDate);
                return element.created_by.updated_at = p;
              }

              element.modules = element.modules.map(m => m.code).join(',');
              element.hierarchy_levels = element?.hierarchy_levels?.map(m => m?.name).join(',');
              element.modified_on = this.localDatePipe.transform(element?.modified_on, '', '', '', true);
            });
          }
          this.totalRecords = data?.data?.pagination?.total_records;
        },
        error: (err: Error) => {
          this.loading = false;
          this.spinner.hide();
          this.vmsData = new Array();
          this.totalRecords = 0;
        }
      }
      );
  }

  onSearch(event) {
    this.searchTerm = event.target.value;
    this.getTenureConfigurationList();
  }
}
