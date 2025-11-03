import {Component, OnInit, Input,Output,EventEmitter} from '@angular/core';

@Component({
  selector: 'app-rules-logic',
  templateUrl: './rules-logic.component.html',
  styleUrls: ['./rules-logic.component.scss']
})
export class RulesLogicComponent implements OnInit {

  @Input() conditionGroup;
  @Input() ruleConfigObj;
  @Input() isEditMode;
  @Input() manageWorkerStatus;
  @Output() ruleLogicData = new EventEmitter();

  selected_item : any = {}
  output_condition = []
  input_condition = []
  constructor() {

  }

  ngOnInit(): void {
    if(this.isEditMode) {

      this.ruleConfigObj?.ruleInputs?.forEach((x,i) => {
        this.addInput(this.conditionGroup.ruleFieldInputConfigs, x?.ruleFieldConfig?.id)
        this.input_condition[i].operator = x?.ruleFieldConfig?.ruleField?.ruleFieldOperator
        this.input_condition[i].selectedOperator = x?.ruleFieldOperator?.id
      })
      this.ruleConfigObj?.ruleOutputs?.forEach(x => {
        this.addOutput(this.conditionGroup.ruleFieldOutputConfigs, x?.ruleFieldConfig?.id)
      })
    } else {
      this.addInput(this.conditionGroup?.ruleFieldInputConfigs)
      this.addOutput(this.conditionGroup?.ruleFieldOutputConfigs)
    }
  }

  addInput(condition_group, selectedField?) {
    let field = []
    let notDependantFields = condition_group?.filter(f => !f?.config?.isDependant)
    let dependantFields =  condition_group?.filter(f => f?.config?.isDependant == true && f?.config?.WorkerStatus?.includes(this.manageWorkerStatus))
    let finalFields = [...(notDependantFields || []), ...(dependantFields || [])]
    for(let i = 0; i < finalFields?.length; i++) {
      field.push({name : condition_group[i]?.name, id : condition_group[i]?.id})
    }
    this.input_condition.push(
      {
        field : field,
        operator : [],
        selectedField : selectedField ? selectedField : null,
        selectedOperator : null
      }
    )
  }

  removeInput(index) {
    this.input_condition.splice(index,1)
    this.getUpdatedRuleLogicData(true)
  }

  addOutput(outputConfigs, selectedField?) {
    this.output_condition.push({
      field : outputConfigs,
      selectedField : selectedField ? selectedField : null
    })
    this.getUpdatedRuleLogicData(true)
  }

  removeOutput(index) {
    this.output_condition.splice(index,1)
    this.getUpdatedRuleLogicData(true)
  }

  getUpdatedRuleLogicData(event, moduleName?,index?) {
    if(moduleName == 'inputField') {
      this.conditionGroup.ruleFieldInputConfigs.forEach(x => {
        if(x.id == event.selectedField) {
          this.input_condition[index].operator = x.ruleField.ruleFieldOperator
        }
      })
    }


    this.selected_item = {}
    let input_condition = []
    let output_condition = []
    input_condition = this.input_condition.map((x) => {return {
      fieldConfigId : x.selectedField ? x.selectedField : null,
      fieldOperatorId : x.selectedOperator ? x.selectedOperator : null
    }})

    output_condition = this.output_condition.map((x) => {return {
      fieldConfigId : x.selectedField ? x.selectedField : null,
    }})

    this.selected_item = {
      input_condition : input_condition,
      output_condition : output_condition
    }
    this.ruleLogicData.emit(this.selected_item)
  }

  mappedValues(value, valueTag) {
    return value?.map(x => x[valueTag]).length > 0 ? value?.map(x => x[valueTag]).filter(y => y) : []
  }

  getDisabledData(currentSelectedField, operatorId) {
    let isDisabledOperator = false
    this.input_condition.forEach(x => {
      if(x.selectedField == currentSelectedField && x.selectedOperator == operatorId) {
        isDisabledOperator = true
      }
    })
    return isDisabledOperator;
  }

}
