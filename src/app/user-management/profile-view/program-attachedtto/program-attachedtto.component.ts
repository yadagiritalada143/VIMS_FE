import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import * as _ from 'lodash';
import { AllowedCFUserTypes } from '../program-user-cf.config';
import { CommonService } from 'src/app/library/custom-fields/common.service';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'vms-program-attachedtto',
  templateUrl: './program-attachedtto.component.html',
  styleUrls: ['./program-attachedtto.component.scss'],
})
export class ProgramAttachedttoComponent implements OnChanges,OnInit {

  visibleAccordion = '';
  @Input() viewData: any;
  @Input() openAddToProgram: boolean = false;
  
  programLength: any = 0;
  id: any;
  programsList: any = [];
  expandedIndex = 0;
  showDropdownIcon: boolean = false;
  categoryORG: string = null;

  public progDetail: any = null;
  private userType: string;
  objectKeys: any = Object.keys;

  constructor (
      private programService: ProgramService, 
      private route: ActivatedRoute, 
      private alertService: AlertService, 
      private loaderService: LoaderService,
      private localStorage: StorageService,
      private cfService: CommonService
    ) {

    }
 
  public list_or_create: boolean = true;
  public createUser = 'hidden';
  public reloadPage: boolean = true;
  public showFlyout: boolean = true;

  createUserToggle(event: any) {

    if (event !== 'visible') {
      this.showFlyout = false;
      setTimeout(() => {
        this.showFlyout = true;
        this.loaderService.hide();
      });
    }

    if (event === 'hidden') {
      this.progDetail = null;
      this.visibleAccordion = null;
    }
    this.createUser = event;

  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    let category = this.localStorage.get("PROFILE_ORG_CATEGORY")?.toUpperCase();
    this.categoryORG = this.localStorage.get("PROFILE_ORG_CATEGORY");
    if(category === 'CLIENT' || category === 'MSP') {
      this.showDropdownIcon = true;
    }
    this.userType = this.localStorage.get(StorageKeys.USER_TYPE);
    this.getProgramList();
  }

  ngOnChanges() {
    // this.setprogramValue();
    if (this.openAddToProgram) this.createUserToggle('visible');
  }

  setprogramValue() {
    this.programLength = this.viewData ? this.viewData.programs.length : 0;
    this.programsList = this.viewData ? this.viewData.programs : [];
  }

  handleUpdate() {
    this.ngOnInit();
  }

  onEditClick(data, evt: PointerEvent) {
    evt.cancelBubble = true;
    this.progDetail = data;
    this.createUserToggle('visible');
    return evt;
  }

  onDeleteClick(evt: PointerEvent, id: string) {

    evt.cancelBubble = true;
    const url = `/configurator/programs/${id}/members/${this.id}`;

    this.loaderService.show();
    this.programService.delete(url)
      .subscribe({
        next: (res: any) => {
          this.handleUpdate();
          this.loaderService.hide();
          this.alertService.success('User successfully detached from program');
        }, error: (err: Error | any) => {
          this.loaderService.hide();
          this.alertService.error(errorHandler(err));
        }
      }
    );

    return evt;
  }

  getProgramList() {

    let url: string = `/configurator/members/${this.id}/programs`;
    if (this.userType?.toUpperCase() !== 'SUPER_ORG') {
      url += `?program_id=${this.localStorage.get(StorageKeys.PROGRAM_ID)}`;
    }

    this.programService.get(url).subscribe({
      next: (data: any) => {
        if(Array.isArray(data?.programs)) {

          this.programLength = data.programs.length;
          this.programsList = data.programs;

          let defaults: any = {};
          for (let i = 0; i < this.programLength; i++) {

            const item: any = this.programsList?.[i];
            defaults = {};

            if (item.defaults) {
              for (let j = 0; j < item.defaults.length; j++) {
                if (item.defaults[j].entity_type == "FOUNDATIONAL_DATA") {
                  let fd_type_name = item.defaults[j].entity_object.foundational_data_type.name;
                  if (fd_type_name in defaults) {
                    defaults[fd_type_name].push({ 'name': item.defaults[j].entity_object.name, 'code': item.defaults[j].entity_object?.code })
                  }
                  else {
                    defaults[fd_type_name] = [{ 'name': item.defaults[j].entity_object.name, 'code': item.defaults[j].entity_object?.code }];
                  }
                }
              }
            }

            item['defaultValues'] = defaults;
            this.parseHierarchyView(item);
            this.parseWorkLocationView(item);
          }
        } 

        }, error: (err: Error | any) => {
          if (errorHandler(err) === "Supplied user is not a member of any active program") {
            this.programLength = 0;
            this.programsList = [];
          }
        }
      }
    );
  }

  onclickArrow(program: any, index: number) {

    // Fetch CF details (if needed)
    const programId: string = program?.id;
    const customFields: any = program?.program_user_custom_fields || {};
    const orgCategory: string = (program?.role?.organization_category || '')?.toUpperCase();

    const dataFetched: boolean = ('custom_field_view' in program);
    const cfAllowed: boolean = AllowedCFUserTypes.includes(orgCategory);
    if(!dataFetched && cfAllowed) {
      program['custom_field_view'] = true;
      this.cfService.amendCFViewData(customFields, programId, 'PROGRAM_USERS', orgCategory).then((res: any) => {
        if(Array.isArray(res) && res.length) {
          program['custom_field_view'] = res.slice(1);
        } else {
          program['custom_field_view'] = [];
        }
      });
    }

    if(programId === this.visibleAccordion){
      this.visibleAccordion = null;
      return;
    }

    this.visibleAccordion = programId;
  }

  isArray(item: any) {
    return Array.isArray(item);
  }

  getWorkLocations(item: any): Array <any> | null {

    const defaults: Array <any> = item?.defaults;
    if(Array.isArray(defaults)) {
      let work_locations: Array <any> = [];
      defaults.forEach((entity: any) => {
        if(entity?.entity_type === 'WORK_LOCATION') {
          work_locations.push(entity?.entity_object);
        }
      });

      return work_locations;
    }

    return null;
  }

  private parseHierarchyView(program: any) {

    program['hierarchyView'] = [];
    let defaultHierarchy: string = (program?.defaults || [])
      .find((entry: any) => (entry?.entity_type === 'HIERARCHY'))?.entity_id;
    if (defaultHierarchy) {
      program['hierarchyView'].push('Loading...');
      this.programService.get(`/configurator/programs/${program?.id}/hierarchy/${defaultHierarchy}`)
      .subscribe((res: any) => {
        program['hierarchyView'][0] = (`${res?.hierarchy?.name} (Default)`);
      });
    }

    const hierarchies: Array <any> = program?.hierarchies;
    const allHierarchiesSelected: boolean = program?.is_all_hierarchies;
    if (allHierarchiesSelected) {
      program['hierarchyView'].push('Associated to all Hierarchies');
    } else if (Array.isArray(hierarchies)) {
      program['hierarchyView'].push(...(hierarchies
        .filter((entry: any) => entry?.id !== defaultHierarchy)
        .map((entry: any) => entry?.name)
      ));
    }
  }

  private parseWorkLocationView(program: any) {

    program['locationView'] = [];
    let defaults: any = (program?.defaults || [])
      .find((entry: any) => (entry?.entity_type === 'WORK_LOCATION'));
    if (defaults) {
      program['locationView'].push(`${defaults?.entity_object?.name} (Default)`);
    }

    const work_locations: Array <any> = program?.work_locations;
    const allLocationSelected: boolean = program?.is_all_work_locations;
    if (allLocationSelected) {
      program['locationView'].push('Associated to All Work Locations');
    } else if (Array.isArray(work_locations)) {
      program['locationView'].push(...work_locations
        .filter((entry: any) => entry?.id !== defaults?.entity_id)
        .map((entry: any) => entry?.name)
      );
    }
  }

  private appendCFView(recievedCFs: any, program_id: string, org_category: string, index: number) {

    let url: string = `/configurator/programs/${program_id}/custom-fields?entity_ref=PROGRAM_USERS&active=1&order_by=asc&key=ref_order&org_category=${org_category}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        if(res?.custom_fields) {
          this.appendCFViewHelper(res?.custom_fields, recievedCFs, index);
        }
      }, error: (err: Error | any) => {
        console.error(err);
        this.alertService.error(errorHandler(err));
      }
    });
  }

  private appendCFViewHelper(cfEntries: Array <any>, recievedCFs: any, index: number) {

    let result: Array <{label: string, value: string}>  = [];
    let cfIDs: Array <string> = [...Object.keys(recievedCFs)];

    let observables: Array <Observable <any>> = [];
    let observableMap: Map <string, string> = new Map <string, string> ();

    cfIDs.forEach((id: string) => {
      let cfEntry: any = cfEntries.find((entry: any) => (entry?.id === id));
      if(cfEntry) {
        const { label, type, api_url } = cfEntry;
        let value: any = recievedCFs?.[id];
        switch(type) {
          case 'SOURCE':
            let dropdownURL: string = (api_url || '').split('?')?.[0];
            dropdownURL += `/${value}`;
            observables.push(this.programService.get(dropdownURL));
            observableMap.set(value, label);
            break;

          default:
            if(Array.isArray(value)) {
              value = value.join(', ');
            }
    
            if(value) {
              result.push({ label, value });
            }
        }
      }
    });

    if(observables?.length) {
      forkJoin(observables).subscribe({
        next: (res: any) => {
          if(Array.isArray(res)) {
            res.forEach((entry: any) => {

              const member: any = entry?.member || {};
              const { id, full_name } = member;

              result.push({
                label: observableMap.get(id) || 'Undefined',
                value: full_name
              });
            })
          }

          // Append data
          this.programsList[index]['custom_field_view'] = result?.length ? result : null;
          this.programsList = _.cloneDeep(this.programsList);

        }, error: (err: any) => {
          console.error(err);
          this.alertService.error('Error encountered while fetching user details!');
        }
      });
    } else {
      // Append data
      this.programsList[index]['custom_field_view'] = result?.length ? result : null;
      this.programsList = _.cloneDeep(this.programsList);
    }
  }
}
