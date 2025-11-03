import { Component, OnInit, Input, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserDataObj } from '../../enums';
import { TranslationService } from '../../service/utility/translation.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { I18NextService  } from 'angular-i18next';
import i18next from 'i18next';
import english from '../../../../assets/i18n/en-US.json';
import deutch from '../../../../assets/i18n/de.json';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';

@Component({
  selector: 'app-lang-switcher',
  templateUrl: './lang-switcher.component.html',
  styleUrls: ['./lang-switcher.component.scss'],
})

export class LangSwitcherComponent implements OnInit {
  @Input('standalone')
  public standalone: boolean;
  public supportedLanguages: any = [];
  @ViewChild('langTrigger', { read: ElementRef, static: false }) langTrigger: ElementRef;
  @ViewChild('langSwitcherPanel', { read: ElementRef, static: false }) langSwitcherPanel: ElementRef;

  userLanguage = UserDataObj;
  language = 'en-US';
  langShowHide = false;
  langSearch = false;
  searchText: string = undefined;
  selectedLang: string = undefined;
  languagesList: any[] = [];
  languageDropdown: boolean = true;

  constructor(private _storageService: StorageService, public _i18nextService: I18NextService, private render: Renderer2,
              private translationService: TranslationService, private _loader: LoaderService,private jobDetailService: JobDetailsService
    ) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.langTrigger && this.langTrigger.nativeElement.contains(e.target)) ||
        (this.langSwitcherPanel && this.langSwitcherPanel.nativeElement.contains(e.target)) && this.langShowHide) {
        this.langShowHide = true;
      } else {
        this.langShowHide = false;
      }
    });
  }
  ngOnInit(): void {
    if(localStorage.getItem(StorageKeys.USER_LANGUAGE) && localStorage.getItem(StorageKeys.USER_LANGUAGE)!=='null'){
      this.language = localStorage.getItem(StorageKeys.USER_LANGUAGE);
      try {
        this.language = JSON.parse(this.language);
      } catch(err) {}
      this.selectedLang = this.language;
    }
    else{
      this.selectedLang = this.language;
    }
    this.getSupportedLanguages();
  }

  // async getSupportedLanguages() {
  //   // Get supported language
  //   this.translationService.getLanguages().subscribe(async (supportedLangResponse:any) => {
  //     if(supportedLangResponse){
  //       this.supportedLanguages = supportedLangResponse || [];
  //     }
  //     this.setLanguageDetails(this.supportedLanguages);
  //   },(error) => {
  //     throw new Error(`${error.statusText}`);
  //   })
  // }
   getSupportedLanguages() {
    // Get supported language
    this.translationService.getLanguages().subscribe(async (supportedLangResponse:any) => {
      if(supportedLangResponse){
        this.supportedLanguages = supportedLangResponse || [];
        if(this.supportedLanguages.length === 0){
          this.languageDropdown = false;
           this.selectedLang = this.language;
        }else {
          this.getGlobalFlagsList();
        }
      }
      this.setLanguageDetails();
    },(error) => {
      this.getGlobalFlagsList();
      this.languageDropdown = false;
      this.selectedLang = this.language;
      this.setLanguageDetails();
      throw new Error(`${error.statusText}`);
    })
  }

  setLanguageDetails() {
   // this._i18nextService.(languages);
    // const language = this._storageService.get(StorageKeys.USER_LANGUAGE);
    const language = localStorage.getItem(StorageKeys.USER_LANGUAGE)
    if (language) {
      this.supportedLanguages?.forEach(lang => {
        if (lang?.locale === language) {
          this.selectedLang = lang?.locale;
        }
      });
      // this.language = language;
    } else {
      this.selectedLang = i18next.language;
    }
    this.getLanguageData(this.selectedLang , false);
  }

  getLanguageData(languageLocale, showLoader) {
    this.translationService.loadTranslation(languageLocale).subscribe(async (result) => {
      if(result){
        // this._loader.hide();
         this._i18nextService.addResourceBundle(languageLocale, 'translation', result[languageLocale].translation, false, true);
        // Change language
         this._i18nextService.changeLanguage(languageLocale);
        // Set locale to the localStorage
        this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());
        // Change selected lang with the current module
        this.selectedLang = languageLocale;
      }
  },error => {
    // if(languageLocale == 'en-US' || languageLocale == 'hu' || languageLocale == 'fr'){
    if(languageLocale == 'en-US'){

       this._i18nextService.addResourceBundle(languageLocale, 'translation', english, false, true);

       this._i18nextService.changeLanguage(languageLocale);

       this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());

      this.selectedLang = languageLocale;
      // this._loader.hide();
    }else {
      this._i18nextService.addResourceBundle(languageLocale, 'translation', deutch, false, true);

       this._i18nextService.changeLanguage(languageLocale);

       this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());

      this.selectedLang = languageLocale;
    }
  });
  }

  async changeLang(e, lang) {
 //   i18next language switcher
    if (e.target.checked && lang) {
      this._loader.show();
      let languageLocale;
      switch (lang?.locale) {
        case 'en-us':
          languageLocale = 'en-US';
          break;
        case 'hg':
          languageLocale = 'hu';
          break;
        default:
          languageLocale = lang?.locale;
          break;
      }
      localStorage.setItem('user_language',languageLocale)
      // this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());

      this.translationService.loadTranslation(languageLocale).subscribe(async (result) => {
          if(result){
            this._loader.hide();
            await this._i18nextService.addResourceBundle(languageLocale, 'translation', result[languageLocale].translation, false, true);
            // Change language
            await this._i18nextService.changeLanguage(languageLocale);
            // Set locale to the localStorage
            this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());
            // Change selected lang with the current module
            this.selectedLang = lang?.locale;
            window.location.reload(); 
          }
      },error => {
        // if(languageLocale == 'en-US' || languageLocale == 'hu' || languageLocale == 'fr'){
           this._i18nextService.addResourceBundle(languageLocale, 'translation', english, false, true);

           this._i18nextService.changeLanguage(languageLocale);

           this._storageService.set(StorageKeys.USER_LANGUAGE, languageLocale?.toString());

          this.selectedLang = lang?.locale;
          this._loader.hide();
      });

    }
  }

  get filteredLanguages() {
    if (this.searchText) {
      return this.supportedLanguages.filter(lang => lang?.language?.toLowerCase()?.includes(this.searchText?.toLowerCase()));
    } else {
      return this.supportedLanguages;
    }
  }

  getGlobalFlagsList() {
    if(localStorage.getItem('Token')){
    this.jobDetailService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
          this.languageDropdown =  data.global_launch_data.find(config => config.slug === 'language_translation')?.is_enabled;
        }
      },
    });
  }
  }

  openModalLanguage() {
    this.langShowHide = true;
  }

  closeLang() {
    this.langShowHide = false;
  }
}
