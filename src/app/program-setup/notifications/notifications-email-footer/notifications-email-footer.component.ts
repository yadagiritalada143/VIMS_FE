import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SvmsUploadAvatarComponent} from '../../../shared/components/svms-upload-avatar/svms-upload-avatar.component';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../core/services/user.service';
import {StorageService} from '../../../core/services/storage.service';
import {AlertService} from '../../../core/components/alert/alert.service';
import {Router} from '@angular/router';
import {LoaderService} from '../../../core/components/loader/loader.service';
import {errorHandler} from '../../../shared/util/error-handler';

@Component({
  selector: 'app-notifications-email-footer',
  templateUrl: './notifications-email-footer.component.html',
  styleUrls: ['./notifications-email-footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationsEmailFooterComponent implements OnInit {


  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;
  public emailFooterForm: UntypedFormGroup;
  public programId;
  public userType;
  public header;
  public footer;
  public headerFooterId;
  public isHidden: boolean;
  public defaultFooter = true;

  footerOptions = {
    enableFooter: true,
    languages: null,
    themeType: 'light',
    footerLogo: {
      file: null,
      open: true,
      selected: true
    },
    caption: {
      open: false,
      selected: false,
    },
    applicationLinks: {
      open: false,
      selected: false,
      links: [
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
      ]
    },
    mediaLinks: {
      open: false,
      selected: false,
      links: [
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
      ]
    },
    hyperLinks: {
      open: false,
      selected: false,
      links: [
        {
          link: null,
          prepend: 'Hyperlink #1',
          control: 'first_link',
          btn_control: 'first_btn_name',
          error: null,
          pattern: new RegExp('(https?:\/\/www)')
        },
        {
          link: null,
          prepend: 'Hyperlink #2',
          control: 'second_link',
          btn_control: 'second_btn_name',
          error: null,
          pattern: new RegExp('(https?:\/\/www)')
        },
        {
          link: null,
          prepend: 'Hyperlink #3',
          control: 'third_link',
          btn_control: 'third_btn_name',
          error: null,
          pattern: new RegExp('(https?)')
        },
      ]
    },
    address: {
      open: false,
      selected: false,
    },
    disclaimer: {
      open: false,
      selected: false,
    },
    copyright: {
      open: false,
    }
  };
  selectedLinks = {
    firstSelected: null,
    secondSelected: null,
    thirdSelected: null,
  };

  constructor(public userService: UserService,
              private storageService: StorageService,
              private alertService: AlertService,
              public router: Router,
              private loader: LoaderService,
  ) { }

  ngOnInit(): void {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    this.programId = programDetails.program_req_id;
    this.userType = this.storageService.get('user_type').toLowerCase();
    this.getFooter();
    this.getLanguages();

    this.emailFooterForm = new UntypedFormGroup({
      language: new UntypedFormControl(null, []),
      theme: new UntypedFormControl(null, []),
      logo: new UntypedFormControl(null, []),
      caption: new UntypedFormControl(null, [Validators.maxLength(100)]),
      mediaLinks: new UntypedFormGroup({
        first: new UntypedFormControl(null, []),
        firstSelected: new UntypedFormControl(null, []),
        second: new UntypedFormControl(null, []),
        secondSelected: new UntypedFormControl(null, []),
        third: new UntypedFormControl(null, []),
        thirdSelected: new UntypedFormControl(null, []),
      }),
      applicationLinks: new UntypedFormGroup({
        app_store: new UntypedFormControl(null, []),
        play_store: new UntypedFormControl(null, []),
      }),
      hyperLinks: new UntypedFormGroup({
        first_link: new UntypedFormControl(null, []),
        first_btn_name: new UntypedFormControl('About Us', []),
        second_link: new UntypedFormControl(null, []),
        second_btn_name: new UntypedFormControl('Contact Us', []),
        third_link: new UntypedFormControl(null, []),
        third_btn_name: new UntypedFormControl('Us Tech Solutions', []),
      }),
      address: new UntypedFormControl(null, []),
      disclaimer: new UntypedFormControl(null, []),
      copyright: new UntypedFormControl(null, []),
    });

    this.getLanguages();
  }

  saveFooterTemplate() {
    const payload = {
      program_id: this.programId,
      language: this.formValue.language.value,
      header: this.header,
      footer: this.createFooterContent(),
      footer_image: this.footerOptions.footerLogo.file
    };

    if (!this.footerOptions.footerLogo.selected) {
      payload.footer = '';
    }

    if (!this.footerOptions.footerLogo.file) {
      delete payload.footer_image;
    }

    if (!this.footerOptions.enableFooter) {
      payload.footer = '';
      payload.footer_image = '';
    }
    if (this.emailFooterForm.valid && this.valid) {
      this.loader.show();
      this.userService.put(`/notification/api/notification/${this.programId}/header-footer/2?actor=${this.userType}`, payload)
        .subscribe(data => {
          this.loader.hide();
          this.alertService.success('The notification footer has been successfully updated.');
        }, err => {
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        });
    } else {
      this.alertService.error('Please fill in all data correctly');
    }
  }

  get valid() {
    let valid = true;
    this.footerOptions.applicationLinks.links.forEach(item => {
      if (item.error && this.footerOptions.applicationLinks.selected) {
        valid = false;
      }
    });
    this.footerOptions.mediaLinks.links.forEach(item => {
      if (item.error && this.footerOptions.mediaLinks.selected) {
        valid = false;
      }
    });
    this.footerOptions.hyperLinks.links.forEach(item => {
      if (item.error && this.footerOptions.hyperLinks.selected) {
        valid = false;
      }
    });
    return valid;
  }

  onCancel() {
    this.footerOptions = {
      enableFooter: true,
      languages: null,
      themeType: 'light',
      footerLogo: {
        file: null,
        open: true,
        selected: false,
      },
      caption: {
        open: false,
        selected: true,
      },
      applicationLinks: {
        open: false,
        selected: true,
        links: [
          {
            url: null,
            control: 'app_store',
            prepend: 'App Store',
            error: null,
            pattern: new RegExp('(https?:\/\/apps.apple.com)'),
            image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/app_store.png'
          },
          {
            url: null,
            control: 'play_store',
            prepend: 'Play Store',
            error: null,
            pattern: new RegExp('(https?:\/\/play.google.com)'),
            image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/google_play.png'
          },
        ]
      },
      mediaLinks: {
        open: false,
        selected: true,
        links: [
          {
            link: null,
            prepend: 'Facebook',
            control: 'facebook',
            error: null,
            pattern: new RegExp('(https?:\/\/facebook\.com)'),
            selected: false,
            image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/fb-icon.png'
          },
          {
            link: null,
            prepend: 'Linkedin',
            control: 'linkedin',
            error: null,
            pattern: new RegExp('(https?:\/\/linkedin\.com)'),
            selected: false,
            image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/linkedin-icon.png'
          },
          {
            link: null,
            prepend: 'Twitter',
            control: 'twitter',
            error: null,
            pattern: new RegExp('(https?:\/\/twitter\.com)'),
            selected: false,
            image: 'https://d1sbrrldholyx7.cloudfront.net/assets/email-templates/twitter-icon.png'
          },
        ]
      },
      hyperLinks: {
        open: false,
        selected: true,
        links: [
          {
            link: null,
            prepend: 'About Us',
            control: 'first_link',
            btn_control: 'first_btn_name',
            error: null,
            pattern: new RegExp('(https?)')
          },
          {
            link: null,
            prepend: 'Contact Us',
            control: 'second_link',
            btn_control: 'second_btn_name',
            error: null,
            pattern: new RegExp('(https?)')
          },
          {
            link: null,
            prepend: 'Us Tech Solutions',
            control: 'third_link',
            btn_control: 'third_btn_name',
            error: null,
            pattern: new RegExp('(https?)')
          },
        ]
      },
      address: {
        open: false,
        selected: true,
      },
      disclaimer: {
        open: false,
        selected: true,
      },
      copyright: {
        open: false
      }
    };
    this.selectedLinks = {
      firstSelected: null,
      secondSelected: null,
      thirdSelected: null,
    };
    this.getFooter();
  }

  getFooter() {
    this.loader.show();
    this.userService.get(`/notification/api/notification/${this.programId}/header-footer?actor=${this.userType}`).subscribe((data:any) => {
      this.header = data.results[0].header;
      this.footer = data.results[0].footer;
      this.emailFooterForm.patchValue({
        language: data.results[0].language.id
      });
      this.getFooterContent();
      this.headerFooterId = data.results[0].id;
      this.loader.hide();
    }, err => {
      this.alertService.error(errorHandler(err));
      this.loader.hide();
    });
  }

  getLanguages() {
    this.userService.get(`/notification/api/notification/language`).subscribe((data:any) => {
      this.footerOptions.languages = data.results;
    });
  }

  getCropImage(e) {
    this.footerOptions.footerLogo.file = e;
  }

  get formValue() {
    return this.emailFooterForm.controls;
  }

  getHtmlContent(id) {
    return document.getElementById(id).innerHTML;
  }

  onClickToggle(toggle) {
    if (toggle === 'enableFooter') {
      this.footerOptions[toggle] = !this.footerOptions[toggle];
      this.footer = '';
      this.footerOptions.footerLogo.selected = false;
      this.footerOptions.footerLogo.open = false;
      this.defaultFooter = false;
      if (!this.footerOptions[toggle]) {
        const notSelectedKeys =
          [
            'enableFooter',
            'languages',
            'themeType',
          ];

        this.footerOptions.themeType = 'light';
        this.emailFooterForm.get('theme').setValue('light');
        this.emailFooterForm.get('copyright').setValue('');

        Object.keys(this.footerOptions).forEach(item => {
          if (!notSelectedKeys.includes(item)) {
            this.footerOptions[item].selected = false;
            this.footerOptions[item].open = false;
          }
        });
      }
    } else {
      if (this.footerOptions.enableFooter) {
        this.footerOptions[toggle].selected = !this.footerOptions[toggle].selected;
        this.footerOptions[toggle].open = this.footerOptions[toggle].selected;
        if (this.footerOptions.footerLogo.selected) {
          this.footerOptions.footerLogo.open = this.footerOptions.footerLogo.selected;
        } else if (!this.footerOptions.footerLogo.selected) {
          this.footerOptions.footerLogo.open = this.footerOptions.footerLogo.selected;
        }
      }
    }
  }

  isValidUrl(control, linksForm, event) {
    if (linksForm === 'downloadLinks') {
      this.footerOptions.applicationLinks.links.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    } else if (linksForm === 'hyperLinks') {
      this.footerOptions.hyperLinks.links.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    } else {
      this.footerOptions.mediaLinks.links.forEach(item => {
        if (item.control === control) {
          item.error = !item.pattern.test(event.target.value);
        }
      });
    }
  }

  getLinkError(selected) {
    let valid;
    if (this.formValue.mediaLinks.value[selected]) {
      this.footerOptions.mediaLinks.links.forEach(item => {
        if (item.control === this.formValue.mediaLinks.value[selected].control) {
          valid = item.error;
        }
      });
    }
    return valid;
  }

  changeMediaLink(link, selected) {
    this.footerOptions.mediaLinks.links.forEach(item => {
      if (this.formValue.mediaLinks.value[selected] && item.control === this.formValue.mediaLinks.value[selected].control) {
        this.selectedLinks[selected] = item;
        item.selected = !item.selected;
      }
    });
  }

  clearSelectedMedia(selected) {
    this.footerOptions.mediaLinks.links.forEach(item => {
      if (this.selectedLinks[selected] && item.control === this.selectedLinks[selected].control) {
        item.selected = !item.selected;
        if (selected === 'firstSelected') {
          this.emailFooterForm.get('mediaLinks').patchValue({
            first: null,
          });
        } else if ('secondSelected') {
          this.emailFooterForm.get('mediaLinks').patchValue({
            second: null,
          });
        } else {
          this.emailFooterForm.get('mediaLinks').patchValue({
            third: null,
          });
        }
      }
    });
    this.selectedLinks[selected] = null;
  }

  createFooterContent() {
    return document.getElementById('footer_content').innerHTML
      .replace(/<!--[^>]*-->/gi, '')
      .replace(/\n/g, '')
      .replace(/ng-.+?\b/g, '')
      .replace(/ng-.+?=".*?"/g, '')
      .replace(/class=""/g, '')
      .replace(/\s+/g, ' ')
      .replace(/"/g, '\'')
      .replace(/"/g, '\'');
  }


  getFooterContent() {
    if (this.footer === '') {
      this.onClickToggle('enableFooter');
    } else {
      const notSelectedKeys =
        [
          'enableFooter',
          'languages',
          'themeType',
        ];

        // Theme fix
        const parsed = new DOMParser().parseFromString(this.footer, 'text/html');
        const themeElRef = parsed.getElementsByClassName('preview-content');
        if(themeElRef) {
          const theme_class = themeElRef[0]?.classList;
          if(theme_class && theme_class.contains('dark'))
            this.footerOptions.themeType = 'dark';
          else
            this.footerOptions.themeType = 'light';
        }
         else {
          this.footerOptions.themeType = 'light';
        }

        // Footer image fix
        if(this.footer.search('\'img-after-upload') !== -1) {

          const value = new DOMParser().parseFromString(this.footer, 'text/html');  
          let imageEl = (value.getElementsByTagName('img')[0]).getAttribute('src');
  
          this.footerOptions.footerLogo.file = imageEl;
          this.footerOptions.footerLogo.selected = true;

        }

      Object.keys(this.footerOptions).forEach(item => {
        if (this.footer.search(`'${item}'`) !== -1) {
          this.defaultFooter = false;
          if (!notSelectedKeys.includes(item)) {
            this.footerOptions[item].selected = true;
          }
          if (item === 'mediaLinks' || item === 'applicationLinks' || item === 'hyperLinks') {
            this.changeLinksValue(item);
          } else {
            this.changeInputsValue(item);
          }
        }
      });
      if (this.defaultFooter) {
        this.footerOptions.footerLogo.selected = false;
        this.footerOptions.footerLogo.open = true;
      }
    }
  }

  changeLinksValue(control) {

    const dom = new DOMParser().parseFromString(this.footer, 'text/html');
    let skimmed_dom = dom.getElementsByClassName(control)[0];
    this.footerOptions[control].open = true;
    this.footerOptions[control].selected = true;

    let length;
    switch(control) {

      case 'applicationLinks': {

          this.footerOptions.applicationLinks.links[0].url = skimmed_dom.children[0].getAttribute('href');
          this.footerOptions.applicationLinks.links[1].url = skimmed_dom.children[1].getAttribute('href');

          this.emailFooterForm.get('applicationLinks').patchValue({
              app_store: this.footerOptions.applicationLinks.links[0].url,
              play_store: this.footerOptions.applicationLinks.links[1].url,
            });

        }
          break;
 
      case 'mediaLinks': {

          length = skimmed_dom.children.length;
          for(let i=0; i<length; i++) {

            const link = skimmed_dom.children[i].getAttribute('href');
            let node = {};

            if(i === 0)
              node = {
                firstSelected: this.getMediaObject(link),
                first: link
              }

            else if(i === 1)
              node = {
                secondSelected: this.getMediaObject(link),
                second: link
              }

            else if( i === 2)
              node = {
                thirdSelected: this.getMediaObject(link),
                third: link
              }

            this.emailFooterForm.get('mediaLinks').patchValue(node);
          }
        }
          break;

      case 'hyperLinks': {

        let it = 0;
        length = skimmed_dom.children.length;
        for(let i=0; i<length; i++) {

          let obj = {};
          if(skimmed_dom.children[i].getAttribute('href') !== null) {
            if(it === 0)
              obj = { 
                first_link: skimmed_dom.children[i].getAttribute('href'),
                first_btn_name: skimmed_dom.children[i].textContent
              }
            else if(it === 1)
              obj = { 
                second_link: skimmed_dom.children[i].getAttribute('href'),
                second_btn_name: skimmed_dom.children[i].textContent
              }
            else if(it === 2)
              obj = { 
                third_link: skimmed_dom.children[i].getAttribute('href'),
                third_btn_name: skimmed_dom.children[i].textContent
              }

            it++;
            this.emailFooterForm.get('hyperLinks').patchValue(obj);

          }
        }
      }

    }
  }

  getMediaObject(url: string) {

    if(url.search(this.footerOptions.mediaLinks.links[1].pattern) !== -1) {
      this.footerOptions.mediaLinks.links[1].link = url;
      return this.footerOptions.mediaLinks.links[1];
    }
    else if(url.search(this.footerOptions.mediaLinks.links[0].pattern) !== -1) {
      this.footerOptions.mediaLinks.links[0].link = url;
      return this.footerOptions.mediaLinks.links[0];
    }
    
    this.footerOptions.mediaLinks.links[2].link = url;
    return this.footerOptions.mediaLinks.links[2];

  }

  changeInputsValue(control) {
    const value = new DOMParser().parseFromString(this.footer, 'text/html');
    if (value.getElementsByClassName(control)[0]) {
      this.emailFooterForm.patchValue({
        [control]: value.getElementsByClassName(control)[0].textContent,
      });
    }
  }

  get hasSelected() {
    let isSelected = false;
    const notSelectableKeys =
      [
        'enableFooter',
        'languages',
        'themeType',
      ];
    Object.keys(this.footerOptions).forEach(item => {
      if (this.footerOptions[item]?.selected && !notSelectableKeys.includes(item)) {
        isSelected = true;
      }
    });
    return isSelected;
  }
}
