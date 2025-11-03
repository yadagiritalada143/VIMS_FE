import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { TimesheetConfigurationService } from '../timesheet-configuration.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { map, debounceTime } from 'rxjs/operators';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-timesheet-configuration-list',
  templateUrl: './timesheet-configuration-list.component.html',
  styleUrls: ['./timesheet-configuration-list.component.scss']
})
export class TimesheetConfigurationListComponent implements OnInit {

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
    public timesheetConfigurationService: TimesheetConfigurationService,
    private alertService: AlertService,
    private router: SvmsRouterService,
    private storageService: StorageService,
    private accessControlService: AccessControlService,
    private localDatePipe: LocalDateFormatPipe,
    private dialog: ConfirmationDialogService,
    private spinner: LoaderService
  ) { }

  ngOnInit(): void {
    this.tableConfig = {
      title: 'Timesheet Configuration List',
      isCreateButtonName: 'Add New Timesheet',
      columnList: [
        { name: 'title', title: 'Timesheet Configuration Name', width: 30, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'version', title: 'Version', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'created_by.updated_at', title: 'Updated By', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'is_active', title: 'Status', width: 16, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isNumberBadge: false, isVieworClone: this.accessControlService.accessControl() }
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
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
    this.getTimesheetConfigurationList();
  }

  onCreate(event) {
    this.router.navigate(['timesheet', 'config']);
  }

  getTimesheetConfigurationList() {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic?`;
    url = url + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      url = url + '&k=' + this.search;
    }
    if (this.filter.searchTerm) {
      url = url + '&name=' + this.filter.searchTerm;
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      url = url + '&k=' + this.filter.is_enabled;
    }

    this.loading = true;
    this.spinner.show();
    this.timesheetConfigurationService.get(url)
      .pipe(
        debounceTime(400),
        map((res: any) => {

          let res_list = res?.data?.config;
          if (res_list) {
            res_list = res_list.filter((obj: any) => {
              let search_param: number = String(obj?.title)?.toLowerCase()?.search(this.searchTerm?.toLowerCase());
              return (search_param !== -1);
            });
          }

          res.data.config = res_list;
          return res;
        })
      ).subscribe({
        next: (data: any) => {
          this.loading = false;
          this.spinner.hide();
          if (data?.data?.config) {
            this.vmsData = data?.data?.config;
            this.vmsData?.forEach(element => {
              if(element?.hierarchies) {
                let name = element?.hierarchies.map(n => n.name).toString();
                if(!element.hierarchy) {
                  element.hierarchy = {};
                  element.hierarchy['id'] = element?.hierarchies.map(n => n.id).toString();
                  element.hierarchy['name'] = name
        
                }else {
                element.hierarchy.name =name;
                }
              }
              if (element?.created_by?.name) {
                const createdAtDate = this.localDatePipe.transform(element?.created_at);
                let p = 'By '.concat(element?.created_by?.name, ' On ', createdAtDate);
                return element.created_by.updated_at = p;
              }
            });
          }
          this.itemPerPage = data?.data?.pagination?.per_page;
          this.totalRecords = data?.data?.pagination?.total_records;
        },
        error: (err: Error) => {
          this.loading = false;
          // this.alertService.error(errorHandler(err));
          this.vmsData = new Array();
          this.totalRecords = 0;
        }
      }
    );
  }
  
  onEditClick(event){
    this.router.navigate(['timesheet', 'config'], { queryParams: { id: event?.id, mode: 'edit' }});
  }
  
  onViewClick(event){
    this.router.navigate(['timesheet', 'config'], { queryParams: { id: event?.id, mode: 'view' }});
  }

  onCloneClicked(event){
    this.router.navigate(['timesheet', 'config'], { queryParams: { id: event?.id, mode: 'clone' }});
  }

  onDeleteClick(event) {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}`;
    let payload = {};

    this.dialog.confirm(
      "Delete Timesheet",
      "Are you sure, You want to delete this timesheet?",
      "Yes", "No")
      .then(res => {
        if (res === false)
          return;

        this.timesheetConfigurationService.delete(url, payload)
          .subscribe({
            next: (data: any) => {
              this.alertService.success('Timesheet successfully deleted');
              this.getTimesheetConfigurationList();
            }, error: (err: Error | any) => {
              this.alertService.error(errorHandler(err));
            }
          }
        );
      }
    );
  }

  onDisableOrEnableClick(event) {

    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let payload: any = { status: event.is_active ? 'inactive' : 'active' };
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${event?.id}/status`;

    this.dialog.confirm(
      "Update Timesheet Status",
      "Are you sure, you want to update the status?",
      "Yes",
      "No"
    ).then(res => {

      if (res === false)
        return;

      this.timesheetConfigurationService.put(url, payload)
        .subscribe({
          next: (data: any) => {
            this.alertService.success("Record updated successfully");
            this.getTimesheetConfigurationList();
          }, error: (err: Error | any) => {
            this.alertService.error(errorHandler(err));
          }
        }
      );
    });
  }

  onPaginationClick(event) {
    this.Page = event;
    this.getTimesheetConfigurationList();
  }

  onSearch(event) {
    this.searchTerm = event;
    this.getTimesheetConfigurationList();
  }

  onListFilter(event) { }

}
