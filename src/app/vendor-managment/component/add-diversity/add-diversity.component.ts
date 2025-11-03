import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-add-diversity',
  templateUrl: './add-diversity.component.html'
})
export class AddDiversityComponent implements OnInit {

  public programId: string = null;

  @Input() visiblity = 'hidden';
  @Input() isEditDiversity;
  @Input() allCountryList;
  @Input() dataToEditDiversityList;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter<any>();
  index = -1;
  diversityForm = this.fb.group({
    country: [null, [Validators.required]],
    category: [null, [Validators.required]],
    certification: [null, [Validators.required]]
  })
  categoriesList: any[] = [];
  certificationList: any[] = [];
  constructor(private fb: UntypedFormBuilder, 
              private programService: ProgramService,
              private localStorage: StorageService
              ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.loadCategory();
    this.loadCertification();
  }

  ngOnChanges(): void {
    if(this.isEditDiversity){
      this.diversityForm.patchValue({
        country: this.dataToEditDiversityList.country,
        category: this.dataToEditDiversityList.category,
        certification: this.dataToEditDiversityList.certification
      })
      this.index = this.dataToEditDiversityList?.editedIndex
    }
    if(!this.isEditDiversity){
      this.diversityForm = this.fb.group({
        country: [null, [Validators.required]],
        category: [null, [Validators.required]],
        certification: [null, [Validators.required]]
      })
    }
  }

  loadCategory() {
    this.programService.get(`/configurator/programs/${this.programId}/pick-lists?slug=diversity_category`)
    .subscribe((res: any) => {
      const { picklist_item } = res?.pick_lists[0];
      this.categoriesList = picklist_item;
    })
  }
  loadCertification() {
    this.programService.get('/configurator/resources/vendor_supplier_certifications')
    .subscribe((res: any) => {
      const { vendor_supplier_certifications } = res;
      this.certificationList = vendor_supplier_certifications;
    })
  }
  sideBaClose() {
    this.diversityForm.reset();
    this.onClose.emit();
  }

  diversitySubmit(index) {
    let json = this.diversityForm.value
    json["sampleindex"] = index
    this.index = -1
    this.onSubmit.emit(json);
    this.diversityForm.reset();
  }
}
