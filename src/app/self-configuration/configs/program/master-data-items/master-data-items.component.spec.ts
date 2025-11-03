import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterDataItemsComponent } from './master-data-items.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('MasterDataItemsComponent', () => {
  let component: MasterDataItemsComponent;
  let fixture: ComponentFixture<MasterDataItemsComponent>;
  CommonTestingModule.setUpTestBed(MasterDataItemsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterDataItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
