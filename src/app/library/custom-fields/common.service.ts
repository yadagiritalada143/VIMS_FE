import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, forkJoin, interval, takeUntil, takeWhile } from 'rxjs';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewDetail, CommonViewConfig, CommonViewTypeOptions } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import moment from 'moment-timezone';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from '../date-format/date-format.model';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private fileTypes: Array <string> = ['FILE', 'IMAGE'];
  private multipleCFTypes: Array <string> = ['CHECKBOX', 'MULTI_SELECT_DROPDOWN'];

  private dependentFieldsSource = new BehaviorSubject(null);
  dependentFields = this.dependentFieldsSource.asObservable();

  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    private programService: ProgramService,
    private storageService: StorageService,
    private currencyPipe: CustomcurrencyPipe
  ) {}

  updateDependentFields(dependentFields: any) {
    this.dependentFieldsSource.next(dependentFields);
  }

  public amendCFData(data: Array <any>) {
    let custom_fields: any = {};
    if(Array.isArray(data)) {
      data.forEach((entry: any) => {
        let { custom_field_id, values } = entry;
        values = values ? values : [];

        if(custom_field_id) {
          custom_fields[custom_field_id] = Array.isArray(values)? values: [values];
        }
      });
    }

    return custom_fields;
  }

  public queueCFpopulation(cfObject: any, cfCmp?: CustomFieldsComponent): Promise<any> {

    let result: any = {};
    let destroyer$: Subject <void> = new Subject <void>();
    let cfValues: Array <any> = ([...Object.keys(cfObject)] || []).map((id: string) => {
      return { id, value: cfObject?.[id] };
    });

    return new Promise((resolve: Function, reject: Function) => {

      interval(500).pipe(
        takeUntil(destroyer$),
        takeWhile((count: number) => (count <= 120)),
      ).subscribe(() => {

        try {

          const cfEntries: Array <any> = cfCmp?.customFields;
          if (Array.isArray(cfEntries) && Array.isArray(cfValues)) {
            cfValues.forEach(({ id, value }) => {

              let cfEntry: any = cfEntries.find((opt: any) => (opt?.id === id));
              if (cfEntry) {

                const { slug, type } = cfEntry;
                const multiField: boolean = this.multipleCFTypes.includes(type) || cfEntry?.meta_data?.datasource?.is_multi_select;

                // Sort by ref_order
                if(this.multipleCFTypes.includes(type) && Array.isArray(value)) {
                  value = this.sortValuesByRefOrder(value, cfEntry?.meta_data?.datasource?.options);
                }

                // Value conversion (if needed)
                if (multiField && (typeof (value) === 'string')) {
                  value = [value];
                }

                if(type === 'PICKLIST') {
                  const isMultiField: boolean = cfEntry?.pick_list?.multiselect || false;
                  if(isMultiField && !Array.isArray(value)) {
                    value = [value];
                  }
                }

                // Date conversions
                if (type === 'DATE') {
                  value = moment(value, DATE_FORMAT.FORMATMDY).format(this.dateFormat);
                } else if (type === 'DATETIME') {
                  let fragments: Array <string> = (value || '').split(' ');
                  fragments[0] = moment(fragments[0], DATE_FORMAT.FORMATMDY).format(this.dateFormat);
                  value = fragments.join(" ");
                }

                // File conversion
                if(this.fileTypes.includes(type) && (typeof(value) === 'string')) {
                  try {
                    value = this.strObjectConverter(value);
                  }
                  catch(err: any) {
                    console.error(err);
                  }
                }

                result[slug] = value;
              }
            });

            destroyer$.next();
            return resolve(result);
          }
        } catch (err: Error | any) {
          destroyer$.next();
          return reject(err);
        }
      });
    });
  }

  public amendCFViewData(custom_fields: any, program_id: string, entity_ref: string, org_category: string = null) {
    return new Promise((resolve: Function, reject: Function) => {

      const selectedCFs: Array <string> = [...Object.keys(custom_fields || {})];
      if(!selectedCFs.length) {
        this.loader.hide();
        resolve([]);
        return;
      }

      // Observable storage for API based data retrieval (if needed)
      let observables: Array <Observable <any>> = [];
      let observableMap: Map <string, string> = new Map <string, string> ();  
      let cfPriorityMap: Map <string, number> = new Map <string, number> ();

      let url: string = `/configurator/programs/${program_id}/custom-fields?entity_ref=${entity_ref}&active=1&order_by=asc&key=ref_order`;
      if(org_category) {
        url += `&org_category=${org_category}`;
      }

      this.programService.get(url).subscribe({
        next: (res: any) => {

          let config: Array <CommonViewDetail> = [];
          const cfList: Array <any> = res?.custom_fields;
          if (Array.isArray(selectedCFs) && Array.isArray(cfList)) {

            cfList.forEach((entry: any, it: number) => {
              cfPriorityMap.set(entry?.label, it);
            })

            selectedCFs.forEach((cf_id: string) => {

              const cfEntry: any = cfList.find((entry: any) => entry?.id === cf_id);
              if(cfEntry) {

                let { name, label, type, api_url, meta_data } = cfEntry || {};
                let value: any = name ? (custom_fields?.[cf_id] || '') : '';

                // Sort by ref_order
                if(this.multipleCFTypes.includes(type) && Array.isArray(value)) {
                  value = this.sortValuesByRefOrder(value, cfEntry?.meta_data?.datasource?.options);
                }

                if(this.fileTypes.includes(type) && typeof(value) === 'string') {
                  try {
                    value = (this.strObjectConverter(value) || {});
                  } catch (err: any) {
                    console.error(err);
                  }
                }

                const isMultiSelect: any = meta_data?.datasource?.options;
                if(Array.isArray(isMultiSelect)) {
                  let valueFound: string = isMultiSelect.find((opt: any) => (opt?.value === value))?.label;
                  value = valueFound || value;
                }

                switch(type) {
                  case 'SOURCE':
                    let dropdownURL: string = (api_url || '').split('?')?.[0];
                    dropdownURL += `/${value}`;
                    observables.push(this.programService.get(dropdownURL));
                    observableMap.set(value, label);
                    break;
        
                  case "DATE":
                    value = moment(value, DATE_FORMAT.FORMATMDY).format(this.dateFormat);
                    break;

                  case "DATETIME":
                    let fragments: Array <string> = (value || '').split(' ');
                    fragments[0] = moment(fragments[0], DATE_FORMAT.FORMATMDY).format(this.dateFormat);
                    value = fragments.join(" ");        
                    break;   

                  case "CURRENCY":
                    let currency: string = meta_data?.currency || 'USD';
                    value = this.currencyPipe.transform(value, currency);
                    break;

                  case 'PICKLIST':
                    const picklistOptions: Array <any> = cfEntry?.pick_list?.picklist_item || [];
                    if(!Array.isArray(value)) {
                      value = [value];
                    }

                    value = value.map((val: string) => picklistOptions.find((pEntry: any) => (pEntry?.value === val))?.label)
                              .filter((val: any) => !!val)
                              .join(", ");
                    break;
                }

                if(type !== 'SOURCE') {

                  let displayType: CommonViewTypeOptions = CommonViewConfig.TEXT;
                  if(type === 'HYPERLINK') {
                    displayType = CommonViewConfig.HYPERLINK;
                  } else if (this.fileTypes.includes(type)) {
                    displayType = CommonViewConfig.ATTACHMENT;
                  }

                  config.push({ label, value, displayType });
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
        
                      config.push({
                        label: observableMap.get(id) || 'Undefined',
                        value: full_name,
                        displayType: CommonViewConfig.TEXT
                      });
                    })
                  }
        
                  resolve(this.appendCFDataHelper(config, cfPriorityMap));
                
                }, error: (err: any) => {
                  reject([]);
                  console.error(err);
                  this.alert.error('Error encountered while fetching user details!');
                }
              });
            } else {
              resolve(this.appendCFDataHelper(config, cfPriorityMap));  
            }
          }

          this.loader.hide();
        }, error: (err: Error | any) => {
          reject([]);
          console.error(err);
          this.loader.hide();
          this.alert.error('Error encountered while fetching custom field details!');
        }
      })
    });
  }

  private appendCFDataHelper(config: Array <CommonViewDetail>, mp: Map <string, number>): Array <CommonViewDetail> {
    if (config?.length) {
      config.sort((a: any, b: any) => (mp.get(a?.label) ?? 9999) - ((mp.get(b?.label) ?? 9999)));
      return [{
          label: 'Custom Fields',
          value: 'Custom Fields',
          displayType: CommonViewConfig.HEADER
        }, ...config
      ];
    }

    return [];
  }

  private strObjectConverter(str: string) {
    let rgx: RegExp = new RegExp(/\"(.*)\"/gm)
    let result: any = null

    let regex_itr: RegExpExecArray = rgx.exec(str);

    if (regex_itr) {

        let file_name: string = regex_itr[0].slice(1, -1)
        let str_parts: Array<string> = str.split('\"' + file_name + '\"');
        str_parts = str_parts.map((x: string) => {
            while (x.includes("'")) {
                x = x.replace("'", '"');
            }

            return x;
        })

        str = str_parts.join('"' + file_name + '"');

    } else {
        while (str.includes("'")) {
            str = str.replace("'", '"');
        }
    }

    result = JSON.parse(str);
    return result;
}

  private sortValuesByRefOrder(value: Array <string>, options: Array <any>): Array <string> {
    if (Array.isArray(options) && Array.isArray(value) && value.length > 1) {

      options = options.sort((a: any, b: any) => {
        let ref_a: number = a?.ref_order ?? Number.POSITIVE_INFINITY;
        let ref_b: number = b?.ref_order ?? Number.POSITIVE_INFINITY;

        return ref_a - ref_b;
      });

      return options
        .filter((opt: any) => value.includes(opt?.label) || value.includes(opt?.value))
        .map((opt: any) => opt?.label);
    }
  }

  get dateFormat(): string {
    let format: string = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? DATE_FORMAT.FORMATMDY;
    return format?.toUpperCase();
  }
}
