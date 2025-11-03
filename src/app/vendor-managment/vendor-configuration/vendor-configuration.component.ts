import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-vendor-configuration',
  templateUrl: './vendor-configuration.component.html',
})
export class VendorConfigurationComponent implements OnInit {

  vmsData = [];
  itemPerPage = 0;
  totalRecords = 0;
  options = [{ icon: 'assignment_turned_in', name: 'Compliance' }];
  tableConfig: VMSConfig = {
    title: 'Program',
    columnList: [
      { name: 'name', title: 'Programs', width: 40, isIcon: false, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false, isOptOut: false, isSubmitCandidate: false, isNoOption: true },
      { name: 'is_enabled', title: 'Status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: '_id', title: 'ID', width: 20, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false },
      { name: 'contacts', title: 'Program Contact', width: 20, isIcon: false, isImage: true, isMultiUser:true, isContact: false, isArray:false, isNumberBadge: false, isRange: false },
      { name: 'client.name', title: 'Client', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'compliance_status.is_compliant', title: 'Compliance status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'compliance_status.is_audited', title: 'Audit Completed', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isShowCheckBox: true, isCheckBoxReadonly: true },

    ],
    tabsList: [],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: false,
    density: 'COMFORTABLE',
    tableWidth: '100%',
    advanceFilter: [
      { name: 'name', title: 'Program Name', placeholder: 'Program Name', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ]
  };

  searchTerm = '';
  dataLoading = false;
  isAdvanceSearch = false;
  public totalPages = 0;
  org_id: any;
  userType;
  constructor(private _loader: LoaderService, private _programService: ProgramService, private storageService: StorageService, private router: Router) { }

  ngOnInit(): void {
    this.org_id = this.storageService.get('user')['organization_id'];
    this.userType = this.storageService.get('user_type');
    this.programs();
  }

  onOptionClicked(event) {
    const { option, data } = event;
    if (option.name === 'Compliance') {
      this.router.navigate(['vendor-managment/compliance-list/' + data.id + '/' + this.org_id])
    }
  }

  programs(pageNo = 1) {
    this.dataLoading = true;
    if (pageNo === 1 && !this.searchTerm) {
      this._loader.show();
    }
    const url = `/configurator/programs/advanced-filters`;
    const filter = {};
    if (this.userType == 'CLIENT') {
      filter['clients'] = [this.org_id]
    } else if (this.userType === 'VENDOR') {
      filter['vendors'] = [this.org_id]
    } else if (this.userType === 'MSP') {
      filter['msps'] = [this.org_id]
    }
    this._programService.post(url, {
      "filters": filter,
      "pagination": {
        "limit": 25,
        "page": pageNo
      }
    }).subscribe({
      next: (data: any) => {
        data.programs = data.programs.map(prog => {
          prog._id = prog.unique_id;
          delete prog.unique_id;
          if (!prog.compliance_status) {
            prog.compliance_status = {
              is_compliant: false
            }
          }
          prog.contacts = prog.contacts.map(contact => { return { first_name: contact.name } });
          prog.compliance_status.is_compliant = prog.compliance_status.is_compliant ? 'Compliant' : 'Non - Compliant';
          return prog;
        })

        this.vmsData = data.programs;
        this.totalPages = data.items_per_page;
        this.totalRecords = data.total_records;
        this.isAdvanceSearch = false;
        this._loader.hide();

      }, error: (err: Error) => {
      }, complete: () => {
        this.dataLoading = false;
        this._loader.hide();
      }
    });
  }

  onCreateClick(event) { }

  onClickView(event) {
    if (this.userType === 'VENDOR') {
      this.router.navigate(['vendor-managment/compliance-list/' + event.id + '/' + this.storageService.get('ORG_ID')]);

    } else if (this.userType === 'MSP' || this.userType === 'CLIENT') {
      this.router.navigate(['/program-setup'],
          {
            queryParams: {
              programId: event._id,
              clientId: event.client.id,
              program_req_id: event.id,
              clientName: event.client.name
            }
          });
    }
  }

  onListFilter(event) { }

  onSearch(event) { }

  onSortClick(event) { }

  onPaginationClick(event) { }

}
