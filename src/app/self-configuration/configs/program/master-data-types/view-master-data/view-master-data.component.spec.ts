import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewMasterDataComponent } from './view-master-data.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewMasterDataComponent', () => {
  let component: ViewMasterDataComponent;
  let fixture: ComponentFixture<ViewMasterDataComponent>;
  CommonTestingModule.setUpTestBed(ViewMasterDataComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMasterDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
