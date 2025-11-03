import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AdvanceFiltter } from '../table/table.model';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'program-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})

export class FilterComponent implements OnInit, OnChanges {

  // rangeDate: Date;
  advanceFilterForm: UntypedFormGroup;

  @Input() filter = [];
  @Input() set isFilterCleard(data) {
    if (data) {
      this.advanceFilterForm.reset()
    }
  }

  @ViewChild('refdate1') datePicker;
  @Output() advanceSearchFilter = new EventEmitter();
  @Output() closeSearchFilter = new EventEmitter();
  public createdDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };
  public effectiveDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };

  constructor(
      private fb: UntypedFormBuilder,
      private eventStream: EventStreamService,
    ) {
  }

  ngOnInit(): void {
    this.advanceFilterForm = this.fb.group({})
    if (this.filter) {
      this.filter.forEach((filter: AdvanceFiltter) => {
        if (filter.filterType === 'TEXT') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null))
        } else if (filter.filterType === 'MULTISELECT') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control([]))
        } else if (filter.filterType === 'SELECT') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null))
        } else if (filter.filterType === 'DATERANGE') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null))
        } else if (filter.filterType === 'MULTICHIP') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control([]))
        } else if(filter.filterType === 'CHECKBOX') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(false))
        } else if(filter.filterType === 'MULTICHECKBOX') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control([]))
        } else if(filter.filterType === 'NUMBER') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null))
        }
      })
    }
  }

  searchTrigger({term}, searchEvent, name) {
    if(searchEvent)
      this.eventStream.emit(new EmitEvent(Events[searchEvent], {term, name }));
  }

  ngOnChanges(data) {
    if (data.filter && data.filter.previousValue) {
      if (data.filter.previousValue[0].title !== data.filter.currentValue[0].title) {
        this.ClearFilter()
        this.advanceSearchFilter.emit()
      }
    }
  }

  ClearFilter() {
    this.eventStream.emit(new EmitEvent(Events.FILTER_NOTIFICATIONS, 'clear'));
    this.eventStream.emit(new EmitEvent(Events.ROLE_SEARCH, 'clear'));
    if (this.advanceFilterForm) {
      this.advanceFilterForm.reset()
      this.advanceSearchFilter.emit()
    }
  }

  onSearch() {
    let noOfFilter = 0;
    let filterData = []
    this.filter.forEach((filter: AdvanceFiltter) => {
      
      if(filter.name === 'do_not_rehire' && filter.filterType === 'CHECKBOX') {
        noOfFilter += 1;
        const checkboxRef: any = document.getElementById('checkbox-do_not_rehire');
        filterData[filter.name] = checkboxRef.checked;
      }
       else if (this.advanceFilterForm.get(filter.name).value !== null) {
        noOfFilter += 1;
        if (filter.filterType === 'DATERANGE') {
          const dateRange = (this.advanceFilterForm.get(filter.name).value).split('-')
          filterData[filter.name] = [(new Date(dateRange[0])).getTime(), (new Date(dateRange[1])).getTime()]
        } else {
          if(this.filter[0]['title'] == "Notification Activity") {
            this.eventStream.emit(new EmitEvent(Events.FILTER_NOTIFICATIONS, this.advanceFilterForm.get(filter.name).value));
          }
          if(this.filter[0]['title'] == "User Role") {
            this.eventStream.emit(new EmitEvent(Events.ROLE_SEARCH, this.advanceFilterForm.get(filter.name).value));
          }
          filterData[filter.name] = this.advanceFilterForm.get(filter.name).value
        }
      }

    })

    this.advanceSearchFilter.emit({ filterData, noOfFilter })
  }

  numberOnlyValidator(evt: KeyboardEvent) {

    const value = evt.key;
    if(evt.key === 'Backspace')
      return evt;

    let regex = new RegExp(/^[0-9.].*$/g);
    if(!regex.test(value))
      evt.preventDefault();
    
    return evt;
    
  }

  closeFilter() {
    this.closeSearchFilter.emit(true);
  }
}
