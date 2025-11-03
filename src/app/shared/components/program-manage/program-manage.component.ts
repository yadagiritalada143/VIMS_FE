import { Component, OnInit, Input, EventEmitter, Output, OnChanges, ViewChild, Renderer2, ElementRef, OnDestroy } from '@angular/core';
import { ProgramService } from '../../../programs/program.service';
import { environment } from 'src/environments/environment';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { distinctUntilChanged, debounceTime, tap } from 'rxjs/operators';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs-compat/Subscription';
import { SortHelperPipe } from '../../pipe/sort-helper.pipe';

@Component({
  selector: 'app-program-manage',
  templateUrl: './program-manage.component.html',
  styleUrls: ['./program-manage.component.scss']
})
export class ProgramManageComponent implements OnInit, OnChanges, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  showDropdwon = false;
  showUserDropdwon = false;
  public Users: any;
  public userRoles: any;
  public usernameOldValue: any;
  public inviteUserName: any;
  public inviteUser: any;
  public roleOldValue: any;
  public programMemForm: UntypedFormGroup;
  public programManagersObj = [];
  public programMemidObj = [];
  public userEmail = [];
  public duplicateEmail: string;
  public dropdownIndex: number;
  @Output() showCreateUser = new EventEmitter();
  public programRowData: any;
  public classList=['add-user'];
  public selectedUsers = [];
  @Input() formType;
  @Input()edit;
  @ViewChild('userDropdown', { read: ElementRef, static: false }) userDropdown: ElementRef;
  constructor(private formBuilder: UntypedFormBuilder, private _programService: ProgramService, private render: Renderer2, private eventStream: EventStreamService, private sortPipe: SortHelperPipe) {
    this.render.listen('window', 'click', (e: Event) => {
    if (this.edit && ((this.userDropdown && this.userDropdown.nativeElement.contains(e.target)) ||
        (this.classList.some(className => e.target['classList'].contains(className))))) {
        this.showUserDropdwon = true;
      } else {
        this.showUserDropdwon = false;
      }
    })
   }

  ngOnInit(): void {
    this.programMemForm = this.formBuilder.group({
      name: ['', ''],
      userId: ['', ''],
      UserRole: [null, ''],
    })
    this.getUsers();
    this.getRoles();
    this.programMemForm.get('name')?.valueChanges.pipe(debounceTime(400),
      distinctUntilChanged(),
      tap((text) => {
        this.getUsers(text);
        let pattern = /^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
        let emailpttern;
        emailpttern = pattern.test(text);
        if (emailpttern && this.programMemForm?.get('UserRole').value) {
          this.checkEmail(text);
        }
        else this.inviteUser = false;
      })
    )
      .subscribe();

    this.subscriptions.push(
      this.eventStream.on(Events.USER_ADDED)
      .subscribe(newUserData => {
        this.programManagersObj.push({
          role_id: newUserData.role_id,
          email: newUserData.email,
          id: newUserData.id,
          is_enabled:false
        });
        this.programMemidObj.push({
          role_id: this.getValueByKey(newUserData.role_id, this.userRoles),
          email: newUserData.email,
          id: newUserData.id,
          is_enabled:false
        });
      })
    );

  }

  ngOnChanges(){
    if(!this.edit) {
      this.showUserDropdwon = false;
    }
  }

  checkEmail(value) {
    this._programService
      .get(
        `/profile-manager/organizations/*/members?limit=5&k=${encodeURIComponent(value)}`
      )
      .subscribe((data: any) => {
        if (data?.memberList.length > 0) {
          this.showUserDropdwon = true;
          this.Users = data?.memberList?.filter(
          (element) => (element.first_name && element.first_name != undefined)
        );
          this.inviteUser = false;
          // this._alert.error("Email already in use", {})
          this.duplicateEmail = "Email already in use";
        }
        else {
          this.duplicateEmail = "";
          this.inviteUser = true;
        }
      });
  }

  getRoles() {
    this._programService.get('/configurator/resources/roles').subscribe((data: any) => {
      this.userRoles = this.sortPipe.transform(data?.roles ?? [], 'name');
    });
  }

  onCreateUser(){
    this.showCreateUser.emit(true);
  }

  getUsers(name = "") {
    if(this.programMemForm?.get('UserRole').value !== null){
    this._programService
      .get(
        `/configurator/organizations/${environment.SIMPLIFY_ORG_ID}/members?limit=50&role_ids=${this.programMemForm?.get('UserRole').value}&k=${encodeURIComponent(name)}`
      )
      .subscribe((data: any) => {
        this.Users = data?.members?.filter(
          (element) => element.first_name && element.first_name != undefined && !this.checkIdExist(element.id)
        );
      });
    }
  }

  checkIdExist(id){
    return this.selectedUsers.indexOf(id)>=0 ? true : false;
  }

  invitenewUser() {
    this.userEmail.push(this.programMemForm.get('name').value)
    let uniqueemail = [...new Set(this.userEmail)];
    this.userEmail = uniqueemail;
    this.inviteUser = false;
    //this.showUserDropdwon = false;
    this.addProgramMembers('new');
  }

  selectUser(data) {
    this.showUserDropdwon = false;
    this.programMemForm.controls.name.setValue(data?.first_name);
    this.programMemForm.controls.userId.setValue(data?.id);
    this.addProgramMembers();
  }
  onClickDropdwon(data) {
    this.programRowData = data;
    this.showDropdwon = !this.showDropdwon;
  }

  addProgramMembers(param?) {
    let userRole = this.programMemForm.get('UserRole').value;
    let username =
      param == 'new'
        ? this.programMemForm.get('name').value
        : this.programMemForm.get('userId').value;

    if (userRole && username && this.usernameOldValue != username) {
      if (param == 'new') {

        let _id = Date.now();
        if (
          !this.checkDuplicate({ role_id: userRole, email: username }, 'email')
        ) {
          this.programManagersObj.push({
            role_id: userRole,
            email: username,
            id: _id,
            is_enabled:true
          });
          this.programMemidObj.push({
            role_id: this.getValueByKey(userRole, this.userRoles),
            email: username,
            id: _id,
            is_enabled:false
          });
        }
      } else {
        if (
          !this.checkDuplicate(
            { role_id: userRole, user_id: username },
            'user_id'
          )
        ) {
          let _id = Date.now();
          this.programManagersObj.push({
            role_id: userRole,
            user_id: username,
            id: _id,
            is_enabled:true
          });
          this.programMemidObj.push({
            role_id: this.getValueByKey(userRole, this.userRoles),
            user_id: this.getValueByKey(username, this.Users),
            id: _id,
            is_enabled:false
          });
          this.selectedUsers.push(username);
          let uniqueusers = [...new Set(this.selectedUsers)];
          this.selectedUsers = uniqueusers;
          this.getUsers();
        }
      }
      this.usernameOldValue = username;
      this.roleOldValue = userRole;
    }
      this.programMemForm.controls.name.setValue('');
      this.programMemForm.controls.userId.setValue('');
  }

  inactiveMmenber(){

  }

  setValue(flag){
    this.programManagersObj.forEach(element => {
      if(element?.id == this.programRowData?.id) {
        element.is_enabled = flag
      }
    })
    this.programMemidObj.forEach(element => {
      if(element.id == this.programRowData.id) {
        element.is_enabled = flag
      }
    })
  }

  changeRoleValue() {
    this.programMemForm.controls.name.setValue('');
    this.programMemForm.controls.userId.setValue('');
    this.inviteUser = false;
    this.usernameOldValue = "";
    this.getUsers();
  }

  checkDuplicate(obj, _obtype) {
    let duplicate;
    this.programManagersObj.forEach((element) => {
      if (obj.role_id == element.role_id && obj[_obtype] == element[_obtype]) {
        duplicate = true;
      }
    });
    if (duplicate) return true;
    else return false;
  }

  getValueByKey(value, obj) {
    let user;
    obj.find((element) => {
      if (element.id == value) {
        let middleName = element.middle_name ? element.middle_name: '';
        if(!element.name && element.name == undefined)
        user = (element.first_name +' '+middleName +' '+ element.last_name) || element.name;
        else{
          user = element.first_name || element.name;
        }
      }
    });
    return user;
  }

  removeMember(id) {
    let result = this.programMemidObj.filter((val) => {
      return val.id != id;
    });
    this.programMemidObj = result;
    let result1 = this.programManagersObj.filter((val1) => {
      if(val1.id == id){
        //removeEmail = val1?.email;
        let userIdpos = this.selectedUsers.indexOf(val1.user_id);
        this.selectedUsers.splice(userIdpos,  1);
        if(val1.user_id == this.usernameOldValue){
          this.usernameOldValue = '';
        }
        this.getUsers();
      }
      return val1.id != id;
    });
    // if(removeEmail && removeEmail != undefined){
    //   let id = this.userEmail.indexOf(removeEmail);
    //   this.userEmail.splice(id,  1);
    // }
    this.programManagersObj = result1;
    if(this.programManagersObj?.length == 0 && this.programMemidObj?.length == 0){
      this.programMemForm.reset();
    }
  }

  changeStatus(eve) {
    this.dropdownIndex = eve;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(node => {
      node.unsubscribe();
    });
  }
}
