import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsColoumnFilterComponent } from './svms-coloumn-filter.component';
import { UntypedFormGroup } from '@angular/forms';

describe('SvmsColoumnFilterComponent', () => {
  let component: SvmsColoumnFilterComponent;
  let fixture: ComponentFixture<SvmsColoumnFilterComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsColoumnFilterComponent);
    component = fixture.componentInstance;
    component.filterFormGroup=new UntypedFormGroup({
    })
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
