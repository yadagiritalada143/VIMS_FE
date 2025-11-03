import { Injectable } from '@angular/core';
import { TreeviewItem, TreeviewSelection, DefaultTreeviewI18n } from 'ngx-treeview';

@Injectable()
export class DropdownTreeviewSelectI18n extends DefaultTreeviewI18n {
  private internalSelectedItem: TreeviewItem;

  set selectedItem(value: TreeviewItem) {
    this.internalSelectedItem = value;
  }

  get selectedItem(): TreeviewItem {
    return this.internalSelectedItem;
  }
  getText(selection: TreeviewSelection): string {
    if (selection.uncheckedItems.length === 0) {
      if (selection.checkedItems.length > 0) {
        return 'Select Hierarchy';
      } else {
        return 'Select Hierarchy';
      }
    }
    return 'Select Hierarchy';
    // switch (selection.checkedItems.length) {
    //   case 0:
    //     return 'Select Hierarchy';
    //   case 1:
    //     return selection.checkedItems[0].text;
    //   default:
    //     let a  = "";
    //     selection.checkedItems.forEach(element => {
    //       a+=element.text +", "

    //     });
    //     return `${a}`;

    // }
  }

}
