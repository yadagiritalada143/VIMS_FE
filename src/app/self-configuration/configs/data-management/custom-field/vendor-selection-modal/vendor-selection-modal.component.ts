import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-vendor-selection-modal',
  templateUrl: './vendor-selection-modal.component.html',
  styleUrls: ['./vendor-selection-modal.component.scss'],
})
export class VendorSelectionModalComponent implements OnInit {
  searchText : string;
  allVendors : any =[]
  allSelectedVendor : any =[]
  @Input() vendors: any = [];

  @Output() changeSelection = new EventEmitter<any>();
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() searchVendorField = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {
    this.allVendors = this.vendors
  }

  ngOnChanges() {

  }

  removeSelection() {
    this.allVendors.forEach(x => {
      x.checked = false
    })
    this.vendors = this.allVendors
    this.changeSelection.emit({selectedVendor: this.allVendors})
  }

  getSelectedVendorLength() {
    return this.allVendors?.filter(x => x.checked)?.length
  }

  search() {
    if(this.searchText) {
      this.vendors = this.allVendors.filter(search => search?.vendor?.name.toLowerCase().includes(this.searchText.toLowerCase()))
    } else {
      this.vendors = this.allVendors
    }
  }

  selectVendors() {
    this.allVendors = this.allVendors.map((vendor) => {
      const selected = this.allSelectedVendor.find((selected) => selected.id === vendor.id);
      return selected ? { ...vendor, checked: selected.checked } : vendor;
    });
    this.changeSelection.emit({selectedVendor: this.allVendors})
    this.onCloseModal()
  }

  selectVendor(evt,ven) {
    let index = this.allSelectedVendor.findIndex(x => x.id == ven.id)
    if(evt) {
      // find if element is exist, If not then push
      ven.checked = true
      if(index == -1) {
        this.allSelectedVendor.push(ven)
      }
    } else {
      // Remove for selected vendor
      ven.checked = false
      this.allSelectedVendor.splice(index, 1)
    }
  }

  onCloseModal() {
    this.closeModal.emit(true)
  }

}
