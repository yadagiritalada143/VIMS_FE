import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculateCostComponentGroupComponent } from './calculate-cost-component-group.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CalculateCostComponentGroupComponent', () => {
  let component: CalculateCostComponentGroupComponent;
  let fixture: ComponentFixture<CalculateCostComponentGroupComponent>;
  CommonTestingModule.setUpTestBed(CalculateCostComponentGroupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CalculateCostComponentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
