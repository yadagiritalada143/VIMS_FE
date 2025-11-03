import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewMasterDataItemComponent } from './view-master-data-item.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewMasterDataItemComponent', () => {
  let component: ViewMasterDataItemComponent;
  let fixture: ComponentFixture<ViewMasterDataItemComponent>;
  CommonTestingModule.setUpTestBed(ViewMasterDataItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMasterDataItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
