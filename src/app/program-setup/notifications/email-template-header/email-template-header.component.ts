import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SvmsUploadAvatarComponent} from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {ProgramService} from '../../../programs/program.service';
import {StorageService} from '../../../core/services/storage.service';
import {AlertService} from '../../../core/components/alert/alert.service';
import {Router} from '@angular/router';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {Location} from '@angular/common';

@Component({
  selector: 'app-email-template-header',
  templateUrl: './email-template-header.component.html',
  styleUrls: ['./email-template-header.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EmailTemplateHeaderComponent implements OnInit, AfterViewInit {

  public header;
  public footer;
  public headerFooterId;
  public userType;
  public isHidden: boolean;

  public toggles = {
    header: {
      value: true,
    },
    caption: {
      value: false,
      open: false
    },
    social_media_links: {
      value: false,
      open: false
    },
    download_links: {
      value: false,
      open: false
    },
    hyper_links: {
      value: false,
      open: false
    },
    default_check: {
      value: false,
      open: false
    }
  };

  selectedLinks = {
    firstSelected: null,
    secondSelected: null,
    thirdSelected: null,
  };

  public emailHeaderForm: UntypedFormGroup;
  public programId;
  showLayoutContent = false;
  showLogoContent = true;
  logo = null;

  @ViewChild('defaultCheck') defaultCheck: ElementRef;
  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;

  public languages;

  public mediaLinks = [
    {
      link: null,
      prepend: 'Facebook',
      control: 'facebook',
      error: null,
      pattern: new RegExp('(https?:\/\/www.facebook\.com)'),
      selected: false,
      image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/fb-icon.png'
    },
    {
      link: null,
      prepend: 'Linkedin',
      control: 'linkedin',
      error: null,
      pattern: new RegExp('(https?:\/\/www.linkedin\.com)'),
      selected: false,
      image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/linkedin-icon.png'
    },
    {
      link: null,
      prepend: 'Twitter',
      control: 'twitter',
      error: null,
      pattern: new RegExp('(https?:\/\/www.twitter\.com)'),
      selected: false,
      image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/twitter-icon.png'
    },
  ];

  public hyperLinks = [
    {
      type: null,
      btn_name: null,
      link: null,
      control: 'first_link',
      btn_control: 'first_btn_name',
      error: null,
      pattern: new RegExp('(https?:\/\/www)')
    },
    {
      type: null,
      btn_name: null,
      link: null,
      control: 'second_link',
      btn_control: 'second_btn_name',
      error: null,
      pattern: new RegExp('(https?:\/\/www)')
    },
  ];

  public downloadLinks = [
    {
      url: null,
      control: 'app_store',
      prepend: 'App Store',
      error: null,
      pattern: new RegExp('(https?:\/\/www.apps.apple.com)'),
      image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/app_store.png'
    },
    {
      url: null,
      control: 'play_store',
      prepend: 'Play Store',
      error: null,
      pattern: new RegExp('(https?:\/\/www.play.google.com)'),
      image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/google_play.png'
    },
  ];


  constructor(public programService: ProgramService,
              private storageService: StorageService,
              private alertService: AlertService,
              public router: Router,
              private loader: LoaderService,
              private location: Location) {
  }

  ngAfterViewInit(): void {
    this.changeLayout('default_check');
  }

  ngOnInit(): void {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    this.programId = programDetails.program_req_id;
    this.userType = this.storageService.get('user_type').toLowerCase();
    this.getHeader();
    this.getLanguages();
    this.emailHeaderForm = new UntypedFormGroup({
      language: new UntypedFormControl(null, []),
      layout: new UntypedFormControl('without_links', []),
      logo: new UntypedFormControl(null, []),
      caption: new UntypedFormControl(null, [Validators.maxLength(100)]),
      blank_text: new UntypedFormControl(null, [Validators.maxLength(4000)]),
      social_media_links: new UntypedFormGroup({
        first: new UntypedFormControl(null, []),
        firstSelected: new UntypedFormControl(null, []),
        second: new UntypedFormControl(null, []),
        secondSelected: new UntypedFormControl(null, []),
        third: new UntypedFormControl(null, []),
        thirdSelected: new UntypedFormControl(null, []),
      }),
      download_links: new UntypedFormGroup({
        app_store: new UntypedFormControl('https://www.apps.apple.com/', []),
        play_store: new UntypedFormControl('https://www.play.google.com/', []),
      }),
      hyper_links: new UntypedFormGroup({
        first_link: new UntypedFormControl(null, []),
        first_btn_name: new UntypedFormControl('Hyperlink 1', []),
        second_link: new UntypedFormControl(null, []),
        second_btn_name: new UntypedFormControl('Hyperlink 2', []),
      }),
    });
  }

  onSave() {
    const payload = {
      program_id: this.programId,
      language: this.formValue.language.value,
      header: this.createHeaderContent(),
      footer: this.footer,
      header_image: this.logo
    };

    if (!this.logo) {
      delete payload.header_image;
    }
    if (!this.toggles.header.value) {
      payload.header = '';
      payload.header_image = '';
    }

    if(!this.checkAdditionalFields()) {
      return;
    }

    if (this.emailHeaderForm.valid && this.valid) {
      this.loader.show();
      this.programService
        .put(`/notification/api/notification/${this.programId}/header-footer/${this.headerFooterId}?actor=${this.userType}`, payload)
        .subscribe(data => {
          this.alertService.success('The notification header has been successfully updated.');
          this.loader.hide();
        }, err => {
          this.alertService.error(errorHandler(err));
          this.loader.hide();
        });
    } else {
      this.alertService.error('Please fill in all data correctly');
    }
  }

  checkAdditionalFields() {

    const layout = this.emailHeaderForm.get('layout');
    if(layout.value === 'hyper_links') {

      const linkRef = this.emailHeaderForm.get('hyper_links');

      if(!linkRef.get('first_btn_name').value || !linkRef.get('second_btn_name').value) {
        this.alertService.error('All hyperlink names not provided');
        return false;
      }

      const l1: string = linkRef.get('first_link').value;
      const l2: string = linkRef.get('second_link').value;
      
      if(!l1 || !l2) {
        this.alertService.error('All hyperlink URLs not provided');
        return false;
      }

      if(!l1.match(this.hyperLinks[0].pattern) || !l2.match(this.hyperLinks[1].pattern)) {
        this.alertService.error('Incorrect hyperlink URLs provided');
        return false;
      }

    } else if(layout.value === 'download_links') {

      const  { app_store, play_store } = this.emailHeaderForm.get('download_links').value;
      
      if(!app_store || !play_store) {
        this.alertService.error('All application URLs not provided');
        return false;
      }

      if(!app_store.match(this.downloadLinks[0].pattern) || !play_store.match(this.downloadLinks[1].pattern)) {
        this.alertService.error('Incorrect application URLs provided');
        return false;
      }

    } else if(layout.value === 'social_media_links') {

      const { 
        firstSelected, secondSelected, thirdSelected, 
        first, second, third
      } = this.emailHeaderForm.get('social_media_links').value;

      if((firstSelected && !first) || (secondSelected && !second) || (thirdSelected && !third)) {
        this.alertService.error('Social media URL(s) not provided');
        return false;
      }

    }

    return true;
  }

  get valid() {
    let valid = true;
    this.downloadLinks.forEach(item => {
      if (item.error && this.toggles.download_links.value) {
        valid = false;
      }
    });
    this.mediaLinks.forEach(item => {
      if (item.error && this.toggles.social_media_links.value) {
        valid = false;
      }
    });
    this.hyperLinks.forEach(item => {
      if (item.error && this.toggles.hyper_links.value) {
        valid = false;
      }
    });
    return valid;
  }

  getCropImage(e) {
    this.logo = e;
  }

  onClickToggle(toggle) {

    if (toggle === 'header') {

      this.toggles[toggle].value = !this.toggles[toggle].value;
      if(this.toggles[toggle].value) {
        this.emailHeaderForm.get('layout').setValue('without_links');
      }
      
      if (!this.toggles[toggle].value) {
        Object.keys(this.toggles).forEach(item => {
          if (item !== toggle) {
            this.toggles[item].value = false;
            this.toggles[item].open = false;
          }
        });
      }
    } 
     else {

      if (this.toggles.header.value) {
        this.toggles[toggle].value = !this.toggles[toggle].value;
        this.toggles[toggle].open = this.toggles[toggle].open ? this.toggles[toggle].open : !this.toggles[toggle].open;
      }

    }
  }


  getHeader() {
    this.loader.show();
    this.programService.get(`/notification/api/notification/${this.programId}/header-footer?actor=${this.userType}`).subscribe((data:any) => {
      this.header = data.results[0].header;
      this.footer = data.results[0].footer;
      this.headerFooterId = data.results[0].id;
      this.emailHeaderForm.patchValue({
        language: data.results[0].language.id
      });
      this.getHeaderContent();
      this.loader.hide();
    }, err => {
      this.alertService.error(errorHandler(err));
      this.loader.hide();
    });
  }

  get formValue() {
    return this.emailHeaderForm.controls;
  }

  isValidUrl(control, linksForm, event) {
    if (linksForm === 'downloadLinks') {
      this.downloadLinks.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    } else if (linksForm === 'hyperLinks') {
      this.hyperLinks.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    } else {
      this.mediaLinks.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    }
  }

  getLinkError(selected) {
    let valid;
    if (this.formValue.social_media_links.value[selected]) {
      this.mediaLinks.forEach(item => {
        if (item.control === this.formValue.social_media_links.value[selected].control) {
          valid = item.error;
        }
      });
    }
    return valid;
  }

  changeMediaLink(link, selected) {
    this.mediaLinks.forEach(item => {
      if (this.formValue.social_media_links.value[selected] && item.control === this.formValue.social_media_links.value[selected].control) {
        this.selectedLinks[selected] = item;
        if(selected === 'firstSelected') {
          this.formValue.social_media_links.get('first').setValue(`https://www.${link.control}.com/`);
        } else if(selected === 'secondSelected') {
          this.formValue.social_media_links.get('second').setValue(`https://www.${link.control}.com/`);  
        } else if(selected === 'thirdSelected') {
          this.formValue.social_media_links.get('third').setValue(`https://www.${link.control}.com/`);
        }
        item.selected = !item.selected;
      }
    });
  }

  clearSelectedMedia(selected) {
    this.mediaLinks.forEach(item => {
      if (this.selectedLinks[selected] && item.control === this.selectedLinks[selected].control) {
        item.selected = !item.selected;
        if (selected === 'firstSelected') {
          this.emailHeaderForm.get('social_media_links').patchValue({
            first: null,
          });
        } else if (selected === 'secondSelected') {
          this.emailHeaderForm.get('social_media_links').patchValue({
            second: null,
          });
        } else {
          this.emailHeaderForm.get('social_media_links').patchValue({
            third: null,
          });
        }
      }
    });
    this.selectedLinks[selected] = null;
  }

  changeLayout(layout) {
    if (this.toggles.header.value) {

      this.emailHeaderForm.patchValue({
        layout,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(this.header, 'text/html');

      if (layout === 'blank') {
        if (doc.getElementsByClassName('blank-text').length !== 0) {
          const children = doc.getElementsByClassName('blank-text')[0].children;
          this.emailHeaderForm.patchValue({
            blank_text: children[0].innerHTML,
          });
        }
      } else if (layout === 'without_links') {
        this.emailHeaderForm.get('layout').setValue('without_links');
      } else {
        this.toggles[layout].open = true;
        this.toggles[layout].value = true;
      }
    }
  }

  getLanguages() {
    this.programService.get(`/notification/api/notification/language`).subscribe((data:any) => {
      this.languages = data.results;
    });
  }

  getHtmlContent(id) {
    return document.getElementById(id).innerHTML;
  }

  createHeaderContent() {
    return document.getElementById('layout').innerHTML
      .replace(/<!--[^>]*-->/gi, '')
      .replace(/\n/g, '')
      .replace(/ng-.+?\b/g, '')
      .replace(/ng-.+?=".*?"/g, '')
      .replace(/class=""/g, '')
      .replace(/\s+/g, ' ')
      .replace(/"/g, '\'');
  }

  getHeaderContent() {

    if (this.header === '')
      this.toggles.header.value = false;
    else {

      if(this.header.search('\'img-after-upload') !== -1) {
        const value = new DOMParser().parseFromString(this.header, 'text/html');
        let imageEl = (value.getElementsByClassName('img-after-upload')[0]).getAttribute('src');
        this.logo = imageEl;
      }

      Object.keys(this.toggles).forEach(item => {
        if (this.header.search(`'${item}'`) !== -1) {

          if (item !== 'header')
            this.toggles[item].value = true;

          this.changeInputsValue(item);
          if (item === 'social_media_links' || item === 'download_links' || item === 'hyper_links') {
            this.changeLinksValue(item);
          }
        }
      });

      this.selectDefaultOption();

    }

  }

  selectDefaultOption() {

    const field = this.emailHeaderForm.get('layout');
    const html = new DOMParser().parseFromString(this.header, 'text/html');
    const trimmedHTML = html.querySelector('body');
    
    if(trimmedHTML.querySelector('#social_media_links')) {
      field.setValue('social_media_links');
      this.toggles['social_media_links'].open = true;
    } 
     else if(trimmedHTML.querySelector('#download_links')) {
      field.setValue('download_links');
      this.toggles['download_links'].open = true;
    } 
     else if(trimmedHTML.querySelector('#hyper_links')) {
      field.setValue('hyper_links');
      this.toggles['hyper_links'].open = true;
    } 
     else if(trimmedHTML.querySelector('.justify-content-center')) {
      field.setValue('without_links');
    } 
     else if(trimmedHTML.querySelector('#blank')){
      this.changeLayout('blank');
    } else {
      this.changeLayout('without_links');
    }

  }

  changeLinksValue(control) {

    const value = new DOMParser().parseFromString(this.header, 'text/html');
    let headerHTML = value.getElementsByClassName(control)[0].children;
    // console.log(headerHTML);

    switch(control) {

      case 'hyper_links':
        this.emailHeaderForm.get('hyper_links').patchValue({
            first_link: headerHTML[0]?.children[0].getAttribute('href'),
            first_btn_name: headerHTML[0]?.children[0].innerHTML,
            second_link: headerHTML[1]?.children[0].getAttribute('href'),
            second_btn_name: headerHTML[1]?.children[0].innerHTML
        });
        break;

      case 'download_links':
        this.emailHeaderForm.get('download_links').patchValue({
            app_store: headerHTML[0].getAttribute('href'),
            play_store: headerHTML[1].getAttribute('href')
        });
        break;

      case 'social_media_links':
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.header, 'text/html');
        if (doc.getElementsByClassName('social_media_links').length !== 0) {
          const children = doc.getElementsByClassName('social_media_links')[0].children;
          for (let i = 0; i < children.length; i++) {
            this.mediaLinks.forEach(item => {
              if (children[i].getAttribute('href').search(item.pattern) !== -1) {
                if (i === 0) {
                  this.selectedLinks.firstSelected = item;
                  this.emailHeaderForm.get('social_media_links').patchValue({
                    firstSelected: item,
                    first: children[i].getAttribute('href'),
                  });
                } else if (i === 1) {
                  this.selectedLinks.secondSelected = item;
                  this.emailHeaderForm.get('social_media_links').patchValue({
                    secondSelected: item,
                    second: children[i].getAttribute('href'),
                  });
                } else {
                  this.selectedLinks.secondSelected = item;
                  this.emailHeaderForm.get('social_media_links').patchValue({
                    thirdSelected: item,
                    third: children[i].getAttribute('href')
                  });
                }
                item.selected = !item.selected;
              }
            });
          }
        }

    }
  }

  changeInputsValue(control) {
    const value = new DOMParser().parseFromString(this.header, 'text/html');
    // console.log(control, value.getElementsByClassName(control)[0].textContent);
    if (value.getElementsByClassName(control)[0]) {
      this.emailHeaderForm.patchValue({
        [control]: value.getElementsByClassName(control)[0].textContent,
      });
    }
  }

  onCancel() {
    this.toggles = {
      header: {
        value: true
      },
      caption: {
        value: false,
        open: false
      },
      social_media_links: {
        value: false,
        open: false
      },
      download_links: {
        value: false,
        open: false
      },
      hyper_links: {
        value: false,
        open: false
      },
      default_check: {
        value: false,
        open: false
      }
    };
    this.selectedLinks = {
      firstSelected: null,
      secondSelected: null,
      thirdSelected: null,
    };
    this.getHeader();
    this.location.back();
  }
}
