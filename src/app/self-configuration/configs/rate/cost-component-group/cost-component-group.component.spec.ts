import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  CostComponentGroupComponent } from './cost-component-group.component';

describe('CostComponentGroupComponent', () => {
  let component: CostComponentGroupComponent;
  let fixture: ComponentFixture<CostComponentGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostComponentGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
