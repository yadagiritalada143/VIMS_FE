import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { HttpService } from '../../../app/core/services/http.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceConfigurationService {
  private currentProgram: any;
  private $destroy: AsyncSubject<boolean> = new AsyncSubject<any>();
  mockApi: string;
  constructor(
    public storageService: StorageService,
    public _http: HttpService,
    private streamService: EventStreamService
  ) {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.streamService.on(Events.SET_PROGRAM).pipe(takeUntil(this.$destroy)).subscribe((eventobj) => {
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    });
  }


  get(url) {
    return this._http.get(url);
  }
  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }
  delete(url, payload) {
    return this._http.delete(url, payload);
  }

  getInvoiceDropdownOptions() {
    return {
      invoiceCode: [ { value: this.currentProgram?.root_hierarchy?.name, label: this.currentProgram?.root_hierarchy?.name },],
      voucherCode: [{ value: 'VCN', label: 'VCN' },],
      consolidateInvoiceType: [{ value: 'AUTOMATIC', name: 'AUTOMATIC' }, { value: 'MANUAL', name: 'MANUAL' },],
      filoeExtension: [{ value: 'pdf', name: 'PDF' }, { value: 'csv', name: 'CSV' }, { value: 'excel', name: 'EXCEL' },],
      invoiceCycle: [
        { value: 1, name: "Weekly" }, { value: 2, name: "Bi-Weekly" }, { value: 3, name: " Half-Month" }, { value: 4, name: "Monthly" }, { value: 5, name: "Daily" }],
      billingPeriod: [
        { value: 55, name: "Weekly" }, { value: 2, name: "Bi-Weeklyiii" }, { value: 3, name: " Half-Month" }, { value: 4, name: "Monthly" }, { value: 5, name: "Daily" }],
      weekStartDay: [
        { value: 1, name: 'Sunday' }, { value: 2, name: 'Monday' }, { value: 3, name: 'Tuesday' }, { value: 4, name: 'Wednesday' }, { value: 5, name: 'Thursday' }, { value: 6, name: 'Friday' }, { value: 7, name: 'Saturday' }],
      invoiceGenerationLogic: [
        { value: 1, name: 'Group By Worker' }, { value: 2, name: 'Group By Vendor' }, { value: 3, name: 'Group By Master Data' }, { value: 4, name: 'Group By Custom Field' }, { value: 5, name: ' Group By Program' }],
      invoiceType: [
        { value: 1, name: 'Consolidated' }, { value: 2, name: ' Individual' }],
      transactionCompleteOption: [
        { value: 1, name: 'Weekly' }, { value: 2, name: 'Bi-Weekly' }, { value: 3, name: 'Half-Month' }, { value: 4, name: 'Monthly' }, { value: 5, name: ' Daily' }],
      transactionCompleteStart_day: [
        { value: 1, name: 'Sunday' }, { value: 2, name: 'Monday' }, { value: 3, name: 'Tuesday' }, { value: 4, name: 'Wednesday' }, { value: 5, name: 'Thursday' }, { value: 6, name: 'Friday' }, { value: 7, name: ' Saturday' }],
      transactionCompleteType: [{ value: 'AUTOMATIC', name: 'AUTOMATIC' }, { value: 'MANUAL', name: 'MANUAL' }, { value: 'SCHEDULED', name: 'SCHEDULED' },],
      transactionCompleteNotes: [
        { value: 'true', name: 'true' }, { value: 'false', name: 'false' }, { value: 'null', name: 'null' }],
      invoiceGenrationLogic: [
        { value: 1, name: 'Per Contractor' }, { value: 2, name: 'Based on per vendor' }, { value: 3, name: 'Based on per Foundation' }, { value: 4, name: 'Per Organization' },
      ],
      UploadStandardTeamplateFile: [
        { value: 1, name: 'Apay' }, { value: 2, name: 'Kelly' }, { value: 3, name: 'XYZ' }, { value: 4, name: 'Quick Books' }, { value: 5, name: 'Concur' }, { value: 6, name: 'Advantage xpo' }, { value: 7, name: 'Apay, Quick books,xyz' }],
    }
  }

  getFoundationalTypes() {
    let url = `/configurator/programs/${this.currentProgram?.id}/foundational-data-types`;
    return this.get(url).pipe(takeUntil(this.$destroy));
  }

  getHierarcyList() {
    let url = `/configurator/programs/${this.currentProgram?.id}/hierarchy`;
    return this.get(url).pipe(takeUntil(this.$destroy));
  }
}