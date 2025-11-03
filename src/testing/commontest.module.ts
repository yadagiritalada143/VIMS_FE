import { DatePipe, TitleCasePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UntypedFormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgSelectModule } from '@ng-select/ng-select';
import { I18NextModule } from 'angular-i18next';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TransformToArrPipe } from 'src/app/dashboard/Component/dashboard-widget-settings/const/widget-array.pipe';
import { I18N_PROVIDERS } from 'src/app/i18nextHelper';
import { ShortNamePipe as SmartTableShorNamePipe } from 'src/app/library/smartTable/pipe/short-name.pipe';
import { ShortNamePipe } from 'src/app/library/table/pipe/short-name.pipe';
import { glv } from 'src/app/shared/components/sidebar/genericPreference.config';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { ShortNamePipe as SharedShortNamePIpe } from 'src/app/shared/pipe/short-name.pipe';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { GLOBAL_LAUNCH_CONFIG, MockCurrentProgram, NewProgramData, account, account_code_config, accuracy_config, timeSheetData, user, viewd_job } from './stub.mock';

let sortHelperPipe = {};
let uniqueKeyPipe: {};
let titleCasePipe: {};
let localDateFormat: {};
let accuracyPipe: {};
let localDateTimeFormatPipe: {};
let snakeToTitleCasePipe: {};
let shortNamePipe: {};
let customcurrencyPipe: {};
let transformToArr: {};
@NgModule({
  declarations: [],
})
export class CommonTestingModule {
  public static setUpTestBed = (TestingComponent: any) => {
    let storageService: Partial<StorageService>;

    beforeEach(async () => {
      // stub UserService for test purposes
      accuracyPipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return 0;
        }),
      };

      titleCasePipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return '';
        }),
      };
      sortHelperPipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return [];
        }),
      };

      localDateFormat = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return [];
        }),
      };

      snakeToTitleCasePipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return new Date().toDateString();
        }),
      };

      shortNamePipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return '';
        }),
      };

      uniqueKeyPipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return [];
        }),
      };

      customcurrencyPipe = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return '';
        }),
      };

      transformToArr = {
        transform: jasmine.createSpy('transform').and.callFake(() => {
          return '';
        }),
      }

      storageService = {
        get: jasmine
          .createSpy('get')
          .withArgs(StorageKeys.CURRENT_PROGRAM)
          .and.returnValue(MockCurrentProgram)
          .withArgs(StorageKeys.NEW_PROGRAM)
          .and.returnValue(NewProgramData)
          .withArgs(StorageKeys.USER_TYPE)
          .and.returnValue('SUPER_ORG')
          .withArgs('SYSTEM_DEFAULT')
          .and.returnValue(false)
          .withArgs(StorageKeys.PROGRAM_ID)
          .and.returnValue('e0b1b073-50dc-41d3-abf4-4f6c9abc3233')
          .withArgs(StorageKeys.ORGANIZATION_ID)
          .and.returnValue('a3c0c26d-c5bb-4e2a-ab04-99a705639366')
          .withArgs(StorageKeys.USER_PERMISSION)
          .and.returnValue(['edit_pay_rate_for_markup_page_assignment_revision', 'view_sows_history_tab', 'view_vendor_setup'])
          .withArgs('UOMSelected')
          .and.callFake(() => {})
          .withArgs('ProgramObj')
          .and.returnValue(null)
          .withArgs(StorageKeys.CURRENT_USER)
          .and.returnValue(user)
          .withArgs(StorageKeys.IMPERSONATOR_TOKEN)
          .and.returnValue(null)
          .withArgs('ClientData')
          .and.returnValue(null)
          .withArgs('ClientData')
          .and.returnValue(null)
          .withArgs(StorageKeys.ACCOUNT)
          .and.returnValue(account)
          .withArgs(StorageKeys.ACCURACY_CONFIG)
          .and.returnValue(accuracy_config)
          .withArgs('UserSideBar')
          .and.returnValue(null)
          .withArgs('hierarchyData')
          .and.returnValue(null)
          .withArgs(StorageKeys.GLOBAL_LAUNCH_CONFIG)
          .and.returnValue(GLOBAL_LAUNCH_CONFIG)
          .withArgs(StorageKeys.ACCOUNT_CODE_CONFIG)
          .and.returnValue(account_code_config)
          .withArgs('timeSheetData')
          .and.returnValue(timeSheetData)
          .withArgs('hierarchyDataEdit')
          .and.returnValue(null)
          .withArgs('CONTROL_PANEL_VISITED')
          .and.returnValue(false)
          .withArgs('Usertheme')
          .and.returnValue("white-blue")
          .withArgs('viewd_job')
          .and.returnValue('viewd_job')
          .withArgs('job_listing_status')
          .and.returnValue('job_listing_status')
          .withArgs('job_listing_limit')
          .and.returnValue('job_listing_limit')
          .withArgs('job_listing_page')
          .and.returnValue('job_listing_page')
          .withArgs('template_Data')
          .and.returnValue('template_Data')
          .withArgs(StorageKeys.GLV_PREFERENCE)
          .and.returnValue(glv)
          .withArgs('setAvtarColors')
          .and.returnValue('setAvtarColors')
          .withArgs('UserTooltip')
          .and.returnValue('UserTooltip')
          .withArgs('assignment_uuid')
          .and.returnValue(null)
          .withArgs(StorageKeys.VIEWD_JOB)
          .and.returnValue(viewd_job)
          .withArgs('candidateListRefData')
          .and.returnValue(null)
          .withArgs('members')
          .and.returnValue(null)
          .withArgs('colorAvatar')
          .and.returnValue(null)
          .withArgs('userBasicInformation')
          .and.returnValue(null)
          .withArgs('ProgramList')
          .and.returnValue(null)
          .withArgs('userEmail')
          .and.returnValue(null)
          .withArgs('IMPERSONATOR_ID')
          .and.returnValue(null)
          .withArgs('GLV_PREFERENCE')
          .and.returnValue(null)
          .withArgs(StorageKeys.INACTIVITY_START_TIME)
          .and.returnValue(new Date())
          .withArgs('UserData')
          .and.returnValue(new Date())
          .withArgs('UserPreferredTimeZone')
          .and.returnValue('IST')
          .withArgs('rfx_side_nav')
          .and.returnValue(null)
          .withArgs('sow_side_nav')
          .and.returnValue(null)
          .and.returnValue(new Date())
          .withArgs(StorageKeys.PROFILE_ORG_CATEGORY)
          .and.returnValue(null)
          .withArgs('PROFILE_ORG_ID')
          .and.returnValue(null)
          .withArgs('PROFILE_PROGRAM_ID')
          .and.returnValue(null)
          .withArgs('IsReloaded')
          .and.returnValue(null), 

        remove: jasmine.createSpy('remove').and.callFake(() => {
          return true;
        }),

        set : jasmine.createSpy('set').and.callFake(() => {
          return true;
        }),

        getSession :jasmine.createSpy('getSession').and.callFake(() => {
          return 'true';
        }),

        clear : jasmine.createSpy('clear').and.callFake(() => {
          return true;
        }),

        getWithExpiry : jasmine.createSpy('getWithExpiry').and.callFake(() => {
          return true;
        }),
      };

      TestBed.configureTestingModule({
        declarations: [
          TestingComponent,
          SortHelperPipe,
          UniqueKeyPipe,
          CustomcurrencyPipe,
          LocalDateFormatPipe,
          SnakeToTitleCasePipe,
          ShortNamePipe,
          SharedShortNamePIpe,
          SmartTableShorNamePipe,
          DatePipe,
          TransformToArrPipe
        ],
        imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, RouterTestingModule, I18NextModule.forRoot(), NgSelectModule],
        providers: [
          { provide: SortHelperPipe, useValue: sortHelperPipe },
          { provide: UniqueKeyPipe, useValue: uniqueKeyPipe },
          { provide: LocalDateFormatPipe, useValue: localDateFormat },
          { provide: StorageService, useValue: storageService },
          { provide: AccuracyPipe, useValue: accuracyPipe },
          { provide: TitleCasePipe, useValue: titleCasePipe },
          { provide: LocalDateTimeFormatPipe, useValue: localDateTimeFormatPipe },
          { provide: SnakeToTitleCasePipe, useValue: snakeToTitleCasePipe },
          { provide: SharedShortNamePIpe, useValue: shortNamePipe },
          { provide: SmartTableShorNamePipe, useValue: shortNamePipe },
          { provide: ShortNamePipe, useValue: shortNamePipe },
          { provide: CustomcurrencyPipe, useValue: customcurrencyPipe },
          { provide: TransformToArrPipe, useValue: transformToArr },
          { provide: DatePipe, useClass: DatePipe },

          UntypedFormBuilder,
          I18N_PROVIDERS[0],
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      }).compileComponents();
    });
  };
}
