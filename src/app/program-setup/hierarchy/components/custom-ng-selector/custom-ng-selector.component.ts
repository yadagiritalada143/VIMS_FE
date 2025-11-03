import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
type ListNode = { id: string, name: string };

@Component({
  selector: 'custom-ng-selector',
  templateUrl: './custom-ng-selector.component.html',
  styleUrls: ['./custom-ng-selector.component.scss']
})
export class CustomNgSelectorComponent implements OnInit, OnDestroy {

  private itemsMap: Map <string, string> = new Map <string, string> ();

  @Input() name: string = null;
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() placeholder: string = 'Select options';
  @Input() selected: Array <string> = [];
  @Input() editable: Array<string> = [];
  @Input() editableAllow: boolean = false;
  @Input() defaultAllow: boolean = false;
  @Input('defaultSelected') set defaultSelect(data: string) {
    this.defaultSelection = data;
  };

  @Output() searchTerm: EventEmitter <string> = new EventEmitter <string> ();
  @Output() onChanged: EventEmitter <Array <string>> = new EventEmitter <Array <string>> ();  
  @Output() defaultChanged: EventEmitter <string> = new EventEmitter <string> ();
  @Output() editableChanged: EventEmitter <Array<string>> = new EventEmitter<Array<string>> ();
  @Output() scrollToEnd: EventEmitter <any> = new EventEmitter <any> ();

  public inputTerm: string = '';
  public items: Array <ListNode> = [];
  public defaultSelection: string = null;
  @Input('items') set itemMapList(data: Array <ListNode>) {
    if(Array.isArray(data)) {
      this.items = data;
      this.items.forEach((item: ListNode) => {
        this.itemsMap.set(item?.id, item?.name);
      })
      } else {
      this.items = [];
    }
  }

  constructor() { }
  ngOnInit(): void { }

  removeSelection(id: string) {
    if(id) {
      if(this.defaultSelection === id) {
        this.defaultSelection = null;
        this.defaultChanged.emit(this.defaultSelection);
      }
      this.selected = (this.selected || []).filter(selection => selection !== id);
      this.onChanged.emit(this.selected);
    }
  }

  updateEditable(id: string) {
    if(id) {
        let ind = this.editable?.findIndex((node: string) => node==id)
        if(ind>-1){
          this.editable.splice(ind,1);
          this.editableChanged.emit(this.editable);
          return;
        }
        this.editable.push(id);
        this.editableChanged.emit(this.editable);
    }
  }

  emitChangeEvent(evt: Array <string>) {
    if(evt.length === 1) {
      this.defaultSelection = evt[0];
      this.editable = evt
      this.editableChanged.emit(this.editable);
      this.defaultChanged.emit(this.defaultSelection);
    }
    this.onChanged.emit(evt);
  }

  emitSearchTerm($event) {
    const {term} = $event;
    this.inputTerm = term;
    this.searchTerm.emit(term);
  }

  emitScrollToEnd(evt: any) {
    this.scrollToEnd.emit(evt);
  }

  isDefault(entry: string) {
    return (this.defaultSelection === entry);
  }

  isEditable(entry: string) {
    return (this.editable?.includes(entry));
  }

  markAsDefault(entry: string) {
    if(entry) {

      if(entry === this.defaultSelection) {
        this.defaultSelection = null;
        this.defaultChanged.emit(this.defaultSelection);
        return;
      }

      this.defaultSelection = entry;
      let ind  = this.editable.findIndex((editMaster: any) => editMaster == entry)
      if(ind==-1){
        this.editable.push(entry);
        this.editableChanged.emit(this.editable);
      }
      this.defaultChanged.emit(this.defaultSelection);
    }
  }

  getItemName(id: string) {
    return this.itemsMap?.get(id) || 'Undefined';
  }

  ngOnDestroy(): void {
    this.itemsMap.clear();
  }
}
