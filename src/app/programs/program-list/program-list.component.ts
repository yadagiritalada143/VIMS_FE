import { Component, OnInit, ViewChild } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ProgramService } from '../program.service';
import { VMSTableComponent } from '../../library/table/table/table.component';
import { LoaderService } from '../../core/components/loader/loader.service';
import { ProgramsFilterModel } from '../programs.model';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-program-list',
  templateUrl: './program-list.component.html',
  styleUrls: ['./program-list.component.scss']
})
export class ProgramListComponent implements OnInit {
  // [x: string]: any;
  isExpand = false;
  dataLoading = false;
  limit = 10;

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  tableConfig: VMSConfig = null;
  public vmsData: any;
  public programMem: any;
  public tableLoaded = false
  public searchTerm = '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;
  sortPayload: any;
  currentProgram:any;

  constructor (
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService, 
    private datePipe: LocalDateFormatPipe, 
    private localStorage: StorageService,
    private authorization: AuthorizationService
  ) { }

  public totalPages = 0;
  public totalRecords = 0;
  public programMembers: any;

  ngOnInit(): void {
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.tableConfig = {
      title: 'Programs',
      columnList: [
        { name: 'name', title: 'Program Name', width: 32, isIcon: true, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'client.name', title: 'Client', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'msp.name', title: 'MSP', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'unique_id', title: 'Program ID', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'start_date', title: 'Effective Date', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'is_enabled', title: 'Status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false }
      ],
      isExpand: true,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: this.authorization.authorize('create_program'),
      permission: 'create_program',
      density: 'COMFORTABLE',
      tableWidth: "100%",
      advanceFilter: [
        { name: 'name', title: 'Program Name', placeholder: 'Program Name', filterType: 'TEXT' },
        {
          name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
            { name: 'Active', value: true },
            { name: 'Inactive', value: false }
          ]
        },
        { name: 'start_date', title: 'Effective Date', filterType: 'DATERANGE' }
      ]
    };

    this.programs();
  }

  onSearch(term) {
    this.searchTerm = term;
    this.programs();
  }

  programs(pageNo = 1) {
    this.dataLoading = true;
    const url = `/configurator/programs?limit=${this.limit}&page=${pageNo}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`;
    this._programService.get(url).subscribe({
      next: (data: any) => {
        this.vmsData = data;
        this.vmsData?.programs?.forEach(vms => {
          if (vms?.start_date) {
           vms.start_date = this.datePipe.transform(vms.start_date, null ,null ,null , true, DATE_FORMAT.FORMATYMD);
          }
        });
        this.totalPages = data.total_records;
        this.totalRecords = data.items_per_page;
        this.tableLoaded = true;
        this.isAdvanceSearch = false;
        this.dataLoading = false;
      }, error: (err: Error | any) => { }
      , complete: () => {
        this.dataLoading = false;
      }
    });
  }

  formatDate(date) {
    if(date){
    const d = new Date(date);
    let month = '' + (d?.getMonth() + 1);
    let day = '' + d?.getDate();
    let year = d?.getFullYear();
    if (month?.length < 2)
      month = '0' + month;
    if (day?.length < 2)
      day = '0' + day;
    return [day, month, year].join('-');
    } else {
      return;
    }
  }

  onExpandClick(event) {

    this.vmsData.programs.forEach(element => {
      if (element.id === event) {
        this.programMembers = element.members
        let roleCounter = {};
        let userCounter1 = {};
        let elemArr = [];
        element?.members?.forEach(function (obj) {
          var key = JSON.stringify(obj['role']);
          var key1 = JSON.stringify(obj['user']);
          if (key1 == undefined) key1 = JSON.stringify(obj['email']);
          roleCounter[key] = (roleCounter[key] || 0) + 1;
          if (key1 != undefined) userCounter1[key] += key1;
        })
        let usercnt;
        let userObj = Object.entries(userCounter1);
        usercnt = Object.values(roleCounter);
        let userkey;
        let membersname;
        let usernames: any;
        let roles: any;
        let iterations: any;
        for (let k = 0; k < userObj.length; k++) {
          usernames = userObj[k][1];
          userkey = usernames.substring(10).slice(0, -1).toString().split('""');
          roles = userObj[k][0].substring(1).slice(0, -1);
          membersname = userkey && userkey.length > 2 ? userkey[0] + ', ' + userkey[1] + ',+' + (usercnt[k] - 2) : userkey.length == 2 ? userkey[0] + ', ' + userkey[1] : userkey.length == 1 ? userkey[0] : '';
          iterations = userkey && userkey.length > 2 ? [0, 1, 2] : userkey.length == 2 ? [0, 1] : userkey.length == 1 ? [0] : [];
          elemArr.push({ "role": roles, "user": membersname, "listofUsers": userkey, "iterations": iterations })
        }
        this.programMem = elemArr;
      }
    });

    if (event !== null) {
      this.isExpand = true
    } else {
      this.isExpand = false
    }
  }

  onPaginationClick(event) {
    if (this.isAdvanceSearch) {
      this.filterDataPage = event;
      this.filterProgram(null, event);
    }
    else {
      this.programs(event);
    }
  }
  onCreateClick(event) {
    if (event) {
      this.router.navigate(['programs', 'create']);
    }
  }

  onSortClick(event) {
    if (!event) {
      this.isAdvanceSearch = false
      this.programs(1)
    } else {
      this.sortPayload = event
      this.isAdvanceSearch = true
      this.filterProgram()
    }
  }

  onListFilter(event) {
    // this.dataLoading = true;
    this._loader.show();
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.filterProgram(event);
  }
  onClickRecords(event) {
    // this.selectedRecords = event;
    this.limit = event;
    this.programs(1)
  }

  filterProgram(payload = null, pageNo = 1) {
    let filter: ProgramsFilterModel;
    if (payload !== null) {
      filter = {
        filters: {
          name: payload['name'],
          is_enabled: payload['is_enabled'],
          start_date: payload['start_date']
        },
        pagination: {
          limit: 10,
          page: pageNo
        }
      }
    } else {
      filter = {
        pagination: {
          limit: 10,
          page: pageNo
        }
      }
      if (this.filterpayLoad) {
        filter['filters'] = {
          name: this.filterpayLoad['name'],
          is_enabled: this.filterpayLoad['is_enabled'],
          start_date: this.filterpayLoad['start_date']
        }
      }
    }

    if (this.sortPayload) {
      filter['sort_order'] = [{
        field: this.sortPayload['name'],
        order: this.sortPayload['order']
      }]
    }

    this.dataLoading = true;
    this._programService.post('/configurator/programs/advanced-filters', filter)
      .subscribe({
        next: (data: any) => {
          this.vmsData = data;
          this.totalPages = data.total_records;
          this.totalRecords = data.items_per_page;
          this.tableLoaded = true;
          this._loader.hide();
        }, error: (err: Error | any) => {
        }, complete: () => {
          this.dataLoading = false;
          this._loader.hide();
        }
      });

  }
}
