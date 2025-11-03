import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostComponentComponent } from './cost-component.component';

describe('CostComponentComponent', () => {
  let component: CostComponentComponent;
  let fixture: ComponentFixture<CostComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CostComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
