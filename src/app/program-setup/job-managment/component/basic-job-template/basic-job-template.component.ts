import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { JobService } from 'src/app/jobs/job.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-basic-job-template',
  templateUrl: './basic-job-template.component.html',
  styleUrls: ['./basic-job-template.component.scss']
})
export class BasicJobTemplateComponent implements OnInit {
  @ViewChild('userSelect') ngSelectComponent: NgSelectComponent;
  public modules: any;
  programId: any;
  public basicJobTemplateForm: UntypedFormGroup;
  public isSubmited: any;
  usersearchCategory = new Subject<string>();
  templateName = new Subject<string>();
  programIndustries = new Subject<string>();
  public jobCategoryData = [];
  public jobTemplateInfo: any;
  public jobTemplateviewData: any;
  public isNamePresent = false;
  isEdit = false;
  visibility: any;
  userRoles: any = [];
  public industries: any = [];
  public itemPerPage: number = 25;
  public Page = 1;
  rolesearch = new Subject<string>();
  public toggle = {
    value: true
  }
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  @Input() set jobTemplateData(data) {
    if (data) {
      this.jobTemplateviewData = data;
      this.patchData();
    }
  }
  get jobTemplate() {
    return this.jobTemplateviewData;
  }
  constructor(
    public jobService: JobService,
    public userService: UserService,
    private alertService: AlertService,
    public router: Router,
    public route: ActivatedRoute,
    private storageService: StorageService,
    private fb: UntypedFormBuilder,
    private sortPipe: SortHelperPipe
    ) {
    this.modules = {
      'toolbar': [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote'],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ]
    }
    this.rolesearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.getRoles(value?.term);
      });

      this.programIndustries.pipe(
        debounceTime(300),
        distinctUntilChanged())
        .subscribe((value: any) => {
          this.getProgramIndustryList(value?.term, true);
        });


    this.usersearchCategory.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe((value:any) => {
        if (value) {
          this.searchCategoryAndTitle(value);
        }
      });

    this.templateName.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe((value:any) => {
        if (value) {
          this.checkNameExist();
        }
      });
  }

  ngOnInit(): void {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.getRoles(null);
    this.getProgramIndustryList('');
    this.visibility = this.route.snapshot.params['name'];
    this.basicJobTemplateForm = this.fb.group({
      // Removing Template name Pattern Validation as par of V2M-10842
      // template_name: ['', [Validators.required, Validators.pattern(/^[A-Za-z][A-Za-z0-9\s!@$_\-^/&()#%*+=':?<>;"]*$/)]],
      template_name: ['', [Validators.required]],
      template_code:[''],
      category: ['', [Validators.required]],
      level: ['', [Validators.min(1), Validators.max(255)]],
      // allow_user_description: [''],
      is_description_editable: false,
      user_roles: [],
      description: [''],
      status: this.toggle.value,
      program_industry: ['' ,Validators.required]
    });
    let data = { term: '' }
    this.searchCategoryAndTitle(data);
    this.basicJobTemplateForm.reset();
    // this.basicJobTemplateForm.patchValue({
    //   allow_user_description: true,
    // })
    this.patchData();
  }

  getProgramIndustryList(term, reset = false) {
    if (reset) {
      this.Page = 1;
    }
    let url = `/configurator/programs/${this.programId}/industries?${term ? 'name=' + term : ''}`
    return this.userService.get(url).subscribe((data:any) => {
      data.industries=this.sortPipe.transform(data?.industries,'name');
      this.industries = data?.industries;
      // if (this.industries && this.industries?.length > 0) {
      //   this.basicJobTemplateForm?.controls?.program_industry?.setValidators([Validators.required]);
      // } else {
      //   this.basicJobTemplateForm?.controls?.program_industry?.setValidators(null);
      //   this.basicJobTemplateForm?.controls?.program_industry?.clearValidators();
      //   this.basicJobTemplateForm?.controls?.program_industry?.setErrors(null);
      // }
    });
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
    } else {
      this.toggle.value = true;
    }
  }

  patchData() {
    if (this.jobTemplateviewData) {
      this.basicJobTemplateForm?.patchValue({
        template_name: this.jobTemplateviewData?.template_name,
        category: this.jobTemplateviewData?.category,
        template_code: this.jobTemplateviewData?.template_code,
        level: this.jobTemplateviewData?.level,
        // allow_user_description: this.jobTemplateviewData?.allow_user_description,
        description: this.jobTemplateviewData?.description,
        is_description_editable: this.jobTemplateviewData?.is_description_editable,
        user_roles: this.jobTemplateviewData?.user_roles,
      });

      const industry = this.jobTemplateviewData?.program_industry;
      if(industry && Array.isArray(industry) && industry.length) {
        this.basicJobTemplateForm?.patchValue({
          program_industry: industry[0]?.id
        });
      }

      this.checkRoles();
      if (this.jobTemplateviewData.hasOwnProperty('status')) {
        this.toggle = { value: this.jobTemplateviewData.status }
      }
      if (this.visibility === 'isview') {
        this.isEdit = true;
      } else {
        this.isEdit = false;
      }

    }
  }
  addBasicInfo() {
    this.isSubmited = true;
    if (this.jobTemplateInfo && this.jobTemplateInfo?.code == 0) {
      this.alertService.error(`Job Template Title is already exist.`);
      return;
    }
    if (this.basicJobTemplateForm.controls['level'].invalid) {
      this.alertService.error(`Job Level must be between 1 to 255`);
      return;
    }
    if (this.visibility !== 'isview' && this.basicJobTemplateForm.invalid) {
      this.alertService.error(`Please fill the required fields.`);
      return;
    }
    let jobTemplateDetails = this.basicJobTemplateForm.value;
    jobTemplateDetails.status = this.toggle.value;
    this.onSubmit.emit({ type: 'basicInfo', data: jobTemplateDetails, value: 2 });
  }
  updateDescription(data) {
    this.basicJobTemplateForm.patchValue({
      description: data?.description
    })
  }
  checkNameExist() {
    if (!this.visibility) {
      this.isNamePresent = true;
      let programDetails = (this.storageService.get(StorageKeys.CURRENT_PROGRAM));
      const currentProgram = programDetails['id'];
      let name = this.basicJobTemplateForm?.controls['template_name']?.value;
      const url = `/job-manager/programs/${currentProgram}/unique-template-name?template_name=` + name;
      this.jobService.get(url).subscribe({
        next: (data:any) => {
          if (data.error) {
            this.jobTemplateInfo = data.error;
          }
          this.isNamePresent = false;

        }, 
        error: (err) => {
          this.isNamePresent = false;
        }})
    }
  }

  searchCategoryAndTitle(value) {
    const _url = `/job-manager/job-catalog/category_title?q=` + value.term + "&order_by=title,category__category_name";
    this.jobService.get(_url).subscribe(
      (data:any) => {
        let categoryData = data?.data;
        categoryData?.forEach(d => {
          d.bindLabel = d?.category?.category_name + ' - ' + d?.title
        });
        categoryData=this.sortPipe.transform(categoryData,'bindLabel');
        this.jobCategoryData = categoryData;
      })
  }
  checkRoles() {
    if(this.basicJobTemplateForm?.value?.is_description_editable) {
      this.basicJobTemplateForm.value.user_roles = [];
      this.basicJobTemplateForm?.controls?.user_roles?.setValidators([Validators.required]);
    } else {
      this.basicJobTemplateForm?.controls?.user_roles?.setValidators(null);
      this.basicJobTemplateForm?.controls?.user_roles?.clearValidators();
      this.basicJobTemplateForm?.controls?.user_roles?.setErrors(null);
      // this.basicJobTemplateForm.value.user_roles = [];
    }
    this.basicJobTemplateForm?.controls?.user_roles?.updateValueAndValidity();
    this.basicJobTemplateForm?.controls?.is_description_editable?.updateValueAndValidity();
  }
  removeRoles(r,i) {
    this.basicJobTemplateForm.value.user_roles.splice(i, 1);
      this.basicJobTemplateForm.patchValue({
        user_roles: this.basicJobTemplateForm.value.user_roles
      });
      this.basicJobTemplateForm?.controls?.is_description_editable?.updateValueAndValidity();
  }
  getRoles(value) {
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (value) {
      qry = qry + '&k=' + value;
    }
    let _url = `/configurator/programs/${this.programId}/roles` + qry;
    this.jobService.get(_url).subscribe((data:any) => {
      if (data.roles) {
        this.userRoles = data?.roles
      }
    })
  }

  selectdRoles(data) {
    if(data){
    const userRoles = this.basicJobTemplateForm?.value?.user_roles?.some(u => u?.id === data?.id);
    if (userRoles) {
      this.alertService.warn(`User role already selected.`);
    } else {
      if(!this.basicJobTemplateForm?.value?.user_roles){
        this.basicJobTemplateForm.value.user_roles = new Array();
      }
      this.basicJobTemplateForm?.value?.user_roles?.push(data);
      this.basicJobTemplateForm?.patchValue({
        user_roles: this.basicJobTemplateForm?.value?.user_roles
      })
      this.ngSelectComponent.handleClearClick();
    }
    }

  }
}
