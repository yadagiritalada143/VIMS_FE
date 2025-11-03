
import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
@Component({
  selector: 'app-qualification',
  templateUrl: './qualification.component.html',
  styleUrls: ['./qualification.component.scss']
})
export class QualificationComponent implements OnInit, OnChanges {
  public qualificationForm: UntypedFormGroup;
  // public is_expense_allowed = true;
  public loader: any;
  public tabIndex = 0;
  public certificationTypeId: any;
  public vaccineTypeId: any;
  public credentialTypeId: any;
  public specialityTypeId: any;
  public educationTypeId: any;
  public skillTypeId: any;
  public jobCategoryData: any = [];
  public jobspacialityData: any = [];
  public jobvaccinationData: any = [];
  public jobskillData: any = [];
  public jobeducationData: any = [];
  public jobCertificateData: any = [];
  jobTemplateviewData: any;
  currentProgram: any;
  SelectedID: any;
  visibility: any;

  public backgroundcheckData: any = [];
  isbackgroundChecks: any;

  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  @Input() isSaveLoader: boolean;
  @Input() qualificationsFormData: any;
  @Input() set selectedHierarchyLevel(data) {
    if (data) {
      this.SelectedID = data;
    }
  }
  get selectedHierarchyLevel() {
    return this.SelectedID;
  }
  @Input() set jobTemplateData(data) {
    if (data) {
      this.jobTemplateviewData = data;
    }
  }
  get jobTemplate() {
    return this.jobTemplateviewData;
  }
  constructor(
    public route: ActivatedRoute,
    public jobService: JobService,
    private formBuilder: UntypedFormBuilder,
    private alertService: AlertService,
    private storageService: StorageService,
    private sortPipe: SortHelperPipe
  ) {}

  ngOnInit(): void {
    this.visibility = this.route.snapshot.params['name'];
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.loader = true;
    this.qualificationForm = this.formBuilder.group({
      selectedCredential: [''],
      selectedSkill: [''],
      selectedVaccination: [''],
      selectedSpaciality: [''],
      selectedEducation: [''],
      selectedCertification: [''],
      // is_expense_allowed: true,
      // is_background_check: false,
      // background_check_list: [],
    });
    this.dataPatch();
  }

  ngOnChanges(): void {
    this.dataPatch();
  }

  dataPatch(): void {
    if (this.qualificationsFormData && Object.keys(this.qualificationsFormData).length != 0) {
      this.qualificationForm.patchValue({
        selectedCredential:
          this.setData(this.qualificationsFormData?.selectedCredential) || this.qualificationsFormData?.selectedCredential,
        selectedCertification:
          this.setData(this.qualificationsFormData?.selectedCertification) || this.qualificationsFormData?.selectedCertification,
        selectedSkill: this.setData(this.qualificationsFormData?.selectedSkill) || this.qualificationsFormData?.selectedSkill,
        selectedVaccination:
          this.setData(this.qualificationsFormData?.selectedVaccination) || this.qualificationsFormData?.selectedVaccination,
        selectedSpaciality:
          this.setData(this.qualificationsFormData?.selectedSpaciality) || this.qualificationsFormData?.selectedSpaciality,
        selectedEducation: this.setData(this.qualificationsFormData?.selectedEducation) || this.qualificationsFormData?.selectedEducation,
        // is_expense_allowed: this.qualificationsFormData?.is_expense_allowed,
        // is_background_check: this.qualificationsFormData?.is_background_check,
      });
      // this.isbackgroundChecks = this.qualificationsFormData?.is_background_check;
      // this.is_expense_allowed = this.qualificationsFormData?.is_expense_allowed;
    }

    // const b_data = this.qualificationsFormData?.background_check_list;
    // if (b_data && b_data?.length > 0) {
    //   this.qualificationForm.patchValue({
    //     background_check_list: this.qualificationsFormData?.background_check_list,
    //   });
    // }
    this.getQualifications();
    // setTimeout(() => {
    //   this.getbackgroundChecks();
    // }, 200);
  }

  setData(data) {
    if (data && data?.length > 0) {
      data?.forEach(qd => {
        // qd.qualification_type = qd?.qualification_type?.qualification_type;
        qd.qualification_type_id = qd?.qualification_type?.id;
      });
      return data;
    } else {
      return data;
    }
  }

  // allowExpense() {
  //   this.is_expense_allowed = !this.is_expense_allowed;
  //   this.qualificationForm.patchValue({
  //     is_expense_allowed: this.is_expense_allowed
  //   })
  // }

  backTo() {
    this.onClose.emit({ type: 'qualificationInfo', data: this.qualificationForm.value, value: 2 });
  }
  getQualifications() {
    this.jobService.getQualificationsByProgram(this.SelectedID).subscribe({
      next: (data:any) => {
      if (data) {
        this.loader = false;
        let qualificationArr = data.qualification_types;
        // To confirm from Product Manager if pre-existing conditions require any alteration
        qualificationArr.filter((type) => {
          if (type.code == 'CERTIFICATION' && type.is_enabled) {
            this.certificationTypeId = type.id;
            this.getCertificates();
          } else if (type.code == 'VACCINATION' && type.is_enabled) {
            this.vaccineTypeId = type.id;
            this.getVaccinations();
          } else if (type.code == 'CREDENTIAL' && type.is_enabled) {
            this.credentialTypeId = type.id;
            this.getCredential();
          } else if (type.code == 'SPECIALITY' && type.is_enabled) {
            this.specialityTypeId = type.id;
            this.getSpecialities();
          } else if (type.code == 'EDUCATION' && type.is_enabled) {
            this.educationTypeId = type.id;
            this.getEducationList();
          } else if (type.code == 'SKILL' && type.is_enabled) {
            this.skillTypeId = type.id;
            this.getSkills();
          }

        });
      }
    }, 
    error: (err) => {
      this.alertService.error(errorHandler(err));
    }})
  }
  getCertificates() {
    const certificationId = this.certificationTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${certificationId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedCertification && this.qualificationForm?.value?.selectedCertification.length) {
          this.qualificationForm?.value?.selectedCertification?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e.id === d.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobCertificateData = data?.qualifications;
      })
  }
  getCredential() {
    const credentialId = this.credentialTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${credentialId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedCredential && this.qualificationForm?.value?.selectedCredential.length) {
          this.qualificationForm?.value?.selectedCredential?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e?.id === d?.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobCategoryData = data?.qualifications;
        window.scrollTo(0, 0);
      })
  }
  getSpecialities() {
    const specialityId = this.specialityTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${specialityId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedSpaciality && this.qualificationForm?.value?.selectedSpaciality.length) {
          this.qualificationForm?.value?.selectedSpaciality?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e?.id === d?.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobspacialityData = data?.qualifications;
        window.scrollTo(0, 0);
      })
  }
  getVaccinations() {
    const vaccinationId = this.vaccineTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${vaccinationId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedVaccination && this.qualificationForm?.value?.selectedVaccination.length) {
          this.qualificationForm?.value?.selectedVaccination?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e?.id === d?.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobvaccinationData = data?.qualifications;
        window.scrollTo(0, 0);
      })
  }
  getSkills() {
    const skillId = this.skillTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${skillId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedSkill && this.qualificationForm?.value?.selectedSkill.length) {
          this.qualificationForm?.value?.selectedSkill?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e?.id === d?.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobskillData = data?.qualifications;
        window.scrollTo(0, 0);
      })
  }
  getEducationList() {
    const educationId = this.educationTypeId;
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${educationId}/qualifications`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (this.qualificationForm?.value?.selectedEducation && this.qualificationForm?.value?.selectedEducation.length) {
          this.qualificationForm?.value?.selectedEducation?.forEach(e => {
            data?.qualifications?.forEach(d => {
              if (e?.is_required && (e.id === d.id)) {
                d.is_required = true;
                d.qualification_type_id = e?.qualification_type_id;
                d.level = e?.level;
              }
            });
          });
        }
        this.jobeducationData = data?.qualifications;
        window.scrollTo(0, 0);
      })
  }
  updateQualificationId(data) {
    if (data === 'selectedCredential') {
      this.qualificationForm.value.selectedCredential?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.credentialTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    } else if (data === 'selectedCertification') {
      this.qualificationForm.value.selectedCertification?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.certificationTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    } else if (data === 'selectedSkill') {
      this.qualificationForm.value.selectedSkill?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.skillTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    } else if (data === 'selectedVaccination') {
      this.qualificationForm.value.selectedVaccination?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.vaccineTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    } else if (data === 'selectedSpaciality') {
      this.qualificationForm.value.selectedSpaciality?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.specialityTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    } else if (data === 'selectedEducation') {
      this.qualificationForm.value.selectedEducation?.forEach(c => {
        if (!c?.qualification_type_id) {
          c.qualification_type_id = this.educationTypeId;
          c.level = 0;
          c.is_required = false;
        }
      });
    }
  }
  clickOnRatings(c, r) {
    c.level = Number(r);
  }

  removeItems(data, i) {
    if (data === 'selectedCredential') {
      this.qualificationForm.value.selectedCredential.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedCredential: this.qualificationForm.value.selectedCredential
      })
    } else if (data === 'selectedCertification') {
      this.qualificationForm.value.selectedCertification.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedCertification: this.qualificationForm.value.selectedCertification
      })
    } else if (data === 'selectedSkill') {
      this.qualificationForm.value.selectedSkill.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedSkill: this.qualificationForm.value.selectedSkill
      })
    } else if (data === 'selectedVaccination') {
      this.qualificationForm.value.selectedVaccination.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedVaccination: this.qualificationForm.value.selectedVaccination
      })
    } else if (data === 'selectedSpaciality') {
      this.qualificationForm.value.selectedSpaciality.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedSpaciality: this.qualificationForm.value.selectedSpaciality
      })
    } else if (data === 'selectedEducation') {
      this.qualificationForm.value.selectedEducation.splice(i, 1);
      this.qualificationForm.patchValue({
        selectedEducation: this.qualificationForm.value.selectedEducation
      })
    }

  }
  searchQualifications(type, value) {
    let qualificationTypeId;
    if (type === 'selectedCredential') {
      qualificationTypeId = this.credentialTypeId;
    } else if (type === 'selectedCertification') {
      qualificationTypeId = this.certificationTypeId;
    } else if (type === 'selectedSkill') {
      qualificationTypeId = this.skillTypeId;
    } else if (type === 'selectedVaccination') {
      qualificationTypeId = this.vaccineTypeId;
    } else if (type === 'selectedSpaciality') {
      qualificationTypeId = this.specialityTypeId;
    } else if (type === 'selectedEducation') {
      qualificationTypeId = this.educationTypeId;
    }
    const _url = `/configurator/programs/${this.currentProgram}/qualification-types/${qualificationTypeId}/qualifications?k=` + value.term;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        data.qualifications=this.sortPipe.transform(data?.qualifications,'name');
        if (type === 'selectedCredential') {
          this.jobCategoryData = data?.qualifications;
        } else if (type === 'selectedCertification') {
          this.jobCertificateData = data?.qualifications;
        } else if (type === 'selectedSkill') {
          this.jobskillData = data?.qualifications;
        } else if (type === 'selectedVaccination') {
          this.jobvaccinationData = data?.qualifications;
        } else if (type === 'selectedSpaciality') {
          this.jobspacialityData = data?.qualifications;
        } else if (type === 'selectedEducation') {
          this.jobeducationData = data?.qualifications;
        }
      })
  }

  saveQualification() {

    // let Background = this.qualificationForm?.value?.background_check_list;
    // if (this.isbackgroundChecks) {
    //   if (Background && Background?.length > 0) {
    //     let isEnabled = Background.filter(c => c.is_enabled);
    //     if (isEnabled && isEnabled.length === 0) {
    //       this.alertService.error(`Please Select Background checks.`);
    //       return;
    //     }
    //   } else {
    //     this.alertService.error(`Please Select Background checks.`);
    //     return;
    //   }
    // }

    // this.onClose.emit({ type: 'saveQualification', value: 4 });
    this.onSubmit.emit({ type: 'qualificationInfo', data: this.qualificationForm.value, value: 4 });
  }


  // get background checks

  // getbackgroundChecks() {
  //   const _url = `/configurator/programs/${this.currentProgram}/background-checklists/required-criterias`;
  //   this.jobService.get(_url).subscribe(
  //     (data: any) => {
  //       if(data && data?.required_criterias && data?.required_criterias?.length > 0) {
  //       this.backgroundcheckData = data?.required_criterias?.filter(b=>b.is_enabled);
  //       this.backgroundcheckData?.forEach(c => {
  //         if(this.qualificationsFormData?.background_check_list && this.qualificationsFormData?.background_check_list?.length){
  //         let isCheck = this.qualificationsFormData?.background_check_list?.some( b => b === c?.id);
  //         if(isCheck) {
  //           c.is_enabled = true;
  //         } else {
  //           c.is_enabled = false;
  //         }
  //       } else {
  //         c.is_enabled = false;
  //       }
  //       });
  //       this.qualificationForm.patchValue({
  //         background_check_list: this.backgroundcheckData
  //       });
  //       this.qualificationForm?.controls?.background_check_list?.updateValueAndValidity();
  //     }
  //     });
  // }

  // removeBackgroundChecks() {
  //   this.isbackgroundChecks = !this.isbackgroundChecks;
  //   if (!this.isbackgroundChecks) {
  //     this.qualificationForm?.value?.background_check_list?.forEach(q => {
  //       q.is_enabled = false;
  //     });
  //   }
  //   this.qualificationForm?.patchValue({
  //     is_background_check: this.isbackgroundChecks
  //   });
  // }

}
