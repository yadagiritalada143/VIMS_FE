import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { JobService } from '../../job.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-job-qualifications',
  templateUrl: './job-qualifications.component.html',
  styleUrls: ['./job-qualifications.component.scss']
})
export class JobQualificationsComponent implements OnInit {
  qualificationForm: UntypedFormGroup = this.formBuilder.group({
    pre_identified_candidate: [''],
    description: [''],
    selectedCredential: [''],
    selectedSkill: [''],
    qualifications: this.formBuilder.array([])
  });
  submitted = false;

  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  selectedTemplate_;
  @Input() set selectedTemplate(template) {

    this.selectedTemplate_ = template;
    if (this.selectedTemplate_ && this.selectedTemplate_.qualifications) {
      const formArray = this.qualificationForm.get('qualifications') as UntypedFormArray;
      while (formArray.length !== 0) {
        formArray.removeAt(0);
      }

      this.selectedTemplate_.qualifications.forEach(element => {
        const control = this.qualificationForm.get('qualifications') as UntypedFormArray;
        const group = this.formBuilder.group({
          qualification_type: [element.qualification_type],
          qualification_type_id: [element.qualification_type_id],
          values: [null],
        });
        control.push(group);
      });


    }
  }
  get selectedTemplate() {
    return this.selectedTemplate_;
  }
  @Input() jobData;
  isCreateCandidate = 'hidden';
  public status;
  public toggle = { value: false };
  tooltipvisible = 'visible';
  selectCredentials: any = [];
  selectedSkills: any = [];
  public ratings = [];
  ratingIndex: any;
  public index: any;
  public low = false;
  public medium = false;
  public high = false;
  public addCandidate = false;
  public dataLoading = false;
  public totalPages = 12;
  public totalRecords = 10;
  public itemsPerPage: 25;
  public tableLoaded = false;
  public currentProgram;
  public candidates = [];
  public selectedQualification: any = {};
  public qualification_types = [];
  public skillsData = [];
  public credentialsData = [];
  public qualificationId: any;
  public modules: any = {}
  public programId: any ;
  constructor(private formBuilder: UntypedFormBuilder,
    public jobService: JobService,
    private _loader: LoaderService,
    private _alert: AlertService,
    public storageService: StorageService,
    public changeDetectorRef: ChangeDetectorRef) {
    this.ratings = [
      { name: '', flag: false },
      { name: '', flag: false },
      { name: '', flag: false }];
    this.modules = {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        // ['link', 'image', 'video'], 
        // [{ 'align': [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ]
    };
  }
  get f() { return this.qualificationForm.controls; }
  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM) ;
    this.programId = this.currentProgram?.id ;

    this.qualificationForm = this.formBuilder.group({
      pre_identified_candidate: [''],
      description: [''],
      selectedCredential: [''],
      selectedSkill: [''],
      qualification: this.formBuilder.group({
        type: [''],
        values: this.formBuilder.group({
          name: [''],
          level: ['']
        })
      })
    });
    this.getQualificationTypes();
    this.patchData();
  }

  clickOnRatings(c, r) {
    c.level = Number(r);
  }
  removeCandidate(i) {
    this.candidates.splice(i, 1);
  }

  removeFromValue(i) {
    const formArray = this.qualificationForm.get('qualifications') as UntypedFormArray;
    // formArray.removeAt(i);
    const formGroup = formArray.controls[i] as UntypedFormGroup;
    formGroup.patchValue(formGroup.get('values').value.splice(i, 1));
  }

  getType(r) {
    let count = 0;
    r?.forEach((e, i) => {
      if (e.flag) {
        count++;
      }
    });
    return count;

  }

  changeEvent(e) {
    if (e && e.length > 0) {
      e.forEach(element => {
        const isPresent = this.selectedSkills.some(skill => skill.name === element);
        const skill = this.skillsData.filter(skill => skill.name === element);
        const type = this.qualification_types.filter(type => type.code === 'SKILL');
        if (skill && skill.length > 0) {
          if (!isPresent) {
            this.selectedSkills.push({
              name: element, id: skill[0].id, skill_id: type[0].id,
              ratings: JSON.parse(JSON.stringify(this.ratings))
            });
          }
        }


      });
    } else {
      this.selectedSkills.push({ e, ratings: '' });
    }

  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }

    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }

    return snakeCaseString.join(' ');

  }
  selectCredential(e) {
    // this.selectCredentials = e;
    this.selectCredentials = new Array();
    this.credentialsData.forEach(skill => {

      e.map(event => {
        if (skill.name === event) {
          const type = this.qualification_types.filter(type => type.code === 'CREDENTIAL');
          this.selectCredentials.push({
            id: skill.id,
            name: skill.name,
            credentials_id: type[0].id
          })
        } else {
          return;
        }
      })
    })

  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.addCandidate = false;
    } else {
      this.toggle.value = true;
      this.addCandidate = true;

    }
  }
  openCreateCandidate() {
    this.isCreateCandidate = 'visible';
  }

  onCreateClose() {
    this.isCreateCandidate = 'hidden';
  }
  candidate(e) {
    this.candidates.push(e);
  }
  saveQualification() {
    this.qualificationForm.value.pre_identified_candidate = this.toggle.value;
    this.qualificationForm.value.candidates = this.candidates;
    this.qualificationForm.value.description = this.qualificationForm.value.description;
    this.qualificationForm.value.selectCredentials = this.selectCredentials;
    this.qualificationForm.value.selectedSkills = this.selectedSkills;
    this.onClose.emit({ type: 'saveQualification', value: 3 });
    this.onSubmit.emit({ type: 'qualificationInfo', data: this.qualificationForm.value });
  }
  backToBasicInfo() {
    this.onClose.emit({ type: 'saveBasic', value: 1 });
  }

  patchData() {
    if (this.selectedTemplate && this.selectedTemplate.description) {
      this.qualificationForm.patchValue({ description: this.selectedTemplate.description });
    }
    if (this.jobData && this.jobData.hasOwnProperty('qualificationInfo')) {
      if (this.jobData && this.jobData.qualificationInfo) {
        this.candidates = this.jobData.qualificationInfo.candidates;
      }
      if (this.jobData.qualificationInfo.pre_identified_candidate) {
        this.toggle.value = this.jobData.qualificationInfo.pre_identified_candidate;
        this.addCandidate = this.toggle.value;
      }
      if (this.jobData && this.jobData.qualificationInfo.selectCredentials) {
        this.selectCredentials = this.jobData.qualificationInfo.selectCredentials;
      }
      if (this.jobData && this.jobData.qualificationInfo.selectedSkills) {
        this.selectedSkills = this.jobData.qualificationInfo.selectedSkills;
      }
      this.qualificationForm.patchValue(this.jobData.qualificationInfo);
    }

    this.changeDetectorRef.detectChanges();
  }
  getQualificationTypes(pageNo = 1) {
    // const programId = '19106c90-e1f5-4016-b7bf-3cdf24a2b183';
    this._loader.show();
    const url = `/configurator/programs/${this.programId}/qualification-types?limit=25&page=${pageNo}&type_all=true`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        this._loader.hide();
        if (data) {
          this.qualification_types = data.qualification_types;
          this.qualification_types.forEach(e => {
            if (e.code == 'CREDENTIAL') {
              this.qualificationId = e.id;
              this.getCredentials();
            } else if (e.code == 'SKILL') {
              this.qualificationId = e.id;
              this.getSkills();
            }
          });
        } else {
          this._loader.hide();
        }
      },
     error: (err) => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      }});
    // }
  }
  getCredentials(pageNo = 1) {
    this._loader.show();
    const url = `/configurator/programs/${this.programId}/qualification-types/${this.qualificationId}/qualifications?limit=25&page=${pageNo}`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        this._loader.hide();
        if (data) {
          this.credentialsData = data.qualifications;

        }
      },
      error: (err) => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      }});
  }
  getSkills(pageNo = 1) {
 
    this._loader.show();
    const url = `/configurator/programs/${this.programId}/qualification-types/${this.qualificationId}/qualifications?limit=25&page=${pageNo}`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        this._loader.hide();
        if (data) {
          this.skillsData = data.qualifications;

        }
      },
      error: (err) => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      }});
  }

  getQualificationValue(qualification_type) {
    if (!qualification_type) {
      return [];
    } else {
      return this.selectedTemplate?.qualifications?.find(temp => temp.qualification_type === qualification_type)?.values || [];
    }
  }

  snakeCase(str) {
    str = str.toLowerCase();
    return str.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

}


