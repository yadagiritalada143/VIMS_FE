import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from '../../core/services/storage.service';
import { UserService } from '../../core/services/user.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { ProgramConfig } from '../../shared/enums';
import { errorHandler } from '../../shared/util/error-handler';
@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss']
})
export class FormBuilderComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  isPropEditorVisible = false;
  isToolboxVisible = true;
  roleList: any[] = [];
  private pageNo = 1;
  private limit = 10;
  programId;
  @Input() dataVisibility = 'hidden';
  @Output() onClose = new EventEmitter();
  constructor(
    private eventStream: EventStreamService,
    private _storageService: StorageService,
    private userService: UserService,
    private _loader: LoaderService,
    private _alert: AlertService) { }
  field: any = undefined;

  ngOnInit(): void {
    let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
    }
    this.getRoleList();
    this.subscriptions.push(this.eventStream.on(Events.SELECTED_CUSTOM_FIELD).subscribe((data) => {
      if (data) {
        this.isToolboxVisible = false;
        this.field = data;
      }
    }));

  }

  getRoleList(pageNo = 1) {
    if (pageNo === 1) {
      this._loader.show();
    }
    this.subscriptions.push(this.userService.getAllRoleList(this.programId, this.pageNo, this.limit).subscribe(data => {
      this.roleList = data.roles.map(rol => {
        return { name: rol.name, id: rol.id, selected: false };
      });

      this._loader.hide();
    }, error => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
    },
      () => {
        this._loader.hide();
      }));
  }

  dragStarted(event) {
    event.dataTransfer.setData("field-type", event.target.getAttribute("field-type"));
  }

  close() {
    this.isToolboxVisible = true;
  }

  onCloseClick() {
    this.onClose.emit('hidden');
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
