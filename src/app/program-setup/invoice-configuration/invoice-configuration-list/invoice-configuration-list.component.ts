import { Component, OnInit } from '@angular/core';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { InvoiceConfigurationService } from '../invoice-configuration.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-invoice-configuration-list',
  templateUrl: './invoice-configuration-list.component.html',
  styleUrls: ['./invoice-configuration-list.component.scss']
})
export class InvoiceConfigurationListComponent implements OnInit {

  public tableConfig: VMSConfig;
  public tableLoaded = false;
  public limitRecords = 10;
  public vmsData: any;
  public filter: any = {};
  public totalRecords: number = 10;
  public itemPerPage: number = 10;
  public Page = 1;

  public loading = false;
  public search: any;
  public user_type: any;
  public user: any;
  public searchTerm: string = '';

  constructor(
    private invoiceConfigurationService: InvoiceConfigurationService,
    private router: SvmsRouterService,
    private storageService: StorageService,
    private spinner: LoaderService
  ) { }

  ngOnInit(): void {
    this.tableConfig = {
      title: 'Invoice Configuration',
      isCreateButtonName: 'Create New Invoice',
      columnList: [
        { name: 'config_name', title: 'Invoice Configuration Name', width: 30, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'hierarchy_uuid', title: 'Hierarchy', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'invoice_start_date', title: 'Invoice Start Date', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      ],
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isCreate: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'Title', filterType: 'TEXT' },
        {
          name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
            { name: 'Active', value: true },
            { name: 'Inactive', value: false }
          ]
        }
      ]
    };
    this.user_type = this.storageService.get('user_type');
    this.user = this.storageService.get('user');
    this.getInvoiceConfigurationList();
  }

  createConfiguration(event) {
    this.router.navigate(['invoice', 'config']);
  }

  getInvoiceConfigurationList() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/invoice/programs/${currentprogram?.id}/config`;
    this.loading = true;
    this.spinner.show();
    this.invoiceConfigurationService.get(url)
      .pipe(
        debounceTime(400)
      ).subscribe({
        next: (data: any) => {
          this.loading = false;
          this.spinner.hide();
          if (data?.data?.config) {
            this.vmsData = data?.data?.config;
          }
          this.itemPerPage = data?.data?.per_page;
          this.totalRecords = data?.data?.total_records;
        },
        error: (err: Error) => {
          this.loading = false;
          this.vmsData = new Array();
          this.totalRecords = 0;
        }
      }
      );
  }

  onViewClick(event) {
    this.router.navigate(['invoice', 'config'], { queryParams: { id: event?.config_uuid, mode: 'view' } });
  }

}
