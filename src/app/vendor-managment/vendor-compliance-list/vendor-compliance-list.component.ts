import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../shared/util/error-handler';
@Component({
  selector: 'app-vendor-compliance-list',
  templateUrl: './vendor-compliance-list.component.html'
})
export class VendorComplianceListComponent implements OnInit {

  vmsData = []
  itemPerPage = 10;
  currentPage = 1;
  totalRecords = 0;
  filterLocationIds: any[] = [];
  filterStatus: any[] = [];
  documentList: any[] = [];
  public input$ = new Subject<string | null>();
  tableConfig: VMSConfig = {
    title: 'Program Compliance',
    columnList: [
      { name: 'name', title: 'Document', width: 20, enableClick: true, isIcon: false, icon: 'expand_more', isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
      { name: 'work_locations', title: 'Location', width: 20, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false },
      { name: 'frequency', title: 'Frequency', width: 20, isIcon: false, isImage: false, isContact: false, isNoOption: false, isNumberBadge: false },
      { name: 'uploaded_document.modified_on', title: 'Last Updated', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'uploaded_document.expiry_on', title: 'Expiration Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'uploaded_document.next_expiry_on', title: 'Next update due', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
      { name: 'status', title: 'Compliance status', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, hideBadege: true, showTitleCase: true },
      { name: 'uploaded_document.complied_by.first_name', title: 'Compliance verified', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
    ],
    sortOptions: [
      { title: 'Last Updated', key: 'update' }
    ],
    tabsList: [],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSort: false,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Create new',
    density: 'COMFORTABLE',
    tableWidth: '100%',
    permission: 'upload_compliance_doc'
  };

  uploadedStatus = true;
  orgId: any;
  programId: any;
  program: any;
  userType: any;
  hasUploadStatus = false;
  complianceGroupId;
  searchString;
  monthNames = ["jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"];
  selectedMonth;
  selectedYear;
  constructor(private alertService: AlertService, private loader: LoaderService, public storageService: StorageService, private programService: ProgramService, private route: ActivatedRoute, private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.userType = this.storageService.get('user_type');
    this.route.queryParamMap.subscribe(res => {
      this.programId = this.route.snapshot.params['progId'];
      this.orgId = this.route.snapshot.params['orgId'];
      const queryParamMap: any = this.route.snapshot['queryParams'];
      this.hasUploadStatus = queryParamMap.hasOwnProperty('is_uploaded');
      this.uploadedStatus = queryParamMap['is_uploaded'] === 'true';
      this.tableConfig.isCreate = this.userType !== 'VENDOR';
      this.tableConfig = { ...this.tableConfig };
      this.tableConfig.isMonthYearFilter = true;
      this.loadVendorDetail();
      this.loadProgramDetail();

      this.tableConfig.advanceFilter = [
        {
          name: 'work_location_ids',
          title: 'Work Location',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.input$,
          changeHandler: this.getLocation
        },
        {
          name: 'compliant_status',
          title: 'Compliant Status',
          filterType: 'MULTISELECT',
          multiSelectData: [
            {  value: 'PENDING', name: 'PENDING'  },
            {  value: 'COMPLIANT', name: 'COMPLIANT'  },
            {  value: 'NON-COMPLIANT', name: 'NON-COMPLIANT'  },
            {  value: 'NOT-APPLICABLE', name: 'NOT-APPLICABLE'  }
          ]
        }
      ]
      this.getLocation();
    })

  }

  onClose() {
    this.loadComplianceDocs();
  }

  onOptionClicked(event) {
    if (event.name === 'name') {
      this.eventStream.emit(new EmitEvent(Events.SHOW_COMPLIANCE, event.vmsData));
    }
  }

  loadProgramDetail() {
    this.programService.get(`/configurator/programs/${this.programId}`)
      .subscribe((res: any) => {
        const { program } = res;
        this.program = program;
        if (this.userType === 'VENDOR') {
          this.tableConfig.title = program?.name + ' Compliance Documents';
        }
        this.tableConfig = { ...this.tableConfig };

      })
  }

  loadVendorDetail() {
    let url = `/configurator/programs/${this.programId}/vendors/${this.orgId}`;
    this.programService.get(url)
      .subscribe((res: any) => {
        const { program_vendor } = res;
        if (this.userType !== 'VENDOR') {
          this.tableConfig.title = program_vendor?.vendor?.name + ' Compliance Documents';
        }
        this.complianceGroupId = program_vendor?.compliance_document_group?.id;
        this.loadComplianceDocs();
      })
  }


  loadComplianceDocs() {
    if (!this.complianceGroupId) {
      return;
    }
    this.loader.show();
    let url = `/configurator/programs/${this.programId}/vendor-compliance/required-documents?vendor_id=${this.orgId}` +
      `&limit=${this.itemPerPage}&page=${this.currentPage}&added_to_group=true&required_document_group_id=${this.complianceGroupId}`;
    if (this.hasUploadStatus) {
      url += `&is_uploaded=${this.uploadedStatus}`;
    }

    if (this.filterLocationIds && this.filterLocationIds.length > 0) {
      url += `&work_location_ids=${this.filterLocationIds.join(',')}`;
    }

    if (this.filterStatus && this.filterStatus.length > 0) {
      url += `&compliant_status=${this.filterStatus.join(',')}`;
    }

    if (this.searchString) {
      url += `&k=${this.searchString}`;
    }

    if (this.sortByModified) {
      url += `&ordering=-modified_on`;
    } else {
      url += `&ordering=modified_on`;
    }

    const compliance = this.storageService.get(StorageKeys?.CURRENT_PROGRAM)?.config?.compliance;
    if(compliance?.is_allow){
     if(compliance?.options?.month){
       if(this.selectedMonth){
         url += `&time=${this.selectedMonth}`;
       }else{
         url += `&time=${this.monthNames[(new Date).getMonth()]}`;      
       }    
     } 
     
     if(compliance?.options?.year){
      if(this.selectedYear){
        url += `_${this.selectedYear}`;
      }else{
        url += `_${(new Date()).getFullYear()}`;
      }
     } 
    }

    this.programService.get(url)
      .subscribe({
        next: (data: any) => {
          let { required_documents, items_per_page, total_records } = data;
          required_documents = required_documents.map(doc => {
            doc.status = doc?.uploaded_document ? doc?.uploaded_document?.status : 'PENDING';
            doc.work_locations = (doc.work_locations && doc.work_locations.length > 0) ? doc.work_locations.map(wLoc => wLoc.name).join(',') : null
            return doc;
          });


          required_documents.forEach(doc => {
            if (doc?.uploaded_document?.complied_by?.first_name) {
              doc.uploaded_document.complied_by.first_name = doc?.uploaded_document?.complied_by?.first_name + ' ' + (doc?.uploaded_document?.complied_by?.last_name ? doc?.uploaded_document?.complied_by?.last_name : '')
            }
          });
          this.totalRecords = total_records;
          this.itemPerPage = items_per_page;
          this.vmsData = required_documents;
          this.loader.hide();
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
          this.loader.hide();
        }
      }
    );
  }

  monthChangeClick(event){
    this.selectedMonth = event
    this.loadComplianceDocs();
  }
  
  yearChangeClick(event){
    this.selectedYear = event
    this.loadComplianceDocs();
  }

  onUpdateClicked(event) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_COMPLIANCE, event))
  }

  onCreateClick(event) {
    this.eventStream.emit(new EmitEvent(Events.UPLOAD_NEW_COMPLIANCE));
  }
  onClickView(event) {

  }

  onListFilter(event) {
    this.currentPage = 1;
    this.filterLocationIds = (event && event.hasOwnProperty('work_location_ids')) ? event['work_location_ids'] : [];
    this.filterStatus = (event && event.hasOwnProperty('compliant_status')) ? event['compliant_status'] : [];
    this.loadComplianceDocs();
  }

  onSearch(event) {
    this.searchString = event;
    this.currentPage = 1;
    this.loadComplianceDocs();
  }

  sortByModified = false;
  onSortClick(event) {
    this.sortByModified = event.name == 'update';
    this.loadComplianceDocs();
  }

  onChangeRecords(event){
    this.itemPerPage = event;
    this.loadComplianceDocs();
  }

  onPaginationClick(event) {
    this.currentPage = event;
    this.loadComplianceDocs();
  }

  getLocation = (term = '') => {
    let url = `/configurator/programs/${this.programId}/work-locations`;
    if (term) {
      url += `?k=${term}`;
    }
    this.programService.get(url)
      .pipe(
        map((res: any) => {
          return res?.work_locations?.map((location: any) => {
            return { value: location?.id, name: location?.name };
          })
        })
      )
      .subscribe((res: any) => { 
        this.tableConfig.advanceFilter[0].multiSelectData = res; 
      }
    )
  }
}
