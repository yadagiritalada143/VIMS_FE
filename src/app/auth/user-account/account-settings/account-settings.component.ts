import { Component, ViewChild, OnInit } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SvmsUploadAvatarComponent } from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { UserDataObj } from 'src/app/shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {

  public customFields: Array <any> = [];

  readOnlyField = true;
  rendererData;
  isImagePresent: boolean = false;
  user: any;
  currentProgram: any;
  timezoneData: Array <any> = [];
  profileUser: any;
  programMember: any;
  custom_fields:Array<any>;
  userDateFormate:any;
  public toggle = {
    title: 'active',
    value: true
  };

  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;

  constructor (
    private _programService: ProgramService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private userService: UserService,
    private loader: LoaderService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {
    this.user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userDateFormate = this.currentProgram?.defaultDateFormat;
    this.getTimeZone();
    this.init();
  }

  init() {
    this.getUser();
    this.hierarchyList();
  }
  async getTimeZone() {
   await this._programService.get(`/configurator/resources/time_zones`).subscribe(
      (data: any) => {
        if (Array.isArray(data?.time_zones)) {
          this.timezoneData = data.time_zones;
        }
      });
   }
  hierarchyList() {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    this._programService.get(`/configurator/programs/${programId}/hierarchy`).subscribe(
      data => {
        if (data) {
          // this.rendererData = data.result[0].hierarchies;
        }
      });
  }

  getCropImage(e) {
    if (e) {
      this.isImagePresent = true;
    } else {
      this.isImagePresent = false;
    }
  }
  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  editProfile($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.EDIT_PROFILE, { value: true, ...this.profileUser }));
    }
  }

  closeProfile() {
    this.eventStream.emit(new EmitEvent(Events.EDIT_PROFILE, { value: false }));
  }

  convertCustomFieldToArray(customFields:any) {
    this.custom_fields = [];
    if (customFields) {
      const customField = Object.entries(customFields)?.map((e:any) => {
        return {
          slug: this.convertCustomFieldName(e[0]),
          value: e[1] && e[1] !== '' ? e[1] : '-',
        }
     });
      this.custom_fields = customField;

      // V2M-6679
      this.custom_fields?.sort(function (a, b) {
        return ('' + a?.slug).localeCompare(b?.slug);
      })
    }
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

  getUser() {

    this.loader.show();
    let user: any = this.storageService.get(StorageKeys.CURRENT_USER);
    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/members/${user.id}`;

    if(user?.id && programId) {
      this.userService.get(url).subscribe({
        next: (res: any) => {

          this.parseCFData(res?.member);
          this.profileUser = res?.member;
          this.storageService.set('programMember', (this.profileUser), true);

          if (this.profileUser?.hierarchies[0]?.preferred_date_format) {
            this.userDateFormate = this.profileUser?.hierarchies[0]?.preferred_date_format;
          }
          this.rendererData = res?.member?.hierarchies;
          this.convertCustomFieldToArray(res?.member.custom_fields);
          let userData = { ...user, ...this.profileUser };
          this.storageService.set('user', userData, true);
          this.storageService.set('account', this.profileUser, true)
          setTimeout(() => {
            this.profileUser.display_preferred_time_zone =
              (this.timezoneData?.length > 0) && this.profileUser?.preferred_time_zone
                ? this.timezoneData?.filter(
                    timezone => timezone?.id?.toString() == this.profileUser?.preferred_time_zone?.id?.toString(),
                  )?.[0].name
                : this.profileUser?.preferred_time_zone?.name;
          }, 500);
          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      });
    }else{
      this.profileUser =  user;
      this.profileUser['preferred_language'] =  this.storageService.get(StorageKeys.USER_LANGUAGE) ?? '-';
      this.profileUser['display_preferred_time_zone'] = '-'
    }
  }

  private parseCFData(program: any) {

    const programCFs: Array <any> = program?.program_user_custom_fields;
    this.customFields = [];

    if(Array.isArray(programCFs)) {
      programCFs.forEach((entry: any) => {
        let label: string = entry?.custom_fields?.label;
        let value: any = entry?.value;
        if(Array.isArray(value)) {
          value = value.join(', ');
        }

        if(value) {
          this.customFields.push({ label, value });
        }
      });
    }
  }

  updateUser(event) {

    this.loader.show();
    let payload = event;

    if(Array.isArray(this.timezoneData)) {
      let filtered_times: Array <any> = this.timezoneData.filter((timezone)=> {
        return timezone && timezone.id &&
               payload.preferred_time_zone &&
               (timezone.id.toString() === payload.preferred_time_zone.toString());
      });

      if(filtered_times && filtered_times.length)
        this.profileUser.display_preferred_time_zone = filtered_times[0].name;

    }

    const orgId = this.storageService.get('ORG_ID');
    const user = this.storageService.get('user');
    // payload['role_id'] = user?.role?.id;
   // const url = `/profile-manager/organizations/${orgId}/members/${user.id}`; cant use this api for updating member always use configurators api for member update.
   const url = `/configurator/organizations/${orgId}/members/${user.id}`;
   this.userService.put(url, payload).subscribe((res) => {
      this.loader.hide();
      if(Array.isArray(this.timezoneData)) {
        this.storageService.set(UserDataObj[7], this.timezoneData.filter((timezone: any) => {
          return (timezone?.id?.toString() == payload?.preferred_time_zone?.toString())?.[0];
        }), true);
      }
      this.init();
    }, (err) => {
      this.loader.hide();
    })
    this.closeProfile();
  }
  isThisArray(field: any) {
    return Array.isArray(field);
  }

  clean(obj) {
    for (const propName in obj) {
      if (!obj[propName] || obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  }
  isNaN(val: any) {
    return isNaN(val);
  }
}
