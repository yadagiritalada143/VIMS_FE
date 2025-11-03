import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'svms-selector-modal',
  templateUrl: './selector-modal.component.html',
  styleUrls: ['./selector-modal.component.scss']
})
export class SelectorModalComponent implements OnInit {

  public input: string = '';
  public dialogVisibility: boolean = false;

  @Input() loading: boolean = false;
  @Input() showDefault: boolean = false;
  @Input() wordDefault: boolean = false;
  @Input() showEditable: boolean = false;
  @Input() title: string = 'Select Items';
  @Input() offlineSearch: boolean = false;
  @Input() validatorFn: Function = null;
  @Input() hideItemBadge: boolean = false;

  @Output() open: EventEmitter <void> = new EventEmitter <void> ();
  @Output() close: EventEmitter <void> = new EventEmitter <void> ();
  @Output() search: EventEmitter <string> = new EventEmitter <string> ();
  @Output() scrollToEnd: EventEmitter <void> = new EventEmitter <void> ();

  public options: Array <ModalItemConfig> = [];
  public optionsCopy: Array <ModalItemConfig> = [];
  public internalOptions: Array <ModalItemConfig> = [];
  public internalOptionsCopy: Array <ModalItemConfig> = [];

  @Output() optionsChange: EventEmitter <any> = new EventEmitter <any> ();
  @Input('options') set recievedOptions(data: Array <ModalItemConfig>) {

    if(Array.isArray(data)) {

      if(this.internalOptions?.length || this.internalOptionsCopy?.length) {
        let perm: Array <string> = this.internalOptions.map((entry: any) => entry?.value);
        let temp: Array <string> = this.internalOptionsCopy.map((entry: any) => entry?.value);
        let selected_ids: Array <string> = [...perm, ...temp];
        data = data.filter((entry: any) => !selected_ids.includes(entry?.value));
        data = [...this.internalOptions, ...this.internalOptionsCopy ,...data];
      }

      this.options = data.map((entry: any, it: number) => {

        let result: ModalItemConfig = {
          _it: it,
          name: entry?.name,
          value: entry?.value,
          is_selected: entry?.is_selected || false
        };

        if(this.showDefault) {
          result['is_default'] = entry?.is_default || false;
        }

        if(this.showEditable) {
          result['is_editable'] = entry?.is_editable || false;
        }

        return result;
      });
      this.optionsCopy = _.cloneDeep(this.options);
      return;
    }

    this.options = [];
    this.optionsCopy = _.cloneDeep(this.options);
    
    return;
  };
  constructor() { }

  ngOnInit(): void { }

  changeSelection(it: number) {
    const item: any = this.optionsCopy?.[it];
    item.is_selected = !item?.is_selected;
    if(!item.is_selected) {
      item.is_editable = false;
      item.is_default = false;
    }

    this.internalOptionsCopy = this.optionsCopy.filter((entry: any) => entry?.is_selected);
  }

  changeDefault(index: number) {
    this.optionsCopy.forEach((option: any, it: number) => {
      this.optionsCopy[it].is_default = (it === index);
    });
    
    this.internalOptionsCopy = this.optionsCopy.filter((entry: any) => entry?.is_selected);
  }

  changeEditable(it: number) {
    const item: any = this.optionsCopy?.[it];
    item.is_editable = !item?.is_editable;
    this.internalOptionsCopy = this.optionsCopy.filter((entry: any) => entry?.is_selected);
  }

  removeDefault(it: number) {
    this.options = this.options.map((entry: any, index: number) => {
      entry.is_default = (index === it)?(!entry?.is_default):false;
      return entry;
    });

    this.updateEntries(false);
  }

  removeEditable(it: number) {
    const item: any = this.options?.[it];
    item.is_editable = !item?.is_editable;
    this.updateEntries(false);
  }

  removeSelection(it: number) {
    const item: any = this.options?.[it];
    item.is_selected = !item?.is_selected;
    if(!item.is_selected) {
      item.is_editable = false;
      item.is_default = false;
    }

    this.updateEntries(false);
  }

  updateEntries(flag: boolean = false) {
    if(flag) {
      this.options = _.cloneDeep(this.optionsCopy);
    } else {
      this.optionsCopy = _.cloneDeep(this.options);
    }

    this.internalOptionsCopy = [];
    this.internalOptions = this.options.filter((entry: any) => entry?.is_selected);
    this.optionsChange.emit(this.options);
    this.dialogVisibility = false;
    this.close.emit();
    this.input = '';
  }

  openDialog() {
    this.dialogVisibility = true;
    this.open.emit();
  }

  searchTerm() {
    setTimeout(() => {
      this.search.emit(encodeURIComponent(this.input));
    }, 0);
  }

  scrolledToEnd() {
    if(!this.dialogVisibility) {
      return;
    }

    this.scrollToEnd.emit();
  }

  showEntry(entry: ModalItemConfig) {
    if(!entry?.value) {
      return false;
    }

    if(!this.offlineSearch) {
      return true;
    }

    if(entry?.is_default) {
      return true;
    }

    let label: string = (entry?.name || '').toLowerCase();
    let inputValue: string = (this.input || '').toLowerCase();
    return label.includes(inputValue);
  }
}

export interface ModalItemConfig {
  _it?: number;
  name: string;
  value: string;
  is_selected?: boolean;
  is_default?: boolean;
  is_editable?: boolean;
};