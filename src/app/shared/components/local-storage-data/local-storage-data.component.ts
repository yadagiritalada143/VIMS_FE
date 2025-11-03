import { Component, OnInit } from '@angular/core';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-local-storage-data',
  templateUrl: './local-storage-data.component.html',
  styleUrls: ['./local-storage-data.component.scss'],
})
export class LocalStorageDataComponent implements OnInit {
  localStorageModal: boolean = false;
  dataList: any = [];
  constructor(public storageService: StorageService) {}

  ngOnInit(): void {}

  openLocalStorageModal() {
    this.localStorageModal = true;
    this.getLocalData();
  }

  getLocalData() {
    this.dataList = [];
    Object.values(StorageKeys)
      .sort()
      .forEach(key => {
        if (this.storageService.get(key)) {
          this.dataList.push({
            label: key,
            value: this.storageService.get(key),
          });
        }
      });
  }
}
