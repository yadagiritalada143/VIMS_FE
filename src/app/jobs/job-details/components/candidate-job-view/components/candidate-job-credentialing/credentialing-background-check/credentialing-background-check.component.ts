import { Component, OnInit, EventEmitter } from '@angular/core';
import { JobDetailsService } from '../../../../../job-details.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ActivatedRoute, } from '@angular/router';
import { JobService } from '../../../../../../job.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-credentialing-background-check',
  templateUrl: './credentialing-background-check.component.html',
  styleUrls: ['./credentialing-background-check.component.scss']
})
export class CredentialingBackgroundCheckComponent implements OnInit {
  closePanel: EventEmitter<boolean> = new EventEmitter();
  public dataLoading = false;
  public programId: any;
  public jobId: any;
  public candidate_Id: any;
  public backgroundCheckObject: any = {};
  isShowBackgroungCheck: boolean = false;
  isCreateCandidate = 'hidden';
  backgroundCheckListData: any = {};
  tableLoaded: boolean;
  checkList: any = [];
  criterias: any = [];
  oldUploadfileArr = [];
  newUploadfileArr = [];
  fileupdate = false;
  newfiles = [];
  public user_type = '';
  markAsCompleted: any = {};
  isShowActions: boolean = false;
  result_status: any;
  index: any;
  is_completed: any = false;
  is_override_background_check: boolean = false;
  requiredCriteria: any;
  is_show_complete: boolean = false;
  supportedFileTypes= ['pdf','doc','docx','png','jpg','jpeg','csv','xlsx','xls','txt'];
  uploadErrorMessage = "Error : File type is not supported. Please upload the documents either in .png, .jpg, .pdf, .doc ,.csv, .xls, .txt format";
  allowedMessage = "Only .png, .jpg, .pdf, .doc, .csv, .xls, .txt files with maximum size of 10 MB";
  checkbox: any = {};
  checkIndex: any;
  user: any = {};
  fileUploadData: any[];
  isLoader: boolean;
  fileUrl: any;
  filedata: any = {};
  isVendorAndSuperOrg: boolean;
  constructor(private jobDetailService: JobDetailsService,
    private _alert: AlertService,
    private _loader: LoaderService,
    public storageService: StorageService,
    private route: ActivatedRoute,
    public jobService: JobService,
    public confirmService: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get('PROGRAM_ID');
    this.user_type = this.storageService.get('user_type');
    this.user = this.storageService.get('user');
    this.route.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.candidate_Id = params['candidateId'];
      this.getRequireID();
      this.getbackgroundChecklist();
    });
    if (this.user_type == 'VENDOR' || this.user_type == 'SUPER_ORG') {
      this.isVendorAndSuperOrg = true;
    } else {
      this.isVendorAndSuperOrg = false;
    }

  }
  passedValue(value, checklist, i) {
    this.checkIndex = i;
    if (value) {
      this.result_status = value;
    } else {
      this.result_status = '';
    }
    this.criterias = new Array();
    this.criterias?.push({ required_criteria_id: checklist.id, check_status: "COMPLETED", result_status: checklist.resultStatusValue });
    this.updateBackgroundCheckList();
  }

  checkCompleted(e, i) {
    this.checkList.forEach(element => {
      if (element.check_status == 'PENDING') {
        element.value = false;
      }
    });
    if (e) {
      this.index = i
      this.isShowActions = e;
      this.checkList[i].value = true;
    } else {
      this.isShowActions = false;
      this.index = undefined;
    }
  }
  changeValue(e) {
    if (e) {
      this.isShowBackgroungCheck = e;
      this.backgroundCheckListData.is_required = e;
    } else {
      this.isShowBackgroungCheck = false;
      this.backgroundCheckListData.is_required = false;
    }
    this.updateBackgroundCheckList();
  }
  completedValue(e) {
    this.is_completed = e;
    this.updateMarkAsComplete();
  }
  updateMarkAsComplete() {
    let payLoad;
    if (this.is_completed) {
      payLoad = {
        is_completed: this.is_completed
      }
    } else {
      payLoad = {
        is_completed: false
      }
    }
    let url = `/onboarding-manager/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/onboarding/background-checklists`;
    this.jobService.put(url, payLoad).subscribe({
      next: (res: any) => {
      this._alert.success('Background check list is updated');
      this.isShowActions = false;
      this.getbackgroundChecklist();
      this.criterias = new Array();
    },
    error: (error) => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
      this.dataLoading = false;
      this.isShowActions = true;
      this.checkList[this.checkIndex].resultStatusValue = undefined;
      this.result_status = '';
    }});
  }
  overRideCheckValue(e) {
    this.is_override_background_check = e;
    this.confirmService.confirm('', `Are you sure you want to active this ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.updateBackgroundCheckList();
        } else {
          this.is_override_background_check = false;
        }
      })
  }

  openCreateCandidate() {
    this.isCreateCandidate = 'visible';
  }
  onCreateClose() {
    this.isCreateCandidate = 'hidden';
  }
  candidate(event) {
  }
  getRequireID(pageNo = 1) {
    this._loader.hide();
    this.dataLoading = true;
    let url = `/configurator/programs/${this.programId}/background-checklists/required-criterias`;
    this.jobDetailService.get(url)
      .subscribe({
       next: (data: any) => {
          if (data && data.required_criterias) {
            this.requiredCriteria = data.required_criterias;
            this.updateList();
          }
          this._loader.hide();
        },
       error: (err) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
  });
  }
  getbackgroundChecklist(pageNo = 1) {
    this._loader.show();
    this.dataLoading = true;
    let url = `/onboarding-manager/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/onboarding/background-checklists`
    this.jobDetailService.get(url)
      .subscribe({
        next: (data: any) => {
          this._loader.hide();
          if (data && data?.background_checklist) {
            this.backgroundCheckListData = data.background_checklist;
            this.isShowBackgroungCheck = this.backgroundCheckListData.is_required;
            if(data?.background_checklist?.files?.url && data?.background_checklist?.files?.file_name) {
              this.newUploadfileArr[0] = data?.background_checklist?.files;
            }
            this.fileUrl = data?.background_checklist?.files?.url;
            if (this.backgroundCheckListData.is_required) {
              this.updateList();
            } else {
              this.updateList();
            }
            this.checkList = data.background_checklist.required_criterias
            this.is_override_background_check = data.background_checklist.is_override_background_check;
            this.is_completed = data.background_checklist.is_completed;
          } else {
          }
          this._loader.hide();
        },
       error: (err) => {
          this._loader.hide();
          // this._alert.error(errorHandler(err));
        }
  });
  }
  updateList() {
    this.requiredCriteria?.forEach(element => {
      this.backgroundCheckListData?.required_criterias?.forEach(data => {
        if (element.name === data?.criteria && data?.is_required) {
          element.isChecked = true;
        }
      });
    });
  }
  getValue(value, backCheck) {
    if (backCheck) {
      this.criterias = new Array();
      this.criterias?.push({ required_criteria_id: backCheck.id, is_required: value })
    } else {
      // let index = this.criterias.findIndex(x => x.id === backCheck.id);
      // this.criterias.splice(index, 1);
    }
    this.updateBackgroundCheckList();
  }
  uploadFiles(event) {
    this.fileupdate = true
    if (event) {
      event.forEach(element => {
      this.filedata.file_name = element?.name
      this.filedata.raw = element?.raw
      })
    }
    this.newfiles = this.filedata;
  }

  updateoldFiles(event) {
    this.oldUploadfileArr = event;
    let filedata = [];
    event.forEach(element => {
      if (element?.id) {
        filedata.push({
          file_name: element?.filename,
          id: element?.id,
          url: element?.url,
        })
      }
    })
    if (this.newfiles && this.newfiles.length > 0) {
      filedata = [...this.newfiles];
    }
  }
  downloadAttachment(data) {
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    } else {
      this._alert.error('File Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }
  uploadFile() {
    this.isLoader = true;
    let payLoad = {
      is_required: true,
      files: this.filedata
    }
    let url = `/onboarding-manager/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/onboarding/background-checklists/uploads`;
    this.jobService.put(url, payLoad).subscribe({
      next: (res: any) => {
      if(res?.background_check?.files?.url && res?.background_check?.files?.file_name) {
        this.newUploadfileArr[0] = res?.background_check?.files;
     }
      this.fileUrl = res?.background_check?.files?.url;
      this.isLoader = false;
      this._alert.success('File Uploaded successfully.');
      this.filedata = {};
      this.isShowActions = false;
      this.getbackgroundChecklist();
      this.criterias = new Array();
    }, 
    error: (error) => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
      this.isLoader = false;
      this.dataLoading = false;
      this.isShowActions = true;
      // this.checkList[this.checkIndex].resultStatusValue = undefined;
      this.result_status = '';
    }});
  }

  updateBackgroundCheckList() {
    let payLoad:any= {
      is_required: this.isShowBackgroungCheck,
      // criterias: []
    }
    if (this.criterias && this.criterias.length > 0) {
      if(this.user_type =='VENDOR' || this.user_type == 'SUPER_ORG'){
        payLoad = {
          criterias: this.criterias,
        }
        payLoad.criterias.map(m => {
          if(!m.check_status){
            payLoad.is_required = this.isShowBackgroungCheck;
          }
          return;
        })
      } else{
        payLoad = {
          is_required: this.isShowBackgroungCheck,
          criterias: this.criterias
        }
      }

    } else {
      if (this.is_override_background_check) {
        payLoad = {
          is_override_background_check: this.is_override_background_check
        }
      }
    }
    let url = `/onboarding-manager/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.candidate_Id}/onboarding/background-checklists`;
    this.jobService.put(url, payLoad).subscribe({
      next: (res) => {
      this._alert.success('Background check list is updated');
      this.isShowActions = false;
      this.getbackgroundChecklist();
      this.criterias = new Array();
    }, 
    error: (error) => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
      this.dataLoading = false;
      this.isShowActions = true;
      this.checkList[this.checkIndex].resultStatusValue = undefined;
      this.result_status = '';
    }});
  }
}
