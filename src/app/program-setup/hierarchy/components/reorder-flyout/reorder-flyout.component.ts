import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-reorder-flyout',
  templateUrl: './reorder-flyout.component.html',
  styleUrls: ['./reorder-flyout.component.scss']
})
export class ReorderFlyoutComponent implements OnInit {

  @Input() page: number = 1;
  @Input() limit: number = 10;
  @Input() visibility: string = 'hidden';
  @Input('dataList') vmsData: Array <any> = [];
  @Output() onClose: EventEmitter <void> = new EventEmitter <void> ();

  private dragStartIndex: number;

  constructor (
    private programService: ProgramService,
    private loader: LoaderService,
    private storage: StorageService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {}

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

  sidebarClose() {
    this.onClose.emit();
  }

  saveReordering() {

    let programId = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/foundational-data-types/set-ordering`;
    let payload = {
      "foundational_data_types": []
    };

    let start_index = (this.limit * (this.page - 1)) + 1;
    this.vmsData.forEach((val: any) => {
      payload.foundational_data_types.push({
        id: val.id,
        ref_order: start_index
      });
      start_index = start_index + 1;
    });

    this.loader.show();
    this.programService.put(url, payload)
      .subscribe(res => {
        this.loader.hide();
        this.alert.success('Master data type reordering successful');
        this.sidebarClose();
    }, err => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
    });
  }
}
