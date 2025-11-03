import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Location } from '@angular/common';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { JobService } from 'src/app/jobs/job.service';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { jobUserType } from '../../jobs.enum';
import * as _ from 'lodash';
import { I18NextPipe } from 'angular-i18next';
@Component({
  selector: 'app-create-job-templates',
  templateUrl: './create-job-templates.component.html',
  styleUrls: ['./create-job-templates.component.scss']
})
export class CreateJobTemplatesComponent implements OnInit, OnDestroy {
  public modules: any;
  itemRequired: boolean = false;
  arrow:string = "keyboard_arrow_down";
  iscollapse: boolean = false;
  distributionType: string = 'automatic_distribution';
  distributionMethod: string ='automatic_distribution_upon_submit';
  public jobTemplateForm: UntypedFormGroup;
  public programId: string = "";
  visibility: any;
  isNamePresent: boolean = false;
  jobTemplateInfo: any;
  isSubmitted: boolean = false;
  jobTemplateData: any;
  jobTemplateId: string = "";
  templateTitle: string = "Create";
  jobCategoryData: any;
  jobCredentialsData: any;
  isEdit: boolean = false;
  public industries: any = [];
  public Page = 1;
  public itemPerPage: number = 25;
  userRoles: any = [];
  isUserCheckBox: boolean = false;
  userRolesPatch: Array<any> = [];
  isMaxBillRate: boolean = false;
  // isbackgroundChecks: any;
  // public backgroundcheckData: any = [];
  isCheckList: boolean = false;
  checkListData: Array<any> = [];
  btnLoader: boolean = false;
  public hierarchyData = [];
  public defaultHierarchy: string[] = [];
  public userAssociateHierarchy: string[] = [];
  public selectedHierarchyLevel: any = {};
  selectedIDs: any;
  rateFactor: any;
  rateFactorInvalid: boolean = false;
  is_automatic_distribution: boolean = false;
  is_tiered_distribute_schedule: boolean = false;
  is_manual_distribution_job_submit: boolean = false;
  is_automatic_distribute_submit: boolean = true;
  is_automatic_distribute_final_approval: boolean = false;
  distributionScheduleList: any;
  selectedSchedule: any;
  vendorsList: any = [];
  vendorSearchList = false;
  subscriptions: Array <Subscription> = [];
  isEditHierarchy: boolean = false;
  patchHierarchies: Array<any> = [];
  qualification_types:Array<any> = [];
  qualification_types_selected:Array<any> = [];
  qualification_types_selected_data:Array<any> = [];
  remove_qualification_types_selected = new Set();
  searchtermQualification;
  addQualificationVisibility = false;
  allowExpense = true;
  allowExpenseEdit = true;

  // file uploader
  public quillInputTxt;
  public isJobParsingDone = false;
  public prevJobDescData;
  jdParsingFile: any = {};

  // foundational data
  templateFoundationalData = {
    modal_visible: false,
    foundational_data_type_array: [],
    foundational_data_type_search_results: [],
    search_qualification_type: ''
  };

  //subjects
  templateName = new Subject<string>();
  usersearchCategory = new Subject<string>();
  programIndustries = new Subject<string>();
  ratecardsearch = new Subject<string>();
  qualificationSearch = new Subject<any>();
  qualificationValuesSearch = new Subject<any>();
  fdValuesSearchValues = new Subject<any>();

  // resume mandatory
  isResumeMandatory:boolean = true;
  showResumeField:boolean = false;

  // job type
  showJobType:boolean = false;
  jobTypeItems:Array<any> = [];
  isDistributionSet = false;
  vendorsScheduled = {};
  vendorGroupScheduled = {};
  previousDistributionSchedule;
  constructor(
    private confirmService: ConfirmationDialogService,
    private location: Location,
    private fb: UntypedFormBuilder,
    private storageService: StorageService,
    private jobService: JobService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private sortPipe: SortHelperPipe,
    private loaderService: LoaderService,
    private svmsRouter: SvmsRouterService,
    private changeDetection: ChangeDetectorRef,
    private i18NextPipe: I18NextPipe,
  ) { 
    this.modules = {
      'toolbar': [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote'],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ]
    }
  }
  
  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.initializeForm();
    this.subscriptions.push(
    this.templateName.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe((value: any) => {
        if (value) {
          this.checkNameExist(value);
        }
      })
    );
      
    this.subscriptions.push(
    this.usersearchCategory.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe((value: any) => {
        if (value) {
          this.searchCategoryAndTitle(value.term);
        }
      })
    );

    this.subscriptions.push(
    this.programIndustries.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.getProgramIndustryList(value?.term, true);
    }));

    this.subscriptions.push(
    this.ratecardsearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.getAllRatefactorList(value.term);
      })
    );

    this.subscriptions.push(
    this.qualificationValuesSearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.searchQualificationsValues(value?.type,value?.term);
      }));

    this.subscriptions.push(
      this.qualificationSearch.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((val:any)=>{
        this.getQualifications(val);
      })
    )

    this.subscriptions.push(
      this.fdValuesSearchValues.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((value:any)=>{
        this.searchFoundationTypeValues(value?.type,value?.term);
      })
    )

    this.jobTemplateId = this.route.snapshot.params['id'];
    this.visibility = this.route.snapshot.params['name'];
    if (this.visibility === 'isview') {
      this.templateTitle = 'View'
    } else if (this.visibility === 'isedit') {
      this.templateTitle = 'Edit'
      this.isEdit = true;
    } else {
      this.templateTitle = 'Create New'
    }
    this.showResumeField = !this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.candidate?.is_resume_mandatory;
    this.getVendorScheduleListItems();
    if (this.jobTemplateId) {
      this.getJobTemplateDetails(this.jobTemplateId);
    } else {
      this.hierarchyList();
    }
    this.showJobType = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.job_type;
    this.init();
  }

  init(){
    this.searchCategoryAndTitle();
    this.getProgramIndustryList('');
    this.getRoles(null);
    this.getAllRatefactorList();
    if(this.showJobType) {
      this.getJobType();
    }
    if(!this.visibility) {
      setTimeout(() => {
        // this.getbackgroundChecks();
        this.getCheckList();
      }, 200);
      // this.getQualifications();
    }
  }

  //form creation
  initializeForm() {
    this.jobTemplateForm = this.fb.group({
      // Removing Template name Pattern Validation as par of V2M-10842
      // template_name: [null, [Validators.required, Validators.pattern(/^[A-Za-z][A-Za-z0-9\s!@$_\-^/&()#%*+=':?<>;"]*$/)]],
      template_name: [null, [Validators.required]],
      category: [null, [Validators.required]],
      template_code: [null],
      program_industry: [null, Validators.required],
      level: [null, [Validators.min(1), Validators.max(255)]],
      description: null,
      threshold: [],
      threshold_unit: ["Days"],
      is_description_editable: false,
      user_roles: [],
      checklist: [],
      is_onboarding_checklist: false,
      is_submission_exceed_max_bill_rate: false,
      is_start_date_limit: false,
      is_allow_express_offer: false,
      is_qualification_enabled: true,
      rates: [],
      submission_limit_vendor: [, [Validators.required, Validators.min(1), Validators.max(65535)]],
      distribute_schedule: [],
      after_immediate_distribution_schedule: [],
      immediate_distribution: [],
      after_immediate_distribution: [],
      qualifications: this.fb.array([]),
      distribution_type: [null, Validators.required],
      distribution_method:[],
      foundational_data: this.fb.array([]),
      job_type: [],
      distribute_schedule_data: [null]
    });
  }

  //navigating back
  navigateBack() {
    this.confirmService.confirm('', this.i18NextPipe.transform(`are_you_sure_you_want_to_cancel?`),
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.location.back();
        }
      })
  }

  //checking whether job template name exists
  checkNameExist(name) {
    if (!this.visibility) {
      this.isNamePresent = true;
      const url = `/job-manager/programs/${this.programId}/unique-template-name?template_name=` + name;
      this.jobService.get(url).subscribe({
        next: (data: any) => {
          if (data?.error) {
            this.jobTemplateInfo = data.error;
          }
          this.isNamePresent = false;
        },
        error: () => {
          this.isNamePresent = false;
        }
      })
    }
  }

  //btn disabled conditions
  isSubmitBtnDisabled() {
    const jobTemplateFormVal = this.jobTemplateForm.value;
    //background list toggle on then is atleast one selected
    //const backgroundCheckLists = jobTemplateFormVal?.background_check_list?.filter((element) => element?.is_enabled); 
    //onboarding list toggle on then is atmost one selected
    const onboardingCheckLists = jobTemplateFormVal?.checklist?.filter((element) => element?.is_enabled);
    //atleast one hierarchy should be there
    const hierarchyNotPresent = (this.hierarchyData && this.hierarchyData?.length === 0) || (this.selectedIDs && this.selectedIDs.length === 0);
    return this.isNamePresent || this.jobTemplateInfo?.code == 0 || !this.jobTemplateForm?.valid 
    || (jobTemplateFormVal?.is_description_editable && (jobTemplateFormVal?.user_roles?.length == 0 || jobTemplateFormVal?.user_roles == null))
    || (jobTemplateFormVal?.is_onboarding_checklist && onboardingCheckLists?.length == 0)
    || this.rateFactorInvalid || hierarchyNotPresent;
  }

  //job template creation
  saveJobTemplate() {
    this.isSubmitted = true;
    this.btnLoader = true;
    if (this.isSubmitBtnDisabled()) {
      this.alertService.error("Please fill the required fields.");
      this.btnLoader = false;
      return;
    }

    if(this.is_tiered_distribute_schedule) {
      let isVendorThere = false;
      this.vendorsList?.forEach((res)=>{
        if(res?.vendors?.length > 0 || res?.vendor_groups?.length > 0 || res?.moreVendors?.length > 0) {
          isVendorThere = true;
        } 
      })
      if(!isVendorThere) {
        this.alertService.error(`Atleast One Vendor/Vendor Group should be selected.`);
        this.btnLoader = false;
        return; 
      }     
    }

    const qualification_types = this.createQualificationPayload();
    this.setImmediateDistribution();
    const templateFormValue = this.jobTemplateForm.value;
    const roleIds = []; //user roles id's
    if(templateFormValue?.is_description_editable){
      templateFormValue?.user_roles?.forEach((user)=>{
        if(user?.id){
          roleIds.push(user.id);
        }
      })
    }

    const rates: any = [];
      templateFormValue?.rates?.forEach(d => {
        if (d?.id) {
          rates.push({
            id: d?.id,
            bill_rate: d?.bill_rate,
            pay_rate: d?.pay_rate,
            abbreviation: d?.abbreviation,
            billable: d?.billable ?? false,
            name: d?.name
          })
        }
      });

    const fdPayloadFnc = (acc, currV) => {
      if (currV?.values?.id) {
        acc.push({
          foundation_data_type_id: currV?.fd_type_id,
          foundation_data_id: [currV?.values?.id],
          is_read_only: currV?.read_only || false
        });
      }
      return acc;
    };   
    const fdArr = this.getFoundationalDataArray()?.value;
    const foundational_data = fdArr.reduce(fdPayloadFnc,[]);
    const payload = {
      template_name: templateFormValue?.template_name,
      hierarchy: this.selectedIDs,
      category: templateFormValue?.category?.category?.id,
      ref_title: templateFormValue?.category?.id,
      template_code: templateFormValue?.template_code,
      level: templateFormValue?.level,
      program_industry: templateFormValue?.program_industry ? [templateFormValue?.program_industry] : [],
      description: this.quillInputTxt,
      is_submission_exceed_max_bill_rate: templateFormValue?.is_submission_exceed_max_bill_rate,
      allow_express_offer: templateFormValue?.is_allow_express_offer ?? false,
      is_qualification_enabled: templateFormValue?.is_qualification_enabled ?? false,
      is_description_editable: templateFormValue?.is_description_editable,
      user_roles: templateFormValue?.is_description_editable ? roleIds : [],
      // is_background_check: templateFormValue?.is_background_check,
      is_onboarding_checklist: templateFormValue?.is_onboarding_checklist,
      available_start_date_limit: {
        no: templateFormValue?.is_start_date_limit ? templateFormValue?.threshold : null,
        unit : templateFormValue?.is_start_date_limit ? 'days' : null,
        is_enabled: templateFormValue?.is_start_date_limit
      },
      rates,
      submission_limit_vendor: templateFormValue?.submission_limit_vendor,
      is_automatic_distribution: this.is_automatic_distribution,
      is_tiered_distribute_schedule: this.is_tiered_distribute_schedule,
      is_manual_distribution_job_submit: this.is_manual_distribution_job_submit,
      is_automatic_distribute_submit: this.is_automatic_distribute_submit,
      is_automatic_distribute_final_approval: this.is_automatic_distribute_final_approval,
      distribute_schedule: templateFormValue?.distribute_schedule?.id,
      // after_immediate_distribution_schedule: templateFormValue?.after_immediate_distribution_schedule,
      // after_immediate_distribution: templateFormValue?.after_immediate_distribution,
      immediate_distribution: templateFormValue?.immediate_distribution,
      qualification_types,
      submit_type: 'SUBMIT',
      is_template: true,
      is_expense_allowed_editable: this.allowExpenseEdit,
      is_expense_allowed: this.allowExpense,
      jd_parsing_file: Object.keys(this.jdParsingFile)?.length>0 ? [this.jdParsingFile] : [],
      foundational_data,
      distribute_schedule_data: templateFormValue?.distribute_schedule_data
    }
    if(this.showResumeField) {
      payload['resume_mandatory'] = this.isResumeMandatory; 
    }
    if(this.showJobType) {
      payload['job_type'] = templateFormValue?.job_type;
    }
    // const bgIds = []; //background enabled id's
    // if (templateFormValue?.is_background_check) {
    //   templateFormValue?.background_check_list?.forEach(element => {
    //     if (element?.is_enabled) {
    //       bgIds.push(element?.id);
    //     }
    //   });
    //   payload['background_check_list'] = bgIds;
    // }
    
    if(templateFormValue?.is_onboarding_checklist){
      let onboardingId = "";
      templateFormValue?.checklist?.forEach(element=>{
        if(element?.is_enabled) {
          onboardingId = element?.id;
        }
      });
      payload['checklist'] = onboardingId;
    }

    if (this.jobTemplateId) {
      delete payload.category;
      const url = `/job-manager/programs/${this.programId}/jobs/${this.jobTemplateId}`;
      this.jobService.put(url, payload).subscribe({
        next: (data: any) => {
        this.btnLoader = false;
        this.alertService.success('Job Template Updated Successfully');
        this.svmsRouter.navigate(['job', 'job-template', 'view', this.jobTemplateId ,'isview']);
      },
      error: error => {
        this.alertService.error(errorHandler(error), {});
        this.btnLoader = false;
      }});
    } else {
      const url = `/job-manager/programs/${this.programId}/jobs`;
      this.jobService.post(url, payload).subscribe({
        next: (data: any) => {
        this.btnLoader = false;
        this.alertService.success('Job Template Created Successfully');
        this.svmsRouter.navigate(['job', 'job-template', 'view', data?.job_template?.id ,'isview']);
      },
      error: error => {
        this.alertService.error(errorHandler(error), {});
        this.btnLoader = false;
      }});
    }
  }

  //get template details for edit
  getJobTemplateDetails(id) {
    let _url = `/job-manager/programs/${this.programId}/job-templates/${id}`;
    this.jobService.get(_url).subscribe({
      next: (data:any) => {
      if (data?.job_template) {
        this.isSubmitted = true;
        this.jobTemplateData = data?.job_template;

        this.selectedIDs = new Array();
        this.jobTemplateData?.hierarchy?.forEach(jh => {
          this.selectedIDs.push(jh?.id);
        });
        this.patchHierarchies = [...this.selectedIDs];
        if (this.selectedIDs) {
          this.defaultHierarchy = this.selectedIDs;
        }
        this.hierarchyList(); 
        this.getFoundationalDataTypes();
        this.patchTemplateData();
      }
    }, 
    error: (err) => {
      this.alertService.error(errorHandler(err));
    }});
  }

  // patching the data for edit or view
  async patchTemplateData() {
    const jobCategoryObj = {  
      bindLabel: this.jobTemplateData?.category.category_name + '-' + this.jobTemplateData?.ref_title?.title,
      category: this.jobTemplateData?.category,
      title: this.jobTemplateData?.title?.title,
      id: this.jobTemplateData?.title?.id,
    }
    this.isUserCheckBox = this.jobTemplateData?.is_description_editable;
    if(this.isUserCheckBox){
      this.userRolesPatch = [...this.jobTemplateData?.user_roles];
    }
    // this.isbackgroundChecks = this.jobTemplateData?.is_background_check;
    this.isMaxBillRate = this.jobTemplateData?.is_submission_exceed_max_bill_rate ?? false;
    this.isCheckList = this.jobTemplateData?.is_onboarding_checklist;
    
    if(this.jobTemplateData?.rates && this.jobTemplateData?.rates?.length > 0) {
      this.jobTemplateData?.rates?.forEach(element => {
         if(!element.name) {
           element.name = element?.rate_factor;
         }
      });
    }
    this.jdParsingFile = this.jobTemplateData?.jd_parsing_file?.length > 0 ? this.jobTemplateData?.jd_parsing_file?.[0] : {};
    this.quillInputTxt = this.jobTemplateData?.description;
    this.setRates();
    this.jobTemplateForm.patchValue({
      template_name: this.jobTemplateData?.template_name,
      category: jobCategoryObj,
      template_code: this.jobTemplateData?.template_code,
      level: this.jobTemplateData?.level,
      description: this.jobTemplateData?.description,
      is_description_editable: this.jobTemplateData?.is_description_editable,
      is_submission_exceed_max_bill_rate: this.isMaxBillRate,
      is_allow_express_offer: this.jobTemplateData?.allow_express_offer,
      is_qualification_enabled: this.jobTemplateData?.is_qualification_enabled,
      user_roles: this.jobTemplateData?.user_roles,
      // background_check_list: this.jobTemplateData?.background_check_list,
      // is_background_check: this.jobTemplateData?.is_background_check,
      is_onboarding_checklist: this.jobTemplateData?.is_onboarding_checklist,
      rates: this.jobTemplateData?.rates,
      is_start_date_limit: this.jobTemplateData?.available_start_date_limit?.is_enabled,
      threshold: this.jobTemplateData?.available_start_date_limit?.no,
      unit: this.jobTemplateData?.available_start_date_limit?.unit,
      is_template: true,
      submission_limit_vendor: this.jobTemplateData?.submission_limit_vendor,
      distribute_schedule: this.isEmptyObject(this.jobTemplateData?.distribute_schedule) || null,
      after_immediate_distribution_schedule: this.jobTemplateData?.after_immediate_distribution_schedule,
      immediate_distribution: this.jobTemplateData?.immediate_distribution,
      after_immediate_distribution: this.jobTemplateData?.after_immediate_distribution,
    });
    this.is_automatic_distribution = this.jobTemplateData?.is_automatic_distribution;
    this.is_tiered_distribute_schedule = this.jobTemplateData?.is_tiered_distribute_schedule;
    this.is_manual_distribution_job_submit = this.jobTemplateData?.is_manual_distribution_job_submit;
    this.is_automatic_distribute_submit = this.jobTemplateData?.is_automatic_distribute_submit;
    this.is_automatic_distribute_final_approval = this.jobTemplateData?.is_automatic_distribute_final_approval;
    this.isResumeMandatory = this.jobTemplateData?.resume_mandatory;
    if(this.jobTemplateData?.available_start_date_limit?.is_enabled){
      this.jobTemplateForm.get('threshold').setValidators([Validators.required, Validators.min(1)])
      this.jobTemplateForm.updateValueAndValidity();
    }
  if(this.is_automatic_distribution) {
    this.jobTemplateForm.patchValue({
      distribution_type: 'is_automatic_distribution',
    });
    if(this.is_automatic_distribute_submit) {
      this.jobTemplateForm.patchValue({
        distribution_method: 'automatic_distribution_upon_submit',
      });
    } else if(this.is_automatic_distribute_final_approval) {
      this.jobTemplateForm.patchValue({
        distribution_method: 'automatic_distribution_upon_final_approval',
      });
    }
  } else if(this.is_tiered_distribute_schedule) {
    this.jobTemplateForm.patchValue({
      distribution_type: 'is_tiered_distribute_schedule',
    });
    if(this.is_automatic_distribute_submit) {
      this.jobTemplateForm.patchValue({
        distribution_method: 'automatic_distribution_upon_submit',
      });
    } else if(this.is_automatic_distribute_final_approval) {
      this.jobTemplateForm.patchValue({
        distribution_method: 'automatic_distribution_upon_final_approval',
      });
    }
  } else if(this.is_manual_distribution_job_submit) {
    this.jobTemplateForm.patchValue({
      distribution_type: 'is_manual_distribution_job_submit',
    });
  }
    const industry = this.jobTemplateData?.program_industry;
    if (industry && Array.isArray(industry) && industry.length) {
      this.jobTemplateForm?.patchValue({
        program_industry: industry[0]?.id
      });
    }

    if(this.showJobType) {
      this.jobTemplateForm.get('job_type').setValue(this.jobTemplateData?.job_type);
    }
    setTimeout(() => {
      // this.getbackgroundChecks();
      this.getCheckList();
    }, 200);
    // if(this.distributionScheduleList) this.setDistributionScheduleEdit();
    this.getQualifications(null, true);
    const vendorIds = []; 
    if(!Array.isArray(this.jobTemplateData?.distribute_schedule_data)) {
      this.jobTemplateData.distribute_schedule_data = [];
    }
    this.jobTemplateData?.distribute_schedule_data?.map((res)=>{
      if(res?.vendors?.length > 0 ) vendorIds.push(...res?.vendors);
    });
    if(this.jobTemplateData?.immediate_distribution?.vendor_id?.length > 0) {
      vendorIds.push(...this.jobTemplateData?.immediate_distribution?.vendor_id)
    }
    if(vendorIds?.length > 0) {
      this.vendorsScheduled = await this.getVendors(vendorIds);
    }
    const vendorGroupIds = [];
    this.jobTemplateData?.distribute_schedule_data?.map((res)=>{
      if(res?.vendor_group_id?.length > 0 ) vendorGroupIds.push(...res?.vendor_group_id);
    });
    if(this.jobTemplateData?.immediate_distribution?.vendor_group_id?.length > 0) {
      vendorGroupIds.push(...this.jobTemplateData?.immediate_distribution?.vendor_group_id)
    }
    if(vendorGroupIds?.length > 0) {
      this.vendorGroupScheduled = await this.getVendorGroups(vendorGroupIds);
    }
    this.setDistributionScheduleEdit(this.vendorsScheduled, this.vendorGroupScheduled);
    this.allowExpense = this.jobTemplateData?.is_expense_allowed;
    this.allowExpenseEdit = this.jobTemplateData?.is_expense_allowed_editable;
  }

  setRates() {
    if(this.jobTemplateData?.rates?.length > 0) {
      this.jobTemplateData.rates = this.jobTemplateData?.rates?.map((res)=>{
        const findRate = this.rateFactor?.find((rf)=>rf?.id == res?.id);
        if(findRate) {
          findRate.bill_rate = res?.bill_rate || [];
          findRate.pay_rate = res?.pay_rate || [];
          return {...findRate, ...res , abbreviation: findRate?.abbreviation};
        } else {
          return res;
        }
      });
    }
  }

  setDistributionScheduleEdit(vendorDetails, vendorGroupDetails) {
    if(this.isDistributionSet || !this.distributionScheduleList || (Object.keys(vendorDetails)?.length == 0 && Object.keys(vendorGroupDetails)?.length == 0)) return;
    this.isDistributionSet = true;
    const findSchedule = this.distributionScheduleList?.distribution_schedules?.find((res) => res?.id == this.jobTemplateData?.distribute_schedule?.id);
    this.previousDistributionSchedule = _.cloneDeep(findSchedule);

    //mapping vendors with schedule
    findSchedule?.schedules?.forEach((sch) => {
      const scheduleUnit = sch?.schedule_unit;
      sch.vendor_details = [];
      if (scheduleUnit !== 'IMMEDIATE') {
        this.jobTemplateData?.distribute_schedule_data?.forEach((res) => {
          if (res?.schedule_unit?.toUpperCase() == scheduleUnit?.toUpperCase()) {
            res?.vendors?.forEach((vd) => {
              const findVendor = vendorDetails?.program_vendors?.find((v) => v?.vendor?.id == vd);
              if (findVendor) {
                sch.vendor_details?.push(findVendor);
              }
            })
          }
        });
      } else {
        this.jobTemplateData?.immediate_distribution?.vendor_id?.forEach((vd) => {
          const findVendor = vendorDetails?.program_vendors?.find((v) => v?.vendor?.id == vd);
          if (findVendor) {
            sch.vendor_details?.push(findVendor);
          }
        });
      }
      sch.vendors = sch?.vendor_details;
    });

    //mapping vendor groups with schedule
    findSchedule?.schedules?.forEach((sch) => {
      const scheduleUnit = sch?.schedule_unit;
      sch.vendor_group_details = [];
      if (scheduleUnit !== 'IMMEDIATE') {
        this.jobTemplateData?.distribute_schedule_data?.forEach((res) => {
          if (res?.schedule_unit?.toUpperCase() == scheduleUnit?.toUpperCase()) {
            res?.vendor_group_id?.forEach((vd) => {
              const findVendorGroup = vendorGroupDetails?.vendor_groups?.find((vg) => vg?.id == vd);
              if (findVendorGroup) {
                sch.vendor_group_details?.push(findVendorGroup);
              }
            })
          }
        });
      } else {
        this.jobTemplateData?.immediate_distribution?.vendor_group_id?.forEach((vd) => {
          const findVendor = vendorGroupDetails?.vendor_groups?.find((vg) => vg?.id == vd);
          if (findVendor) {
            sch.vendor_group_details?.push(findVendor);
          }
        });
      }
      sch.vendor_groups = sch?.vendor_group_details;
    });
    this.distributionScheduleSelected(findSchedule, false);
  }

  getVendors = (vendorIds = []) => {
    return this.jobService.get(`/configurator/programs/${this.programId}/vendors?org_ids=${vendorIds?.join()}`)?.toPromise();
  }

  getVendorGroups = (vendorGroupIds = []) => {
    return this.jobService.get(`/configurator/programs/${this.programId}/vendor-groups?ids=${vendorGroupIds?.join()}`)?.toPromise();
  }



  updateDescription(data) {
    this.jobTemplateForm.patchValue({
      description: data?.description
    })
  }

  //job category title and view search
  searchCategoryAndTitle(value = '') {
    const _url = `/job-manager/job-catalog/category_title?q=` + value + "&order_by=title,category__category_name";
    this.jobService.get(_url).subscribe(
      (data: any) => {
        let categoryData = data?.data;
        categoryData?.forEach(d => {
          d.bindLabel = d?.category?.category_name + ' - ' + d?.title
        });
        categoryData = this.sortPipe.transform(categoryData, 'bindLabel');
        this.jobCategoryData = categoryData;
      })
  }

  getProgramIndustryList(term, reset = false) {
    if (reset) {
      this.Page = 1;
    }
    let url = `/configurator/programs/${this.programId}/industries?${term ? 'name=' + term : ''}`
    return this.jobService.get(url).subscribe((data:any) => {
      data.industries=this.sortPipe.transform(data?.industries,'name');
      this.industries = data?.industries;
    });
  }

  getRoles(value) {
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (value) {
      qry = qry + '&k=' + value;
    }
    let _url = `/configurator/programs/${this.programId}/roles` + qry;
    this.jobService.get(_url).subscribe((data:any) => {
      if (data?.roles) {
        this.userRoles = data?.roles?.filter(ele => ele?.organization_category?.toLowerCase() != jobUserType?.Vendor?.toLowerCase());
      }
    });
  }
  
  userRoleChange(data){
    if(data){
        if(!this.jobTemplateForm?.value?.user_roles){
          this.jobTemplateForm.value.user_roles = new Array();
        } else {
          this.jobTemplateForm.value.user_roles = [];
        }
        this.jobTemplateForm?.value?.user_roles?.push(...data);
        this.jobTemplateForm?.patchValue({
          user_roles: this.jobTemplateForm?.value?.user_roles
        })
      }
  }

  checkBillRate(value) {
    this.jobTemplateForm.patchValue({
      is_submission_exceed_max_bill_rate: value
    })
  }

  checkQualification(value){
    this.jobTemplateForm.patchValue({
      is_qualification_enabled: value
    })
  }

  checkAllowExpressOffer(value) {
    this.jobTemplateForm.patchValue({
      is_allow_express_offer: value
    })
  }

  checkLimitSubmissionStartDate(value) {
    if(value){
      this.jobTemplateForm.get('threshold').setValidators([Validators.required, Validators.min(1)])
    }else{
      this.jobTemplateForm.get('threshold').clearValidators(); 
    }
    this.jobTemplateForm.updateValueAndValidity();
    this.jobTemplateForm.patchValue({
      is_start_date_limit: value
    })
  }

  toggleUserCheckBox(value){
    this.jobTemplateForm.patchValue({
      is_description_editable: value
    })
    if(value){
      if(this.userRoles?.length >= 1){
        this.userRolesPatch = [this.userRoles[0]];
        this.jobTemplateForm.get('user_roles')?.patchValue(this.userRolesPatch);
      }
    }
  }

  // getbackgroundChecks() {
  //   const _url = `/configurator/programs/${this.programId}}/background-checklists/required-criterias`;
  //   this.jobService.get(_url).subscribe(
  //     (data: any) => {
  //       if(data && data?.required_criterias && data?.required_criterias?.length > 0) {
  //       this.backgroundcheckData = data?.required_criterias?.filter(b=>b.is_enabled);
  //       this.backgroundcheckData?.forEach(c => {
  //         if(this.jobTemplateData?.background_check_list && this.jobTemplateData?.background_check_list?.length){
  //         const isCheck = this.jobTemplateData?.background_check_list?.some( b => b === c?.id);
  //         if(isCheck) {
  //           c.is_enabled = true;
  //         } else {
  //           c.is_enabled = false;
  //         }
  //       } else {
  //         c.is_enabled = false;
  //       }
  //       });
  //       this.jobTemplateForm.patchValue({
  //         background_check_list: this.backgroundcheckData
  //       });
  //       this.jobTemplateForm?.controls?.background_check_list?.updateValueAndValidity();
  //     }
  //     });
  // }

  // modifyBGcheck(data) {
  //   this.jobTemplateForm.patchValue({
  //     background_check_list: data
  //   })
  // }

  // toggleBGCheckBox(data) {
  //   if (!data) {
  //     this.jobTemplateForm?.value?.background_check_list?.forEach(bg => {
  //       bg.is_enabled = false;
  //     });
  //   }
  //   this.jobTemplateForm.patchValue({
  //     is_background_check: data
  //   })
  // }

  getCheckList() {
    const _url = `/configurator/programs/${this.programId}/onboarding/checklists`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        this.checkListData = data?.checklists;
        this.checkListData?.forEach(c => {
          if (this.jobTemplateData?.checklist?.id === c?.id) {
            c.checkList = true;
          } else {
            c.is_enabled = false;
          }
        })
        this.jobTemplateForm.patchValue({
          checklist: this.checkListData
        });
        this.jobTemplateForm?.controls?.checklist?.updateValueAndValidity();
      });
  }

  toggleCheckList(data) {
    if (!data) {
      this.jobTemplateForm?.value?.checklist?.forEach(q => {
        q.is_enabled = false;
      });
    }
    else {
      if(this.jobTemplateForm?.value?.checklist?.length >= 1){
        this.jobTemplateForm.value.checklist[0].is_enabled = true;
      }
    }
    this.jobTemplateForm?.patchValue({
      is_onboarding_checklist: data
    });
  }

  modifyOnboarding(data) {
    this.jobTemplateForm.patchValue({
      checklist: data
    })
  } 

   hierarchyList(pageNo = 1) {
    let userDetails = this.storageService.get('user');
    let userId = userDetails['id'];
    if (pageNo === 1) {
      this.loaderService.show();
    }
    this.jobService.get(`/configurator/programs/${this.programId}/hierarchy?user_id=${userId}`).subscribe({
      next: (data:any) => {
      const hierarchyData = [{'hierarchies':data?.result[0]?.hierarchies}];
      this.hierarchyData = [...hierarchyData];
      this.defaultHierarchy = this.selectedIDs || [];
      if (!this.selectedIDs) {
        this.selectedIDs = this.defaultHierarchy;
      }
      if(this.visibility == "isedit") {
        this.defaultHierarchy = [...this.patchHierarchies];
        this.selectedIDs = [...this.patchHierarchies];
      }
      this.userAssociateHierarchy = [this.hierarchyData[0]?.id];
      this.selectedHierarchyLevel = this.hierarchyData[0];
      this.isEditHierarchy = true;
      this.loaderService.hide();
    }, 
    error: error => {
      this.alertService.error(errorHandler(error), {});
      this.loaderService.hide();
    },
    complete: () => {
        this.loaderService.hide();
      }});
  }

  selectHierarchy(event) {
    if (Array.isArray(event)) {
      this.selectedIDs = event;
    }
  }

  getAllRatefactorList(searchTerm = null) {
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page + '&is_enabled=True';
    if (searchTerm) {
      qry = qry + '&k=' + searchTerm;
    }
    const url = '/configurator/programs/' + this.programId + '/rate-factors' + qry;
    this.jobService.get(url).subscribe({
      next: (data:any) => {
        if (data.rate_factors) {
          this.rateFactor = data?.rate_factors;
          this.rateFactor?.forEach((d,i)=> {
            if((d?.is_ot_exempt === true)){
              this.rateFactor.splice(i,1);
            } 
          });
          if(this.jobTemplateId) {
            this.setRates();
          }
        }
      },
      error: (err) => {
        this.alertService.error(errorHandler(err));
      }
  });
  }

  getRate(rate) {
    return rate?.replace("_", " ");
  }

  addRate(data): void {
    if (data?.factor && (data?.factor + 0.5) <= 10) {
      data.factor+= 0.5;
    }
  }

  factorChange(event, data): void {
    if (data?.factor) {
      if ((+event.target.value) >= 1 && (+event.target.value) <= 10) {
        data.factor = (+event.target.value);
        this.rateFactorInvalid = data['is_error'] = false; //if rate factor exceeds 10 then it is invalid
      } else {
        this.rateFactorInvalid = data['is_error'] = true;
      }
    }
  }

  removeRateFactor(rate,index) {
    this.jobTemplateForm.value.rates.splice(index,1);
    this.jobTemplateForm.patchValue({
      rates: this.jobTemplateForm.value.rates
    })
  }

  toggleView(rate) {
    rate.iscollapse = !rate.iscollapse;
  }

  selectDistribution(value: string) {
    this.jobTemplateForm?.controls?.distribute_schedule?.setValidators(null);
    // this.jobTemplateForm.get('after_immediate_distribution').setValue(null);
    // this.jobTemplateForm.get('after_immediate_distribution_schedule').setValue(null);
    if (value === 'is_automatic_distribution') {
      this.is_automatic_distribution = true;
      this.is_tiered_distribute_schedule = false;
      this.is_manual_distribution_job_submit = false;
      this.is_automatic_distribute_submit = true;
      this.is_automatic_distribute_final_approval = false;
      this.jobTemplateForm?.get('distribution_method')?.setValidators([Validators.required]);
    }
    if (value === 'is_tiered_distribute_schedule') {
      this.jobTemplateForm?.controls?.distribute_schedule?.setValidators([Validators.required]);
      this.is_automatic_distribution = false;
      this.is_tiered_distribute_schedule = true;
      this.is_manual_distribution_job_submit = false;
      this.is_automatic_distribute_submit = true;
      this.is_automatic_distribute_final_approval = false;
      this.jobTemplateForm?.get('distribution_method')?.setValidators([Validators.required]);
    }
    if (value === 'is_manual_distribution_job_submit') {
      this.is_automatic_distribution = false;
      this.is_tiered_distribute_schedule = false;
      this.is_manual_distribution_job_submit = true;
      this.is_automatic_distribute_submit = false;
      this.is_automatic_distribute_final_approval = false;
      this.jobTemplateForm?.get('distribution_method')?.clearValidators();
    }
    this.jobTemplateForm?.controls?.distribute_schedule?.updateValueAndValidity();
    this.jobTemplateForm?.get('distribution_method')?.updateValueAndValidity();
  }

  setDistributionMethod(value) {
    if (value === 'automatic_distribution_upon_submit') {
      this.is_automatic_distribute_submit = true,
      this.is_automatic_distribute_final_approval = false
    } else {
      this.is_automatic_distribute_submit = false,
      this.is_automatic_distribute_final_approval = true
    }
  }

  getVendorScheduleListItems(pageNo = 1) {
    const url = `/configurator/programs/${this.programId}/vendors/distribution-schedules?limit=${this.itemPerPage}&page=${pageNo}`;
    this.loaderService.show();
    this.jobService.get(url).subscribe({
      next: data => {
        this.loaderService.hide();
        if (data) {
          this.distributionScheduleList = data;
          if(this.jobTemplateId) {
            this.setDistributionScheduleEdit(this.vendorsScheduled, this.vendorGroupScheduled);
          }
        }
      },
      error: (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }});
  }
 
  distributionScheduleSelected(schedule, changeCurrScheduleRef = true) {
    if (schedule) {
      if(schedule?.id == this.previousDistributionSchedule?.id && changeCurrScheduleRef) {
        schedule = this.previousDistributionSchedule;
      }
      this.jobTemplateForm.get('distribute_schedule_data').setValue(null);
      this.selectedSchedule = schedule;
      const immediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit === 'IMMEDIATE');
      const nonImmediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit !== 'IMMEDIATE');
      this.vendorsList = immediateSchedule?.concat(nonImmediateSchedule);
      if (nonImmediateSchedule && nonImmediateSchedule?.length) {
        this.jobTemplateForm.patchValue({
          distribute_schedule_data: nonImmediateSchedule?.map((res)=>{
            return {
              ...res,
              vendor_group_id: res?.vendor_groups?.map((vg)=>vg?.id),
              vendors: res?.vendors?.map((v)=>v?.vendor?.id)
            }
          })
        });
      }
    } else {
      this.vendorsList = [];
    }
  }

  deleteVendor(vendorListIndex, vendorArray, vendorArrayIndex) {
    this.vendorsList[vendorListIndex][vendorArray].splice(vendorArrayIndex, 1);
  }

  setImmediateDistribution() {
    this.vendorsList?.forEach(im => {
      if (im?.schedule_unit === 'IMMEDIATE') {
        let immediateVendorIDs: any = [];
        let result = im?.vendors?.map(function (a) { return a?.vendor?.id; });
        const vendor_group_id = im?.vendor_groups?.map(function (a) { return a?.id; });
        let result2 = im?.moreVendors?.map(function (a) { return a?.vendor?.id; });
        if (result?.length > 0) {
          immediateVendorIDs = immediateVendorIDs?.concat(result)
        } 
        if (result2?.length > 0) {
          immediateVendorIDs = immediateVendorIDs?.concat(result2)
        }
        this.jobTemplateForm.patchValue({
          immediate_distribution: { vendor_id: immediateVendorIDs , vendor_group_id }
        })
      } else {
        const mapVendorWithSchedules = (res) => {
          if (res?.schedule_value == im?.schedule_value && res?.schedule_unit?.toLowerCase() == im?.schedule_unit?.toLowerCase()) {
            const moreVendors: any = im?.moreVendors?.map((mv) => mv?.vendor?.id) || [];
            const vendors = im?.vendors?.map((mv) => mv?.vendor?.id) || []
            const vendor_group = im?.vendor_groups?.map( (vg) => vg?.id);
            vendors.push(...moreVendors);
            res.vendors = [...new Set(vendors)];
            res.vendor_group_id = vendor_group;
          }
        }
        this.jobTemplateForm?.value?.distribute_schedule_data?.forEach(mapVendorWithSchedules);
      }
    });
  }

  searchVendor(searchString, schedule_id) {
    this.vendorSearchList = true;
    this.jobService.get(`/configurator/programs/${this.programId}/vendors?name=${searchString}`)
      .subscribe((data: any) => {
        const { program_vendors } = data;
        let indx;
        if (schedule_id !== 'IMMEDIATE') {
          indx = this.vendorsList.findIndex(vndrList => vndrList.id === schedule_id);
        } else {
          indx = this.vendorsList.findIndex(vndrList => vndrList.schedule_unit === 'IMMEDIATE');
        }
        if (indx > -1) {
          this.vendorsList[indx].vendorSearch = program_vendors;
        }
      })
  }

  addMoreVendor(vendor, schedule_id) {
    const indx = this.vendorsList.findIndex(vndrList => vndrList.id === schedule_id);
    if (indx > -1) {
      if (!Array.isArray(this.vendorsList[indx].moreVendors)) {
        this.vendorsList[indx].moreVendors = [];
      }
      const inIndex = this.vendorsList[indx].vendorSearch.findIndex(vn => vn.id === vendor.id);
      if (inIndex > -1) {
        this.vendorsList[indx].vendorSearch.splice(inIndex, 1);
      }
      const includeInVendor = this.vendorsList[indx].vendors
        .some(_vendor => _vendor.id === vendor.id) ||
        this.vendorsList[indx].moreVendors.some(_vendor => _vendor.id === vendor.id);
      if (!includeInVendor) {
        this.vendorsList[indx].moreVendors.push(vendor)
      }
    }
  }

  
  //qualification part started
  getQualifications(term?,isEdit?) {
    this.loaderService.show();
    this.jobService.getQualificationsByProgram(term).subscribe({
      next: (data:any) => {
      if (data) {
        this.loaderService.hide();
        this.qualification_types = data?.qualification_types?.filter((res)=>res?.is_enabled)?.sort((qualType1, qualType2) => qualType1?.name?.localeCompare(qualType2?.name));
        const controls = this.jobTemplateForm.get('qualifications') as UntypedFormArray;

        //setting all unselected default
        this.qualification_types.forEach((qual)=>{
          qual.selected = false;
        })

        //adding all the removed id's in arr
        const removed_ids = [];
        this.remove_qualification_types_selected?.forEach((res)=>{
          removed_ids.push(res);
        });

        //setting selected true for all qualifications added in form control
        controls?.value?.forEach((res)=>{
          this.qualification_types?.forEach((qual)=>{
            if(res?.qualification_type_id == qual?.id) {
             qual.selected = true;
            }
          })
        })

        //checking whether they have been unselected before search and making them unselect in new array
        this.qualification_types?.forEach((qual) => {
          if (removed_ids?.includes(qual?.id)) {
            if (!this.qualification_types_selected.includes(qual?.id)) {
              qual.selected = false;
            }
          }
        })

        //add the qualifications which have been checked/selected before search
        if(this.qualification_types_selected?.length > 0) {
        this.qualification_types_selected?.forEach((qual_id)=>{
          this.qualification_types.forEach((qual)=>{
            if(qual_id == qual?.id) {
              qual.selected = true;
            }
          })
        })
      }
        if(isEdit) this.updateQualification();
      }
    }, 
    error: (err) => {
      this.alertService.error(errorHandler(err));
      this.loaderService.hide();
    }})
  }

  clickOnRatings(c, r) {
    c.level = Number(r);
  }

  updateQualification() {
    this.qualification_types?.forEach((res:any)=>{
      this.jobTemplateData?.qualification_types?.forEach((qual:any)=>{
        if(qual?.id == res?.id) {
          res.selected = true;
          res.values = qual?.qualifications;
          res.is_required = qual?.is_required;
          res.is_locked = qual?.is_locked;
        }
      }
    )
    });
    const qualification_types = [];
    this.jobTemplateData?.qualification_types?.forEach((res)=>{
      const qual_obj = {
        name: res?.name || res?.qualifications?.[0]?.qualification_type?.name,
        code: res?.code || res?.qualifications?.[0]?.qualification_type?.code,
        id:res?.id,
        is_required: res?.is_required,
        values: res?.qualifications,
        selected: true,
        is_locked: res?.is_locked
      }
      qualification_types.push(qual_obj);
    });
    qualification_types?.forEach((res)=>{
      this.addQualification(res);
      // this.qualification_types_selected.push(res?.id);
      // this.qualification_types_selected_data.push(res);
    })
  }

  isEmptyObject(obj) {
    if (obj && (Object.keys(obj).length === 0)) {
      return null
    } else {
      return obj
    }
  }

  //method for adding all the qualification when we click on add btn
  addQualifications() {
    const controls = this.jobTemplateForm.get('qualifications') as UntypedFormArray;
    const remove_ids = [];
    this.remove_qualification_types_selected?.forEach((res)=>{
      remove_ids.push(res);
    });

    this.qualification_types_selected?.forEach((res)=>{
      const idx = remove_ids?.findIndex((id)=>id == res);
      if(idx > -1) {
        remove_ids.splice(idx,1);
      }
    });

    const remove_qual = [];
    controls?.value?.forEach((res,i)=>{
      if(remove_ids?.includes(res?.qualification_type_id)) {
        remove_qual.push(i);
      }
    });

    //reversing it as if we remove from start in loop indexes will be changed
    remove_qual?.reverse()?.forEach((index)=>{
      controls?.removeAt(index);
    })
    this.qualification_types_selected_data?.forEach((res)=>{
      this.addQualification(res);
    });
    this.remove_qualification_types_selected = new Set();
    this.qualification_types_selected = [];
    this.qualification_types_selected_data = [];
    this.addQualificationVisibility = false;
  }

   qualificationModalOpen(event) {
    if(this.qualification_types?.length == 0) {
     this.getQualifications();
    }
    this.addQualificationVisibility = true;
  }

  qualificationModalClose() {
    this.addQualificationVisibility = false;
    const controls = this.jobTemplateForm.get('qualifications') as UntypedFormArray;
    this.qualification_types?.forEach((qual)=>{
      let is_qual_not_selected = true;
      controls?.value?.forEach(selected_qual => {
        if(selected_qual?.qualification_type_id == qual?.id) {
          is_qual_not_selected = false;
        }
      });
      qual.selected = is_qual_not_selected ? false : true;
    });
    this.qualification_types_selected = [];
    this.qualification_types_selected_data = [];
    this.remove_qualification_types_selected = new Set();
  }

  qualificationSelection(qualification) {
    if(!qualification?.selected) {
      this.qualification_types_selected.push(qualification?.id);
      this.qualification_types_selected_data.push(qualification);
    } else {
      const qual_index = this.qualification_types_selected?.findIndex((res)=>res == qualification?.id);
      this.qualification_types_selected?.splice(qual_index, 1);
      this.qualification_types_selected_data.splice(qual_index, 1);
      this.remove_qualification_types_selected.add(qualification?.id);
    }
    qualification.selected = !qualification?.selected;
  }

  //method for adding qualification one by one after filtering the previous 
  addQualification(qualification) {
    if(qualification?.selected) {
      const control = this.jobTemplateForm.get('qualifications') as UntypedFormArray;
      //check if the qualification is already present in form array then not add
      const isQualificationPresent = control?.value?.find((qualificationD)=>{
        return qualification?.id == qualificationD?.qualification_type_id;
      });
      if(isQualificationPresent) return;
      const group = this.fb.group({
        qualification_type: [qualification?.name],
        qualification_type_id: [qualification?.id],
        is_qualification_type_required: [qualification?.is_required ?? false],
        values: [qualification?.values],
        data: [qualification?.values],
        loading:[false],
        qualification_type_code: [qualification?.code]
      });
      control.push(group);
      this.searchQualificationsValues(group,'');
    }
    this.changeDetection.detectChanges();
  }

  removeQualification(index) {
    const controls = this.jobTemplateForm.get('qualifications') as UntypedFormArray;
    const removedQual = controls?.at(index);
    controls?.removeAt(index);
    this.qualification_types?.forEach((res)=>{
      if(removedQual?.value?.qualification_type_id == res?.id) res.selected = false;
    })
  }

  removeQualificationValues(item,index) {
    item.get('values')?.value?.splice(index,1);
    item.get('values')?.patchValue(item.get('values')?.value);
  }

  searchQualificationsValues(item,term) {
    item?.get('loading').patchValue(true);
    // if(!term) {
    //   item.get('data').value = null;
    //   item?.get('loading').patchValue(false);
    //   return;
    // }
    const qualificationTypeId = item.get('qualification_type_id').value;
    const _url =`/configurator/programs/${this.programId}/qualification-types/${qualificationTypeId}/qualifications?limit=100&k=` + term + '&active=True';
    this.jobService.get(_url).subscribe({
      next: (data:any)=>{
      let prev_present_vals:Array<any>=[];
      if(Array.isArray(item.get('values').value)) {
        prev_present_vals = item.get('values')?.value?.map((node)=>node?.id);
      }
      let curr_fetched_vals: Array <any> = data?.qualifications?.sort((qual1, qual2) => qual1?.name?.localeCompare(qual2?.name));
      curr_fetched_vals = curr_fetched_vals?.filter(node => {
        return !prev_present_vals?.includes(node?.id);
      });
      if(Array.isArray(item.get('values')?.value))
      item.get('data').value = [ ...item.get('values')?.value, ...curr_fetched_vals ];
      else
      item.get('data').value = [...curr_fetched_vals];
      item?.get('loading').patchValue(false);
    },
    error: (error) => {
    item?.get('loading').patchValue(false);
    }
  })
  }

  createQualificationPayload() {
    const qualifications = [];
    this.jobTemplateForm?.value?.qualifications?.forEach((qualD)=>{
      const qualification_type_data = {
        id:qualD?.qualification_type_id,
        is_required:qualD?.is_qualification_type_required,
        name: qualD?.qualification_type,
        code: qualD?.qualification_type_code
      }
      const qualification_val_arr = [];
      qualD?.values?.forEach((res)=> {
        const qual_val_obj = {
          id: res?.id,
          level: res?.level ?? 0,
          is_required: res?.is_required ?? false,
          is_locked: res?.is_locked ?? false
        };
        qualification_val_arr.push(qual_val_obj);
      })
      qualification_type_data['qualifications'] = qualification_val_arr;
      qualifications.push(qualification_type_data);
    });
    return qualifications;
  }

  updateQualificationRequired(item,value) {
    item?.get('is_qualification_type_required')?.patchValue(value);
  }

  clearQualificationSearch(event) {
    if(!event || event == '') {
      this.getQualifications()
    }
  }
  //qualification part ends

  //expense part starts

  checkAllowExpense = event => {
    this.allowExpense = event;
    this.allowExpenseEdit = event;
  }
  
  checkAllowExpenseEdit = event => {
    this.allowExpenseEdit = event;
  }

  // expense part ends


  // file parsing starts
  getFileData(data) {
    if (data) {
      if (data?.key) {
        this.jdParsingFile = data;
      }
    } else {
      this.jdParsingFile = {};
      this.quillInputTxt = this.prevJobDescData ?? "";
      this.jobTemplateForm.patchValue({
        description: this.quillInputTxt,
      })
      if (!this.prevJobDescData) {
        this.jobTemplateForm.patchValue({
          description: null,
        })
      };
    }
  }

  dataBeforeParseFile(event) {
    this.prevJobDescData = event;
  }

  getQuillInputText(res) {
    this.quillInputTxt = res;
    if (!res || res?.length == 0) {
      this.quillInputTxt = null;
    }
    if (res?.isParsed) {
      this.isJobParsingDone = true;
      this.quillInputTxt = res?.data;
      this.jobTemplateForm.patchValue({
        description: res?.data,
      })
    }
  }

  // file parsing ends


  // master data starts

  getFoundationalDataArray() {
    return this.jobTemplateForm.get('foundational_data') as UntypedFormArray;
  }

  getFoundationalDataTypes() {
    this.loaderService.show();
    const url = `/configurator/programs/${this.programId}/foundational-data-types?limit=100&page=1&active=true&ordering=ref_order`
    this.jobService.get(url).subscribe({
      next: (res: any) => {
        this.templateFoundationalData.foundational_data_type_array = res?.foundational_data_types;
        this.jobTemplateData?.foundational_data?.forEach((fd) => {
          const findFd = this.templateFoundationalData?.foundational_data_type_array?.find((res) => res?.id == fd?.id);
          if (findFd) {
            findFd.selected = true;
            findFd.values = fd?.foundation_data?.[0];
            findFd.read_only = fd?.is_read_only;
            this.addFdInForm(findFd);
          }
        })
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
      }
    })
  }

  foundationalModalOpen(event) {
    if (this.templateFoundationalData?.foundational_data_type_array?.length == 0) {
      this.getFoundationalDataTypes();
    }
    this.templateFoundationalData.modal_visible = true;
  }

  foundationalModalClose() {
    const fdArrayIds = this.getFoundationalDataArray()?.value?.map((res) => res?.fd_type_id);
    this.templateFoundationalData.foundational_data_type_array.forEach((res) => {
      res.selected = false;
    });

    this.templateFoundationalData.foundational_data_type_array.forEach((res) => {
      if (fdArrayIds?.includes(res?.id)) {
        res.selected = true;
      }
    });
    this.templateFoundationalData.modal_visible = false;
  }

  get foundationalDataSearch() {
    return this.templateFoundationalData.foundational_data_type_array?.filter((res) => res?.name?.toLowerCase()?.includes(this.templateFoundationalData.search_qualification_type))
  }

  addFdTypes() {
    const fdArrayFormIds = this.getFoundationalDataArray()?.value?.map((res) => res?.fd_type_id);
    const fdArrayIds = this.templateFoundationalData.foundational_data_type_array?.filter(res => res?.selected)?.map((res) => res?.id);
    const removeIdx = [];
    fdArrayFormIds?.forEach((fdFormId, i) => {
      if (!fdArrayIds?.includes(fdFormId)) {
        removeIdx.push(i);
      }
    });
    const formArray = this.getFoundationalDataArray();
    removeIdx?.reverse()?.forEach((res) => {
      formArray?.removeAt(res);
    });
    this.templateFoundationalData.foundational_data_type_array.forEach((res) => {
      if (res?.selected) {
        this.addFdInForm(res);
      }
    });
    this.templateFoundationalData.modal_visible = false;
  }

  addFdInForm(fd) {
    if (fd?.selected) {
      const fdArray = this.getFoundationalDataArray();
      const isPresent = fdArray.value.find((res) => res?.fd_type_id == fd?.id);
      if (isPresent) {
        return;
      }
      const group = this.fb.group({
        fd_type_name: [fd?.name],
        fd_type_id: [fd?.id],
        data: [],
        values: [fd?.values],
        read_only: fd?.read_only,
        loading: false
      });
      fdArray.push(group);
      this.searchFoundationTypeValues(group, '');
      this.changeDetection.detectChanges();
    }
  }

  searchFoundationTypeValues(fdGroup, searchTerm) {
    fdGroup.get('loading').setValue(true);
    const url = `/configurator/programs/${this.programId}/foundational-data-types/${fdGroup?.get('fd_type_id')?.value}/foundational-data?&k=${searchTerm}&cf_detail=true&info_level=full&active=true&page=1&limit=25`
    this.jobService.get(url).subscribe({
      next: (res: any) => {
        const selectedVal = fdGroup.get('values').value;
        if (fdGroup.get('values').value) {
          fdGroup.get('data').value = [selectedVal, ...res?.foundational_data?.filter((res) => res?.id != selectedVal?.id)];
        } else {
          fdGroup.get('data').value = [...res?.foundational_data];
        }
        fdGroup.get('data').value = this.sortPipe.transform(fdGroup.get('data').value, 'name');
        fdGroup.get('loading').setValue(false);
      },
      error: (err) => {
        this.alertService.error(err);
        fdGroup.get('loading').setValue(false);
      }
    })
  }

  fdSelection(fd) {
    fd.selected=!fd.selected;
  }

  removeFD(idx) {
    const removedFd = this.getFoundationalDataArray()?.at(idx)?.value;
    this.getFoundationalDataArray()?.removeAt(idx);
    this.templateFoundationalData?.foundational_data_type_array?.forEach((fd) => {
      if (fd?.selected && fd?.id == removedFd?.fd_type_id) {
        fd.selected = false;
      }
    });
  }


  updateFDReadOnly(fdGroup, toggleState) {
    fdGroup.get('read_only').setValue(!toggleState);
  }

  clearFD(fdGroup) {
    fdGroup.get('read_only').setValue(false);
  }

  // foundational data ends


  // resume mandatory part starts

  checkResumeMandatory = event => {
    this.isResumeMandatory = event;
  }


  // job type
  getJobType = () => {
    const url = `/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc`;
    this.jobService.get(url).subscribe({
      next: (res:any) => {
        this.jobTypeItems = res?.picklist_items;
      }
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

