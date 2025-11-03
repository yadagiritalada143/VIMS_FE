import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CostComponentListComponent } from './cost-component-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CostComponentListComponent', () => {
  let component: CostComponentListComponent;
  let fixture: ComponentFixture<CostComponentListComponent>;
  CommonTestingModule.setUpTestBed(CostComponentListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
