import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { Theme } from '../../enums';
import { StorageService } from '../../../core/services/storage.service';
import { UserDataObj } from '../../enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../util/error-handler';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss'],
})
export class ThemeSwitcherComponent implements OnInit {

  theme: string = Theme.Light;
  colorTheme: string = "grey";
  userTheme = UserDataObj;
  organizationId: any;
  userId:any;
  themes = [];
  constructor(private themeService: ThemeService, private _localStorage: StorageService,
    private alertService: AlertService, private eventStream: EventStreamService
    ) { }

  ngOnInit(): void {
    this.organizationId = JSON.parse(localStorage.getItem('ORG_ID'));
    this.userId = JSON.parse(localStorage.getItem('user'))?.id
    let savedtheme = this._localStorage.get(this.userTheme[2]);
   /*  if (savedtheme != "" && savedtheme != undefined) {
      this.colorTheme = savedtheme;
    } */
    // this.themes = this.themeService.getThemes().splice(2, 20);
      let url = `/public/resources/themes`;
    this.themeService.get(url).subscribe({
      next: (data: any) => {
       if(data) {
        this.themes = data?.themes;
        if(savedtheme){
          const themeDetails= this.themes.find(t=> t.code === savedtheme);
          this.colorTheme= themeDetails.id;
        }
       }
       
      }, error: (error: Error | any) => {
        this.alertService.error(errorHandler(error), {});
      }
    }
  );
  setTimeout(()=>{
    this.getUserTheme();
  },1000)
    // setTimeout(() => {
    //   thiss.themeService.changeTheme(thiss.colorTheme);
    // }, 5);
  }

  ngOnChanges(): void {
   // this.themeService.changeTheme(this.theme);
  }

  getUserTheme() {
    let url = `/profile-manager/users/${this.userId}`;
    this.themeService.get(url).subscribe({
      next: (data: any) => {
       if(data) {
          this.colorTheme = data?.user?.theme?.id;
          this.changeTheme(data?.user?.theme);
       }
       
      }, error: (error: Error | any) => {
        this.alertService.error(errorHandler(error), {});
      }
    }
  );
  }

  changeTheme(theme) {
      this.themeService.changeTheme(theme?.code);
  }

  handleClick(e, theme) {
    /* const theme ={
      theme: t?.id
    } */
    this.eventStream.emit(new EmitEvent(Events.THEME_UPDATE, theme?.code ?? "light-blue" ))
    let url = `/profile-manager/organizations/${this.organizationId}/members/${this.userId}`;
    this.themeService.put(url,{
      theme: theme?.id
    }).subscribe({
      next: (data: any) => {
       if(data) {
        this.colorTheme = theme.id;
      }
       if (e.target.checked) {
        this.changeTheme(theme);
      }
      }, error: (error: Error | any) => {
        this.alertService.error(errorHandler(error), {});
      }
    }
  );
    
    // if (e.target.checked) {
    //   this.themeService.changeTheme(t?.code);
    // }
  }

  getPrimaryColor(t) {
    if(t){
      return this.themeService.theme[t?.code]['--color-assets-primary'];
    }
  
  }

  getNavColor(t) {
    if(t)
    {
    return this.themeService.theme[t?.code]['--navigation-bg'];
    }
}

  switchColorMode() {
    if (this.theme = "dark") {
      this.themeService.changeTheme("dark");
      console.warn("1st option" + this.theme);
    }
    else {
      this.themeService.changeTheme("dark");
      console.warn("2nd option" + this.theme);
    }

    console.warn(this.theme);
  }
}
