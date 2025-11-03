import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CostComponentGroupDetailsComponent } from './cost-component-group-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CostComponentGroupDetailsComponent', () => {
  let component: CostComponentGroupDetailsComponent;
  let fixture: ComponentFixture<CostComponentGroupDetailsComponent>;
  CommonTestingModule.setUpTestBed(CostComponentGroupDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
