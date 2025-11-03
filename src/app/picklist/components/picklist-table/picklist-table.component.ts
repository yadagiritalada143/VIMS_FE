import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import * as _ from 'lodash';
type Visibility = ('visible' | 'hidden');


@Component({
  selector: 'app-picklist-table',
  templateUrl: './picklist-table.component.html',
  styleUrls: ['./picklist-table.component.scss']
})
export class PicklistTableComponent implements OnInit {

  private programId: string = null;

  public filterTerm: string = "";
  public picklistInput: string = "";

  public selections: Array <any> = [];
  @Input('selections') set selectItems(data : Array <any>) {
    if(Array.isArray(data)) {
      this.selections = data;
    }
  };

  @Input() readonly: boolean = false;
  @Input() showFilter: boolean = true;
  @Input() multiselect: boolean = false;
  @Input() disableEntry: boolean = false;
  @Input() showMultiselect: boolean = true;
  @Input('visibility') set clearFields(visibility: Visibility) {
    if(visibility === 'hidden') {
      this.filterTerm = '';
      this.picklistInput = '';
    }
  };

  @Output() selectionsChange: EventEmitter <any> = new EventEmitter <any> ();
  @Output() multiselectChange: EventEmitter <boolean> = new EventEmitter <any> ();

  constructor(
    private storage: StorageService  ) { }

  ngOnInit(): void {
    this.programId = this.storage.get(StorageKeys.PROGRAM_ID);
  }

  changeCheckboxStatus(entry: any, flag: boolean): void {
    entry['is_enabled'] = flag;
    this.selectionsChange.emit(_.cloneDeep(this.selections));
  }

  addPicklistItem(evt?: KeyboardEvent) {
    
    if(!this.picklistInput?.trim())
      return;

    if(evt && (evt.keyCode !== 13))
      return;

    let selectionEntry: any = {
      value: this.picklistInput?.trim(),
      label: '',
      defined_by: 'Program',
      is_enabled: true
    };

    this.picklistInput = null;
    this.selectionsChange.emit([
      ...this.selections,
      selectionEntry
    ]);
  }

  removePicklistItem(entry: any): void {
    this.selections = this.selections.filter((data: any) => (data?.id !== entry?.id));
    this.selectionsChange.emit(_.cloneDeep(this.selections));
  }

  toggleSelection(flag: boolean) {
    this.multiselectChange.emit(flag);
  }

  getRowLength(count: number) {
    return count/28 + 1;
  }

  searchFilter(selections: Array <any>): Array <any> {
    if(Array.isArray(selections)) {
      return selections.filter((entry: any) => {
        let search: string = this.filterTerm?.toLowerCase();
        let value: string = entry?.value?.toLowerCase();
        return value.includes(search);
      })
    }

    return [];
  }

  programValidation(entry: any) {
    return ((entry?.disabled_program ?? []).includes(this.programId));
  }

}
