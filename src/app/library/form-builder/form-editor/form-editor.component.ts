import { ClonerService } from './../../../core/services/cloner.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';

const WidthClass = {
  WIDTH_100: 'w-100',
  WIDTH_50: 'w-50'
};

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit, OnDestroy {
  @Input() roleList: any[] = [];
  selectedCustomField: any = undefined;
  customFields: Array<any> = undefined;
  activeField: any = {};
  activeIndex: any = undefined;
  datePickerOptions = { timepicker: false, range: false };
  private subscriptions = [];

  constructor(private eventStream: EventStreamService, private clonerService: ClonerService) { }

  ngOnInit(): void {
    this.customFields = [];
    this.subscriptions.push(this.eventStream.on(Events.UPDATE_CUSTOM_FIELD_PROPERTIES).subscribe( (result) => {
      if (result) {
        const data = result.field;
        if (data && data.primary !== undefined && data.secondary !== undefined && this.customFields[data.primary] !== undefined) {
          this.customFields[data.primary].splice(data.secondary, 1, data);
        }
      }
    }));
  }

  drop(event) {
    let options = {};
    const type = event.dataTransfer.getData('field-type');
    if (type === 'date') {
      options = this.datePickerOptions;
    }

    if (type && type !== 'null') {
      const rolList = JSON.parse(JSON.stringify(this.roleList));
      this.customFields.push([
        {
          type, roles: [...rolList], values: [],selectedOption: [],selectedToggle:'', is_enabled: false, is_required: false,
          meta_data: { class: WidthClass.WIDTH_100, options }
        }
      ]);
    } else {
      const draggedData = event.dataTransfer.getData('draggedData');
      if (draggedData) {
        const data = JSON.parse(draggedData);
        if (data) {
          if (this.customFields[data.x].length > 1) {
            const fieldType = data.y === 0 ? this.customFields[data.x][data.y + 1].type : this.customFields[data.x][data.y - 1].type;
            if (fieldType) {
              const fields = this.customFields[data.x].splice(data.y, 1);
              this.customFields[data.x].push({ meta_data: { class: WidthClass.WIDTH_50 } });
              this.customFields.push(fields);
            } else {
              const fields = this.customFields.splice(data.x, 1);
              if (fields && fields.length > 0) {
                this.customFields.push(fields[0]);
              }
            }
          } else {
            const fields = this.customFields.splice(data.x, 1);
            if (fields && fields.length > 0) {
              this.customFields.push(fields[0]);
            }
          }
        }
      }
    }
  }

  minimizeFieldSize(event, primary, secondary) {
    event.preventDefault();
    event.stopPropagation();
    if (this.customFields[primary] && this.customFields[primary].length === 1) {
      const customFields = this.clonerService.deepClone(this.customFields);
      customFields[primary][0].meta_data = { class: WidthClass.WIDTH_50 };
      customFields[primary][1] = { meta_data: { class: WidthClass.WIDTH_50 } };
      this.customFields = this.clonerService.deepClone(customFields);
      this.updateProperties(primary, secondary);
      // this.eventStream.emit(new EmitEvent(Events.SELECTED_CUSTOM_FIELD, { ...customFields[primary][0], primary, secondary }));
    }
  }

  maximizeFieldSize(event, primary, secondary) {
    event.preventDefault();
    event.stopPropagation();
    if (this.customFields[primary] && this.customFields[primary].length > 1) {
      const type = secondary === 0 ? this.customFields[primary][secondary + 1].type : this.customFields[primary][secondary].type;
      const element = this.customFields[primary].splice(secondary, 1);
      if (element && element.length > 0) {
        element[0].meta_data = { class: WidthClass.WIDTH_100 };
        if (type) {
          this.customFields[primary][1] = { meta_data: { class: WidthClass.WIDTH_50 } };
          if (secondary > 0) {
            this.customFields.splice(primary + 1, 0, element);
          } else {
            this.customFields.splice(primary, 0, element);
          }
        } else {
          this.customFields[primary] = element;
        }

      }
      this.updateProperties(primary, secondary);

    }
  }

  deleteCustomField(primary, secondary) {
    let type;
    if (this.customFields[primary] && this.customFields[primary].length > 1) {
      type = secondary === 0 ? this.customFields[primary][secondary + 1].type : this.customFields[primary][secondary].type;
    }
    if (type && secondary !== undefined) {
      this.customFields[primary].splice(secondary, 1);
      this.customFields[primary][1] = { meta_data: { class: WidthClass.WIDTH_50 } };
    } else {
      this.customFields.splice(primary, 1);
    }

  }

  customFieldClicked(customField, primary, secondary) {
    if (customField && (!this.activeIndex || (this.activeIndex &&
      this.activeIndex.i !== primary || (this.activeIndex.i === primary && this.activeIndex.j !== secondary)))) {
      this.selectedCustomField = { primary, secondary };
      this.eventStream.emit(new EmitEvent(Events.SELECTED_CUSTOM_FIELD, { ...customField, primary, secondary }));
    }
    this.activeIndex = { i: primary, j: secondary };
  }

  updateProperties(primary, secondary) {
    this.eventStream.emit(new EmitEvent(Events.UPDATE_CUSTOM_FIELD_PROPERTIES, {
      field: {
        ...this.customFields[primary][secondary], primary, secondary
      }, origin: 'form-editor'
    }));
  }

  allowDrop(event) {
    event.preventDefault();
  }

  showMenus(primary, secondary) {
    this.activeField = { i: primary, j: secondary };
  }

  rearrangeList(event, primary, secondary) {
    event.preventDefault();
    event.stopPropagation();
    const draggedData = event.dataTransfer.getData('draggedData');
    if (draggedData) {
      const data = JSON.parse(draggedData);
      if (data && data.x !== undefined) {
        const draggedElement = this.clonerService.deepClone(this.customFields[data.x][data.y]);
        let swippedElement;
        if (this.customFields[primary] && this.customFields[primary].length >= secondary) {
          swippedElement = this.clonerService.deepClone(this.customFields[primary][secondary]);
          if (draggedElement) {
            if (swippedElement) {
              if (swippedElement.type) {
                // issue when 50 dragged to 100
                this.customFields[primary][secondary] = this.clonerService.deepClone(draggedElement); // swipped
                this.customFields[primary][secondary].meta_data = swippedElement.meta_data;
                this.customFields[data.x][data.y] = this.clonerService.deepClone(swippedElement); // dragged
                this.customFields[data.x][data.y].meta_data = draggedElement.meta_data;
              } else {
                this.customFields[primary][secondary] = draggedElement; // swipped
                this.customFields[primary][secondary].meta_data = swippedElement.meta_data;
                // check length

                if (this.customFields[data.x].length > 1) {
                  const type = data.y === 0 ? this.customFields[data.x][data.y + 1].type : this.customFields[data.x][data.y - 1].type;
                  if (!type) {
                    this.customFields.splice(data.x, 1);
                  } else {
                    this.customFields[data.x].splice(data.y, 1);
                  }
                } else {
                  this.customFields[data.x].splice(data.y, 1);
                }
              }
            }
          }
        }
      }
    } else {
      const type = event.dataTransfer.getData('field-type');
      if (type && type !== 'null') {
        if (primary !== undefined) {
          this.customFields.splice(primary, 0, [{ type, meta_data: { class: WidthClass.WIDTH_100 } }]);
        } else {
          this.customFields.push([{ type, meta_data: { class: WidthClass.WIDTH_100 } }]);
        }
      }
    }
  }

  dragStarted(event, primary, secondary) {
    event.dataTransfer.setData('draggedData', JSON.stringify({ x: primary, y: secondary }));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
