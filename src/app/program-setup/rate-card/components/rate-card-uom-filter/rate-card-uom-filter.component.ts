import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-rate-card-uom-filter',
  templateUrl: './rate-card-uom-filter.component.html',
  styleUrls: ['./rate-card-uom-filter.component.scss']
})
export class RateCardUomFilterComponent implements OnInit {

  @Input() ratecardFilter = "hidden";
  @Output() onshowFilterFlyout = new EventEmitter();
  @Output() clearFilters = new EventEmitter();
  @Output() filtersApplied = new EventEmitter();

  public UOMSelected:any = [];
  public uoms: any = ["Hourly", "Daily", "Weekly", "Monthly", "Yearly", "All"];

  constructor(private localStorage: StorageService) { }

  ngOnInit(): void {
    if(this.localStorage.get("UOMSelected"))
      this.UOMSelected = this.localStorage.get("UOMSelected");
  }

  sidebarClosed() {
    this.ratecardFilter = 'hidden';
    this.onshowFilterFlyout.emit('hidden');
  }

  clearAllFilters() {
    this.UOMSelected = [];
    this.clearFilters.emit();
    this.localStorage.remove("UOMSelected");
    this.sidebarClosed();
  }

  applyFilters () {
    let filterString = this.UOMSelected.toString().replaceAll(',','');
    if(this.UOMSelected.includes("All")){
      filterString = this.uoms.toString().replaceAll(',','');
      filterString = filterString.replace("All","");
    }
    this.filtersApplied.emit(filterString.toLowerCase());
    this.localStorage.set("UOMSelected", this.UOMSelected, true);
    this.sidebarClosed();
  }
}