import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { DragTableConfig } from './svms-drag-table.interfaces';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'svms-drag-table',
  templateUrl: './svms-drag-table.component.html',
  styleUrls: ['./svms-drag-table.component.scss']
})
export class SvmsDragTableComponent implements OnInit {

  public dragStartIndex: number = 1;
  public tableConfig: DragTableConfig = null;
  public tableItems: Array<any> = [];

  public initDatePicker: boolean = false;
  public dateStartOptions: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: []
  };

  public dateEndOptions: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: []
  }

  constructor (
    private eventStream: EventStreamService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {}

  @Output() create: EventEmitter <any> = new EventEmitter <any> ();
  @Output() remove: EventEmitter <number> = new EventEmitter <number> ();

  @Input() readonly: boolean = false;
  @Input('config') set dragTableConfig(data: DragTableConfig) {
    if (data) {
      this.tableConfig = data;
    }
  }

  @Input('items') set dragTableItems(data: Array<any>) {
    if (data) {
      this.tableItems = data;
    }
  }

  onDragStart(index: number) {
    if(!this.isRenderDraggableAllowed(index))
      return;
    this.dragStartIndex = index;
  }

  onDrop(event: DndDropEvent) {

    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {

        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        
        if(!this.tableConfig.showLastDraggable) {
          if(dropIndex > this.tableItems.length - 2)
            return;
        }

        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          this.tableItems.splice(this.dragStartIndex, 1);
          this.tableItems.splice(dropIndex, 0, event.data);
        }

        this.eventStream.emit(new EmitEvent(Events.DRAG_TABLE_ENTRY_MOVED, {
            start: this.dragStartIndex,
            end: dropIndex
          })
        );
      }
    }

    this.dragStartIndex = null;
  }

  parseValidNum(num: number) {
    if(Number.isNaN(num))
      return 2;
    return num;
  }

  addNewEntry() {
    this.create.emit();
  }

  searchEntries(evt: any, it: number, col_key: string) {
    const {term, open, show} = evt;
    this.eventStream.emit(new EmitEvent(Events.DRAG_TABLE_SEARCH, {
        row: it, name: col_key, term, open, show
      })
    );
  }

  changeHandler(evt: any, it: number, key: string) {
    this.eventStream.emit(new EmitEvent(Events.DRAG_TABLE_FIELD_CHANGED, {
      data: evt, index: it, column: key
    }));
  }

  emitClickListener(it: number, name: string) {
    this.eventStream.emit(new EmitEvent(Events.DRAG_TABLE_ICON_CLICKED, {
      index: it, name
    }));
  }

  isRenderDraggableAllowed(it: number) {
    
    if(this.tableItems && this.tableItems.length) {
      if(this.tableConfig.showLastDraggable === false) {
        if(it === this.tableItems.length - 1) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  isEmptySelect(entry: any, it: number) {
    if(!this.tableConfig.showLastDraggable) {
      if(it === this.tableItems.length - 1)
        return false;
    }

    if(!entry.highlight)
      return false;

    if(!entry?.selected?.length)
      return true;

    return false;
  }

  isEmptyInput(entry: any, it: number, value: any) {
    if(!this.tableConfig.showLastDraggable) {
      if(it === this.tableItems.length - 1)
        return false;
    }

    if(!entry.highlight)
      return false;

    if(value === null || value === undefined || value === '')
      return true;
    
    return false;
  }

  get defaultDateFormat(): string {
    let format: string = this.storage.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? 'MM/DD/YYYY';
    while(format.includes('D')) {
      format = format.replace('D', 'd');
    }

    return format;
  }

}