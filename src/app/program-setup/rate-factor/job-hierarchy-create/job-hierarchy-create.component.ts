import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { switchMap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { RateFactorService } from '../rate-factor.service';
import { VMSTreeConfig } from 'src/app/library/tree/tree.model';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import * as _ from 'lodash';

type JobTemplateItem = {
  id: string,
  name: string,
  title: string,
  selected: boolean
}

@Component({
  selector: 'app-job-hierarchy-create',
  templateUrl: './job-hierarchy-create.component.html',
  styleUrls: ['./job-hierarchy-create.component.scss']
})
export class JobHierarchyCreateComponent implements OnInit, OnDestroy {

  @Input() title: string;
  @Input() tabIndex: number = 0;
  @Input() visibility: ('visible' | 'hidden') = 'hidden';
  @Input() readonly: boolean = false;

  @Output() close: EventEmitter <any> = new EventEmitter <any> ();
  @Output() tabIndexChange: EventEmitter <number> = new EventEmitter <number> ();

  private subscriptions: Array <Subscription> = [];
  private jobTemplateSub: Subject <string> = new Subject <string> ();
  
  public jobTemplates: Array <JobTemplateItem> = [];
  public hierarchyTree: Array <any> = [];
  public treeConfig: VMSTreeConfig = {
    title: '',
    columnList: [
      {
        name: 'hierarchies',
        title: '',
        width: 45,
        isImage: true,
        isIcon: true,
        isVieworEdit: false,
        isNoOption: false,
        isVisible: true
      }
    ]
  };

  public selectAllOption: boolean = false;
  public templateSearchTerm: string = '';

  constructor (
    private storage: StorageService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
    private alert: AlertService,
    private loader: LoaderService,
    private rateFactorService: RateFactorService,
    private uniqueKeyPipe: UniqueKeyPipe
  ) {}

  ngOnInit(): void {

    this.subscriptions.push(
      this.eventStream.on(Events.RATE_FACTOR_POPULATE)
        .subscribe({
          next: (res: any) => {
            if (res) {
              const { job_templates, hierarchies } = res;
              this.selectHierarchies(hierarchies);
              this.selectJobTemplates(job_templates);
            }
          }, error: (err: Error) => {
            console.error(err);
          }
        }
      )
    );

    this.subscriptions.push(
      this.eventStream.on(Events.REFRESH)
      .subscribe(res => { 
        this.clearSelections();
      })
    );

    this.subscriptions.push(
      this.jobTemplateSub.pipe(
        switchMap((term: string) => {

          const programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
          let url = `/job-manager/programs/${programId}/job-templates?limit=50`;
          if (term) {
            url += `&q=${term}`;
          }

          this.loader.show();
          return this.programService.get(url);
        })
      )
        .subscribe({
          next: (res: any) => {
            if (res) {
              this.loader.hide();
              let job_templates: Array<any> = res.job_templates;
              if (Array.isArray(job_templates)) {

                let oldJobTemplates: Array<JobTemplateItem> = this.jobTemplates.filter((entry: JobTemplateItem) => entry.selected);
                this.jobTemplates = job_templates.map((template: any) => {

                  const { id, template_name, category, ref_title } = template;
                  this.rateFactorService.jobTemplateMap.set(id, template_name);

                  return {
                    id, name: template_name, selected: false,
                    title: category?.category_name + ' - ' + ref_title?.title
                  }
                });

                this.jobTemplates = this.uniqueKeyPipe.transform([...oldJobTemplates, ...this.jobTemplates], 'id');
              }
            }
          }, error: (err: Error | any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          }
        }
      )
    );

    this.fetchHierarchyTree();
    this.jobTemplateSub.next("");

  }

  fetchHierarchyTree(): void {

    const programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/hierarchy`;

    this.loader.show();
    this.programService.get(url)
      .subscribe({
        next: (res: any) => {
          if (res) {

            this.loader.hide();
            this.hierarchyTree = res.result;
            if (Array.isArray(this.hierarchyTree)) {
              this.hierarchyTree.forEach((entry: any) => {
                this.parseHierarchyTree(entry);
              });
            }
          }
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  parseHierarchyTree(entry: any) {

    if(!entry)
      return;

    const { id, name, hierarchies } = entry;
    this.rateFactorService.hierarchyMap.set(id, name);
    if(Array.isArray(hierarchies)) {
      hierarchies.forEach((hierarchy: any) => this.parseHierarchyTree(hierarchy));
    }
  }

  filterJobList(evt: KeyboardEvent) {
    const elRef: any = evt.target;
    const term = (elRef.value).toString().toLowerCase();
    this.jobTemplateSub.next(term);
  }

  selectAllOptions() {
    this.jobTemplates = this.jobTemplates.map((template: JobTemplateItem) => {
      return {
        ...template,
        selected: !this.selectAllOption
      }
    });
  }

  onSave() {

    let jobTemplates = this.getSelectedJobTemplates();
    let hierarchyList = this.getSelectedHierarchies();

    if(!hierarchyList?.length) {
      this.alert.error('Please select atleast one hierarchy for defining rate factor');
      return;
    }

    this.clearSelections();
    this.close.emit({
      jobTemplates,
      hierarchyList
    });

    this.selectAllOption = false;
    this.templateSearchTerm = '';
    this.fetchHierarchyTree();
    this.jobTemplateSub.next("");
  }

  selectHierarchies(hierarchies: Array <string>) {
    const hierarchyRef = document.getElementById('app-tree');
    if (hierarchyRef) {
      const selectors = hierarchyRef.querySelectorAll('app-tree-node');
      if (selectors) {
        selectors.forEach((node: any) => {
          const nodeId = node.querySelector('a')?.id;
          if (hierarchies && hierarchies.includes(nodeId)) {
            const input = node.querySelector('input');
            if(input) {
              input.checked = true;
            }
          }
        });
      }
    }
  }

  selectJobTemplates(templates: Array <string>) {

    let leftEntries: Array<string> = [];
    let allTemplateList: Array<string> = this.jobTemplates.map((entry: JobTemplateItem, it: number) => {
      this.jobTemplates[it].selected = false;
      return entry.id;
    });

    templates.forEach((template: string) => {
      if (allTemplateList.includes(template)) {
        let index = allTemplateList.indexOf(template);
        this.jobTemplates[index] = {
          ...this.jobTemplates[index],
          selected: true
        }
      } else {
        leftEntries.push(template);
      }
    });

    leftEntries.forEach((template: string) => {
      this.rateFactorService.fetchJobTemplate(template)
        .subscribe({
          next: (res: any) => {
            if (res && ('job_template' in res)) {

              let template: any = res.job_template;
              const { id, template_name, category, ref_title } = template;

              this.rateFactorService.jobTemplateMap.set(id, template_name);
              this.jobTemplates = [
                {
                  id, name: template_name, selected: true,
                  title: category?.category_name + ' - ' + ref_title?.title
                },
                ...this.jobTemplates
              ];
            }
          }, error: (err: Error | any) => {
            this.alert.error(errorHandler(err));
          }
        }
      )
    });
  }

  getSelectedHierarchies() {

    let selections: Array <any> = [];
    const hierarchyRef = document.getElementById('app-tree');
    if (hierarchyRef) {

      const selectors = hierarchyRef.querySelectorAll('app-tree-node');
      if (selectors) {

        selectors.forEach((node: any) => {
          const nodeId = node.querySelector('a')?.id;
          const nodeName = node.querySelector('a')?.innerText;
          const nodeChecked = node.querySelector('input')?.checked;
          if (nodeId && nodeName && nodeChecked) {
            selections.push({
              name: nodeName,
              id: nodeId
            });
          }
        });

        return selections;
      }
    }

    return [];
  }

  getSelectedJobTemplates() {
    let selectedTemplates: Array <JobTemplateItem> = this.jobTemplates.filter((template: JobTemplateItem) => {
      return template.selected;
    });
    return selectedTemplates.map((template: JobTemplateItem) => { 
      return {
        'id': template.id, 
        'name': template.name
      }
    });
  }

  clearSelections() {

    this.jobTemplates = this.jobTemplates.map((template: JobTemplateItem) => {
      return { ...template, selected: false };
    })

    this.hierarchyTree = _.cloneDeep(this.hierarchyTree);
  }

  sidebarClose() {
    this.clearSelections();
    this.templateSearchTerm = '';
    this.selectAllOption = false;
    this.close.emit(null);
    this.fetchHierarchyTree();
    this.jobTemplateSub.next("");
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }
}