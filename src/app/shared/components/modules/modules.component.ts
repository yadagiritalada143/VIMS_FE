import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';


@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss']
})
export class ModulesComponent implements OnInit {

  private allModuleData: Array <any> = [];
  public moduleData: Array <any> = [];
  @Input('moduleData') set moduleGroups(list: Array <any> | any) {
    this.allModuleData = list;
    this.moduleData = this.moduleListParser(list);
  };

  @Input('readOnly') readOnly = true;
  @Input() hideEmptyPermissionModules: boolean = false;
  @Input() hideHiddenModules:boolean = false;
  @Output() moduleDataChange = new EventEmitter<any[]>();

  public access: string = null;
  @Input('access') set accessLevel(data: any) {
    this.access = data;
    this.moduleData = this.moduleListParser(this.allModuleData);
  }

  constructor(private alert: AlertService) { }

  ngOnInit(): void { }

  moduleListParser(list: Array <any>): Array <any> {
    if(Array.isArray(list)) {
      if (this.hideHiddenModules) {
        list = list.filter((entry:any)=> !entry?.is_hidden)
      }
      if (this.hideEmptyPermissionModules) {
        list =  list.filter((entry: any) => {
          let modules: Array <any> = entry?.modules?.reduce((result: Array <any>, module: any) => {

            let permissions: Array <any> = module?.permissions || [];
            if (this.access) {
              permissions = permissions.filter((perm: any) => this.visibilityAccess(perm?.slug));
            }

            return [...result, ...(Array.isArray(permissions) ? permissions : [])];
          }, []);

          return (modules?.length !== 0);
        });
      }

      return list
    }

    return [];
  }

  onClickToggle(index) {
    if (!this.readOnly) {
      this.alert.info('Given option can only be changed in EDIT mode');
      return;
    }
    this.moduleData[index].is_enabled = !this.moduleData[index].is_enabled;
    this.moduleData = [... this.moduleData];
    this.moduleDataChange.emit(this.moduleData);
  }

  private visibilityAccess(slug: string = '') {
    return true;
    // (
    //   (slug.includes('_own_') && this.access === 'OWN') || 
    //   (!slug.includes('_own_') && this.access === 'ALL')
    // );
  }
}

export class ToggleModule {
  id: number;
  //icon: string;
  title: string;
  name: string;
  value: boolean;
}
