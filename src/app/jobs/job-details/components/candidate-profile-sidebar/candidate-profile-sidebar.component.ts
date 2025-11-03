import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';

@Component({
  selector: 'app-candidate-profile-sidebar',
  templateUrl: './candidate-profile-sidebar.component.html',
  styleUrls: ['./candidate-profile-sidebar.component.scss'],
})
export class CandidateProfileSidebarComponent implements OnInit {
  certificationShowHide = true;
  candidateData: any;
  qualificationTypeName;
  certificationsArr = [];
  credentialsArr = [];
  vaccinationsArr = [];
  skillsArr = [];
  educationArr = [];
  specialityArr = [];
  jobData: any;
  jobId: any;
  customFields:Array<any>;
  tableNoDataObj: any;
  visibleIndices = new Set<number>();
  visibleCredentialIndices = new Set<number>();
  visibleSkillIndices = new Set<number>();
  visibleEducationIndices = new Set<number>();
  visibleVaccinationIndices = new Set<number>();
  visibleSpecialityIndices = new Set<number>();
  isCustomFieldOnLoad: boolean = false; // Adding as part of BugFix V2M-6533
  public isLoading: boolean = true;
  public qualificationData: boolean = false;
  apiData;
  backEndData;
  @Input() showUseThisProfile=false;
  @Input() showSkelton;
  @Input() public set data(data: any) {
    this.apiData = data?.api_data?.backend_data;
    this.backEndData = this.apiData?.new_data;
    this.isLoading = true;
    this.candidateData = data?.candidate || this.backEndData;
    this.certificationsArr = [];
    this.credentialsArr = [];
    this.vaccinationsArr = [];
    this.skillsArr = [];
    this.educationArr = [];
    this.specialityArr = [];
    this.jobId = data?.jobUrlId

    this.tableNoDataObj = {
      headTitle: 'No Qualifications Added Yet',
      subTitle: 'No qualification added yet for this profile',
      imageUrl: '../../../../assets/images/no-qualification.svg',
      editProfileButton: 'Edit Profile',
      candidate_id: data?.candidateId,
      job_id: data?.job_id,
      reference_page: data?.reference_page,
    };

    if (this.candidateData?.qualifications?.length) {
      this.candidateData.qualifications.filter(can => {
        if (can.qualification_type) {
          this.getTypeName(can);
          if(this.skillsArr?.length>0) {
            this.skillsArr = this.sortHelperPipe.transform(this.skillsArr, 'qualification_name');
          }
        }
      });
    }
    this.isLoading = false;
    this.convertCustomFieldToArray();
  }

  constructor(private alert: AlertService,
    private candidateService: CandidateService,
    private storageService: StorageService,
    private s3UploadService: AwsS3FileUploadService,
    private cryptoService: CryptoService,
    private _loader:LoaderService,
    private sortHelperPipe: SortHelperPipe,
    private router: Router,
    ) {}

  get address() {
    return this.candidateData?.addresses ? this.candidateData?.addresses.find(add => add.type === 'PRIMARY') : null;
  }

  socialprofile_icons = {
    facebook: '../../../assets/images/facebook-icon.svg',
    linkedin: '../../../assets/images/linked.svg',
    skype: '../../../../assets/images/skype-icon.svg',
    git: '../../../../assets/images/github-icon.svg',
    instagram: '../../../../assets/images/instagram-icon.svg',
  };

  ngOnInit(): void {}

  openFile(data) {
    if (data?.url) {
      window.open(data?.url);
    }
  }
  checkValidFileType(file) {
    return file.split('.').pop();
  }

  getTypeName(can) {
    this.qualificationTypeName = can.qualification_name;
    if (can?.qualification_type?.code == 'CERTIFICATION') {
      can['certification_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.certificationsArr.push(can);
    } else if (can?.qualification_type?.code == 'VACCINATION') {
      can['vaccine_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.vaccinationsArr.push(can);
    } else if (can?.qualification_type?.code == 'CREDENTIAL') {
      can['credential_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.credentialsArr.push(can);
    } else if (can?.qualification_type?.code == 'SPECIALITY') {
      can['speciality_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.specialityArr.push(can);
    } else if (can?.qualification_type?.code == 'EDUCATION') {
      can['education_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.educationArr.push(can);
    } else if (can?.qualification_type?.code == 'SKILL') {
      can['skill_name'] = this.qualificationTypeName;
      this.qualificationData = true;
      this.skillsArr.push(can);
      

    }
  }
  toggleCertification() {
    this.certificationShowHide = !this.certificationShowHide;
  }
  loadAddress(data) {
    let street1 =
      data?.address_line1?.trim() != '' && data?.address_line1 != undefined && data?.address_line1 != null
        ? data?.address_line1 + ' ,'
        : '';
    const city = data?.city?.trim() !== '' && data?.city != undefined && data?.city != null ? data?.city + ' ,' : '';
    let country = data?.country?.trim() !== '' && data?.country != undefined && data?.country != null ? data?.country + ' ,' : '';
    const zip = data?.zipcode?.trim() !== '' && data?.zipcode != undefined && data?.zipcode != null ? data?.zipcode : '';
    const state = data?.state?.trim() !== '' && data?.state != undefined && data?.state != null ? data?.state + ' ,' : '';
    if (country && zip == '') {
      country = country.slice(0, -1);
    }
    return street1 + city + state + country + zip;
  }

  // showHideDetail() {
  //   this.showDetails = !this.showDetails;
  // }

  convertCustomFieldToArray() {
    /** Commenting as part of BugFix V2M-6533 */
    // if (this.candidateData && this.candidateData.custom_fields) {
    //   const customFields = Object.entries(this.candidateData.custom_fields)?.map((e:any) => {
    //       return {
    //         slug: this.convertCustomFieldName(e[0]),
    //         value: e[1] &&  e[1] !== '' ? e[1] : '-',
    //       }
    //   });
    //   this.customFields = customFields;
    // }else{
    //   this.customFields = [];
    // }

    /** Adding as part of BugFix V2M-6533 */
    if (!this.candidateData?.custom_fields) return;
    if (this.isCustomFieldOnLoad) return;
    this.isCustomFieldOnLoad = !this.isCustomFieldOnLoad;
    const programId = this.storageService?.get(StorageKeys?.CURRENT_PROGRAM)?.id;
    const customFieldHttp = this.candidateService?.get(`/configurator/programs/${programId}/custom-fields?entity_ref=CANDIDATES&active=1&order_by=asc&key=ref_order`);
    customFieldHttp?.subscribe((res: any) => {
      this.customFields = [];
        if (res?.custom_fields?.length) {
        res?.custom_fields?.forEach((cf,i) => {
          if (typeof this.candidateData?.custom_fields?.[cf?.slug].value === 'object' && Object.keys(this.candidateData?.custom_fields?.[cf?.slug].value).length === 0) return;
          if (Object.keys(this.candidateData?.custom_fields)?.includes(cf?.slug)) {
            const custom_data = {
              slug: this.convertCustomFieldName(cf?.label),
              value: cf?.type == "TOGGLE" || cf?.type == 'NUMBERS' ? this.candidateData?.custom_fields?.[cf?.slug]?.toString() : (this.candidateData?.custom_fields?.[cf?.slug] || '-'),
              type: cf?.type?.toUpperCase()
            }
            if(cf?.meta_data?.currency) {
              custom_data['currency'] = cf?.meta_data?.currency;
            }

            if(Array.isArray(custom_data?.value) && custom_data?.type == 'DROPDOWN' && cf?.meta_data?.datasource?.is_multi_select) {
              const val = [];
              custom_data?.value?.forEach((res,i)=>{
                cf?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                   if(res == custom_field_data?.value) {
                    val.push(custom_field_data?.label);
                   }
                })
              });
              custom_data.value = val;
            }

            if(cf?.type == 'SOURCE' && this.candidateData?.custom_fields?.[cf?.slug]) {
              let url = cf.api_url
              const index = this.customFields?.length;
              url = url.includes('?') ? url += `&user_ids=${this.candidateData?.custom_fields?.[cf?.slug]}` : url += `&user_ids=${this.candidateData?.custom_fields?.[cf?.slug]}`
              this._loader.show();
              this.candidateService.get(url).subscribe({
                next: (data: any) => {
                  this.customFields[index]['value'] = data?.members[0]?.full_name
                  this._loader.hide();
                }, error: () => {
                  this._loader.hide();
                },
              });
            }
            if(cf?.type == 'NUMBERS') {
              if (cf?.meta_data?.show_in_thousands) {
                custom_data.value = this.candidateData?.custom_fields?.[cf?.slug]?.toLocaleString('en-US', {minimumFractionDigits: cf?.meta_data?.decimal});
              } else if (!cf?.meta_data?.show_in_thousands && cf?.meta_data?.decimal) {
                custom_data.value = this.candidateData?.custom_fields?.[cf?.slug]?.value.toFixed(cf?.meta_data?.decimal)
              }
            }
            this.customFields?.push(custom_data);
          }
        });
        this.candidateData.custom_fields = this.customFields;
      }
    });
  }

  convertCustomFieldName(slugName: string) {
    let value: string;
    if(slugName){
      let arrayOfData = slugName.split('_');
      if (arrayOfData.length > 0) {
        value = arrayOfData.map(x => this.capitalizeFirstLetter(x)).join(' ');
      } else {
        value = this.capitalizeFirstLetter(arrayOfData[0]);
      }
    }
    return value;
  }

  capitalizeFirstLetter(name: string) {
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return '';
  }

  showHideDetail(index): void {
    if (!this.visibleIndices.delete(index)) {
      this.visibleIndices.add(index);
    }
  }

  showHideCredentialDetail(index) {
    if (!this.visibleCredentialIndices.delete(index)) {
      this.visibleCredentialIndices.add(index);
    }
  }

  showHideVaccination(index) {
    if (!this.visibleVaccinationIndices.delete(index)) {
      this.visibleVaccinationIndices.add(index);
    }
  }

  showHideSkillDetail(index) {
    if (!this.visibleSkillIndices.delete(index)) {
      this.visibleSkillIndices.add(index);
    }
  }

  showHideEducation(index) {
    if (!this.visibleEducationIndices.delete(index)) {
      this.visibleEducationIndices.add(index);
    }
  }
  showHideSpeciality(index) {
    if (!this.visibleSpecialityIndices.delete(index)) {
      this.visibleSpecialityIndices.add(index);
    }
  }

  downloadAttachment(data) {
    data = this.cryptoService?.decrypt(data);
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    } else {
      this.alert.error('Resume Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }

  checkIfArray(arr){
    if (Array.isArray(arr)) {
      return true;
    }
    else{
      return false;
    }
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  isObjectArray(obj : any) {
    return Array.isArray(obj)
  }

  submitThisCandidate(){
    this.router.navigate(['/candidates/submit-candidate'],
  { queryParams: { jobId: this.jobId, type: 'submit', candidateId: this.candidateData.id } });
  }

}
