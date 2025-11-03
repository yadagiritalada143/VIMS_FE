export const createConditionHtmlString = (conditions: any): string => {
  let conditionHTML = '';
  conditions?.forEach((condition: any) => {
    if (condition?.indent == 0 && condition?.field_operator?.sign == '(') {
      conditionHTML += `<div class='condition-display'> ${condition?.field_operator?.sign} `;
    }
    else if (condition?.indent == 0 && condition?.field_operator?.sign == ')') {
      conditionHTML += ` ${condition?.field_operator?.sign} </div>`;
    }
    else if (condition?.indent == 0 && (condition?.field_operator?.sign == 'OR' || condition?.field_operator?.sign == 'AND' || condition?.field_operator?.sign == 'NOT')) {
      conditionHTML += ` <span> ${condition?.field_operator?.sign} </span> `;
    }
    else {
      if (condition?.field_operator?.sign == 'OR' || condition?.field_operator?.sign == 'AND' || condition?.field_operator?.sign == 'NOT') {
        conditionHTML += ` <span> ${condition?.field_operator?.sign} </span> `;
      }
      else {
        if (condition?.field_config && condition?.field_config?.field?.field_type == 'DROPDOWN') {
          if (condition?.field_config?.config?.nest_value) {
            if (condition?.source_field_meta && condition?.target_field_obj) {
              conditionHTML += ` ${condition?.field_config?.config?.display_name || condition?.field_config?.field?.name} ${condition?.field_operator?.sign} ${condition?.source_field_meta?.name} ${condition?.field_operator?.sign} `;
              conditionHTML += ` ( `;
              condition?.target_field_obj?.forEach((target_value: any, index: number) => {
                conditionHTML += ` ${target_value?.name}`;
                if (condition?.target_field_obj?.length - 1 > index) {
                  conditionHTML += `, `;
                }
              })
              conditionHTML += ` ) `;
            }
            else {
              conditionHTML += ` ${condition?.field_config?.config?.display_name || condition?.field_config?.field?.name} ${condition?.field_operator?.sign} ${condition?.source_field_meta?.name} ${condition?.field_operator?.sign} `;
              condition?.target_field_value?.values?.forEach((target_value: any, index: number) => {
                if(condition?.field_config?.field?.field_type == 'DROPDOWN' || condition?.field_config?.field?.field_type == 'RADIO' || condition?.field_config?.field?.field_type == 'CHECKBOX' || condition?.field_config?.field?.field_type == 'TOGGLE' || condition?.field_config?.field?.field_type == 'PICKLIST') {
                  conditionHTML += ` <p class='text-capitalize d-inline'>${target_value?.toLowerCase()?.replaceAll('_', ' ')} </p> `;
                } else {
                  conditionHTML += ` ${target_value}`;
                }
                if (condition?.target_field_value?.values?.length - 1 > index) {
                  conditionHTML += `, `;
                }
              })
            }
          }
          else {
            conditionHTML += ` ${condition?.field_config?.config?.display_name || condition?.field_config?.field?.name} ${condition?.field_operator?.sign}  `;
            conditionHTML += ` ( `;
            condition?.target_field_obj?.forEach((target_value: any, index: number) => {
              conditionHTML += ` ${target_value?.name}`;
              if (condition?.target_field_obj?.length - 1 > index) {
                conditionHTML += `, `;
              }
            })
            conditionHTML += ` ) `;
          }
        }
        else if (condition?.field_config && condition?.field_config?.field_type != 'DROPDOWN') {
          conditionHTML += ` ${condition?.field_config?.config?.display_name || condition?.field_config?.field?.name} ${condition?.field_operator?.sign} ${condition?.target_field_value?.values[0]} `;
        }
        else {
          conditionHTML += ` ${condition?.field_operator?.sign} `;
        }

      }
    }
  });
  return conditionHTML;
}

export const createRecipientChain = (recipient_types: any, moduleCode:string): string => {
  let recipientHTML = ` <div class='recipient-box'> `;
  if (recipient_types?.recipient_type?.slug == 'managerial_chain') {
    let keys = [];
    if (recipient_types?.metadata) {
      keys = Object.keys(recipient_types?.metadata);
    }
    keys.forEach((key) => {
      if (Array.isArray(recipient_types?.metadata[key]?.input_value)) {
        recipient_types?.metadata[key]?.input_value?.forEach((input_val: any) => {
          recipientHTML += ` ${input_val?.name}(${recipient_types?.recipient_type?.name}) `;
        })
      }
      else {
        recipientHTML += ` + ${recipient_types?.metadata[key]?.input_value} `;
      }
    });
  }
  else {
    let keys = [];
    if (recipient_types?.metadata) {
      keys = Object.keys(recipient_types?.metadata);
    }
    if(recipient_types?.recipient_type?.metadata?.render_parameter_schema == false) {
      if(recipient_types?.recipient_type?.metadata.module_specific_actions && recipient_types?.recipient_type?.metadata.module_specific_actions[moduleCode]?.display_name) {
        recipientHTML += ` ${recipient_types?.recipient_type?.metadata.module_specific_actions[moduleCode]?.display_name} `;
      }else{
        recipientHTML += ` ${recipient_types?.recipient_type?.name} `;
      }
    } else {
      keys.forEach((key) => {
        if (Array.isArray(recipient_types?.metadata[key]?.input_value)) {
          recipient_types?.metadata[key]?.input_value?.forEach((input_val: any) => {
            recipientHTML += ` ${input_val?.name}(${recipient_types?.recipient_type?.name}) `;
          })
        }
        else {
          recipientHTML += ` + ${recipient_types?.metadata[key]?.input_value} `;
        }
      });
    }
  }
  recipientHTML += ' </div> ';
  return recipientHTML;
}
