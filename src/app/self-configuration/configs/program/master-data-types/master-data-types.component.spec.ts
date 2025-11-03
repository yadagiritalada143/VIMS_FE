import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterDataTypesComponent } from './master-data-types.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('MasterDataTypesComponent', () => {
  let component: MasterDataTypesComponent;
  let fixture: ComponentFixture<MasterDataTypesComponent>;
  CommonTestingModule.setUpTestBed(MasterDataTypesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterDataTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
