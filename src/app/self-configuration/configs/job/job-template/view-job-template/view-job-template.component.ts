import { Component, OnInit } from '@angular/core';
import { Location, TitleCasePipe } from '@angular/common';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { UntypedFormGroup } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import jobTemplateView from './view-job-template.data';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import * as _ from 'lodash';
import { I18NextPipe } from 'angular-i18next';
@Component({
  selector: 'app-view-job-template',
  templateUrl: './view-job-template.component.html',
  styleUrls: ['./view-job-template.component.scss']
})
export class ViewJobTemplateComponent implements OnInit {
showHideText: boolean = false;

  showCondition: boolean = false;
  linkText: string = "Read more";
  textVisibility: boolean = false;
  public modules: any;
  itemRequired: boolean = false;
  arrow:string = "keyboard_arrow_down";
  public jobTemplateForm: UntypedFormGroup;
  public programId: string = "";
  visibility: any;
  isNamePresent: boolean = false;
  jobTemplateInfo: any;
  isSubmitted: boolean = false;
  jobTemplateData: any;
  jobTemplateId: string = "";
  templateTitle: string = "";
  isEdit: boolean = false;
  userRoles: any = [];
  isUserCheckBox: boolean = false;
  userRolesPatch: Array<any> = [];
  isMaxBillRate: boolean = false;
  isbackgroundChecks: any;
  public backgroundcheckData: any = [];
  public backgroundcheckValue: any = [];
  isCheckList: boolean = false;
  public defaultHierarchy: string[] = [];
  selectedIDs: any;
  is_automatic_distribution: boolean = true;
  is_tiered_distribute_schedule: boolean = false;
  is_manual_distribution_job_submit: boolean = false;
  is_automatic_distribute_submit: boolean = true;
  is_automatic_distribute_final_approval: boolean = false;
  qualifications: any = [];
  public selectedQualificationData: any = {};
  patchHierarchies: Array<any> = [];
  btnLoader: boolean = false;
  jobTemplateViewData: any = [];
  constructor(
    private confirmService: ConfirmationDialogService,
    private location: Location,
    private storageService: StorageService,
    private jobService: JobService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private router:SvmsRouterService,
    public commonViewService: CommonViewRuleFlowService,
    private s3UploadService: AwsS3FileUploadService,
    private titlecase: TitleCasePipe,
    private i18NextPipe: I18NextPipe,
  ) { 
  }

  ngOnInit(): void {
    this.jobTemplateViewData = _.cloneDeep(jobTemplateView);
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.jobTemplateId = this.route.snapshot.params['id'];
    if (this.jobTemplateId) {
      this.getJobTemplateDetails(this.jobTemplateId);
    }
    this.init();
  }

  init(){
    if(!this.visibility) {
      setTimeout(() => {
        this.getbackgroundChecks();
      }, 200);
    }
  }

  navigateToEditPage(){
    this.router.navigate(['job', 'job-template', 'create', this.jobTemplateId, 'isedit']);
  }

  showHideFullText() {
    this.textVisibility = !this.textVisibility;
    if(this.linkText === "Read more") {
      this.linkText = "Read less"
    }
    else if(this.linkText === "Read less") {
      this.linkText = "Read more"
    }
  }

  showHideFullLevelText() {
   this.showHideText = !this.showHideText
  }

  //navigating back
  navigateBack() {
    this.confirmService.confirm('', this.i18NextPipe.transform(`are_you_sure_you_want_to_go_back?`),
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.location.back();
        }
      })
  }


  //get template details for edit
  getJobTemplateDetails(id) {
    let _url = `/job-manager/programs/${this.programId}/job-templates/${id}`;
    this.jobService.get(_url).subscribe({
      next: (data:any) => {
      if (data?.job_template) {
        this.isSubmitted = true;
        this.jobTemplateData = data?.job_template;
        let actionUserData: any = (this.jobTemplateData?.modified_by || this.jobTemplateData?.created_by);
        if(actionUserData) {
          const { first_name, last_name } = actionUserData;
          this.jobTemplateData.username = [first_name,last_name].join(' ');
        }

        if(this.jobTemplateData?.is_automatic_distribution){
          this.jobTemplateData['distributionType'] ='automatic_distribution'
        }else if(this.jobTemplateData?.is_tiered_distribute_schedule){
         this.jobTemplateData['distributionType'] ='tiered_distribution_schedule'
        }else if(this.jobTemplateData?.is_manual_distribution_job_submit) {
         this.jobTemplateData['distributionType'] ='manual_distribution_after_job_submit'

        }
        if(this.jobTemplateData?.is_automatic_distribute_submit){
          this.jobTemplateData['distributionMethod']='distribute_upon_submit';
        }else if(this.jobTemplateData?.is_automatic_distribute_final_approval) {
          this.jobTemplateData['distributionMethod']='distribute_upon_final_approval';
        } else {
          this.jobTemplateData['distributionMethod'] = '--';
        }
        this.selectedIDs = new Array();
        this.jobTemplateData?.hierarchy?.forEach(jh => {
          this.selectedIDs.push(jh?.id);
        });
        this.patchHierarchies = [...this.selectedIDs];
        if (this.selectedIDs) {
          this.defaultHierarchy = this.selectedIDs;
        }
        if(!this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.job_type) {
          const subMenu = this.jobTemplateViewData[6].submenuItem;
          subMenu.pop();
        }
        else{
          this.getJobType();
        }
        this.patchTemplateData();
      }
    }, 
    error: (err) => {
      this.alertService.error(errorHandler(err));
    }});
  }

  // patching the data for edit or view
  patchTemplateData() {
    this.isUserCheckBox = this.jobTemplateData?.is_description_editable;
    this.templateTitle = this.jobTemplateData?.template_name;
    if(this.isUserCheckBox){
      this.userRolesPatch = [...this.jobTemplateData?.user_roles];
    }
    this.isbackgroundChecks = this.jobTemplateData?.is_background_check;
    this.isMaxBillRate = this.jobTemplateData?.is_submission_exceed_max_bill_rate ?? false;
    this.isCheckList = this.jobTemplateData?.is_onboarding_checklist;
    
    if(Array.isArray(this.jobTemplateData?.rates)) {
      this.jobTemplateData?.rates?.forEach((element: any) => {
        element.name = element?.name || element?.rate_factor;
      });
    }
    this.updateQualification();
    this.updateDefaultFDFields();
    this.is_automatic_distribution = this.jobTemplateData?.is_automatic_distribution;
    this.is_tiered_distribute_schedule = this.jobTemplateData?.is_tiered_distribute_schedule;
    this.is_manual_distribution_job_submit = this.jobTemplateData?.is_manual_distribution_job_submit;
    this.is_automatic_distribute_submit = this.jobTemplateData?.is_automatic_distribute_submit;
    this.is_automatic_distribute_final_approval = this.jobTemplateData?.is_automatic_distribute_final_approval;
    const industry = this.jobTemplateData?.program_industry;
    if (industry && Array.isArray(industry) && industry.length) {
      this.jobTemplateForm?.patchValue({
        program_industry: industry[0]?.id
      });
    }
    setTimeout(() => {
      this.getbackgroundChecks();
    }, 200);
  }

  getbackgroundChecks() {
    this.backgroundcheckValue = [];
    const _url = `/configurator/programs/${this.programId}}/background-checklists/required-criterias`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        if(data && data?.required_criterias && data?.required_criterias?.length > 0) {
        this.backgroundcheckData = data?.required_criterias?.filter(b=>b.is_enabled);
        this.backgroundcheckData?.forEach(c => {
          if(Array.isArray(this.jobTemplateData?.background_check_list)) {
            this.jobTemplateData?.background_check_list.forEach(bg => {
              if(bg == c.id){
                this.backgroundcheckValue.push(c.name)
              }
            });
          }

          if(Array.isArray(this.jobTemplateData?.background_check_list)){
            const isCheck = this.jobTemplateData?.background_check_list?.some( b => b === c?.id);
            if(isCheck) {
              c.is_enabled = true;
            } else {
              c.is_enabled = false;
            }
          } else {
            c.is_enabled = false;
          }
        });
      }
    });
  }

  updateQualification() {
    let subMenu = this.jobTemplateViewData[1].submenuItem;
    this.jobTemplateData?.qualification_types?.forEach(q => {
      const values = [];
      //label here refers to qualification_type label as we need to check the label and then show on ui
      const q_type_name = q?.name || q?.qualifications?.[0]?.qualification_type?.name;
      q?.qualifications?.forEach((res)=>{
        values.push({label: q_type_name,name:res?.name})
      })

      const sub_menu_label_obj = {
        label: q_type_name,
        value:'qualification'
      }
      this.jobTemplateData[q_type_name] = values;
      subMenu = [sub_menu_label_obj,...subMenu];
    });
    this.jobTemplateViewData[1].submenuItem = [...subMenu];
  }

  updateDefaultFDFields() {
    let subMenu = this.jobTemplateViewData[2].submenuItem;
    this.jobTemplateData?.foundational_data?.forEach((fd) => {
      const values = [];
      const fd_type_name = fd?.name;

      values.push({
        label: fd_type_name,
        name: fd?.foundation_data?.[0]?.name + ' - ' + fd?.foundation_data?.[0]?.code
      })

      const sub_menu_label_obj = {
        label: fd_type_name,
        value: 'default_fields'
      }
      this.jobTemplateData[fd_type_name] = values;
      subMenu.push(sub_menu_label_obj);
    });
  }


  downloadS3Attachment(file: any) {
    if (file && file?.name && file?.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  getJobType(){
    if(this.jobTemplateData?.job_type?.length){
        let url=`/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc`
        this.jobService.get(url).subscribe({
          next:(data:any)=>{
            this.jobTemplateData.job_type= data?.picklist_items?.filter((type)=>{
              return this.jobTemplateData?.job_type?.some((val)=>val===type?.value);
            })?.map((type)=>type?.label)?.join(', ');
          },
          error:(err:any)=>{
            this.jobTemplateData.job_type= this.jobTemplateData?.job_type?.map((type)=>this.titlecase.transform(type)).join(', '); 
          }
        })
    }
    else{
      this.jobTemplateData.job_type="--"
    }
  }

}

