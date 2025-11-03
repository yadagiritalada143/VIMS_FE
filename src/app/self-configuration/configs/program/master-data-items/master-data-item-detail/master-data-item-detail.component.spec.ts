import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterDataItemDetailComponent } from './master-data-item-detail.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('MasterDataItemDetailComponent', () => {
  let component: MasterDataItemDetailComponent;
  let fixture: ComponentFixture<MasterDataItemDetailComponent>;
  CommonTestingModule.setUpTestBed(MasterDataItemDetailComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterDataItemDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
