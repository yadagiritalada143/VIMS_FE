import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CostComponentDetailsComponent } from './cost-component-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CostComponentDetailsComponent', () => {
  let component: CostComponentDetailsComponent;
  let fixture: ComponentFixture<CostComponentDetailsComponent>;
  CommonTestingModule.setUpTestBed(CostComponentDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
