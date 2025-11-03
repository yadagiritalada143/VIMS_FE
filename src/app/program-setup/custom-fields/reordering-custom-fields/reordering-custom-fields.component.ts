import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { ProgramConfig } from '../../../shared/enums';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { UserService } from './../../../core/services/user.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { ActivatedRoute } from '@angular/router';
import { DndDropEvent } from 'ngx-drag-drop';
@Component({
  selector: 'app-reordering-custom-fields',
  templateUrl: './reordering-custom-fields.component.html',
  styleUrls: ['./reordering-custom-fields.component.scss'],
})
export class ReOrderingCustomFieldsComponent implements OnInit, OnDestroy {
  @Input() moduleName: string;
  @Input() createCustomFields = 'hidden';
  @Input() totalRecords;
  public configurationPanelOpened = false;
  @Output() onClose = new EventEmitter();
  @Output() onSave = new EventEmitter();
  private subscriptions: Subscription[] = [];
  visiblePanelIndex = 0;
  public programId: string;
  public clientId: string;
  public sidebarTitle = 'Reorder Custom Fields';
  dataLoading = false;
  public vmsData: any = [];
  public itemsPerPage: 25;
  public tableLoaded = false;
  isReorderCustomFields = 'hidden';
  pathname = '';
  private dragStartIndex: number;
  constructor(
    private localStorage: StorageService,
    private _loader: LoaderService,
    public userService: UserService,
    private _alert: AlertService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);

    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = this.localStorage.get('CurrentProgram').id;
    }
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((queryParamMap:any) => {
        const tab = queryParamMap.get('currentTab');
        if (tab) {
          this.moduleName = tab;
        }
        this.getCustomFieldsList();
      }),
    );

  }

  reOrderCustomFields(){
    let custom_fields = [];
      for(let i in this.vmsData){
        custom_fields.push({
          id:this.vmsData[i].id,
          entity_ref:this.moduleName,
          ref_order: Number(i)+1
        })
      }
      this.subscriptions.push(
        this.userService.reOrderCustomFieldsList(this.programId,{custom_fields}).subscribe(
          (data:any) => {
            this._loader.hide();
            this.onSave.emit(true);
          },
          error => {
            this._alert.error(errorHandler(error), {});
            this._loader.hide();
          },
        ),
      );
    }

  getCustomFieldsList(pageNo = 1) {
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.subscriptions.push(
      this.userService.getAllCustomFieldsList(this.programId, pageNo, this.totalRecords, this.moduleName).subscribe(
        (data:any) => {
          this.vmsData = data.custom_fields;
          this.itemsPerPage = data.items_per_page;
          this.tableLoaded = true;
          this._loader.hide();
        },
        error => {
          this._alert.error(errorHandler(error), {});
          this._loader.hide();
        },
        () => {
          this.dataLoading = false;
          this._loader.hide();
        },
      ),
    );
  }

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          this.vmsData.splice(this.dragStartIndex, 1);
          this.vmsData.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dragStartIndex = null;
  }


  submit() {

  }


  sidebarClose() {
    this.onClose.emit(true);
  }


  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
