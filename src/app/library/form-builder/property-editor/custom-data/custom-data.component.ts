import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ProgramConfig } from '../../../../shared/enums';
import { errorHandler } from '../../../../shared/util/error-handler';
import { AlertService } from '../../../../core/components/alert/alert.service';

@Component({
  selector: 'app-custom-data',
  templateUrl: './custom-data.component.html',
  styleUrls: ['./custom-data.component.scss']
})
export class CustomDataComponent implements OnInit {
  @Input() pickListData: any = [];
  public isShowAllItems: boolean = false;
  public selected_pickList_id: any;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage: any;
  private pageNo = 0;
  private limit = 25;
  public programId: any;
  public pickListItemsData: any = [];
  constructor(
    private userService: UserService, 
    private _storageService: StorageService, 
    private _alert: AlertService
  ) { }

  ngOnInit(): void {
    let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
      // this.clientId = programId?.clientId;
    } 
  }
  selectedPickListName(e) {
    this.selected_pickList_id = e.id;
    this.pageNo = 1;
    this.getpicklistItems(this.pageNo);
  }
  showAllItems() {
    this.isShowAllItems = true;
  }
  hideAllItems(){
    this.isShowAllItems = false;

  }


  getpicklistItems(pageNo = 1) {
    this.userService.getpicksListItems(this.programId, this.selected_pickList_id, pageNo, this.limit).subscribe(data => {
      this.pickListItemsData = data.picklist_items;
      this.totalRecords = data.total_records;
      this.itemsPerPage = data.items_per_page;
    }, error => {
      this._alert.error(errorHandler(error), {});
    })
  }
}
