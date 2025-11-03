import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { ProgramConfig } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendor-compliance-document-groups-create',
  templateUrl: './vendor-compliance-document-groups-create.component.html',
  styleUrls: ['./vendor-compliance-document-groups-create.component.scss']
})
export class VendorComplianceDocumentGroupsCreateComponent implements OnInit {
  public titleToggle = {
    title: 'active',
    value: true
  };
  selectDocuments: boolean = false;
  documentList: any = [];
  documentLists: any = [];
  updatedLists:any = [];
  searchText: any;
  selectedDocument: any = [];
  public clientId: string;
  public programId: string;
  private subscriptions: Subscription[] = [];
  groupName:string;
  description:string;
  public isUpdateReq: boolean = false;
  public toUpdateItemId: any;
  sortDir = 1;//1= 'ASE' -1= DSC
  public title='Create New Vendor Compliance Document Group'
  constructor(private router : SvmsRouterService,
    private storageService: StorageService,
    private vendorService: VendorService,
    private alertService: AlertService,
    private loader: LoaderService,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    let programDetails = this.storageService.get(ProgramConfig[0]);
    programDetails = JSON.parse(programDetails);
    if (programDetails) {
      this.clientId = programDetails.clientId;
      this.programId = programDetails.program_req_id;
    }
    this.getRequiredDocuments();
    setTimeout(()=> {
      this.activatedRoute.queryParams.subscribe(params => {
        let id = params['id'];
        if(id){
          this.title='Update Vendor Compliance Document Group'
          this.isUpdateReq = true;
          this.toUpdateItemId = id;
          this.getVendorDocumentDetails(id);
        }
      });
    },800)
     
   
  }
  backClicked() {
    this.router.navigate(['vendor', 'vendor-document-group-list']);
  }
  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
      this.titleToggle.title = 'inactive';
    } else {
      this.titleToggle.value = true;
      this.titleToggle.title = 'active';
    }
  }

  // addNewDocuments() {
  //   this.selectDocuments = true;
  // }

  sidebarClose() {
    this.selectDocuments = false;
  }
  getRequiredDocuments() {
    this.subscriptions.push(this.vendorService.get(`/configurator/programs/${this.programId}/vendor-compliance/required-documents`).subscribe((data:any) => {
      data?.required_documents.forEach(item => {
        if (item.is_enabled) {
          this.documentList.push(
            {
              id: item.id,
              name: item.name,
              selected: false
            },
          );
        }
        this.documentLists = this.documentList
        this.updatedLists = [...this.documentLists];
      });
    }, error => {
      this.alertService.error(errorHandler(error));
    }));
  }

  getVendorDocumentDetails(id) {
    this.selectedDocument = [];
    const url = `/configurator/programs/${this.programId}/vendor-compliance/required-document-groups/${id}`;
    this.vendorService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.groupName = data?.required_document_group?.name;
            this.description = data?.required_document_group?.description;
            this.titleToggle.value = data?.required_document_group?.is_enabled
            this.documentList.forEach(list => {
              data?.required_document_group?.required_documents.forEach(listId => {
                if(list?.id == listId.id){
                  list.selected = true;
                  this.selectedDocument.push(list.name)
                }
              })
            })
          }
        }, error: (error: Error | any) => {
          this.alertService.error(errorHandler(error), {});
        }
      }
    );
  }
  onChange(value:any){
    let exist = this.selectedDocument.filter(n => n == value);
    if(exist.length == 0){
    this.selectedDocument.push(value);
    }else {
     let index = this.selectedDocument.indexOf(value)
     if (index > -1) { 
      this.selectedDocument.splice(index, 1);
    }
    }
  }

  deleteSelectedDocument(document){
   this.documentList.filter(n => n.name == document.name).map(n => n.selected = false)
   let index = this.selectedDocument.indexOf(document.name)
   if (index > -1) { 
    this.selectedDocument.splice(index, 1);
   }
  }
  filterArray(){
    if(!this.searchText){
    this.documentList = this.updatedLists;
    return;
    }
    if(this.searchText){
      this.documentList = []
    this.updatedLists.forEach(list => {
    if(list?.name.toLowerCase().includes(this.searchText.toLowerCase())){
      this.documentList.push(list)
    }
    })
    }
  }
  addDocument() {
    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails[ProgramConfig[3]];
    const documentIds = [];
    this.documentList.forEach(item => {
      if (item.selected) {
        documentIds.push(item.id);
      }
    });
    const payload = {
      name: this.groupName,
      description: this.description ?? '',
      documents: documentIds,
      is_enabled: this.titleToggle.value
    };

    // if (payload.documents.length < 1) {
    //   this.alertService.error(`Please select documents.`);
    //   return;
    // }
    if (!this.groupName) {
      this.alertService.error(`Please fill the Group Name.`);
      return;
    }
    if (this.isUpdateReq) {
      this.subscriptions.push(this.vendorService.put(
        `/configurator/programs/${programId}/vendor-compliance/required-document-groups/${this.toUpdateItemId}`,
        payload)
        .subscribe(
          (data:any) => {
            if (data) {
            this.alertService.success(`You have updated Document group successfully.`);
            this.groupName='';
            this.description = ''
            this.selectedDocument = [];
            this.router.navigate(['vendor', 'vendor-document-group-view'], {
              queryParams: {
                id: data?.id
              }
            });
              // this.selectedVendorComplianceGroup = '';
              // this.sidebarClose();
              this.loader.hide();
              // this.isSaveLoader = false;

            }
          },
          (err) => {
            this.loader.hide();
            // this.isSaveLoader = false;
            this.alertService.error(errorHandler(err));
          }));
    } else {
      this.subscriptions.push(this.vendorService.post(`/configurator/programs/${programId}/vendor-compliance/required-document-groups`, payload).subscribe(
        (data: any) => {
          if (data) {
            this.alertService.success(`You have added Document group successfully.`);
            this.groupName='';
            this.description = ''
            this.selectedDocument = [];
            // this.sidebarClose();
            this.router.navigate(['vendor', 'vendor-document-group-view'], {
              queryParams: {
                id: data?.id
              }
            });
            
            this.loader.hide();
            // this.isSaveLoader = false;
          }
        },
        (err) => {
          this.loader.hide();
          // this.isSaveLoader = false;
          this.alertService.error(errorHandler(err));
        }));
    }
  }

  // sorting 
  onSortDocument(sortType) {
    if (sortType == 'desc') {
      this.sortDir=-1;
    } else {
      this.sortDir=1;
    }
    this.sortArr('name');
  }

  sortArr(colName:any){
    this.documentList.sort((a,b)=>{
      a= a[colName].toLowerCase();
      b= b[colName].toLowerCase();
      return a.localeCompare(b) * this.sortDir;
    });
  }
  omit_special_char(event)
{   
   var k;  
   k = event.charCode;  //         k = event.keyCode;  (Both can be used)
   return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57)); 
}
}
