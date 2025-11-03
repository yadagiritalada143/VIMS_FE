import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AdjustmentAndTaxFormsComponent } from './adjustment-and-tax-forms.component';

describe('AdjustmentAndTaxFormsComponent', () => {
  let component: AdjustmentAndTaxFormsComponent;
  let fixture: ComponentFixture<AdjustmentAndTaxFormsComponent>;
  CommonTestingModule.setUpTestBed(AdjustmentAndTaxFormsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdjustmentAndTaxFormsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdjustmentAndTaxFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
