import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from '@angular/core';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { errorHandler } from '../../util/error-handler';
import { UserDataObj } from '../../enums';

@Component({
  selector: 'app-programs',
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss'],
})
export class ProgramsComponent implements OnInit, OnDestroy {
  @Input('programs') programs: any = [];
  @Output() toggle: EventEmitter<string> = new EventEmitter<string>();

  private subscriptions: Array<Subscription> = [];
  private programSearchSub: Subject<string> = new Subject<string>();

  searchValue: any;
  programsAltered: any = [];
  selectedProgram = '';
  currentProgram: any;
  user: any;
  navigateTo: any;
  dataLoader = true;
  defaultProgramId: any = null;
  preferenceList: any = [];
  isSearchOpen = false;
  userDataEnum= UserDataObj;

  constructor(
    private streamService: EventStreamService,
    private storageService: StorageService,
    public candidateService: CandidateService,
    public alertService: AlertService,
    private userService: UserService,
    private themeService: ThemeService,
    public route: ActivatedRoute,
    public programService: ProgramService,
    public router: Router,
  ) {}

  async ngOnInit() {

    const activeProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.currentProgram = activeProgram;
    if(!this.currentProgram) {
      setTimeout(() => {
        this.ngOnInit();
      }, 400);
      return;
    }

    this.route.queryParamMap.subscribe(query => {
      this.navigateTo = query.get('navigate');
    });

    this.user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.selectedProgram = activeProgram?.id;
    if (!this.programs || this.programs.length == 0) {
      // this.getMyPrograms();
      await this.getMyProgramsNew();
    } else {
      // this.storageService.set('CurrentProgram', this.programs[0], true);

    }

    this.subscriptions.push(
      this.streamService.on(Events.SET_PROGRAM).subscribe(data => {
        if (data) {
          this.getMembershipDetailsAndRole(data);
        }
      }),
    );

    this.subscriptions.push(
      this.programSearchSub
        .pipe(
          debounceTime(600),
          switchMap((term: string) => {
            this.dataLoader = true;
            return this.candidateService.searchProgramByName(term);
          }),
        )
        .subscribe({
          next: (data: any) => {
            this.dataLoader = false;
            if (data && data.programs) {
              this.programs = data.programs;
            }
          },
          error: err => {
            this.alertService.error(errorHandler(err));
            this.dataLoader = false;
          },
        }),
    );
  }

  closeSidebar() {
    this.streamService.emit(new EmitEvent(Events.PROGRAM_SIDEBAR, false));
 }

  clearSearch() {
    this.isSearchOpen = false;
    this.searchValue = '';
    this.getMyProgramsNew();
  }



  async getMyProgramsNew() {
    const programList = this.storageService.get('ProgramList');
    if (Array.isArray(programList) && programList.length) {
      this.programs = programList;
      try {
        this.getPreferredProgram().then(() => {
          this.removeDuplicates();
          let defaultProgramIndex = this.programs.findIndex(program => program?.id === this.defaultProgramId);
          if (defaultProgramIndex !== -1) {
            this.setupProgam(this.programs[defaultProgramIndex]);
          } else {
            this.setupProgam();
          }

          this.userService.checkProgramModification();
          this.dataLoader = false;
        });
      } catch (error) {
        this.preferenceList = [];
      }
    } else {
      this.userService.getAllPrograms().subscribe({
        next: (data: any) => {
          this.programs = data.programs;
          this.removeDuplicates();
          let defaultProgramIndex = data.programs.findIndex(program => program?.id === this.defaultProgramId);
          if (defaultProgramIndex !== -1) {
            this.setupProgam(this.programs[defaultProgramIndex]);
          } else {
            this.setupProgam();
          }

          this.dataLoader = false;
        },
        error: err => {
          console.error('error ', err);
          this.dataLoader = false;
        },
      });
    }
  }

  removeDuplicates() {
    if(this.programs.length <= 1) {
      this.programs = this.programs.filter(program => program?.id !== this.currentProgram?.id);
    }
    this.preferenceList = this.preferenceList.filter(program => program?.id !== this.currentProgram.id);
  }

  async getProgramDetails(programId: any) {
    await firstValueFrom(this.userService.get(`/configurator/programs/${programId}`)).then((programData: any) => {
      this.currentProgram = programData?.program;
    });
  }

  setupProgam(defaultProgram?: any) {
    const activeProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.programs && this.programs.length > 0) {
      if (!activeProgram) {
        if (defaultProgram) {
          if (defaultProgram?.id == activeProgram?.id) {
            this.swapElements(activeProgram?.id);
            return;
          }
          this.programService.setProgram(defaultProgram, true);
          this.storageService.set(StorageKeys.PROGRAM_ID, defaultProgram?.id, true);
        } else {
          this.programService.setProgram(this.programs[0], true);
          this.storageService.set(StorageKeys.PROGRAM_ID, this.programs[0]?.id, true);
        }
      } else {


        this.selectedProgram = activeProgram?.id;
      }
    }
    if (this.selectedProgram) {
      this.swapElements(this.selectedProgram);
    }
  }

  selectProgram(p) {
    this.selectedProgram = p?.id;
    const activeProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.selectedProgram !== activeProgram?.id) {
      if (this.programs.length > 1) {
        this.swapElements(this.selectedProgram);
      }
      this.storageService.set(StorageKeys.PROGRAM_ID, this.selectedProgram, true);
      this.programService.setProgram(p, true);
      let activeProgramDetails = this.programs.find(program => program?.id === this.selectedProgram);
      if (activeProgramDetails) {
        this.setPreviousProgram(activeProgramDetails);
      }
    }
    if(this.selectedProgram == activeProgram.id ){
      this.closeSidebar();
    }
    this.closeSidebar();
  }

  swapElements(selectProgram) {
    const activeProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let obj = this.programs.find(o => o?.id === activeProgram?.id);

        if (!obj) {
          this.programs.push(activeProgram);
        }


    let index: any;
    this.programsAltered = this.programs;
    for (let i = 0; i < this.programsAltered.length; i++) {
      if (this.programsAltered[i]?.id == selectProgram) {
        index = i;
        break;
      }
    }
    let temp = this.programsAltered[index];
    this.programsAltered.splice(index, 1);
    this.programs = [];
    this.programs.push(temp);
    for (let i = 0; i < this.programsAltered.length; i++) {
      this.programs.push(this.programsAltered[i]);
    }
    this.removeDuplicates();
  }

  searchProgram() {
    if (this.searchValue == '') {
      this.isSearchOpen = false;
      this.clearSearch();
    } else {
      this.programSearchSub.next(this.searchValue);
      this.isSearchOpen = true;
    }
  }

  getMembershipDetailsAndRole(p) {
    this.userService.getMembershipDetails(p.id, this.user.id).subscribe({
      next: (res: any) => {
        this.storageService.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
        this.storageService.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
        const theme = this.storageService.get(this.userDataEnum[2]);
        this.themeService.changeTheme(theme || this.user?.theme?.code);
        let permissionList = res?.member?.role?.permissions;
        let permissions = [];
        permissionList?.forEach(element => {
          permissions.push(element?.slug);
        });
        this.storageService.set(StorageKeys.USER_PERMISSION, permissions, true);
      },
      error: (err: any) => {
        console.error(err);
        if (this.navigateTo) {
          this.router.navigateByUrl(decodeURIComponent(this.navigateTo));
        } else {
          this.userService.setSideBarPrompt('open');
          this.router.navigateByUrl('/dashboard');
        }
      },
    });
  }

  makeDefault(program: any) {
    let payload = {
      type: 'PROGRAM',
      data: {
        entity_id: program?.id,
        entity_name: program?.name,
        default_selection: true,
      },
    };
    this.dataLoader = true;
    this.userService.put(`/profile-manager/${this.user?.id}/preference`, payload).subscribe({
      next: (data: any) => {
        this.defaultProgramId = program?.id;
        this.storageService.set(StorageKeys.DEFAULT_PROGRAM_ID, program?.id, true);
        this.alertService.success('Successfully Made This Program As Default');
        this.dataLoader = false;
      },
      error: (err: any) => {
        this.dataLoader = false;
        this.alertService.error(errorHandler(err));
      },
    });
  }

  removeDefault(program: any) {
    let payload = {
      type: 'PROGRAM',
      data: {
        entity_id: program?.id,
        entity_name: program?.name,
        default_selection: false,
      },
    };
    this.dataLoader = true;
    this.userService.put(`/profile-manager/${this.user?.id}/preference`, payload).subscribe({
      next: (data: any) => {
        this.defaultProgramId = null;
        this.storageService.remove(StorageKeys.DEFAULT_PROGRAM_ID);
        this.alertService.success('Successfully Removed This Program as Default');
        this.dataLoader = false;
      },
      error: (err: any) => {
        this.dataLoader = false;
        this.alertService.error(errorHandler(err));
      },
    });
  }

  setPreviousProgram(program) {
    let payload = {
      type: 'PROGRAM',
      data: {
        entity_id: program?.id,
        entity_name: program?.name,
        default_selection: program?.default_selection,
        last_selected_on: Date.now(),
      },
    };
    this.dataLoader = true;
    this.userService.put(`/profile-manager/${this.user?.id}/preference`, payload).subscribe({
      next: (data: any) => {
        this.dataLoader = false;
      },
      error: (err: any) => {
        this.dataLoader = false;
        this.alertService.error(errorHandler(err));
      },
    });
  }

  async getPreferredProgram() {
    return new Promise<any>((resolve, reject) => {
      this.dataLoader = true;
      this.defaultProgramId = null;
      this.userService.get(`/profile-manager/${this.user?.id}/preference`).subscribe({
        next: (data: any) => {
          data?.preference?.preferences.forEach((pref: any) => {
            if (pref?.type == 'PROGRAM') {
              this.preferenceList = pref?.data;
            }
          });
          this.preferenceList?.forEach((pref: any) => {
            if (pref?.default_selection) {
              this.defaultProgramId = pref?.entity_id;

              this.storageService.set(StorageKeys.DEFAULT_PROGRAM_ID, this.defaultProgramId, true);
            }
            if (pref.entity_id) {
              pref.id = pref.entity_id;
              pref.name = pref.entity_name;
            }
          });
          this.preferenceList = this.preferenceList.filter(program => program.id !== this.currentProgram.id);
          if(this.preferenceList){
            this.storageService.set(StorageKeys.PREFERENCE_LIST, this.preferenceList, true);
          }

          if (!this.defaultProgramId) {
            this.defaultProgramId = this.storageService.get(StorageKeys.DEFAULT_PROGRAM_ID);
          }
          this.removeDuplicates();
          this.dataLoader = false;
          resolve(true);
        },
        error: err => {
          this.preferenceList = [];
          this.dataLoader = false;
          reject(false);
        },
      });
    }).catch(err => {
      this.preferenceList = [];
      this.dataLoader = false;
    });
  }

  get isSVMSUser() {
    return (this.storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
