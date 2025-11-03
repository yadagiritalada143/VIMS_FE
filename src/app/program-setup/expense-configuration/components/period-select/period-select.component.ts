import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { NumCharacters, Period } from '../../enums/period.enums';


@Component({
    selector: 'app-period-select',
    templateUrl: './period-select.component.html',
    styleUrls: ['./period-select.component.scss']
})

export class PeriodSelectComponent implements OnInit {
    @Input() label: string;
    @Input() labelFrom: string;
    @Input() form: UntypedFormGroup;
    @Input() disabled: boolean;
    @Input() readonlySelect: boolean;
    public periodOptions: string[] = [Period.Days, Period.Weeks, Period.Month];

    constructor() { }

    ngOnInit(): void {
        this.form?.get('units')?.valueChanges.subscribe((period: Period) => {
            const value: string = this.form.get('count')?.value?.toString() || null;
            if (value) {
                switch (period) {
                    case Period.Days:
                        this.form.get('count').setValue(value.substring(0, NumCharacters.Days));
                        break;
                    case Period.Weeks:
                        this.form.get('count').setValue(value.substring(0, NumCharacters.Weeks));
                        break;
                    case Period.Month:
                        this.form.get('count').setValue(value.substring(0, NumCharacters.Month));
                        break;
                }
            }
        });

        this.form?.get('count')?.valueChanges.subscribe((value: any) => {
            const stringValue: string = value?.toString();
            const period: string = this.form.get('units')?.value || null;
            let threeCharValue: string;
            switch (period) {
                case Period.Days:
                    if (stringValue?.length > NumCharacters.Days) {
                        threeCharValue = stringValue.substring(0, NumCharacters.Days);
                        this.form.get('count').setValue(threeCharValue);
                    }
                    break;
                case Period.Weeks:
                    if (stringValue?.length > NumCharacters.Weeks) {
                        threeCharValue = stringValue.substring(0, NumCharacters.Weeks);
                        this.form.get('count').setValue(threeCharValue);
                    }
                    break;
                case Period.Month:
                    if (stringValue?.length > NumCharacters.Month) {
                        threeCharValue = stringValue.substring(0, NumCharacters.Month);
                        this.form.get('count').setValue(threeCharValue);
                    }
                    break;
            }
        });
    }
}
