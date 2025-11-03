import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subscription } from 'rxjs';
import { getDateFromString } from 'src/app/shared/util/date.util';

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss']
})
export class ViewProfileComponent implements OnInit, OnDestroy {
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('address2') address2;
  private currentProgram: any = this.storageService.get('CurrentProgram');
  getDateFromString = getDateFromString;
  worker_id:string= undefined;
  viewProfile = "hidden";
  candidateInfo: any;
  isEditProfile:boolean = false;
  candidateForm: UntypedFormGroup;
  addressForm: UntypedFormGroup;
  panelTitle = '';
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  countryShortName = 'IN';
  userDetails : any;
  assignmentDetails: any;
  isClient: boolean = false;
  isListingPage: boolean = false;
  isWelcomeEmail: boolean = false;
  isVendor: boolean = false;
  isSendEmailFlag: boolean = false;
  private subscrptions: Subscription[] = [];
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private loader: LoaderService,
    private userService: UserService,
    private alert: AlertService,
    private storageService: StorageService,
    private route : ActivatedRoute
  ) { }
  
  ngOnInit(): void {
    this.subscrptions.push(this.route.paramMap.subscribe(param => {
      let status = param.get('id');
      if((status ==='all')||(status ==='closed')||(status ==='pending-evalution')||(status ==='open') ||(status === 'assignment ending in 30 days')){
        this.isListingPage = true; 
      }
    }));
    this.subscrptions.push(this.eventStream.on(Events.ASSIGNMENT_VIEW_PROFILE).subscribe( (data) => {
      if (data?.value) {
        this.viewProfile = 'visible';
        this.panelTitle = 'Profile';
        this.candidateInfo = data?.value?.worker;
        this.assignmentDetails = data.value;
        if(this.assignmentDetails){
          this.checkSendEmail();
        }
      } else {
        this.viewProfile = 'hidden';
      }
    }));
    this.candidateForm = this.fb.group({
      first_name: [null, [Validators.required]],
      middle_name: [null],
      last_name: [null, [Validators.required]],
      name_prefix: [null,],
      name_suffix: [null],
      title: [null],
    });
    this.addressForm = this.fb.group({
      email: [null, [Validators.required, this.emailValidator]],
      phone_isdcode: [null],
      phone_number: [null, [Validators.pattern('^((\\+91-?)|0)?[0-9]{10}$')]],
      country: ['IND'],
      addresses: [null]
    });
    //this.accountDetails?.organization?.category?.toLowerCase()
    let user_type =  this.storageService.get('user_type');
    if(user_type?.toLowerCase() == 'client' && !this.isListingPage){
     this.isClient = true;
    }else if(user_type?.toLowerCase() == 'vendor' && !this.isListingPage){
    this.isVendor = true;
    }
  }

  checkSendEmail(){
    let userid = this.assignmentDetails?.worker?.user?.id;
    this.subscrptions.push(this.userService.sendWelcomeEmailCheck(userid).subscribe( res => {
      let data:any = res;
      data?.user?.is_activated ? this.isSendEmailFlag = false : this.isSendEmailFlag = true;
    }));
  }

  sidebarClose() {
    this.viewProfile = "hidden";
    this.isEditProfile = false;
    this.panelTitle = 'Profile';
    this.setCountry();
    this.addressForm.reset();
    this.candidateForm.reset();
  }
  changeCase(username) {
    return username?.replace('wip', 'WIP');
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

  onEdit(){
   this.setDetails(this.assignmentDetails);
  }

  ngAfterViewInit() {
    this.setCountry();
  }

  emailValidator(control) {
    if (control.value) {
      const matches = control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
      return matches ? null : { 'invalidEmail': true };
    } else {
      return null;
    }
  }

  keyPressNumbers(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }
  
  setCountry() {
    let val = this.addressForm.get('country').value;
    switch (val) {
      case 'CAN':
        this.countryShortName = "CA";
        this.addressForm.get('phone_isdcode').setValue("+1");
        break;
      case 'USA':
        this.countryShortName = "US";
        this.addressForm.get('phone_isdcode').setValue("+1");
        break;
      case 'IND':
        this.countryShortName = "IN";
        this.addressForm.get('phone_isdcode').setValue("+91");
        break;
    }
    if(this.address2){
      this.address2._value = '';
    }
    this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
    this.changeDetectorRef.detectChanges()
  }

  setDetails(user){
    this.loader.show();
    let detail = user?.worker?.user;
    this.isEditProfile = true;
    this.panelTitle = 'Edit Profile';
    this.worker_id= user?.worker?.id;
    this.subscrptions.push(this.userService.get(`/profile-manager/users/${detail?.id}`).subscribe({
      next: (res: any) => {
        this.userDetails = res?.user;
        this.candidateForm.patchValue({
          first_name: this.userDetails?.first_name,
          middle_name: this.userDetails?.middle_name,
          last_name: this.userDetails?.last_name,
          name_prefix: this.userDetails?.name_prefix,
          name_suffix: this.userDetails?.name_suffix,
          title: this.userDetails?.title,
        });
        this.addressForm.patchValue({
          email: this.userDetails?.email,
          phone_isdcode:  this.userDetails?.contact_numbers?.[0]?.isd_code,
          phone_number: this.userDetails?.contact_numbers?.[0]?.number,
          country: this.userDetails?.addresses?.[0]?.country,
          addresses: this.userDetails?.addresses?.[0]?.address_line_1,
        })
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
      }
    }));
  }

  updateWorkerEmail(email){
    this.subscrptions.push(this.userService.put(`/assignment/programs/${this.currentProgram?.id}/worker/${this.worker_id}`, {"official_email": email}).subscribe({
      next: (res) => {
        this.loader.hide();
        // this.alert.success('Profile saved successfully.');
        // this.eventStream.emit(new EmitEvent(Events.ON_PROFILE_UPDATE, true));
      },
      error: (err) => {
        this.alert.error(`Error occured updating worker's official email`);
        // this.alert.error(errorHandler(err));
        this.loader.hide();
      }
    }));
  }

  onSubmit(){
    this.loader.show();
    let user = this.userDetails;
    let candidateForm = this.candidateForm.value;
    let addressForm = this.addressForm.value;
    const url = `/configurator/organizations/${user?.organization_id}/members/${user?.id}?candidate_id=${this.assignmentDetails?.worker?.candidate?.id}&worker_id=${this.worker_id}`;
    const payload = {
      name_prefix: candidateForm?.name_prefix,
      first_name: candidateForm?.first_name,
      middle_name: candidateForm?.middle_name,
      last_name: candidateForm?.last_name,
      name_suffix: candidateForm?.name_suffix,
      programs:[
        { program_id: this.currentProgram?.id || "" }
      ],
      role_id: this.assignmentDetails?.worker?.user?.role?.id || '0f5d75ef-f4b6-4dcc-8d55-1390fcc4480b',
      email: this.assignmentDetails?.worker?.user?.email != addressForm?.email ? addressForm?.email : this.assignmentDetails?.worker?.user?.email,
      title: candidateForm?.title,
      addresses: [
        {
          country: this.addressForm.get('country').value,
          address_line_1: this.addressForm.get('addresses').value
        }
      ],
      contacts: [
        {
          label: "PRIMARY",
          isd_code: addressForm?.phone_isdcode,
          number: addressForm?.phone_number
        }
      ]
    }
    if (this.candidateForm.valid && this.addressForm.valid) {
      if(this.assignmentDetails?.worker?.official_email != addressForm?.email){
        this.updateWorkerEmail(addressForm?.email);
      }
      this.subscrptions.push(this.userService.put(url, payload).subscribe({
        next: (res) => {
          this.loader.hide();
          this.alert.success('Profile saved successfully.');
          this.eventStream.emit(new EmitEvent(Events.ON_PROFILE_UPDATE, true));
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
          this.loader.hide();
        }
      }));
      this.sidebarClose();
    }else{
      this.alert.error('Please fill required details.');
    }
  }

  sendWelcomeEmail(){
    let userid = this.assignmentDetails?.worker?.user?.id;
    this.isWelcomeEmail = true;
    this.subscrptions.push(this.userService.sendWelcomeEmail(userid, this.currentProgram?.id).subscribe({
      next: res => {
        if(res){
          this.isWelcomeEmail = false;
          this.alert.success("Welcome email successfully sent");
        }
      },
      error: (err) => {
        this.alert.error(err?.error?.error?.message);
        this.isWelcomeEmail = false;
      }
    }));
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  getPrefixSuffixFlag(){
    return this.currentProgram?.config?.hide_suffix_prefix
  }
}
