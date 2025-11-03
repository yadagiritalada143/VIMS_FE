import { Component, Output, OnInit, EventEmitter, Input, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  EventStreamService,
  Events
} from 'src/app/core/services/event-stream.service';
import { CandidateService } from '../../service/candidate.service';
import { Subscription,Subject} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
@Component({
  selector: 'app-add-skills',
  templateUrl: './add-skills.component.html',
  styleUrls: ['./add-skills.component.scss']
})
export class AddSkillsComponent implements OnInit, OnDestroy {
  @Output() skillData: EventEmitter<any> = new EventEmitter<any>();
  closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() skillTypeId;
  skillList = [];
  skillLoad :boolean= false;
  skillLoading: boolean = false;
  addSkills = "hidden";
  panelHeading = 'Add New Skill';
  public addSkilsForm: UntypedFormGroup;
  editPanel = false;
  clickedIndex;
  oldUploadfileArr = [];
  newUploadfileArr = [];
  newfiles = [];
  btnText = 'Save';
  public input$ = new Subject<string | null>();
  private subscrptions: Subscription[] = [];
  logs:Log = undefined;
  editQualificationId:Number;
  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private sortHelperPipe: SortHelperPipe
  ) { }

  AddEditHandler(data) {
    if (data.value) {
      this.addSkills = 'visible';
      if (data.obj != null) {
        this.editQualificationId=data?.obj?.id;
        let updatefileobject = [];
        let newupdatefileobject = [];
        if (data?.obj?.files && data?.obj?.files.length > 0) {
          data.obj.files.forEach(element => {
            if (element.url) {
              updatefileobject.push({ filename: element.filename, ext: element?.filename.split('.').pop(), size: 0, id: element?.id, url: element?.url, time: '03/31/2021' });
            } else {
              newupdatefileobject.push({ name: element.filename, raw: element.raw, ext: element.ext, size: element.size, time: element.time })
            }
          });
        }

        this.oldUploadfileArr = updatefileobject;
        this.newUploadfileArr = newupdatefileobject;
        this.updatePanel(data.obj);
        this.panelHeading = 'Edit Skill';
        this.editPanel = true;
        this.clickedIndex = data.obj.clickedIndex;
      }
    } else {
      this.addSkills = 'hidden';
    }
  }
  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_SKILLS).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_SKILLS).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getSkills();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {
      this.skillLoad=false;
      if(newTerm){
        this.getSkills(1, newTerm);
      }
    });
   
    this.addSkilsForm = this.fb.group({
      skillType: [null, Validators.required],
      experienceLevel: [null],
      description: [null, ''],
      notes: [null, ''],
      files: [null, '']
    });
  }
  sidebarClose() {
    this.addSkills = 'hidden';
    this.addSkilsForm.reset();
    this.panelHeading = 'Add New Skill';
    this.editPanel = false;
    this.logs=undefined;
    this.closePanel.emit(true);
  }
  getSkills(pageNo = 1,name='') {
    if(!this.skillLoad){
      this.skillLoading = true;
      const skillId = this.skillTypeId;
      this.subscrptions.push(this.candidateService._getQualiFicationType(skillId, pageNo = 1, name).subscribe({
        next: (res: any) => {
          this.skillLoad = true;
          this.skillLoading = false;
          this.skillList = this.sortHelperPipe.transform(res.qualifications, 'name');
        },
        error: (err) => {
          this.showError(err);
          this.skillLoading = false;
        }
      }
      ));
    }
  }
  uploadFiles(event) {

    let filedata = [];
    if (event) {
      event.forEach(element => {
        filedata.push({
          filename: element?.name,
          raw: element?.raw,
          ext: element?.ext,
          size: element?.size,
          time: element?.time,
        })
      });
    }
    this.newfiles = filedata;
    if (this.oldUploadfileArr && this.oldUploadfileArr.length > 0) {
      filedata = [...filedata, ...this.oldUploadfileArr];
    }

    this.addSkilsForm.patchValue({
      files: filedata
    })
  }
  updateoldFiles(event) {
    this.oldUploadfileArr = event;
    let filedata = [];
    event.forEach(element => {
      if (element?.id) {
        filedata.push({
          filename: element?.filename,
          id: element?.id,
          url: element?.url,
        })
      }
    })

    if (this.newfiles && this.newfiles.length > 0) {
      filedata = [...this.newfiles, ...this.oldUploadfileArr];
    }

    this.addSkilsForm.patchValue({
      files: filedata
    })
  }

  updatePanel(data) {

    if(this.skillList && this.skillList.length>0 && (data && data.qualification_id)){
      let indx=this.skillList.findIndex(skill=>skill.id===data?.qualification_id);
      if(indx===-1){

        this.candidateService.getQualificationsDetails(data?.qualification_id, this.skillTypeId).subscribe({
          next: (res: any) => {
            this.skillList.push(res.qualification);
            this.skillList = this.sortHelperPipe.transform(this.skillList, 'name');
          },
          error: (err) => {
            // this.alertService.error(errorHandler(err));
            this.showError(err);
          }
        }
        ); 
      }
    } 
    this.addSkilsForm.patchValue({
      skillType: data.qualification_id,
      experienceLevel: data.experience_level,
      description: data.description,
      notes: data.notes,
      files: data.files
    })
  }

  saveSkill(action) {
    this.logs=undefined;
    if (this.addSkilsForm.valid) {
      let data = this.addSkilsForm.value;
      const skillType = this.skillList.filter((item) => {
        if (item.id == data.skillType) {
          return item.name;
        }
      }).map((obj) => {
        return obj.name;
      })
      const payload = {
        qualification_id: data.skillType,
        experience_level: data.experienceLevel,
        description: data.description,
        notes: data.notes,
        files: data.files,
        skill_name: skillType
      }
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }

      this.addSkilsForm.reset();
      this.skillData.emit({ payload: payload, isEdit: this.editPanel, clickedIndex: this.clickedIndex });
      if (action == 'save') {
        this.sidebarClose();
      } else {
        this.editPanel = false;
        this.panelHeading = 'Add New Skill';
        this.closePanel.emit(true);
      }
    } else {
      // this.alertService.error('Please fill the required fields properly.');
      this.showError('Please fill the required fields properly.');
    }
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id } 
    };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }
}
