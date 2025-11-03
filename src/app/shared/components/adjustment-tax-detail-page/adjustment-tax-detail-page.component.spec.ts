import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdjustmentTaxDetailPageComponent } from './adjustment-tax-detail-page.component';

describe('AdjustmentTaxDetailPageComponent', () => {
  let component: AdjustmentTaxDetailPageComponent;
  let fixture: ComponentFixture<AdjustmentTaxDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdjustmentTaxDetailPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdjustmentTaxDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
