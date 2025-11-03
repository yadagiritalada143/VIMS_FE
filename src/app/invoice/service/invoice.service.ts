import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AsyncSubject, BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, takeUntil, tap, map } from 'rxjs/operators';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { environment } from 'src/environments/environment';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/invoice/enums/accuracy-config.enum';
@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  accuracyEnum = AccuracyConfigEnum;
  public viewCurrencyStrict: string = '0.4-4' ;
  private currentProgram: any;
  public loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private $destroy: AsyncSubject<boolean> = new AsyncSubject<any>();
  private baseUrl;
  constructor(private storageService: StorageService, private http: HttpClient,
    public accuracyPipe: AccuracyPipe, private streamService: EventStreamService, private ConfigurationLoader: ConfigurationLoader, private _http: HttpService, public currencyPipe: CustomcurrencyPipe) {
    this.baseUrl = this.ConfigurationLoader?.getConfiguration()?.API_ENDPOINT || environment.API_ENDPOINT;
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
    // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
    this.streamService.on(Events.SET_PROGRAM).pipe(takeUntil(this.$destroy)).subscribe((eventobj) => {
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    });
  }
  
  showTooltip(val, currency) {
    if(this.currentProgram?.config?.accuracy_config){
      return this.accuracyPipe?.transform(val, this.accuracyEnum.AMOUNT,{ currencyCode: currency});
    } else{
      return this.accuracyPipe?.transform(val, this.accuracyEnum.AMOUNT, {  currencyCode: currency, digitInfo: this.viewCurrencyStrict});
    }  
  }



  get(url: string, params?: HttpParams): Observable<any> {
    return params ? this.http.get(this.baseUrl + url, { params }) : this.http.get(this.baseUrl + url);
  }

  post(url: string, payload: any): Observable<any> {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    return this.http.post(this.baseUrl + url, payload, { headers });
  }
  put(url: string, payload: any): Observable<any> {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    return this.http.put(this.baseUrl + url, payload, { headers });
  }

  fetchIndividualInvoiceListCount({search = '',filter = ''}: { search?: any, filter?: any}) {
    let url = `/invoice/programs/${this.currentProgram.id}/individual-invoice-list/count`;
    let params = new HttpParams()
    if (filter) {
      for (let [key, value] of Object.entries(filter)) {
        params = params.append(key, value?.toString());
      }
    } 
    if (search){
      params = params.append('search', search?.toString());
    }
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  fetchConsolidatedInvoiceListCount(): Observable<any> {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/count`;
    return this.http.get(this.baseUrl + url);
  }
  fetchConsolidatedInvoiceDetailsCount(invoiceId): Observable<any> {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/tab-count`;
    return this.http.get(this.baseUrl + url);
  }
  fetchConsolidatedInvoiceFiles(invoiceId): Observable<any> {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/files`;
    return this.http.get(this.baseUrl + url);
  }

  fetchInvoiceList({ search = '', page, limit, invoice_uuid = '', start_date = '', end_date = '', filter = '', order_by = '', sort_by = '', status = '' }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any, end_date?: any, start_date?: any, filter?: any, order_by?: any, sort_by?: any, status?: any }) {      
    let url = `/invoice/programs/${this.currentProgram.id}/individual-invoice-list`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      if(status) {
         params.set('status', status);
      }
      if (order_by) {
        params = params.append('order_by_type', order_by?.toString());
      } 
      if (sort_by) {
        params = params.append('order_by', sort_by?.toString());
      } 
      if (invoice_uuid) {
        params = params.append('invoice_uuid', invoice_uuid?.toString());
      } 
      if (search) {
        params = params.append('search', search?.toString());
      } 
      if (filter) {
        for (let [key, value] of Object.entries(filter)) {
          params = params.append(key, value?.toString());
        }
      }
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  fetchAllIndividualList({ search = '', page, limit, invoice_uuid = '', start_date = '', end_date = '', filter = '', order_by = '', sort_by = '', status ='' }:
  { search?: string, page?: number, limit?: number, invoice_uuid?: any, end_date?: any, start_date?: any, filter?: any, order_by?: any, sort_by?: any, status?: any }) {
  let url = `/invoice/programs/${this.currentProgram.id}/individual-invoice-list`;
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('status', status);
    
    if (order_by) {
      params = params.append('order_by_type', order_by?.toString());
    } 
    if (sort_by) {
      params = params.append('order_by', sort_by?.toString());
    } 
    if (invoice_uuid) {
      params = params.append('invoice_uuid', invoice_uuid?.toString());
    } 
    if (search) {
      params = params.append('search', search?.toString());
    } 
    if (filter) {
      for (let [key, value] of Object.entries(filter)) {
        params = params.append(key, value?.toString());
      }
    }
  return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
}


  fetchHierarchyObservable() {
    let url: string = `/configurator/programs/${this.currentProgram?.id}/hierarchy`;
    return this.get(url);
  }

  currencyFormat(value) {
    const programDetails = this.storageService?.get(StorageKeys.CURRENT_PROGRAM);
    const accuracy = parseInt(programDetails?.config?.currency?.edit_accuracy);
    return parseFloat(value)?.toFixed(accuracy);
  }

  getPaymentAllocationList({ search = '', page, limit, invoice_uuid = '', start_date = '', end_date = '', filter = '', order_by = '', sort_by = '' }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any, end_date?: any, start_date?: any, filter?: any, order_by?: any, sort_by?: any }) {
    let url = `/invoice/programs/${this.currentProgram.id}/payment-allocation`;
    let params = new HttpParams().set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('invoice_uuid', invoice_uuid);
    if (order_by) {
      params = params.append('order_by_type', order_by.toString());
    }
    if (sort_by) {
      params = params.append('order_by', sort_by.toString());
    }
    if (filter) {
      for (let [key, value] of Object.entries(filter)) {
        params = params.append(key, value.toString());
      }
    }
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  getAllConsolidateInvoiceList(page, limit, history?) {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice`;
    const params = new HttpParams();
    page ?? params.set('page', page.toString());
    limit ?? params.set('limit', limit.toString());
    history ?? params.set('history', history.toString());

    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  createConsoloidatedInvoiceList(payload: any) {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice-queue`;
    return this.post(url, payload).pipe(takeUntil(this.$destroy), shareReplay());
  }

  invoiceTransactionComplete(invoice_id:string, payload: any){
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-transaction-status/${invoice_id}`;
    return this.post(url, payload);
  }


  getConsolidatedInvoiceBasiDetail(invoice_id: string) {
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_id}/detail`;
    return this.get(url);//.pipe(takeUntil(this.$destroy),shareReplay());
  }

  getConsolidateStatus(invoiceId: string) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/consolidate-status/${invoiceId}/get`).pipe(
      takeUntil(this.$destroy));
  }

  cancelConsolidateInvoice(invoiceId: string) {
    return this.put(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/cancel-in-progress`, '')
      .pipe(takeUntil(this.$destroy));
  }

  regenerateConsolidateInvoice(invoiceId: string) {
    return this.put(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/retry-in-progress`, '')
      .pipe(takeUntil(this.$destroy));
  }
  
  getInvoiceConfigDetails(){
    let url = `/invoice/programs/${this.currentProgram.id}/config/get-invoice-config`;
    return this.get(url);
  }

  getClientTabConsolidatedInvoice({ search = '', page = 1, limit = 10, invoice_uuid = '', worker_name = '', invoice_number = '',
    invoice_type = '' }:
    {
      search?: string, page?: number, limit?: number, invoice_uuid?: any, worker_name?: any, invoice_number?: any,
      invoice_type?: any
    }) {
    let params = new HttpParams().set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('worker_name', worker_name.toString())
      .set('invoice_type', invoice_type.toString())
      .set('invoice_number', invoice_number.toString());
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/client`;
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  getVendorTabConsolidatedInvoice({invoice_uuid = '', search = '' }:
    { invoice_uuid?: any, search?: string}) {
      let params = new HttpParams().set('search', search)
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/vendor`;
    return this.get(url,params).pipe(takeUntil(this.$destroy), shareReplay());
  }
  
  getVendorTabConsolidatedInvoiceList({invoice_uuid = "",vendor_uuid = '', page = 1, search = '' , limit = 10}:
    { invoice_uuid?: any, vendor_uuid?: any, page?: number, search?: string, limit?: any}) {
      let params = new HttpParams().set('vendor_uuid', vendor_uuid)
      .set('page', page.toString())
      .set('search', search)
      .set('limit', limit?.toString());;
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/vendor_invoice`;
    return this.get(url,params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  getClientPaymentTabConsolidatedInvoice({ search = '', page = 1, limit = 10, invoice_uuid = '', }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any }) {
    let params = new HttpParams().set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString());
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/client_payment`;
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  getCreditDebitTabConsolidatedInvoice({ search = '', page = 1, limit = 10, invoice_uuid = '', worker_name = '', invoice_number = '', invoice_type = '' }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any, worker_name?: any, invoice_number?: any, invoice_type?: any }) {
    let params = new HttpParams().set('search', search)
      .set('page', page?.toString())
      .set('limit', limit?.toString())
      .set('worker_name', worker_name?.toString())
      .set('invoice_type', invoice_type?.toString())
      .set('invoice_number', invoice_number?.toString());
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/credit_debit`;
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }
  getSupplierPaymentTabConsolidatedInvoice({ search = '', page = 1, limit = 10, invoice_uuid = '', }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any }) {
    let params = new HttpParams().set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString());
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/supplier_payment`;
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay());
  }

  getHistoryTabConsolidatedInvoice({ search = '', page = 1, limit = 10, invoice_uuid = '', }:
    { search?: string, page?: number, limit?: number, invoice_uuid?: any }) {
    let params = new HttpParams().set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString());
    let url = `/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoice_uuid}/tab/history`;
    return this.get(url, params).pipe(takeUntil(this.$destroy), shareReplay(), map(response => {
    response.data.history = response.data.history.map(res => {
    if(res?.impersonated_by?.name )
    res.activity.name  += `(Impersonated by ${res?.impersonated_by?.name} - ${res?.impersonated_by?.role.name} ${res?.impersonated_by?.user_type ? '(' + res?.impersonated_by?.user_type + ')' : ''})`
    return res;
})
    return response}));
  }

  saveConsilidatedInvoiceAuthorization(data) {
    return this.post(`/invoice/programs/${this.currentProgram.id}/payment-allocation`, data)
      .pipe(takeUntil(this.$destroy))
  }

  // getReasonCodeActions() {
  //   return this.get(`/configurator/programs/${this.currentProgram.id}/pages/reason-code-actions`).pipe(takeUntil(this.$destroy));
  // }

  // getReasonCodes(actionId: any) {
  //   return this.get(`/configurator/programs/${this.currentProgram.id}/pages/reason-code-actions/${actionId}/reason-codes`)
  //     .pipe(takeUntil(this.$destroy));
  // }

  // getResonCodeByID(action_code) {
  //   return this.get(`/configurator/programs/${this.currentProgram.id}/pages/reason-code-actions`).pipe(
  //     concatMap(res => {
  //       const action_id = res.reason_code_actions.find(a => a.code === action_code).id;
  //       return this.get(`/configurator/programs/${this.currentProgram.id}/pages/reason-code-actions/${action_id}/reason-codes`)
  //     }),
  //     takeUntil(this.$destroy)
  //     );
  // }

  cancelConfirmConsolidation(status: string, invoiceId: string, cancel_note?: string, cancel_reason?: string) {
    let payload = status === 'confirm' ? { status } : { status, cancel_note, cancel_reason };
    return this.put(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/update-status`,
      payload)
      .pipe(takeUntil(this.$destroy));
  }
  cancelApprovedConsolidation(status: string, invoiceId: string, cancel_note?: string, cancel_reason?: string) {
    let payload = status === 'confirm' ? { status } : { status, cancel_note, cancel_reason };
    return this.put(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/cancel`,
      payload)
      .pipe(takeUntil(this.$destroy));
  }

  getInvoiceDetails(invoice_id: string) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/invoice/${invoice_id}/detail`)
      .pipe(takeUntil(this.$destroy));
  }
  rollbackPaymentAllocation(pa_UUID: string, request: any) {
    return this.put(`/invoice/programs/${this.currentProgram.id}/payment-rollback/${pa_UUID}`, request)
      .pipe(takeUntil(this.$destroy));
  }

  vendorPaymentRollbackAllocation(pa_vendor_UUID: string, request: any) {
    return this.put(`/invoice/programs/${this.currentProgram.id}/vendor-payment-rollback/${pa_vendor_UUID}`, request)
      .pipe(takeUntil(this.$destroy));
  } 

  unsubscribe() {
    this.$destroy.next(true);
    this.$destroy.complete();
  }

  getAllconsolidatedInvoiceList({ history = false, page = 1, limit = 10, status = '', search = '', complete, order_by = '', sort_by = '',start_date = '', end_date = ''}:
    { history: boolean, page: number, limit: number, status: string, search: string, complete?: any, order_by: string, sort_by: string , start_date?: string, end_date?: string }
    = { history: false, page: 1, limit: 10, status: '', search: '', complete: false, order_by: '', sort_by: '', start_date: '', end_date: '' }): Observable<any> {
    this.loading.next(true);
    if (search == null || search == undefined) {
      search = '';
    }
    if (history == true) {
      complete = '';
    }
    let params = new HttpParams()
      //.set('history', history.toString())
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', status.toString())
      .set('search', search.toString())
      .set('complete', complete.toString())
      .set('history', history.toString())
      .set('start_date', start_date.toString())
      .set('end_date', end_date.toString());
    if (order_by) {
      params = params.append('order_by_type', order_by.toString());
    }
    if (sort_by) {
      params = params.append('order_by', sort_by.toString());
    }
    return this.get(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice`, params).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }

  getVendors(invoiceId) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/vendor-list`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }

  getVendorInvoices(invoiceId, vendorId) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/consolidate-invoice/${invoiceId}/tab/vendor?vendor_uuid=${vendorId}&payment_allocation=true`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }

  getPaymentAllowcationDetails(id) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/payment-allocation/${id}/detail`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }


  getWorkerList({ search = '', page = 1, limit = 10, consolidatedInvoiceId = null }:
    { search?: string, page?: number, limit?: number, consolidatedInvoiceId?: any } = { search: '', page: 1, limit: 10, consolidatedInvoiceId: null }): Observable<any> {
    let params = new HttpParams()
      // .set('page', page.toString())
      // .set('limit', limit.toString())
      .set('search', search?.toString());

    if (consolidatedInvoiceId) {
      params = params.set('consolidate', 'true');
      params = params.set('consolidate_uuid', consolidatedInvoiceId);
    }

    return this.get(`/invoice/programs/${this.currentProgram.id}/worker-list`, params).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    )
  }

  getVendorList({ search = '', page = 1, limit = 10, worker_uuid = '', consolidatedInvoiceId = null }:
    { search?: string, page?: number, limit?: number, worker_uuid: string, consolidatedInvoiceId: any } = { search: '', page: 1, limit: 10, worker_uuid: '', consolidatedInvoiceId: null }): Observable<any> {
    let params = new HttpParams()
      // .set('page', page.toString())
      // .set('limit', limit.toString())
      .set('search', search.toString())
      .set('worker_uuid', worker_uuid.toString());

    if (consolidatedInvoiceId) {
      params = params.set('consolidate', 'true');
      params = params.set('consolidate_uuid', consolidatedInvoiceId);
    }

    return this.get(`/invoice/programs/${this.currentProgram.id}/get-vendor`, params);
  }

  getDistinctInvoiceTypes({ vendor_uuid = '', page = 1, limit = 10, worker_uuid = '', search = '', consolidatedInvoiceId = null }
    : { worker_uuid?: string, vendor_uuid?: string, search?: string, page?: number, limit?: number, consolidatedInvoiceId: any }
    = { search: '', page: 1, limit: 10, worker_uuid: '', vendor_uuid: '', consolidatedInvoiceId: null }) {

    let params = new HttpParams()
      // .set('page', page.toString())
      // .set('limit', limit.toString())
      .set('search', search.toString())
      .set('vendor_uuid', vendor_uuid.toString())
      .set('worker_uuid', worker_uuid.toString());

    if (consolidatedInvoiceId) {
      params = params.set('consolidate', 'true');
      params = params.set('consolidate_uuid', consolidatedInvoiceId);
    }
    return this.get(`/invoice/programs/${this.currentProgram.id}/get-distinct-invoice-type`, params);
  }

  getTimeSheetTypes({ search = '', page = 1, limit = 10, worker_uuid = '', vendor_uuid = '', invoice_type = '', consolidatedInvoiceId = null }:
    { search?: string, page?: number, limit?: number, worker_uuid: string, vendor_uuid: string, invoice_type: string, consolidatedInvoiceId: any }
    = { search: '', page: 1, limit: 10, worker_uuid: '', vendor_uuid: '', invoice_type: '', consolidatedInvoiceId: null }) {

    let params = new HttpParams()
      // .set('page', page.toString())
      // .set('limit', limit.toString())
      .set('search', search.toString())
      .set('vendor_uuid', vendor_uuid.toString())
      .set('worker_uuid', worker_uuid.toString())
      .set('invoice_type', invoice_type.toString())

    if (consolidatedInvoiceId) {
      params = params.set('consolidate', 'true');
      params = params.set('consolidate_uuid', consolidatedInvoiceId);
    }


    return this.get(`/invoice/programs/${this.currentProgram.id}/get-invoice-by-type`, params);
  }

  getInvoiceDetailForFlyout(invoiceId: string) {
    let url = `/invoice/programs/${this.currentProgram?.id}/invoice/${invoiceId}/invoice-detail`
    return this.get(url);
  }
  
  saveCreditDebitDetails(data) {
    const url = data.consolidate_uuid ? `/invoice/programs/${this.currentProgram.id}/consolidate/credit-debit` : `/invoice/programs/${this.currentProgram.id}/credit-debit`
    return this.post(url, data);
  }

  createVendorAllocation(data, pa_UUID) {
    return this.post(`/invoice/programs/${this.currentProgram.id}/payment-allocation/${pa_UUID}/vendor-payment-allocation`, data);
  }

  getVoucherDetailes() {
    return this.get(`/invoice/programs/${this.currentProgram.id}/generate-voucher-number`);
  }

  getCreditDebitDetails(id) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/credit-debit-detail/${id}`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }

  getVendorPaymentAllocationDetails(id) {
    return this.get(`/invoice/programs/${this.currentProgram.id}/payment-allocation/${id}/vendor-payment-allocation-details`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }

  getTimesheetBasicInfo(timesheetId) {
    return this.get(`/timesheet/programs/${this.currentProgram?.id}/timesheet/basic/information?${timesheetId ? ('timesheet_uuid=' + timesheetId) : ''}`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }
  downloadInvoiceAsExce(paymentUuid): Observable<any> {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/invoice/programs/${this.currentProgram?.id}/payment-allocation/${paymentUuid}/vendor-payment-file`;
    return this._http.get(url);
  }
  getWorkerDetails(workerid) {
    return this.get(`/assignment/programs/${this.currentProgram?.id}/assignment/candidate/${workerid}`).pipe(
      tap(() => this.loading.next(false)),
      takeUntil(this.$destroy)
    );
  }
  getDefaultDateFormat(){
    return  this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
 }

 downloadInvoiceListReportAsExcel(): Observable<any> {
  let url = `/invoice/programs/${this.currentProgram.id}/invoice-to-consolidate-download?type=auto`;
  return this._http.get(url);
}

getTimesheetNavigationRoute(configData, navigation){
  const layout= navigation?.meta_data?.layout;
  if(layout?.type?.toLowerCase() === "cico" && layout?.duration?.toLowerCase() == "weekly"){
      return '/timesheet/tito/entry';
  }else if(layout?.type?.toLowerCase() === "hours"){
    if(layout?.duration?.toLowerCase() === "weekly"){
      if(layout?.hour_type_calculation?.toLowerCase() === "manual"){
        return `/timesheet/hourly-timesheet/manual`;
      }else if(layout?.hour_type_calculation?.toLowerCase() === "automation"){
        return `/timesheet/hourly-timesheet/automation`;
      }
    }else{
      return `/timesheet/hourly-timesheet/month`;
    }      
  } else if(layout?.type?.toLowerCase() === "days"){
       return `/timesheet/day-timesheet/automation`;    
  } else if ( layout?.duration?.toLowerCase()  === "monthly"){
    return '/timesheet/entry';
  } else {
    return '/timesheet/list';
  }
  /*
  if(navigation.parent_type?.toUpperCase() === 'CICO'){
    return '/timesheet/tito/entry';
  }else if(configData?.work_week_period?.toLowerCase() === TimesheetType?.WEEKLY?.toLowerCase()){
    if(configData?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.MANUAL?.toLowerCase()){
      return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.MANUAL}`;
    }else if(configData?.hour_type_calculation?.toLowerCase() === TimesheetWeeklyType?.AUTOMATIC?.toLowerCase()){
      return `/timesheet/hourly-timesheet/${TimesheetWeeklyType?.AUTOMATIC}`;
    }
  }else if (configData?.work_week_period?.toLowerCase() === TimesheetType.MONTHLY?.toLowerCase()){
    return '/timesheet/entry';
  }
  */
}
}


