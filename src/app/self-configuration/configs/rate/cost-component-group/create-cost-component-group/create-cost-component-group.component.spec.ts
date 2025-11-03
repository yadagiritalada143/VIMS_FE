import { ComponentFixture, TestBed } from '@angular/core/testing';
import {  CreateCostComponentGroupComponent } from './create-cost-component-group.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateCostComponentGroupComponent', () => {
  let component: CreateCostComponentGroupComponent;
  let fixture: ComponentFixture<CreateCostComponentGroupComponent>;
  CommonTestingModule.setUpTestBed(CreateCostComponentGroupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCostComponentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
