import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Location } from '@angular/common';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-create-job-template',
  templateUrl: './create-job-template.component.html',
  styleUrls: ['./create-job-template.component.scss']
})
export class CreateJobTemplateComponent implements OnInit {
  selectedIDs: any;
  public selectedQualificationData: any = {};
  public tabIndex = 1;
  public foundationTypeList: any[] = [];
  public seletHierarchy = 'hidden';
  public visibility: any;
  public hierarchyData = [];
  public defaultHierarchy: string[] = [];
  public userAssociateHierarchy: string[] = [];
  public selectedHierarchyLevel: any = {};
  public basicJobTemplateInfo: any = {};
  public selectedPayloadData: any;
  public qualifications: any;
  public jobTemplateData: any;
  public selectedDistributionData: any;
  isSaveLoader: boolean = false;
  title = 'Add'
  currentProgram: any;
  jobTemplateId: any;
  public checklist = new Array();
  // is_expense_allowed: any;
  is_submission_exceed_max_bill_rate: any;
  distributionPayload: any;
  programId: any;
  othersPayload: any;
  public selectedOthersData: any;
  // background_check_list: any;
  constructor(
    public jobService: JobService,
    private _loader: LoaderService,
    private _alert: AlertService,
    private _jobsService: JobService,
    public router: SvmsRouterService,
    private route: ActivatedRoute,
    public storageService: StorageService,
    private _confirmService: ConfirmationDialogService,
    private location: Location
  ) { }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.hierarchyList();
    this.jobTemplateId = this.route.snapshot.params['id'];
    this.visibility = this.route.snapshot.params['name'];
    if (this.visibility === 'isview') {
      this.title = 'View'
    } else if (this.visibility === 'isedit') {
      this.title = 'Edit'
    } else {
      this.title = 'Add'
    }
    if (this.jobTemplateId) {
      this.getJobTemplateDetails(this.jobTemplateId);
    }
  }

  getJobTemplateDetails(id) {
    let _url = `/job-manager/programs/${this.programId}/job-templates/${id}`;
    this.jobService.get(_url).subscribe({
      next: (data:any) => {
      if (data?.job_template) {
        this.jobTemplateData = data?.job_template;
        this.selectedIDs = new Array();
        this.jobTemplateData?.hierarchy?.forEach(jh => {
          this.selectedIDs.push(jh?.id);
        });
        if (this.selectedIDs) {
          this.defaultHierarchy = this.selectedIDs;
        }
        let _temp = {
          bindLabel: this.jobTemplateData?.category.category_name + '-' + this.jobTemplateData?.ref_title?.title,
          category: this.jobTemplateData?.category,
          title: this.jobTemplateData?.title?.title,
          id: this.jobTemplateData?.title?.id,
        }
        this.selectedPayloadData = {
          // allow_user_description: this.jobTemplateData?.allow_user_description,
          category: _temp,
          description: this.jobTemplateData?.description,
          level: this.jobTemplateData?.level,
          template_name: this.jobTemplateData?.template_name,
          template_code:this.jobTemplateData?.template_code,
          status: this.jobTemplateData?.is_enabled,
          is_description_editable: this.jobTemplateData?.is_description_editable,
          user_roles: this.jobTemplateData?.user_roles,
          program_industry: this.jobTemplateData?.program_industry,
        }
        this.selectedDistributionData = {
          submission_limit_vendor: this.jobTemplateData?.submission_limit_vendor,
          is_automatic_distribution: this.jobTemplateData?.is_automatic_distribution,
          is_tiered_distribute_schedule: this.jobTemplateData?.is_tiered_distribute_schedule,
          is_manual_distribution_job_submit: this.jobTemplateData?.is_manual_distribution_job_submit,
          is_automatic_distribute_submit: this.jobTemplateData?.is_automatic_distribute_submit,
          is_automatic_distribute_final_approval: this.jobTemplateData?.is_automatic_distribute_final_approval,
          distribute_schedule: this.isEmptyObject(this.jobTemplateData?.distribute_schedule),
          submissions_from_direct_sourcing: this.jobTemplateData?.submissions_from_direct_sourcing,
          after_immediate_distribution_schedule: this.jobTemplateData?.after_immediate_distribution_schedule,
          immediate_distribution: this.jobTemplateData?.immediate_distribution,
          after_immediate_distribution: this.jobTemplateData?.after_immediate_distribution,
        }


        this.selectedOthersData = {
          // questionnaire: this.jobTemplateData?.questionnaire_id,
          rates: this.jobTemplateData?.rates,
          // is_ot_exempt: this.jobTemplateData?.is_ot_exempt
        }
        this.updateQualification();
      }
    }, 
    error: (err) => {
      this._alert.error(errorHandler(err));
    }});
  }

  isEmptyObject(obj) {
    if (obj && (Object.keys(obj).length === 0)) {
      return null
    } else {
      return obj
    }
  }

  updateQualification() {
    // this.selectedQualificationData.is_expense_allowed = this.jobTemplateData?.is_expense_allowed;
    this.selectedOthersData.is_submission_exceed_max_bill_rate = this.jobTemplateData?.is_submission_exceed_max_bill_rate;
    this.selectedOthersData.checklist = this.jobTemplateData?.checklist;
    this.selectedOthersData.is_onboarding_checklist = this.jobTemplateData?.is_onboarding_checklist;
    // this.selectedQualificationData.background_check_list = this.jobTemplateData?.background_check_list;
    // this.selectedQualificationData.is_background_check = this.jobTemplateData?.is_background_check

    this.jobTemplateData?.qualification_types?.forEach((qual)=>{
      qual.name = qual.name || qual?.qualifications?.[0]?.qualification_type?.name;
      if(qual?.name?.toLowerCase() == 'credential') {
        if (!this.selectedQualificationData?.selectedCredential) {
          this.selectedQualificationData.selectedCredential = new Array();
        }
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedCredential.push(res);
        })
      }
      if (qual?.name?.toLowerCase() === 'certification') {
        if (!this.selectedQualificationData?.selectedCertification) {
          this.selectedQualificationData.selectedCertification = new Array();
        } 
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedCertification.push(res);
        })
      }
      if (qual?.name?.toLowerCase() === 'skill') {
        if (!this.selectedQualificationData?.selectedSkill) {
          this.selectedQualificationData.selectedSkill = new Array();
        } 
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedSkill.push(res);
        })
      }
      if (qual?.name?.toLowerCase() === 'education') {
        if (!this.selectedQualificationData?.selectedEducation) {
          this.selectedQualificationData.selectedEducation = new Array();
        } 
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedEducation.push(res);
        })
      }
      if (qual?.name?.toLowerCase() === 'vaccination') {
        if (!this.selectedQualificationData?.selectedVaccination) {
          this.selectedQualificationData.selectedVaccination = new Array();
        } 
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedVaccination.push(res);
        })
      }
      if (qual?.name?.toLowerCase() === 'speciality') {
        if (!this.selectedQualificationData?.selectedSpaciality) {
          this.selectedQualificationData.selectedSpaciality = new Array();
        }
        const qualification_type = {
          id:qual?.id,
          name:qual.name,
          code: qual?.code
        }
        const qualification_type_id = qual?.id;
        qual?.qualifications?.forEach((res)=>{
          res.qualification_type = qualification_type;
          res.qualification_type_id = qualification_type_id;
          this.selectedQualificationData.selectedSpaciality.push(res);
        })
      }
    });
  }




  async hierarchyList(pageNo = 1) {
    let userDetails = this.storageService.get('user');
    let userId = userDetails['id'];
    if (pageNo === 1) {
      this._loader.show();
    }
    // as per latest update
    // `/configurator/programs/${programId}/members/${userId}`
    this._jobsService.get(`/configurator/programs/${this.programId}/hierarchy?user_id=${userId}`).subscribe({
      next: (data:any) => {
      this.hierarchyData = data?.result[0]?.hierarchies;
      // const  parent_hierarchies  = data?.member?.hierarchies;
      this.defaultHierarchy = this.selectedIDs || [this.hierarchyData[0]?.id];
      if (!this.selectedIDs) {
        this.selectedIDs = this.defaultHierarchy;
      }
      this.userAssociateHierarchy = [this.hierarchyData[0]?.id];
      this.selectedHierarchyLevel = this.hierarchyData[0];
      // let hierarchyList = parent_hierarchies?.filter(fd => {
      //   return fd ;
      // }).map(fd => {
      //   fd.name = this.snakeCase(fd.name);
      //   return fd;
      // });

      // const hierarchyDataHttp = hierarchyList.map(dataType => {
      //   return this._jobsService.get(`/configurator/programs/${programId}/hierarchy/${dataType?.id}`);
      // });
      // let hierarchyValue: any[] = [];
      // forkJoin(hierarchyDataHttp).subscribe(res => {
      //   let response = JSON.parse(JSON.stringify(res));
      //   hierarchyValue = response.map(foundData => foundData?.hierarchy);
      //   this.hierarchyData = hierarchyValue;

      // }, err => {
      //   this._alert.error(errorHandler(err));
      // });

      this._loader.hide();
    }, 
    error: error => {
      this._alert.error(errorHandler(error), {});
      this._loader.hide();
    },
    complete: () => {
        this._loader.hide();
      }});
  }
  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }
  selectHierarchy(event) {
    this.changeHierarchy(event, this.hierarchyData);
    this.selectedIDs = event;
  }
  changeHierarchy(id, hierarchyData) {
    hierarchyData.filter(data => {
      if (data.id === id[0]) {
        this.basicJobTemplateInfo.selectedHierarchy = data;
        return data;
      } else {
        if (data.hierarchies && data.hierarchies.length > 0) {
          data.hierarchies.forEach(element => {
            if (element && element.length > 0) {
              if (element.id === id[0]) {
                this.basicJobTemplateInfo.selectedHierarchy = element;

                return element;
              }
            } else {
              this.changeHierarchy(id, data.hierarchies);
            }
          });
        }
      }
    });
  }

  changePage(event) {
    this.tabIndex = event.value;
    if (event?.type === 'qualificationInfo') {
      this.selectedQualificationData = event?.data;
      this.createQualificationPayload(event?.data);
      // this.is_expense_allowed = event?.data?.is_expense_allowed;
    } else if (event?.type === 'otherInfo') {
      event?.data?.checklist?.filter(checklist => {
        if (checklist?.is_enabled) {
          this.checklist = checklist.id;
        }
      });
      event?.data?.checklist?.filter(checklist => {
          if (checklist?.is_enabled) {
            this.checklist = checklist.id;
          }
        });
      this.is_submission_exceed_max_bill_rate = event?.data?.is_submission_exceed_max_bill_rate;
      this.selectedOthersData = event?.data;
    }
    window.scrollTo(0, 0);
  }

  makeJobObject(payLoad) {
    if (payLoad?.type === 'qualificationInfo') {
      this.createQualificationPayload(payLoad?.data);
      this.selectedQualificationData = payLoad?.data;
      // this.is_expense_allowed = payLoad?.data?.is_expense_allowed;
      // this.background_check_list = new Array();
      // payLoad?.data?.background_check_list?.forEach(b_check => {
      //   if (b_check?.is_enabled) {
      //     this.background_check_list?.push(b_check?.id);
      //   }
      // });
      // this.selectedQualificationData.background_check_list = this.background_check_list;
    } else if (payLoad?.type === 'distributionInfo') {
      this.selectedDistributionData = JSON.parse(JSON.stringify(payLoad?.data));
      let payload = payLoad?.data;
      payload.distribute_schedule = payLoad?.data?.distribute_schedule?.id;
      this.distributionPayload = payload;
      setTimeout(() => {
        this.saveJobTemplate();
      }, 100);
    } else if (payLoad?.type === 'basicInfo') {
      const rolesID = [];
      if (payLoad?.data?.user_roles?.id) {
      } else {
        payLoad?.data?.user_roles?.forEach(r => {
          if (r?.id) {
            rolesID.push(r?.id)
          }
        });
      }
      payLoad.data.rolesID = rolesID;
      this.selectedPayloadData = payLoad?.data;
    } else if (payLoad?.type === 'otherInfo') {
      this.selectedOthersData = JSON.parse(JSON.stringify(payLoad?.data));
      let othersData: any = [];
      payLoad?.data?.rates?.forEach(d => {
        if (d?.id) {
          othersData.push({ id: d?.id, bill_rate: d?.bill_rate, pay_rate: d?.pay_rate })
        }
      });
      // payLoad.data.questionnaire = payLoad?.data?.questionnaire;
      payLoad.data.rates = othersData;
      payLoad?.data?.checklist?.filter(checklist => {
        if (checklist?.is_enabled) {
          this.checklist = checklist.id;
        }
      });
      this.othersPayload = payLoad?.data;
      this.is_submission_exceed_max_bill_rate = payLoad?.data?.is_submission_exceed_max_bill_rate;
    }

    this.tabIndex = payLoad?.value;
  }


  createQualificationPayload(data) {
    let qualifications = [];
    if (data?.hasOwnProperty('selectedCredential') && data?.selectedCredential) {
      const value = data?.selectedCredential?.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedCredential[0]?.qualification_type_id, };
      });
      qualifications = qualifications.concat(value);
    }
    if (data?.hasOwnProperty('selectedCertification') && data?.selectedCertification) {
      const value = data?.selectedCertification?.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedCertification[0]?.qualification_type_id, };
      });
      qualifications = qualifications.concat(value);
    }
    if (data?.hasOwnProperty('selectedSpaciality') && data?.selectedSpaciality) {
      const value = data?.selectedSpaciality.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedSpaciality[0]?.qualification_type_id };
      });
      qualifications = qualifications.concat(value);
    }
    if (data?.hasOwnProperty('selectedSkill') && data?.selectedSkill) {
      const value = data?.selectedSkill.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedSkill[0]?.qualification_type_id };
      });
      qualifications = qualifications.concat(value);
    }
    if (data?.hasOwnProperty('selectedVaccination') && data?.selectedVaccination) {
      const value = data?.selectedVaccination.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedVaccination[0]?.qualification_type_id };
      });
      qualifications = qualifications.concat(value);
    }
    if (data?.hasOwnProperty('selectedEducation') && data?.selectedEducation) {
      const value = data?.selectedEducation.map(s => {
        return { qualification_id: s.id, level: s.level, is_required: s.is_required, qualification_type_id: data?.selectedEducation[0]?.qualification_type_id, };
      });
      qualifications = qualifications.concat(value);
    }
    this.qualifications = qualifications
    //new payload modification added will change later.
    let qualification_type_ids = new Set();
    this.qualifications?.forEach((res)=>{
      qualification_type_ids.add(res?.qualification_type_id)
    })
    const qualification_types = [];
    qualification_type_ids?.forEach((res)=>{
      const obj = {};
      obj['id'] = res;
      obj['is_required'] = false;
      obj['qualifications'] = [];
      this.qualifications?.forEach((qual)=>{
        if(res == qual?.qualification_type_id) {
          obj['qualifications'].push(
            {
              id:qual?.qualification_id,
              is_required:qual?.is_required,
              level:qual?.level
            }
          )
        }
      })
      qualification_types.push(obj);
    })
    this.qualifications = qualification_types;
  }

  saveJobTemplate() {
    // this._loader.show();
    this.isSaveLoader = true;
    const PayLoad: any = {
      ...this.distributionPayload,
      template_name: this.selectedPayloadData?.template_name,
      template_code:this.selectedPayloadData?.template_code,
      description: this.selectedPayloadData?.description,
      level: this?.selectedPayloadData?.level,
      category: this.selectedPayloadData?.category?.category?.id,
      ref_title: this.selectedPayloadData?.category?.id,
      // allow_user_description: this.selectedPayloadData?.allow_user_description,
      user_roles: this.selectedPayloadData?.rolesID,
      program_industry: this.selectedPayloadData?.program_industry ? [this.selectedPayloadData?.program_industry] : [],
      // user_roles : {id: this.selectedPayloadData?.rolesID},
      is_description_editable: this.selectedPayloadData?.is_description_editable || false,
      is_onboarding_checklist: this.selectedOthersData?.is_onboarding_checklist || false,
      // is_background_check: this.selectedQualificationData?.is_background_check || false,
      // program_id: programId,
      qualification_types: this.qualifications,
      // is_expense_allowed: this.is_expense_allowed,
      is_submission_exceed_max_bill_rate: this.is_submission_exceed_max_bill_rate ? this.is_submission_exceed_max_bill_rate : false,

      // checklist: { id: this.checklist },
      // hierarchy: this.defaultHierarchy[0] ? this.defaultHierarchy[0] : '',
      // msp_manager: '',
      hierarchy: this.selectedIDs,
      submit_type: 'SUBMIT',
      // questionnaire_id: this.othersPayload?.questionnaire || null,
      // questionnaire: {id: [this.othersPayload?.questionnaire] || null},
      rates: this.othersPayload?.rates,
      // is_ot_exempt: this.othersPayload?.is_ot_exempt,
      // status: 'pending_review',
      // foundational_data: [],
      // is_delete: this.selectedPayloadData.status,
      is_template: true,
      // start_date: "2020-08-24T07:02:44Z",
      // end_date: "2020-10-24T07:02:47Z",
    };
    if (this.selectedPayloadData.hasOwnProperty('status')) {
      PayLoad.is_enabled = this.selectedPayloadData?.status
      // if (this.selectedPayloadData.status) {
      //   PayLoad.is_delete = false;
      // } else {
      //   PayLoad.is_delete = true;
      // }
    }
    if (this.selectedOthersData?.is_onboarding_checklist) {
      PayLoad.checklist = this.checklist
    }
    // if (this.selectedQualificationData?.is_background_check) {
    //   PayLoad.background_check_list = this.background_check_list
    // }
    if (this.jobTemplateId) {
      delete PayLoad.category;
      const url = `/job-manager/programs/${this.programId}/jobs/${this.jobTemplateId}`;
      this.jobService.put(url, PayLoad).subscribe({
        next: (data: any) => {
        // this._loader.hide();
        this.isSaveLoader = false;
        this._alert.success('Job Template updated Successfully');
        this.tabIndex = 1;
        this.selectedPayloadData = {};
        this.selectedQualificationData = {};
        // this.router.navigate(['/program-setup/job-template/create']);
        this.router.navigate(['job-template','list']);

        this.title = 'Add'
      }, 
      error: error => {
        this._alert.error(errorHandler(error), {});
        // this._loader.hide();
        this.isSaveLoader = false;
      }});
    } else {
      const url = `/job-manager/programs/${this.programId}/jobs`;
      this.jobService.post(url, PayLoad).subscribe({
        next: (data: any) => {
        // this._loader.hide();
        this.isSaveLoader = false;
        this._alert.success('Job Template Created Successfully');
        this.tabIndex = 1;
        this.selectedPayloadData = {};
        this.selectedQualificationData = {};
        this.title = 'Add'
        this.router.navigate(['job-template','list']);
      }, 
      error: error => {
        this._alert.error(errorHandler(error), {});
        // this._loader.hide();
        this.isSaveLoader = false;
      }});
    }
  }

  goBack() {
    this._confirmService.confirm('', `Are you sure to cancel?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.location.back();
        }
      })
      .catch(() => {

      });
  }

}
