import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys,StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { EditRulesService } from '../../services/edit_rules.service';

@Component({
  selector: 'app-list-edit-rules',
  templateUrl: './list-edit-rules.component.html',
  styleUrls: ['./list-edit-rules.component.scss']
})
export class ListEditRulesComponent implements OnInit {

  public tableConfig: VMSConfig;
  public itemPerPage = 0;
  user_type: any;
  public tableLoaded = false;
  public vmsData: any;
  dataLoading = true;
  public totalPages;
  public totalRecords;
  public itemsPerPage: any;
  public programId:any;
  public columnData;
  public searchTerm;
  public isAdvanceFilter: boolean = false;
  public limit = 10;
  public pageNo = 1;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private editrulesService: EditRulesService,
    private _alert: AlertService,
  ) { }

  ngOnInit(): void {
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.user_type = this.storageService.get('user_type')?.toLowerCase();
    this.tableConfig = {
      title: 'Edit Rules',
      columnList: [
        { name: 'module_name', title: 'Module', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isDisableorDelete: true, isEditEditRule: true },
        { name: 'is_enabled', title: 'Status', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'roles', title: 'Roles', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isObjectStatusShow: true },
        { name: 'statuses', title: 'Object Status', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isObjectStatusShow: true },
        { name: 'rules', title: 'Rules', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false }
      ],
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isDownload: false,
      isCreate: true,
      permission: 'create_candidate',
      density: 'COMFORTABLE',
      tableWidth: '1500px',
    };

    this.editRulesList();
  }

  editRulesList() {
    this.dataLoading = true;

    this.editrulesService.fetcheditRuleSet(this.limit, this.pageNo).subscribe((data: any) => {
      const noOfPages = Math.ceil(data.total_records / data.items_per_page);
      const edit_arr = [];
      data?.edit_rule_set.forEach(element => {
        const editrules_list_data = {
          'module_name': element?.modules.map((moduleSet: any) => {return moduleSet?.module}),
          'is_enabled': element?.is_enabled,
          'roles': element?.roles?.map((roleSet: any)=>{return roleSet?.name}),
          'statuses': element?.statuses,
          'rules': element?.rules?.length,
          'id': element?.id
        }
        edit_arr.push(editrules_list_data);
      });
        
      this.vmsData = { edit_rules: edit_arr };
      this.totalPages = noOfPages;
      this.dataLoading = false;
      this.totalRecords = data?.total_records;
      this.itemsPerPage = data?.items_per_page;
      this.tableLoaded = true;
    });

  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  changeStatus(event: any) {

    this.editrulesService.changeEditRuleSetStatus(event)
      .subscribe(res => {
        this.dataLoading = true;
        this._alert.success(`Edit Rule Updated Successfully`);
        this.editRulesList();
      }, err => {
        this._alert.error(errorHandler(err));
      });
  }

  onPaginationClick(event) {
    this.pageNo = event;
    this.editRulesList();
  }

  onClickRecords(event: any) {
    this.limit = event;
    this.pageNo = 1;
    this.editRulesList();
  }

  onCreateClick(event: any) {
    if (event) {
      this.router.navigate(['/edit-rules/create-edit-rules']);
    }
  }

  onEditClick(event: any){
    if(event?.id){
      this.router.navigate([`/edit-rules/edit-edit-rules/${event?.id}`]);
    }
  }

  onClickView(event: any){
    if(event?.id){
      this.router.navigate([`/edit-rules/view-edit-rules/${event?.id}`]);
    }
  }

}
