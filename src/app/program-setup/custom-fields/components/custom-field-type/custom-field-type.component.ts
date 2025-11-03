import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs-compat/Observable';
import { map, tap } from 'rxjs/operators';
import { CustomFieldsService } from '../../custom-fields.service';
import { CustomFieldTypes } from '../../custom-fields.enums';
import { ICustomFieldType } from '../../interfaces/custom-fields.interface';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';

@Component({
  selector: 'app-custom-field-type',
  templateUrl: './custom-field-type.component.html',
  styleUrls: ['./custom-field-type.component.scss'],
})
export class CustomFieldTypeComponent implements OnInit {
  @Output() valueChange = new EventEmitter<ICustomFieldType>();

  public selected: ICustomFieldType;
  public supportedFields$: Observable<Array<ICustomFieldType>>;

  public readonly CustomFieldTypes = CustomFieldTypes;

  @Input() allowed: Array <string> = null;

  constructor(
    private customFieldsService: CustomFieldsService,
    private uniqueKey: UniqueKeyPipe
  ) {}

  ngOnInit(): void {
    this.supportedFields$ = this.customFieldsService.getSupportedFields().pipe(
      map((res:any) => res.custom_fields),
      tap(customFields => {
        this.selected = customFields[0];
        this.valueChange.emit(this.selected);
      })
    );
  }

  select(type: ICustomFieldType) {
    this.selected = type;
    this.valueChange.emit(this.selected);
  }

  public getSvgName(fileName: string) {
    return fileName?.split('.svg')?.length && fileName?.split('.svg')[0].length ? fileName?.split('.svg')[0] : '1';
  }

  showAllowedFields(data :Array <string>): Array <string> {
    if(!Array.isArray(data)) {
      return [];
    }

    if(Array.isArray(this.allowed)) {
      data = data?.filter((data: any) => this.allowed.includes(data?.type));
    }

    return this.uniqueKey.transform(data, 'type');
  }
}
