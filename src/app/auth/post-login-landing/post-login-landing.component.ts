import { Component, OnInit } from '@angular/core';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserDataObj } from 'src/app/shared/enums';

@Component({
  selector: 'app-post-login-landing',
  templateUrl: './post-login-landing.component.html',
  styleUrls: ['./post-login-landing.component.scss']
})
export class PostLoginLandingComponent implements OnInit {

  private subscriptions: Array<Subscription> = [];
  private programSearchSub: Subject<string> = new Subject<string>();

  searchValue: any;
  programsAltered: any = [];
  programs: any = [];
  selectedProgram: any = '';
  user: any;
  userType: any;
  navigateTo: any;
  dataLoader = true;
  orgId: any;
  orgDetails: any;
  defaultProgramId: any;
  redirectSettings: boolean = false;
  clearIcon: boolean = false;
  programSelected: any = localStorage.getItem("programSelected");
  userDataEnum = UserDataObj;
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
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(query => {
      this.navigateTo = query.get('navigate');
    })
    this.user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.userType = this.storageService.get(StorageKeys.USER_TYPE);
    this.getMyPrograms();
    this.getDefaultProgram();
    this.orgId = this.user?.organization_id;
    this.getorganizationDetails(this.orgId);
    this.subscriptions.push(
      this.streamService.on(Events.SET_PROGRAM)
        .subscribe((data) => {
          if (data) {
            this.getMembershipDetailsAndRole(data);
          }
        })
    );

    this.subscriptions.push(
      this.programSearchSub.pipe(
        debounceTime(600),
        switchMap((term: string) => {
          this.dataLoader = true;
          return this.candidateService.searchProgramByName(term);
        })
      ).subscribe({
        next: (data: any) => {
          this.dataLoader = false;
          if (data && data.programs) {
            this.programs = data.programs;
          }
        }, error: (err: any) => {
          this.alertService.error(errorHandler(err));
          this.dataLoader = false;
        }
      })
    );
  }

  selectProgram(program: any) {
    this.programSelected = true;
    this.storageService.set("programSelected",true,true);
    this.selectedProgram = program.id;
    this.storageService.set(StorageKeys.PROGRAM_ID, this.selectedProgram, true);
    this.programService.setProgram(program, true);
  }

  searchProgram() {
    if (this.searchValue) {
      this.clearIcon = true;
    }
    else {
      this.clearIcon = false;
    }
    this.programSearchSub.next(this.searchValue);
  }

  getMyPrograms() {
    const programList = this.storageService.get('ProgramList');
    if (programList) {
      this.programs = programList;
      this.userService.checkProgramModification();
      this.dataLoader = false;
    } else {
      this.userService.getAllPrograms().subscribe({
        next: (data: any) => {
          this.programs = data.programs;
          this.dataLoader = false;
        }, error: (err: any) => {
          console.error('error ', err);
          this.dataLoader = false;
        }
      })
    }
  }

  getMembershipDetailsAndRole(program: any) {
    this.userService.getMembershipDetails(program.id, this.user.id).subscribe({
      next: (res: any) => {
        this.storageService.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
        this.storageService.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
        const theme = this.storageService.get(this.userDataEnum[2]);
        this.themeService.changeTheme(theme || this.user?.theme?.code);
        let permissionList = res?.member?.role?.permissions;
        let permissions = [];
        permissionList?.forEach((element: any) => {
          permissions.push(element?.slug);
        });
        this.storageService.set(StorageKeys.USER_PERMISSION, permissions, true);
        if (this.redirectSettings) {
          this.router.navigateByUrl('/settings');
        }
        else {
          if (this.navigateTo) {
            this.router.navigateByUrl(decodeURIComponent(this.navigateTo));
          } else {
            this.userService.setSideBarPrompt('open');
            this.router.navigateByUrl('/dashboard');
          }
        }
        this.storageService.remove("programSelected");
      },
      error: (err) => {
        console.error(err);
        if (this.redirectSettings) {
          this.router.navigateByUrl('/settings');
        }
        else {
          if (this.navigateTo) {
            this.router.navigateByUrl(decodeURIComponent(this.navigateTo));
          } else {
            this.userService.setSideBarPrompt('open');
            this.router.navigateByUrl('/dashboard');
          }
        }
        this.storageService.remove("programSelected");
      }
    });
  }

  getorganizationDetails(org_id: any) {
    if (org_id) {
      this.loader.show();
      this.userService.get(`/configurator/organizations/${org_id}`)
        .subscribe({
          next: (data: any) => {
            this.orgDetails = data;
            this.loader.hide();
          },
          error: error => {
            console.error(error);
            this.loader.hide();
          }
        });
    }
  }

  removeDefault(program: any) {
    let payload = {
      type: "PROGRAM",
      data: {
        entity_id: program?.id,
        entity_name: program?.name,
        default_selection: false
      }
    }
    this.loader.show();
    this.userService.put(`/profile-manager/${this.user?.id}/preference`, payload)
      .subscribe({
        next: (data: any) => {
          this.defaultProgramId = null;
          this.alertService.success("Successfully Removed This Program as Default")
          this.loader.hide();
        },
        error: (err: any) => {
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      })
  }

  makeDefault(program: any) {
    let payload = {
      type: "PROGRAM",
      data: {
        entity_id: program?.id,
        entity_name: program?.name,
        default_selection: true
      }
    }
    this.loader.show();
    this.userService.put(`/profile-manager/${this.user?.id}/preference`, payload)
      .subscribe({
        next: (data: any) => {
          this.defaultProgramId = program?.id;
          this.alertService.success("Successfully Made This Program As Default")
          this.loader.hide();
        },
        error: (err: any) => {
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      })
  }

  redirectToSettings(program: any) {
    this.redirectSettings = true;
    this.selectProgram(program);
  }

  async getDefaultProgram() {
    this.loader.show();
    this.defaultProgramId = null;
    await firstValueFrom(this.userService.get(`/profile-manager/${this.user?.id}/preference`))
      .then((preferences_data: any) => {
        let programPref: any;
        preferences_data?.preference?.preferences?.forEach((pref: any) => {
          if (pref?.type == "PROGRAM") {
            programPref = pref?.data;
          }
        })
        programPref?.forEach((pref: any) => {
          if (pref?.default_selection) {
            this.defaultProgramId = pref?.entity_id;
          }
        })
        this.loader.hide();
      }).catch((err: any) => {
        this.loader.hide();
        this.defaultProgramId = null;
      })
  }

  clearSearch() {
    this.searchValue = '';
    this.clearIcon = false;
    this.searchProgram();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    })
  }
}
